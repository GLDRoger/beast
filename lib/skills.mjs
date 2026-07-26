import { existsSync, mkdirSync, unlinkSync, renameSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'
import { SKILL_MIRROR_PATHS, inHome, inPayload } from './manifest.mjs'
import { entries, skillEntries, tilde, c, lstat } from './fsutil.mjs'
import { symlinkType, wantsAbsoluteInternalLinks } from './platform.mjs'
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
  const active = skillEntries(inPayload(ACTIVE)).map((e) => e.name).sort()
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
  console.log(c.dim(`\n${inactive.length} more in the library — beast skills add <name>`))
  return over ? 1 : 0
}

export function add(name) {
  const src = inPayload(join(LIBRARY, name))
  const dst = inPayload(join(ACTIVE, name))
  if (!existsSync(src)) return err(`no module named ${name}`)
  if (existsSync(dst)) return err(`${name} is already active`)

  // Measured before the link so the warning below can quote the real cost. Not a
  // refusal: the old code blocked the 31st skill on a count that Claude Code does not
  // enforce, which stopped people activating a 90-char router while a 807-char one
  // stayed put. The budget is characters, it is shared with plugins beast cannot see,
  // and the user can raise it — so this reports and proceeds.
  const { settings } = claudeSettings()
  const budget = listingBudget(settings)
  const maxDesc = maxDescChars(settings)
  const before = skillEntries(inPayload(ACTIVE)).map((e) => e.name)
  const cost = entryCost(src, name, maxDesc)
  const after = listingChars([...activeCost(before, maxDesc), cost])

  // The active set is a view onto the library. POSIX gets a relative link so the
  // repo stays portable. Windows junctions cannot be relative — they store an
  // absolute target — so a Windows clone bakes in its own path and needs
  // `beast skills` re-run if the repo moves. Relative dir symlinks would avoid
  // that but require Developer Mode, which is a worse trade for an installer.
  mkdirSync(inPayload(ACTIVE), { recursive: true })
  const target = wantsAbsoluteInternalLinks ? src : join('..', 'skill-modules', name)
  symlinkSync(target, dst, symlinkType(src))
  console.log(`${c.green('activated')} ${name} ${c.dim(`(+${cost.chars} listing chars)`)}`)
  if (after > budget.chars) {
    // beast's own set only. Plugins and unmanaged skills share the same budget, so this
    // is a floor, not the total — `beast scan` is what measures everything that loads.
    console.log(c.yellow(`  beast's active set alone is now ${commas(after)} chars of a ${budgetSpan(budget)}-char budget.`))
    console.log(c.dim('  Claude Code shortens the least-used descriptions to fit. `beast scan` lists the levers.'))
  }
  console.log(c.dim('run `beast install` to link it into the tools'))
  return 0
}

export function rm(name) {
  const dst = inPayload(join(ACTIVE, name))
  const st = lstat(dst)
  if (!st) return err(`${name} is not active`)

  // Every path computed before the first mutation. A type error or bad join here used
  // to surface midway through and leave the payload and $HOME disagreeing.
  const mirrors = [...SKILL_MIRROR_PATHS, '.agents/skills'].map((d) => join(inHome(d), name))

  if (st.isSymbolicLink()) {
    unlinkSync(dst)
  } else {
    // A real directory in the active set is the ONLY copy — the nine routers
    // (route, frontend, code, writing, motion, performance, security, growth,
    // media) exist here and nowhere in the library. Refusing outright made them
    // permanently undeactivatable, so move it into the library instead. Nothing
    // is deleted and `beast skills add <name>` puts it back.
    const lib = inPayload(join(LIBRARY, name))
    if (existsSync(lib)) {
      return err(`${name} is a real dir in the active set but ${LIBRARY}/${name} already exists — resolve by hand`)
    }
    renameSync(dst, lib)
    console.log(c.dim(`  moved into the library: ${LIBRARY}/${name}`))
  }
  console.log(`${c.green('deactivated')} ${name}`)

  // SKILL_MIRROR_PATHS, not SKILL_MIRRORS: the latter is {home, target} objects and
  // passing one to join() throws ERR_INVALID_ARG_TYPE. That crash landed AFTER the
  // payload had already been mutated, leaving the skill unlinked from the active set
  // but still linked into every harness. Paths are resolved before any mutation now.
  for (const dir of [...SKILL_MIRROR_PATHS, '.agents/skills']) {
    const link = join(inHome(dir), name)
    if (lstat(link)?.isSymbolicLink()) { unlinkSync(link); console.log(c.dim(`  unlinked ${tilde(link)}`)) }
  }
  return 0
}

const err = (m) => { console.error(c.red(m)); return 1 }
