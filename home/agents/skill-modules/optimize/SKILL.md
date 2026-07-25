---
name: optimize
description: "Make the UI feel fast — load, render, animation jank, images, bundle weight. Use when “it works” still feels heavy."
argument-hint: "[target]"
---

Measure → fix the biggest bottleneck → re-measure. No speculative micro-opts.

## Prep

Baseline before changes: Lighthouse / Performance panel / Web Vitals, plus bundle size if JS-heavy. Note device + network (throttle).

## Targets

| Metric | Aim |
|--------|-----|
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| Interaction feel | stable ~60fps on mid-tier |

## Playbook (biggest win first)

**Load**
- Images: right size, modern format, `srcset`/`sizes`, lazy below-fold, dimensions/`aspect-ratio`
- JS: route/component split, drop dead deps, dynamic `import` for heavy UI
- CSS/fonts: kill unused CSS; `font-display: swap`; subset; preload only critical
- Critical path: preload LCP asset; defer non-critical third parties

**Render**
- Batch DOM reads then writes (no layout thrash)
- `content-visibility` / virtualize long lists
- Animate `transform`/`opacity` only; sparingly `will-change`

**Runtime**
- Break up long tasks; workers for heavy compute
- Debounce/throttle scroll/input handlers
- Framework: memoize expensive subtrees; avoid needless re-renders

**Network**
- Cache headers, compression, pagination, CDN for static
- Adaptive loading when `navigator.connection` is slow

## CLS / LCP specifics

- Reserve space for media and embeds
- Don't inject above existing content without space
- Hero image optimized and discoverable early

## Verify

Before/after metrics · mid-tier + throttled network · no functional/a11y regressions · *feels* faster to a human, not only score green

## Never

- Optimize without a baseline
- Lazy-load above-the-fold LCP content
- Trade away accessibility for speed
- Spray `will-change` everywhere
---