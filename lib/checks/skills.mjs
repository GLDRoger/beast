// Skill hygiene, and the one place beast measures the skill budget.
//
// Two things were wrong with counting skills instead. beast only counted what it
// linked, which is an undercount — Claude Code discovers plugin skills through a
// separate path and bills them to the same listing. And a count is the wrong unit
// entirely: the listing is capped in characters, so a 807-char description costs what
// five terse skills cost. See lib/listing.mjs for the formula and its provenance.
//
// doctor used to run a second, count-based cap check of its own. It is gone; this is
// the only budget check, so doctor and `beast scan` cannot disagree.

import { existsSync, readFileSync, readlinkSync, statSync } from 'node:fs'
import { join, sep } from 'node:path'
import { PAYLOAD, REPO, SKILL_MIRROR_PATHS, LEGACY_SKILL_PATHS, inHome } from '../manifest.mjs'
import { entries, lstat, tilde } from '../fsutil.mjs'
import {
  claudeSettings, listingBudget, maxDescChars, entryCost, listingChars, commas,
  budgetOrigin, budgetSpan, raiseLever, ceilingPhrase, BUDGET_FRACTION, CHARS_PER_TOKEN,
} from '../listing.mjs'

/** Claude's own skill dir. Its contents are loaded unconditionally. */
const CLAUDE_SKILLS = '.claude/skills'

/** Every dir beast links into. Foreign entries and dangling links are policed here. */
const SKILL_DIRS = [...new Set([...SKILL_MIRROR_PATHS, ...LEGACY_SKILL_PATHS, '.agents/skills', '.agents/skill-modules'])]

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
 * Raw entries are necessary: skillEntries intentionally omits broken links.
 * A stat and SKILL.md check separate directories, loose docs, and dangling links.
 */
const scan = (dir) => {
  const skills = []
  const broken = []
  for (const e of entries(dir)) {
    if (e.name.startsWith('.')) continue
    const p = join(dir, e.name)
    let st
    try { st = statSync(p) } catch { broken.push(p); continue }
    if (st.isDirectory() && existsSync(join(p, 'SKILL.md'))) skills.push({ name: e.name, path: p, link: e.isSymbolicLink() })
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
function pluginSources(at) {
  const found = new Map()   // id -> skills dir
  const installed = readJson(at(INSTALLED))?.plugins
  if (installed) {
    for (const [id, installs] of Object.entries(installed)) {
      for (const i of installs ?? []) {
        if (i?.installPath) found.set(id, join(i.installPath, 'skills'))
      }
    }
  } else {
    const cache = at(PLUGIN_CACHE)
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

/**
 * `homeDir` exists so the resolution logic below can be tested against a fixture $HOME.
 * HOME itself comes from homedir() by design (see platform.mjs), which no in-process test
 * can move, and this rewrite is exactly where the previous bug lived. Production callers
 * pass nothing.
 */
export function checkSkillHygiene({ fail, warn, info, homeDir = null }) {
  const at = (rel) => (homeDir ? join(homeDir, rel) : inHome(rel))
  const managedPrefix = PAYLOAD              // links into the repo payload are ours

  // Scanned once and shared: CLAUDE_SKILLS feeds both the budget measurement and the
  // foreign/broken sweep, and a second scan would report its faults twice.
  const scanned = new Map(SKILL_DIRS.map((rel) => [rel, scan(at(rel))]))
  const home = scanned.get(CLAUDE_SKILLS)

  const { settings, malformed } = claudeSettings(at(SETTINGS))
  if (malformed) {
    warn(`~/${SETTINGS} is not valid JSON — Claude Code ignores all of it, including the ` +
      'skill budget and the enabled-plugin list, and so does everything measured below')
  }
  const budget = listingBudget(settings)
  const maxDesc = maxDescChars(settings)

  // --- what Claude Code actually loads --------------------------------------
  // Keyed on the frontmatter `name`, not the directory: that is the name Claude Code puts
  // in the listing and dedupes on, so a dir called `helper` declaring `name: shared`
  // shadows a real `shared` and must be reported as one line, under the name shown.
  //
  // One pass feeds the measurement, the shadowing check and the disabled-plugin
  // arithmetic. `plugin` is null for a provider in ~/.claude/skills and the plugin id
  // otherwise; `chars` is what that provider's listing line costs.
  const byName = new Map()
  const add = (dirName, path, plugin, managed) => {
    const { name, chars } = entryCost(path, dirName, maxDesc)
    byName.set(name, [...(byName.get(name) ?? []), { path, plugin, managed, chars }])
    return chars
  }
  for (const s of home.skills) {
    add(s.name, s.path, null, underPayload(readlink(s.path), managedPrefix))
  }

  const enabled = settings?.enabledPlugins ?? {}
  const plugins = []
  for (const [id, dir] of pluginSources(at)) {
    const { skills, broken } = scan(dir)
    if (!skills.length) continue
    let chars = 0
    for (const s of skills) chars += add(s.name, s.path, id, false)
    for (const b of broken) warn(`broken plugin skill link: ${tilde(b)}`)
    plugins.push({
      id, count: skills.length, chars, flagged: enabled[id] === false, names: skills.map((k) => k.name),
    })
  }

  const total = byName.size
  const pluginTotal = plugins.reduce((n, p) => n + p.count, 0)

  // Only skills that actually load are billed. A plugin present in the cache but set
  // false in enabledPlugins is not loaded, so charging for it produces a false failure
  // — worse than the undercount it was guarding against, because a spurious fail
  // teaches you to ignore doctor. The disabled ones are still reported below.
  //
  // Resolved per name against its providers rather than by subtracting counts: a name
  // is one line in the listing however many places supply it, and the old arithmetic
  // (unique names minus raw plugin entries) removed a shadowed name twice.
  const disabledIds = new Set(plugins.filter((p) => p.flagged).map((p) => p.id))
  const rows = []     // one per name that loads — what the listing actually contains
  const dark = []     // names whose only providers are disabled plugins
  const liveByName = new Map()
  for (const [name, provs] of byName) {
    const live = provs.filter((p) => !p.plugin || !disabledIds.has(p.plugin))
    liveByName.set(name, live)
    // Which provider wins when two supply the same name is undefined. The home dir is
    // the representative because it is the copy beast can act on; the shadowing warning
    // below is what tells the user the ambiguity exists.
    const pick = (live.find((p) => !p.plugin) ?? live[0] ?? provs[0])
    ;(live.length ? rows : dark).push({ name, chars: pick.chars, managed: pick.managed, plugin: pick.plugin })
  }

  const loaded = rows.length
  const disabledPluginSkills = dark.length
  const managed = rows.filter((r) => r.managed).length
  const chars = listingChars(rows)
  const pct = Math.round((chars / budget.chars) * 100)
  const beastChars = listingChars(rows.filter((r) => r.managed))
  const over = chars > budget.charsHigh     // truncated on every 200k model
  const tight = chars > budget.chars        // truncated on a current one

  // Characters, not a count, and severity follows certainty. Over budget nothing
  // vanishes: Claude Code shortens the lowest-scoring entries to `- name`, and the score
  // is usage-weighted, so an untouched fresh install is first in line to lose the
  // descriptions its routers dispatch on.
  if (over) {
    fail(`skill listing is ${commas(chars)} chars, ${commas(chars - budget.charsHigh)} over ` +
      `${ceilingPhrase(budget)} (${loaded} skills) — Claude Code shortens the least-used descriptions ` +
      `to fit. Levers: ${raiseLever(budget, chars)}, or beast scan for what to retire`)
  } else if (tight) {
    warn(`skill listing is ${commas(chars)} chars, over the ${commas(budget.chars)} a current model budgets ` +
      `at ${CHARS_PER_TOKEN} chars/token (${loaded} skills) — under the ${commas(budget.charsHigh)} an older ` +
      `one gets. Levers: ${raiseLever(budget, chars)}, or beast scan`)
  } else if (pct >= 85) {
    warn(`skill listing ${commas(chars)}/${commas(budget.chars)} chars (${pct}%) across ${loaded} skills — little slack left`)
  }
  if (budget.invalid) {
    warn('skillListingBudgetFraction in ~/.claude/settings.json is not a number in (0, 1] — ' +
      `Claude Code's schema rejects it, so the ${BUDGET_FRACTION} default is what applies`)
  }
  if (tight || pct >= 85) {
    info(`listing budget ${budgetOrigin(budget)} — beast's share of it is ${commas(beastChars)} chars`)
  }
  if (disabledPluginSkills) {
    // Names, not entries: two disabled plugins providing `foo` are one line in the listing.
    info(`${disabledPluginSkills} cached plugin skill name(s) are NOT counted because their plugin is ` +
      `disabled — re-enabling would take the listing to ${commas(listingChars([...rows, ...dark]))} chars ` +
      `against ${budgetSpan(budget)}`)
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
  // Same name from two discovery paths that both load: which one wins is not defined
  // anywhere. Counted over live providers only — a cached copy inside a disabled plugin
  // shadows nothing, and warning about it is the kind of false positive that teaches
  // people to skim past doctor.
  const dupes = [...liveByName]
    .filter(([, live]) => live.length > 1)
    .map(([name, live]) => [name, live.map((p) => p.path)])
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
    for (const b of broken) { warn(`broken skill link: ${tilde(b)}`); brokenCount++ }
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
  const system = scan(at(CODEX_SYSTEM)).skills
  if (system.length) {
    info(`${system.length} Codex-shipped system skills in ${CODEX_SYSTEM} (${system.map((s) => s.name).join(', ')}) — tool-provided, but they spend Codex's context budget too`)
  }

  return {
    // `inventory` is the detail behind the counts. doctor renders the counts; `beast
    // scan` needs the names and locations to tell you what to do about each one.
    inventory: {
      plugins,
      foreign: [...foreign].map(([name, byKind]) => ({
        name,
        places: [...byKind].map(([kind, dirs]) => ({ kind, dirs })),
      })),
      system: system.map((k) => k.name),
      duplicates: dupes.map(([name, paths]) => ({ name, paths })),
      managedNames: rows.filter((r) => r.managed).map((r) => r.name),
    },
    // The measured listing. `rows` is per-skill so `beast scan` can name the expensive
    // ones instead of only reporting a total nobody can act on.
    listing: {
      chars,
      budget: budget.chars,
      budgetHigh: budget.charsHigh,
      tight,
      // The whole budget object too, so callers can phrase advice that matches how this
      // machine got its number (an env override beats the settings key).
      budgetInfo: budget,
      fraction: budget.fraction,
      source: budget.source,
      over,
      pct,
      beastChars,
      rows: [...rows].sort((a, b) => b.chars - a.chars),
    },
    total,
    loaded,
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

/**
 * Whether a link target is a file inside the payload, so the skill is beast's.
 *
 * A bare `startsWith(PAYLOAD)` also matched a sibling directory whose name merely began
 * the same way (`…/beast/home-old/x`), and on Windows a junction target can carry the
 * `\\?\` extended-length prefix, which made every managed skill read as unmanaged and
 * beast's measured share as 0.
 */
function underPayload(dest, payload) {
  if (!dest) return false
  const clean = dest.replace(/^\\\\\?\\/, '')
  return clean === payload || clean.startsWith(payload.endsWith(sep) ? payload : payload + sep)
}

/** readlink that tolerates the link vanishing mid-scan. */
function readlink(p) {
  try { return lstat(p)?.isSymbolicLink() ? readlinkSync(p) : null } catch { return null }
}
