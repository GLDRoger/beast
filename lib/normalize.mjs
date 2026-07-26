import { existsSync, readdirSync, rmSync, renameSync, symlinkSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { createHash } from 'node:crypto'
import { inPayload, BACKUP_ROOT, HOME } from './manifest.mjs'
import { skillEntries, c, walk } from './fsutil.mjs'
import { symlinkType, wantsAbsoluteInternalLinks } from './platform.mjs'

const ACTIVE = 'agents/skills'
const LIBRARY = 'agents/skill-modules'

const treeHash = (dir) => {
  const h = createHash('sha256')
  for (const [abs, rel] of walk(dir)) {
    h.update(rel)
    try { h.update(readFileSync(abs)) } catch { /* unreadable, ignore */ }
  }
  return h.digest('hex')
}

const fileCount = (dir) => [...walk(dir)].length

/**
 * Enforce the payload invariant: every skill exists exactly once, and the active
 * set is a view (symlink) onto the library.
 *
 * This has to run after every bootstrap, not just once. bootstrap dereferences its
 * sources, so an active entry that was a link to the library comes back as a second
 * real copy — re-duplicating whatever a previous normalize collapsed. Making this a
 * step rather than a one-off is the only way the invariant survives a re-extract.
 *
 * When the two copies differ, the one with more files wins. That is not arbitrary:
 * the active set tracks upstream refreshes (`hyperframes skills update` writes
 * there), so it is the newer revision. The loser is moved under BACKUP_ROOT, never
 * deleted, because "more files" is a heuristic and the caller may disagree.
 */
export function normalizePayload({ quiet = false } = {}) {
  const active = inPayload(ACTIVE)
  const library = inPayload(LIBRARY)
  if (!existsSync(active) || !existsSync(library)) return { collapsed: [], promoted: [] }

  const collapsed = []
  const promoted = []

  for (const e of skillEntries(active)) {
    const a = join(active, e.name)
    const m = join(library, e.name)
    if (e.isSymbolicLink()) continue                    // already a view
    if (!existsSync(m)) continue                        // library has no copy; leave it real

    if (treeHash(a) === treeHash(m)) {
      rmSync(a, { recursive: true, force: true })
      collapsed.push(e.name)
    } else {
      const winner = fileCount(a) >= fileCount(m) ? a : m
      const loser = winner === a ? m : a
      // Never clobber an earlier backup. The old code rmSync'd it first, so a second
      // differing duplicate destroyed the only remaining copy of the first one.
      let backup = join(BACKUP_ROOT, 'dedup', `${e.name}-superseded`)
      for (let i = 2; existsSync(backup); i++) {
        backup = join(BACKUP_ROOT, 'dedup', `${e.name}-superseded-${i}`)
      }
      mkdirSync(join(backup, '..'), { recursive: true })
      renameSync(loser, backup)
      if (winner === a) renameSync(a, m)                // promote the active copy
      promoted.push(e.name)
    }

    const target = wantsAbsoluteInternalLinks ? m : join('..', 'skill-modules', e.name)
    symlinkSync(target, a, symlinkType(m))
  }

  if (!quiet && (collapsed.length || promoted.length)) {
    console.log(`  ${c.dim(`normalized: ${collapsed.length} collapsed, ${promoted.length} promoted (superseded copies under ${relative(HOME, BACKUP_ROOT) || BACKUP_ROOT})`)}`)
  }
  return { collapsed, promoted }
}

/** Count skills present as real dirs in both trees — must be 0 after normalize. */
export function countDuplicates() {
  const real = (d) => {
    try {
      return readdirSync(d, { withFileTypes: true })
        .filter((e) => e.isDirectory() && !e.isSymbolicLink())
        .map((e) => e.name)
    } catch { return [] }
  }
  const a = new Set(real(inPayload(ACTIVE)))
  return real(inPayload(LIBRARY)).filter((n) => a.has(n)).length
}
