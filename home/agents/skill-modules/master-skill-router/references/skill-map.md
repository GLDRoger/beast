# Skill & workflow map

Canonical inventory: `~/.agents/skills` (SSOT).  
Mirrors: `~/.claude/skills`, `~/.codex/skills` (symlinks only).

## Workflow layer (orchestration)

Pick via `$workflow-router`. Shared loop: `workflow-router/references/orchestration.md`.

| Workflow | Owns |
|----------|------|
| `workflow-frontend-design` | UI design + build + visual QA |
| `workflow-typescript-logic` | TS/app logic, features, bugs, verify |
| `workflow-writing-copy` | Prose, UI copy, docs, outreach |
| `workflow-taste-motion` | Craft feel, micro-interactions, motion |
| `workflow-performance-stability` | Perf, jank, edge-case resilience |
| `workflow-security-optimization` | AuthZ, secrets, CASA, rate limits, audits |
| `workflow-product-growth` | Strategy, pricing, SEO/AEO, launch, growth |
| `workflow-content-media` | HyperFrames, Lottie, images, media pipelines |

Legacy: `master-*` skills are thin aliases to the table above.

## Project packs


## Specialist clusters (children — not orchestrators)

**Design lenses:** `impeccable`, thin wrappers (`arrange`, `polish`, …), `critique`, `shape`, `audit`, `adapt`, `onboard`, `extract`, style specialists.

**Motion craft:** `taste-craft`, `animate`, `transitions-dev`, `overdrive`, `review-animations`.

**Copy:** `unslop`, `app-copy`, `clarify`, `remove-ai-slop`, `readme`, `changelog`, `cold-email`.

**Engineering:** `debug-perf`, `optimize`, `harden`, `rate-limit`, `ai-streaming`, `improve`, `review-swarm`, …

**Media:** `hyperframes` (+ core/cli/registry/workflows), `media-use`, `talking-head-recut`, …

Full former map of individual skills still lives in git history of this file; prefer workflows first.
