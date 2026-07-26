#!/usr/bin/env node
/**
 * One-time: copy the live setup out of $HOME into the repo payload, applying every
 * exclusion in the manifest. Copy only — never moves or deletes anything in $HOME.
 * `beast install` is the separate, explicit step that swaps in symlinks.
 *
 *   node scripts/bootstrap.mjs [--force]
 *
 * Staging is not decoration. Two hazards force it:
 *
 *   1. After `beast install`, the $HOME sources ARE symlinks into this payload.
 *      Deleting the payload first (the old --force behaviour) destroyed the very
 *      content the copy was about to read, leaving the payload empty.
 *   2. A secret found by the post-copy scan had already been written into the
 *      repo, and exiting did not take it back out.
 *
 * So: copy into <dest>.staging, scan every staged tree, and only then swap. A
 * rejected run leaves the existing payload byte-for-byte untouched.
 */
import { cpSync, existsSync, mkdirSync, rmSync, renameSync, statSync, readFileSync, realpathSync } from 'node:fs'
import { join, basename, sep, dirname } from 'node:path'
import {
  SOURCES, EXCLUDE_SKILLS, EXCLUDE_PROMPTS, EXCLUDE_PATHS, EXCLUDE_FILES, SECRET_PATTERNS,
  inHome, inPayload, PAYLOAD, REPO, HOME,
} from '../lib/manifest.mjs'
import { isJunk, tilde, c, walk } from '../lib/fsutil.mjs'
import { normalizePayload, countDuplicates } from '../lib/normalize.mjs'
import { scanFile } from '../lib/secrets.mjs'
import { scrubTree, reportScrub } from '../lib/scrub.mjs'

const force = process.argv.includes('--force')

/**
 * Staging lives OUTSIDE the payload, not as a `<dest>.staging` sibling. With
 * dereference:true the source resolves to `home/claude/BEAST.v2.md`, and a sibling
 * named `home/claude/BEAST.v2.md.staging` string-prefixes it — Node's cpSync
 * containment check then decides the destination is inside the source and fails
 * with ERR_FS_EISDIR. A separate root has no prefix relationship with anything.
 */
const STAGE_ROOT = join(REPO, '.bootstrap-staging')

if (existsSync(PAYLOAD) && !force) {
  const populated = Object.keys(SOURCES).some((rel) => existsSync(inPayload(rel)))
  if (populated) {
    console.error(c.red('payload already populated — pass --force to refresh it'))
    process.exit(1)
  }
}

const skipped = []

/** Decide whether a source path makes it into the payload. */
function keep(src, destRel) {
  const name = basename(src)
  if (isJunk(name)) return false
  if (EXCLUDE_FILES.includes(name)) { skipped.push(['private file', name]); return false }

  const parts = destRel.split(sep)

  // private packs, in either the active set or the library
  if (parts[0] === 'agents' && EXCLUDE_SKILLS.includes(parts[2])) {
    skipped.push(['private pack', destRel]); return false
  }
  // product-coupled prompts
  if (destRel.startsWith(join('codex', 'prompts')) && EXCLUDE_PROMPTS.includes(name)) {
    skipped.push(['private prompt', name]); return false
  }
  // assets with terms against redistribution
  const modRel = parts.slice(2).join('/')
  if (EXCLUDE_PATHS.some((p) => modRel === p || modRel.startsWith(p + '/'))) {
    skipped.push(['non-redistributable', modRel]); return false
  }
  return true
}

const discardStaging = () => rmSync(STAGE_ROOT, { recursive: true, force: true })

/**
 * True when `p` resolves inside any of `roots`.
 *
 * Two roots are legitimate, not one. After `beast install` the $HOME sources ARE
 * symlinks into the payload, so a child of ~/.agents/skills resolves into the REPO and
 * not into the source root. Checking only the source root rejected every correctly
 * linked skill and cut the payload from 1084 files to 10.
 *
 * Anything resolving outside both is an escape: `skill-modules/x/private -> ~/.ssh`
 * copied that tree in with exit 0 and no scanner hit, because the scanner knows only a
 * short pattern list and skips large files.
 */
function containedIn(p, roots) {
  let real
  try { real = realpathSync(p) } catch { return false }
  return roots.some((r) => r && (real === r || real.startsWith(r + sep)))
}

const repoReal = (() => { try { return realpathSync(REPO) } catch { return REPO } })()

// ---------------------------------------------------------------------------
// 1. copy into staging
// ---------------------------------------------------------------------------
console.log(c.bold(`staging into ${tilde(PAYLOAD)}\n`))

discardStaging()           // never inherit a partial run
const staged = []          // [stagePath, finalPath]
for (const [payloadRel, homeRel] of Object.entries(SOURCES)) {
  const src = inHome(homeRel)
  const final = inPayload(payloadRel)
  const stage = join(STAGE_ROOT, payloadRel)

  if (!existsSync(src)) { console.log(`  ${c.yellow('absent')} ${tilde(src)}`); continue }

  mkdirSync(dirname(stage), { recursive: true })
  let srcReal
  try { srcReal = realpathSync(src) } catch { srcReal = src }

  // `recursive: true` even for single files. cpSync with dereference:true on a
  // symlink source refuses with ERR_FS_EISDIR ("cannot copy a directory") unless
  // recursive is set — regardless of what statSync says the target is. Since
  // `beast install` turns every source in $HOME into a symlink, that is the
  // normal case here, not an edge case. The filter short-circuits on s === src,
  // so it is safe for a file source too.
  cpSync(src, stage, {
    recursive: true,
    dereference: true,
    filter: (s) => {
      if (s === src) return true
      // Skip broken symlinks. With dereference:true cpSync stats the target and
      // throws ENOENT on a dangling link, killing the whole run. $HOME accumulates
      // these legitimately — deactivating a skill leaves an orphaned mirror link —
      // so one stale link must not be able to block a bootstrap.
      if (!existsSync(s)) { skipped.push(['broken symlink', s.replace(HOME, '~')]); return false }
      // Containment. dereference:true follows nested symlinks without checking where
      // they land, so `skill-modules/x/private -> ~/.ssh` copies that tree into the
      // payload. Verified: content outside the source tree reached home/ with exit 0
      // and no scanner hit, because the scanner only knows a short pattern list. The
      // resolved path must stay inside the resolved source root.
      if (!containedIn(s, [srcReal, repoReal])) {
        skipped.push(['escapes source tree', s.replace(HOME, '~')])
        return false
      }
      return keep(s, join(payloadRel, s.slice(src.length + 1)))
    },
  })
  staged.push([stage, final])
  console.log(`  ${c.green('staged')} ${payloadRel}`)
}

if (!staged.length) {
  console.error(c.red('\nnothing staged — no sources found'))
  process.exit(1)
}

// ---------------------------------------------------------------------------
// 2. scrub staged content, then scan it
// ---------------------------------------------------------------------------
const scrub = { files: 0, paths: 0, lines: 0 }
for (const [stage] of staged) {
  const r = scrubTree(stage)
  scrub.files += r.files; scrub.paths += r.paths; scrub.lines += r.lines
}

// ---------------------------------------------------------------------------
//    scan staging — a secret here must never reach the payload
// ---------------------------------------------------------------------------
const leaks = []
let unscannable = 0
for (const [stage] of staged) {
  for (const [abs, rel] of walk(stage)) {
    const r = scanFile(abs)
    if (!r.scanned) { unscannable++; continue }
    for (const label of r.hits) leaks.push([label, join(stage.slice(STAGE_ROOT.length + 1), rel)])
  }
}
if (unscannable) console.log(c.yellow(`  ${unscannable} staged file(s) could not be scanned for secrets`))

if (leaks.length) {
  console.log()
  for (const [label, rel] of leaks) console.log(`  ${c.red('SECRET')} ${label} in ${rel}`)
  discardStaging()
  console.error(c.red(`\nrejected ${leaks.length} secret(s). Staging discarded; the payload was not modified.`))
  console.error('Remove the secret from the source in $HOME, then re-run.')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// 3. swap staging into place
// ---------------------------------------------------------------------------
for (const [stage, final] of staged) {
  const old = final + '.previous'
  rmSync(old, { recursive: true, force: true })
  if (existsSync(final)) renameSync(final, old)
  renameSync(stage, final)
  rmSync(old, { recursive: true, force: true })
}
discardStaging()

// bootstrap dereferences, so an active entry that was a view onto the library comes
// back as a second real copy. Re-establish the one-copy invariant every time.
normalizePayload()
reportScrub(scrub)

console.log()
const groups = skipped.reduce((a, [k]) => ({ ...a, [k]: (a[k] ?? 0) + 1 }), {})
for (const [k, n] of Object.entries(groups)) console.log(`  ${c.dim(`excluded ${n} × ${k}`)}`)
console.log(`\n${c.green('✓')} payload ready — next: ${c.bold('beast install --dry-run')}`)
