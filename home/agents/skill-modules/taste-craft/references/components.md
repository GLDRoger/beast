# Component craft

Patterns for making individual components feel right. Durations, curves, and spring values follow `~/.agents/skills/motion/SKILL.md` and `~/.agents/skills/motion/references/values.md`; the examples below use those values.

## Buttons respond to the press

Add `transform: scale(0.97)` on `:active`. It gives instant feedback and makes the interface feel like it is listening. Because it starts on the first frame, it is fine on actions people repeat all day.

```css
.button {
  transition: transform 160ms var(--ease-out);
}

.button:active {
  transform: scale(0.97);
}
```

This applies to any pressable element. Keep the scale subtle (0.95–0.98).

## Enter from a visible shape, not scale(0)

Nothing in the real world disappears and reappears completely. Elements animating from `scale(0)` look like they come out of nowhere. Start from `scale(0.9)` or higher with opacity; even a barely visible initial scale reads as a balloon that still has a shape when deflated.

```css
/* Comes from nowhere */
.entering {
  transform: scale(0);
}

/* Reads as physical */
.entering {
  transform: scale(0.95);
  opacity: 0;
}
```

## Popovers grow from their trigger

The default `transform-origin: center` is wrong for almost every popover. Modals are the exception: they are not anchored to a trigger, so they stay centered in the viewport.

```css
/* Radix UI */
.popover {
  transform-origin: var(--radix-popover-content-transform-origin);
}

/* Base UI */
.popover {
  transform-origin: var(--transform-origin);
}
```

Whether anyone notices the difference individually does not matter. In aggregate, unseen details become visible.

## Tooltips skip the delay on neighbours

Tooltips delay before appearing to prevent accidental activation. Once one is open, hovering adjacent triggers should open theirs instantly, with no animation. The toolbar feels faster without defeating the initial delay.

```css
.tooltip {
  transition: transform 125ms var(--ease-out), opacity 125ms var(--ease-out);
  transform-origin: var(--transform-origin);
}

.tooltip[data-starting-style],
.tooltip[data-ending-style] {
  opacity: 0;
  transform: scale(0.97);
}

/* Subsequent tooltips appear instantly */
.tooltip[data-instant] {
  transition-duration: 0ms;
}
```

## Transitions over keyframes for interruptible UI

CSS transitions can be interrupted and retargeted mid-animation; keyframes restart from zero. For anything triggered rapidly (adding toasts, toggling states), transitions are smoother. Keep keyframes for one-shot sequences.

```css
/* Interruptible: good for dynamic UI */
.toast {
  transition: transform 300ms var(--ease-out);
}

/* Restarts from zero: avoid for dynamic UI */
@keyframes slideIn {
  from {
    transform: translateY(100%);
  }
}
```

## Blur masks an imperfect crossfade

When a crossfade between two states still feels off after trying different easings and durations, add a subtle `filter: blur(2px)` during the transition.

Without blur, the eye sees two distinct objects overlapping, the old state and the new. Blur blends them so the change reads as one transformation.

```css
.button {
  transition: transform 160ms var(--ease-out);
}

.button:active {
  transform: scale(0.97);
}

.button-content {
  transition: filter 200ms ease, opacity 200ms ease;
}

.button-content.transitioning {
  filter: blur(2px);
  opacity: 0.7;
}
```

Keep blur under 20px. Heavy blur is expensive, especially in Safari.

## Enter states with @starting-style

The element's own styles are its final, visible state; `@starting-style` exists only for the first frame of the transition, so the element is never stuck hidden.

```css
.toast {
  transition: opacity 300ms var(--ease-out), transform 300ms var(--ease-out);

  @starting-style {
    opacity: 0;
    transform: translateY(100%);
  }
}
```

This replaces the React pattern of setting `mounted: true` in an effect after the first render. Where browser support is missing, fall back to that pattern, styling the start state on `:not([data-mounted])` so the resting state stays visible:

```jsx
useEffect(() => {
  setMounted(true);
}, []);
// <div data-mounted={mounted}>
```

## Asymmetric enter and exit

Exits are faster than entrances. Where a press must be deliberate (hold to delete: 2s linear), the release snaps back (200ms ease-out). Slow where the user is deciding, fast where the system responds.

```css
/* Release: snaps back */
.overlay {
  transition: clip-path 200ms var(--ease-out);
}

/* Hold: user-paced */
.button:active .overlay {
  transition: clip-path 2s linear;
}
```

## Stagger a group, keep it short

When one group enters together in an occasional moment, a short stagger shows order. Keep 30–80ms between items and let items past the first six or so arrive together. Lists that update often, search results, and tables appear at once. Use `backwards` fill so the resting style stays visible and nothing is hidden when animation is removed, and do not block interaction while the cascade plays.

```css
@keyframes enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}

.item {
  animation: enter 250ms var(--ease-out) backwards;
}
.item:nth-child(2) {
  animation-delay: 50ms;
}
.item:nth-child(3) {
  animation-delay: 100ms;
}
.item:nth-child(4) {
  animation-delay: 150ms;
}
```

## Springs

Springs simulate physics, so they settle on parameters rather than a fixed duration. Use them for drag with momentum, elements that should feel alive (like Apple's Dynamic Island), gestures that can be interrupted, and decorative pointer-tracking.

Springs keep their velocity when interrupted, while keyframes restart from zero. Click to expand an item and press Escape quickly, and a spring reverses smoothly from where it is.

Default to no bounce; use 0.1–0.3 only for playful products and drag-to-dismiss:

```js
{ type: "spring", duration: 0.4, bounce: 0 }    // default
{ type: "spring", duration: 0.5, bounce: 0.2 }  // playful, drag-to-dismiss
{ type: "spring", stiffness: 400, damping: 40 } // physics form of the default
```

### Spring-based pointer interactions

Tying a visual change directly to pointer position feels artificial because it has no motion. Interpolate with `useSpring` from Motion (formerly Framer Motion):

```jsx
import { useSpring } from 'motion/react'; // 'framer-motion' in older projects

// Without spring: instant, artificial
const rotation = mouseX * 0.1;

// With spring: has momentum
const springRotation = useSpring(mouseX * 0.1, {
  stiffness: 150,
  damping: 20,
});
```

This works because the motion is decorative. On a functional graph in a banking app, no animation would be better. Know when decoration helps and when it hinders.
