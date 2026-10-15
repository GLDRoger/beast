---
name: security
description: Inspect and implement defensive controls for authentication, authorization, tenant isolation, secrets, abuse, and dependencies.
---

# Security

Identify the assets, actors, trust boundary, and authorized scope. Trace current authentication, tenant/role policy, privileged clients, validation, and error paths before changing controls.

Enforce least privilege at the owning server/database boundary. Validate untrusted input; fail closed on missing authorization. Hidden UI controls do not authorize requests. Keep secrets out of client bundles, logs, reports, and fixtures.

Choose the repository's actual security and release checks. Discover commands in its scripts and CI; do not assume a universal CASA, package-manager, or handoff command. Consult current primary sources for security-sensitive external behavior and dependency findings.

Prove relevant allowed and denied paths: logged-out, wrong role, other tenant, inactive account, malformed input, and privileged operations as applicable. Test rate-limit response/retry behavior when touched. Database/RLS policy needs database-backed evidence in an isolated environment; mocks prove only their exercised contract.

Use `~/.agents/skill-modules/rate-limit/SKILL.md` for abuse/cost-sensitive routes. For incident work, use the current project's observability and incident procedures. Do not resolve monitoring issues, mutate live data, or publish findings merely because a security audit was requested.

State the evidence boundary and remaining risk. Preserve explicit user-owned testing and release approval boundaries.
