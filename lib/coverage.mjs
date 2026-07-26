import { readFileSync } from 'node:fs'
import { join, extname } from 'node:path'
import { inPayload } from './manifest.mjs'
import { walk, skillEntries } from './fsutil.mjs'
import { packSkills, packOf, REQUIRED_PACKS } from './packs.mjs'

/**
 * What a pack selection leaves unreachable.
 *
 * The routers reference modules through lookup TABLES (`| module | path |`), not
 * imperative "Read this" lines — verified: zero imperative load lines across the nine
 * routers. So a module that is not installed degrades a router's menu rather than
 * breaking it, which is why a partial install is allowed at all.
 *
 * But it is still a real loss, and silently shipping a router whose table is 90%
 * dead is worse than either refusing or installing everything. This computes the
 * damage so install, doctor, and the interactive prompt can all state it in the same
 * terms instead of each guessing.
 */

const TEXT = new Set(['.md', '.txt'])
const REF = /~\/\.agents\/skill-(?:modules|s)\/([A-Za-z0-9._-]+)/g

/** Module names referenced from a skill's own text. */
function referencesOf(skillDir) {
  const found = new Set()
  for (const [abs] of walk(skillDir)) {
    if (!TEXT.has(extname(abs))) continue
    let text
    try { text = readFileSync(abs, 'utf8') } catch { continue }
    for (const m of text.matchAll(REF)) {
      // Placeholders in prose would otherwise be counted as real modules.
      if (!/[<>${}*]/.test(m[1])) found.add(m[1])
    }
  }
  return found
}

/**
 * @returns {{ installed: string[], missing: Map<string, {pack: string|null, from: string[]}> }}
 * `missing` is keyed by module name so one absent module referenced by six routers is
 * reported once, not six times.
 */
export function coverage(packs) {
  const chosen = [...new Set([...REQUIRED_PACKS, ...packs])]
  const installed = new Set(packSkills(chosen))

  const active = skillEntries(inPayload('agents/skills')).map((e) => e.name)
  const missing = new Map()

  for (const name of active) {
    if (!installed.has(name)) continue          // this skill is not being installed
    for (const ref of referencesOf(join(inPayload('agents/skills'), name))) {
      if (installed.has(ref)) continue          // resolves
      if (!missing.has(ref)) missing.set(ref, { pack: packOf(ref), from: [] })
      missing.get(ref).from.push(name)
    }
  }
  return { installed: [...installed], missing }
}

/** Packs that would resolve the gaps, with how many modules each accounts for. */
function missingByPack(missing) {
  const byPack = new Map()
  for (const [mod, { pack }] of missing) {
    const key = pack ?? 'unknown'
    if (!byPack.has(key)) byPack.set(key, [])
    byPack.get(key).push(mod)
  }
  return [...byPack].sort((a, b) => b[1].length - a[1].length)
}

/** One-line summary, or null when the selection is fully self-consistent. */
export function coverageWarning(packs) {
  const { missing } = coverage(packs)
  if (!missing.size) return null
  const byPack = missingByPack(missing)
  const total = missing.size
  const detail = byPack.map(([p, mods]) => `${p} (${mods.length})`).join(', ')
  return {
    total,
    byPack,
    line: `${total} module reference${total === 1 ? '' : 's'} in the installed skills will not resolve — add: ${detail}`,
  }
}
