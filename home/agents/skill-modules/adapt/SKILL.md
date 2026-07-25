---
name: adapt
description: "Stretch a UI so it thrives across phones, tablets, and desktops — breakpoints, fluid layout, touch targets. Use when something looks great on one screen and falls apart on another."
argument-hint: "[target] [context (mobile, tablet, print...)]"
---

Compatibility router into `$impeccable`. Do not run a parallel design system from here.

## Routing

1. Invoke `$impeccable` and follow its Context Gathering Protocol (run `teach` if no design context).
2. Also gather: target devices, input methods, and usage context (on-the-go vs desk).
3. Open `$impeccable`'s `reference/responsive-design.md`.
4. Adapt the experience for the target context — rethinking layout/interaction, not just scaling.

## Focus

- Content-driven breakpoints; test real devices, not only DevTools
- Touch targets ≥44×44px; never depend on hover alone for core actions
- Same information architecture across breakpoints; progressive disclosure on small screens
- Prefer container queries / fluid type (`clamp`) over brittle fixed widths

## Guardrails

- Do not hide core functionality on mobile
- Do not invent a second design system; match existing product patterns
- Prefer `$audit` if you only need a scored responsive checklist without implementing
---