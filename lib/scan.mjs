import { execFileSync } from 'node:child_process'
import { SKILL_CAP, inPayload } from './manifest.mjs'
import { c, tilde, skillEntries } from './fsutil.mjs'
import { whichBinary } from './platform.mjs'
import { checkSkillHygiene } from './checks/skills.mjs'

/**
 * `beast scan` — everything on this machine that spends a skill budget, and what to do
 * about each source.
 *
 * doctor reports the same counts, but buried among link and config checks and without
 * any way to act on them. This exists because "you are over the cap" is not useful
 * until you know which of four different mechanisms is contributing and what command
 * retires it.
 *
 * Tone matters here: a private pack a user keeps deliberately is not a defect. Every
 * section says what the thing costs and how to retire it, then stops. No scolding, and
 * no recommendation to remove something whose purpose we cannot see.
 */

/** Real always-on token cost from the harness itself, when it can tell us. */
function pluginCost(id) {
  try {
    const out = execFileSync('claude', ['plugin', 'details', id], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    return out.match(/Always-on:\s*~?([\d,]+)\s*tok/)?.[1] ?? null
  } catch { return null }
}

const libraryNames = () => {
  try { return new Set(skillEntries(inPayload('agents/skill-modules')).map((e) => e.name)) }
  catch { return new Set() }
}

export function scan() {
  // Reuse the hygiene check rather than re-walking: two enumerations would drift, and
  // doctor's numbers must match scan's or one of them is lying.
  const res = checkSkillHygiene({ fail: () => {}, warn: () => {}, info: () => {} })
  const inv = res.inventory
  const haveClaude = Boolean(whichBinary('claude'))

  console.log(`\n${c.bold('beast scan')} — what is spending your skill budget\n`)

  const over = res.loaded > SKILL_CAP
  console.log(
    `  ${over ? c.red(`${res.loaded}`) : c.green(`${res.loaded}`)} skills load into Claude Code ` +
    `(cap ${SKILL_CAP}), of which ${c.bold(String(inv.managedNames.length))} are beast's.`,
  )
  if (res.total !== res.loaded) {
    console.log(c.dim(`  ${res.total} are discoverable; the difference is cached plugins whose plugin is off.`))
  }
  console.log()

  let actions = 0

  // --- plugins --------------------------------------------------------------
  if (inv.plugins.length) {
    console.log(c.bold('  Claude Code plugins'))
    const lib = libraryNames()
    for (const p of inv.plugins) {
      const cost = haveClaude ? pluginCost(p.id) : null
      const state = p.flagged ? c.dim('disabled') : c.yellow('enabled')
      console.log(
        `    ${p.id}  ${c.dim(`${p.count} skill${p.count === 1 ? '' : 's'}`)}  ${state}` +
        (cost ? `  ${c.dim(`~${cost} tok always-on`)}` : ''),
      )
      console.log(c.dim(`      ${p.names.join(', ')}`))
      // A plugin skill sharing a name with something in beast's library is a genuine
      // overlap. Anything looser than a name match would be a guess.
      const clash = p.names.filter((n) => lib.has(n))
      if (clash.length) console.log(`      ${c.yellow('also in beast\'s library:')} ${clash.join(', ')}`)
      if (!p.flagged) {
        console.log(`      retire with:  ${c.bold(`claude plugin disable ${p.id}`)}`)
        actions++
      }
    }
    console.log()
  }

  // --- Codex's own set ------------------------------------------------------
  if (inv.system.length) {
    console.log(c.bold('  Codex system skills'))
    console.log(c.dim(`    ${inv.system.join(', ')}`))
    console.log(c.dim('    Shipped by the Codex CLI, not by beast. They spend Codex\'s context budget'))
    console.log(c.dim('    but not Claude Code\'s, so they are outside the cap above.'))
    console.log('    disable one by adding to ~/.codex/config.toml:')
    console.log(c.dim('      [[skills.config]]'))
    console.log(c.dim(`      path = "~/.codex/skills/.system/${inv.system[0]}/SKILL.md"`))
    console.log(c.dim('      enabled = false'))
    console.log()
  }

  // --- unmanaged ------------------------------------------------------------
  if (inv.foreign.length) {
    console.log(c.bold('  Skills beast does not manage'))
    for (const f of inv.foreign) {
      const real = f.places.find((p) => p.kind === 'real directory')
      console.log(`    ${f.name}  ${c.dim(real ? `content in ${real.dirs.join(', ')}` : f.places[0]?.kind ?? '')}`)
    }
    console.log(c.dim('    These are yours. beast leaves them in place and never touches them.'))
    console.log(c.dim('    To retire one, move it out of the skill directories:'))
    console.log(c.dim(`      mv ~/.agents/skill-modules/${inv.foreign[0].name} ~/.beast/pre-beast/`))
    console.log()
  }

  // --- name collisions ------------------------------------------------------
  if (inv.duplicates.length) {
    console.log(c.bold('  Same name from more than one place'))
    for (const d of inv.duplicates) {
      console.log(`    ${c.yellow(d.name)}`)
      for (const p of d.paths) console.log(c.dim(`      ${tilde(p)}`))
    }
    console.log(c.dim('    Which one wins is not defined. Retire all but one.'))
    console.log()
  }

  // --- bottom line ----------------------------------------------------------
  // Name the lever that actually applies. Telling someone to disable plugins when every
  // plugin is already off, or to trim skills when a plugin is the thing over budget,
  // is the kind of advice that gets a tool ignored.
  const lever = actions
    ? `disable the enabled plugin(s) above, or run ${c.bold('beast skills rm <name>')}`
    : `run ${c.bold('beast skills rm <name>')}, or drop a pack with ${c.bold('beast install --packs=…')}`

  if (over) {
    console.log(`  ${c.red(`Over the cap by ${res.loaded - SKILL_CAP}.`)} To get back under, ${lever}.`)
  } else if (res.loaded > SKILL_CAP - 3) {
    const slack = SKILL_CAP - res.loaded
    console.log(`  ${c.yellow(`${res.loaded}/${SKILL_CAP}.`)} ${slack} slot${slack === 1 ? '' : 's'} free.`)
    if (inv.plugins.some((p) => p.flagged)) {
      const wouldAdd = inv.plugins.filter((p) => p.flagged).reduce((n, p) => n + p.count, 0)
      console.log(c.dim(`  Re-enabling the disabled plugin(s) would add ${wouldAdd}, putting you at ${res.total}/${SKILL_CAP}.`))
    }
  } else {
    console.log(`  ${c.green('Within budget.')} ${SKILL_CAP - res.loaded} slots free.`)
  }
  if (!actions && !inv.duplicates.length && !over) {
    // Deliberately not "nothing else is loading": the unmanaged section above may have
    // listed private packs that are loading and are meant to.
    console.log(c.dim('  No action needed.'))
  }
  console.log()
  return over ? 1 : 0
}

/**
 * Cheap summary for install to decide whether pointing at `beast scan` is worth the line.
 * No `claude plugin details` shelling here: install must not get slower for a hint.
 */
export function scanSummary() {
  let res
  try { res = checkSkillHygiene({ fail: () => {}, warn: () => {}, info: () => {} }) } catch { return null }
  const inv = res.inventory
  const enabledPlugins = inv.plugins.filter((p) => !p.flagged)
  const over = res.loaded > SKILL_CAP
  const worthReporting = over || enabledPlugins.length > 0 || inv.duplicates.length > 0 || inv.foreign.length > 0

  const parts = []
  if (enabledPlugins.length) parts.push(`${enabledPlugins.reduce((n, p) => n + p.count, 0)} from plugins`)
  if (inv.foreign.length) parts.push(`${inv.foreign.length} unmanaged`)
  if (inv.duplicates.length) parts.push(`${inv.duplicates.length} duplicated`)
  if (inv.system.length) parts.push(`${inv.system.length} Codex system`)

  return {
    worthReporting,
    over,
    line: `${res.loaded}/${SKILL_CAP} loaded${parts.length ? `; ${parts.join(', ')}` : ''}.`,
  }
}
