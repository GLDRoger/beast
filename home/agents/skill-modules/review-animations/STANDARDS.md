# Animation standards reference

Review-specific techniques behind the findings, distilled from Emil Kowalski's design engineering philosophy ([animations.dev](https://animations.dev/)). Cite these in findings instead of approximating.

The rules themselves (when to animate, frequency, duration ranges, easing, springs, stagger, scroll, reduced motion) are set once in `~/.agents/skills/motion/SKILL.md`, with exact curves, durations, spring configs, and snippets in `~/.agents/skills/motion/references/values.md`. Cite those for any number; this file does not restate them.

## Physicality

- **No `scale(0)`.** Start from `scale(0.9–0.98)` with `opacity: 0`. Nothing in the real world appears from nothing.
- **Origin-aware popovers.** Grow from the trigger, not center:
  ```css
  .popover { transform-origin: var(--radix-popover-content-transform-origin); } /* Radix */
  .popover { transform-origin: var(--transform-origin); }                       /* Base UI */
  ```
  Modals are the exception: they appear centered in the viewport and keep `transform-origin: center`.
- **Press feedback.** `transform: scale(0.97)` on `:active` with `transition: transform 160ms var(--ease-out)`. Keep it subtle (0.95–0.98). Applies to any pressable element and is fine at any frequency, because it starts on the first frame.

## Interruptibility

CSS transitions can be interrupted and retargeted mid-animation; keyframes restart from zero. For anything triggered rapidly (toasts being added, toggles), transitions are smoother. Springs keep their velocity when interrupted, which suits gestures the user may reverse mid-motion.

```css
/* Interruptible: good for dynamic UI */
.toast { transition: transform 300ms var(--ease-out); }

/* Restarts from zero: keep for one-shot sequences */
@keyframes slideIn { from { transform: translateY(100%); } }
```

For entry without JavaScript, use `@starting-style` with the element's own styles as the visible resting state (snippet in the motion values reference). Legacy fallback: set `data-mounted` after first render.

## Asymmetric timing

Slow where the user is deciding, fast where the system responds. Exits are faster than entrances.

```css
.overlay { transition: clip-path 200ms var(--ease-out); }    /* release: snaps back */
.button:active .overlay { transition: clip-path 2s linear; } /* hold: user-paced */
```

## Performance

- **Transform and opacity by default.** They skip layout and paint. `padding`, `margin`, `height`, `width`, `top`, and `left` trigger layout, paint, and composite; accept them only when the interaction needs real reflow and the result was checked for jank.
- **Do not drive child transforms through a CSS variable on the parent.** It recalculates styles for every child. Set `transform` on the element itself.
  ```js
  element.style.setProperty('--swipe-amount', `${d}px`); // recalculates all children
  element.style.transform = `translateY(${d}px)`;        // only this element
  ```
- **Framer Motion shorthands under load.** `x`/`y`/`scale` can run on the main thread and drop frames while the page loads, scripts, or paints. When that shows up, use the full transform string:
  ```jsx
  <motion.div animate={{ x: 100 }} />                          // can drop frames under load
  <motion.div animate={{ transform: "translateX(100px)" }} />  // compositor-friendly
  ```
- **CSS animations hold up better under load.** They can run off the main thread, while rAF-driven animations stutter when the browser is busy. Use CSS for predetermined motion and JavaScript for dynamic or interruptible motion.
- **WAAPI** gives JavaScript control with CSS performance and interruptibility, no library needed:
  ```js
  element.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }],
    { duration: 400, fill: 'forwards', easing: 'cubic-bezier(0.77, 0, 0.175, 1)' });
  ```

## Transforms and clip-path

- **`translate` percentages** are relative to the element's own size: `translateY(100%)` moves by the element's height regardless of dimensions (how Sonner and Vaul position toasts and drawers). Prefer them to hard-coded pixels.
- **`scale()` scales children too** (text, icons, content), which is what press feedback wants.
- **3D**: `rotateX/Y` with `transform-style: preserve-3d` gives depth, orbit, and flip without JavaScript.
- **`clip-path: inset(t r b l)`** eats in from each side. Uses: scroll reveals (`inset(0 0 100% 0)` to `inset(0 0 0 0)`, applied only when the reveal can run), hold-to-delete overlays, seamless tab color transitions (duplicate the list and clip the active copy), comparison sliders.

## Gestures and drag

- **Momentum dismissal**: do not require crossing a distance threshold. Compute velocity (`Math.abs(distance) / elapsedMs`) and dismiss above about `0.11`. A flick should be enough.
- **Damping at boundaries**: dragging past a natural edge moves less the further you go.
- **Pointer capture** once dragging starts, so the drag continues when the pointer leaves the element.
- **Multi-touch protection**: ignore extra touch points after the drag begins (`if (isDragging) return`) to prevent jumps.
- **Friction over hard stops**: allow over-drag with rising resistance rather than an invisible wall.

## Masking imperfect crossfades

When a crossfade still shows two overlapping states after tuning easing and duration, add `filter: blur(2px)` during the transition so the eye reads one transformation. Keep blur under 20px; heavy blur is expensive, especially in Safari.

## Debugging (recommend when feel is uncertain)

- **Slow motion**: raise the duration 2–5x or use the DevTools animation inspector. Check that colors crossfade cleanly, easing does not stop abruptly, `transform-origin` is right, and coordinated properties stay in sync.
- **Frame by frame**: the Chrome DevTools Animations panel shows timing drift between coordinated properties.
- **Real devices** for gestures (drawers, swipes): open the dev server on a phone by IP and use Safari remote devtools.
- **Fresh eyes the next day**: imperfections invisible during development surface later.

## Cohesion

Match motion to the component's personality: playful can be bouncier, a professional dashboard should be crisp and fast. Sonner feels right partly because easing, duration, design, and even the name agree: it sits toward the slow end of the toast range and uses `ease` for an elegant feel. A personality can move values within their ranges; it does not justify leaving them. Opacity with height on lists that add and remove items is trial and error; adjust until it feels right.
