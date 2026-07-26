---
name: frontend
description: >
  Product UI end-to-end: shape, visual direction, build, responsive, microcopy, visual QA. Not pure motion craft or pure backend logic.
---

# Frontend

Own product UI from intent to verified pixels. Orchestration loop: follow `$route` → `references/orchestration.md`.


## Module convention

Top-level skills are only: `$route` `$frontend` `$code` `$writing` `$motion` `$performance` `$security` `$growth` `$media`.

Any other `$name` (e.g. `$impeccable`, `$unslop`) is a **module**. Load it by reading:

`~/.agents/skill-modules/<name>/SKILL.md`

Do not expect modules in the skills menu. If the file is missing, search `~/.agents/skill-modules/` and pick the closest match.

## Phase 0 — Frame

**Goal:** Know user, surface, acceptance criteria, constraints.

- `$shape` before greenfield UI
- `$product-brief` if v1 scope is fuzzy
- `$critique` / `$teardown` when evaluating existing UI

**Green:** Implementable without inventing product goals.

## Phase 1 — Visual direction

**Goal:** Hierarchy, feel, system boundaries, edge states.

- Default parent: `$impeccable` (covers arrange/typeset/colorize/bolder/quieter/delight/distill/polish/normalize)
- Specialists only if asked: `$redesign-skill`, `$tushar-design`, `$taste-skill-gpt`, `$apple-design`, `$compact-landing`

**Green:** Direction explicit; not still "pick a vibe."

## Phase 2 — Build

**Goal:** Happy path + key edges in the canonical codepath.

- `$extract` for repeated patterns → system
- `$app-copy` / `$clarify` for labels and states (or hand off to `$writing` for large copy jobs)
- `$onboard` for first-run / empty states
- `$adapt` for responsive
- `$harden` for overflow/i18n/errors (or `$performance` if resilience is the main job)
- Product systems as needed: `$ai-streaming`, `$pricing-page`, `$ship-credits`, `$ship-email`

**Green:** Primary path works; no duplicate legacy UI left in the touched surface.

## Phase 3 — Motion (optional)

**Goal:** Motion that clarifies, not decorates.

- Prefer `$motion` when motion/craft is the bulk of the work
- Light touch here: `$animate`, `$transitions-dev`, `$review-animations`

**Green:** Fast, interruptible where needed, reduced-motion safe.

## Phase 4 — Visual QA & release

**Goal:** Ship-ready UI evidence.

- `$audit` (a11y/theme/responsive/anti-patterns)
- `$critique` if design judgment still needed
- Browser/screenshots when visual claims are made

**Green:** UI matches intent; checks named; skips explicit.

## Hand off to other workflows when

| Signal | Switch to |
|--------|-----------|
| Heavy TS logic / API / data model | `$code` |
| Perf jank / stability only | `$performance` |
| Auth, CASA, secrets, abuse | `$security` |
| Long-form or marketing prose | `$writing` |
---

## Modules (load by path, not slash menu)

Base: `~/.agents/skill-modules/`

When a phase names a former skill like impeccable or unslop, **read**:

`~/.agents/skill-modules/<module-name>/SKILL.md`

| Module | Path |
|--------|------|
| `impeccable` | `~/.agents/skill-modules/impeccable/SKILL.md` |
| `shape` | `~/.agents/skill-modules/shape/SKILL.md` |
| `critique` | `~/.agents/skill-modules/critique/SKILL.md` |
| `teardown` | `~/.agents/skill-modules/teardown/SKILL.md` |
| `redesign-skill` | `~/.agents/skill-modules/redesign-skill/SKILL.md` |
| `tushar-design` | `~/.agents/skill-modules/tushar-design/SKILL.md` |
| `taste-skill-gpt` | `~/.agents/skill-modules/taste-skill-gpt/SKILL.md` |
| `apple-design` | `~/.agents/skill-modules/apple-design/SKILL.md` |
| `compact-landing` | `~/.agents/skill-modules/compact-landing/SKILL.md` |
| `arrange` | `~/.agents/skill-modules/arrange/SKILL.md` |
| `typeset` | `~/.agents/skill-modules/typeset/SKILL.md` |
| `colorize` | `~/.agents/skill-modules/colorize/SKILL.md` |
| `bolder` | `~/.agents/skill-modules/bolder/SKILL.md` |
| `quieter` | `~/.agents/skill-modules/quieter/SKILL.md` |
| `delight` | `~/.agents/skill-modules/delight/SKILL.md` |
| `distill` | `~/.agents/skill-modules/distill/SKILL.md` |
| `polish` | `~/.agents/skill-modules/polish/SKILL.md` |
| `normalize` | `~/.agents/skill-modules/normalize/SKILL.md` |
| `extract` | `~/.agents/skill-modules/extract/SKILL.md` |
| `adapt` | `~/.agents/skill-modules/adapt/SKILL.md` |
| `onboard` | `~/.agents/skill-modules/onboard/SKILL.md` |
| `audit` | `~/.agents/skill-modules/audit/SKILL.md` |
| `harden` | `~/.agents/skill-modules/harden/SKILL.md` |
| `app-copy` | `~/.agents/skill-modules/app-copy/SKILL.md` |
| `clarify` | `~/.agents/skill-modules/clarify/SKILL.md` |
| `pricing-page` | `~/.agents/skill-modules/pricing-page/SKILL.md` |
| `ship-credits` | `~/.agents/skill-modules/ship-credits/SKILL.md` |
| `ship-email` | `~/.agents/skill-modules/ship-email/SKILL.md` |
| `ai-streaming` | `~/.agents/skill-modules/ai-streaming/SKILL.md` |

If a needed module is missing from the table, list `~/.agents/skill-modules/` and open the closest match.

