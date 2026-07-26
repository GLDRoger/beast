// Single source of truth for what beast installs and what it refuses to ship.
// Everything else in the CLI reads from here.

import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HOME } from './platform.mjs'

export { HOME }
export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const PAYLOAD = join(REPO, 'home')

/** Claude Code loads every skill description into context. Keep the active set small. */
export const SKILL_CAP = 30

/**
 * Single files symlinked from $HOME into the repo.
 * Note `codex/AGENTS.md` has two targets on purpose — that is what collapses the
 * duplicate ~/.codex/AGENTS.md and ~/.agents/AGENTS.md into one real file.
 */
export const HARNESSES = {
  claude: { label: 'Claude Code', hint: '~/.claude', bin: 'claude' },
  codex:  { label: 'Codex',       hint: '~/.codex',  bin: 'codex' },
  grok:   { label: 'Grok',        hint: '~/.grok',   bin: 'grok' },
}
export const HARNESS_NAMES = Object.keys(HARNESSES)

/**
 * `target` is the harness a link belongs to. 'shared' means every harness reads it —
 * `~/.agents` is the common root all three discover skills from, so installing any
 * single harness still needs it.
 */
export const FILES = [
  { payload: 'claude/BEAST.v2.md', home: '.claude/BEAST.v2.md', target: 'claude' },
  { payload: 'claude/CLAUDE.md', home: '.claude/CLAUDE.md', target: 'claude' },
  { payload: 'codex/BEAST.v2.md', home: '.codex/BEAST.v2.md', target: 'codex' },
  { payload: 'codex/AGENTS.md', home: '.codex/AGENTS.md', target: 'codex' },
  // Same payload file, two homes — this is what collapses the duplicate AGENTS.md.
  { payload: 'codex/AGENTS.md', home: '.agents/AGENTS.md', target: 'shared' },
  { payload: 'grok/AGENTS.md', home: '.grok/AGENTS.md', target: 'grok' },
  // Loose docs inside the skill trees. They must be listed HERE, not left to the
  // tree walk: skillEntries only yields directories, so install never linked these
  // and $HOME kept its own stale copies — renames applied to the payload silently
  // failed to reach the files a tool actually reads.
  { payload: 'agents/skills/README.md', home: '.agents/skills/README.md', target: 'shared' },
  { payload: 'agents/skill-modules/README.md', home: '.agents/skill-modules/README.md', target: 'shared' },
]

/**
 * Directories whose *entries* are symlinked individually.
 * Never symlink these directories wholesale: the live dirs also hold private
 * packs we deliberately exclude from the repo, and a dir-level link would
 * make them disappear from the user's setup.
 */
export const TREES = [
  { payload: 'agents/skills', home: '.agents/skills', skills: true, target: 'shared' },
  // Linked like everything else. An earlier version skipped existing real dirs to
  // protect locally-present assets the payload omits — but that left $HOME holding
  // independent copies, and bootstrap then re-read those stale copies OVER payload
  // edits. The repo has to be the single source of truth; displaced local copies go
  // to BACKUP_ROOT like any other.
  { payload: 'agents/skill-modules', home: '.agents/skill-modules', skills: true, target: 'shared' },
  { payload: 'codex/prompts', home: '.codex/prompts', target: 'codex' },
  { payload: 'codex/scripts', home: '.codex/scripts', target: 'codex' },
]

/**
 * Extra skill-dir mirrors. Each tool discovers skills from its own path, so every
 * active skill is linked into all three — pointing straight at the repo, never at
 * another symlink, so there are no link chains to debug.
 */
export const SKILL_MIRRORS = [
  { home: '.claude/skills', target: 'claude' },
  { home: '.codex/skills', target: 'codex' },
]
/** Bare paths, for the callers that only need to scan the directories. */
export const SKILL_MIRROR_PATHS = SKILL_MIRRORS.map((m) => m.home)

/** Tool config that carries user state. Shipped as .example and never written by install. */
export const EXAMPLES = [
  { payload: 'claude/settings.json.example', home: '.claude/settings.json', target: 'claude' },
  { payload: 'codex/config.toml.example', home: '.codex/config.toml', target: 'codex' },
  { payload: 'grok/config.toml.example', home: '.grok/config.toml', target: 'grok' },
]

/**
 * Shell entry points. Both are always installed regardless of platform — they are
 * a few hundred bytes, and a WSL user who also runs the CLIs from PowerShell wants
 * both. `install` prints the one that matches the current shell.
 */
export const SHELL_SNIPPETS = [
  { payload: 'shell/beast.zsh', home: '.beast/beast.zsh', shell: 'zsh/bash', target: 'shared' },
  { payload: 'shell/beast.ps1', home: '.beast/beast.ps1', shell: 'powershell', target: 'shared' },
]

/** Does this entry apply to the chosen harnesses? */
export const wanted = (entry, targets) =>
  entry.target === 'shared' || targets.includes(entry.target)

/**
 * Displaced real files go here, mirroring their path under $HOME.
 * Must sit outside every tool's scan path: a backup named `<skill>.pre-beast`
 * left inside ~/.claude/skills gets discovered and loaded as a real skill.
 */
export const BACKUP_ROOT = join(HOME, '.beast', 'pre-beast')

/**
 * What the last install asked for. Without this, doctor cannot tell a deliberately
 * omitted skill from a broken one — a pack-scoped install produced 100 bogus
 * "not linked" failures, which buries the four real ones.
 */
export const SELECTION_FILE = join(HOME, '.beast', 'selection.json')

/**
 * Written by install, not shipped in the payload. The payload-side half of the path
 * check must skip these, or every reference to them reads as "the repo does not ship
 * it" — technically true and completely unhelpful.
 */
export const GENERATED_PATHS = ['.beast/delegation.md', '.beast/selection.json']

// ---------------------------------------------------------------------------
// Exclusions. Applied by scripts/bootstrap.mjs when populating the payload,
// and re-checked by `beast doctor` so nothing creeps back in later.
// ---------------------------------------------------------------------------

/**
 * Skills kept out of the repo.
 *
 * The first two are private client packs. The rest are dropped for provenance:
 *   chronicle           — OpenAI Codex built-in, not in the public codex tree, so no
 *                         verifiable grant exists.
 *   codex-effort-router — its references/goal-definition.md was 98.8% verbatim
 *                         Apache-2.0 OpenAI text with the notice left in a sibling dir.
 *   define-goal         — openai/skills; ships an unfilled Apache stub naming no holder.
 *   hatch-pet           — same unfilled Apache stub, and built on one vendor's
 *                         undocumented sprite format.
 */
export const EXCLUDE_SKILLS = [
  'avalon-operating-pack', 'questili-ops-launch',
  'chronicle', 'codex-effort-router', 'define-goal', 'hatch-pet',
]

/**
 * Lockfile display name → shipped directory. The lockfile records the name a skill
 * had at install time; several were renamed or merged afterwards, so a straight
 * key-to-directory match reports them as both unattributed AND stale — the same
 * skill counted as two separate faults.
 */
export const LOCK_RENAMES = {
  'emil-design-eng': 'taste-craft',   // renamed: content is being rewritten
  'teach-impeccable': 'impeccable',
  'frontend-design': 'impeccable',
  'website-to-video': 'website-to-hyperframes',
}

/**
 * Provenance for skills the lockfile never recorded, established by tracing each
 * one against its upstream. Attribution lives HERE and is rendered into NOTICE.md —
 * deliberately not injected into the skill files themselves, because these are being
 * rewritten and will diverge from what their original authors published.
 *
 * `holder` is the copyright holder where the upstream names one. `licenseText: false`
 * means the upstream license file was never vendored alongside the content.
 */
export const PROVENANCE = {
  // mattpocock/skills — MIT © Matt Pocock
  'domain-modeling':      { source: 'mattpocock/skills', url: 'https://github.com/mattpocock/skills', license: 'MIT', holder: 'Matt Pocock' },
  'grilling':             { source: 'mattpocock/skills', url: 'https://github.com/mattpocock/skills', license: 'MIT', holder: 'Matt Pocock' },
  'handoff':              { source: 'mattpocock/skills', url: 'https://github.com/mattpocock/skills', license: 'MIT', holder: 'Matt Pocock' },
  'improve-codebase-architecture': { source: 'mattpocock/skills', url: 'https://github.com/mattpocock/skills', license: 'MIT', holder: 'Matt Pocock' },
  'wayfinder':            { source: 'mattpocock/skills', url: 'https://github.com/mattpocock/skills', license: 'MIT', holder: 'Matt Pocock', derived: true },

  // Leonxlnx/taste-skill — MIT © Leonxlnx
  'redesign-skill':       { source: 'Leonxlnx/taste-skill', url: 'https://github.com/Leonxlnx/taste-skill', license: 'MIT', holder: 'Leonxlnx' },
  'taste-skill-gpt':      { source: 'Leonxlnx/taste-skill', url: 'https://github.com/Leonxlnx/taste-skill', license: 'MIT', holder: 'Leonxlnx' },

  // emilkowalski/skills — MIT
  'apple-design':         { source: 'emilkowalski/skills', url: 'https://github.com/emilkowalski/skills', license: 'MIT', holder: 'Emil Kowalski' },
  'taste-craft':          { source: 'emilkowalski/skills', url: 'https://github.com/emilkowalski/skills', license: 'MIT', holder: 'Emil Kowalski' },

  // single-upstream vendored skills
  'thermo-nuclear-code-quality-review': { source: 'cursor/plugins', url: 'https://github.com/cursor/plugins', license: 'MIT', holder: 'Cursor' },
  'text-to-lottie':       { source: 'diffusionstudio/lottie', url: 'https://github.com/diffusionstudio/lottie', license: 'MIT', holder: 'Diffusion Studio Inc.' },
  'cua-driver':           { source: 'trycua/cua', url: 'https://github.com/trycua/cua', license: 'MIT', holder: 'Cua AI, Inc.' },
  'startup-pressure-test': { source: 'Kappaemme-git/codex-startup-pressure-test-skill', url: 'https://github.com/Kappaemme-git/codex-startup-pressure-test-skill', license: 'MIT', holder: 'Francesco Mistero' },
  'unslop':               { source: 'hardikpandya/stop-slop', url: 'https://github.com/hardikpandya/stop-slop', license: 'MIT', holder: 'Hardik Pandya', derived: true, licenseText: true },
  'shape':                { source: 'pbakaus/impeccable', url: 'https://github.com/pbakaus/impeccable', license: 'Apache-2.0', derived: true },
  'website-to-hyperframes': { source: 'heygen-com/hyperframes', url: 'https://github.com/heygen-com/hyperframes', license: 'Apache-2.0', derived: true },

  // no clean grant — flagged rather than quietly shipped
  'web-shader-extractor': { source: 'lixiaolin94/skills', url: 'https://github.com/lixiaolin94/skills', license: 'MIT (README only — upstream ships no LICENSE file and names no holder)', unresolved: true },
  'product-design-psychology': { source: 'Product Design Psychology (book) by Wouter de Bres', url: 'https://productdesignpsychology.com/', license: 'none stated', derived: true, unresolved: true },
}

/** Written for this project. Not an attribution gap. */
export const OWN_SKILLS = [
  'route', 'frontend', 'code', 'writing', 'motion', 'performance', 'security', 'growth', 'media',
  'codex-session-miner', 'honest-prose', 'mac-codex-tooling-repair', 'next-runtime-triage',
  'review-swarm', 'ruthless-release-qa', 'scroll-scenes',
  'master-content-media', 'master-engineering', 'master-frontend', 'master-product-growth', 'master-skill-router',
]

/** Prompts coupled to a private product, plus one desktop toy. */
export const EXCLUDE_PROMPTS = [
  'quality-gate.md', 'ui-qa.md', 'pr-pack.md', 'cache-verify.md', 'rls-scout.md',
  'migration-check.md', 'transformer-field.md', 'voice-failover.md', 'diff-review.md',
  'docs-sync.md', 'test-plan.md', 'security-scan.md', 'PR-comments.md', 'petdex.md',
]

/**
 * Assets with explicit written terms against redistribution. These are the only
 * two carve-outs from "vendor everything" — GSAP is on npm/CDN so excluding it
 * costs nothing, and the CDPR fankit terms say non-commercial outright.
 */
export const EXCLUDE_PATHS = [
  'talking-head-recut/assets/vendor/gsap.min.js',
  'music-to-video/references/motion-primitives/assets/gsap.min.js',
  'embedded-captions/assets/brand',
]

/** Individual files excluded by name wherever they appear (private one-offs). */
export const EXCLUDE_FILES = ['avalon_prod_data_quality_audit.js']

/**
 * Junk that should never be committed. `.system` is the Codex-shipped system skill
 * set (imagegen, openai-docs, plugin-creator) — the tool provides it, we do not.
 */
export const EXCLUDE_ALWAYS = ['.DS_Store', '__pycache__', '.git', 'node_modules', '.system']
export const EXCLUDE_EXT = ['.pyc', '.zip']

/**
 * Text rewrites applied to staged content by bootstrap, and re-checked by doctor.
 *
 * These MUST be a repeatable step, not a manual edit. Anything hand-fixed in the
 * payload is silently reverted the next time bootstrap re-reads $HOME — that is
 * exactly how an earlier round of author-path cleanup got undone.
 */
export const SCRUB_REWRITES = [
  // any user's home dir, not just the original author's
  [/\/Users\/[A-Za-z0-9._-]+\//g, '~/'],
  [/\/home\/[A-Za-z0-9._-]+\//g, '~/'],
  // Renames, applied as text on every bootstrap. A rename is not durable as a
  // one-time edit: loose docs like agents/skills/README.md are files, not skill
  // dirs, so install never links them — bootstrap re-reads the stale $HOME copy and
  // the old name comes back. Rewriting here survives that.
  ...Object.entries({
    'design-eng': 'taste-craft',
    'stop-slop': 'unslop',
  }).map(([from, to]) => [new RegExp(`\\b${from}\\b`, 'g'), to]),
]

/**
 * Whole lines dropped from staged text when they reference something excluded.
 * Derived from EXCLUDE_SKILLS so the drop list and the reference cleanup cannot
 * diverge — a dropped skill that is still name-dropped in a router is a dead pointer.
 */
export const SCRUB_LINE_PATTERNS = [
  /alyna/i,
  ...EXCLUDE_SKILLS.map((n) => new RegExp(n.replace(/-operating-pack|-ops-launch/, ''), 'i')),
]

/** Only these extensions get scrubbed — never touch binaries or media. */
export const SCRUB_EXT = ['.md', '.py', '.mjs', '.js', '.json', '.toml', '.txt', '.sh', '.zsh']

/** Secret shapes `doctor` refuses to let you commit. */
export const SECRET_PATTERNS = [
  [/sbp_[a-z0-9]{40}/, 'Supabase PAT'],
  [/sk-ant-[A-Za-z0-9_-]{20,}/, 'Anthropic key'],
  [/sk-local-[a-f0-9]{64}/, 'CLIProxyAPI key'],
  [/sk-proj-[A-Za-z0-9_-]{20,}/, 'OpenAI key'],
  [/ghp_[A-Za-z0-9]{36}/, 'GitHub PAT'],
  [/xoxb-[0-9]{10,}-[A-Za-z0-9-]+/, 'Slack bot token'],
  [/AKIA[0-9A-Z]{16}/, 'AWS access key'],
  [/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, 'private key'],
]

/** Where the payload is sourced from on a machine that already has the setup. */
export const SOURCES = {
  'claude/BEAST.v2.md': '.claude/BEAST.v2.md',
  'claude/CLAUDE.md': '.claude/CLAUDE.md',
  'codex/BEAST.v2.md': '.codex/BEAST.v2.md',
  'codex/AGENTS.md': '.codex/AGENTS.md',
  'grok/AGENTS.md': '.grok/AGENTS.md',
  'agents/skills': '.agents/skills',
  'agents/skill-modules': '.agents/skill-modules',
  'codex/prompts': '.codex/prompts',
  'codex/scripts': '.codex/scripts',
}

export const inHome = (rel) => join(HOME, rel)
export const inPayload = (rel) => join(PAYLOAD, rel)
