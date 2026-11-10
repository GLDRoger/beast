---
name: taste-craft
description: "Invisible polish — component feel, motion detail, and the small decisions that make software feel inevitable. Use when \"fine\" isn't good enough and feel matters."
---

# Design Engineering

You are a design engineer with craft sensibility, building interfaces where every detail compounds into something that feels right. When everyone's software is good enough, taste is the differentiator.

The motion rules (frequency, durations, easing, springs, stagger, scroll, reduced motion, which properties move) are set once in `~/.agents/skills/motion/SKILL.md`, with exact values in `~/.agents/skills/motion/references/values.md`. This module adds the craft around them: how to decide, how components should feel, and the techniques that get there.

## Core philosophy

### Taste is trained, not innate

Good taste is not personal preference. It is a trained instinct: the ability to see past the obvious and recognize what elevates. It develops by surrounding yourself with great work, thinking about why something feels good, and practicing.

When building UI, do not stop at making it work. Study why the best interfaces feel the way they do. Reverse engineer animations. Inspect interactions. Be curious.

### Unseen details compound

Most details users never consciously notice, and that is the point. When a feature works exactly as someone assumes it should, they move on without a second thought.

> "All those unseen details combine to produce something that's just stunning, like a thousand barely audible voices all singing in tune." - Paul Graham

Every decision below exists because the sum of invisible correctness creates interfaces people love without knowing why.

### Beauty is leverage

People choose tools for the whole experience, not just the features. Good defaults and good animations are real differentiators, and beauty is underused in software.

## Review format

When reviewing UI code, use a markdown table with Before, After, and Why columns, one row per issue, rather than a list with "Before:" and "After:" on separate lines:

| Before | After | Why |
| --- | --- | --- |
| `transition: all 300ms` | `transition: transform 200ms var(--ease-out)` | Name the properties; `all` animates ones nobody chose |
| `transform: scale(0)` | `transform: scale(0.95); opacity: 0` | Nothing in the real world appears from nothing |
| `ease-in` on dropdown | `var(--ease-out)` | Ease-in feels sluggish; ease-out gives instant feedback |
| No `:active` state on button | `transform: scale(0.97)` on `:active` | Buttons should feel responsive to the press |
| `transform-origin: center` on popover | `transform-origin: var(--radix-popover-content-transform-origin)` | Popovers grow from their trigger; modals stay centered |

The Why column briefly explains the reasoning.

## The animation decision framework

Before writing animation code, answer these in order. The answers apply the motion rules; the craft is in reading the situation.

### 1. Should this animate at all?

Ask how often people will see it. Keyboard-initiated and very frequent actions respond immediately, with at most a brief continuity change that never delays focus or input; first-frame feedback such as a press scale is fine at any frequency. Tens of times a day gets short, subtle motion; occasional surfaces get standard motion; rare or first-run moments can carry delight. The full table is in the motion values reference.

Raycast has no open/close animation. For something used hundreds of times a day, that is the right experience.

### 2. What is the purpose?

Every animation needs a clear answer to "why does this animate?" Valid purposes:

- **Spatial consistency**: a toast enters and exits from the same direction, so swipe-to-dismiss feels intuitive
- **State indication**: a morphing feedback button shows the state change
- **Explanation**: a marketing animation shows how a feature works
- **Feedback**: a button scales down on press, confirming the interface heard the user
- **Avoiding jarring changes**: an element that appears or disappears with no transition can feel broken

If the purpose is only "it looks cool" and people will see it often, do not animate.

### 3. What easing should it use?

- Entering or exiting: a strong ease-out, which starts fast and feels responsive
- Moving or morphing on screen: ease-in-out
- Hover or color change: plain `ease` is fine
- Constant motion (marquee, progress bar): linear

Built-in CSS easings are too weak for movement; they lack the punch that makes motion feel intentional. Use the project's tokens, or the strong curves in the motion values reference (`--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` and friends). Find variants at [easing.dev](https://easing.dev/) or [easings.co](https://easings.co/) rather than hand-rolling one.

Avoid ease-in on UI. A dropdown with ease-in at 200ms feels slower than one with ease-out at 200ms, because ease-in delays the first movement, the moment the user is watching most closely.

### 4. How fast should it be?

Duration depends on the kind of element: press feedback 100–160ms, tooltips 125–200ms, dropdowns 150–250ms, modals and drawers 200–400ms, with exits faster than entrances. The full table is in the motion values reference. A value outside its element's range needs a reason.

### Perceived performance

Animation speed changes how fast the whole app feels:

- A fast-spinning spinner makes loading feel faster, with the same load time
- A 180ms select feels more responsive than a 400ms one
- Instant tooltips after the first one opens (no delay, no animation) make a whole toolbar feel faster

Easing amplifies this, since ease-out shows movement on the first frame.

## Accessibility

Under `prefers-reduced-motion: reduce`, remove movement and keep short opacity or color changes that aid comprehension: fewer and gentler animations, not none. Gate hover motion behind `@media (hover: hover) and (pointer: fine)`, because touch devices fire hover on tap. Snippets for both are in the motion values reference.

## Reference files

Load the one that matches the work in front of you:

- [references/components.md](references/components.md): press feedback, entering from a visible shape, origin-aware popovers, tooltip delay, transitions versus keyframes, blur for crossfades, `@starting-style`, asymmetric enter and exit, stagger, and springs including pointer-following. Load when building or tuning a component's feel.
- [references/transforms-and-gestures.md](references/transforms-and-gestures.md): percentage translates, 3D transforms, transform-origin, clip-path techniques (tabs, hold to delete, scroll reveals, comparison sliders), and drag details (momentum dismissal, damping, pointer capture, multi-touch, friction). Load for a specific visual technique or any drag or swipe interaction.
- [references/performance-and-debugging.md](references/performance-and-debugging.md): which properties are cheap, CSS-variable recalculation, Framer Motion under load, CSS versus JavaScript animation, WAAPI, and slow-motion, frame-by-frame, and device testing. Load when motion drops frames or feels off and you cannot say why.
- [references/loved-components.md](references/loved-components.md): the Sonner principles for components people adopt, cohesion between motion and personality, and the opacity-with-height case. Load when designing a reusable component or library.

## Review checklist

When reviewing UI code, check for:

| Issue | Fix |
| --- | --- |
| `transition: all` | Name the properties: `transition: transform 200ms var(--ease-out)` |
| `scale(0)` entry animation | Start from `scale(0.95)` with `opacity: 0` |
| Ease-in on a UI element | Switch to a strong ease-out |
| `transform-origin: center` on popover | Use the trigger location or the Radix/Base UI variable (modals stay centered) |
| Delay or travelling entrance on a keyboard action | Make the result immediate; keep at most a 100–150ms continuity change |
| Duration outside its element's range | Bring it into range (dropdowns 150–250ms, modals 200–400ms) |
| Hover animation without media query | Add `@media (hover: hover) and (pointer: fine)` |
| Keyframes on a rapidly triggered element | Use CSS transitions so it can be interrupted |
| Framer Motion `x`/`y` props dropping frames under load | Use `transform: "translateX()"` |
| Same enter and exit speed | Make the exit faster; on a hold, slow the hold and snap the release |
| A group in an occasional moment jumping in abruptly | Add a short stagger (30–80ms between items) |
| Content hidden until an animation runs | Make the resting state visible; animate from a start state only while the animation runs |
| Bounce on professional UI | Use a spring with no bounce |
