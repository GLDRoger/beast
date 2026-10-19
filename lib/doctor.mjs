import { existsSync, readFileSync, statSync, readlinkSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, extname } from 'node:path'
import {
  FILES, TREES, SKILL_MIRRORS, SHELL_SNIPPETS,
  EXCLUDE_SKILLS, EXCLUDE_PROMPTS, EXCLUDE_PATHS, EXCLUDE_FILES, EXCLUDE_ALWAYS,
  EXCLUDE_EXT, SCRUB_REWRITES, SCRUB_LINE_PATTERNS, SCRUB_EXT, SECRET_PATTERNS,
  HARNESSES, HARNESS_NAMES, inHome, inPayload, PAYLOAD, REPO, wanted, SELECTION_FILE,
} from './manifest.mjs'
import { checkConfig } from './checks/config.mjs'
import { checkSkillHygiene } from './checks/skills.mjs'
import { checkPayloadPaths } from './checks/paths.mjs'
import { checkInstalledRefs } from './checks/installed.mjs'
import { linksTo, entries, skillEntries, walk, tilde, c, lstat, resolveTarget, underRepo } from './fsutil.mjs'
import { detectWsl, isDrvFs, whichBinary, describePlatform, HOME } from './platform.mjs'
import { countDuplicates } from './normalize.mjs'
import { scanFile, scanText } from './secrets.mjs'
import { PACK_NAMES, packSkills } from './packs.mjs'
import { commas, budgetSpan } from './listing.mjs'
import { geminiPrompts } from './gemini.mjs'

/** What the last install recorded, or null when there is no usable record. */
function recordedSelection() {
  try {
    const sel = JSON.parse(readFileSync(SELECTION_FILE, 'utf8'))
    return {
      targets: Array.isArray(sel.targets) && sel.targets.length ? sel.targets : null,
      packs: Array.isArray(sel.packs) && sel.packs.length ? sel.packs : null,
    }
  } catch {
    return { targets: null, packs: null }   // no record — assume everything was wanted
  }
}

/**
 * Which harnesses this machine asked for.
 *
 * The recorded selection wins, because it is a statement of intent rather than a guess.
 * Inference from existing links is the fallback, and it is only a heuristic: on Windows
 * without Developer Mode every FILE symlink fails while directory junctions succeed, so
 * "no harness link exists" there means "links could not be created", not "nothing was
 * selected" — and the fallback then assumes all three and reports the other two as broken.
 * With a record present that guess never runs.
 */
function detectTargets(recorded) {
  if (recorded) return recorded
  const found = HARNESS_NAMES.filter((n) =>
    FILES.some((f) => f.target === n && lstat(inHome(f.home))?.isSymbolicLink()))
  return found.length ? found : HARNESS_NAMES
}

export function doctor() {
  const problems = []
  const warnings = []
  const infos = []
  const fail = (m) => problems.push(m)
  const warn = (m) => warnings.push(m)
  const info = (m) => infos.push(m)
  const recorded = recordedSelection()
  const targets = detectTargets(recorded.targets)
  const packs = recorded.packs ?? PACK_NAMES
  const wantedSkill = new Set(packSkills(packs))

  // --- payload ---------------------------------------------------------------
  if (!existsSync(PAYLOAD)) {
    fail(`payload missing: ${tilde(PAYLOAD)} — run scripts/bootstrap.mjs`)
    return finish(problems, warnings)
  }

  // --- links ----------------------------------------------------------------
  let ok = 0
  const checkLink = (link, rawTarget) => {
    if (!existsSync(rawTarget)) return fail(`payload file gone: ${tilde(rawTarget)}`)
    const target = resolveTarget(rawTarget)   // same collapse install applies
    const st = lstat(link)
    if (!st) return fail(`not linked: ${tilde(link)}`)
    if (!st.isSymbolicLink()) return fail(`real file where a link belongs: ${tilde(link)}`)
    if (!linksTo(link, target)) return fail(`link points elsewhere: ${tilde(link)}`)
    if (!existsSync(link)) return fail(`broken link: ${tilde(link)}`)
    ok++
  }

  for (const f of FILES.filter((f) => wanted(f, targets))) checkLink(inHome(f.home), inPayload(f.payload))

  let keptLocal = 0
  let notSelected = 0
  for (const { payload, home, skills: isSkills, skipIfReal } of TREES.filter((t) => wanted(t, targets))) {
    for (const e of (isSkills ? skillEntries : entries)(inPayload(payload))) {
      // A skill outside the recorded selection was never meant to be linked.
      if (isSkills && !wantedSkill.has(e.name)) { notSelected++; continue }
      const link = join(inHome(home), e.name)
      // Same rule install applies: a real dir here is deliberate, not a fault.
      if (skipIfReal && lstat(link) && !lstat(link).isSymbolicLink()) { keptLocal++; continue }
      checkLink(link, join(inPayload(payload), e.name))
    }
  }
  const skills = skillEntries(inPayload('agents/skills'))
  for (const m of SKILL_MIRRORS.filter((m) => wanted(m, targets))) {
    for (const e of skills) {
      if (!wantedSkill.has(e.name)) continue
      checkLink(join(inHome(m.home), e.name), join(inPayload('agents/skills'), e.name))
    }
  }
  for (const s of SHELL_SNIPPETS) checkLink(inHome(s.home), inPayload(s.payload))

  if (targets.includes('gemini')) {
    const prompts = geminiPrompts()
    for (const [rel, expected] of [['.gemini/system.md', prompts.system], ['.gemini/config/AGENTS.md', prompts.rules]]) {
      let actual
      try { actual = readFileSync(inHome(rel), 'utf8') } catch { /* missing or unreadable */ }
      if (actual !== expected) fail(`generated Gemini prompt missing or stale: ~/${rel} — reinstall with Gemini selected`)
    }
  }

  // --- orphans --------------------------------------------------------------
  // Links in $HOME that point into this repo but no longer resolve. Deactivating a
  // skill leaves these behind, and a dangling link is invisible to the checks above
  // (they iterate the payload, not $HOME). One stale link is enough to break
  // bootstrap, so surface them here rather than at the next --force.
  let orphans = 0
  for (const dir of [...SKILL_MIRRORS.map((m) => m.home), '.agents/skills', '.agents/skill-modules', '.codex/prompts']) {
    for (const e of entries(inHome(dir))) {
      const p = join(inHome(dir), e.name)
      if (!e.isSymbolicLink()) continue
      let dest
      try { dest = readlinkSync(p) } catch { continue }
      // A real path boundary, not a substring: `includes(REPO)` also matched a link into
      // /code/beast-user, so someone else's link was reported as our orphan.
      if (!underRepo(dest)) continue              // not ours to police
      if (!existsSync(p)) { fail(`orphaned link into this repo: ${tilde(p)} → ${tilde(dest)}`); orphans++ }
    }
  }

  // How many skills beast activated. Not a budget check: the budget is measured in
  // listing characters over everything the harness loads, and checkSkillHygiene below
  // is the only place that does it. A second count-based check here disagreed with it
  // in the output — "27 active skills" printed beside a failure about 56.
  const active = skills.length

  // --- one-copy invariant ---------------------------------------------------
  const dupes = countDuplicates()
  if (dupes) fail(`${dupes} skills exist as real dirs in BOTH agents/skills and agents/skill-modules — run scripts/bootstrap.mjs to normalize`)

  // --- exclusions still excluded -------------------------------------------
  for (const s of EXCLUDE_SKILLS) {
    for (const dir of ['agents/skills', 'agents/skill-modules']) {
      if (existsSync(inPayload(join(dir, s)))) fail(`private pack in payload: ${dir}/${s}`)
    }
  }
  for (const p of EXCLUDE_PROMPTS) {
    if (existsSync(inPayload(join('codex/prompts', p)))) fail(`private prompt in payload: ${p}`)
  }
  // Both skill trees, because bootstrap applies the rule to both. Checking only the
  // library let an excluded asset under agents/skills through.
  for (const rel of EXCLUDE_PATHS) {
    for (const tree of ['agents/skill-modules', 'agents/skills']) {
      if (existsSync(inPayload(join(tree, rel)))) fail(`non-redistributable asset in payload: ${tree}/${rel}`)
    }
  }

  // Re-check the rules bootstrap enforces. Bootstrap applies them when copying, but
  // nothing verified them afterwards, so anything reintroduced by hand shipped: a
  // planted EXCLUDE_FILES name and an author path both survived a healthy doctor.
  for (const [abs, rel] of walk(PAYLOAD)) {
    const base = rel.split('/').pop()
    if (EXCLUDE_FILES.includes(base)) fail(`excluded file in payload: home/${rel}`)
    if (EXCLUDE_ALWAYS.includes(base)) fail(`junk in payload: home/${rel}`)
    if (EXCLUDE_EXT.some((e) => base.endsWith(e))) fail(`excluded file type in payload: home/${rel}`)
    if (!SCRUB_EXT.includes(extname(base))) continue
    let text
    try { text = readFileSync(abs, 'utf8') } catch { continue }
    for (const [re] of SCRUB_REWRITES) {
      const m = text.match(re)
      if (m) fail(`unscrubbed text in payload: home/${rel} contains "${m[0].slice(0, 40)}" — run npm run scrub`)
    }
    for (const re of SCRUB_LINE_PATTERNS) {
      if (re.test(text)) fail(`excluded reference in payload: home/${rel} matches ${re}`)
    }
  }

  // --- secrets --------------------------------------------------------------
  let scanned = 0
  let unreadable = 0
  for (const [abs, rel] of walk(PAYLOAD)) {
    // Chunked, so a large file is scanned rather than skipped. The old 2 MB cut-off let
    // a 9 MiB file carrying a valid token through every scanner untouched.
    const r = scanFile(abs)
    if (!r.scanned) { unreadable++; continue }
    if (!r.directory) scanned++
    for (const label of r.hits) fail(`${label} found in payload: home/${rel}`)
  }
  if (unreadable) warn(`${unreadable} payload file(s) could not be read for secret scanning — treat as unverified`)

  // --- platform -------------------------------------------------------------
  const wsl = detectWsl()

  if (wsl) {
    // WSL runs the installer fine — it is Linux. Two things break silently.
    if (isDrvFs(REPO)) {
      fail(`repo is on a Windows drive (${tilde(REPO)}). DrvFs symlinks are unreliable and slow — clone into the WSL filesystem instead, e.g. ~/code/beast`)
    }
    if (isDrvFs(HOME)) {
      fail(`$HOME is on a Windows drive (${HOME}). Move to a WSL-native home or the links will not survive`)
    }
    if (wsl.version === 1) {
      warn('WSL1 detected. Symlink and filesystem behaviour differs from WSL2; WSL2 is strongly recommended')
    }
  }

  // --- tools ----------------------------------------------------------------
  for (const bin of ['claude', 'codex', 'grok']) {
    const found = whichBinary(bin)
    if (!found) {
      warn(`${bin} not on PATH — its config installed but the CLI is missing`)
      continue
    }
    // The WSL interop trap: a Windows .exe reached from WSL reads %USERPROFILE%\.claude,
    // not $HOME/.claude, so everything beast just linked is invisible to it.
    if (wsl && isDrvFs(found)) {
      fail(`${bin} resolves to a Windows executable (${found}). It reads %USERPROFILE%, not $HOME, so it will not see this config. Install ${bin} inside WSL, or run beast on the Windows side`)
    }
  }

  // --- config files ---------------------------------------------------------
  const cfg = checkConfig({ fail, warn, targets })

  // --- skill budget & foreign skills ----------------------------------------
  // beast only counts what it manages, which undercounts what the tools actually
  // load: plugins contribute skills through a separate discovery path entirely.
  const hyg = checkSkillHygiene({ fail, warn, info })

  // --- referenced paths -----------------------------------------------------
  // Payload text tells agents to read specific files. A rename or a dropped skill
  // turns those into dead ends silently; this is the check that catches it.
  //
  // Scoped to the recorded selection. Unscoped, it walked the whole payload and judged
  // every reference against $HOME, so a clean single-harness install failed doctor on
  // ~10 references into harnesses the user had deliberately not chosen.
  const paths = checkPayloadPaths({ fail, warn, info, targets, packs })

  // --- live install completeness --------------------------------------------
  // Whether the skills actually linked here can reach what they reference. This is
  // what makes an existing narrow install announce itself instead of quietly
  // shipping routers with dead menus.
  const live = checkInstalledRefs({ fail, warn, info })

  // --- git hygiene ----------------------------------------------------------
  try {
    const staged = execFileSync('git', ['diff', '--cached', '--name-only', '-z'], { cwd: REPO, encoding: 'utf8' })
    for (const f of staged.split('\0').filter(Boolean)) {
      // Read the INDEX blob, not the working tree. Staging a secret and then
      // editing it out of the file leaves the secret in the commit while the
      // on-disk copy looks clean — reading from disk misses exactly that case.
      let text
      try {
        text = execFileSync('git', ['show', `:${f}`], { cwd: REPO, encoding: 'utf8', maxBuffer: 256 << 20 })
      } catch (err) {
        // ENOBUFS means the blob outgrew maxBuffer. Silently continuing there is how a
        // large staged secret reached the index unreported, so it fails loudly instead.
        // A genuinely deleted or unreadable path is still skipped.
        if (err?.code === 'ENOBUFS' || /maxBuffer/i.test(err?.message ?? '')) {
          fail(`staged file too large to scan for secrets: ${f} — verify it by hand`)
        }
        continue
      }
      for (const label of scanText(text)) fail(`${label} in the git INDEX for: ${f}`)
    }
  } catch { /* not a repo yet, or git absent */ }

  console.log(c.dim(
    `${describePlatform()} · ${targets.join('+')} · ${ok} links, ${active} active skills, ` +
    `${cfg?.checked ?? 0} configs, ${hyg?.loaded ?? active}/${hyg?.total ?? active} skills loaded/discoverable, ` +
    (hyg?.listing ? `${commas(hyg.listing.chars)}/${budgetSpan(hyg.listing.budgetInfo)} listing chars, ` : '') +
    `${paths?.resolved ?? 0}/${paths?.refs ?? 0} payload refs, ` +
    `${(live?.refs ?? 0) - (live?.dangling ?? 0)}/${live?.refs ?? 0} live refs, ${scanned} payload files` +
    (notSelected ? `, ${notSelected} skills outside the selection` : '')))
  return finish(problems, warnings, infos)
}

function finish(problems, warnings, infos = []) {
  for (const i of infos) console.log(`${c.dim('note')}  ${c.dim(i)}`)
  for (const w of warnings) console.log(`${c.yellow('warn')}  ${w}`)
  for (const p of problems) console.log(`${c.red('fail')}  ${p}`)
  if (!problems.length) console.log(c.green(warnings.length ? '✓ healthy (with warnings)' : '✓ healthy'))
  return problems.length ? 1 : 0
}
