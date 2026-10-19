import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, symlinkSync, rmSync, lstatSync, realpathSync, readlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { linkFile, skillEntries, isJunk } from '../lib/fsutil.mjs'
import { EXCLUDE_PATHS, EXCLUDE_SKILLS, REPO } from '../lib/manifest.mjs'
import {
  BUDGET_FRACTION, CHARS_PER_TOKEN, CONTEXT_TOKENS, MAX_DESC_CHARS,
  entryCost, listingBudget, listingChars, fractionFor, frontmatter, maxDescChars,
} from '../lib/listing.mjs'

const tmp = () => mkdtempSync(join(tmpdir(), 'beast-'))

test('every harness reads one shared Beast prompt and one shared user file', () => {
  const read = (rel) => readFileSync(join(REPO, 'home', rel), 'utf8')
  const beast = read('shared/BEAST.md')
  const user = read('shared/USER.md')
  for (const h of ['claude', 'codex', 'grok']) assert.equal(read(`${h}/BEAST.v2.md`), beast, `${h} Beast drifted`)
  for (const f of ['claude/CLAUDE.md', 'codex/AGENTS.md', 'grok/AGENTS.md']) assert.equal(read(f), user, `${f} drifted`)

  // Grok truncates each rules file at 10,000 characters; Beast reaches it as ~/.grok/AGENT.md.
  assert.ok([...beast].length <= 10_000, `Beast is ${[...beast].length} chars; Grok truncates past 10,000`)
  assert.ok([...user].length <= 10_000, `user file is ${[...user].length} chars; Grok truncates past 10,000`)
  assert.match(user, /^## Model routing$/m)
  assert.doesNotMatch(user, /delegation\.md/, 'the user file is self-contained')
  assert.match(beast, /^## Delegation$/m)
  for (const principle of [
    'First principles', 'KISS (Keep It Simple)', "YAGNI (You Aren't Gonna Need It)",
    'Falsification', 'Reversibility', "Chesterton's fence", 'Systems thinking',
  ]) {
    assert.match(beast, new RegExp(principle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})

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

test('frontmatter reads inline, folded and quoted descriptions', () => {
  const d = tmp()
  const a = join(d, 'a'); mkdirSync(a)
  writeFileSync(join(a, 'SKILL.md'), 'name: a\ndescription: plain inline text\n---\n')
  assert.equal(frontmatter(a).description, 'plain inline text')

  const b = join(d, 'b'); mkdirSync(b)
  writeFileSync(join(b, 'SKILL.md'), 'name: b\ndescription: >\n  folded over\n  two lines\nother: 1\n')
  assert.equal(frontmatter(b).description, 'folded over two lines')

  // A description is allowed to contain a colon; only the first one is the separator.
  const q = join(d, 'q'); mkdirSync(q)
  writeFileSync(join(q, 'SKILL.md'), '---\r\nname: q\r\ndescription: "Use for: a, b"\r\n---\r\n')
  assert.equal(frontmatter(q).description, 'Use for: a, b', 'CRLF and quotes')

  // YAML escapes: a doubled quote inside a single-quoted scalar is one character, and
  // billing it as two would overstate the entry. Real payload skills are written this way.
  const e = join(d, 'e'); mkdirSync(e)
  writeFileSync(join(e, 'SKILL.md'), '---\nname: e\ndescription: \'a composition\'\'s port\'\n---\n')
  assert.equal(frontmatter(e).description, "a composition's port")
  const f = join(d, 'f'); mkdirSync(f)
  writeFileSync(join(f, 'SKILL.md'), '---\nname: f\ndescription: "say \\"hi\\""\n---\n')
  assert.equal(frontmatter(f).description, 'say "hi"')

  const c = join(d, 'c'); mkdirSync(c)
  writeFileSync(join(c, 'SKILL.md'), 'name: c\n')
  assert.equal(frontmatter(c).description, undefined)
  rmSync(d, { recursive: true, force: true })
})

test('exclusion lists are non-empty — a silent empty list would ship everything', () => {
  assert.ok(EXCLUDE_SKILLS.length > 0)
  assert.ok(EXCLUDE_PATHS.length > 0)
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
  assert.match(s.line, /^\d+ skills, [\d,]+\/[\d,]+(–[\d,]+)? listing chars/)

  // The summary must agree with the check it is derived from. A hint that contradicts
  // `beast scan` is worse than no hint.
  const { checkSkillHygiene } = await import('../lib/checks/skills.mjs')
  const res = checkSkillHygiene({ fail: () => {}, warn: () => {}, info: () => {} })
  assert.equal(s.over, res.listing.over)
  assert.ok(s.line.startsWith(`${res.loaded} skills,`))
})

// --- the skill budget -----------------------------------------------------
// The unit is characters, not skills. Claude Code caps the listing it sends every turn
// at skillListingBudgetFraction x charsPerToken x contextWindow; going over shortens
// descriptions instead of dropping skills. These tests pin the arithmetic to the
// shipped behaviour, because a wrong budget is a fail nobody can act on.

test('an entry costs exactly what Claude Code renders for it', () => {
  const d = tmp()
  const a = join(d, 'router'); mkdirSync(a)
  writeFileSync(join(a, 'SKILL.md'), '---\nname: router\ndescription: picks a lane\n---\nbody\n')
  const one = entryCost(a, 'ignored-when-frontmatter-names-it')
  assert.equal(one.name, 'router')
  assert.equal(one.chars, '- router: picks a lane'.length)

  // whenToUse is appended to the description, the way OLt() composes it.
  const b = join(d, 'b'); mkdirSync(b)
  writeFileSync(join(b, 'SKILL.md'), '---\nname: b\ndescription: does x\nwhenToUse: when y\n---\n')
  assert.equal(entryCost(b, 'b').chars, '- b: does x - when y'.length)

  // A directory with no name: falls back to its own name, as Claude Code does.
  const c2 = join(d, 'fallback'); mkdirSync(c2)
  writeFileSync(join(c2, 'SKILL.md'), '---\ndescription: no name key\n---\n')
  assert.equal(entryCost(c2, 'fallback').name, 'fallback')

  // Long descriptions are truncated per entry, not billed in full.
  const long = join(d, 'long'); mkdirSync(long)
  writeFileSync(join(long, 'SKILL.md'), `---\nname: long\ndescription: ${'x'.repeat(40)}\n---\n`)
  assert.equal(entryCost(long, 'long', 10).chars, '- long: '.length + 10)

  // The listing joins entries with newlines, so n entries carry n-1 extra chars.
  assert.equal(listingChars([{ chars: 10 }, { chars: 20 }]), 31)
  assert.equal(listingChars([]), 0)
  rmSync(d, { recursive: true, force: true })
})

test('the listing budget comes from settings, the env, or the documented default', () => {
  // A machine that took beast's own advice would otherwise fail this test.
  const preset = process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET
  delete process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET
  try {
  const dflt = listingBudget(null)
  // Both ends are live: kC() gives 3 chars/token on current models and 4 on the older
  // set it hard-codes, and beast cannot know which model a session will run.
  assert.equal(dflt.chars, BUDGET_FRACTION * CHARS_PER_TOKEN * CONTEXT_TOKENS)
  assert.equal(dflt.chars, 6000, 'default on a current model: 1% of 200k at 3 chars/token')
  assert.equal(dflt.charsHigh, 8000, 'default up to sonnet-4-6: the same at 4 chars/token')
  assert.equal(dflt.source, 'default')
  assert.equal(dflt.invalid, false)

  const raised = listingBudget({ skillListingBudgetFraction: 0.02 })
  assert.equal(raised.chars, 12000)
  assert.equal(raised.charsHigh, 16000)
  assert.equal(raised.source, 'settings.json')

  // Claude Code's schema takes a number in (0, 1]. Anything else is ignored there, so
  // beast must report the default it actually gets rather than the value in the file.
  for (const bad of ['0.02', 0, 2, null]) {
    const r = listingBudget({ skillListingBudgetFraction: bad })
    assert.equal(r.chars, 6000, `${JSON.stringify(bad)} must fall back to the default`)
    assert.equal(r.invalid, bad !== null, `${JSON.stringify(bad)} invalid flag`)
  }

  // An absolute budget in the environment beats the settings key inside Claude Code, and
  // scales with nothing, so both ends of the range collapse onto it.
  process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET = '4321'
  const env = listingBudget({ skillListingBudgetFraction: 0.5 })
  assert.equal(env.chars, 4321, 'the env override wins, as it does in the CLI')
  assert.equal(env.charsHigh, 4321)
  assert.equal(env.source, 'SLASH_COMMAND_TOOL_CHAR_BUDGET')
  // A fractional value floors to 0 without a guard, and every later percentage then
  // divides by it.
  process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET = '0.5'
  assert.equal(listingBudget(null).chars, 1, 'a 0-char budget would make every ratio Infinity')
  delete process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET

  // The remediation beast prints has to fit the listing at the tighter rate, or it is
  // advice that leaves the user truncated.
  assert.equal(fractionFor(6000), 0.01)
  assert.equal(fractionFor(6001), 0.02)
  assert.equal(fractionFor(12000), 0.02)
  for (const n of [6001, 12001, 40_000]) {
    assert.ok(fractionFor(n) * CHARS_PER_TOKEN * CONTEXT_TOKENS >= n, `${n} must actually fit`)
  }
  assert.equal(fractionFor(9e9), 1, 'the fraction is capped at the whole window')

  assert.equal(MAX_DESC_CHARS, 1536)
  assert.equal(maxDescChars({ skillListingMaxDescChars: 0.5 }), 1,
    'a sub-1 cap floors to 0 and then slice(0, -1) truncates nothing')
  assert.equal(maxDescChars({ skillListingMaxDescChars: 900 }), 900)
  } finally {
    if (preset === undefined) delete process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET
    else process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET = preset
  }
})

test('nothing in lib still enforces a skill count cap', () => {
  // The 30-skill cap was never Claude Code's rule. It blocked `beast skills add` and
  // failed doctor on skills beast does not own, so a plugin could make doctor
  // permanently red with no beast-side fix.
  for (const f of ['manifest.mjs', 'skills.mjs', 'doctor.mjs', 'scan.mjs', 'checks/skills.mjs']) {
    const src = readFileSync(new URL(`../lib/${f}`, import.meta.url), 'utf8')
    assert.equal(/SKILL_CAP/.test(src), false, `${f} still references a count cap`)
  }
})

test('doctor and scan read one budget measurement, and it adds up', async () => {
  const { checkSkillHygiene } = await import('../lib/checks/skills.mjs')
  const res = checkSkillHygiene({ fail: () => {}, warn: () => {}, info: () => {} })
  const lst = res.listing

  assert.equal(lst.rows.length, res.loaded, 'one measured row per loaded skill')
  assert.equal(lst.chars, listingChars(lst.rows), 'the total must be the sum of its rows')
  assert.ok(lst.budget <= lst.budgetHigh)
  // Severity follows certainty: `over` means truncated on any 200k model, `tight` only
  // on a current one. doctor fails on the first and warns on the second.
  assert.equal(lst.over, lst.chars > lst.budgetHigh)
  assert.equal(lst.tight, lst.chars > lst.budget)
  assert.equal(lst.pct, Math.round((lst.chars / lst.budget) * 100))
  assert.ok(lst.beastChars <= lst.chars, 'beast\'s share cannot exceed the whole listing')
  // Ranked for `beast scan`, which prints the top entries by cost.
  for (let i = 1; i < lst.rows.length; i++) assert.ok(lst.rows[i - 1].chars >= lst.rows[i].chars)
})

test('the loaded set is resolved per listing name, against a fixture $HOME', async () => {
  // The rewritten resolution logic, on disk rather than against the live $HOME: which
  // names load, which are dark, what each costs, and who shadows whom. The previous
  // version of this code matched plugin ids by substring, so a fixture with deliberately
  // overlapping ids ("p2" inside "p2extra") is the regression it guards.
  const { checkSkillHygiene } = await import('../lib/checks/skills.mjs')
  const home = tmp()
  const mk = (dir, name, desc) => {
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'SKILL.md'), `---\nname: ${name}\ndescription: ${desc}\n---\nbody\n`)
  }
  mk(join(home, '.claude/skills/lane'), 'lane', 'picks a lane')
  // A directory whose frontmatter claims another name. Claude Code keys the listing on
  // the frontmatter name, so this shadows the plugin's `shared` and must be reported
  // under `shared`, once.
  mk(join(home, '.claude/skills/helper'), 'shared', 'the home copy')
  mk(join(home, 'plug/p1/skills/shared'), 'shared', 'the plugin copy')
  mk(join(home, 'plug/p2/skills/ghost'), 'ghost', 'only from a disabled plugin')
  // Same name as the home copy, but inside the disabled plugin: shadows nothing.
  mk(join(home, 'plug/p2/skills/lane'), 'lane', 'a cached copy that does not load')
  mk(join(home, 'plug/p2extra/skills/extra'), 'extra', 'from the plugin whose id contains the other')
  mkdirSync(join(home, '.claude/plugins'), { recursive: true })
  writeFileSync(join(home, '.claude/plugins/installed_plugins.json'), JSON.stringify({
    plugins: {
      'p1@m': [{ installPath: join(home, 'plug/p1') }],
      'p2@m': [{ installPath: join(home, 'plug/p2') }],
      'p2extra@m': [{ installPath: join(home, 'plug/p2extra') }],
    },
  }))
  writeFileSync(join(home, '.claude/settings.json'), JSON.stringify({ enabledPlugins: { 'p2@m': false } }))

  const warnings = []
  const res = checkSkillHygiene({ fail: () => {}, warn: (m) => warnings.push(m), info: () => {}, homeDir: home })

  assert.deepEqual(res.listing.rows.map((r) => r.name).sort(), ['extra', 'lane', 'shared'])
  assert.equal(res.loaded, 3, '`ghost` comes only from the disabled plugin')
  assert.equal(res.total, 4)
  assert.equal(res.managed, 0, 'nothing here links into the payload')

  // `shared` is one line, priced from the home copy, and the collision is reported.
  const shared = res.listing.rows.find((r) => r.name === 'shared')
  assert.equal(shared.chars, '- shared: the home copy'.length)
  assert.equal(shared.plugin, null)
  assert.deepEqual(res.inventory.duplicates.map((d) => d.name), ['shared'],
    '`lane` is also provided twice, but only one of those providers loads')
  assert.match(warnings.join('\n'), /skill name "shared" provided 2x/)
  assert.equal(/"lane" provided/.test(warnings.join('\n')), false)
  // `lane` still loads, priced from the home copy rather than the disabled plugin's.
  assert.equal(res.listing.rows.find((r) => r.name === 'lane').chars, '- lane: picks a lane'.length)
  // The dir name never becomes a listing name.
  assert.equal(res.listing.rows.some((r) => r.name === 'helper'), false)

  // The enabled plugin whose id merely contains a disabled one's still loads.
  assert.equal(res.listing.rows.find((r) => r.name === 'extra').plugin, 'p2extra@m')

  const expect = ['- lane: picks a lane', '- shared: the home copy',
    '- extra: from the plugin whose id contains the other']
  assert.equal(res.listing.chars, expect.reduce((n, s) => n + s.length, 0) + 2, 'entries plus two newlines')
  rmSync(home, { recursive: true, force: true })
})

test('a malformed settings.json is reported, not silently defaulted', async () => {
  const { checkSkillHygiene } = await import('../lib/checks/skills.mjs')
  const home = tmp()
  mkdirSync(join(home, '.claude'), { recursive: true })
  writeFileSync(join(home, '.claude/settings.json'), '{ "enabledPlugins": ')
  const warnings = []
  checkSkillHygiene({ fail: () => {}, warn: (m) => warnings.push(m), info: () => {}, homeDir: home })
  assert.match(warnings.join('\n'), /settings\.json is not valid JSON/)
  rmSync(home, { recursive: true, force: true })
})

test('frontmatter is read once, by one parser', () => {
  const d = tmp()
  const a = join(d, 'a'); mkdirSync(a)
  writeFileSync(join(a, 'SKILL.md'), '---\nname: a\ndescription: |\n  first\n  second\nallowed-tools: Read\n---\nbody: not frontmatter\n')
  const fm = frontmatter(a)
  assert.equal(fm.name, 'a')
  assert.equal(fm.description, 'first second')
  assert.equal(fm['allowed-tools'], 'Read')
  assert.equal(fm.body, undefined, 'the body must not leak into frontmatter')
  assert.deepEqual(frontmatter(join(d, 'missing')), {})
  rmSync(d, { recursive: true, force: true })
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
