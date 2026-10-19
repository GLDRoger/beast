import { existsSync, readlinkSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import {
  FILES, TREES, SKILL_MIRRORS, SKILL_MIRROR_PATHS, EXAMPLES, SHELL_SNIPPETS,
  HARNESS_NAMES, inHome, inPayload, PAYLOAD, wanted, SELECTION_FILE, GENERATED_MARKER,
} from './manifest.mjs'
import { linkFile, entries, skillEntries, tilde, c, writeGenerated, underRepo } from './fsutil.mjs'
import { IS_WINDOWS } from './platform.mjs'
import { packSkills, REQUIRED_PACKS, PACK_NAMES } from './packs.mjs'
import { coverageWarning } from './coverage.mjs'
import { writeDelegation } from './delegation.mjs'
import { writeSoul } from './hermes.mjs'
import { writeGeminiPrompts, writeGeminiConfig } from './gemini.mjs'
import { scanSummary } from './scan.mjs'
import { writeConfigEdits, describeEdits, EDITABLE } from './config-write.mjs'

/**
 * Every $HOME directory this tool ever puts a link in, derived from the manifest.
 *
 * Hardcoding this list is how `.codex/scripts` got left out of the orphan scan while
 * the pruner included it: two lists, one drifted. There is one list now.
 */
const linkDirs = () => [
  ...new Set([
    ...SKILL_MIRROR_PATHS,
    ...TREES.map((t) => t.home),
  ]),
]

/**
 * Retire beast-owned links that this selection no longer calls for.
 *
 * Previously this only removed BROKEN links, which meant narrowing a selection retired
 * nothing: the payload still exists, so a link from a dropped pack still resolves and
 * survived the sweep. Verified — after `install --all` then
 * `install --packs=core --harness=codex`, all 93 module links and 27 Claude skill links
 * were still in place while selection.json claimed codex/core.
 *
 * `expected` is the exact set of link paths this run created, so anything of ours
 * outside it is stale by definition, whether it resolves or not. Links pointing
 * anywhere but the repo are never touched.
 */
function retireStale(expected, { dryRun = false } = {}) {
  const removed = []
  for (const dir of linkDirs()) {
    for (const e of entries(inHome(dir))) {
      if (!e.isSymbolicLink()) continue
      const p = join(inHome(dir), e.name)
      let dest
      try { dest = readlinkSync(p) } catch { continue }
      // Ownership needs a real path boundary, not a string prefix: with the repo at
      // /code/beast a user's own link into /code/beast-user passed `startsWith` and
      // got deleted here without a backup.
      if (!underRepo(dest)) continue             // not ours to retire
      if (expected.has(p)) continue              // still wanted
      if (!dryRun) { try { unlinkSync(p) } catch { continue } }
      removed.push(p)
    }
  }
  return removed
}

/**
 * Create every symlink the selection calls for. Idempotent.
 *
 * `targets` are harness names; `packs` are skill pack names. Both default to
 * everything, so a bare `beast install` behaves as it always did.
 */
export function install({
  dryRun = false,
  targets = HARNESS_NAMES,
  packs = PACK_NAMES,
  writeConfig = false,
} = {}) {
  if (!existsSync(PAYLOAD)) {
    console.error(c.red(`payload missing: ${tilde(PAYLOAD)}`))
    console.error(`run ${c.bold('node scripts/bootstrap.mjs')} first to populate it from this machine`)
    return 1
  }

  // core is the dispatch layer — a pack without it installs skills nothing routes to.
  const chosen = [...new Set([...REQUIRED_PACKS, ...packs])]
  const allowed = new Set(packSkills(chosen))

  const results = []
  const expected = new Set()
  const add = (r) => { results.push(r); if (r.link) expected.add(r.link); return r }

  for (const f of FILES.filter((f) => wanted(f, targets))) {
    add(linkFile(inHome(f.home), inPayload(f.payload), { dryRun }))
  }

  for (const t of TREES.filter((t) => wanted(t, targets))) {
    const list = t.skills ? skillEntries : entries
    for (const e of list(inPayload(t.payload))) {
      // Pack selection gates the skill trees only. Prompts and scripts are not
      // skills and are not pack-scoped.
      if (t.skills && !allowed.has(e.name)) continue
      add(linkFile(join(inHome(t.home), e.name), join(inPayload(t.payload), e.name), { dryRun, skipIfReal: t.skipIfReal }))
    }
  }

  // Each harness discovers skills from its own path, so mirror the active set into
  // every selected one, pointed straight at the repo.
  for (const m of SKILL_MIRRORS.filter((m) => wanted(m, targets))) {
    for (const e of skillEntries(inPayload('agents/skills'))) {
      if (!allowed.has(e.name)) continue
      add(linkFile(join(inHome(m.home), e.name), join(inPayload('agents/skills'), e.name), { dryRun }))
    }
  }

  for (const s of SHELL_SNIPPETS) add(linkFile(inHome(s.home), inPayload(s.payload), { dryRun }))

  const pruned = retireStale(expected, { dryRun })

  // Generated state is load-bearing, not advisory. selection.json is how doctor tells a
  // deliberately-omitted skill from a broken one, and delegation.md is the only file that
  // tells an agent which CLIs it can actually reach. This used to be wrapped in a
  // `catch {}` that also discarded writeGenerated's own {ok:false}, so a permission error
  // or a directory in the way produced a clean "✓ installed" over stale routing.
  const generated = dryRun ? [] : [
    writeGenerated(SELECTION_FILE, JSON.stringify(
      { generatedBy: GENERATED_MARKER, targets, packs: chosen }, null, 2)),
    writeDelegation(targets),
    // Hermes's SOUL.md is assembled from the codex payloads, so it is written
    // after the links exist and only when the harness is in the selection.
    ...(targets.includes('hermes') ? [writeSoul()] : []),
    ...(targets.includes('gemini') ? writeGeminiPrompts() : []),
    ...(writeConfig && targets.includes('gemini') ? writeGeminiConfig() : []),
  ]

  // Config edits run last, after every link exists. The keys point at files this run
  // creates — codex refuses to load a config whose model_instructions_file resolves to
  // nothing — so planning this any earlier would either skip the keys or write a
  // pointer into thin air.
  const configEdits = writeConfig
    ? writeConfigEdits({ targets: targets.filter((t) => EDITABLE.includes(t)), dryRun })
    : []

  report(results, dryRun, pruned, generated, { targets, packs: chosen, configEdits, writeConfig })

  const linkFailed = results.some((r) => ['missing-source', 'backup-exists', 'failed'].includes(r.status))
  return linkFailed || generated.some((g) => !g.ok) ? 1 : 0
}

function report(results, dryRun, pruned, generated, { targets, packs, configEdits = [], writeConfig = false }) {
  const by = (s) => results.filter((r) => r.status === s)
  const linked = [...by('linked'), ...by('linked-with-backup')]
  const verb = dryRun ? 'would link' : 'linked'

  console.log(c.dim(`harnesses: ${targets.join(', ')}  ·  packs: ${packs.join(', ')}`))
  console.log(`${c.green('✓')} ${by('ok').length} already correct, ${verb} ${linked.length}`)

  if (pruned.length) {
    console.log(`  ${c.yellow(`retired ${pruned.length} link(s)`)} no longer in the selection`)
    for (const p of pruned.slice(0, 5)) console.log(`    ${tilde(p)}`)
    if (pruned.length > 5) console.log(`    ${c.dim(`… and ${pruned.length - 5} more`)}`)
  }

  const kept = by('kept-local')
  if (kept.length) console.log(`  ${c.dim(`${kept.length} local dirs left as-is (not overwritten)`)}`)

  for (const g of generated) {
    if (g.backup) console.log(`  ${c.yellow('moved aside')} ${tilde(g.backup)}`)
    if (!g.ok) console.log(`  ${c.red('could not write generated state')} — ${g.reason}`)
  }

  for (const r of by('linked-with-backup')) console.log(`  ${c.yellow('moved aside')} ${tilde(r.backup)}`)
  for (const r of by('backup-exists')) {
    console.log(`  ${c.red('skipped')} ${tilde(r.link)} — ${tilde(r.backup)} exists, resolve by hand`)
  }
  for (const r of by('missing-source')) console.log(`  ${c.red('no source')} ${tilde(r.target)}`)

  const failed = by('failed')
  if (failed.length) {
    console.log(`\n${c.red(`${failed.length} link(s) failed`)} — the rest of the install completed:`)
    for (const r of failed.slice(0, 8)) console.log(`  ${r.error}  ${tilde(r.link)}`)
    if (failed.length > 8) console.log(`  ${c.dim(`… and ${failed.length - 8} more`)}`)
    if (IS_WINDOWS && failed.some((r) => r.error === 'EPERM')) {
      console.log(`\n${c.yellow('Windows:')} file symlinks need Developer Mode or an elevated shell.`)
      console.log('  Settings → System → For developers → Developer Mode, then re-run.')
      console.log(c.dim('  Directory links are junctions and need no elevation, so skills should already be linked.'))
    }
  }

  // A partial selection installs routers whose lookup tables point at modules that
  // are not there. Not fatal — the tables are advisory — but shipping a router with a
  // mostly-dead menu without saying so is the kind of silence that wastes an afternoon.
  const cov = coverageWarning(packs)
  if (cov) {
    console.log(`\n${c.yellow('incomplete selection')} — ${cov.total} module reference(s) in the installed skills will not resolve:`)
    for (const [pack, mods] of cov.byPack) {
      console.log(`  ${String(mods.length).padStart(3)} from ${c.bold(pack)}  ${c.dim(mods.slice(0, 4).join(', ') + (mods.length > 4 ? ', …' : ''))}`)
    }
    console.log(c.dim(`  the routers' module tables stay listed but those entries are dead — add the packs above to fix`))
  }

  if (configEdits.length) {
    const paint = { ok: c.green, warn: c.yellow, dim: c.dim }
    console.log(`\n${c.bold(dryRun ? 'Harness config (dry run)' : 'Harness config')} ${c.dim('— only the keys beast needs; everything else is left alone')}`)
    for (const line of describeEdits(configEdits, { dryRun })) {
      console.log(`  ${line.level === 'ok' ? c.green('·') : line.level === 'warn' ? c.yellow('!') : ' '} ${paint[line.level](line.text)}`)
    }
  }

  // Still worth naming the examples: the writer adds a handful of keys, while these
  // carry the safety posture, MCP patterns, and everything else worth reading.
  const pending = EXAMPLES.filter((e) => wanted(e, targets) && !existsSync(inHome(e.home)))
  if (pending.length) {
    console.log(`\n${c.bold('Config not written')} (these hold your own state — merge by hand):`)
    for (const e of pending) console.log(`  ${tilde(inPayload(e.payload))} → ${tilde(inHome(e.home))}`)
  } else if (writeConfig && configEdits.some((r) => r.status === 'written')) {
    console.log(c.dim(`  the annotated examples under ${tilde(inPayload(''))} carry the rest — merge what you want`))
  }

  // Point at scan only when it has something to say. An unconditional "run beast scan"
  // on a clean machine teaches people to ignore the suggestion.
  if (!dryRun) {
    const sum = scanSummary()
    if (sum?.worthReporting) {
      console.log(`\n${c.yellow('Other skills are loading on this machine.')} ${sum.line}`)
      console.log(`  ${c.bold('beast scan')} lists each source and how to retire it.`)
    }
  }

  if (!dryRun) {
    console.log(`\n${c.bold('Add the entry points to your shell profile')} if not already there:`)
    if (IS_WINDOWS) console.log(`  . "$HOME\\.beast\\beast.ps1"   ${c.dim('# add to $PROFILE')}`)
    else console.log(`  source ${tilde(inHome('.beast/beast.zsh'))}   ${c.dim('# add to ~/.zshrc')}`)
  }
}
