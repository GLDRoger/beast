import { readFileSync, writeFileSync, copyFileSync, mkdirSync, renameSync, unlinkSync, openSync, closeSync, fchmodSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inHome, inPayload, GENERATED_MARKER } from './manifest.mjs'
import { writeGenerated, backupPathFor, lstat } from './fsutil.mjs'

const COMPATIBILITY = '## Google CLI runtime compatibility'
const CAPABILITIES = '## Available runtime capabilities'

/** Gemini replaces its system prompt; Antigravity has no GEMINI_SYSTEM_MD support. */
export function assembleGemini({ base, policy, overlay }) {
  if (!overlay.startsWith(COMPATIBILITY) || !overlay.includes(CAPABILITIES)) {
    throw new Error('Gemini overlay is missing its compatibility or capabilities heading')
  }
  for (const key of ['AvailableTools', 'AgentSkills', 'SubAgents']) {
    if (!overlay.includes('${' + key + '}')) throw new Error(`Gemini overlay is missing ${key}`)
  }
  const marker = `<!-- ${GENERATED_MARKER} -->`
  const compatibility = overlay.slice(0, overlay.indexOf(CAPABILITIES)).trim()
  return {
    system: `${marker}\n\n${base.trim()}\n\n${overlay.trim()}\n`,
    rules: `${marker}\n\n${base.trim()}\n\n${policy.trim()}\n\n${compatibility}\n`,
  }
}

export function geminiPrompts() {
  return assembleGemini({
    base: readFileSync(inPayload('shared/BEAST.md'), 'utf8'),
    policy: readFileSync(inPayload('shared/USER.md'), 'utf8'),
    overlay: readFileSync(inPayload('gemini/system.overlay.md'), 'utf8'),
  })
}

export function writeGeminiPrompts() {
  const { system, rules } = geminiPrompts()
  return [
    writeGenerated(inHome('.gemini/system.md'), system),
    writeGenerated(inHome('.gemini/config/AGENTS.md'), rules),
  ]
}

/** Preserve every unrelated key, permissions, and the original before replacing config. */
function editConfig(rel, transform) {
  const file = inHome(rel)
  const st = lstat(file)
  if (st && !st.isFile()) return { ok: false, reason: `refusing to replace non-regular config ${rel}` }
  let tmp, created = false
  try {
    const before = st ? readFileSync(file, 'utf8') : ''
    const after = transform(before)
    if (before === after) return { ok: true }
    const backup = st ? backupPathFor(file) : null
    if (backup && lstat(backup)) return { ok: false, reason: `${rel} backup already exists — resolve by hand` }
    mkdirSync(dirname(file), { recursive: true })
    if (backup) {
      mkdirSync(dirname(backup), { recursive: true })
      copyFileSync(file, backup)
    }
    tmp = `${file}.beast-tmp`
    // Exclusive creation prevents following a pre-existing temporary symlink.
    const fd = openSync(tmp, 'wx', st ? st.mode & 0o777 : 0o600)
    created = true
    try {
      writeFileSync(fd, after)
      if (st) fchmodSync(fd, st.mode & 0o777)
    } finally { closeSync(fd) }
    renameSync(tmp, file)
    return { ok: true, ...(backup ? { backup } : {}) }
  } catch (err) {
    // Never print config content: .env and settings may contain credentials.
    if (created) { try { unlinkSync(tmp) } catch { /* no temporary file */ } }
    return { ok: false, reason: `${err.code ?? err.name} updating ${rel}` }
  }
}

/** Only requested by install --write-config; bare install never rewrites user state. */
export function writeGeminiConfig() {
  return [
    editConfig('.gemini/settings.json', (text) => {
      const settings = text ? JSON.parse(text) : {}
      if (!settings || typeof settings !== 'object' || Array.isArray(settings) ||
          (settings.context !== undefined && (!settings.context || typeof settings.context !== 'object' || Array.isArray(settings.context)))) {
        throw new Error('invalid Gemini settings structure')
      }
      const names = ['GEMINI.md', 'AGENTS.md']
      if (JSON.stringify(settings.context?.fileName) === JSON.stringify(names)) return text
      settings.context = { ...settings.context, fileName: names }
      return JSON.stringify(settings, null, 2) + '\n'
    }),
    editConfig('.gemini/.env', (text) => {
      const line = `GEMINI_SYSTEM_MD=${inHome('.gemini/system.md')}`
      const pattern = /^(?:export\s+)?GEMINI_SYSTEM_MD=.*$/gm
      const matches = [...text.matchAll(pattern)]
      if (matches.length > 1) throw new Error('duplicate GEMINI_SYSTEM_MD')
      return matches.length ? text.replace(pattern, () => line) : `${text}${text && !text.endsWith('\n') ? '\n' : ''}${line}\n`
    }),
  ]
}

// Shell launchers refresh the composed files without reinstalling skills or changing
// selection.json. Direct/GUI launches use the last generated output; reinstall to refresh.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const results = writeGeminiPrompts()
  for (const r of results) {
    if (r.backup) console.error(`beast: moved aside ${r.backup}`)
    if (!r.ok) console.error(`beast: ${r.reason}`)
  }
  if (results.some((r) => !r.ok)) process.exitCode = 1
}
