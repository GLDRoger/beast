import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir, homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { walk, skillEntries } from '../lib/fsutil.mjs'
import { packOf, PACK_NAMES } from '../lib/packs.mjs'
import { coverage } from '../lib/coverage.mjs'

// Skills point at each other by absolute path. Pack selection gates BOTH skill
// trees, so a router installed by `core` can name a module only `design` ships —
// and the reference dangles with nothing on any code path noticing.

const BIN = fileURLToPath(new URL('../bin/beast.mjs', import.meta.url))
const IS_WINDOWS = process.platform === 'win32'

/** Every `~/.agents/skills/x` or `~/.agents/skill-modules/x` a skill file names. */
const REF = /~\/\.agents\/(skills|skill-modules)\/([A-Za-z0-9._-]+)/g

const scratchHome = () => mkdtempSync(join(tmpdir(), 'beast-home-'))

function runInstall(home, packs) {
  const r = spawnSync(process.execPath, [BIN, 'install', `--packs=${packs.join(',')}`], {
    env: { ...process.env, HOME: home, USERPROFILE: home },
    encoding: 'utf8',
  })
  assert.equal(r.status, 0, `install --packs=${packs} exited ${r.status}\n${r.stdout}\n${r.stderr}`)
  return r
}

/**
 * Read every installed skill's markdown out of the scratch $HOME and resolve each
 * reference against that same $HOME. Returns all refs seen plus the broken ones.
 */
function auditRefs(home) {
  const skillsRoot = join(home, '.agents', 'skills')
  const refs = []
  const dangling = new Map()

  for (const e of skillEntries(skillsRoot)) {
    for (const [abs] of walk(join(skillsRoot, e.name))) {
      if (!abs.endsWith('.md')) continue
      for (const [, tree, name] of readFileSync(abs, 'utf8').matchAll(REF)) {
        refs.push(`${e.name} → ~/.agents/${tree}/${name}`)
        // existsSync follows the link, so a link to a pruned module reads as absent.
        if (existsSync(join(home, '.agents', tree, name))) continue
        dangling.set(`${e.name}|${tree}|${name}`,
          `${e.name} → ~/.agents/${tree}/${name} (would come from pack: ${packOf(name) ?? 'NONE'})`)
      }
    }
  }
  return { refs, dangling: [...dangling.values()].sort() }
}

const SELECTIONS = [['core'], ['core', 'prose'], ['core', 'design'], PACK_NAMES]

/**
 * A partial selection intentionally leaves references dangling: the routers reach
 * modules through advisory lookup TABLES, not imperative "read this" lines, so a
 * missing module narrows a router's menu rather than breaking it. Asserting zero
 * dangling references would therefore fail forever by design — and a permanently red
 * test is one you learn to ignore.
 *
 * What must hold instead is that the gap is REPORTED accurately. So this asserts the
 * measured dangling set matches `coverage()`'s prediction exactly, in both directions.
 * That keeps install's warning honest: if the calculator drifts from reality, this
 * fails, which is the failure worth catching.
 */
for (const packs of SELECTIONS) {
  test(`--packs=${packs.join(',')} — coverage() predicts the dangling set exactly`, (t) => {
    if (IS_WINDOWS) return t.skip('symlink creation may need elevation on Windows')

    const home = scratchHome()
    try {
      // Never assert against the real machine: if the child ignored HOME we would be
      // reading the developer's own ~/.agents and calling it a result.
      assert.notEqual(home, homedir(), 'scratch HOME collided with the real one')
      const probe = spawnSync(process.execPath, ['-p', 'require("os").homedir()'],
        { env: { ...process.env, HOME: home, USERPROFILE: home }, encoding: 'utf8' })
      assert.equal(probe.stdout.trim(), home, 'child process did not honour HOME — refusing to test')

      runInstall(home, packs)

      const installed = skillEntries(join(home, '.agents', 'skills')).map((e) => e.name)
      assert.ok(installed.length > 0, `nothing installed into ${home} — the audit below would be vacuous`)
      assert.equal(existsSync(join(homedir(), '.agents', 'skills', '__beast_test_canary__')), false)

      const { refs, dangling } = auditRefs(home)
      // A run that finds no references proves nothing, so fail loudly on that too.
      assert.ok(refs.length > 0, `no ~/.agents/... references found across ${installed.length} skills`)

      // Compare the modules actually unreachable on disk with the ones coverage()
      // predicted. Names only — the audit reports "skill → module" pairs while
      // coverage() dedupes by module, which is the right shape for a warning.
      const observed = [...new Set(dangling.map((d) => d.match(/~\/\.agents\/(?:skills|skill-modules)\/([A-Za-z0-9._-]+)/)?.[1]).filter(Boolean))].sort()
      const predicted = [...coverage(packs).missing.keys()].sort()

      assert.deepEqual(observed, predicted,
        `coverage() disagrees with reality for --packs=${packs.join(',')}\n`
        + `  observed ${observed.length}, predicted ${predicted.length}\n`
        + `  only on disk:      ${observed.filter((m) => !predicted.includes(m)).join(', ') || '—'}\n`
        + `  only in coverage(): ${predicted.filter((m) => !observed.includes(m)).join(', ') || '—'}`)

      // All-packs must genuinely resolve everything; otherwise the agreement above
      // could be two implementations sharing one bug.
      if (packs.length === PACK_NAMES.length) assert.deepEqual(observed, [], 'a full install must leave nothing dangling')
    } finally {
      rmSync(home, { recursive: true, force: true })
    }
  })
}
