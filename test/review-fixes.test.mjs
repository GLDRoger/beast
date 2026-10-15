// One test per defect an independent audit confirmed. Each asserts the behaviour that was
// wrong, so re-introducing the old code fails here rather than on someone's machine.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, symlinkSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { underRepo, writeGenerated, walk } from '../lib/fsutil.mjs'
import {
  REPO, SECRET_PATTERNS, GENERATED_MARKER, USER_OWNED_PATHS, NAMESPACE_OWNER,
  FILES, EXAMPLES, SHELL_SNIPPETS, HARNESS_NAMES, wanted,
} from '../lib/manifest.mjs'
import { scanText } from '../lib/secrets.mjs'
import { isDrvFs, drvFsRoot, symlinkType, IS_WINDOWS } from '../lib/platform.mjs'

/** chmod is a no-op on Windows, so a test that needs an unwritable directory cannot run. */
const NO_CHMOD = IS_WINDOWS && 'chmod has no effect on Windows'

const CLI = join(dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'beast.mjs')
const tmp = () => mkdtempSync(join(tmpdir(), 'beast-fix-'))

/**
 * Run the CLI against a scratch home.
 *
 * USERPROFILE as well as HOME, always. beast reads os.homedir(), which uses HOME on POSIX
 * and USERPROFILE on Windows — setting only HOME meant every one of these tests ran
 * against the real profile on Windows. CI caught it: four assertions failed because the
 * files had been written to C:\Users\runneradmin instead of the temp dir.
 */
const beast = (args, home) =>
  spawnSync(process.execPath, [CLI, ...args], {
    encoding: 'utf8',
    env: { ...process.env, HOME: home, USERPROFILE: home },
  })

// --- ownership boundary -----------------------------------------------------

test('a sibling directory of the repo is not inside the repo', () => {
  // `startsWith(REPO)` was a string test, so /code/beast-user looked like /code/beast.
  // The stale-link sweep deleted user links under that path without a backup.
  assert.equal(underRepo(REPO), true)
  assert.equal(underRepo(join(REPO, 'home', 'x')), true)
  assert.equal(underRepo(`${REPO}-user/skill`), false)
  assert.equal(underRepo(`${REPO}.bak/skill`), false)
  assert.equal(underRepo('/somewhere/else'), false)
  assert.equal(underRepo(null), false)
})

test('narrowing a selection leaves an unmanaged link alone', () => {
  const d = tmp()
  const home = join(d, 'home')
  const sibling = join(d, 'other-tool', 'skill')
  mkdirSync(sibling, { recursive: true })
  writeFileSync(join(sibling, 'SKILL.md'), 'name: theirs\n')

  assert.equal(beast(['install', '--all'], home).status, 0)
  const mine = join(home, '.claude', 'skills', 'unmanaged')
  // symlinkType, not a bare symlinkSync: on Windows a link to a directory must be created
  // as a junction, and the default 'file' fails with ENOENT.
  symlinkSync(sibling, mine, symlinkType(sibling))

  // Narrow hard: this retires ~140 beast links and must not touch the one above.
  assert.equal(beast(['install', '--harness=codex', '--packs=core'], home).status, 0)
  assert.equal(existsSync(mine), true, 'an unmanaged link must survive the stale sweep')
  rmSync(d, { recursive: true, force: true })
})

// --- generated files --------------------------------------------------------

test('writeGenerated backs up a regular file it did not write', () => {
  const d = tmp()
  const p = join(d, 'gen.md')
  writeFileSync(p, 'the user wrote this\n')

  // Only symlinks were protected before; a regular file was truncated in place.
  const r = writeGenerated(p, `<!-- ${GENERATED_MARKER} -->\nnew\n`)
  assert.equal(r.ok, false, 'outside $HOME there is nowhere to park it, so it must refuse')
  assert.equal(readFileSync(p, 'utf8'), 'the user wrote this\n')
  rmSync(d, { recursive: true, force: true })
})

test('install parks a hand-written delegation.md instead of truncating it', () => {
  const d = tmp()
  const home = join(d, 'home')
  mkdirSync(join(home, '.beast'), { recursive: true })
  const mine = join(home, '.beast', 'delegation.md')
  writeFileSync(mine, 'notes I keep here\n')

  assert.equal(beast(['install', '--all'], home).status, 0)
  const parked = join(home, '.beast', 'pre-beast', '.beast', 'delegation.md')
  assert.equal(readFileSync(parked, 'utf8'), 'notes I keep here\n')
  assert.match(readFileSync(mine, 'utf8'), new RegExp(GENERATED_MARKER))

  // Its own output is overwritten in place, so a re-run must not park anything again.
  assert.equal(beast(['install', '--all'], home).status, 0)
  assert.equal(existsSync(`${parked}.1`), false)
  rmSync(d, { recursive: true, force: true })
})

test('install fails when it cannot write generated state', { skip: NO_CHMOD }, () => {
  const d = tmp()
  const home = join(d, 'home')
  // A directory where selection.json belongs: rename can move it aside, but a file
  // cannot then be created if the parent is not writable — so make the parent read-only.
  mkdirSync(join(home, '.beast'), { recursive: true })
  writeFileSync(join(home, '.beast', 'selection.json'), 'mine\n')
  spawnSync('chmod', ['500', join(home, '.beast')])

  const r = beast(['install', '--all'], home)
  spawnSync('chmod', ['700', join(home, '.beast')])
  assert.equal(r.status, 1, 'a swallowed write failure reported a successful install')
  assert.match(r.stdout, /could not write generated state/)
  rmSync(d, { recursive: true, force: true })
})

// --- doctor after a clean install -------------------------------------------

for (const scope of [['--all'], ['--harness=claude'], ['--harness=codex'], ['--harness=grok']]) {
  test(`doctor passes after a clean install ${scope.join(' ')}`, () => {
    const d = tmp()
    const home = join(d, 'home')
    assert.equal(beast(['install', ...scope], home).status, 0)
    const r = beast(['doctor'], home)
    assert.equal(r.status, 0, `doctor failed on a machine it had just set up:\n${r.stdout}`)
    rmSync(d, { recursive: true, force: true })
  })
}

test('every referenced harness namespace has an owner, and every example is user-owned', () => {
  // checkPayloadPaths skips a reference into an unselected harness. That is only sound
  // while the namespace map covers all three, and while config the installer never
  // writes is on the user-owned list.
  for (const n of HARNESS_NAMES) {
    assert.ok(Object.values(NAMESPACE_OWNER).includes(n), `${n} has no namespace`)
  }
  for (const e of EXAMPLES) assert.ok(USER_OWNED_PATHS.includes(e.home), `${e.home} must be user-owned`)
})

// --- grok gets a prompt of its own ------------------------------------------

test('a grok-only install has the prompt the grok entry point reads', () => {
  const d = tmp()
  const home = join(d, 'home')
  assert.equal(beast(['install', '--harness=grok'], home).status, 0)

  // Grok appends ~/.grok/AGENT.md to its native prompt on every launch, T3 Code included.
  const agent = join(home, '.grok', 'AGENT.md')
  assert.equal(existsSync(agent), true, 'grok-only install is missing ~/.grok/AGENT.md')
  assert.equal(readFileSync(agent, 'utf8'), readFileSync(join(REPO, 'home', 'shared', 'BEAST.md'), 'utf8'))

  const zsh = readFileSync(join(REPO, 'home', 'shell', 'beast.zsh'), 'utf8')
  assert.doesNotMatch(zsh, /--system-prompt-override/, 'an override would replace Grok\'s native prompt')
  const cfg = readFileSync(join(REPO, 'home', 'grok', 'config.toml.example'), 'utf8')
  assert.doesNotMatch(cfg, /\[system-prompt-overrides\]\n/)
  rmSync(d, { recursive: true, force: true })
})

// --- argument parsing -------------------------------------------------------

test('a mistyped or space-separated option is rejected, never widened to everything', () => {
  const d = tmp()
  const cases = [
    ['install', '--dry-run', '--pakcs=core'],
    ['install', '--dry-run', '--harness', 'codex'],
    ['install', '--dry-run', '--harness='],
    ['install', '--dry-run', '--all=yes'],
    ['install', '--dry-run', '--harness=bogus'],
    ['doctor', '--harness=codex'],
    ['scan', '--all'],
  ]
  for (const args of cases) {
    const r = beast(args, join(d, 'home'))
    assert.equal(r.status, 1, `${args.join(' ')} should have been rejected`)
    assert.doesNotMatch(r.stdout, /already correct|would link/, `${args.join(' ')} installed anyway`)
  }
  rmSync(d, { recursive: true, force: true })
})

test('a non-interactive install with no flags configures only the CLIs on PATH', () => {
  const d = tmp()
  const home = join(d, 'home')
  // An empty PATH means no harness resolves, which is the one case that legitimately
  // falls back to all three (better a broad install than none).
  const r = spawnSync(process.execPath, [CLI, 'install', '--dry-run'], {
    encoding: 'utf8',
    env: { ...process.env, HOME: home, USERPROFILE: home, PATH: join(d, 'empty') },
  })
  assert.equal(r.status, 0)
  assert.match(r.stdout, /no CLI found on PATH/)
  rmSync(d, { recursive: true, force: true })
})

// --- secret coverage --------------------------------------------------------

test('the scanner recognises the token formats it used to miss', () => {
  const samples = {
    'GitHub fine-grained PAT': `github_pat_${'1'.repeat(22)}_${'a'.repeat(59)}`,
    'GitHub token': `ghp_${'b'.repeat(36)}`,
    'npm access token': `npm_${'c'.repeat(36)}`,
    'Google API key': `AIza${'D'.repeat(35)}`,
    'JWT': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dBjftJeZ4CVPmB92K27uhbUJU1p1r_wW1gFWFOEjXk',
    'database URL with credentials': 'postgresql://admin:hunter2seven@db.example-host.net:5432/prod',
    'Stripe live key': `sk_live_${'e'.repeat(24)}`,
    'xAI key': `xai-${'f'.repeat(60)}`,
  }
  for (const [label, sample] of Object.entries(samples)) {
    assert.deepEqual(scanText(`x = "${sample}"`), [label], `missed ${label}`)
  }
})

test('the scanner does not fire on ordinary payload prose', () => {
  const benign = [
    'postgres://localhost:5432/dev',
    'mongodb://user:password@localhost/db',           // placeholder password
    'see https://example.com/AIza-not-a-key',
    'the.dotted.words.in.a.sentence',
    'run `npm install --save-dev @example/package`',
  ]
  for (const line of benign) assert.deepEqual(scanText(line), [], `false positive on: ${line}`)
})

test('every secret pattern is a labelled RegExp', () => {
  const labels = new Set()
  for (const [re, label] of SECRET_PATTERNS) {
    assert.ok(re instanceof RegExp, `${label} is not a RegExp`)
    assert.equal(typeof label, 'string')
    assert.ok(label.length > 2, `label too vague: ${label}`)
    assert.equal(labels.has(label), false, `duplicate label: ${label}`)
    labels.add(label)
  }
})

// --- WSL --------------------------------------------------------------------

test('DrvFs detection follows the configured automount root, not just /mnt', () => {
  // /mnt is the default, not a constant. With `root = /` in /etc/wsl.conf the check
  // passed on every path, so the two failures it exists to catch went unreported.
  assert.equal(drvFsRoot(''), '/mnt')
  assert.equal(drvFsRoot('[automount]\nroot = /\n'), '/')
  assert.equal(drvFsRoot('[automount]\nroot = "/windows/"\n'), '/windows')

  assert.equal(isDrvFs('/mnt/c/Users/x'), true)
  assert.equal(isDrvFs('/home/u/code'), false)
  assert.equal(isDrvFs('/mnt/code/thing'), false)      // must be one drive letter
  assert.equal(isDrvFs('/c/Users/x', '/'), true)
  assert.equal(isDrvFs('/home/u', '/'), false)
  assert.equal(isDrvFs('/windows/c/x', '/windows'), true)
})

// --- the payload half of the path check is still selection-independent ------

test('every payload file listed in the manifest maps to a shipped file', () => {
  for (const e of [...FILES, ...EXAMPLES, ...SHELL_SNIPPETS]) {
    assert.equal(existsSync(join(REPO, 'home', e.payload)), true, `missing payload: ${e.payload}`)
    assert.ok(e.target === 'shared' || HARNESS_NAMES.includes(e.target), `bad target on ${e.payload}`)
    assert.equal(wanted(e, HARNESS_NAMES), true)
  }
})

// --- vendored supply chain --------------------------------------------------

test('no skill still carries a standing order to update itself unattended', () => {
  // These directories are symlinks into a git checkout here, so an unattended
  // an unattended upstream updater can rewrite tracked files and discard local fixes.
  const offenders = []
  for (const [abs, rel] of walk(join(REPO, 'home/agents/skill-modules'))) {
    if (!rel.endsWith('.md')) continue
    let text
    try { text = readFileSync(abs, 'utf8') } catch { continue }
    if (/run silently, don't ask|Keep fresh \(silent\)/.test(text)) offenders.push(rel)
  }
  assert.deepEqual(offenders, [])
})

test('delegation distinguishes runtime tools, detected CLIs, unverified broker access, and cross-harness calls', () => {
  const d = tmp()
  const brokerBin = join(d, 'broker-bin')
  const bothBin = join(d, 'both-bin')
  const codexBin = join(d, 'codex-bin')
  const empty = join(d, 'empty')
  for (const p of [brokerBin, bothBin, codexBin, empty]) mkdirSync(p, { recursive: true })
  writeFileSync(join(brokerBin, IS_WINDOWS ? 'broker.exe' : 'broker'), '#!/bin/sh\n', { mode: 0o755 })
  for (const name of ['claude', 'codex']) writeFileSync(join(bothBin, IS_WINDOWS ? `${name}.exe` : name), '#!/bin/sh\n', { mode: 0o755 })
  writeFileSync(join(codexBin, IS_WINDOWS ? 'codex.exe' : 'codex'), '#!/bin/sh\n', { mode: 0o755 })
  const install = (home, path, selection = '--all') =>
    spawnSync(process.execPath, [CLI, 'install', selection], {
      encoding: 'utf8',
      env: { ...process.env, HOME: home, USERPROFILE: home, PATH: path, Path: path },
    })

  for (const selection of ['--all', '--harness=hermes']) {
    const home = join(d, selection === '--all' ? 'all' : 'hermes')
    assert.equal(install(home, brokerBin, selection).status, 0)
    const text = readFileSync(join(home, '.beast', 'delegation.md'), 'utf8')
    assert.match(text, /agent-broker executable is present/)
    assert.match(text, /discover its current providers, authentication, models/)
    assert.match(text, /native subagents/)
    assert.doesNotMatch(text, /Fable|Opus|grok-4\.|gpt-5\.|Providers reachable/)
    assert.doesNotMatch(text, /## Direct CLIs detected|## Calling the other harness/)
  }

  // Codex and Claude Code both present: each gets the headless fallback for calling the other.
  for (const selection of ['--all', '--harness=hermes']) {
    const home = join(d, selection === '--all' ? 'both-all' : 'both-hermes')
    assert.equal(install(home, bothBin, selection).status, 0)
    const text = readFileSync(join(home, '.beast', 'delegation.md'), 'utf8')
    assert.match(text, /## Calling the other harness/)
    assert.match(text, /AGENT_CALL_DEPTH=1 claude -p .*--output-format json < brief\.md/)
    assert.match(text, /AGENT_CALL_DEPTH=1 codex exec .*--json -o result\.md - < brief\.md/)
    assert.match(text, /codex exec resume --skip-git-repo-check <thread_id>/)
    assert.match(text, /native subagents/)
    assert.match(text, /when agent-broker is unavailable/)
    assert.doesNotMatch(text, /agent-broker executable is present|Fable|Opus|grok-4\.|gpt-5\.|Providers reachable/)
  }

  const directHome = join(d, 'direct')
  assert.equal(install(directHome, codexBin, '--harness=hermes').status, 0)
  const direct = readFileSync(join(directHome, '.beast', 'delegation.md'), 'utf8')
  assert.match(direct, /Configured Beast harnesses: Hermes/)
  assert.match(direct, /## Direct CLIs detected on PATH/)
  assert.match(direct, /codex exec/)
  assert.doesNotMatch(direct, /claude -p|grok -p|agent-broker executable|## Calling the other harness/)
  assert.match(direct, /executable-presence checks only/)

  const emptyHome = join(d, 'no-clis')
  assert.equal(install(emptyHome, empty).status, 0)
  const none = readFileSync(join(emptyHome, '.beast', 'delegation.md'), 'utf8')
  assert.match(none, /No external harness CLI was detected/)
  assert.doesNotMatch(none, /codex exec|claude -p|grok -p/)
  rmSync(d, { recursive: true, force: true })
})
