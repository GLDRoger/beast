import { existsSync, readFileSync, statSync, readlinkSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import {
  FILES, TREES, SKILL_MIRRORS, SHELL_SNIPPETS, SKILL_CAP,
  EXCLUDE_SKILLS, EXCLUDE_PROMPTS, EXCLUDE_PATHS, SECRET_PATTERNS,
  HARNESSES, HARNESS_NAMES, inHome, inPayload, PAYLOAD, REPO, wanted, SELECTION_FILE,
} from './manifest.mjs'
import { checkConfig } from './checks/config.mjs'
import { checkSkillHygiene } from './checks/skills.mjs'
import { checkPayloadPaths } from './checks/paths.mjs'
import { checkInstalledRefs } from './checks/installed.mjs'
import { linksTo, entries, skillEntries, walk, tilde, c, lstat, resolveTarget } from './fsutil.mjs'
import { detectWsl, isDrvFs, whichBinary, describePlatform, HOME } from './platform.mjs'
import { countDuplicates } from './normalize.mjs'
import { scanFile, scanText } from './secrets.mjs'
import { PACK_NAMES, packSkills } from './packs.mjs'

/**
 * Which harnesses are actually installed.
 *
 * install can be scoped to a subset, so an absent codex link is only a fault if the
 * user asked for codex. Presence of any harness-specific link is the evidence; if
 * none are found we assume all were wanted, so a completely uninstalled machine
 * still reports everything that is missing rather than silently passing.
 */
function detectTargets() {
  const found = HARNESS_NAMES.filter((n) =>
    FILES.some((f) => f.target === n && lstat(inHome(f.home))?.isSymbolicLink()))
  return found.length ? found : HARNESS_NAMES
}

/** The packs the last install asked for; all of them when nothing was recorded. */
function selectedPacks() {
  try {
    const sel = JSON.parse(readFileSync(SELECTION_FILE, 'utf8'))
    if (Array.isArray(sel.packs) && sel.packs.length) return sel.packs
  } catch { /* no record — assume everything was wanted */ }
  return PACK_NAMES
}

export function doctor() {
  const problems = []
  const warnings = []
  const infos = []
  const fail = (m) => problems.push(m)
  const warn = (m) => warnings.push(m)
  const info = (m) => infos.push(m)
  const targets = detectTargets()
  const packs = selectedPacks()
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
      if (!dest.includes(REPO)) continue          // not ours to police
      if (!existsSync(p)) { fail(`orphaned link into this repo: ${tilde(p)} → ${tilde(dest)}`); orphans++ }
    }
  }

  // --- skill cap ------------------------------------------------------------
  // Claude Code pulls every active skill's description into context, so the
  // active set is a context budget, not just a file count.
  const active = skills.length
  if (active > SKILL_CAP) fail(`${active} active skills exceeds the ${SKILL_CAP} cap`)
  else if (active > SKILL_CAP - 3) warn(`${active}/${SKILL_CAP} active skills — close to the cap`)

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
  for (const rel of EXCLUDE_PATHS) {
    if (existsSync(inPayload(join('agents/skill-modules', rel)))) {
      fail(`non-redistributable asset in payload: ${rel}`)
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
    scanned++
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
  const paths = checkPayloadPaths({ fail, warn, info })

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
