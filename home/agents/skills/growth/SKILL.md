---
name: growth
description: >
  Product and growth: validation, briefs, pricing, SEO/AEO, launch, outreach, segmentation.
---

# Growth

Own idea → offer → discoverability → distribution. Orchestration loop: follow `$route` → `references/orchestration.md`.


## Module convention

Top-level skills are only: `$route` `$frontend` `$code` `$writing` `$motion` `$performance` `$security` `$growth` `$media`.

Any other `$name` (e.g. `$impeccable`, `$unslop`) is a **module**. Load it by reading:

`~/.agents/skill-modules/<name>/SKILL.md`

Do not expect modules in the skills menu. If the file is missing, search `~/.agents/skill-modules/` and pick the closest match.

## Phase 0 — Decide

- `$startup-pressure-test` for raw ideas / market risk
- `$product-brief` for one-page v1 scope
- `$decision-doc` for tradeoffs
- `$teardown` for competitive intel
- `$shape` when UX planning is the product decision

**Green:** Segment, problem, promise, next deliverable are concrete.

## Phase 1 — Package

- `$pricing-page`, `$ship-credits`, `$ship-email`
- Copy: `$writing` or `$app-copy` / `$unslop`

**Green:** Offer, limits, entitlements, and copy do not contradict.

## Phase 2 — Discoverability

- `$seo-ready`, `$aeo-ready`, `$readme`, `$changelog`
- Creative assets: `$media`

**Green:** Meta/schema/llms/links checked when relevant; assets open.

## Phase 3 — Distribution

- `$cold-email`, `$cold-outreach-sequence`, `$segment-users`
- Analytics (e.g. PostHog) when available

**Green:** Targets, message, limits, metrics explicit.

## Phase 4 — Build handoff

- UI → `$frontend`
- Logic → `$code`
- Keep product assumptions in the handoff

**Green:** Success metric named; residual risk stated.
---

## Modules (load by path, not slash menu)

Base: `~/.agents/skill-modules/`

When a phase names a former skill like impeccable or unslop, **read**:

`~/.agents/skill-modules/<module-name>/SKILL.md`

| Module | Path |
|--------|------|
| `startup-pressure-test` | `~/.agents/skill-modules/startup-pressure-test/SKILL.md` |
| `product-brief` | `~/.agents/skill-modules/product-brief/SKILL.md` |
| `decision-doc` | `~/.agents/skill-modules/decision-doc/SKILL.md` |
| `teardown` | `~/.agents/skill-modules/teardown/SKILL.md` |
| `shape` | `~/.agents/skill-modules/shape/SKILL.md` |
| `pricing-page` | `~/.agents/skill-modules/pricing-page/SKILL.md` |
| `ship-credits` | `~/.agents/skill-modules/ship-credits/SKILL.md` |
| `ship-email` | `~/.agents/skill-modules/ship-email/SKILL.md` |
| `seo-ready` | `~/.agents/skill-modules/seo-ready/SKILL.md` |
| `aeo-ready` | `~/.agents/skill-modules/aeo-ready/SKILL.md` |
| `readme` | `~/.agents/skill-modules/readme/SKILL.md` |
| `changelog` | `~/.agents/skill-modules/changelog/SKILL.md` |
| `cold-email` | `~/.agents/skill-modules/cold-email/SKILL.md` |
| `cold-outreach-sequence` | `~/.agents/skill-modules/cold-outreach-sequence/SKILL.md` |
| `segment-users` | `~/.agents/skill-modules/segment-users/SKILL.md` |

If a needed module is missing from the table, list `~/.agents/skill-modules/` and open the closest match.

