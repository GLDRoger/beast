---
name: overdrive
description: "Push technical ambition — shaders, springs, scroll theater, true 60fps. Use when the brief is to wow without abandoning craft."
argument-hint: "[target]"
---

Technical ambition that serves the product — not effect demos glued on.

## Prep

1. Invoke `$impeccable` Context Gathering Protocol. Context decides what “wow” means.
2. **Propose before build:** 2–3 directions with trade-offs (support, perf, complexity). User picks. No code until confirmed.
3. Plan progressive enhancement + reduced-motion path up front.

## What “extraordinary” means here

| Surface | Wow lives in |
|---------|----------------|
| Marketing / hero | Scroll choreography, cinematic transitions, generative accents |
| Functional UI | Shared-element morphs, instant optimistic flows, springy drag, huge tables at 60fps |
| Data | GPU charts, animated state morphs, zero-jank filters on large sets |
| Invisible | Work off main thread; UI never hesitates |

Technique serves the moment. A particle field on Settings is usually wrong; instant save + state morph may be perfect.

## Toolkit (by job)

- **Cinematic transitions:** View Transitions, `@starting-style`, springs (Motion/GSAP)
- **Scroll-tied:** CSS `animation-timeline: scroll()` + static fallback
- **Beyond CSS:** WebGL/WebGPU (with fallback), Canvas/OffscreenCanvas, SVG filters
- **Big data UI:** virtualization, GPU charts, animated data joins
- **Complex props:** `@property`, Web Animations API
- **Headroom:** Workers, OffscreenCanvas, WASM for heavy compute

This skill enhances **feel**, not product scope (no “add multiplayer” via overdrive).

## Discipline

- `@supports` / feature detect; baseline experience must already be good
- 60fps target; simplify under 50
- `prefers-reduced-motion` always; pause off-screen work; lazy-init heavy contexts
- Iterate with real browser preview — first working version is not the ship version
- One focused extraordinary moment beats stacked gimmicks

## Never

- Jank on mid-tier devices
- Bleeding-edge APIs with no fallback
- Sound without opt-in
- Motion as cover for weak hierarchy/type/layout — fix fundamentals first (`$arrange`, `$typeset`, `$critique`)

## Verify

Removal test (does anyone notice?) · phone/tablet/Chromebook · reduced-motion still beautiful · brand/audience fit
---