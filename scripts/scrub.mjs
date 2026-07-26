#!/usr/bin/env node
/**
 * Apply SCRUB_REWRITES and SCRUB_LINE_PATTERNS to the payload in place.
 *
 * `bootstrap` already runs this step on staged content, which is what makes the rules
 * durable — a hand edit to the payload is reverted the next time $HOME is re-read. But
 * bootstrap re-derives everything from $HOME, and after adding a rule that is a much
 * bigger hammer than the job needs. This applies the same step to what is already here.
 *
 * Idempotent, and safe to run any number of times: every rule is a rewrite whose output
 * no longer matches its own pattern. `beast doctor` fails while any rule still matches,
 * so a forgotten run is caught rather than shipped.
 *
 *   node scripts/scrub.mjs
 */
import { PAYLOAD } from '../lib/manifest.mjs'
import { scrubTree, reportScrub } from '../lib/scrub.mjs'
import { c, tilde } from '../lib/fsutil.mjs'

const r = scrubTree(PAYLOAD)
console.log(`${c.bold('scrub')} ${tilde(PAYLOAD)}`)
if (r.files) reportScrub(r)
else console.log(`  ${c.dim('nothing to change — every rule already applied')}`)
console.log(`\n${c.green('✓')} next: ${c.bold('beast doctor')}`)
