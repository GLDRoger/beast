---
name: route
description: >
  Choose which skill owns the work and run its phase loop. Use when the ask is broad,
  multi-step, or you don't know whether this is frontend, code, writing, motion,
  performance, security, growth, or media work.
---

# Route

You only have **nine** top-level skills. Everything else is a **module** under `~/.agents/skill-modules/` — load by reading that path when a phase needs it.


## Module convention

Top-level skills are only: `$route` `$frontend` `$code` `$writing` `$motion` `$performance` `$security` `$growth` `$media`.

Any other `$name` (e.g. `$impeccable`, `$unslop`) is a **module**. Load it by reading:

`~/.agents/skill-modules/<name>/SKILL.md`

The skills menu lists only the nine top-level skills; every module loads by that path. If the file is missing, search `~/.agents/skill-modules/` and pick the closest match.

## Loop

See `references/orchestration.md`.

## Pick one

| Outcome | Skill |
|---------|--------|
| UI / design / build / visual QA | `$frontend` |
| TypeScript, APIs, refactors, bugs, verify | `$code` |
| Prose, UI copy, docs, outreach | `$writing` |
| Motion, craft feel, animation polish | `$motion` |
| Perf, jank, stability, edge resilience | `$performance` |
| AuthZ, secrets, CASA, rate limits, audits | `$security` |
| Product strategy, pricing, SEO/AEO, launch | `$growth` |
| Video, Lottie, images, HyperFrames media | `$media` |

## Project memory (modules, not skills)

| Context | Read |
|---------|------|
| Mac/Codex tooling | `~/.agents/skill-modules/mac-codex-tooling-repair/SKILL.md` |

## Rules

1. One primary skill; second only if domains truly cross.
2. Load modules only at phase gates (read `SKILL.md` path above).
3. Narrow tasks: still enter the closest of the nine, then one module.
4. Never stage/commit/push unless the user asks.

## Handoff

Name the skill used, modules loaded, files/artifacts, verification, residual risk.
