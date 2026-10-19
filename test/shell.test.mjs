import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { REPO } from '../lib/manifest.mjs'

const hasZsh = spawnSync('zsh', ['--version']).status === 0
const hasJq = spawnSync('jq', ['--version']).status === 0
const shell = join(REPO, 'home/shell/beast.zsh')

test('Muse sync composes current sources once, preserves unrelated settings and file mode', { skip: !hasZsh || !hasJq }, () => {
  const home = mkdtempSync(join(tmpdir(), 'beast-shell-'))
  try {
    mkdirSync(join(home, '.config/muse'), { recursive: true })
    const file = join(home, '.config/muse/settings.json')
    writeFileSync(file, JSON.stringify({ run: { system_prompt: 'stale', other: 'keep' }, unrelated: true }), { mode: 0o600 })
    for (let i = 0; i < 2; i++) {
      const r = spawnSync('zsh', ['-fc', 'source "$1"; beast_muse_sync', 'test', shell], { encoding: 'utf8', env: { ...process.env, HOME: home } })
      assert.equal(r.status, 0, r.stdout + r.stderr)
    }
    const base = readFileSync(join(REPO, 'home/shared/BEAST.md'), 'utf8').trimEnd()
    const user = readFileSync(join(REPO, 'home/shared/USER.md'), 'utf8').trimEnd()
    assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')), { run: { system_prompt: base + '\n\n' + user, other: 'keep' }, unrelated: true })
    assert.equal(statSync(file).mode & 0o777, 0o600)
  } finally { rmSync(home, { recursive: true, force: true }) }
})

test('aug overrides the stale profile alias and passes both current rules files separately', { skip: !hasZsh }, () => {
  const r = spawnSync('zsh', ['-fc', 'alias aug="auggie --rules /stale/BEAST.md"; source "$1"; auggie() { printf "%s\\n" "$@"; }; aug "user argument"', 'test', shell], { encoding: 'utf8' })
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assert.deepEqual(r.stdout.trim().split('\n'), ['--rules', join(REPO, 'home/shared/BEAST.md'), '--rules', join(REPO, 'home/shared/USER.md'), 'user argument'])
})
