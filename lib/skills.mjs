import { existsSync, readFileSync, mkdirSync, unlinkSync, renameSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'
import { SKILL_CAP, SKILL_MIRROR_PATHS, inHome, inPayload } from './manifest.mjs'
import { entries, skillEntries, tilde, c, lstat } from './fsutil.mjs'
import { symlinkType, wantsAbsoluteInternalLinks } from './platform.mjs'

const ACTIVE = 'agents/skills'
const LIBRARY = 'agents/skill-modules'

const truncate = (s, n = 72) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

/**
 * First `description:` value from SKILL.md frontmatter, for the list view.
 * Handles YAML block scalars (`description: >` or `|`), where the text lives on
 * the following indented lines rather than after the colon.
 */
export function describe(dir) {
  let md
  try { md = readFileSync(join(dir, 'SKILL.md'), 'utf8') } catch { return '' }

  const lines = md.split('\n')
  const i = lines.findIndex((l) => /^description:/.test(l))
  if (i === -1) return ''

  const inline = lines[i].slice('description:'.length).trim()
  if (inline && !/^[>|][-+]?$/.test(inline)) {
    return truncate(inline.replace(/^["']|["']$/g, ''))
  }

  // Block scalar: take the indented continuation lines.
  const body = []
  for (const l of lines.slice(i + 1)) {
    if (!/^\s+\S/.test(l)) break
    body.push(l.trim())
  }
  return truncate(body.join(' '))
}

export function list() {
  const active = skillEntries(inPayload(ACTIVE)).map((e) => e.name).sort()
  const library = skillEntries(inPayload(LIBRARY)).map((e) => e.name).sort()
  const inactive = library.filter((n) => !active.includes(n))

  const over = active.length > SKILL_CAP
  const count = `${active.length}/${SKILL_CAP}`
  console.log(c.bold(`Active (${over ? c.red(count) : count})`))
  for (const n of active) console.log(`  ${n.padEnd(24)} ${c.dim(describe(inPayload(join(ACTIVE, n))))}`)
  console.log(c.dim(`\n${inactive.length} more in the library — beast skills add <name>`))
  return over ? 1 : 0
}

export function add(name) {
  const src = inPayload(join(LIBRARY, name))
  const dst = inPayload(join(ACTIVE, name))
  if (!existsSync(src)) return err(`no module named ${name}`)
  if (existsSync(dst)) return err(`${name} is already active`)

  const active = skillEntries(inPayload(ACTIVE)).length
  if (active >= SKILL_CAP) {
    return err(`at the ${SKILL_CAP}-skill cap — remove one first (beast skills rm <name>)`)
  }

  // The active set is a view onto the library. POSIX gets a relative link so the
  // repo stays portable. Windows junctions cannot be relative — they store an
  // absolute target — so a Windows clone bakes in its own path and needs
  // `beast skills` re-run if the repo moves. Relative dir symlinks would avoid
  // that but require Developer Mode, which is a worse trade for an installer.
  mkdirSync(inPayload(ACTIVE), { recursive: true })
  const target = wantsAbsoluteInternalLinks ? src : join('..', 'skill-modules', name)
  symlinkSync(target, dst, symlinkType(src))
  console.log(`${c.green('activated')} ${name}`)
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
