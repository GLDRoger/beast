---
name: security
description: >
  Security and defensive controls: AuthN/AuthZ, tenants, secrets, CASA gates, rate limits, dependency audits.
---

# Security

Own trust boundaries and defensive posture. Orchestration loop: follow `$route` → `references/orchestration.md`.  
"Optimization" here means **hardening the attack surface and gates**, not Web Vitals (that's `$performance`).


## Module convention

Top-level skills are only: `$route` `$frontend` `$code` `$writing` `$motion` `$performance` `$security` `$growth` `$media`.

Any other `$name` (e.g. `$impeccable`, `$unslop`) is a **module**. Load it by reading:

`~/.agents/skill-modules/<name>/SKILL.md`

Do not expect modules in the skills menu. If the file is missing, search `~/.agents/skill-modules/` and pick the closest match.

## Phase 0 — Threat & scope

**Goal:** What trust boundary is in play?

- Auth session, tenant isolation, admin vs user, public vs private routes
- Data classes: PII, secrets, tokens, webhooks

**Green:** Assets, attackers, and in-scope surfaces named.

## Phase 1 — Controls

**Goal:** Enforce least privilege in the primary path.

- Validate/sanitize at the edge; fail closed on authz miss
- `$rate-limit` for abuse/cost-sensitive routes
- No secrets in logs, client bundles, or committed env samples
- Prefer server-side checks even when UI hides actions

**Green:** Unauthorized paths return the correct failure; no client-only authz.

## Phase 2 — Dependencies & compliance

**Goal:** Known issues handled deliberately.

- CASA/security gates: `pnpm casa:check` / `pnpm security:check` / `pnpm verify:handoff` as risk requires
- Sentry: pack `references/sentry-triage.md` — fix real regressions, don't "resolve" noise

**Green:** Commands run; findings classified; no silent skip of CASA when required.

## Phase 3 — Verify

**Goal:** Prove the boundary.

- Attempt unauthorized access cases (other tenant, logged-out, wrong role)
- Confirm rate limit 429 + Retry-After behavior if touched
- Confirm no secret leakage in responses/logs for the change

**Green:** Evidence for allow and deny paths.

## Hand off when

| Signal | Switch to |
|--------|-----------|
| Perf-only | `$performance` |
| Feature logic without trust issues | `$code` |
| UI copy for security errors | `$writing` after controls land |
---

## Modules (load by path, not slash menu)

Base: `~/.agents/skill-modules/`

When a phase names a former skill like impeccable or unslop, **read**:

`~/.agents/skill-modules/<module-name>/SKILL.md`

| Module | Path |
|--------|------|
| `rate-limit` | `~/.agents/skill-modules/rate-limit/SKILL.md` |

If a needed module is missing from the table, list `~/.agents/skill-modules/` and open the closest match.

