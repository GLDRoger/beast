// What Claude Code actually charges for a skill: one line in the skill listing it
// sends every turn. The cost is characters, not a count, so 27 verbose skills can be
// more expensive than 40 terse ones.
//
// Every constant here was read out of the shipped CLI (claude 2.1.220, functions
// `sbs` / `DLt` / `ILt` / `OLt` in the bundle) rather than guessed:
//
//   entry   = `- ${name}: ${description}`   description capped at skillListingMaxDescChars
//   listing = entries joined with newlines
//   budget  = SLASH_COMMAND_TOOL_CHAR_BUDGET, when set, else
//             skillListingBudgetFraction × charsPerToken × contextWindowTokens
//
// Two of those inputs depend on the model the session happens to run, which beast cannot
// know, so the budget is a range rather than a number: `kC()` returns 4 chars/token for a
// fixed list of older models (claude-3-* through claude-{opus,sonnet}-4-6) and 3 for
// everything newer, opus-5 included. At the default 1% of a 200k window that is 6,000
// characters on a current model and 8,000 on an older one. A 1M-context session gets 5x.
//
// Going over does not hide a skill. Claude Code shortens entries to `- ${name}`,
// dropping the description of the lowest-scoring skills first, where the score is
// `usageCount × 0.5^(daysSinceUse / 7)`. A skill you have never invoked scores 0, so a
// fresh beast install is the first thing to lose its descriptions — which is exactly
// when its routers most need them.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { inHome } from './manifest.mjs'

/** Claude Code's default `skillListingBudgetFraction` (1% of the context window). */
export const BUDGET_FRACTION = 0.01

/** Per-entry description cap: Claude Code's default `skillListingMaxDescChars`. */
export const MAX_DESC_CHARS = 1536

/**
 * `kC()`: 3 chars/token for any model outside its hard-coded older set, 4 inside it.
 * Both are live — which one applies depends on the session's model — so beast reports
 * the range and lets severity follow certainty: over 4x is truncation on every 200k
 * model, over 3x is truncation on a current one.
 */
export const CHARS_PER_TOKEN = 3
export const CHARS_PER_TOKEN_LEGACY = 4

/**
 * Baseline context window the budget is computed against.
 *
 * beast cannot know which model a future session will run, and the budget scales with
 * it: a 1M-context session gets 5× this. 200k is the floor across current models, so
 * measuring against it reports the tightest budget the user could hit rather than a
 * generous one they might not.
 */
export const CONTEXT_TOKENS = 200_000

const SETTINGS = '.claude/settings.json'

/**
 * Undo YAML quoting the way a real parser would, because the count has to match what
 * Claude Code renders. A single-quoted scalar escapes its quote by doubling it
 * (`composition''s`), a double-quoted one with a backslash; leaving either in place both
 * over-counts the entry and prints a doubled apostrophe in `beast skills`.
 */
const unquote = (s) => {
  const q = s[0]
  if ((q === '"' || q === "'") && s.length > 1 && s.at(-1) === q) {
    const body = s.slice(1, -1)
    return q === "'" ? body.replace(/''/g, "'") : body.replace(/\\(["\\])/g, '$1')
  }
  return s.replace(/^["']|["']$/g, '')   // unbalanced: strip the stray quote, as before
}

/** Strip a block-scalar marker, collapse whitespace, unquote. */
const clean = (s) => unquote(s
  .replace(/^[>|][-+]?\s*/, '')
  .replace(/\s+/g, ' ')
  .trim())

/**
 * Scalar keys from a SKILL.md frontmatter block.
 *
 * The single frontmatter reader in the codebase: the cap measurement and `beast skills
 * list` both need it, and two parsers would disagree about exactly the descriptions
 * being billed. Block scalars (`description: >`) put the text on the following indented
 * lines, and a leading `---` is optional so a fragment still parses.
 */
export function frontmatter(dir) {
  let md
  try { md = readFileSync(join(dir, 'SKILL.md'), 'utf8') } catch { return {} }

  const lines = md.split(/\r?\n/)
  const out = {}
  let key = null
  let buf = []
  const flush = () => { if (key) out[key] = clean(buf.join(' ')); key = null; buf = [] }

  for (const raw of lines.slice(lines[0]?.trim() === '---' ? 1 : 0)) {
    if (raw.trim() === '---') break                       // end of frontmatter
    const kv = raw.match(/^([A-Za-z][\w-]*):\s?(.*)$/)
    if (kv) { flush(); key = kv[1]; buf = [kv[2]]; continue }
    if (key && /^\s+\S/.test(raw)) { buf.push(raw.trim()); continue }   // continuation
    if (!raw.trim()) continue                             // blank line inside a scalar
    flush()
  }
  flush()
  return out
}

/**
 * Tolerant settings.json read. A malformed file is the user's, not ours to repair, but
 * `malformed` is reported so callers can say so: silently defaulting hides that the
 * budget, the enabled-plugin list and everything else in there is being ignored.
 */
export function claudeSettings(path = inHome(SETTINGS)) {
  let text
  try { text = readFileSync(path, 'utf8') } catch { return { settings: null, malformed: false } }
  try { return { settings: JSON.parse(text), malformed: false } } catch { return { settings: null, malformed: true } }
}

/**
 * Per-entry description cap, honouring `skillListingMaxDescChars`.
 * Floored at 1: a fraction below 1 would floor to 0, and `slice(0, -1)` then truncates
 * nothing while claiming to.
 */
export function maxDescChars(settings) {
  const raw = settings?.skillListingMaxDescChars
  return typeof raw === 'number' && raw > 0 ? Math.max(1, Math.floor(raw)) : MAX_DESC_CHARS
}

/**
 * The character budget this machine gives the skill listing, and where it came from.
 *
 * `chars` is the tight end of the range (3 chars/token, current models) and `charsHigh`
 * the loose end (4, older models). They are equal when SLASH_COMMAND_TOOL_CHAR_BUDGET
 * fixes an absolute budget, which no model-dependent factor then scales.
 *
 * `invalid` means settings.json holds a `skillListingBudgetFraction` that Claude Code's
 * own schema rejects (a number in (0, 1]), so the default applies and the user believes
 * they raised something they did not.
 */
export function listingBudget(settings) {
  const env = Number(process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET)
  if (Number.isFinite(env) && env > 0) {
    // Floored at 1 like DLt() does, so a fractional value cannot produce a 0-char budget
    // that every later percentage divides by.
    const chars = Math.max(1, Math.floor(env))
    return { chars, charsHigh: chars, fraction: null, source: 'SLASH_COMMAND_TOOL_CHAR_BUDGET', invalid: false }
  }
  const raw = settings?.skillListingBudgetFraction
  const valid = typeof raw === 'number' && raw > 0 && raw <= 1
  const fraction = valid ? raw : BUDGET_FRACTION
  const at = (perToken) => Math.max(1, Math.floor(fraction * perToken * CONTEXT_TOKENS))
  return {
    chars: at(CHARS_PER_TOKEN),
    charsHigh: at(CHARS_PER_TOKEN_LEGACY),
    fraction,
    source: valid ? 'settings.json' : 'default',
    // null counts as absent, not as a mistake: Claude Code reads the key with `??`, so
    // null and a missing key behave identically there.
    invalid: raw !== undefined && raw !== null && !valid,
  }
}

/**
 * What one skill directory costs in the listing.
 *
 * `fallbackName` is the directory name, used when frontmatter omits `name` — the same
 * fallback Claude Code applies. Plugin skills are addressed as `plugin:skill` by the
 * Skill tool; the listing shows the plain name, so that is what is measured.
 */
export function entryCost(dir, fallbackName, maxDesc = MAX_DESC_CHARS, fm = frontmatter(dir)) {
  const name = fm.name || fallbackName
  // Joined from the parts that exist. A skill with whenToUse but no description would
  // otherwise be billed for a leading " - " that nothing renders.
  const desc = [fm.description, fm.whenToUse].filter(Boolean).join(' - ')
  const shown = desc.length > maxDesc ? `${desc.slice(0, maxDesc - 1)}…` : desc
  return { name, chars: `- ${name}: ${shown}`.length, descChars: shown.length }
}

/** Total listing size for a set of measured entries: the entries plus the newlines. */
export const listingChars = (rows) =>
  rows.reduce((n, r) => n + r.chars, 0) + Math.max(0, rows.length - 1)

/** Smallest `skillListingBudgetFraction`, at 1% granularity, that fits `chars`. */
export const fractionFor = (chars) =>
  Math.min(1, Math.ceil((chars / (CHARS_PER_TOKEN * CONTEXT_TOKENS)) * 100) / 100)

/** 7434 -> "7,434". Char counts get big enough that unseparated digits misread. */
export const commas = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

const fromEnv = (budget) => budget.source === 'SLASH_COMMAND_TOOL_CHAR_BUDGET'

/** "6,000" when the range collapses, "6,000–8,000" when the model decides which. */
export const budgetSpan = (budget) => budget.chars === budget.charsHigh
  ? commas(budget.chars)
  : `${commas(budget.chars)}–${commas(budget.charsHigh)}`

/**
 * Where the budget number came from, in one phrase. The model caveats are part of it:
 * an absolute char budget in the environment scales with neither the model's
 * chars-per-token nor its context window, and the computed one scales with both.
 */
export const budgetOrigin = (budget) => fromEnv(budget)
  ? `${commas(budget.chars)} chars, fixed by SLASH_COMMAND_TOOL_CHAR_BUDGET for every model — ` +
    'that variable overrides skillListingBudgetFraction'
  : `${budgetSpan(budget)} chars = ${budget.fraction} × ${CHARS_PER_TOKEN}–${CHARS_PER_TOKEN_LEGACY} chars/token × ` +
    `${commas(CONTEXT_TOKENS)} tokens (${budget.source}); ${CHARS_PER_TOKEN} on current models, ` +
    `${CHARS_PER_TOKEN_LEGACY} up to sonnet-4-6, and a 1M-context session gets 5x`

/**
 * How to buy more budget on THIS machine. An absolute char budget in the environment
 * beats the settings key inside Claude Code, so advising the key while the env var is
 * set would be advice that changes nothing.
 */
export const raiseLever = (budget, chars) => fromEnv(budget)
  ? `raise or unset SLASH_COMMAND_TOOL_CHAR_BUDGET (now ${commas(budget.chars)})`
  : `"skillListingBudgetFraction": ${fractionFor(chars)} in ~/.claude/settings.json`

/**
 * How to describe the ceiling that was just exceeded. With an absolute budget from the
 * environment there is no model-dependent high end to talk about.
 */
export const ceilingPhrase = (budget) => budget.chars === budget.charsHigh
  ? `the ${commas(budget.chars)}-char budget`
  : `even the ${commas(budget.charsHigh)} chars the most generous 200k-context model allows`
