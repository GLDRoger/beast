import { existsSync, lstatSync, readlinkSync, readdirSync, mkdirSync, renameSync, unlinkSync, symlinkSync, realpathSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { EXCLUDE_ALWAYS, EXCLUDE_EXT, BACKUP_ROOT } from './manifest.mjs'
import { HOME, symlinkType } from './platform.mjs'

export const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
}

// HOME comes from os.homedir(), not process.env.HOME — the latter is undefined
// on Windows, which made this silently search for the literal string "undefined".
export const tilde = (p) => (HOME ? p.replace(HOME, '~') : p)

/** lstat that returns null instead of throwing, so callers can branch on presence. */
export const lstat = (p) => {
  try { return lstatSync(p) } catch { return null }
}

/** True when p is a symlink already resolving to target. */
export const linksTo = (p, target) => {
  const st = lstat(p)
  if (!st?.isSymbolicLink()) return false
  try { return readlinkSync(p) === target } catch { return false }
}

export const isJunk = (name) =>
  EXCLUDE_ALWAYS.includes(name) || EXCLUDE_EXT.some((e) => name.endsWith(e))

/** Recursively yield [absPath, relPath] for real files, skipping junk. */
export function* walk(root, rel = '') {
  let entries
  try { entries = readdirSync(join(root, rel), { withFileTypes: true }) } catch { return }
  for (const e of entries) {
    if (isJunk(e.name)) continue
    const r = rel ? join(rel, e.name) : e.name
    if (e.isDirectory()) yield* walk(root, r)
    else yield [join(root, r), r]
  }
}

/**
 * Point `link` at `target`. Idempotent. Anything real already sitting there is
 * moved aside to <path>.pre-beast rather than deleted — this runs against a live
 * $HOME and losing hand-edited config would be unrecoverable.
 */
/**
 * Collapse a payload-internal symlink to the real file it names.
 *
 * The active set is a view onto the library, so `agents/skills/design-eng` is a
 * relative link to `../skill-modules/design-eng`. Linking $HOME at the view would
 * build a two-hop chain that is tedious to debug and breaks if the view moves.
 * Resolving here keeps every link in $HOME one hop from real content.
 */
export const resolveTarget = (p) => {
  try { return realpathSync(p) } catch { return p }
}

export function linkFile(link, target, { dryRun = false, skipIfReal = false } = {}) {
  if (!existsSync(target)) return { status: 'missing-source', link, target }
  target = resolveTarget(target)
  if (linksTo(link, target)) return { status: 'ok', link, target }

  const st = lstat(link)
  let backup = null
  if (st) {
    if (st.isSymbolicLink()) {
      // unlink, not rm: rmSync on a symlink-to-directory throws EISDIR.
      if (!dryRun) unlinkSync(link)
    } else if (skipIfReal) {
      // A real directory already here may hold files the payload deliberately
      // omits (assets we cannot redistribute). Linking over it would silently
      // delete them from a working setup, so leave it alone and say so.
      return { status: 'kept-local', link, target }
    } else {
      // Mirror the $HOME-relative path under BACKUP_ROOT rather than appending a
      // suffix in place — a sibling of a skill dir gets picked up as a skill.
      backup = join(BACKUP_ROOT, relative(HOME, link))
      if (existsSync(backup)) return { status: 'backup-exists', link, target, backup }
      if (!dryRun) {
        mkdirSync(dirname(backup), { recursive: true })
        renameSync(link, backup)
      }
    }
  }
  if (!dryRun) {
    mkdirSync(dirname(link), { recursive: true })
    // The type argument is ignored on POSIX but decides success on Windows:
    // directories need 'junction' (no elevation required), files need 'file'.
    try {
      symlinkSync(target, link, symlinkType(target))
    } catch (err) {
      // Do not abort the run. On Windows without Developer Mode every FILE link
      // throws EPERM while directory junctions succeed — letting the first throw
      // escape meant the policy files took the whole install down before any
      // skill was linked. Record it and keep going so the report is complete.
      if (backup) {
        try { renameSync(backup, link) } catch { /* leave the backup in place */ }
      }
      return { status: 'failed', link, target, error: err.code ?? err.message }
    }
  }
  return { status: backup ? 'linked-with-backup' : 'linked', link, target, backup }
}

/** Directory entries, non-recursive, junk filtered. */
export const entries = (dir) => {
  try { return readdirSync(dir, { withFileTypes: true }).filter((e) => !isJunk(e.name)) } catch { return [] }
}

/**
 * Entries that are actually skills. A skill is a directory holding SKILL.md —
 * so this drops loose docs like README.md and any dot-prefixed tool-owned dir.
 * Every caller must agree on what counts, or the cap and the link set diverge.
 */
export const skillEntries = (dir) =>
  entries(dir).filter((e) => !e.name.startsWith('.') && (e.isDirectory() || e.isSymbolicLink()))
