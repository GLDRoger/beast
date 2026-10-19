import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, readlinkSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { REPO, PAYLOAD, SKILL_MIRRORS } from '../lib/manifest.mjs'
import { PACKS } from '../lib/packs.mjs'
import { entries, skillEntries } from '../lib/fsutil.mjs'
import { checkSkillStrays } from '../lib/checks/strays.mjs'
import { skillMirrors, workflowEntries } from '../lib/skill-paths.mjs'
import { symlinkType } from '../lib/platform.mjs'

const home = (t) => {
  const p = mkdtempSync(join(tmpdir(), 'beast-skills-'))
  t.after(() => rmSync(p, { recursive: true, force: true }))
  return p
}
const skill = (root, name, declared = name) => {
  const p = join(root, name)
  mkdirSync(p, { recursive: true })
  writeFileSync(join(p, 'SKILL.md'), `---\nname: ${declared}\ndescription: Test skill.\n---\n`)
  return p
}
const run = (h, args) => spawnSync(process.execPath, [join(REPO, 'bin/beast.mjs'), ...args], {
  encoding: 'utf8', env: { ...process.env, HOME: h, USERPROFILE: h },
})
const inspect = (h, targets) => {
  const warnings = []
  const result = checkSkillStrays({ homeDir: h, targets, externalDirs: [], warn: (m) => warnings.push(m), info: () => {} })
  return { warnings, ...result }
}

test('a full install exposes exactly eight workflows and keeps modules in their library', (t) => {
  const h = home(t)
  const r = run(h, ['install', '--all'])
  assert.equal(r.status, 0, r.stdout + r.stderr)
  const roots = ['.agents/skills', ...SKILL_MIRRORS.map((m) => m.home)]
  for (const rel of roots) {
    const dir = join(h, rel)
    assert.deepEqual(skillEntries(dir).map((e) => e.name).sort(), [...PACKS.core.skills].sort(), rel)
    for (const name of PACKS.core.skills) {
      assert.equal(readlinkSync(join(dir, name)), join(PAYLOAD, 'agents/skills', name))
      assert.ok(existsSync(join(dir, name, 'SKILL.md')))
    }
  }
  for (const rel of ['.codex/skills', '.grok/skills', '.gemini/skills']) {
    assert.deepEqual(entries(join(h, rel)), [], 'shared-root readers need no redundant mirrors')
  }
  assert.ok(existsSync(join(h, '.agents/skill-modules/taste-craft/SKILL.md')))
  assert.ok(existsSync(join(h, '.agents/skill-modules/unslop/SKILL.md')))
})

test('workflow filtering rejects a module accidentally exposed in the payload', (t) => {
  const h = home(t)
  skill(h, 'code')
  skill(h, 'taste-craft')
  assert.deepEqual(workflowEntries(h).map((e) => e.name), ['code'])
  assert.equal(run(h, ['skills', 'add', 'taste-craft']).status, 1)
  assert.equal(run(h, ['skills', 'rm', 'code']).status, 1)
})

test('configured Hermes uses the shared root, fresh Hermes gets a separate vendor-safe subtree', (t) => {
  const h = home(t)
  assert.ok(skillMirrors({ homeDir: h, externalDirs: [] }).some((m) => m.home === '.hermes/skills/beast'))
  assert.equal(skillMirrors({ homeDir: h, externalDirs: [join(h, '.agents/skills')] }).some((m) => m.target === 'hermes'), false)
  const bundled = skill(join(h, '.hermes/skills/code'), 'vendor-helper')
  assert.equal(run(h, ['install', '--harness=hermes']).status, 0)
  assert.ok(existsSync(join(bundled, 'SKILL.md')), 'bundled category must not be displaced')
  assert.ok(existsSync(join(h, '.hermes/skills/beast/frontend/SKILL.md')))
})

test('reinstall retires old owned module and legacy mirror links but preserves foreign links', (t) => {
  const h = home(t)
  const root = join(h, '.codex/skills')
  mkdirSync(root, { recursive: true })
  const src = join(PAYLOAD, 'agents/skill-modules/taste-craft')
  symlinkSync(src, join(root, 'taste-craft'), symlinkType(src))
  const foreign = skill(join(h, 'foreign'), 'private-helper')
  symlinkSync(foreign, join(root, 'private-helper'), symlinkType(foreign))
  const r = run(h, ['install', '--harness=codex'])
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assert.equal(entries(root).some((e) => e.name === 'taste-craft'), false)
  assert.equal(existsSync(join(root, 'private-helper')), true)
})

test('stray modules, broken links, and unmanaged real directories are warnings, never failures', (t) => {
  const h = home(t)
  const root = join(h, '.claude/skills')
  const src = join(PAYLOAD, 'agents/skill-modules/unslop')
  mkdirSync(root, { recursive: true })
  symlinkSync(src, join(root, 'renamed-module'), symlinkType(src))
  symlinkSync(join(PAYLOAD, 'missing-skill'), join(root, 'broken'), symlinkType(src))
  skill(root, 'unmanaged')
  mkdirSync(join(root, 'unmanaged-without-skill'), { recursive: true })
  mkdirSync(join(root, 'synced'), { recursive: true })
  mkdirSync(join(h, '.codex/skills/.system'), { recursive: true })
  const r = inspect(h, ['claude'])
  assert.equal(r.exposed.length, 1)
  assert.equal(r.broken.length, 1)
  assert.equal(r.unmanaged.length, 2)
  assert.match(r.warnings.join('\n'), /module exposed as a top-level skill/)
  assert.match(r.warnings.join('\n'), /broken skill symlink/)
  assert.match(r.warnings.join('\n'), /unmanaged real directory/)
})

test('duplicate frontmatter names are reported only within one harness discovery scope', (t) => {
  const h = home(t)
  skill(join(h, '.agents/skills'), 'first-folder', 'same-name')
  skill(join(h, '.codex/skills'), 'second-folder', 'same-name')
  skill(join(h, '.claude/skills'), 'claude-only', 'same-name')
  let r = inspect(h, ['codex', 'claude'])
  assert.deepEqual(r.duplicates.map((d) => [d.harness, d.name]), [['codex', 'same-name']])
  mkdirSync(join(h, '.grok'), { recursive: true })
  writeFileSync(join(h, '.grok/config.toml'), '[skills]\nignore = ["~/.claude/skills"]\npaths = ["~/.agents/skills"]\n')
  r = inspect(h, ['grok'])
  assert.deepEqual(r.duplicates, [], 'ignored Claude compatibility tree must not produce false positives')
})

test('doctor stays healthy when an extra broken skill link is present', (t) => {
  const h = home(t)
  assert.equal(run(h, ['install', '--harness=codex', '--packs=core']).status, 0)
  const src = join(PAYLOAD, 'agents/skills/frontend')
  symlinkSync(join(PAYLOAD, 'not-here'), join(h, '.agents/skills/broken-extra'), symlinkType(src))
  const r = run(h, ['doctor'])
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assert.match(r.stdout, /broken skill symlink/)
  assert.match(r.stdout, /healthy \(with warnings\)/)
})

test('a configured shared Hermes root is read through its native config parser on reinstall', (t) => {
  if (process.platform === 'win32') return t.skip('POSIX executable fixture')
  const h = home(t)
  const bin = join(h, 'bin')
  mkdirSync(bin, { recursive: true })
  mkdirSync(join(h, '.hermes'), { recursive: true })
  writeFileSync(join(h, '.hermes/config.yaml'), 'skills:\n  external_dirs: ~/.agents/skills\n')
  const cli = join(bin, 'hermes')
  writeFileSync(cli, '#!/usr/bin/env node\nif (process.argv.slice(2).join(" ") !== "config get skills.external_dirs --json") process.exit(2);\nconsole.log(JSON.stringify(process.env.HOME + "/.agents/skills"));\n', { mode: 0o755 })
  const r = spawnSync(process.execPath, [join(REPO, 'bin/beast.mjs'), 'install', '--harness=hermes'], {
    encoding: 'utf8', env: { ...process.env, HOME: h, USERPROFILE: h, PATH: bin + ':' + process.env.PATH },
  })
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assert.ok(existsSync(join(h, '.agents/skills/frontend/SKILL.md')))
  assert.equal(existsSync(join(h, '.hermes/skills/beast/frontend')), false, 'external shared discovery must not be duplicated')
})

test('deliberately excluded private modules and tool-owned collections are not unmanaged strays', (t) => {
  const h = home(t)
  skill(join(h, '.agents/skill-modules'), 'avalon-operating-pack')
  skill(join(h, '.agents/skill-modules'), 'questili-ops-launch')
  skill(join(h, '.claude/skills/synced'), 'vendor-skill')
  skill(join(h, '.codex/skills/.system'), 'vendor-skill')
  const r = inspect(h, ['claude', 'codex'])
  assert.deepEqual(r.unmanaged, [])
  assert.deepEqual(r.warnings, [])
})
