# Motion values and patterns

Exact values and code for the rules in [../SKILL.md](../SKILL.md). The rules and their reasons live there; this file only supplies numbers and snippets. If the project already has motion tokens, use them and check they fall inside these ranges.

## Frequency

| How often it is seen | Motion |
| --- | --- |
| 100+ times a day, or keyboard-initiated (shortcuts, command palette, tab and list navigation) | Immediate result. At most a 100–150ms opacity or position change that never delays focus or input. First-frame feedback such as a press scale is fine. |
| Tens of times a day (hover, list selection) | Short and subtle, at the low end of the duration range |
| Occasional (modals, drawers, toasts) | Standard motion |
| Rare or first-run (onboarding, celebrations) | Room for expression |

Raycast opens and closes its palette with no animation, which suits something used hundreds of times a day.

## Durations

| Element | Enter | Exit |
| --- | --- | --- |
| Press feedback (`:active` scale) | 100–160ms | same or faster |
| Hover, color, background | 100–200ms | same |
| Tooltips, small popovers | 125–200ms | about 100–150ms |
| Dropdowns, selects, menus | 150–250ms | about 100–175ms |
| Modals, drawers, panels, sheets, toasts | 200–400ms | about 150–300ms |
| Rare emphasis (success check, onboarding) | up to about 500ms | short |
| Marketing and explanatory sequences | as long as the explanation needs | short |
| User-paced phases (hold to confirm) | the hold, e.g. 2s linear | snap back in about 200ms |

A 180ms dropdown feels more responsive than a 400ms one. After the first tooltip in a toolbar opens, open neighbours instantly with no animation.

## Easing curves

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);      /* enter and exit */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);  /* moving or morphing on screen */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);   /* iOS-like drawer (Ionic) */
```

Plain `ease` is fine for hover and color; `linear` for progress and marquees. Built-in `ease-out` is weak for movement; prefer the curves above or a stronger variant from easing.dev or easings.co rather than hand-rolling one.

## Springs

```js
{ type: "spring", duration: 0.4, bounce: 0 }        // default: settles without overshoot
{ type: "spring", duration: 0.5, bounce: 0.2 }      // playful products, drag-to-dismiss
{ type: "spring", stiffness: 400, damping: 40 }     // physics form of the default (damping near 2·√stiffness)
useSpring(value, { stiffness: 150, damping: 20 })   // decorative pointer-following
```

Lower damping relative to stiffness adds overshoot; `stiffness: 100, damping: 10` visibly bounces and suits only playful or decorative motion.

## Entry with a visible resting state

The element's own styles are its final, visible state; the start state exists only during the transition, so nothing stays hidden if the animation never runs.

```css
.toast {
  transition: opacity 300ms var(--ease-out), transform 300ms var(--ease-out);
  @starting-style { opacity: 0; transform: translateY(100%); }
}
```

Fallback where `@starting-style` is unsupported: set `data-mounted` after first render and style the start state on `:not([data-mounted])`.

## Stagger

```css
@keyframes enter { from { opacity: 0; transform: translateY(8px); } }
.item { animation: enter 250ms var(--ease-out) backwards; }
.item:nth-child(2) { animation-delay: 50ms; }
.item:nth-child(3) { animation-delay: 100ms; }
/* items past about six share the last delay */
```

`backwards` applies the start state only during the delay, so the resting style stays visible and nothing is hidden when animation is removed.

## Scroll reveals

Apply the hidden start state only when the reveal can actually run, for example from a class set by the observer script and not under reduced motion:

```css
@media (prefers-reduced-motion: no-preference) {
  .js-reveal .reveal:not(.is-visible) { opacity: 0; transform: translateY(12px); }
}
```

Trigger once (`IntersectionObserver`, or Motion's `useInView` with `{ once: true, margin: "-100px" }`). For `clip-path` image reveals, animate `inset(0 0 100% 0)` to `inset(0 0 0 0)` under the same guard.

## Reduced motion and hover

```css
@media (prefers-reduced-motion: reduce) {
  .panel { transition: opacity 150ms ease; transform: none; }
  html { scroll-behavior: auto; }
}
@media (hover: hover) and (pointer: fine) {
  .card:hover { transform: translateY(-2px); }
}
```

```jsx
const reduce = useReducedMotion();
const closedX = reduce ? 0 : "-100%";
```
