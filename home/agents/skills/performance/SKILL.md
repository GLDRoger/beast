---
name: performance
description: Diagnose and improve speed, Core Web Vitals, jank, resource use, and failure resilience using observed behavior.
---

# Performance

Establish a reproducible bottleneck or failure before editing. Use the relevant device, dataset, network, and runtime conditions. Separate dev-tool overhead from production behavior.

Choose the smallest change that addresses the measured cause. Inspect query breadth, payloads, caching, invalidation, rendering, bundles, long lists, and resource lifecycles where relevant. Do not trade correctness, authorization, or freshness for a faster-looking screen.

Exercise the touched surface under realistic edge conditions: long strings, empty/loading/error states, overlapping requests, repeated submit, cancellation, offline recovery, or localization as applicable. Preserve successful behavior while fixing failure paths.

Compare before/after evidence under comparable conditions and run the relevant regression checks. Label qualitative inspection as qualitative; do not invent performance numbers. A benchmark improvement is not proof of runtime safety.

Optional methods:

- `~/.agents/skill-modules/debug-perf/SKILL.md` for profiling and Next.js/dev/HMR investigations.
- `~/.agents/skill-modules/next-runtime-triage/SKILL.md` for generated runtime/type noise.
- `~/.agents/skill-modules/ruthless-release-qa/SKILL.md` for an explicitly exhaustive release check.

Use the code, frontend, or security workflow when correctness, UI structure, or trust boundaries are the primary problem.
