---
name: motion
description: Use when animation is the main change, such as micro-interactions, transitions between states, scroll-driven scenes, gesture feel, or timing and easing. When motion is incidental to a layout or visual change, use frontend; to review existing motion code, load review-animations.
---

# Motion

Give each transition a job: feedback, continuity, guidance, or earned delight. Derive the style from the product and current interaction rather than requiring a new design interview. These are the motion rules for every module below; where a module states a value, it follows this file.

## Whether to animate

- Motion needs a purpose: feedback on an action, continuity between states, orientation in space, explanation, or a rare moment of delight. Without one, leave the change instant. Deleting an animation is often the best fix.
- Scale motion to how often it is seen. Keyboard-initiated and very frequent actions (shortcuts, command palette, tab and list navigation) respond immediately: no delay and no travelling entrance, at most a 100–150ms opacity or position change that shows continuity without holding back focus or input. Feedback that starts on the first frame, such as a press scale, is fine at any frequency. Actions seen tens of times a day get short, subtle motion; occasional surfaces (modals, drawers, toasts) get standard motion; rare or first-run moments can be more expressive.
- Displays people read for values (data, charts, forms in progress) stay still unless the motion explains a change in the data.
- Content is visible and usable without the animation. Render the resting state first and treat motion as an enhancement, so nothing waits on JavaScript, a scroll trigger, or a stagger, and nothing breaks when motion is reduced or skipped. Do not hide work behind motion or show success before the operation completes.

## Timing and easing

- Duration follows the kind of element, because larger surfaces travel further and need a moment to read. Anything outside its range needs a stated reason.
  - press feedback 100–160ms; hover and color 100–200ms
  - tooltips and small popovers 125–200ms; dropdowns, selects, and menus 150–250ms
  - modals, drawers, panels, sheets, and toasts 200–400ms
  - rare emphasis moments (a success check, onboarding) up to about 500ms; marketing and explanatory sequences can run longer
  - user-paced phases (hold to confirm, drag) follow the user rather than a duration
- Exits are faster and simpler than entrances, roughly two thirds of the enter time, because the user has already moved on. Where the user is deciding (a hold), go slow; where the system responds (release, cancel), snap back in about 200ms.
- Easing: entering and exiting use a strong ease-out; elements moving or morphing on screen use ease-in-out; hover and color changes can use plain `ease`; constant motion (progress, marquee) is linear. Avoid ease-in on UI, since it spends the first frames, the ones the user is watching, nearly still. Use the project's easing tokens; without them, use the curves in the values reference.
- Springs suit gestures, drag, and motion that may be interrupted or reversed. Default to no bounce; bounce of 0.1–0.3 fits playful products and drag-to-dismiss, not every interactive element.
- Anything triggered rapidly or reversible (toggles, toasts, open and close, drags) must be interruptible: transitions or springs retarget from the current value, while keyframes restart from zero and suit one-shot sequences.

## What moves

- Animate transform and opacity by default, since they skip layout and paint. Color, filter, and clip-path are fine on small areas. Animate layout properties (width, height, top, margin) only when the interaction needs real reflow, such as an accordion that pushes content down, and check that for jank. Name the properties; `transition: all` animates things nobody chose.
- Keep distances physical and small: enter from scale 0.95 (0.9–0.98) with opacity, or a 4–12px translate, not from `scale(0)`. Popovers, menus, and tooltips grow from their trigger; modals stay centered. An element exits toward where it came from. A pure fade suits in-place changes; add a small transform when the element comes from a trigger or a direction.
- Stagger only one group entering together in an occasional or rare moment: 30–80ms between items, the last item starting within about 300ms, and items past the first six or so arriving together. Lists that update often, search results, and tables appear at once. One orchestrated moment on a page beats a reveal on every section.
- Keep native scrolling; replacing scroll physics or hijacking wheel input breaks keyboard, assistive, and trackpad expectations. Scroll-triggered reveals run once, move a short distance, and leave content visible if they never fire. Drive scroll-linked progress with CSS scroll-driven animations or IntersectionObserver, not scroll event handlers. A scroll-controlled narrative belongs to scroll-scenes.
- Gate hover motion behind `@media (hover: hover) and (pointer: fine)`, because touch fires hover on tap.

## Accessibility and verification

- Under `prefers-reduced-motion: reduce`, remove movement (translate, scale, parallax, scroll-linked and autoplaying motion, smooth scrolling) and keep short opacity or color changes that aid comprehension. Reduced means gentler, not zero, and every state stays reachable.
- Preserve focus, keyboard behavior, state continuity, and input responsiveness through every transition.
- Inspect the actual interaction, including interruption, reversal, and narrow layouts. Slow it down 2–5x to check origin, easing, and sync between properties. Measure jank on a throttled CPU when performance is in question.

## Reference and craft material

- Exact curves, spring configs, and code patterns for these rules: [values.md](references/values.md). Load it when you need a number or a snippet.
- Interaction feel and component craft: `~/.agents/skill-modules/taste-craft/SKILL.md`
- Panels, routes, and loading transitions: `~/.agents/skill-modules/transitions-dev/SKILL.md`
- Non-trivial animation review: `~/.agents/skill-modules/review-animations/SKILL.md`
- Scroll-controlled argument/state: `~/.agents/skill-modules/scroll-scenes/SKILL.md`
- 3D and WebGL motion: `~/.agents/skill-modules/3d-scenes/SKILL.md`
- Synthetic visual patterns: `~/.agents/skill-modules/unslop/SKILL.md` (visual mode)

Load the material relevant to the current interaction, not the whole catalog. Use frontend for structural UI changes, performance for measured bottlenecks, and media for video deliverables.
