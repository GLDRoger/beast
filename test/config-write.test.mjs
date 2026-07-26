import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync, chmodSync, statSync } from 'node:fs'
import { tmpdir, platform } from 'node:os'
import { join } from 'node:path'
import { insertKey, onlyAdded, applyPlan, configQuestion, EDITS } from '../lib/config-write.mjs'
import { parseTomlFile, tomlInterpreter } from '../lib/toml.mjs'

const tmp = () => mkdtempSync(join(tmpdir(), 'beast-cfg-'))
const NO_TOML = !tomlInterpreter()

/**
 * Windows has no POSIX mode bits: chmodSync(f, 0o600) leaves the file reporting 0o666, so
 * "an edit must not widen permissions" cannot be asserted there. The behaviour it protects
 * is real on POSIX, where config files hold tokens — so this skips rather than relaxes.
 */
const NO_MODES = platform() === 'win32' && 'POSIX file modes do not exist on Windows'

/** Parse a string of TOML by way of a temp file, since tomllib reads files. */
function parse(text) {
  const d = tmp()
  const f = join(d, 'c.toml')
  writeFileSync(f, text)
  const r = parseTomlFile(f)
  rmSync(d, { recursive: true, force: true })
  return r
}

const CODEX_KEYS = EDITS.codex.additions

test('a root key lands in the root table even when the file ends inside another one', { skip: NO_TOML && 'no python3 with tomllib' }, () => {
  // The hazard this whole module exists for. Appending
  //   model_instructions_file = "..."
  // to this file puts it inside [features], where codex 0.145.0 rejects it with
  // `invalid type: string, expected a boolean` and refuses to load at all.
  const before = '[features]\nshell_tool = true\n'
  const r = insertKey(before, CODEX_KEYS[0])
  assert.equal(r.ok, true)

  const p = parse(r.text)
  assert.equal(p.ok, true, 'the result must parse')
  assert.equal(p.value.model_instructions_file, '~/.codex/BEAST.v2.md')
  assert.equal(p.value.features.model_instructions_file, undefined, 'must NOT land in [features]')
  assert.equal(p.value.features.shell_tool, true, 'existing keys survive')
})

test('a table key goes into its table, and both codex keys coexist', { skip: NO_TOML && 'no python3 with tomllib' }, () => {
  let text = '[features]\nshell_tool = true\n\n[tui]\ntheme = "dracula"\n'
  for (const add of CODEX_KEYS) {
    const r = insertKey(text, add)
    assert.equal(r.ok, true)
    text = r.text
  }
  const p = parse(text)
  assert.equal(p.ok, true)
  assert.equal(p.value.model_instructions_file, '~/.codex/BEAST.v2.md')
  assert.equal(p.value.features.model_instructions_file, true)
  assert.equal(p.value.features.shell_tool, true)
  assert.equal(p.value.tui.theme, 'dracula', 'the key must not leak into the next table')
})

test('a missing table is appended, not assumed', { skip: NO_TOML && 'no python3 with tomllib' }, () => {
  const r = insertKey('model = "x"\n', CODEX_KEYS[1])
  const p = parse(r.text)
  assert.equal(p.value.features.model_instructions_file, true)
  assert.equal(p.value.model, 'x')
})

test('an inline table is refused rather than duplicated', () => {
  // `features = { shell_tool = true }` plus an appended `[features]` header is a
  // duplicate key, which makes the entire file unparseable and takes codex down.
  const r = insertKey('features = { shell_tool = true }\n', CODEX_KEYS[1])
  assert.equal(r.ok, false)
  assert.match(r.reason, /inline table|dotted key/)
})

test('a dotted key is refused too', () => {
  const r = insertKey('features.shell_tool = true\n', CODEX_KEYS[1])
  assert.equal(r.ok, false)
})

test('grok array values serialise as TOML arrays', { skip: NO_TOML && 'no python3 with tomllib' }, () => {
  const ignore = EDITS.grok.additions.find((a) => a.path[1] === 'ignore')
  const r = insertKey('[skills]\npaths = ["~/.agents/skills"]\n', ignore)
  const p = parse(r.text)
  assert.deepEqual(p.value.skills.ignore, ['~/.claude/skills'])
  assert.deepEqual(p.value.skills.paths, ['~/.agents/skills'])
})

test('a CRLF config keeps its line endings and its table match', { skip: NO_TOML && 'no python3 with tomllib' }, () => {
  // Without \r tolerance the header never matches, so the key gets appended under a
  // SECOND [features] header — a duplicate key that stops codex loading at all.
  const before = '[features]\r\nshell_tool = true\r\n'
  const r = insertKey(before, CODEX_KEYS[1])
  assert.equal(r.ok, true)
  assert.equal((r.text.match(/\[features\]/g) ?? []).length, 1, 'exactly one [features] header')
  assert.equal(r.text.includes('\n\n'), false, 'no bare LF introduced into a CRLF file')

  const p = parse(r.text)
  assert.equal(p.ok, true)
  assert.equal(p.value.features.model_instructions_file, true)
  assert.equal(p.value.features.shell_tool, true)
})

test('onlyAdded rejects a result that changed anything else', () => {
  const pre = { model: 'a', features: { shell_tool: true } }
  const added = [{ path: ['model_instructions_file'] }]

  assert.equal(onlyAdded(pre, { ...pre, model_instructions_file: 'p' }, added), true)
  assert.equal(onlyAdded(pre, { model: 'CHANGED', features: { shell_tool: true }, model_instructions_file: 'p' }, added), false)
  assert.equal(onlyAdded(pre, { model: 'a', model_instructions_file: 'p' }, added), false, 'a dropped table must fail')
})

test('onlyAdded allows a table beast created for the key, but not one it filled', () => {
  const added = [{ path: ['features', 'model_instructions_file'] }]
  assert.equal(onlyAdded({ model: 'a' }, { model: 'a', features: { model_instructions_file: true } }, added), true)
  assert.equal(onlyAdded({ model: 'a' }, { model: 'a', features: { model_instructions_file: true, other: 1 } }, added), false)
})

test('applyPlan writes, backs nothing up it cannot, and is idempotent in effect', { skip: NO_TOML && 'no python3 with tomllib' }, () => {
  const d = tmp()
  const file = join(d, 'config.toml')
  writeFileSync(file, '[features]\nshell_tool = true\n')

  const r = applyPlan({ file, spec: EDITS.codex, additions: CODEX_KEYS, notes: [], status: 'edit' })
  assert.equal(r.wrote, true)

  const p = parseTomlFile(file)
  assert.equal(p.value.model_instructions_file, '~/.codex/BEAST.v2.md')
  assert.equal(p.value.features.model_instructions_file, true)
  assert.equal(p.value.features.shell_tool, true)
  assert.equal(existsSync(`${file}.beast-tmp`), false, 'no temp file left behind')
  rmSync(d, { recursive: true, force: true })
})

test('applyPlan leaves the original untouched when the result would not parse', { skip: NO_TOML && 'no python3 with tomllib' }, () => {
  const d = tmp()
  const file = join(d, 'config.toml')
  const before = 'model_instructions_file = "mine"\n[features]\nshell_tool = true\n'
  writeFileSync(file, before)

  // Force the collision the guard exists for: insert a key that is already present.
  // planConfigEdits would filter this out; applyPlan must still refuse it rather than
  // produce a duplicate-key file that codex cannot load.
  const r = applyPlan({ file, spec: EDITS.codex, additions: [CODEX_KEYS[0]], notes: [], status: 'edit' })
  assert.equal(r.wrote, false)
  assert.equal(r.status, 'refused')
  assert.equal(readFileSync(file, 'utf8'), before, 'the original must survive byte for byte')
  assert.equal(existsSync(`${file}.beast-tmp`), false)
  rmSync(d, { recursive: true, force: true })
})

test('applyPlan creates a config file when there is none', { skip: NO_TOML && 'no python3 with tomllib' }, () => {
  const d = tmp()
  const file = join(d, 'config.toml')
  const r = applyPlan({ file, spec: EDITS.grok, additions: EDITS.grok.additions, notes: [], status: 'create' })
  assert.equal(r.wrote, true)
  const p = parseTomlFile(file)
  assert.deepEqual(p.value.skills.ignore, ['~/.claude/skills'])
  assert.deepEqual(p.value['system-prompt-overrides'].paths, ['~/.grok/BEAST.v2.md'])
  rmSync(d, { recursive: true, force: true })
})

test('applyPlan keeps the original file mode', { skip: NO_MODES || (NO_TOML && 'no python3 with tomllib') }, () => {
  const d = tmp()
  const file = join(d, 'config.toml')
  writeFileSync(file, '[features]\nshell_tool = true\n')
  chmodSync(file, 0o600)                       // config can hold tokens

  applyPlan({ file, spec: EDITS.codex, additions: CODEX_KEYS, notes: [], status: 'edit' })
  assert.equal(statSync(file).mode & 0o777, 0o600, 'an edit must not widen permissions')
  rmSync(d, { recursive: true, force: true })
})

test('the question names every key it is about to write, with a reason', () => {
  // The interactive prompt is the one path the suite cannot drive, so the text it
  // prints is generated by a pure function and checked here instead.
  const plans = [{ file: '/h/.codex/config.toml', additions: EDITS.codex.additions }]
  const lines = configQuestion(plans)
  assert.equal(lines.filter((l) => l.file).length, 1)
  assert.deepEqual(
    lines.filter((l) => l.key).map((l) => l.key),
    ['model_instructions_file', 'features.model_instructions_file'],
  )
  assert.ok(lines.filter((l) => l.key).every((l) => l.why?.length > 10), 'every key states why')
  assert.deepEqual(configQuestion([{ file: '/h/x', additions: [] }]), [], 'nothing to add, nothing to say')
})

test('every edit beast writes is one the doctor check knows how to validate', () => {
  // Drift guard. checks/config.mjs validates model_instructions_file, [skills] paths,
  // and [system-prompt-overrides] paths; a new addition here without a matching check
  // is a key nothing verifies after the fact.
  const validated = readFileSync(new URL('../lib/checks/config.mjs', import.meta.url), 'utf8')
  for (const spec of Object.values(EDITS)) {
    for (const add of spec.additions) {
      const leaf = add.path[add.path.length - 1]
      const table = add.path.length > 1 ? add.path[0] : null
      assert.ok(
        validated.includes(leaf) || (table && validated.includes(table)),
        `checks/config.mjs does not validate ${add.path.join('.')}`,
      )
    }
  }
})
