import { existsSync, readlinkSync, unlinkSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  FILES, TREES, SKILL_MIRRORS, SKILL_MIRROR_PATHS, EXAMPLES, SHELL_SNIPPETS,
  HARNESS_NAMES, inHome, inPayload, PAYLOAD, REPO, wanted, SELECTION_FILE,
} from './manifest.mjs'
import { linkFile, entries, skillEntries, tilde, c } from './fsutil.mjs'
import { IS_WINDOWS } from './platform.mjs'
import { packSkills, REQUIRED_PACKS, PACK_NAMES } from './packs.mjs'
import { coverageWarning } from './coverage.mjs'
import { writeDelegation } from './delegation.mjs'
import { scanSummary } from './scan.mjs'

/**
 * Remove links in $HOME that point into this repo but no longer resolve.
 *
 * install owns the link set, so it owns retiring links too. Dropping a skill — or
 * deselecting a pack — otherwise leaves a dangling mirror behind: invisible to the
 * link checks (they iterate the payload, not $HOME) and enough on its own to break
 * the next bootstrap. Only broken links whose target is inside REPO are touched.
 */
function pruneOrphans({ dryRun = false } = {}) {
  const removed = []
  const dirs = [...SKILL_MIRROR_PATHS, '.agents/skills', '.agents/skill-modules', '.codex/prompts', '.codex/scripts']
  for (const dir of dirs) {
    for (const e of entries(inHome(dir))) {
      if (!e.isSymbolicLink()) continue
      const p = join(inHome(dir), e.name)
      let dest
      try { dest = readlinkSync(p) } catch { continue }
      if (!dest.startsWith(REPO)) continue          // not ours to touch
      if (existsSync(p)) continue                   // resolves fine
      if (!dryRun) unlinkSync(p)
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
  const add = (r) => { results.push(r); return r }

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

  const pruned = pruneOrphans({ dryRun })

  if (!dryRun) {
    // Record the intent so doctor can judge absence correctly.
    try {
      mkdirSync(join(inHome('.beast')), { recursive: true })
      writeFileSync(SELECTION_FILE, JSON.stringify({ targets, packs: chosen }, null, 2) + '\n')
      // The policy files assume all three CLIs exist. Tell the agent which actually do.
      writeDelegation(targets)
    } catch { /* advisory only — never fail an install over it */ }
  }

  report(results, dryRun, pruned, { targets, packs: chosen })
  return results.some((r) => ['missing-source', 'backup-exists', 'failed'].includes(r.status)) ? 1 : 0
}

function report(results, dryRun, pruned, { targets, packs }) {
  const by = (s) => results.filter((r) => r.status === s)
  const linked = [...by('linked'), ...by('linked-with-backup')]
  const verb = dryRun ? 'would link' : 'linked'

  console.log(c.dim(`harnesses: ${targets.join(', ')}  ·  packs: ${packs.join(', ')}`))
  console.log(`${c.green('✓')} ${by('ok').length} already correct, ${verb} ${linked.length}`)

  if (pruned.length) {
    console.log(`  ${c.yellow(`pruned ${pruned.length} orphaned link(s)`)} no longer in the selection`)
    for (const p of pruned.slice(0, 5)) console.log(`    ${tilde(p)}`)
    if (pruned.length > 5) console.log(`    ${c.dim(`… and ${pruned.length - 5} more`)}`)
  }

  const kept = by('kept-local')
  if (kept.length) console.log(`  ${c.dim(`${kept.length} local dirs left as-is (not overwritten)`)}`)

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

  const pending = EXAMPLES.filter((e) => wanted(e, targets) && !existsSync(inHome(e.home)))
  if (pending.length) {
    console.log(`\n${c.bold('Config not written')} (these hold your own state — merge by hand):`)
    for (const e of pending) console.log(`  ${tilde(inPayload(e.payload))} → ${tilde(inHome(e.home))}`)
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
