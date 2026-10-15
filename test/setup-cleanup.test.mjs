import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, readdirSync, lstatSync, existsSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { REPO, RETIRED_SKILLS, EXCLUDE_SKILLS, SCRUB_LINE_PATTERNS } from '../lib/manifest.mjs'
import { PACK_NAMES, packSkills } from '../lib/packs.mjs'
import { delegationCapabilities, renderDelegation } from '../lib/delegation.mjs'
import { scrubTree } from '../lib/scrub.mjs'
import { symlinkType } from '../lib/platform.mjs'

const CLI = join(REPO, 'bin/beast.mjs')
const run = (args, home) => spawnSync(process.execPath, [CLI, ...args], {
  encoding: 'utf8', env: { ...process.env, HOME: home, USERPROFILE: home },
})
const snapshot = (root) => {
  const result = {}
  const walk = (p) => {
    for (const name of readdirSync(p)) {
      const file = join(p, name), stat = lstatSync(file)
      if (stat.isDirectory()) walk(file)
      else if (!file.endsWith('delegation.md')) result[file] = stat.isSymbolicLink() ? 'link' : readFileSync(file, 'utf8')
    }
  }
  walk(root)
  return result
}

test('retired skills cannot remain in discovery, packs, payload, or bootstrap inputs', () => {
  const shipped = new Set(packSkills(PACK_NAMES))
  assert.ok(RETIRED_SKILLS.includes('hyperframes'))
  assert.ok(RETIRED_SKILLS.includes('impeccable'))
  assert.ok(RETIRED_SKILLS.includes('decision-doc'))
  assert.ok(RETIRED_SKILLS.includes('product-brief'))
  for (const name of RETIRED_SKILLS) {
    assert.ok(EXCLUDE_SKILLS.includes(name), `${name} must not be reimported by bootstrap`)
    assert.equal(shipped.has(name), false, `${name} must not be installable`)
    for (const tree of ['skills', 'skill-modules']) {
      assert.equal(existsSync(join(REPO, 'home/agents', tree, name)), false, `${name} remains in ${tree}`)
    }
  }
  assert.equal(existsSync(join(REPO, 'home/codex/scripts/verification_router.py')), false)
})

test('retirement filtering removes explicit dead routes, not ordinary design/review prose', () => {
  const home = mkdtempSync(join(tmpdir(), 'beast-retired-'))
  const file = join(home, 'SKILL.md')
  const meaningful = 'Audit the current workflow; adapt to context, animate useful feedback, and polish the final text.'
  writeFileSync(file, meaningful + '\nUse `$audit` now.\nRead `~/.agents/skill-modules/impeccable/SKILL.md`.\n')
  assert.equal(SCRUB_LINE_PATTERNS.some((re) => re.test(meaningful)), false)
  scrubTree(home)
  assert.equal(readFileSync(file, 'utf8'), meaningful + '\n')
  rmSync(home, { recursive: true, force: true })
})

test('a reinstall retires stale owned aliases while preserving the remaining setup', () => {
  const home = mkdtempSync(join(tmpdir(), 'beast-retirement-install-'))
  assert.equal(run(['install', '--all'], home).status, 0)
  // A pre-cleanup alias still points inside Beast but its target has been removed.
  const target = join(REPO, 'home/agents/skill-modules/impeccable')
  const stale = join(home, '.agents/skills/impeccable')
  symlinkSync(target, stale, symlinkType(join(REPO, 'home/agents/skill-modules/unslop')))
  assert.equal(run(['install', '--all'], home).status, 0)
  assert.throws(() => lstatSync(stale), { code: 'ENOENT' })
  for (const tree of ['.agents/skills', '.agents/skill-modules', '.codex/skills', '.claude/skills']) {
    const names = readdirSync(join(home, tree))
    assert.deepEqual(names.filter((n) => RETIRED_SKILLS.includes(n)), [])
  }
  assert.equal(existsSync(join(home, '.agents/skill-modules/unslop/references/visual.md')), true)
  assert.equal(existsSync(join(home, '.agents/skills/code/references/verification.md')), true)
  assert.equal(run(['doctor'], home).status, 0)
  const before = snapshot(home)
  const invalid = run(['install', '--packs=video'], home)
  assert.equal(invalid.status, 1)
  assert.deepEqual(snapshot(home), before, 'a removed pack name must not broaden or mutate an install')
  rmSync(home, { recursive: true, force: true })
})

test('delegation discovery does not infer providers from installation targets or a broker binary', () => {
  const cap = delegationCapabilities(['hermes'], (name) => ['broker', 'codex'].includes(name) ? `/test/${name}` : null)
  assert.deepEqual(cap, { targets: ['hermes'], direct: ['codex'], broker: true })
  const text = renderDelegation(cap)
  assert.match(text, /Configured Beast harnesses: Hermes/)
  assert.match(text, /codex exec/)
  assert.doesNotMatch(text, /claude -p|grok -p|Fable|Opus/)
  assert.match(text, /does not establish|do not establish/)
})

test('delegation refresh is idempotent and does not reinstall or modify selection/configuration', () => {
  const home = mkdtempSync(join(tmpdir(), 'beast-delegation-refresh-'))
  mkdirSync(join(home, '.beast'), { recursive: true })
  mkdirSync(join(home, '.codex'), { recursive: true })
  const selection = join(home, '.beast/selection.json')
  writeFileSync(selection, JSON.stringify({ targets: ['codex'], packs: ['core'] }))
  writeFileSync(join(home, '.codex/config.toml'), 'model = "user-selected"\n')
  const before = snapshot(home)
  assert.equal(run(['delegation'], home).status, 0)
  const guide = join(home, '.beast/delegation.md')
  const first = readFileSync(guide, 'utf8')
  assert.equal(run(['delegation'], home).status, 0)
  assert.equal(readFileSync(guide, 'utf8'), first)
  assert.deepEqual(snapshot(home), before)
  assert.equal(existsSync(join(home, '.agents')), false, 'refresh must not install skill links')

  for (const bad of ['not JSON', JSON.stringify({ targets: ['not-a-harness'] })]) {
    writeFileSync(selection, bad)
    assert.equal(run(['delegation'], home).status, 1)
    assert.equal(readFileSync(guide, 'utf8'), first, 'bad configuration must leave guidance untouched')
  }
  assert.equal(run(['delegation', '--all'], home).status, 1)
  assert.equal(readFileSync(guide, 'utf8'), first)
  rmSync(home, { recursive: true, force: true })
})
