// Live skill hygiene is advisory: discovery collisions must not make doctor fail.
import { existsSync, readlinkSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'
import {
  HOME, PAYLOAD, HARNESS_NAMES, PRIVATE_SKILLS, SKILL_MIRROR_PATHS, LEGACY_SKILL_PATHS, inPayload,
} from '../manifest.mjs'
import { entries, skillEntries, tilde, underRepo } from '../fsutil.mjs'
import { frontmatter } from '../listing.mjs'
import { parseTomlFile } from '../toml.mjs'
import { hermesExternalDirs } from '../skill-paths.mjs'

/** Roots are per harness, not a union: Claude and Codex having a skill is not a duplicate. */
export function skillDiscoveryRoots(homeDir = HOME, externalDirs = hermesExternalDirs(homeDir)) {
  const at = (p) => join(homeDir, p)
  const grok = parseTomlFile(at('.grok/config.toml')).value ?? {}
  const expand = (p) => resolve(homeDir, p.replace(/^~(?=\/|$)/, homeDir))
  const ignored = (grok.skills?.ignore ?? []).filter((p) => typeof p === 'string').map(expand)
  const grokRoots = ['.agents/skills', '.grok/skills',
    ...(grok.compat?.claude?.skills === false || process.env.GROK_CLAUDE_SKILLS_ENABLED === 'false' ? [] : ['.claude/skills']),
    ...(grok.compat?.cursor?.skills === false || process.env.GROK_CURSOR_SKILLS_ENABLED === 'false' ? [] : ['.cursor/skills']),
  ].map(at).concat((grok.skills?.paths ?? []).filter((p) => typeof p === 'string').map(expand))
  return {
    claude: [at('.claude/skills')],
    codex: [at('.agents/skills'), at('.codex/skills')],
    grok: [...new Set(grokRoots)].filter((p) => !ignored.some((i) => p === i || p.startsWith(i + sep))),
    gemini: [at('.agents/skills'), at('.gemini/skills')],
    antigravity: [at('.gemini/config/skills')],
    'antigravity-cli': [at('.gemini/antigravity-cli/skills')],
    muse: [at('.agents/skills')],
    hermes: [at('.hermes/skills'), ...externalDirs],
  }
}

/** Recursive discovery includes vendor/category subtrees, but never dot directories. */
function discover(root, seen = new Set()) {
  if (seen.has(root)) return []
  seen.add(root)
  if (existsSync(join(root, 'SKILL.md'))) return [{ name: frontmatter(root).name ?? root.split(sep).at(-1), path: root }]
  return entries(root).filter((e) => !e.name.startsWith('.') && e.isDirectory())
    .flatMap((e) => discover(join(root, e.name), seen))
    .concat(skillEntries(root).filter((e) => e.isSymbolicLink()).map((e) => {
      const path = join(root, e.name)
      return { name: frontmatter(path).name ?? e.name, path }
    }))
}

export function checkSkillStrays({ warn, info, homeDir = HOME, targets = HARNESS_NAMES, externalDirs } = {}) {
  const at = (p) => join(homeDir, p)
  const modules = new Set(skillEntries(inPayload('agents/skill-modules')).flatMap((e) =>
    [e.name, frontmatter(join(inPayload('agents/skill-modules'), e.name)).name].filter(Boolean)))
  const roots = skillDiscoveryRoots(homeDir, externalDirs)
  const managed = new Set(['.agents/skills', '.agents/skill-modules', ...SKILL_MIRROR_PATHS, ...LEGACY_SKILL_PATHS].map(at))
  const top = new Set(Object.values(roots).flat())
  const broken = [], exposed = [], unmanaged = [], duplicates = []

  for (const root of new Set([...managed, ...top])) {
    for (const e of entries(root)) {
      const path = join(root, e.name)
      if (e.isSymbolicLink() && !existsSync(path)) {
        broken.push(path)
        warn(`broken skill symlink: ${tilde(path)}`)
        continue
      }
      if (e.name.startsWith('.')) continue
      // Vendor-owned collection roots are not stray skills; their installer owns them.
      const privateModule = root === at('.agents/skill-modules') && PRIVATE_SKILLS.includes(e.name)
      if (e.isDirectory() && managed.has(root) && !privateModule && !(root === at('.claude/skills') && e.name === 'synced')) {
        unmanaged.push(path)
        warn(`unmanaged real directory in beast-managed skill directory: ${tilde(path)}`)
      }
      const name = existsSync(join(path, 'SKILL.md')) ? frontmatter(path).name ?? e.name : e.name
      let dest = ''
      try { dest = resolve(root, readlinkSync(path)) } catch { /* a real directory */ }
      if (top.has(root) && (modules.has(name) || modules.has(e.name) || dest.startsWith(join(PAYLOAD, 'agents/skill-modules') + sep))) {
        exposed.push(path)
        warn(`module exposed as a top-level skill: ${tilde(path)} — load it from ~/.agents/skill-modules instead`)
      } else if (dest && underRepo(dest) && top.has(root) && !existsSync(join(path, 'SKILL.md')) && e.name !== 'README.md') {
        warn(`unexpected beast-managed skill link: ${tilde(path)}`)
      }
    }
  }

  for (const [harness, paths] of Object.entries(roots)) {
    if (!targets.includes(harness) && !(harness.startsWith('antigravity') && targets.includes('gemini'))) continue
    const byName = new Map()
    for (const { name, path } of paths.flatMap((p) => discover(p))) {
      if (!byName.has(name)) byName.set(name, new Set())
      byName.get(name).add(path)
    }
    for (const [name, providers] of byName) {
      if (providers.size < 2) continue
      duplicates.push({ harness, name, paths: [...providers] })
      warn(`${harness} skill name "${name}" present ${providers.size}x: ${[...providers].map(tilde).join(', ')}`)
    }
  }
  if (![broken, exposed, unmanaged, duplicates].some((a) => a.length)) info('skill discovery has no stray modules, duplicate names, broken links, or unmanaged directories')
  return { broken, exposed, unmanaged, duplicates }
}
