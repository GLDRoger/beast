# Performance and debugging

How to keep motion smooth when the page is busy, and how to see what is wrong with an animation that feels off. The property rules come from `~/.agents/skills/motion/SKILL.md`.

## Transform and opacity by default

These properties skip layout and paint. Animating `padding`, `margin`, `height`, or `width` triggers layout, paint, and composite on every frame. Animate a layout property only when the interaction needs real reflow, such as an accordion that pushes content down, and check it for jank on a throttled CPU.

## CSS variables are inherited

Changing a CSS variable on a parent recalculates styles for all its children. In a drawer with many items, updating `--swipe-amount` on the container causes expensive recalculation. Update `transform` on the element itself.

```js
// Recalculates every child
element.style.setProperty('--swipe-amount', `${distance}px`);

// Only this element
element.style.transform = `translateY(${distance}px)`;
```

## Framer Motion shorthands under load

Motion's shorthand properties (`x`, `y`, `scale`) can run through `requestAnimationFrame` on the main thread. When an animation drops frames while the page is loading or scripting, use the full `transform` string, which the browser can hand to the compositor:

```jsx
// Convenient, but can drop frames under load
<motion.div animate={{ x: 100 }} />

// Stays smooth while the main thread is busy
<motion.div animate={{ transform: "translateX(100px)" }} />
```

At Vercel, the dashboard tab animation used Shared Layout Animations and dropped frames during page loads. Switching to CSS animations, which run off the main thread, fixed it.

## CSS animations hold up under load

CSS animations can run off the main thread; rAF-based animations stutter when the browser is busy loading a page. Use CSS for predetermined motion and JavaScript for dynamic, interruptible motion.

## WAAPI for programmatic CSS animations

The Web Animations API gives JavaScript control with CSS performance: interruptible and no library needed.

```js
element.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
  duration: 400,
  fill: 'forwards',
  easing: 'cubic-bezier(0.77, 0, 0.175, 1)',
});
```

## Debugging

### Slow motion

Play animations slower to see problems invisible at full speed: raise the duration 2–5x, or slow playback in the DevTools animation inspector. Look for:

- Colors that show two overlapping states instead of one smooth change
- Easing that starts or stops abruptly
- A transform-origin that scales from the wrong point
- Animated properties (opacity, transform, color) drifting out of sync

### Frame by frame

Step through in the Chrome DevTools Animations panel. Timing problems between coordinated properties show up here that cannot be seen at full speed.

### Real devices

For touch interactions (drawers, swipes), test on a phone: open the local dev server by IP address and use Safari remote devtools. The Xcode Simulator works, but real hardware is better for gestures.

### Fresh eyes

Review animations again the next day. Imperfections missed during development show up then.
