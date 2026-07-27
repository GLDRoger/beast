---
name: remotion-animation
description: Motion in Remotion — interpolate, spring, Easing, TransitionSeries and its presentations, staggered choreography, and the frame-pure patterns that replace CSS animation. Read before animating anything in a composition.
---

# Remotion Animation

Every animated value is a function of the current frame. There is no timeline object to advance and no clock to run: you are asked for frame 412 and you return what the screen looks like at frame 412. Two functions do almost all of the work, `interpolate` for curves you control and `spring` for physical motion.

The composition contract, the media tags and the determinism rules are in `remotion-core`. Rendering is in `remotion-cli`.

Written against **Remotion 4.0.499**.

## interpolate

```tsx
const frame = useCurrentFrame();
const opacity = interpolate(frame, [0, 20], [0, 1], {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
});
```

Map an input range onto an output range. Without `clamp`, the line keeps going: at frame 200 that opacity is 10, which silently becomes a fully opaque element you thought was fading. **Clamp both ends unless you want extrapolation.**

| Option | Values |
| --- | --- |
| `extrapolateLeft` / `extrapolateRight` | `extend` (default), `clamp`, `wrap`, `identity` |
| `easing` | an `Easing` function, or an array of them, one per segment |
| `output` | `linear` (default) or `perceptual-scale`, which keeps *area* linear when scaling |
| `posterize` | quantize the input so the value only updates every n frames |

The input range takes more than two stops, which is how you build a multi-beat move in one call:

```tsx
const x = interpolate(frame, [0, 30, 60, 90], [0, 100, 100, 0], {
  extrapolateRight: 'clamp',
  easing: Easing.inOut(Easing.cubic),
});
```

`Easing` ships `linear`, `quad`, `cubic`, `poly(n)`, `sin`, `circle`, `exp`, `ease`, `elastic(bounciness)`, `bounce`, `back(s)`, and `bezier(x1, y1, x2, y2)` for a CSS cubic-bezier you already like. Wrap any of them in `Easing.in()`, `Easing.out()` or `Easing.inOut()`. Linear motion reads as mechanical for anything representing a physical object. Reserve it for progress bars and counters.

## spring

```tsx
const scale = spring({
  frame,
  fps,
  config: {damping: 200},
  durationInFrames: 20,
});
```

Springs go from 0 to 1 by default and overshoot slightly, which is what makes them feel alive. `config.damping: 200` removes the overshoot when you want the move to feel decisive. `config.stiffness` (default 100) raises speed and bounce together; `config.mass` (default 1) slows it down.

`durationInFrames` stretches the whole curve to a length you choose, which is how you get spring feel that still lands on a beat. `delay` shifts the start. `from` and `to` set the range directly, though driving `interpolate` with a 0→1 spring composes better:

```tsx
const enter = spring({frame, fps, durationInFrames: 25});
const y = interpolate(enter, [0, 1], [40, 0]);
const opacity = interpolate(enter, [0, 1], [0, 1]);
```

`measureSpring({fps, config})` returns how many frames a spring needs to settle, for when a later element has to wait for an earlier one.

## Staggering

Offset the frame per index. No loops over time and no delays. Subtract and clamp:

```tsx
{items.map((item, i) => {
  const local = frame - i * 4;
  const enter = spring({frame: local, fps, durationInFrames: 20});
  return <Row key={item.id} style={{opacity: enter, transform: `translateY(${(1 - enter) * 24}px)`}} />;
})}
```

Four to six frames between siblings at 30fps reads as one gesture. Twelve reads as a list being counted.

## Transitions between scenes

```tsx
import {TransitionSeries, linearTiming, springTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={40}><Intro /></TransitionSeries.Sequence>
  <TransitionSeries.Transition timing={linearTiming({durationInFrames: 30})} presentation={fade()} />
  <TransitionSeries.Sequence durationInFrames={60}><Body /></TransitionSeries.Sequence>
</TransitionSeries>
```

**Transition durations subtract.** Those scenes are 40 + 60 frames with a 30-frame transition, so the composition is 70 frames long, not 100. Budget for it or the video ends earlier than the storyboard says.

Presentations: `fade()`, `slide()`, `wipe()`, `flip()`, `clockWipe({width, height})`, `iris()`, `none()`. Timings: `linearTiming({durationInFrames, easing})` and `springTiming({config, durationInFrames, durationRestThreshold})`. Pass `durationRestThreshold: 0.001` to `springTiming`, because the 0.005 default cuts the tail visibly on slower springs.

`TransitionSeries.Overlay` (4.0.415+) draws above a cut without changing any timing. A custom presentation is a function returning `{component, passedProps}`, and the component receives `presentationProgress`, `presentationDirection` and `presentationDurationInFrames`.

## Transforms

`@remotion/animation-utils` keeps transform strings honest:

```tsx
import {makeTransform, translateY, scale, rotate} from '@remotion/animation-utils';

const transform = makeTransform([translateY(y), scale(s), rotate(deg)]);
```

It concatenates and adds units. It does not interpolate; the numbers still come from `interpolate` or `spring`. `interpolateStyles(frame, [0, 30, 60], [styleA, styleB, styleC])` animates a whole style object across keyframes when a component has several properties moving together.

## Reach for a package

| Need | Package | Note |
| --- | --- | --- |
| Shutter-accurate motion blur | `@remotion/motion-blur` | `<Trail>` and `<CameraMotionBlur>`; children must be absolutely positioned |
| Organic drift, no randomness bug | `@remotion/noise` | `noise2D/3D/4D(seed, …)` returns −1…1 deterministically |
| SVG shapes | `@remotion/shapes` | `<Rect>`, `<Circle>`, `<Star>`, `<Pie>` and `make*()` path variants |
| Draw-on / path following | `@remotion/paths` | `getLength`, `getPointAtLength`, `interpolatePath`, `cutPath` |
| Lottie files | `@remotion/lottie` | needs `lottie-web` installed; expressions may not seek deterministically |
| 3D | `@remotion/three` | inside `<ThreeCanvas>`. When you update a video texture during a render, call `advance(performance.now())`; `invalidate()` only schedules an async redraw and yields stale frames above concurrency 1 |
| Rive | `@remotion/rive` | `<RemotionRiveCanvas>` |
| Audio-reactive bars | `@remotion/media-utils` | `getAudioData` + `visualizeAudio` |

## Rules

- **No CSS `animation`, no `transition`, no `requestAnimationFrame`.** They run on wall-clock time. The renderer does not have one. This is the single most common reason a preview animates and the MP4 does not.
- **No `Math.random()` inside a frame.** `random(seed)` from `remotion`, or `noise2D`, or compute it once in `calculateMetadata`.
- **Animate `transform` and `opacity` first.** Animating `width`, `top` or `box-shadow` costs layout or paint on every frame, and on a GPU-less render box that shows up directly in render time.
- **Hold the last frame.** A move that ends exactly on the composition's final frame reads as cut off. Land it 6–10 frames early.
- **Match motion to distance.** A 40px nudge over 25 frames feels slow; a 900px sweep over 25 frames feels right. Keep velocity, not duration, consistent across a piece.

## Related

- `~/.agents/skill-modules/remotion-core/SKILL.md` — the composition contract and determinism rules
- `~/.agents/skill-modules/remotion-cli/SKILL.md` — preview, render, performance
- `~/.agents/skill-modules/remotion/SKILL.md` — the router
