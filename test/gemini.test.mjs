import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, readlinkSync, existsSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { REPO, GENERATED_MARKER } from '../lib/manifest.mjs'
import { assembleGemini } from '../lib/gemini.mjs'

const CLI = join(REPO, 'bin/beast.mjs')
const read = (p) => readFileSync(p, 'utf8')
const inputs = () => ({
  base: read(join(REPO, 'home/shared/BEAST.md')),
  policy: read(join(REPO, 'home/shared/USER.md')),
  overlay: read(join(REPO, 'home/gemini/system.overlay.md')),
})
const run = (home, args) => spawnSync(process.execPath, [CLI, ...args], {
  encoding: 'utf8', env: { ...process.env, HOME: home, USERPROFILE: home },
})
const count = (text, heading) => text.split('\n').filter((l) => l === heading).length

test('Google prompt composition preserves templates, with one copy of each intended layer', () => {
  const input = inputs(), { system, rules } = assembleGemini(input)
  for (const text of [system, rules]) {
    assert.ok(text.slice(0, 512).includes(GENERATED_MARKER))
    assert.equal(count(text, '# Beast'), 1)
  }
  assert.equal(count(system, '# User preferences'), 0)
  assert.equal(count(rules, '# User preferences'), 1)
  assert.ok(system.endsWith(input.overlay.trim() + '\n'))
  for (const key of ['AvailableTools', 'AgentSkills', 'SubAgents']) {
    assert.ok(system.includes('${' + key + '}'))
    assert.ok(!rules.includes('${' + key + '}'))
    assert.throws(() => assembleGemini({ ...input, overlay: input.overlay.replace('${' + key + '}', '') }), /missing/)
  }
})

test('Gemini install backs up hand copies and configs, preserves other keys, and is idempotent', () => {
  const home = mkdtempSync(join(tmpdir(), 'beast-gemini-'))
  try {
    mkdirSync(join(home, '.gemini/config'), { recursive: true })
    const old = { context: { fileName: ['GEMINI.md', 'AGENTS.md', 'CLAUDE.md'], includeDirectories: ['/user/skills'] }, userKey: { preserved: true } }
    writeFileSync(join(home, '.gemini/settings.json'), JSON.stringify(old), { mode: 0o600 })
    writeFileSync(join(home, '.gemini/.env'), 'OTHER=preserve\nGEMINI_SYSTEM_MD=/stale\n', { mode: 0o600 })
    for (const path of ['system.md', 'GEMINI.md', 'config/AGENTS.md']) writeFileSync(join(home, '.gemini', path), `hand copy ${path}\n`)
    for (let i = 0; i < 2; i++) {
      const r = run(home, ['install', '--harness=gemini', '--packs=core', '--write-config'])
      assert.equal(r.status, 0, r.stdout + r.stderr)
    }
    const parked = join(home, '.beast/pre-beast/.gemini')
    for (const path of ['system.md', 'GEMINI.md', 'config/AGENTS.md']) assert.equal(read(join(parked, path)), `hand copy ${path}\n`)
    assert.deepEqual(JSON.parse(read(join(parked, 'settings.json'))), old)
    assert.deepEqual(JSON.parse(read(join(home, '.gemini/settings.json'))), { ...old, context: { ...old.context, fileName: ['GEMINI.md', 'AGENTS.md'] } })
    assert.equal(read(join(home, '.gemini/.env')), `OTHER=preserve\nGEMINI_SYSTEM_MD=${join(home, '.gemini/system.md')}\n`)
    assert.equal(read(join(parked, '.env')), 'OTHER=preserve\nGEMINI_SYSTEM_MD=/stale\n')
    if (process.platform !== 'win32') assert.equal(statSync(join(home, '.gemini/settings.json')).mode & 0o777, 0o600)
    assert.equal(readlinkSync(join(home, '.gemini/GEMINI.md')), join(REPO, 'home/shared/USER.md'))
    assert.equal(count(read(join(home, '.gemini/system.md')), '# Beast'), 1)
    assert.equal(count(read(join(home, '.gemini/config/AGENTS.md')), '# Beast'), 1)
    const doctor = run(home, ['doctor'])
    assert.equal(doctor.status, 0, doctor.stdout + doctor.stderr)
    writeFileSync(join(home, '.gemini/system.md'), 'stale')
    const stale = run(home, ['doctor'])
    assert.equal(stale.status, 1)
    assert.match(stale.stdout, /generated Gemini prompt missing or stale/)
  } finally { rmSync(home, { recursive: true, force: true }) }
})

test('Gemini dry run and default install leave user settings alone; malformed settings fail safely', () => {
  const home = mkdtempSync(join(tmpdir(), 'beast-gemini-'))
  try {
    mkdirSync(join(home, '.gemini'), { recursive: true })
    const settings = join(home, '.gemini/settings.json')
    writeFileSync(settings, 'not json')
    assert.equal(run(home, ['install', '--harness=gemini', '--dry-run', '--write-config']).status, 0)
    assert.equal(existsSync(join(home, '.gemini/system.md')), false)
    assert.equal(run(home, ['install', '--harness=gemini']).status, 0)
    assert.equal(read(settings), 'not json')
    const r = run(home, ['install', '--harness=gemini', '--write-config'])
    assert.equal(r.status, 1)
    assert.equal(read(settings), 'not json')
    assert.equal(existsSync(join(home, '.beast/pre-beast/.gemini/settings.json')), false)
  } finally { rmSync(home, { recursive: true, force: true }) }
})

test('Gemini config edits refuse occupied temp paths without deleting their contents', () => {
  const home = mkdtempSync(join(tmpdir(), 'beast-gemini-'))
  try {
    mkdirSync(join(home, '.gemini'), { recursive: true })
    const settings = join(home, '.gemini/settings.json')
    writeFileSync(settings, '{}')
    writeFileSync(settings + '.beast-tmp', 'user-owned temporary file')
    const r = run(home, ['install', '--harness=gemini', '--write-config'])
    assert.equal(r.status, 1)
    assert.equal(read(settings), '{}')
    assert.equal(read(settings + '.beast-tmp'), 'user-owned temporary file')
  } finally { rmSync(home, { recursive: true, force: true }) }
})
