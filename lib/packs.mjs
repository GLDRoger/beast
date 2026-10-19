/**
 * Skill packs — the categories the installer offers.
 *
 * `core` is not optional: the eight primary workflows are the
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
 */
export const PACKS = {
  "core": {
    "label": "Core routing",
    "hint": "required — the eight primary workflows",
    "required": true,
    "skills": [
      "code",
      "frontend",
      "writing",
      "motion",
      "performance",
      "security",
      "growth",
      "media"
    ]
  },
  "design": {
    "label": "Frontend & design craft",
    "hint": "optional interaction, visual direction, Lottie, and canvas films",
    "skills": [
      "taste-craft",
      "3d-scenes",
      "apple-design",
      "redesign-skill",
      "tushar-design",
      "taste-skill-gpt",
      "transitions-dev",
      "review-animations",
      "compact-landing",
      "scroll-scenes",
      "text-to-lottie",
      "drawing-canvas-films"
    ]
  },
  "prose": {
    "label": "Writing & cleanup",
    "hint": "prose, visual-slop review, documentation, and outreach",
    "skills": [
      "unslop",
      "honest-prose",
      "explaining",
      "app-copy",
      "readme",
      "changelog",
      "cold-email",
      "cold-outreach-sequence"
    ]
  },
  "product": {
    "label": "Product & growth",
    "hint": "positioning, pricing, SEO, launch, and business validation",
    "skills": [
      "aeo-ready",
      "seo-ready",
      "pricing-page",
      "segment-users",
      "ship-credits",
      "ship-email",
      "startup-pressure-test",
      "teardown"
    ]
  },
  "engineering": {
    "label": "Engineering practice",
    "hint": "optional architecture, review, performance, and investigation methods",
    "skills": [
      "domain-modeling",
      "ai-features",
      "data-work",
      "dependency-upgrades",
      "long-work",
      "mobile",
      "improve-codebase-architecture",
      "wayfinder",
      "grilling",
      "handoff",
      "rate-limit",
      "debug-perf",
      "improve",
      "thermo-nuclear-code-quality-review",
      "review-swarm",
      "ruthless-release-qa",
      "ai-streaming",
      "web-shader-extractor"
    ]
  },
  "tooling": {
    "label": "Local agent tooling",
    "hint": "session mining, runtime triage, and machine-specific repair",
    "skills": [
      "codex-session-miner",
      "next-runtime-triage",
      "mac-codex-tooling-repair",
      "cua-driver",
      "headless-models"
    ]
  }
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
