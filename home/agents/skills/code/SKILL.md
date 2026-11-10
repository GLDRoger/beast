---
name: code
description: Use when the task changes how software behaves, such as application logic, APIs, bug fixes, types, tests, scripts, configuration, or refactors. If the change is mainly what a user sees, use frontend; if the deliverable is words, use writing.
---

# Code

Trace the affected behavior and its failure path before editing. Choose a check that could disprove the proposed fix. Preserve unrelated work and use the repository's current types, helpers, scripts, and conventions.

## Implementation

- Resolve the root cause in the canonical path. Keep validation, policy, translation, and observability at the boundaries that own them; avoid duplicate implementations and pass-through layers.
- Use narrow types and existing contracts. Validate untrusted input; preserve authentication, authorization, tenant boundaries, and atomicity where applicable.
- Handle relevant retries, partial failure, stale input, cancellation, and cache invalidation. Read callers and reverse paths when a contract changes.
- A follow-up correction updates the acceptance criteria. Repair the authorized implementation rather than returning only an explanation or a new plan.

## Verification

Read [verification.md](references/verification.md) when choosing checks for a behavior, dependency, configuration, data, or security change. Use the actual repository package manager and scripts; inspect what a command does before running it. There is no universal command sequence or external verification-router dependency.

Read the tests supporting the claim. Run the focused success/failure check, then the relevant broader gate. A build cannot prove rendered UI, mocks cannot prove database authorization, and whitespace checks cannot prove configuration or dependency correctness.

Report checks actually performed, skipped boundaries, and material residual risk. Do not repair unrelated existing failures merely to make a broad command green.

## Optional specialists

Load only when the task needs the procedure:

- Domain contracts: `~/.agents/skill-modules/domain-modeling/SKILL.md`
- Requested architecture review/planning: `~/.agents/skill-modules/improve/SKILL.md` (its architecture review mode covers module and interface design)
- Streaming or abuse controls: `~/.agents/skill-modules/ai-streaming/SKILL.md` or `~/.agents/skill-modules/rate-limit/SKILL.md`
- Generated Next.js runtime/type noise: `~/.agents/skill-modules/next-runtime-triage/SKILL.md`
- Explicit independent review or exhaustive release QA: `~/.agents/skill-modules/review-swarm/SKILL.md` or `~/.agents/skill-modules/ruthless-release-qa/SKILL.md`
- Requested strict maintainability review of a branch (structure, file size, scattered conditionals): `~/.agents/skill-modules/thermo-nuclear-code-quality-review/SKILL.md`
- The user asks to be questioned on a plan before building and is present to answer: `~/.agents/skill-modules/grilling/SKILL.md`
- Long-task continuity: `~/.agents/skill-modules/handoff/SKILL.md`

Use the frontend, security, or performance workflow when that domain owns the task. A specialist's findings feed the authorized implementation; its optional interview or report format is not a new approval gate.
