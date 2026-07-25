// Skill-count hygiene. beast's own cap check only counts what beast links, which is
// an undercount: Claude Code discovers plugin skills through a completely separate
// path, and those descriptions land in the same context budget. This check measures
// what the tool actually loads, not what we installed.

import { readFileSync, readlinkSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { SKILL_CAP, PAYLOAD, REPO, inHome } from '../manifest.mjs'
import { entries, skillEntries, lstat, tilde } from '../fsutil.mjs'

/** Claude's own skill dir. Its contents are loaded unconditionally. */
const CLAUDE_SKILLS = '.claude/skills'

/** Every dir beast links into. Foreign entries and dangling links are policed here. */
const SKILL_DIRS = [CLAUDE_SKILLS, '.codex/skills', '.agents/skills', '.agents/skill-modules']

/** Codex ships its own set. We do not manage it, but it costs Codex context. */
const CODEX_SYSTEM = '.codex/skills/.system'

const PLUGIN_CACHE = '.claude/plugins/cache'
const INSTALLED = '.claude/plugins/installed_plugins.json'
const SETTINGS = '.claude/settings.json'

const readJson = (p) => {
  try { return JSON.parse(readFileSync(p, 'utf8')) } catch { return null }
}

/**
 * Skill dirs in `dir`, plus any link that no longer resolves.
 *
 * skillEntries keeps symlinks without following them, so it also yields links to
 * FILES (agents/skills/README.md) and links to nothing. One stat separates all
 * three: a real directory counts, a throw means dangling.
 */
const scan = (dir) => {
  const skills = []
  const broken = []
  for (const e of skillEntries(dir)) {
    const p = join(dir, e.name)
    let st
    try { st = statSync(p) } catch { broken.push(p); continue }
    if (st.isDirectory()) skills.push({ name: e.name, path: p, link: e.isSymbolicLink() })
  }
  return { skills, broken }
}

/**
 * Where plugin skills live: `<installPath>/skills/*`, confirmed against this machine
 * as ~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/skills.
 *
 * installed_plugins.json is preferred over globbing that shape because it names the
 * ONE version that is live — a cache holding 4.8.3 next to 4.8.4 would otherwise
 * count every skill twice. The glob stays as a fallback for a missing manifest.
 */
function pluginSources() {
  const found = new Map()   // id -> skills dir
  const installed = readJson(inHome(INSTALLED))?.plugins
  if (installed) {
    for (const [id, installs] of Object.entries(installed)) {
      for (const i of installs ?? []) {
        if (i?.installPath) found.set(id, join(i.installPath, 'skills'))
      }
    }
  } else {
    const cache = inHome(PLUGIN_CACHE)
    for (const mkt of entries(cache).filter((e) => !e.name.startsWith('.'))) {
      for (const plug of entries(join(cache, mkt.name))) {
        for (const ver of entries(join(cache, mkt.name, plug.name))) {
          found.set(`${plug.name}@${mkt.name}`, join(cache, mkt.name, plug.name, ver.name, 'skills'))
        }
      }
    }
  }
  return found
}

export function checkSkillHygiene({ fail, warn, info }) {
  const managedPrefix = PAYLOAD              // links into the repo payload are ours

  // Scanned once and shared: CLAUDE_SKILLS feeds both the cap count and the
  // foreign/broken sweep, and a second scan would report its faults twice.
  const scanned = new Map(SKILL_DIRS.map((rel) => [rel, scan(inHome(rel))]))
  const home = scanned.get(CLAUDE_SKILLS)

  // --- what Claude Code actually loads --------------------------------------
  // name -> providing paths, so the cap count and the shadowing check share one pass.
  const byName = new Map()
  const add = (name, path) => byName.set(name, [...(byName.get(name) ?? []), path])
  for (const s of home.skills) add(s.name, s.path)

  const enabled = readJson(inHome(SETTINGS))?.enabledPlugins ?? {}
  const plugins = []
  for (const [id, dir] of pluginSources()) {
    const { skills, broken } = scan(dir)
    if (!skills.length) continue
    for (const s of skills) add(s.name, s.path)
    for (const b of broken) fail(`broken plugin skill link: ${tilde(b)}`)
    plugins.push({ id, count: skills.length, flagged: enabled[id] === false })
  }

  const total = byName.size
  const managed = home.skills.filter((s) => s.link && (readlink(s.path) ?? '').startsWith(managedPrefix)).length
  const pluginTotal = plugins.reduce((n, p) => n + p.count, 0)

  // Only skills that actually load count against the budget. A plugin present in the
  // cache but set false in enabledPlugins is not loaded, so counting it produces a
  // false failure — which is worse than the undercount it was guarding against,
  // because a spurious fail teaches you to ignore doctor. The disabled ones are still
  // reported below, just not billed.
  const disabledPluginSkills = plugins.filter((p) => p.flagged).reduce((n, p) => n + p.count, 0)
  const loaded = total - disabledPluginSkills

  if (loaded > SKILL_CAP) {
    fail(`${loaded} skills load into Claude Code, over the ${SKILL_CAP} cap — beast manages only ${managed} of them`)
  } else if (loaded > SKILL_CAP - 3) {
    warn(`${loaded}/${SKILL_CAP} loaded skills — close to the cap`)
  }
  if (disabledPluginSkills) {
    info(`${disabledPluginSkills} cached plugin skills are NOT counted because their plugin is disabled — re-enabling them would put you at ${total}/${SKILL_CAP}`)
  }

  // Name the sources beyond beast's own set, or the count above looks like a bug.
  // Deliberately not presented as a sum: a name provided twice counts once toward
  // `total` but shows up under both of its sources.
  const sources = [
    ...(home.skills.length - managed ? [`${home.skills.length - managed} unmanaged in ${CLAUDE_SKILLS}`] : []),
    ...plugins.map((p) => `${p.count} from plugin ${p.id}`),
  ]
  if (sources.length) info(`beyond beast's ${managed} managed skills: ${sources.join(', ')}`)

  // A plugin marked false in settings.json is NOT proof it stays out of context:
  // on this machine all three read false while their skills load anyway. Counted
  // above regardless — undercounting the budget is the failure mode that matters.
  const flagged = plugins.filter((p) => p.flagged)
  if (flagged.length) {
    // Whether a disabled-but-cached plugin loads cannot be determined from disk:
    // its skills are present either way. Both numbers are reported rather than
    // guessing, because a wrong guess in either direction is misleading — too high
    // is a false alarm, too low hides a real overage.
    info(`disabled in settings.json but still cached: ${flagged.map((p) => p.id).join(', ')} — a session started before they were disabled may still have them loaded`)
  }

  // --- shadowing ------------------------------------------------------------
  // Same name from two discovery paths: which one wins is not defined anywhere.
  const dupes = [...byName].filter(([, paths]) => paths.length > 1)
  for (const [name, paths] of dupes) {
    warn(`skill name "${name}" provided ${paths.length}x — one shadows the others: ${paths.map(tilde).join(', ')}`)
  }

  // --- foreign entries ------------------------------------------------------
  // Legitimate: private packs a user keeps out of the repo on purpose. Grouped by
  // name because each one is mirrored into every skill dir, so a per-path list
  // repeats itself four times over.
  const foreign = new Map()
  let brokenCount = 0

  for (const [rel, { skills, broken }] of scanned) {
    for (const b of broken) { fail(`broken skill link: ${tilde(b)}`); brokenCount++ }
    for (const s of skills) {
      const dest = s.link ? readlink(s.path) : null
      if (dest?.startsWith(REPO)) continue
      const kind = s.link ? `link → ${tilde(dest ?? '?')}` : 'real directory'
      // Keyed by kind as well as name: the same private pack is a real dir in the
      // library and a link to it everywhere else, so collapsing to one kind would
      // misreport where the actual content lives.
      const byKind = foreign.get(s.name) ?? new Map()
      byKind.set(kind, [...(byKind.get(kind) ?? []), rel])
      foreign.set(s.name, byKind)
    }
  }
  for (const [name, byKind] of foreign) {
    const where = [...byKind].map(([kind, dirs]) => `${kind} in ${dirs.join(', ')}`)
    info(`unmanaged skill "${name}": ${where.join('; ')}`)
  }

  // --- Codex's own set ------------------------------------------------------
  const system = scan(inHome(CODEX_SYSTEM)).skills
  if (system.length) {
    info(`${system.length} Codex-shipped system skills in ${CODEX_SYSTEM} (${system.map((s) => s.name).join(', ')}) — tool-provided, but they spend Codex's context budget too`)
  }

  return {
    total,
    loaded,
    cap: SKILL_CAP,
    managed,
    homeSkills: home.skills.length,
    pluginSkills: pluginTotal,
    plugins: plugins.length,
    duplicates: dupes.length,
    foreign: foreign.size,
    foreignEntries: [...foreign.values()].reduce((n, byKind) => n + [...byKind.values()].flat().length, 0),
    systemSkills: system.length,
    broken: brokenCount,
  }
}

/** readlink that tolerates the link vanishing mid-scan. */
function readlink(p) {
  try { return lstat(p)?.isSymbolicLink() ? readlinkSync(p) : null } catch { return null }
}
