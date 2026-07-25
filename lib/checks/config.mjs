// Contents-level checks for the three harness configs. The link checks in doctor
// prove the files are in place; these prove the files still make sense. Every
// failure here is one the harness itself reports as silence, not as an error.

import { existsSync, readFileSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { HOME } from '../platform.mjs'
import { tilde } from '../fsutil.mjs'

const CREDENTIAL = /^(sbp_|sk-|ghp_|xox|AKIA)/
const inHome = (...p) => join(HOME, ...p)
const expand = (p) => (p.startsWith('~/') || p === '~' ? join(HOME, p.slice(1)) : p)
const isDir = (p) => { try { return statSync(p).isDirectory() } catch { return false } }
const isFile = (p) => { try { return statSync(p).isFile() } catch { return false } }

// Node has no TOML parser and beast takes no dependencies, so borrow python3's
// stdlib tomllib and move the result across as JSON. A hand-rolled line reader
// would have to understand inline tables, arrays-of-tables and multi-line arrays
// — all of which appear in a real config.toml.
const TOML_TO_JSON = 'import json,sys,tomllib\nwith open(sys.argv[1],"rb") as f: json.dump(tomllib.load(f),sys.stdout,default=str)'

export function checkConfig({ fail, warn, targets = [] }) {
  let checked = 0
  const has = (t) => targets.includes(t)

  const readJson = (file) => {
    let text
    try { text = readFileSync(file, 'utf8') } catch { return null }
    try {
      const v = JSON.parse(text)
      return v && typeof v === 'object' ? v : {}
    } catch (err) {
      fail(`${tilde(file)} is not valid JSON (${err.message}) — the harness ignores the whole file, so every setting in it is silently off`)
      return undefined
    }
  }

  /** Parsed TOML, null when absent, undefined when unusable. */
  const readToml = (file) => {
    if (!existsSync(file)) return null
    try {
      return JSON.parse(execFileSync('python3', ['-c', TOML_TO_JSON, file], {
        encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
      }))
    } catch (err) {
      // No python3 means no TOML parser at all — degrade to a warning rather than
      // reporting a healthy config as broken.
      if (err.code === 'ENOENT') {
        warn(`python3 not found — skipped TOML validation of ${tilde(file)}`)
        return undefined
      }
      const detail = String(err.stderr ?? err.message).trim().split('\n').pop()
      fail(`${tilde(file)} is not valid TOML (${detail})`)
      return undefined
    }
  }

  // --- claude ---------------------------------------------------------------
  if (has('claude')) {
    const file = inHome('.claude', 'settings.json')
    const s = readJson(file)
    if (s === null) warn(`${tilde(file)} missing — beast ships it as .example and never writes it`)
    else if (s) {
      checked++
      const known = new Set(Object.keys(s.extraKnownMarketplaces ?? {}))
      const registry = readJson(inHome('.claude', 'plugins', 'known_marketplaces.json'))
      for (const k of Object.keys(registry ?? {})) known.add(k)

      for (const key of Object.keys(s.enabledPlugins ?? {})) {
        const at = key.lastIndexOf('@')
        if (at < 1 || at === key.length - 1) {
          fail(`enabledPlugins key "${key}" is not plugin@marketplace`)
        } else if (!known.has(key.slice(at + 1))) {
          fail(`plugin "${key}" names marketplace "${key.slice(at + 1)}", which is in neither extraKnownMarketplaces nor plugins/known_marketplaces.json — it will not load`)
        }
      }

      for (const [name, entry] of Object.entries(s.extraKnownMarketplaces ?? {})) {
        const src = entry?.source
        if (src?.source !== 'directory') continue
        if (!src.path) fail(`marketplace "${name}" is source=directory with no path`)
        else if (!existsSync(expand(src.path))) fail(`marketplace "${name}" points at a missing directory: ${tilde(expand(src.path))}`)
      }

      const cmd = s.statusLine?.command
      if (typeof cmd === 'string' && cmd.trim()) {
        const paths = commandPaths(cmd)
        if (paths.length && !paths.some(existsSync)) {
          fail(`statusLine.command references nothing that exists: ${cmd}`)
        }
      }

      // Two spellings of one setting: whichever the harness reads, the other is a
      // lie the next reader of this file will believe.
      if (s.voice && typeof s.voice === 'object' && typeof s.voiceEnabled === 'boolean') {
        warn(`both "voice" and "voiceEnabled" are set in ${tilde(file)} — one is ignored`)
      }
    }
  }

  // --- codex ----------------------------------------------------------------
  if (has('codex')) {
    const file = inHome('.codex', 'config.toml')
    const t = readToml(file)
    if (t === null) warn(`${tilde(file)} missing — beast ships it as .example and never writes it`)
    else if (t) {
      checked++
      const mif = t.model_instructions_file
      if (typeof mif === 'string' && !isFile(expand(mif))) {
        fail(`model_instructions_file does not exist: ${tilde(expand(mif))}`)
      }

      for (const entry of asArray(t.skills?.config)) {
        if (typeof entry?.path !== 'string') continue   // name-based entries resolve elsewhere
        if (!existsSync(expand(entry.path))) fail(`skills.config path does not exist: ${tilde(expand(entry.path))}`)
      }

      for (const [name, srv] of Object.entries(t.mcp_servers ?? {})) {
        for (const [k, v] of Object.entries(srv?.env ?? {})) {
          if (typeof v === 'string' && CREDENTIAL.test(v)) {
            fail(`mcp_servers.${name}.env.${k} holds an inline credential (${v.slice(0, 6)}…) — use env_vars and keep the value in the environment`)
          }
        }
      }

      if (t.sandbox_mode === 'danger-full-access' && t.approval_policy === 'never') {
        warn('codex is set to danger-full-access with approval_policy = "never" — any command runs unattended against the whole filesystem')
      }
    }
  }

  // --- grok -----------------------------------------------------------------
  if (has('grok')) {
    const file = inHome('.grok', 'config.toml')
    const t = readToml(file)
    if (t === null) warn(`${tilde(file)} missing — beast ships it as .example and never writes it`)
    else if (t) {
      checked++
      for (const p of asArray(t.skills?.paths)) {
        if (typeof p === 'string' && !isDir(expand(p))) fail(`[skills] path is not a directory: ${tilde(expand(p))}`)
      }
      for (const p of asArray(t['system-prompt-overrides']?.paths)) {
        if (typeof p === 'string' && !isFile(expand(p))) fail(`[system-prompt-overrides] path is not a file: ${tilde(expand(p))}`)
      }
      for (const p of asArray(t.agents?.paths)) {
        if (typeof p === 'string' && !isDir(expand(p))) warn(`[agents] path does not exist: ${tilde(expand(p))}`)
      }
    }
  }

  return { checked }
}

const asArray = (v) => (Array.isArray(v) ? v : v == null ? [] : [v])

/**
 * Candidate filesystem paths inside a shell command line. A status line is
 * usually `interpreter "<script>"`, so accept both the quoted segments and any
 * bare token holding a separator, and treat the command as valid if any resolves.
 */
function commandPaths(cmd) {
  const out = []
  for (const m of cmd.matchAll(/"([^"]+)"|'([^']+)'|(\S+)/g)) {
    const tok = m[1] ?? m[2] ?? m[3]
    if (tok.includes('/')) out.push(expand(tok))
  }
  return out
}
