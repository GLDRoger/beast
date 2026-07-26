import { openSync, readSync, closeSync, statSync } from 'node:fs'
import { SECRET_PATTERNS } from './manifest.mjs'

/**
 * Secret scanning that does not give up on big files.
 *
 * Every scanner previously skipped anything over 2 MB, so a 9 MiB file containing a
 * valid `ghp_` token passed the payload scan, the staging scan, and the index scan
 * without a single failure. "Secrets never reach git" was false for patterns the
 * manifest explicitly knows about.
 *
 * Large files are read in chunks instead. Chunks overlap by OVERLAP bytes so a token
 * straddling a boundary is still matched; without that, splitting at any point inside a
 * 40-character token hides it from both halves.
 */
const CHUNK = 1 << 20        // 1 MiB
const OVERLAP = 256          // longer than the longest pattern we look for

/** Longest match any pattern could make, used to size the overlap safely. */
const longestPossible = () => 256

export function scanText(text, patterns = SECRET_PATTERNS) {
  const hits = []
  for (const [re, label] of patterns) if (re.test(text)) hits.push(label)
  return hits
}

/**
 * @returns {{hits: string[], scanned: boolean, bytes: number}}
 * `scanned: false` means the file could not be read at all, which callers should treat
 * as unknown rather than clean.
 */
export function scanFile(path, patterns = SECRET_PATTERNS) {
  let st
  try { st = statSync(path) } catch { return { hits: [], scanned: false, bytes: 0 } }

  // walk() yields a symlink-to-directory as a file, because readdirSync reports it as
  // not-a-directory. There are no bytes to scan, and the real content is reached through
  // the library tree anyway, so this is "nothing here", not "could not verify".
  if (st.isDirectory()) return { hits: [], scanned: true, bytes: 0, directory: true }
  const size = st.size

  let fd
  try { fd = openSync(path, 'r') } catch { return { hits: [], scanned: false, bytes: size } }

  const found = new Set()
  try {
    const buf = Buffer.allocUnsafe(CHUNK)
    let pos = 0
    let carry = ''
    while (pos < size) {
      const n = readSync(fd, buf, 0, Math.min(CHUNK, size - pos), pos)
      if (n <= 0) break
      // Decode as utf8 and prepend the tail of the previous chunk. A multi-byte
      // character split across the boundary can mis-decode, which is acceptable: the
      // patterns are all ASCII, so a mangled non-ASCII glyph cannot hide one.
      const text = carry + buf.subarray(0, n).toString('utf8')
      for (const label of scanText(text, patterns)) found.add(label)
      carry = text.slice(-Math.min(OVERLAP, longestPossible()))
      pos += n
    }
  } catch {
    return { hits: [...found], scanned: false, bytes: size }
  } finally {
    try { closeSync(fd) } catch { /* already gone */ }
  }
  return { hits: [...found], scanned: true, bytes: size }
}
