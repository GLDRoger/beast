// Payload text is full of instructions like "read ~/.agents/skill-modules/impeccable/SKILL.md".
// Nothing else verifies those targets exist. When a rename or a skill removal invalidates one,
// the agent following it hits a dead path and the skill degrades silently — no error anywhere.
// That has already happened twice here, which is why this check exists.

import { statSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PAYLOAD, FILES, TREES, EXAMPLES, SHELL_SNIPPETS, SKILL_MIRRORS, inHome, inPayload , GENERATED_PATHS
} from '../manifest.mjs'
import { walk } from '../fsutil.mjs'

/** Files that can carry an instruction. Binaries and media never do. */
const TEXT_EXT = ['.md', '.py', '.mjs', '.js', '.toml', '.txt', '.zsh', '.ps1']

/** A file this large is vendored data, not prose. Reading it costs more than it can find. */
const MAX_BYTES = 2 * 1024 * 1024

/**
 * Only namespaces beast installs into are checkable. A skill that says "put a venv at
 * ~/.venvs/parakeet" or "renders land in ~/Downloads/cap_fx3" is describing state the USER
 * creates — absent is the normal case, so checking those would report ~70 healthy references
 * as broken and teach everyone to ignore doctor.
 */
const MANAGED = ['.agents/', '.claude/', '.codex/', '.grok/', '.beast/']

/**
 * Greedy on purpose: the charset has to swallow `<name>` so the placeholder test below can
 * reject the whole reference. Stopping at `<` instead would silently truncate
 * `~/.media/recipes/<name>/` to a real-looking `~/.media/recipes/` and report it missing.
 * Quotes, brackets and pipes end a path in every context here (markdown links, JSON, shell).
 */
const REF = /~\/[^\s`'"()[\],;|]+/g

/** Markdown glues these onto the end of a path; a real target never ends in one. */
const TRAILING = /[.,:;!?/]+$/

/**
 * Documentation templates, not paths. `<user>` `<name>` `<repo>` `<skill>` `<module-name>`
 * and friends are all covered by the angle brackets; `$`/`{}` catch shell and template
 * interpolation; `…` catches elided examples.
 */
const PLACEHOLDER = /[<>${}*…]|YOUR_|path\/to/

/**
 * Text that makes the reference a destination the reader is told to CREATE, not read:
 * `cp -R … ~/.claude/skills/`, `--output ~/.codex/session-miner-latest.json`,
 * "write to `~/.codex/…-analysis.md`". Absence is the expected state for these, so they are
 * the one remaining source of false failures once placeholders are gone.
 */
const WRITE_TARGET = /(?:--(?:out|output|o|dest|destination)\b|\b(?:ln|cp|mv|mkdir|touch|tee|rsync)\b[^~]*|\b(?:writes?|written|saves?|saved|symlinks?|links?|copy|copies|copied)\s+(?:it\s+)?to\b|>)[\s`'"]*$/i

/**
 * $HOME-relative path → payload-relative path.
 *
 * Taken from the manifest rather than assumed, because two of the mappings are not the
 * dot-strip the layout suggests: EXAMPLES ship as `<name>.example` (~/.codex/config.toml is
 * codex/config.toml.example), and SKILL_MIRRORS have no payload of their own — install fills
 * ~/.claude/skills and ~/.codex/skills from the active set at agents/skills. Missing either
 * one reports a correctly-shipped file as absent from the repo.
 */
const EXACT = new Map([...FILES, ...EXAMPLES, ...SHELL_SNIPPETS].map((e) => [e.home, e.payload]))
const PREFIXES = [
  ...TREES.map((t) => [t.home, t.payload]),
  ...SKILL_MIRRORS.map((m) => [m.home, 'agents/skills']),
].sort((a, b) => b[0].length - a[0].length)   // longest wins: .agents/skill-modules before .agents

const payloadPath = (rel) => {
  const exact = EXACT.get(rel)
  if (exact) return exact
  for (const [home, pay] of PREFIXES) {
    if (rel === home) return pay
    if (rel.startsWith(`${home}/`)) return pay + rel.slice(home.length)
  }
  return rel.replace(/^\./, '')   // ~/.codex/scripts/x → <payload>/codex/scripts/x
}

const exists = (p) => {
  try { statSync(p); return true } catch { return false }
}

/** Text of a payload file, or null when it is unreadable, binary-typed or oversized. */
function readText(abs) {
  if (!TEXT_EXT.some((e) => abs.endsWith(e))) return null
  try {
    if (statSync(abs).size > MAX_BYTES) return null
    return readFileSync(abs, 'utf8')
  } catch {
    return null   // permissions, a link that vanished mid-walk, undecodable bytes
  }
}

export function checkPayloadPaths({ fail, warn, info }) {
  let files = 0
  let refs = 0
  let resolved = 0
  let skipped = 0     // placeholders and write destinations
  let unmanaged = 0   // outside the namespaces beast installs into

  // target -> { refs, files:Set }. Grouped because one missing target is typically named by a
  // dozen routers at once; a line per reference is what makes a check get scrolled past.
  const brokenHome = new Map()
  const brokenPayload = new Map()
  const record = (map, rel, from) => {
    const g = map.get(rel) ?? { refs: 0, files: new Set() }
    g.refs++
    g.files.add(from)
    map.set(rel, g)
  }

  for (const [abs, rel] of walk(PAYLOAD)) {
    const text = readText(abs)
    if (text === null) continue
    files++

    for (const line of text.split('\n')) {
      for (const m of line.matchAll(REF)) {
        const raw = m[0].replace(TRAILING, '')
        const home = raw.slice(2)               // drop the leading "~/"
        if (!home) continue
        if (PLACEHOLDER.test(home)) { skipped++; continue }
        if (!MANAGED.some((p) => home.startsWith(p))) { unmanaged++; continue }
        if (WRITE_TARGET.test(line.slice(0, m.index))) { skipped++; continue }

        refs++
        // Two questions, two answers. $HOME says whether an agent following this instruction
        // right now lands somewhere real. The payload says whether the repo carries the
        // target at all — a reference that only resolves in $HOME is satisfied by a local
        // leftover, and breaks the moment someone installs from a fresh clone.
        //
        // Skill cross-references are EXCLUDED from the $HOME half: this walks the whole
        // payload, so on a pack-scoped install it reports refs originating from skills that
        // were never installed. That produced 191 lines for one `--packs=core` run. Live
        // resolution of ~/.agents/skill* belongs to checks/installed.mjs, which scans only
        // what is actually linked. The payload half below still applies to them.
        const isSkillRef = /^\.agents\/skill/.test(home)
        if (exists(inHome(home))) resolved++
        else if (!isSkillRef) record(brokenHome, home, rel)
        else skipped++
        // Generated at install time, so the payload legitimately has no copy.
        if (GENERATED_PATHS.includes(home)) continue
        if (!exists(inPayload(payloadPath(home)))) record(brokenPayload, home, rel)
      }
    }
  }

  const where = (g) => {
    const names = [...g.files]
    const shown = names.slice(0, 3).join(', ')
    return names.length > 3 ? `${shown} +${names.length - 3} more` : shown
  }

  for (const [rel, g] of brokenHome) {
    fail(`~/${rel} does not exist — ${g.refs} reference${g.refs > 1 ? 's send' : ' sends'} an agent to a dead path (${where(g)})`)
  }
  for (const [rel, g] of brokenPayload) {
    // Only a warning: it works on this machine. It is still a real defect, because the repo
    // is meant to be the single source of truth for everything it tells an agent to read.
    warn(`~/${rel} resolves here but the repo does not ship it (expected ${payloadPath(rel)}) — a fresh clone would break ${g.refs} reference${g.refs > 1 ? 's' : ''} (${where(g)})`)
  }

  info(`${refs} home-relative references in ${files} payload files, ${resolved} resolved against $HOME (skipped ${skipped} placeholder/write-target, ${unmanaged} outside beast's namespaces)`)

  return {
    files,
    refs,
    resolved,
    broken: brokenHome.size,
    brokenPayload: brokenPayload.size,
    skipped,
    unmanaged,
  }
}
