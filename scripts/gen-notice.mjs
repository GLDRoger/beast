#!/usr/bin/env node
/**
 * Generate NOTICE.md from the payload, cross-referenced against
 * manifest/skills.lock.json.
 *
 * Direction matters. Iterating only the lockfile answers "where did the recorded
 * installs go?" and silently ignores the question that actually blocks publishing:
 * "does every shipped module have provenance?" It does not — 35 modules ship with
 * no lockfile entry at all. So this walks the PAYLOAD first and reports anything
 * it cannot attribute, then walks the lockfile to report stale records.
 *
 * Exit code is 1 while any shipped module is unattributed, so this doubles as a
 * pre-publication gate rather than a document generator that always succeeds.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { REPO, PAYLOAD, LOCK_RENAMES, PROVENANCE, OWN_SKILLS, SCRUB_EXT } from '../lib/manifest.mjs'
import { c, skillEntries, walk } from '../lib/fsutil.mjs'

/** `--strict` is the publication gate; without it this only regenerates the document. */
const strict = process.argv.includes('--strict')

const lock = JSON.parse(readFileSync(join(REPO, 'manifest/skills.lock.json'), 'utf8'))
const LOCK = Object.entries(lock.skills ?? {})

/** lockfile keys are display names ("Agent Browser"); on-disk dirs are slugs. */
const slugify = (n) => n.toLowerCase().replace(/[^a-z0-9-]+/g, '-')
// Apply the rename map first: the lockfile key is the name at install time, which
// for several skills is not the directory that shipped.
const bySlug = new Map(LOCK.map(([name, meta]) => {
  const slug = LOCK_RENAMES[name] ?? slugify(name)
  return [slug, { name, ...meta }]
}))

const shipped = {
  'agents/skills': skillEntries(join(PAYLOAD, 'agents/skills')).map((e) => e.name),
  'agents/skill-modules': skillEntries(join(PAYLOAD, 'agents/skill-modules')).map((e) => e.name),
}

const OWN = OWN_SKILLS

// --- forward: every shipped module needs provenance -------------------------
const attributed = new Map()   // upstream -> { url, skills[] }
const unattributed = []

// Count each distinct skill once. An active entry that mirrors a library module is
// the same skill seen twice, and the nine originals are ours — neither is a gap.
const seen = new Set()
for (const [tree, names] of Object.entries(shipped)) {
  for (const name of names) {
    if (seen.has(name)) continue
    seen.add(name)
    if (OWN.includes(name)) continue                         // original to this project

    // lockfile (renames applied) first, then the traced PROVENANCE table for
    // upstreams the lockfile never recorded.
    const lock = bySlug.get(name.toLowerCase())
    const traced = PROVENANCE[name]
    if (!lock && !traced) { unattributed.push(`${tree}/${name}`); continue }

    const key = traced?.source ?? lock.source ?? 'unknown'
    const url = traced?.url ?? lock?.sourceUrl
    if (!attributed.has(key)) attributed.set(key, { url, skills: new Map() })
    attributed.get(key).skills.set(name, traced ?? {})
  }
}

// --- reverse: lockfile records with nothing on disk -------------------------
const stale = LOCK
  .filter(([name]) => {
    // Apply the rename map here as well as in the forward pass. Without it a renamed
    // skill was reported BOTH as unattributed and as a stale lockfile entry: one skill
    // counted as two separate faults.
    const slug = LOCK_RENAMES[name] ?? slugify(name)
    return !Object.keys(shipped).some((t) => existsSync(join(PAYLOAD, t, slug)))
  })
  .map(([name, meta]) => ({ name, source: meta.source }))

// --- derived gaps -----------------------------------------------------------
// These were four hardcoded prose bullets, and three of them had gone stale: the
// `design-eng` gap was closed by a rename, `talking-head-recut` IS in the lockfile, and
// the four unfilled Apache stubs left with the four skills that were dropped. A generated
// attribution file asserting things that are not true is worse than one saying nothing,
// so every claim below is computed from the payload each run.

/**
 * A skill whose SKILL.md points at license text it does not ship.
 * Keyed by `name:file` — the active set is a view onto the library, so every such skill
 * is found twice and would otherwise be reported twice.
 */
const declaredMissingSet = new Map()
for (const [tree, names] of Object.entries(shipped)) {
  for (const name of names) {
    let head
    try {
      head = readFileSync(join(PAYLOAD, tree, name, 'SKILL.md'), 'utf8').split('\n').slice(0, 12).join('\n')
    } catch { continue }
    for (const m of head.matchAll(/\b(NOTICE\.md|LICENSE(?:\.txt|\.md)?)\b/g)) {
      if (!existsSync(join(PAYLOAD, tree, name, m[1]))) declaredMissingSet.set(`${name}:${m[1]}`, [name, m[1]])
    }
  }
}
const declaredMissing = [...declaredMissingSet.values()].sort()

/** Apache-2.0 appendix text left as a template — a license naming no copyright holder. */
const APACHE_STUB = /Copyright \[yyyy\]|\[name of copyright owner\]/
const apacheStubs = []
for (const [abs, rel] of walk(PAYLOAD)) {
  if (!SCRUB_EXT.includes(rel.slice(rel.lastIndexOf('.')))) continue
  let text
  try { text = readFileSync(abs, 'utf8') } catch { continue }
  if (APACHE_STUB.test(text)) apacheStubs.push(rel)
}

/** Upstreams whose redistribution grant was traced but not established. */
const unresolved = Object.entries(PROVENANCE)
  .filter(([name, meta]) => meta.unresolved && seen.has(name))
  .map(([name, meta]) => ({ name, source: meta.source, license: meta.license }))

// --- render ----------------------------------------------------------------
const lines = [
  '# NOTICE',
  '',
  'Generated by `npm run notice` from the payload and `manifest/skills.lock.json`.',
  'Do not edit by hand.',
  '',
  "beast's own code (`bin/`, `lib/`, `scripts/`) is MIT — see LICENSE.",
  'The skills below are **other people\'s work, vendored into this repository**, and',
  'each retains its own upstream license.',
  '',
  `Original to this project: ${OWN.map((s) => `\`${s}\``).join(', ')}.`,
  '',
  '**Attribution is recorded here, not inside the skill files.** These skills are being',
  'rewritten and will diverge from what their original authors published, so stamping a',
  'name into each file would misrepresent both sides. This file is the record.',
  '',
  'If your work is here and you want it removed or credited differently, open an issue.',
  '',
]

if (unattributed.length) {
  lines.push(
    '## ⚠️ Unattributed — publication blocker',
    '',
    `${unattributed.length} shipped modules have no entry in the lockfile, so their origin`,
    'and license are unknown. These must be traced or removed before any public release.',
    '',
    ...unattributed.sort().map((s) => `- ${s}`),
    '',
  )
}

lines.push('## Attributed upstreams', '')
for (const [source, { url, skills }] of [...attributed].sort()) {
  const holder = [...skills.values()].find((v) => v.holder)?.holder
  const license = [...skills.values()].find((v) => v.license)?.license
  lines.push(`### ${source}`, '')
  if (url) lines.push(`<${url}>`, '')
  if (license) lines.push(`License: ${license}${holder ? ` — © ${holder}` : ''}`, '')
  for (const [name, meta] of [...skills].sort()) {
    const tags = [meta.derived && 'substantially rewritten', meta.unresolved && '**grant unresolved**']
      .filter(Boolean).join(', ')
    lines.push(`- ${name}${tags ? ` (${tags})` : ''}`)
  }
  lines.push('')
}

// Naming a license is not shipping one. Apache-2.0 section 4(a) requires a copy of the
// license to travel with every redistribution, and nothing carried that text before.
const texts = [...new Set(Object.values(PROVENANCE).map((m) => m.licenseText).filter(Boolean))].sort()
const missingTexts = texts.filter((t) => !existsSync(join(REPO, t)))
lines.push(
  '## Full license texts',
  '',
  'Naming a license is not the same as shipping one. Apache-2.0 section 4(a) requires a copy',
  'of the license to travel with any redistribution, so the texts live in the repository:',
  '',
  ...texts.map((t) => `- [\`${t}\`](${t})`),
  '',
  'See [`licenses/README.md`](licenses/README.md) for which upstream each one covers.',
  '',
)

lines.push(
  '## Deliberately not vendored',
  '',
  'Two asset classes are excluded because their terms forbid redistribution.',
  'Skills that referenced them still work; supply the assets locally.',
  '',
  '- `gsap.min.js` (GreenSock Standard License) — install from npm or a CDN.',
  '- Cyberpunk 2077 fankit font and logos (CD Projekt Red IP, non-commercial only).',
  '',
)

if (unresolved.length) {
  lines.push(
    '## ⚠️ Unresolved redistribution grants — publication blocker',
    '',
    'Traced to an upstream, but the upstream does not clearly grant redistribution. Public',
    'or npm release is **not cleared** until each of these is settled — by obtaining a',
    'grant, rewriting the content, or dropping the skill. `npm run notice -- --strict`',
    'exits non-zero while any remain.',
    '',
    ...unresolved.map((u) => `- \`${u.name}\` — ${u.source} (${u.license})`),
    '',
  )
}

if (declaredMissing.length || apacheStubs.length) {
  lines.push('## Known attribution gaps', '')
  for (const [name, file] of declaredMissing) {
    lines.push(`- \`${name}\` declares \`${file}\` in its frontmatter but ships no such file.`)
  }
  for (const rel of apacheStubs) {
    lines.push(`- \`${rel}\` carries an unfilled Apache-2.0 stub, naming no copyright holder.`)
  }
  lines.push('')
}

if (stale.length) {
  lines.push(
    '## Stale lockfile entries',
    '',
    'Recorded as installed, but not present in this payload:',
    '',
    ...stale.map((s) => `- ${s.name} (${s.source ?? 'unknown source'})`),
    '',
  )
}

writeFileSync(join(REPO, 'NOTICE.md'), lines.join('\n'))

const total = Object.values(shipped).flat().length
console.log(`${c.green('✓')} NOTICE.md — ${total - unattributed.length}/${total} shipped skills attributed across ${attributed.size} upstreams`)
if (stale.length) console.log(`  ${c.dim(`${stale.length} stale lockfile entries listed`)}`)

// An unattributed module is a file of unknown origin shipping, which blocks the document
// itself from being truthful. That always fails.
if (unattributed.length) {
  console.log(`  ${c.red(`${unattributed.length} UNATTRIBUTED — not publishable until traced`)}`)
  process.exit(1)
}

// Unresolved grants and license files a skill promises but does not ship are recorded in
// the document and block PUBLICATION, not generation. Previously `unresolved: true` counted
// as attributed and the gate exited 0, so "✓ attribution complete" was reported over two
// upstreams that grant nothing. `--strict` is the gate a release must pass.
const blockers = [
  ...unresolved.map((u) => `unresolved grant: ${u.name} (${u.source})`),
  ...declaredMissing.map(([n, f]) => `${n} declares ${f} but does not ship it`),
  ...apacheStubs.map((r) => `unfilled Apache-2.0 stub: ${r}`),
  ...missingTexts.map((t) => `PROVENANCE names ${t} as the license text but it is not in the repo`),
]
if (blockers.length) {
  const label = strict ? c.red : c.yellow
  console.log(label(`  ${blockers.length} publication blocker(s)${strict ? '' : ' — recorded in NOTICE.md'}:`))
  for (const b of blockers) console.log(`    ${b}`)
  if (strict) {
    console.log(c.dim('\n  settle each one, or drop the skill, before publishing.'))
    process.exit(1)
  }
  console.log(c.dim('  run with --strict to gate a release on these'))
}
