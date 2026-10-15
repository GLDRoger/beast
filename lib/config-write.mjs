// The few config keys beast genuinely needs, written into the harness TOML.
//
// Everything else in ~/.codex/config.toml and ~/.grok/config.toml stays the user's:
// auth, trust, MCP servers, sandbox posture. This file adds keys that are absent and
// nothing else. It never edits a value that is already set, never reorders, never
// reformats, and never removes a comment.
//
// Why this is not a two-line append. Both hazards were reproduced against
// codex-cli 0.145.0 before this was written:
//
//   1. Appending `model_instructions_file = "..."` to the end of a file whose last
//      section is [features] puts the key INSIDE that table, where it collides with
//      the boolean feature flag of the same name. Codex then refuses to start:
//      `invalid type: string "...", expected a boolean`.
//   2. Any duplicate key anywhere makes the whole file unparseable: `duplicate key`.
//
// Both take out every subsequent run of the CLI until the user finds the line. So the
// sequence here is parse first, insert positionally, verify the re-parse differs from
// the original by EXACTLY the intended keys, and only then move the file into place.
// Without a TOML parser available, nothing is written at all.

import { existsSync, readFileSync, writeFileSync, copyFileSync, renameSync, unlinkSync, mkdirSync, statSync, chmodSync, realpathSync } from 'node:fs'
import { dirname } from 'node:path'
import { inHome, HARNESS_NAMES } from './manifest.mjs'
import { tilde, backupPathFor, lstat } from './fsutil.mjs'
import { parseTomlFile, tomlInterpreter } from './toml.mjs'

/**
 * What each harness needs, and why. `path` is the TOML key path: one segment for a
 * root key, two for a key inside a table.
 *
 * Claude Code is absent on purpose. Nothing in ~/.claude/settings.json is required
 * for beast to work — the `c` helper passes the prompt as a launch flag and skills
 * are discovered from ~/.claude/skills — so there is nothing to write and no reason
 * to touch a file Claude Code rewrites at runtime.
 */
export const EDITS = {
  codex: {
    file: '.codex/config.toml',
    example: 'codex/config.toml.example',
    additions: [
      {
        path: ['model_instructions_file'],
        value: '~/.codex/BEAST.v2.md',
        // Verified: codex expands `~` here, and a path that does not resolve makes
        // config loading fail outright. Hence requires — never write a pointer to a
        // file this install did not create.
        requires: '.codex/BEAST.v2.md',
        why: 'every codex launch (CLI, app-server, T3 Code) reads the beast prompt',
      },
    ],
  },
  grok: {
    file: '.grok/config.toml',
    example: 'grok/config.toml.example',
    additions: [
      {
        path: ['skills', 'paths'],
        value: ['~/.agents/skills'],
        requires: '.agents/skills',
        why: 'where beast puts the active skill set',
      },
      {
        path: ['skills', 'ignore'],
        value: ['~/.claude/skills'],
        why: 'the Claude mirror holds the same skills — without this they load twice',
      },
    ],
  },
}

export const EDITABLE = Object.keys(EDITS).filter((h) => HARNESS_NAMES.includes(h))

// ---------------------------------------------------------------------------
// Planning
// ---------------------------------------------------------------------------

const at = (obj, path) => path.reduce((o, k) => (o == null ? undefined : o[k]), obj)

/**
 * What would change, without changing anything.
 *
 * Statuses: 'create' (no config file yet), 'edit' (keys to add), 'ok' (all present),
 * 'no-parser', 'unparseable' (left strictly alone), 'unavailable' (the file the key
 * would point at is not installed).
 */
export function planConfigEdits(targets = EDITABLE, { assumeInstalled = false } = {}) {
  const plans = []
  for (const harness of EDITABLE) {
    if (!targets.includes(harness)) continue
    const spec = EDITS[harness]
    const file = inHome(spec.file)
    const parsed = parseTomlFile(file)

    if (!parsed.ok && parsed.code === 'no-python') {
      plans.push({ harness, file, spec, status: 'no-parser', additions: [], notes: [] })
      continue
    }
    if (!parsed.ok && parsed.code === 'invalid') {
      plans.push({
        harness, file, spec, status: 'unparseable', additions: [], notes: [],
        detail: parsed.detail,
      })
      continue
    }

    const current = parsed.ok ? parsed.value : null      // null = file absent
    const additions = []
    const notes = []

    for (const add of spec.additions) {
      // `assumeInstalled` is for the pre-install question: the links do not exist yet
      // on a first run, and skipping every key there would mean never asking at all.
      if (!assumeInstalled && add.requires && !existsSync(inHome(add.requires))) {
        notes.push(`skipped ${add.path.join('.')} — ${tilde(inHome(add.requires))} is not installed`)
        continue
      }
      const present = current ? at(current, add.path) : undefined
      if (present === undefined) { additions.push(add); continue }
      // Already set. Say so when it disagrees with what beast would have written —
      // a stale value here is the failure mode that looks like everything is fine.
      if (!sameValue(present, add.value)) {
        notes.push(`${add.path.join('.')} is already set to ${JSON.stringify(present)}, left alone (beast uses ${JSON.stringify(add.value)})`)
      }
      continue
    }

    plans.push({
      harness, file, spec, additions, notes,
      status: additions.length ? (current ? 'edit' : 'create') : 'ok',
    })
  }
  return plans
}

/** True when an existing value already covers what beast would add. */
function sameValue(present, wanted) {
  if (Array.isArray(wanted)) return Array.isArray(present) && wanted.every((v) => present.includes(v))
  return present === wanted
}

export const hasPendingEdits = (plans) => plans.some((p) => p.status === 'edit' || p.status === 'create')

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------

const toToml = (v) => {
  if (Array.isArray(v)) return `[${v.map(toToml).join(', ')}]`
  if (typeof v === 'boolean') return String(v)
  return `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Add one key to TOML source text, or explain why not.
 *
 * A root key is prepended rather than inserted before the first table header:
 * line 1 is unambiguously the root table whatever the rest of the file looks like,
 * so there is no header-scanning to get wrong. A table key goes on the line directly
 * after its `[table]` header, which is the only position guaranteed to land in that
 * table regardless of what follows.
 */
export function insertKey(text, { path, value, why }) {
  // Match the file's own line ending. A config edited on Windows is CRLF throughout,
  // and mixing in bare LF lines is both ugly and a trap for the next editor.
  const eol = text.includes('\r\n') ? '\r\n' : '\n'
  const line = `${path[path.length - 1]} = ${toToml(value)}`
  const comment = why ? `# beast: ${why}` : null

  if (path.length === 1) {
    const block = [comment, line, ''].filter((l) => l !== null).join(eol)
    return { ok: true, text: block + eol + text }
  }

  const [table] = path
  const lines = text.split('\n')
  // \r is tolerated at the end of every line pattern here: without it a CRLF config
  // never matches its own [table] header, and the key gets appended as a second
  // header instead — a duplicate key, which is exactly the breakage this avoids.
  const header = new RegExp(`^[ \\t]*\\[${escapeRe(table)}\\][ \\t]*(#[^\\r]*)?\\r?$`)
  const hits = lines.map((l, i) => (header.test(l) ? i : -1)).filter((i) => i >= 0)

  if (hits.length > 1) {
    // Unreachable through valid TOML (duplicate headers do not parse), so this means
    // the regex matched something inside a multi-line string. Refuse rather than guess.
    return { ok: false, reason: `[${table}] appears ${hits.length} times — edit by hand` }
  }

  if (hits.length === 1) {
    // split('\n') keeps the \r at the end of each CRLF line, so the inserted lines
    // carry their own to stay consistent with the rest of the file.
    const suffix = eol === '\r\n' ? '\r' : ''
    const body = (comment ? [comment, line] : [line]).map((l) => l + suffix)
    lines.splice(hits[0] + 1, 0, ...body)
    return { ok: true, text: lines.join('\n') }
  }

  // No header. The table may still exist as an inline table or dotted key, in which
  // case appending `[table]` would be a duplicate key and break the whole file.
  if (new RegExp(`^[ \\t]*(${escapeRe(table)}|"${escapeRe(table)}")[ \\t]*[.=]`, 'm').test(text)) {
    return { ok: false, reason: `${table} is defined as an inline table or dotted key — edit by hand` }
  }

  const tail = text.length && !text.endsWith('\n') ? eol : ''
  const block = ['', `[${table}]`, comment, line, ''].filter((l) => l !== null).join(eol)
  return { ok: true, text: text + tail + block }
}

/**
 * Structural guard: `post` must equal `pre` plus exactly the paths in `added`.
 *
 * This is what catches a key landing in the wrong table. Comparing parsed documents
 * rather than text means a misplaced insertion cannot pass just because the file
 * still happens to be valid TOML.
 */
export function onlyAdded(pre, post, added) {
  const stripped = structuredClone(post)
  for (const { path } of added) {
    if (path.length === 1) { delete stripped[path[0]]; continue }
    const [table, key] = path
    if (stripped[table] && typeof stripped[table] === 'object') {
      delete stripped[table][key]
      // A table beast created for the key is part of the addition, not a change.
      if (!Object.keys(stripped[table]).length && !(pre && pre[table])) delete stripped[table]
    }
  }
  return deepEqual(pre ?? {}, stripped)
}

function deepEqual(a, b) {
  if (a === b) return true
  if (typeof a !== typeof b || a === null || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (typeof a !== 'object') return false
  const ka = Object.keys(a), kb = Object.keys(b)
  if (ka.length !== kb.length) return false
  return ka.every((k) => Object.hasOwn(b, k) && deepEqual(a[k], b[k]))
}

/**
 * Apply one plan. Writes through a temp file so the real config is never in a
 * half-written state, and reverts to the original on any doubt.
 */
export function applyPlan(plan) {
  const { file, additions, spec } = plan
  if (!additions.length) return { ...plan, wrote: false }

  // Follow a symlinked config to the real file. Renaming over the link would replace
  // a dotfiles-repo pointer with a standalone copy, which silently detaches the user
  // from their own config management.
  let realFile = file
  try { if (lstat(file)?.isSymbolicLink()) realFile = realpathSync(file) } catch { /* keep the path */ }

  const existed = existsSync(realFile)
  const before = existed ? readFileSync(realFile, 'utf8') : ''
  const pre = existed ? parseTomlFile(realFile) : { ok: true, value: {} }
  if (!pre.ok) return { ...plan, wrote: false, status: 'refused', detail: 'could not re-read the file' }

  let text = existed ? before : `# Written by beast. Everything else in this file is yours.\n# Fuller annotated example: home/${spec.example} in the beast repo.\n`
  const applied = []
  const refused = []
  for (const add of additions) {
    const r = insertKey(text, add)
    if (!r.ok) { refused.push(`${add.path.join('.')}: ${r.reason}`); continue }
    text = r.text
    applied.push(add)
  }
  if (!applied.length) return { ...plan, wrote: false, status: 'refused', refusedKeys: refused }

  const tmp = `${realFile}.beast-tmp`
  try {
    mkdirSync(dirname(realFile), { recursive: true })
    writeFileSync(tmp, text)
    // Config can hold tokens. A fresh temp file is 0644; carry the original mode over
    // so an edit never widens permissions on the user's file.
    if (existed) { try { chmodSync(tmp, statSync(realFile).mode & 0o7777) } catch { /* best effort */ } }

    const post = parseTomlFile(tmp)
    if (!post.ok) {
      unlinkSync(tmp)
      return { ...plan, wrote: false, status: 'refused', detail: `the result would not parse (${post.detail ?? post.code})` }
    }
    if (!onlyAdded(existed ? pre.value : null, post.value, applied)) {
      unlinkSync(tmp)
      return { ...plan, wrote: false, status: 'refused', detail: 'the result changed more than the intended keys' }
    }

    // Keep the pre-beast original. First one wins: that is the copy worth having, and
    // a later run would otherwise overwrite it with an already-edited version.
    let backup = null
    const notes = [...(plan.notes ?? [])]
    if (existed) {
      const dest = backupPathFor(realFile)
      if (!dest) {
        // A config symlinked out of $HOME (a dotfiles repo) has nowhere to park under
        // BACKUP_ROOT. Saying nothing would imply a safety net that is not there; the
        // file itself is still safe, since the checks above ran before the rename.
        notes.push('no copy kept — this file lives outside $HOME, so version control is your undo')
      } else if (existsSync(dest)) {
        notes.push(`earlier copy kept at ${tilde(dest)}`)
      } else {
        try { mkdirSync(dirname(dest), { recursive: true }); copyFileSync(realFile, dest); backup = dest }
        catch (err) { notes.push(`could not copy the original to ${tilde(dest)} (${err.code ?? err.message})`) }
      }
    }

    renameSync(tmp, realFile)
    return { ...plan, wrote: true, status: 'written', applied, refusedKeys: refused, backup, notes, file: realFile }
  } catch (err) {
    try { if (existsSync(tmp)) unlinkSync(tmp) } catch { /* nothing else to do */ }
    // The original was never touched: everything above writes to tmp and the rename is
    // the last statement. So a throw here leaves the config exactly as it was.
    return { ...plan, wrote: false, status: 'refused', detail: err.code ?? err.message }
  }
}

/**
 * Write the config keys for `targets`. Returns one result per harness.
 * `dryRun` reports the same plan without touching anything.
 */
export function writeConfigEdits({ targets = EDITABLE, dryRun = false } = {}) {
  // A dry run creates no links, so the files these keys point at are absent and every
  // key would report as skipped — a preview of a run nobody will ever have. Plan it
  // as the real run sees it: links first, config second.
  const plans = planConfigEdits(targets, { assumeInstalled: dryRun })
  if (dryRun) return plans.map((p) => ({ ...p, wrote: false }))
  return plans.map((p) => (p.status === 'edit' || p.status === 'create' ? applyPlan(p) : { ...p, wrote: false }))
}

/**
 * The key list shown before the question. Pure and exported so the wording is under
 * test: an interactive prompt is the one path a test suite cannot drive.
 */
export function configQuestion(plans) {
  const lines = []
  for (const p of plans) {
    if (!p.additions.length) continue
    lines.push({ file: tilde(p.file) })
    for (const a of p.additions) lines.push({ key: a.path.join('.'), why: a.why })
  }
  return lines
}

/** One line per harness, for the installer report. */
export function describeEdits(results, { dryRun = false } = {}) {
  const out = []
  for (const r of results) {
    const name = tilde(r.file)
    if (r.status === 'written') {
      out.push({ level: 'ok', text: `${name} — added ${r.applied.map((a) => a.path.join('.')).join(', ')}` })
      if (r.backup) out.push({ level: 'dim', text: `  original copied to ${tilde(r.backup)}` })
    } else if ((r.status === 'edit' || r.status === 'create') && dryRun) {
      out.push({ level: 'ok', text: `${name} — would add ${r.additions.map((a) => a.path.join('.')).join(', ')}` })
    } else if (r.status === 'ok') {
      out.push({ level: 'dim', text: `${name} — already has what beast needs` })
    } else if (r.status === 'no-parser') {
      out.push({ level: 'warn', text: `${name} — skipped, no python3 with tomllib (3.11+) to verify the edit with` })
    } else if (r.status === 'unparseable') {
      out.push({ level: 'warn', text: `${name} — left alone, it is not valid TOML (${r.detail})` })
    } else if (r.status === 'refused') {
      out.push({ level: 'warn', text: `${name} — not written: ${r.detail ?? (r.refusedKeys ?? []).join('; ')}` })
    }
    for (const n of r.notes ?? []) out.push({ level: 'dim', text: `  ${n}` })
    for (const k of r.refusedKeys ?? []) if (r.status === 'written') out.push({ level: 'warn', text: `  ${k}` })
  }
  return out
}
