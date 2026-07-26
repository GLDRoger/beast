#!/usr/bin/env node
/**
 * Run the test suites that ship inside the vendored skills, and gate on them.
 *
 * The previous command was:
 *
 *   node --test home/agents/skill-modules/ ** / *.test.* || true
 *
 * which was broken twice over. npm hands the script to /bin/sh, where `**` is an
 * ordinary glob — it matched exactly ONE of the 57 test files. And `|| true` discarded
 * the exit code, so the one file it did run could fail and still report success.
 * Measured: `npm run test:vendored` was "0 passed, 1 failed, exit 0" while the real
 * suite was 402 passed, 7 failed, exit 1.
 *
 * So: enumerate in Node (no shell globbing), run every file, and exit non-zero on any
 * failure that is not in KNOWN_FAILURES below. A known failure that starts PASSING is
 * also an error — otherwise the list rots into a permanent excuse.
 *
 *   node scripts/test-vendored.mjs [--list]
 */
import { spawnSync } from 'node:child_process'
import { relative } from 'node:path'
import { PAYLOAD, inPayload } from '../lib/manifest.mjs'
import { walk, c } from '../lib/fsutil.mjs'

/**
 * Vendored tests that cannot pass in this repository, each with the reason.
 *
 * Every entry is a test asserting something about the upstream monorepo or about assets
 * whose terms or availability kept them out of the payload. None of them is a defect in
 * beast's own code, and none can be fixed by editing this repo — which is exactly why
 * each one needs a written reason rather than a silent `|| true`.
 *
 * Keys are `<payload-relative test file>` → array of failing test names.
 */
const KNOWN_FAILURES = {
  'agents/skill-modules/media-use/scripts/lib/lut-preset-provider.test.mjs': {
    'preset IDs stay in sync with packages/core/src/colorGrading.ts':
      'reads packages/core/src/colorGrading.ts from the HyperFrames monorepo, four levels up. ' +
      'A vendored skill has no such ancestor, so the source of truth it compares against is absent.',
  },
  'agents/skill-modules/pr-to-video/scripts/frame-contract.test.mjs': {
    'Claude preset stages renderer-parity fonts for an empty PR token set':
      'the `claude` frame preset is not in the vendored hyperframes-creative copy (13 presets ship, ' +
      'none named claude) and is not in the hyperframes npm package either — it comes from the ' +
      'skills bundle. pr-to-video fixes its style to that preset, so Step 2 cannot complete. ' +
      'Recover it with `npx hyperframes skills update pr-to-video` in a scratch directory.',
    'bundled Claude font licenses are shipped beside the assets':
      'same missing preset — the OFL license files live inside it.',
  },
  'agents/skill-modules/talking-head-recut/media-contract.test.mjs': {
    'canonical composition preserves source audio as a root media track':
      'asserts SKILL.md contains a canonical composition block with <video id="bg-video">. ' +
      'The vendored SKILL.md was rewritten upstream and now only names #source-audio in prose, ' +
      'so the contract test outlived the document it checks.',
  },
}

const files = [...walk(PAYLOAD)]
  .filter(([, rel]) => /\.test\.(mjs|js|cjs)$/.test(rel))
  .map(([, rel]) => rel)
  .sort()

if (process.argv.includes('--list')) {
  for (const f of files) console.log(f)
  process.exit(0)
}

if (!files.length) {
  console.error(c.red('no vendored test files found — check the payload is populated'))
  process.exit(1)
}

/** Top-level `not ok N - name` lines from node's TAP reporter. */
const failedNames = (tap) =>
  tap.split('\n')
    .map((l) => l.match(/^not ok \d+ - (.+?)(?:\s+#.*)?$/))
    .filter(Boolean)
    .map((m) => m[1].trim())

let pass = 0
const unexpected = []     // [file, name]
const expected = []       // [file, name]
const fixed = []          // [file, name] — known failure that now passes

for (const rel of files) {
  const res = spawnSync(process.execPath, ['--test', '--test-reporter=tap', inPayload(rel)], {
    encoding: 'utf8',
    cwd: PAYLOAD,
  })
  const known = KNOWN_FAILURES[rel] ?? {}
  const failing = new Set(failedNames(res.stdout ?? ''))

  for (const name of failing) {
    if (name in known) expected.push([rel, name])
    else unexpected.push([rel, name])
  }
  for (const name of Object.keys(known)) {
    if (!failing.has(name)) fixed.push([rel, name])
  }

  // A file that dies before reporting anything (import error, syntax error) produces no
  // `not ok` lines at all. Non-zero exit with no parsed failure is that case.
  if (res.status !== 0 && !failing.size) {
    unexpected.push([rel, `file did not run: ${(res.stderr ?? '').trim().split('\n').slice(-1)[0] || `exit ${res.status}`}`])
  }
  if (res.status === 0) pass++
  process.stdout.write(res.status === 0 ? c.green('.') : c.red('F'))
}

console.log(`\n\n${files.length} vendored test file(s), ${pass} clean`)

if (expected.length) {
  console.log(`\n${c.yellow(`${expected.length} known failure(s)`)} — vendoring limits, not regressions:`)
  for (const [file, name] of expected) {
    console.log(`  ${c.dim(relative(PAYLOAD, inPayload(file)))}`)
    console.log(`    ${name}`)
    console.log(`    ${c.dim(KNOWN_FAILURES[file][name])}`)
  }
}

if (fixed.length) {
  console.log(`\n${c.red(`${fixed.length} known failure(s) now PASS`)} — remove them from KNOWN_FAILURES:`)
  for (const [file, name] of fixed) console.log(`  ${file} :: ${name}`)
}

if (unexpected.length) {
  console.log(`\n${c.red(`${unexpected.length} unexpected failure(s)`)}:`)
  for (const [file, name] of unexpected) console.log(`  ${file} :: ${name}`)
  console.log(c.dim(`\n  re-run one file: node --test home/${unexpected[0][0]}`))
}

if (!unexpected.length && !fixed.length) console.log(`\n${c.green('✓')} no unexpected failures`)
process.exit(unexpected.length || fixed.length ? 1 : 0)
