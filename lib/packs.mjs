/**
 * Skill packs — the categories the installer offers.
 *
 * `core` is not optional: the nine routers plus their compatibility aliases are the
 * dispatch layer every other pack is reached through. Installing a pack without it
 * gives you skills nothing routes to.
 *
 * Every module in the payload must appear in exactly one pack. A test asserts that,
 * because a module missing from this file is silently uninstallable — worse than a
 * miscategorised one.
 *
 * Entries are payload DIRECTORY names, not SKILL.md `name:` fields — install.mjs gates
 * on `skillEntries(...).name`. So `redesign-skill` (name: redesign-existing-projects),
 * `taste-skill-gpt` (name: gpt-taste) and `cua-driver` (name: cua-driver-rs) are correct
 * as written and must not be "fixed" to their frontmatter names.
 *
 * Categorising rule for the pbakaus/impeccable wrapper family: a wrapper whose SKILL.md
 * unconditionally invokes `$impeccable` ships broken without it, so it lives in the same
 * pack as `impeccable` (design) regardless of what its blurb is about. Only `harden`
 * invokes it conditionally ("if visual/copy changes will ship") and is free to sit
 * elsewhere.
 */
export const PACKS = {
  core: {
    label: 'Core routing',
    hint: 'required — the dispatch layer',
    required: true,
    skills: [
      'route', 'code', 'frontend', 'writing', 'motion', 'performance', 'security', 'growth', 'media',
      'master-skill-router', 'master-engineering', 'master-frontend', 'master-product-growth', 'master-content-media',
    ],
  },

  design: {
    label: 'Frontend & design craft',
    hint: 'visual direction, component feel, polish, UI copy',
    skills: [
      'impeccable', 'shape', 'taste-craft', 'apple-design', 'redesign-skill', 'tushar-design',
      'taste-skill-gpt', 'transitions-dev', 'review-animations', 'animate', 'polish', 'delight',
      'bolder', 'colorize', 'typeset', 'arrange', 'normalize', 'overdrive', 'quieter', 'adapt',
      'critique', 'audit', 'extract', 'distill', 'compact-landing', 'scroll-scenes',
      'product-design-psychology', 'remove-ai-slop', 'clarify', 'onboard',
    ],
  },

  video: {
    label: 'Video & media production',
    hint: 'HyperFrames, Lottie, captions — needs the hyperframes CLI',
    skills: [
      'hyperframes', 'hyperframes-animation', 'hyperframes-cli', 'hyperframes-core',
      'hyperframes-creative', 'hyperframes-keyframes', 'hyperframes-registry',
      'media-use', 'website-to-hyperframes', 'embedded-captions', 'faceless-explainer',
      'general-video', 'motion-graphics', 'music-to-video', 'pr-to-video',
      'product-launch-video', 'slideshow', 'talking-head-recut', 'remotion-to-hyperframes',
      'text-to-lottie', 'figma',
    ],
  },

  prose: {
    label: 'Writing & copy',
    hint: 'prose quality, docs, outreach',
    skills: [
      'unslop', 'honest-prose', 'app-copy', 'readme', 'changelog',
      'cold-email', 'cold-outreach-sequence',
    ],
  },

  product: {
    label: 'Product & growth',
    hint: 'positioning, pricing, SEO, launch, monetisation plumbing',
    skills: [
      'aeo-ready', 'seo-ready', 'pricing-page', 'product-brief', 'segment-users',
      'ship-credits', 'ship-email', 'startup-pressure-test', 'teardown', 'decision-doc',
    ],
  },

  engineering: {
    label: 'Engineering practice',
    hint: 'architecture, review, hardening, perf, deep investigation',
    skills: [
      'domain-modeling', 'improve-codebase-architecture', 'wayfinder', 'grilling', 'handoff',
      'harden', 'rate-limit', 'debug-perf', 'optimize', 'improve',
      'thermo-nuclear-code-quality-review', 'review-swarm', 'ruthless-release-qa', 'ai-streaming',
      'web-shader-extractor',
    ],
  },

  tooling: {
    label: 'Local agent tooling',
    hint: 'session mining, triage, macOS repair — quite machine-specific',
    skills: ['codex-session-miner', 'next-runtime-triage', 'mac-codex-tooling-repair', 'cua-driver'],
  },
}

/** Pack names in a stable display order, core first. */
export const PACK_NAMES = Object.keys(PACKS)

/** Every skill any pack claims. */
export const packSkills = (names) =>
  [...new Set(names.flatMap((n) => PACKS[n]?.skills ?? []))]

/** Which pack claims this skill, or null. */
export function packOf(skill) {
  for (const [name, p] of Object.entries(PACKS)) if (p.skills.includes(skill)) return name
  return null
}

export const REQUIRED_PACKS = PACK_NAMES.filter((n) => PACKS[n].required)
