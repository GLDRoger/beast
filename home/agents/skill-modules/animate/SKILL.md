---
name: animate
description: "Give interfaces purposeful motion — micro-interactions that clarify state and add delight without noise. Use when UI works but still feels static or dead on interaction."
argument-hint: "[target]"
---

Compatibility router into `$impeccable`. Do not run a parallel motion system from here.

## Routing

1. Invoke `$impeccable` and follow its Context Gathering Protocol (run `teach` if no design context).
2. Also gather: performance budget and brand energy (calm vs playful).
3. Open `$impeccable`'s `reference/motion-design.md`.
4. Add motion only where it clarifies state, feedback, or hierarchy.

## Focus

- One hero moment + feedback layer beats scattered decoration
- Animate `transform`/`opacity` only; durations ~100–300ms for feedback, ≤500ms for layout
- Prefer ease-out curves; avoid bounce/elastic
- Always honor `prefers-reduced-motion`

## Guardrails

- No animation without a job (feedback, continuity, guidance, or earned delight)
- Do not block interaction unless intentional
- For technically ambitious effects (shaders, scroll theater, View Transitions), use `$overdrive`
---