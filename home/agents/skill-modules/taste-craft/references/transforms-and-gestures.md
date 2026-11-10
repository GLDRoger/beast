# Transforms, clip-path, and gestures

CSS transform and clip-path techniques, and the details that make drag and swipe feel physical. Values follow `~/.agents/skills/motion/SKILL.md`.

## translate with percentages

Percentages in `translate()` are relative to the element's own size. `translateY(100%)` moves an element by its own height whatever its dimensions. This is how Sonner positions toasts and how Vaul hides the drawer before animating it in.

```css
/* Works regardless of drawer height */
.drawer-hidden {
  transform: translateY(100%);
}

/* Works regardless of toast height */
.toast-enter {
  transform: translateY(-100%);
}
```

Prefer percentages to hard-coded pixels. They are less error-prone and adapt to content.

## scale() scales children too

Unlike `width` and `height`, `scale()` also scales an element's children. When a button scales on press, its text, icons, and content scale with it. That is the intended effect.

## 3D transforms for depth

`rotateX()` and `rotateY()` with `transform-style: preserve-3d` create real 3D effects in CSS: orbits, coin flips, and depth without JavaScript.

```css
.wrapper {
  transform-style: preserve-3d;
}

@keyframes orbit {
  from {
    transform: translate(-50%, -50%) rotateY(0deg) translateZ(72px) rotateY(360deg);
  }
  to {
    transform: translate(-50%, -50%) rotateY(360deg) translateZ(72px) rotateY(0deg);
  }
}
```

Constant decorative motion like this is linear, belongs in rare or marketing moments, and stops under reduced motion.

## transform-origin

Every element has an anchor point for its transforms; the default is center. Set it to where the trigger lives for origin-aware interactions.

## clip-path for animation

`clip-path: inset(top right bottom left)` defines a rectangular clipping region; each value eats into the element from that side. It is one of the most useful animation tools in CSS and stays cheap on small areas.

```css
/* Hidden from the right */
.hidden {
  clip-path: inset(0 100% 0 0);
}

/* Fully visible */
.visible {
  clip-path: inset(0 0 0 0);
}

/* Reveal left to right on hold, snap back on release */
.overlay {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 200ms var(--ease-out);
}
.button:active .overlay {
  clip-path: inset(0 0 0 0);
  transition: clip-path 2s linear;
}
```

### Tabs with clean color transitions

Duplicate the tab list. Style the copy as active (different background and text color). Clip the copy so only the active tab shows, and animate the clip on tab change. The color change is seamless in a way that timing individual color transitions cannot match. Tab switching is frequent, so keep the clip transition at the fast end (150–200ms).

### Hold to delete

Put `clip-path: inset(0 100% 0 0)` on a colored overlay. On `:active`, transition to `inset(0 0 0 0)` over 2s linear. On release, snap back with 200ms ease-out. Add `scale(0.97)` on the button for press feedback.

### Image reveals on scroll

Animate from `clip-path: inset(0 0 100% 0)` to `inset(0 0 0 0)` when the image enters the viewport, once, with `IntersectionObserver` or Motion's `useInView` and `{ once: true, margin: "-100px" }`. Apply the clipped start state only when the observer is running and reduced motion is off, so the image is visible if the reveal never fires (guard pattern in `~/.agents/skills/motion/references/values.md`).

### Comparison sliders

Overlay two images. Clip the top one with `clip-path: inset(0 50% 0 0)` and adjust the right inset from the drag position. No extra DOM elements are needed.

## Gestures and drag

### Momentum-based dismissal

Do not require dragging past a threshold. Calculate velocity as `Math.abs(dragDistance) / elapsedTime`; above about 0.11, dismiss regardless of distance. A quick flick should be enough.

```js
const timeTaken = new Date().getTime() - dragStartTime.current.getTime();
const velocity = Math.abs(swipeAmount) / timeTaken;

if (Math.abs(swipeAmount) >= SWIPE_THRESHOLD || velocity > 0.11) {
  dismiss();
}
```

### Damping at boundaries

When a drag goes past the natural boundary (pulling a drawer up when it is already at the top), apply damping: the further they drag, the less the element moves. Real things slow down before they stop.

### Pointer capture

Once dragging starts, capture pointer events on the element so the drag continues when the pointer leaves its bounds.

### Multi-touch protection

Ignore additional touch points after the drag begins. Otherwise switching fingers mid-drag makes the element jump to the new position.

```js
function onPress() {
  if (isDragging) return;
  // Start drag...
}
```

### Friction instead of hard stops

Rather than preventing an upward drag entirely, allow it with rising friction. It feels more natural than an invisible wall.
