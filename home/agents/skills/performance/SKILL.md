---
name: performance
description: >
  Performance and stability: Core Web Vitals, jank, bundle weight, edge cases, error resilience.
---

# Performance

Own speed and resilience. Orchestration loop: follow `$route` → `references/orchestration.md`.


## Module convention

Top-level skills are only: `$route` `$frontend` `$code` `$writing` `$motion` `$performance` `$security` `$growth` `$media`.

Any other `$name` (e.g. `$impeccable`, `$unslop`) is a **module**. Load it by reading:

`~/.agents/skill-modules/<name>/SKILL.md`

Do not expect modules in the skills menu. If the file is missing, search `~/.agents/skill-modules/` and pick the closest match.

## Phase 0 — Baseline

**Goal:** Measure before changing.

- `$debug-perf` for Next/dev/HMR/CPU/bundle investigations
- Lighthouse / Performance panel / Web Vitals when UI-bound
- Repro: device class + network throttle
- `$next-runtime-triage` for noisy stacks before editing generated output

**Green:** Bottleneck hypothesis with a number or profile, not vibes.

## Phase 1 — Performance

**Goal:** Biggest bottleneck first.

- `$optimize` for load/render/animation/bundle playbook
- `$audit` performance dimension when scoring a surface
- Virtualize long lists; split routes; fix LCP/CLS/INP intentionally

**Green:** Before/after metrics (or honest qualitative mid-tier check).

## Phase 2 — Stability

**Goal:** Production reality, not demo data.

- `$harden` for overflow, i18n, errors, races, empty/loading
- Concurrent submit, offline, long strings, RTL/CJK smoke
- Cancel fetches on unmount; no silent empty on failure

**Green:** Extreme and error paths covered for the touched surface.

## Phase 3 — Verify & guard

**Goal:** Regressions don't ship.

- Focused perf/stability tests if they exist
- `$ruthless-release-qa` for public-release stress

**Green:** Happy path still works; fail paths recoverable.

## Hand off when

| Signal | Switch to |
|--------|-----------|
| Feature/logic wrong, not slow | `$code` |
| Auth/CASA/abuse primary | `$security` |
| Pure visual redesign | `$frontend` |
---

## Modules (load by path, not slash menu)

Base: `~/.agents/skill-modules/`

When a phase names a former skill like impeccable or unslop, **read**:

`~/.agents/skill-modules/<module-name>/SKILL.md`

| Module | Path |
|--------|------|
| `debug-perf` | `~/.agents/skill-modules/debug-perf/SKILL.md` |
| `optimize` | `~/.agents/skill-modules/optimize/SKILL.md` |
| `harden` | `~/.agents/skill-modules/harden/SKILL.md` |
| `audit` | `~/.agents/skill-modules/audit/SKILL.md` |
| `ruthless-release-qa` | `~/.agents/skill-modules/ruthless-release-qa/SKILL.md` |
| `next-runtime-triage` | `~/.agents/skill-modules/next-runtime-triage/SKILL.md` |

If a needed module is missing from the table, list `~/.agents/skill-modules/` and open the closest match.

