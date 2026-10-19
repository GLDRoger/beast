import { join } from 'node:path'
import { workflowEntries } from './skill-paths.mjs'
import { inPayload } from './manifest.mjs'
import { skillEntries, c } from './fsutil.mjs'
import {
  frontmatter, entryCost, listingChars, listingBudget, claudeSettings, maxDescChars,
  budgetSpan, commas,
} from './listing.mjs'

const ACTIVE = 'agents/skills'
const LIBRARY = 'agents/skill-modules'

const truncate = (s, n = 72) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

/**
 * What the active set costs in Claude Code's skill listing, entry by entry.
 * One frontmatter read per skill, shared by the cost and the shown description.
 */
function activeCost(names, maxDesc) {
  return names.map((n) => {
    const dir = inPayload(join(ACTIVE, n))
    const fm = frontmatter(dir)
    return { name: n, desc: truncate(fm.description ?? ''), ...entryCost(dir, n, maxDesc, fm) }
  })
}

export function list() {
  const active = workflowEntries(inPayload(ACTIVE)).map((e) => e.name).sort()
  const library = skillEntries(inPayload(LIBRARY)).map((e) => e.name).sort()
  const inactive = library.filter((n) => !active.includes(n))

  const { settings } = claudeSettings()
  const budget = listingBudget(settings)
  const rows = activeCost(active, maxDescChars(settings))
  const chars = listingChars(rows)
  const over = chars > budget.chars

  // Characters, because that is the unit Claude Code caps. The budget is shared with
  // plugins and any unmanaged skill, so this number is beast's share of it, not the
  // whole picture — `beast scan` is what shows the rest.
  const cost = `${commas(chars)}/${budgetSpan(budget)} listing chars`
  console.log(c.bold(`Active (${active.length} skills, ${over ? c.red(cost) : cost})`))
  console.log(c.dim('Plugin and unmanaged skills spend the same budget — beast scan measures all of it.'))
  for (const r of rows.sort((a, b) => b.chars - a.chars)) {
    console.log(`  ${String(r.chars).padStart(4)}  ${r.name.padEnd(24)} ${c.dim(r.desc)}`)
  }
  console.log(c.dim(`\n${inactive.length} optional modules in the library — beast install --packs=…`))
  return over ? 1 : 0
}

// Workflows are the fixed discovery surface. Optional modules are selected by pack,
// never promoted into it (including through the old add/rm CLI).
export function add(name) {
  return err(`${name}: top-level discovery is reserved for the eight workflows; use beast install --packs=… for optional modules`)
}

export function rm(name) {
  return err(`${name}: the eight workflows are required; use beast install --packs=… to select optional modules`)
}

const err = (m) => { console.error(c.red(m)); return 1 }
