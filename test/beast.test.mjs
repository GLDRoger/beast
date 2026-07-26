import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, symlinkSync, rmSync, lstatSync, realpathSync, readlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { linkFile, skillEntries, isJunk } from '../lib/fsutil.mjs'
import { describe } from '../lib/skills.mjs'
import { SKILL_CAP, EXCLUDE_PATHS, EXCLUDE_SKILLS, REPO } from '../lib/manifest.mjs'

const tmp = () => mkdtempSync(join(tmpdir(), 'beast-'))

test('linkFile creates a link and is idempotent', () => {
  const d = tmp()
  const target = join(d, 'src.md'); writeFileSync(target, 'x')
  const link = join(d, 'nested', 'dst.md')

  assert.equal(linkFile(link, target).status, 'linked')
  // Compare resolved paths: linkFile stores the realpath so $HOME never holds a
  // two-hop chain, and on macOS /var is itself a symlink to /private/var.
  assert.equal(realpathSync(link), realpathSync(target))
  assert.equal(readFileSync(link, 'utf8'), 'x')             // and it actually reads through
  assert.equal(linkFile(link, target).status, 'ok')          // second run is a no-op
  rmSync(d, { recursive: true, force: true })
})

test('linkFile refuses to invent a link for a missing source', () => {
  const d = tmp()
  const r = linkFile(join(d, 'dst'), join(d, 'nope'))
  assert.equal(r.status, 'missing-source')
  assert.equal(lstatSync(d).isDirectory(), true)
  rmSync(d, { recursive: true, force: true })
})

test('linkFile refuses to destroy a symlink it cannot back up', () => {
  // This test previously asserted that a user-owned symlink was silently deleted and
  // replaced, which contradicts the never-delete invariant. An independent review
  // flagged the test itself as locking in the defect. A link pointing outside the repo
  // belongs to the user, so it is preserved or the operation is refused.
  const d = tmp()
  const users = join(d, 'users-target'); writeFileSync(users, 'USER')
  const payload = join(d, 'payload'); writeFileSync(payload, 'repo')
  const link = join(d, 'l')
  symlinkSync(users, link)

  const r = linkFile(link, payload)
  // Outside $HOME there is nowhere under BACKUP_ROOT to park it, so it refuses rather
  // than deleting. Inside $HOME the same case yields 'linked-with-backup'.
  assert.equal(r.status, 'outside-home')
  assert.equal(readFileSync(link, 'utf8'), 'USER', 'the user\'s symlink must survive')
  rmSync(d, { recursive: true, force: true })
})

test('linkFile repoints a link it already owns, without a backup', () => {
  // A link already pointing into the payload is beast's own, so replacing it is not
  // data loss and needs no backup.
  const d = tmp()
  const repoish = join(REPO, 'package.json')          // a real path inside the repo
  const link = join(d, 'l')
  symlinkSync(repoish, link)
  const other = join(REPO, 'README.md')

  const r = linkFile(link, other)
  assert.equal(r.status, 'linked')
  assert.ok(!r.backup, 'a link beast already owns needs no backup')
  assert.match(readlinkSync(link), /README\.md$/)
  rmSync(d, { recursive: true, force: true })
})

test('linkFile does not clobber a real dir when skipIfReal is set', () => {
  const d = tmp()
  const target = join(d, 'payload'); mkdirSync(target)
  const link = join(d, 'live'); mkdirSync(link)
  writeFileSync(join(link, 'local-only.txt'), 'asset the payload omits')

  const r = linkFile(link, target, { skipIfReal: true })
  assert.equal(r.status, 'kept-local')
  assert.equal(lstatSync(link).isSymbolicLink(), false)       // still the real dir
  rmSync(d, { recursive: true, force: true })
})

test('skillEntries returns only directories holding a SKILL.md', () => {
  const d = tmp()
  mkdirSync(join(d, 'code'))
  writeFileSync(join(d, 'code', 'SKILL.md'), 'name: code')
  mkdirSync(join(d, '.system'))                              // Codex-shipped, not ours
  writeFileSync(join(d, 'README.md'), '# layout')
  // A directory with no SKILL.md used to count as a skill, which fed the cap, the link
  // set, and pack coverage a number that included empty directories.
  mkdirSync(join(d, 'not-a-skill'))

  assert.deepEqual(skillEntries(d).map((e) => e.name), ['code'])
  rmSync(d, { recursive: true, force: true })
})

test('isJunk catches what must never be committed', () => {
  for (const n of ['.DS_Store', '__pycache__', 'node_modules', '.system', 'x.pyc'])
    assert.equal(isJunk(n), true, n)
  assert.equal(isJunk('SKILL.md'), false)
})

test('describe reads both inline and block-scalar descriptions', () => {
  const d = tmp()
  const a = join(d, 'a'); mkdirSync(a)
  writeFileSync(join(a, 'SKILL.md'), 'name: a\ndescription: plain inline text\n---\n')
  assert.equal(describe(a), 'plain inline text')

  const b = join(d, 'b'); mkdirSync(b)
  writeFileSync(join(b, 'SKILL.md'), 'name: b\ndescription: >\n  folded over\n  two lines\nother: 1\n')
  assert.equal(describe(b), 'folded over two lines')

  const c = join(d, 'c'); mkdirSync(c)
  writeFileSync(join(c, 'SKILL.md'), 'name: c\n')
  assert.equal(describe(c), '')
  rmSync(d, { recursive: true, force: true })
})

test('exclusion lists are non-empty — a silent empty list would ship everything', () => {
  assert.ok(EXCLUDE_SKILLS.length > 0)
  assert.ok(EXCLUDE_PATHS.length > 0)
  assert.ok(SKILL_CAP > 0 && SKILL_CAP <= 50)
})

// --- platform -------------------------------------------------------------
// Windows and WSL cannot be executed here, so these test the pure decision
// functions against the inputs those platforms produce. That is a weaker
// guarantee than running on Windows and is labelled as such in the README.

test('HOME comes from homedir(), never process.env.HOME', async () => {
  const { HOME } = await import('../lib/platform.mjs')
  assert.equal(typeof HOME, 'string')
  assert.ok(HOME.length > 0)
  // The old bug: process.env.HOME is undefined on Windows, so anything taking it
  // as a path argument threw ERR_INVALID_ARG_TYPE mid-install. Guard against it
  // coming back — in code, not in prose, so comments about it are allowed.
  for (const f of ['fsutil.mjs', 'install.mjs', 'doctor.mjs', 'skills.mjs', 'platform.mjs']) {
    const code = readFileSync(new URL(`../lib/${f}`, import.meta.url), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
    assert.equal(code.includes('process.env.HOME'), false, `${f} reads process.env.HOME`)
  }
})

test('isDrvFs identifies Windows drives mounted into WSL', async () => {
  const { isDrvFs } = await import('../lib/platform.mjs')
  for (const p of ['/mnt/c/Users/x/code', '/mnt/d/repo', '/mnt/C/x'])
    assert.equal(isDrvFs(p), true, p)
  for (const p of ['/home/x/code', '/mnt', '/mnttest/x', '/Users/x'])
    assert.equal(isDrvFs(p), false, p)
})

test('symlinkType returns undefined off Windows so POSIX behaviour is unchanged', async () => {
  const { symlinkType, IS_WINDOWS } = await import('../lib/platform.mjs')
  const d = tmp()
  if (!IS_WINDOWS) {
    assert.equal(symlinkType(d), undefined)
  } else {
    assert.equal(symlinkType(d), 'junction')          // dirs need junction, no elevation
  }
  rmSync(d, { recursive: true, force: true })
})

test('whichBinary finds a real binary and returns null for a fake one', async () => {
  const { whichBinary } = await import('../lib/platform.mjs')
  assert.ok(whichBinary('node'))                       // resolves to a path
  assert.equal(whichBinary('definitely-not-a-real-binary-xyz'), null)
})

test('describePlatform names the current platform', async () => {
  const { describePlatform } = await import('../lib/platform.mjs')
  assert.match(describePlatform(), /^(macOS|Linux|Windows|WSL[12] \(.+\))$/)
})

test('both shell snippets ship and agree on the three commands', async () => {
  const { SHELL_SNIPPETS, inPayload } = await import('../lib/manifest.mjs')
  assert.equal(SHELL_SNIPPETS.length, 2)
  for (const s of SHELL_SNIPPETS) {
    const body = readFileSync(inPayload(s.payload), 'utf8')
    for (const fn of ['c', 'co', 'gro']) assert.ok(new RegExp(`\\b${fn}\\b`).test(body), `${s.payload} missing ${fn}`)
    assert.equal(/--dangerously|--yolo/.test(body.replace(/^\s*#.*$/gm, '')), false, `${s.payload} has a dangerous default`)
  }
})

test('parseWslRelease handles real WSL1, WSL2, and plain-Linux kernel strings', async () => {
  const { parseWslRelease } = await import('../lib/platform.mjs')

  // WSL2 — the "WSL2" marker is present in the release string
  assert.deepEqual(
    parseWslRelease('5.15.146.1-microsoft-standard-WSL2\n', { WSL_DISTRO_NAME: 'Ubuntu' }),
    { version: 2, distro: 'Ubuntu' })

  // WSL1 — says Microsoft but has no WSL marker and no WSL_INTEROP
  assert.deepEqual(
    parseWslRelease('4.4.0-19041-Microsoft\n', { WSL_DISTRO_NAME: 'Debian' }),
    { version: 1, distro: 'Debian' })

  // WSL2 where the string is ambiguous but WSL_INTEROP gives it away
  assert.equal(parseWslRelease('5.15.0-microsoft\n', { WSL_INTEROP: '/run/WSL/8_interop' }).version, 2)

  // distro unknown when the env var is absent
  assert.equal(parseWslRelease('5.15-microsoft-standard-WSL2', {}).distro, 'unknown')

  // real Linux and macOS kernels are not WSL
  assert.equal(parseWslRelease('6.6.87.2-generic\n', {}), null)
  assert.equal(parseWslRelease('Darwin Kernel Version 25.5.0\n', {}), null)
  assert.equal(parseWslRelease('', {}), null)
  assert.equal(parseWslRelease(undefined, {}), null)
})

test('linkFile collapses a payload-internal symlink instead of chaining', () => {
  const d = tmp()
  const real = join(d, 'library-item'); mkdirSync(real)
  writeFileSync(join(real, 'SKILL.md'), 'content')
  const view = join(d, 'active-view'); symlinkSync(real, view)   // the active-set view
  const link = join(d, 'home-link')

  linkFile(link, view)
  // must point at the real dir, not at the view — one hop from real content
  assert.equal(lstatSync(readlinkSync(link)).isSymbolicLink(), false)
  assert.equal(readFileSync(join(link, 'SKILL.md'), 'utf8'), 'content')
  rmSync(d, { recursive: true, force: true })
})

test('SKILL_MIRRORS entries are objects; path consumers must use SKILL_MIRROR_PATHS', async () => {
  const m = await import('../lib/manifest.mjs')
  // Regression guard. SKILL_MIRRORS became {home, target} objects when harness
  // targeting landed. install.mjs and doctor.mjs were updated; skills.mjs was not, and
  // join(object, name) threw ERR_INVALID_ARG_TYPE *after* the payload had already been
  // mutated, leaving a skill unlinked from the active set but still linked into every
  // harness. Any module that joins these into a path must use the string form.
  for (const e of m.SKILL_MIRRORS) {
    assert.equal(typeof e, 'object')
    assert.equal(typeof e.home, 'string')
    assert.equal(typeof e.target, 'string')
  }
  for (const p of m.SKILL_MIRROR_PATHS) assert.equal(typeof p, 'string')
  assert.equal(m.SKILL_MIRROR_PATHS.length, m.SKILL_MIRRORS.length)

  // And no module may pass the object form to a path join.
  const { readFileSync } = await import('node:fs')
  for (const f of ['skills.mjs', 'install.mjs', 'doctor.mjs']) {
    const src = readFileSync(new URL(`../lib/${f}`, import.meta.url), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    assert.equal(/join\(inHome\(m\)/.test(src), false, `${f} joins a mirror object as a path`)
    assert.equal(/of SKILL_MIRRORS\b[\s\S]{0,200}?join\(inHome\(m\),/.test(src), false,
      `${f} iterates SKILL_MIRRORS and joins the object`)
  }
})

test('scanSummary reports only what is worth reporting, and never throws', async () => {
  const { scanSummary } = await import('../lib/scan.mjs')
  const s = scanSummary()
  assert.notEqual(s, null, 'scanSummary returned null; it must degrade, not fail')
  assert.equal(typeof s.worthReporting, 'boolean')
  assert.equal(typeof s.over, 'boolean')
  assert.match(s.line, /^\d+\/\d+ loaded/)

  // The summary must agree with the check it is derived from. A hint that contradicts
  // `beast scan` is worse than no hint.
  const { checkSkillHygiene } = await import('../lib/checks/skills.mjs')
  const res = checkSkillHygiene({ fail: () => {}, warn: () => {}, info: () => {} })
  assert.equal(s.over, res.loaded > res.cap)
  assert.ok(s.line.startsWith(`${res.loaded}/${res.cap}`))
})

test('the skill inventory exposes the detail scan needs', async () => {
  const { checkSkillHygiene } = await import('../lib/checks/skills.mjs')
  const { inventory: inv, managed } = checkSkillHygiene({ fail: () => {}, warn: () => {}, info: () => {} })

  for (const k of ['plugins', 'foreign', 'system', 'duplicates', 'managedNames']) {
    assert.ok(Array.isArray(inv[k]), `inventory.${k} must be an array`)
  }
  // managedNames is what scan reports as "beast's"; it must match the count doctor prints.
  assert.equal(inv.managedNames.length, managed)
  // Every plugin entry needs the names, or scan cannot say what it would retire.
  for (const p of inv.plugins) {
    assert.equal(typeof p.id, 'string')
    assert.ok(Array.isArray(p.names))
    assert.equal(p.names.length, p.count)
  }
})
