---
name: review-animations
description: "Review motion code against a high craft bar (Emil-inspired). Use when animations exist and you want a hard pass/fail on quality, not more effects."
disable-model-invocation: true
---

# Reviewing Animations

This skill reviews animation and motion code against a high craft bar. It does not write features, fix unrelated bugs, or review non-motion code; for general code, point to a general review skill.

## Posture

Review as a senior motion designer. The bias is toward motion that feels right, not motion that merely runs: a transition that works but feels sluggish, lands from the wrong origin, fires too often, or drops frames is a regression. Default to flagging; approval is earned.

The rules come from `~/.agents/skills/motion/SKILL.md`, the single source for motion defaults, and its exact values from `~/.agents/skills/motion/references/values.md`. This file turns them into a review method: standards, escalation triggers, a remedial order, tiered output, and approval criteria. [STANDARDS.md](STANDARDS.md) holds the review-specific detail (physicality, interruptibility, performance, gestures, debugging); load it when a finding needs a precise technique or citation.

## The ten standards

Every animation in the diff is measured against these. A violation is a finding.

1. **Justified motion.** Every animation answers "why does this animate?": feedback, continuity, orientation, explanation, or a rare moment of delight. "It looks cool" on a frequently seen element blocks.

2. **Frequency-appropriate.** Keyboard-initiated and 100+/day actions respond immediately: a delay or travelling entrance there blocks, while first-frame feedback (press scale) or a 100–150ms continuity change that never holds back focus or input passes. Tens/day gets short, subtle motion; occasional gets standard; rare can carry delight.

3. **Responsive easing.** Entering and exiting use a strong ease-out; on-screen movement uses ease-in-out. Ease-in on UI is a finding, since it delays the frames the user watches most. Weak built-in easing on deliberate movement is a finding; plain `ease` on hover or color is fine.

4. **Duration in range.** Each element stays inside the range for its kind in the motion rules (press 100–160ms, dropdowns 150–250ms, modals and drawers 200–400ms, and so on). A value outside its range with no stated reason is a finding.

5. **Origin and physical correctness.** Popovers, dropdowns, and tooltips grow from their trigger (`transform-origin`); modals stay centered. Entrances start from `scale(0.9–0.98)` with opacity, not `scale(0)`.

6. **Interruptibility.** Rapidly triggered, reversible, or gesture-driven motion (toasts, toggles, open and close, drags) retargets from its current value with transitions or springs, rather than keyframes that restart from zero.

7. **Cheap properties.** Transform and opacity by default; color, filter, and clip-path on small areas. Animated layout properties (`width`, `height`, `margin`, `padding`, `top`, `left`) are a finding unless the interaction needs real reflow and the result was checked for jank.

8. **Accessibility and content.** `prefers-reduced-motion` removes movement and keeps short opacity or color changes. Hover motion is gated behind `@media (hover: hover) and (pointer: fine)`. Content is visible without the animation: a start state that hides content until JavaScript, a scroll trigger, or a stagger runs is a finding.

9. **Asymmetric timing.** Exits are faster than entrances. User-paced phases (a hold to confirm) can be slow; the system's response (release, cancel) snaps back in about 200ms. Symmetric timing on a press-and-release or hold interaction is a finding.

10. **Cohesion and restraint.** Motion matches the component and product: playful can be bouncier, a dashboard stays crisp. Bounce on professional UI, staggers on views that update often, or a reveal on every section are findings. When unsure whether motion feels right, the strongest move is often to delete it.

## Escalation triggers

Flag these on sight:

- `transition: all`
- `scale(0)` entrances, or a pure fade on an element that comes from a trigger
- Ease-in on any UI interaction
- A delay or travelling entrance on a keyboard shortcut, command-palette toggle, or 100+/day action
- A duration outside its element's range with no stated reason
- `transform-origin: center` on a trigger-anchored popover, dropdown, or tooltip
- Keyframes on toasts, toggles, or anything triggered rapidly
- Layout-property animation with no reflow need or no jank check
- Framer Motion `x`/`y`/`scale` props on motion that drops frames while the page is busy
- Updating a CSS variable on a parent to drive a child transform (style recalculation storm)
- Missing `prefers-reduced-motion` handling on movement
- Ungated `:hover` motion
- Content hidden in its resting state until an animation runs
- Scroll hijacking or replaced scroll physics outside a deliberate scroll scene
- Symmetric enter and exit timing on a press-and-release or hold interaction
- A group of items in an occasional moment appearing as an abrupt jump where a short stagger (30–80ms) would show order, or a stagger on content that updates often

## Remedial order

When proposing fixes, prefer earlier moves over later ones:

1. **Delete the animation** when it has no purpose or delays a frequent or keyboard action.
2. **Reduce it**: shorter duration, smaller transform, fewer animated properties.
3. **Fix the easing**: ease-in to ease-out or a strong custom curve.
4. **Fix the origin and physicality**: correct `transform-origin`; replace `scale(0)` with `scale(0.95)` and opacity.
5. **Make it interruptible**: keyframes to transitions, or a spring for gesture-driven motion.
6. **Move it to cheap properties**: layout properties to `transform` and `opacity`; shorthand to a full `transform` string; WAAPI for programmatic CSS.
7. **Asymmetric timing**: faster exits; slow the user-paced phase, snap the response.
8. **Polish**: blur to mask crossfades, a short stagger for a group, `@starting-style` for entry, a spring for elements that should feel alive.
9. **Accessibility and cohesion**: reduced motion, hover gating, a visible resting state; tune to the component's personality.

## Required output format

Two parts, in this order.

### Part 1: findings table

A single markdown table, one row per issue, not a "Before:/After:" list.

| Before | After | Why |
| --- | --- | --- |
| `transition: all 300ms` | `transition: transform 200ms var(--ease-out)` | Name the properties; `all` animates unintended ones, often off the compositor |
| `transform: scale(0)` | `transform: scale(0.95); opacity: 0` | Nothing appears from nothing; `scale(0)` looks like it came from nowhere |
| `ease-in` on dropdown | `var(--ease-out)` | Ease-in delays the moment the user watches most |
| `transform-origin: center` on popover | `var(--radix-popover-content-transform-origin)` | Popovers grow from their trigger; modals are the exception |

### Part 2: verdict

Group remaining commentary by impact tier, highest first. Omit empty tiers.

1. **Feel-breaking regressions**: sluggish easing, comes-from-nowhere, delays on frequent or keyboard actions, content hidden until motion runs.
2. **Missed simplifications**: animations to remove or drastically reduce.
3. **Performance**: layout-property animation, dropped-frame risks, recalculation storms.
4. **Interruptibility and timing**: keyframes where transitions or springs belong; symmetric timing that should be asymmetric.
5. **Origin, physicality, and cohesion**: wrong origin, mismatched personality, jarring crossfades.
6. **Accessibility**: reduced motion and pointer/hover gating.

Close with an explicit decision:

- **Block**: any feel-breaking regression, a delay on a keyboard or high-frequency action, `scale(0)` or ease-in on UI, or a layout-property animation with an easy transform fix.
- **Approve**: no feel-breaking regressions, nothing that should obviously be deleted, durations and easing within range, interruptibility handled where needed, reduced motion respected, content visible without motion.

Be specific and cite `file:line`. When a value is needed (a curve, a duration, a spring config), take the exact one from the motion values reference rather than approximating.

## Guidelines

- Prefer CSS transitions, `@starting-style`, or WAAPI for predetermined motion; JavaScript or springs for dynamic, interruptible, gesture-driven motion.
- When unsure whether motion feels right, recommend reviewing it in slow motion or frame by frame, and again with fresh eyes the next day, rather than guessing.
