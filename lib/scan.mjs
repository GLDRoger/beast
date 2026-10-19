import { execFileSync } from 'node:child_process'
import { inPayload } from './manifest.mjs'
import { c, tilde, skillEntries } from './fsutil.mjs'
import { whichBinary } from './platform.mjs'
import { checkSkillHygiene } from './checks/skills.mjs'
import { budgetOrigin, budgetSpan, raiseLever, commas } from './listing.mjs'

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

  // Characters, because that is what Claude Code caps. A count cannot tell you that one
  // skill costs what five others do.
  const lst = res.listing
  const over = lst.over
  const spent = `${commas(lst.chars)} of ${budgetSpan(lst.budgetInfo)}`
  const paint = over ? c.red : lst.tight || lst.pct >= 85 ? c.yellow : c.green
  console.log(
    `  ${res.loaded} skills load into Claude Code, spending ` +
    `${paint(spent)} listing characters.`,
  )
  console.log(
    `  ${c.bold(String(inv.managedNames.length))} are beast's, costing ${commas(lst.beastChars)}.`,
  )
  console.log(c.dim(`  Budget ${budgetOrigin(lst.budgetInfo)}.`))
  console.log(c.dim('  Over budget nothing disappears: Claude Code cuts descriptions down to bare names,'))
  console.log(c.dim('  ranked by how much you use each skill, so an unused one loses its description first.'))
  if (res.total !== res.loaded) {
    console.log(c.dim(`  ${res.total} are discoverable; the difference is cached plugins whose plugin is off.`))
  }
  console.log()

  let actions = 0

  // --- per-skill cost -------------------------------------------------------
  // The section that makes the budget actionable: one long description can cost what
  // five terse skills cost, and no count ever showed that. Ranked across every source,
  // so beast's own entries are judged on the same scale as a plugin's.
  if (lst.rows.length) {
    const TOP = 12
    console.log(c.bold('  What each entry costs'))
    for (const r of lst.rows.slice(0, TOP)) {
      const src = r.managed ? '' : c.dim(r.plugin ? `  ${r.plugin}` : '  unmanaged')
      console.log(`    ${String(r.chars).padStart(5)}  ${r.name}${src}`)
    }
    const rest = lst.rows.slice(TOP)
    if (rest.length) {
      console.log(c.dim(`    ${commas(rest.reduce((n, r) => n + r.chars, 0)).padStart(5)}  ${rest.length} more`))
    }
    console.log(c.dim('    Shorten a description in its SKILL.md frontmatter to buy budget back.'))
    console.log()
  }

  // --- plugins --------------------------------------------------------------
  if (inv.plugins.length) {
    console.log(c.bold('  Claude Code plugins'))
    const lib = libraryNames()
    for (const p of inv.plugins) {
      const cost = haveClaude ? pluginCost(p.id) : null
      const state = p.flagged ? c.dim('disabled') : c.yellow('enabled')
      console.log(
        `    ${p.id}  ${c.dim(`${p.count} skill${p.count === 1 ? '' : 's'}, ${commas(p.chars)} listing chars`)}  ${state}` +
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
    console.log(c.dim('    but not Claude Code\'s, so they are outside the budget above.'))
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
  // Name the levers that actually apply. Telling someone to disable plugins when every
  // plugin is already off, or to trim skills when a plugin is the thing over budget,
  // is the kind of advice that gets a tool ignored.
  //
  // Raising the budget is listed first and is not a workaround: the default reserves 1%
  // of the context window for the listing, and spending a second percent is usually a
  // better trade than losing the descriptions the routers dispatch on.
  const free = commas(Math.max(0, lst.budget - lst.chars))

  if (over || lst.tight) {
    const gap = over
      ? `Over budget by ${commas(lst.chars - lst.budgetHigh)} chars on any model.`
      : `Over by ${commas(lst.chars - lst.budget)} chars on a current model, inside the budget on an older one.`
    console.log(`  ${(over ? c.red : c.yellow)(gap)} Any one of these settles it:`)
    console.log(`    more budget        ${c.bold(raiseLever(lst.budgetInfo, lst.chars))}`)
    if (actions) console.log(`    drop a plugin      ${c.bold('claude plugin disable <id>')} for an enabled one above`)
    console.log('    shorten a skill    edit description: in the SKILL.md of the entries listed above')
  } else if (lst.pct >= 85) {
    console.log(`  ${c.yellow(`${lst.pct}% of the tightest budget spent.`)} ${free} chars free.`)
  } else {
    console.log(`  ${c.green('Within budget on any model.')} ${free} chars free at the tightest.`)
  }
  const off = inv.plugins.filter((p) => p.flagged)
  if (off.length) {
    // Approximate on purpose: a disabled plugin sharing a name with something already
    // loaded adds nothing, so this is a ceiling.
    console.log(c.dim(`  Re-enabling the disabled plugin(s) would add up to ${commas(off.reduce((n, p) => n + p.chars, 0))} chars.`))
  }
  if (!actions && !inv.duplicates.length && !over && !lst.tight && lst.pct < 85) {
    // Deliberately not "nothing else is loading": the unmanaged section above may have
    // listed private packs that are loading and are meant to.
    console.log(c.dim('  No action needed.'))
  }
  console.log()
  // Exit 1 only for the certain case, matching doctor: a listing that fits on an older
  // model but not a current one is a warning, and scripting against it should not break.
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
  const over = res.listing.over
  const worthReporting = over || res.listing.tight ||
    enabledPlugins.length > 0 || inv.duplicates.length > 0 || inv.foreign.length > 0

  const parts = []
  if (enabledPlugins.length) parts.push(`${enabledPlugins.reduce((n, p) => n + p.count, 0)} from plugins`)
  if (inv.foreign.length) parts.push(`${inv.foreign.length} unmanaged`)
  if (inv.duplicates.length) parts.push(`${inv.duplicates.length} duplicated`)
  if (inv.system.length) parts.push(`${inv.system.length} Codex system`)

  return {
    worthReporting,
    over,
    line: `${res.loaded} skills, ${commas(res.listing.chars)}/${budgetSpan(res.listing.budgetInfo)} listing chars` +
      `${parts.length ? `; ${parts.join(', ')}` : ''}.`,
  }
}
