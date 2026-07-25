---
name: harden
description: "Toughen the UI against reality — errors, overflow, i18n, edge cases. Use when the happy path works and production will not be so kind."
argument-hint: "[target]"
---

Production resilience for UI. Happy-path-only designs are not done.

## Prep

Invoke `$impeccable` if visual/copy changes will ship. Otherwise go straight to the matrix below.

## Attack matrix

| Axis | Break with |
|------|------------|
| **Content** | 100+ char names, empty, 1-char, emoji, RTL, CJK, huge numbers, 1k+ list rows |
| **Network** | offline, 3G, timeout, 400/401/403/404/429/500, double-submit |
| **i18n** | +30–40% string length, logical CSS properties, `Intl` dates/numbers, plural rules |
| **State** | empty, loading, partial, permission denied, stale, race |
| **Input** | max length, pattern, paste garbage; never trust client-only validation |
| **A11y** | keyboard-only, focus traps, live regions, reduced motion, high contrast |
| **Perf under stress** | large lists, leaky listeners, uncancelled fetches on unmount |

## Fix patterns (defaults)

**Overflow:** `min-width: 0` on flex/grid children; ellipsis or clamp; no fixed widths on labels/buttons.

**Errors:** plain-language what/why/fix · retry when useful · preserve input · don't blank the whole page for one widget failure.

**Forms:** inline field errors · disable submit while in-flight · server validation always.

**Lists:** paginate or virtualize · empty state with next action · filter “no results” differs from first-use empty.

**i18n:** `margin-inline-*` / `padding-inline` · content-sized controls · UTF-8 everywhere.

**Motion:** `prefers-reduced-motion` media query; no essential info only in animation.

## Verify

Long/emoji/RTL/CJK text · kill network mid-flow · hammer submit · 1000-row data · keyboard + screen reader smoke · empty and error paths for each primary view.

## Never

- Generic “Error occurred”
- English-length assumptions
- Client-only validation
- Fixed-width text chrome
- Swallowing failures into silent empty UI
---