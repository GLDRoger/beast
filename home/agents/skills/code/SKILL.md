---
name: code
description: >
  TypeScript and application logic: implement features, fix bugs, refactor, type-safe design, verify, hand off.
---

# Code

Own code from root-cause framing to verified handoff. Orchestration loop: follow `$route` → `references/orchestration.md`.


## Module convention

Top-level skills are only: `$route` `$frontend` `$code` `$writing` `$motion` `$performance` `$security` `$growth` `$media`.

Any other `$name` (e.g. `$impeccable`, `$unslop`) is a **module**. Load it by reading:

`~/.agents/skill-modules/<name>/SKILL.md`

Do not expect modules in the skills menu. If the file is missing, search `~/.agents/skill-modules/` and pick the closest match.

## Phase 0 — Bound

**Goal:** Outcome, risk, dirty tree, verification path.

- `~/.agents/skill-modules/mac-codex-tooling-repair/SKILL.md` when relevant
- Inspect git; never commit/push unless asked

**Green:** Touched area + expected check known.

## Phase 1 — Path

**Goal:** One primary theory or design.

- `$improve` / `$improve-codebase-architecture` for read-only plans
- `$thermo-nuclear-code-quality-review` for maintainability/giant-file reviews
- `$domain-modeling` / `$decision-doc` when language or tradeoffs are the blocker
- `$review-swarm` for multi-model review of a diff
- `$ai-streaming` / `$rate-limit` when those are the feature
- `$next-runtime-triage` before editing `.next` noise

**Green:** Smallest check that would falsify the theory is chosen.

## Phase 2 — Implement

**Goal:** Root cause fixed; canonical path only.

- Prefer types that make illegal states unrepresentable
- Validate at boundaries; fail fast
- Preserve auth/tenant boundaries (escalate to `$security` if security is primary)
- Scoped diffs; protect parallel user edits

**Green:** Diff matches plan; no dead/duplicate path left in the touched surface.

## Phase 3 — Verify

**Goal:** Evidence, not vibes.

```bash
# proportional selection
python3 ~/.codex/scripts/verification_router.py --repo <repo> <touched-files...>
```

- Focused tests first
- `$ruthless-release-qa` only for exhaustive ship asks

**Green:** Fail path + relevant success path exercised; commands reported.

## Phase 4 — Handoff

**Goal:** Next agent/human can continue.

- `$handoff` for long sessions
- Files, behavior change, verification, skipped checks, residual risk
- No fake "committed/pushed"

## Hand off when

| Signal | Switch to |
|--------|-----------|
| UI/visual primary | `$frontend` |
| Perf/jank/stability primary | `$performance` |
| Security/CASA primary | `$security` |
---

## Modules (load by path, not slash menu)

Base: `~/.agents/skill-modules/`

When a phase names a former skill like impeccable or unslop, **read**:

`~/.agents/skill-modules/<module-name>/SKILL.md`

| Module | Path |
|--------|------|
| `improve` | `~/.agents/skill-modules/improve/SKILL.md` |
| `improve-codebase-architecture` | `~/.agents/skill-modules/improve-codebase-architecture/SKILL.md` |
| `thermo-nuclear-code-quality-review` | `~/.agents/skill-modules/thermo-nuclear-code-quality-review/SKILL.md` |
| `domain-modeling` | `~/.agents/skill-modules/domain-modeling/SKILL.md` |
| `decision-doc` | `~/.agents/skill-modules/decision-doc/SKILL.md` |
| `review-swarm` | `~/.agents/skill-modules/review-swarm/SKILL.md` |
| `ai-streaming` | `~/.agents/skill-modules/ai-streaming/SKILL.md` |
| `rate-limit` | `~/.agents/skill-modules/rate-limit/SKILL.md` |
| `next-runtime-triage` | `~/.agents/skill-modules/next-runtime-triage/SKILL.md` |
| `handoff` | `~/.agents/skill-modules/handoff/SKILL.md` |
| `wayfinder` | `~/.agents/skill-modules/wayfinder/SKILL.md` |
| `grilling` | `~/.agents/skill-modules/grilling/SKILL.md` |
| `mac-codex-tooling-repair` | `~/.agents/skill-modules/mac-codex-tooling-repair/SKILL.md` |
| `cua-driver` | `~/.agents/skill-modules/cua-driver/SKILL.md` |
| `codex-session-miner` | `~/.agents/skill-modules/codex-session-miner/SKILL.md` |

If a needed module is missing from the table, list `~/.agents/skill-modules/` and open the closest match.

