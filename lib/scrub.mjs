import { readFileSync, writeFileSync, statSync } from 'node:fs'
import { extname } from 'node:path'
import { SCRUB_REWRITES, SCRUB_LINE_PATTERNS, SCRUB_EXT } from './manifest.mjs'
import { walk, c } from './fsutil.mjs'

/**
 * Rewrite author-specific paths and drop lines referencing excluded private packs.
 *
 * Runs on STAGED content during bootstrap, so the guarantee survives a re-extract.
 * A manual pass over the payload does not: bootstrap re-reads $HOME and overwrites it.
 */
export function scrubTree(root) {
  let files = 0, paths = 0, lines = 0
  for (const [abs] of walk(root)) {
    if (!SCRUB_EXT.includes(extname(abs))) continue
    try { if (statSync(abs).size > 2_000_000) continue } catch { continue }
    let text
    try { text = readFileSync(abs, 'utf8') } catch { continue }
    const before = text

    for (const [re, to] of SCRUB_REWRITES) {
      const hits = text.match(re)
      if (hits) { paths += hits.length; text = text.replace(re, to) }
    }

    if (SCRUB_LINE_PATTERNS.some((re) => re.test(text))) {
      const kept = text.split('\n').filter((l) => {
        const hit = SCRUB_LINE_PATTERNS.some((re) => re.test(l))
        if (hit) lines++
        return !hit
      })
      text = kept.join('\n')
    }

    if (text !== before) { writeFileSync(abs, text); files++ }
  }
  return { files, paths, lines }
}

export function reportScrub(r) {
  if (r.files) console.log(`  ${c.dim(`scrubbed ${r.files} files: ${r.paths} author paths, ${r.lines} private-pack lines`)}`)
}
