---
name: motion
description: >
  Taste and animation: micro-interactions, transitions, craft polish, motion review.
---

# Motion

Own interaction craft and motion. Orchestration loop: follow `$route` → `references/orchestration.md`.


## Module convention

Top-level skills are only: `$route` `$frontend` `$code` `$writing` `$motion` `$performance` `$security` `$growth` `$media`.

Any other `$name` (e.g. `$impeccable`, `$unslop`) is a **module**. Load it by reading:

`~/.agents/skill-modules/<name>/SKILL.md`

The skills menu lists only the nine top-level skills; every module loads by that path. If the file is missing, search `~/.agents/skill-modules/` and pick the closest match.

## Phase 0 — Intent

**Goal:** What should *feel* different, and how often will users see it?

- Frequency test (from `$taste-craft`): 100×/day → no animation; rare → may delight
- Brand energy: calm vs playful vs premium
- Prefer `$impeccable` teach if design context is missing

**Green:** Purpose of motion is stated (feedback, continuity, guidance, earned delight).

## Phase 1 — Craft baseline

**Goal:** Invisible correctness before spectacle.

- `$taste-craft` for interaction craft (press, origin-aware popovers, easing, springs)
- `$impeccable` + thin lenses (`$polish`, `$delight`, `$distill`, `$quieter`, `$bolder`) as needed
- `$taste-skill-gpt` / `$tushar-design` only when that aesthetic is requested

**Green:** Defaults feel intentional; no `transition: all` / `scale(0)` / `ease-in` UI sins.

## Phase 2 — Motion system

**Goal:** Coherent vocabulary, not random effects.

- `$animate` → `$impeccable` motion refs (micro-interactions)
- `$transitions-dev` for production panel/route/loading transitions
- `$overdrive` only for deliberate technical ambition (propose before build)
- `$scroll-scenes` for scroll-driven essays
- HyperFrames motion → `$media` / `$hyperframes-animation`

**Green:** 2–3 repeated patterns; 60fps intent; `prefers-reduced-motion` path exists.

## Phase 3 — Review

**Goal:** Ship motion that still feels good tomorrow.

- `$review-animations` before non-trivial ship
- Slow-mo / real device when gestures matter
- Removal test: if nobody notices, cut it

**Green:** Review notes addressed or consciously deferred.

## Hand off when

| Signal | Switch to |
|--------|-----------|
| Structure/IA/layout primary | `$frontend` |
| Jank/LCP/bundle primary | `$performance` |
| Full video production | `$media` |
---

## Modules (load by path)

Base: `~/.agents/skill-modules/`

When a phase names a former skill like impeccable or unslop, **read**:

`~/.agents/skill-modules/<module-name>/SKILL.md`

| Module | Path |
|--------|------|
| `taste-craft` | `~/.agents/skill-modules/taste-craft/SKILL.md` |
| `animate` | `~/.agents/skill-modules/animate/SKILL.md` |
| `transitions-dev` | `~/.agents/skill-modules/transitions-dev/SKILL.md` |
| `overdrive` | `~/.agents/skill-modules/overdrive/SKILL.md` |
| `review-animations` | `~/.agents/skill-modules/review-animations/SKILL.md` |
| `scroll-scenes` | `~/.agents/skill-modules/scroll-scenes/SKILL.md` |
| `impeccable` | `~/.agents/skill-modules/impeccable/SKILL.md` |
| `taste-skill-gpt` | `~/.agents/skill-modules/taste-skill-gpt/SKILL.md` |
| `tushar-design` | `~/.agents/skill-modules/tushar-design/SKILL.md` |

If a needed module is missing from the table, list `~/.agents/skill-modules/` and open the closest match.

