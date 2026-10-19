// Shared discovery roots avoid eight aliases per harness pointing at the same skills.
import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { HOME, SKILL_MIRRORS } from './manifest.mjs'
import { skillEntries } from './fsutil.mjs'
import { PACKS } from './packs.mjs'

/** Modules must never become top-level skills, even if an old payload exposes them. */
export const workflowEntries = (dir) =>
  skillEntries(dir).filter((e) => PACKS.core.skills.includes(e.name))

/** Use Hermes's own parser, not a second YAML implementation. No inference from names. */
export function hermesExternalDirs(homeDir = HOME) {
  const root = join(homeDir, '.hermes')
  if (!existsSync(join(root, 'config.yaml'))) return []
  try {
    const raw = JSON.parse(execFileSync('hermes', ['config', 'get', 'skills.external_dirs', '--json'], {
      encoding: 'utf8', timeout: 5000, maxBuffer: 64 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, HOME: homeDir, USERPROFILE: homeDir, HERMES_HOME: root },
    }))
    return (Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : [])
      .filter((v) => typeof v === 'string')
      .map((v) => resolve(root, v.replace(/^~(?=\/|$)/, homeDir)))
  } catch { return [] }
}

/** A configured shared root needs no native Hermes mirror. Fresh installs still work. */
export function skillMirrors({ homeDir = HOME, externalDirs = hermesExternalDirs(homeDir) } = {}) {
  const shared = join(homeDir, '.agents/skills')
  return SKILL_MIRRORS.filter((m) => m.target !== 'hermes' || !externalDirs.includes(shared))
}
