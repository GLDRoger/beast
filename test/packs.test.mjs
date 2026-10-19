import { test } from 'node:test'
import assert from 'node:assert/strict'
import { skillEntries } from '../lib/fsutil.mjs'
import { inPayload } from '../lib/manifest.mjs'
import { PACKS, PACK_NAMES, packSkills, packOf, REQUIRED_PACKS } from '../lib/packs.mjs'

// Ground truth is the payload on disk, read through the same skillEntries rule
// install.mjs gates on — so loose docs like README.md are not skills and never
// need a pack, and the entries here are directory names, not frontmatter names.
const onDisk = new Set(
  ['agents/skill-modules', 'agents/skills']
    .flatMap((rel) => skillEntries(inPayload(rel)))
    .map((e) => e.name))

const claims = () => {
  const m = new Map()
  for (const [name, p] of Object.entries(PACKS))
    for (const s of p.skills) m.set(s, [...(m.get(s) ?? []), name])
  return m
}

test('the payload is actually there — an empty listing would pass every check below', () => {
  assert.ok(onDisk.size > 50, `only ${onDisk.size} skills on disk`)
  assert.equal(onDisk.has('README.md'), false)
})

test('every skill on disk is in exactly one pack', () => {
  const c = claims()
  const missing = [...onDisk].filter((s) => !c.has(s)).sort()
  // A module in no pack is silently uninstallable: install.mjs skips any skill
  // outside `allowed`, so it never links and never errors.
  assert.deepEqual(missing, [], `not in any pack: ${missing.join(', ')}`)

  const doubled = [...c].filter(([, names]) => names.length > 1)
    .map(([s, names]) => `${s} (${names.join('+')})`)
  assert.deepEqual(doubled, [], `in more than one pack: ${doubled.join(', ')}`)
})

test('no pack lists a skill that does not exist on disk', () => {
  const phantom = [...claims().keys()].filter((s) => !onDisk.has(s)).sort()
  assert.deepEqual(phantom, [], `listed but not on disk: ${phantom.join(', ')}`)
})

test('core is the only required pack', () => {
  assert.deepEqual(REQUIRED_PACKS, ['core'])
  assert.equal(PACKS.core.required, true)
  for (const n of PACK_NAMES.filter((n) => n !== 'core'))
    assert.notEqual(PACKS[n].required, true, `${n} must be optional`)
})

test('core is exactly the eight primary workflows', () => {
  assert.equal(PACKS.core.skills.length, 8)
  for (const s of ['code', 'frontend', 'writing', 'motion', 'performance', 'security', 'growth', 'media'])
    assert.equal(packOf(s), 'core', s)
  assert.equal(PACKS.core.skills.filter((s) => s.startsWith('master-')).length, 0)
})

test('packSkills returns exactly what the named packs claim', () => {
  assert.deepEqual(packSkills(['core']), PACKS.core.skills)
  assert.deepEqual(packSkills([]), [])
  assert.deepEqual(packSkills(['nope']), [])                  // unknown pack, not a throw
  assert.equal(packSkills(PACK_NAMES).length, [...claims().keys()].length)
})

test('packOf round-trips a sample and returns null for a non-skill', () => {
  for (const [skill, pack] of [
    ['code', 'core'],
    ['taste-craft', 'design'],
    ['text-to-lottie', 'design'],       // animation asset helper
    ['unslop', 'prose'],
    ['ship-email', 'product'],          // scaffolds email infra, not copy
    ['web-shader-extractor', 'engineering'],
    ['cua-driver', 'tooling'],
  ]) {
    assert.equal(packOf(skill), pack, skill)
    assert.ok(PACKS[pack].skills.includes(skill), `${pack} should list ${skill}`)
  }
  assert.equal(packOf('README.md'), null)
  assert.equal(packOf('not-a-skill'), null)
})

test('every pack has display text and a non-empty skill list', () => {
  assert.equal(PACK_NAMES[0], 'core')                         // core first in the picker
  for (const n of PACK_NAMES) {
    assert.ok(PACKS[n].label?.length > 0, `${n} label`)
    assert.ok(PACKS[n].hint?.length > 0, `${n} hint`)
    assert.ok(PACKS[n].skills.length > 0, `${n} skills`)
  }
})
