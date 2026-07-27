---
name: remotion-core
description: The Remotion composition contract — registerRoot, `<Composition>`, calculateMetadata, Sequence and Series timing, the media tags, async loading, and the determinism rules every render depends on. Read before writing composition TSX.
---

# Remotion Core

Remotion renders video from React. Every frame is a render of your component tree at one integer frame number, so a composition is a **pure function of `useCurrentFrame()`** — anything else flickers, because frames are rendered out of order across parallel Chromium tabs that share no state.

This skill is the technical contract: how one project is shaped and what the runtime guarantees. Motion curves live in `remotion-animation`. Running, rendering and shipping live in `remotion-cli`. The router is `remotion`.

Written against **Remotion 4.0.499** (July 2026). Confirm with `npx remotion versions` before trusting any signature here; the 4.0.x line ships near-daily and v5.0 is drafted but unreleased.

## Project shape

```
my-video/
├─ public/              # staticFile() reads from here
├─ src/
│  ├─ index.ts          # registerRoot(RemotionRoot) — nothing else
│  └─ Root.tsx          # every <Composition> registration
└─ remotion.config.ts   # CLI-only settings
```

```tsx
// src/index.ts
import {registerRoot} from 'remotion';
import {RemotionRoot} from './Root';

registerRoot(RemotionRoot);
```

`registerRoot` belongs in its own file. Fast Refresh re-executes a changed module, and registering twice is an error.

Scaffold with `npx create-video@latest <dir> --blank`, or pick a template (`--tiktok`, `--audiogram`, `--next`, `--three`, `--recorder`, and others listed at `npx create-video@latest --help`).

## The composition

```tsx
// src/Root.tsx
import {Composition} from 'remotion';
import {MyVideo, schema} from './MyVideo';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="MyVideo"
    component={MyVideo}
    durationInFrames={150}
    fps={30}
    width={1920}
    height={1080}
    schema={schema}
    defaultProps={{title: 'Hello'}}
  />
);
```

| Prop | Rule |
| --- | --- |
| `id` | letters, numbers, hyphens; this is what the CLI renders by name |
| `component` **or** `lazyComponent` | exactly one — passing both or neither is an error |
| `durationInFrames`, `fps`, `width`, `height` | required unless `calculateMetadata` returns them |
| `defaultProps` | must be JSON-serializable. `Date`, `Map`, `Set` and `staticFile()` results survive; functions and class instances do not |
| `schema` | a `z.object()`; required for the Studio props editor to render controls |
| `calculateMetadata` | async hook that computes props, duration or dimensions before the render starts |

Duration in seconds is `durationInFrames / fps`. The first frame is `0` and the last is `durationInFrames - 1`. A 6-second clip at 30fps is 180 frames, and frame 180 does not exist.

`--blank` scaffolds one level deeper than this: `Root.tsx` renders a `MyComposition` component from `src/Composition.tsx`, and that component returns the `<Composition>`. Both shapes work. What matters is that every `<Composition>` ends up inside the tree `registerRoot` was given.

### calculateMetadata

```tsx
export const calculateMetadata: CalculateMetadataFunction<Props> = async ({props}) => {
  const captions = await fetch(props.captionsUrl).then((r) => r.json());
  return {
    props: {...props, captions},
    durationInFrames: Math.ceil((captions.at(-1).endMs / 1000) * 30),
  };
};
```

It runs **exactly once per render**, before any frame, outside the parallelism. That makes it the only correct home for fetching data, measuring a media file, deriving a duration from content, and the only place unseeded randomness or `Date.now()` is safe. It must finish inside the `delayRender` timeout. It receives `{defaultProps, props, abortSignal, compositionId, isRendering}` and may return `props`, `durationInFrames`, `width`, `height`, `fps`, `defaultCodec`, `defaultOutName`, and the other per-composition render defaults.

## Timing

`useCurrentFrame()` returns the frame **relative to the nearest enclosing `<Sequence>`**. That relativity is the whole composition model: a child never needs to know when its parent starts.

```tsx
<Sequence from={90} durationInFrames={60}>
  <Title />      {/* sees frame 0 at the composition's frame 90 */}
</Sequence>
```

`useVideoConfig()` returns `{fps, durationInFrames, width, height}` for the enclosing composition.

| Primitive | Use it for |
| --- | --- |
| `<Sequence from durationInFrames>` | shift and trim a subtree; children unmount outside the window |
| `<Series>` + `<Series.Sequence durationInFrames>` | back-to-back scenes without hand-summing offsets; `offset` overlaps or gaps the next one |
| `<AbsoluteFill>` | a full-frame absolutely-positioned flex layer; later siblings paint on top |
| `<Loop durationInFrames times>` | repeat a subtree a finite number of times |
| `<Sequence freeze={n}>` | hold children at one frame (preferred over the standalone `<Freeze>`) |

Useful `<Sequence>` props beyond the basics: `layout="none"` (skip the wrapper div), `premountFor` (mount media N frames early so it is loaded before it is visible), `postmountFor`, `trimBefore`, `showInTimeline`, `name`. `premountFor` defaults to `0` today and is planned to default to `fps` in v5.

Only the last `<Series.Sequence>` may use `durationInFrames={Infinity}`.

## Media

`@remotion/media` owns the recommended tags as of 4.0.4xx, reversing the older advice that pushed `<OffthreadVideo>` for everything. The docs call them the recommended tags while the package still describes itself as experimental, so treat this as the fastest-moving surface in Remotion and check the release notes when something behaves oddly.

```tsx
import {Video, Audio} from '@remotion/media';

<Video src={staticFile('clip.mp4')} volume={0.6} />
<Audio src={staticFile('vo.mp3')} />
```

| Tag | When |
| --- | --- |
| `<Video>` / `<Audio>` from `@remotion/media` | default for new projects. Mediabunny/WebCodecs, partial download, loopable, works in the Player |
| `<OffthreadVideo>` from `remotion` | fallback for what the above will not decode — AV1, H.265, AC3 — and for sources without CORS headers. Server-side rendering only |
| `<Html5Video>` / `<Html5Audio>` from `remotion` | the old browser-backed tags, renamed. Reach for them last |
| `<Img>` from `remotion` | images. Blocks the frame until loaded; always pass `onError` or a broken URL hangs the render |
| `<AnimatedImage>` from `remotion`, `<Gif>` from `@remotion/gif` | animated images that must stay frame-accurate |

`staticFile('logo.png')` resolves files in `public/`. Paths are URI-encoded for you — do not pre-encode. Never load a visible asset through CSS `background-image` or `mask-image`: those bypass Remotion's asset tracking, so the renderer does not know to wait and screenshots an empty box.

## Async work

Anything the frame depends on must block the frame.

```tsx
const {delayRender, continueRender, cancelRender} = useDelayRender();
const [handle] = useState(() => delayRender('loading captions'));

useEffect(() => {
  fetchCaptions()
    .then(() => continueRender(handle))
    .catch((err) => cancelRender(err));
}, []);
```

Create the handle inside `useState(() => …)`. A bare `delayRender()` in the component body fires again on every render and the render never completes. Default timeout is 30s per handle. `useDelayRender()` is the current form; the standalone `delayRender` import still works.

Prefer `calculateMetadata` over `delayRender` whenever the data is the same for every frame. Fetching once beats fetching in all of them.

Fonts must be loaded before you measure text, or the layout shifts between preview and render:

```tsx
import {loadFont} from '@remotion/google-fonts/Inter';
const {fontFamily} = loadFont('normal', {weights: ['400', '700'], subsets: ['latin']});
```

Load explicit weights and subsets. Calling `loadFont()` bare pulls everything and risks a timeout, and v5 will require the arguments.

## Determinism — the rules that break renders

Frames render in parallel, out of order, in separate browser instances. Every one of these produces output that differs between preview and render, or between one frame and the next:

- **`Math.random()`** — each tab rolls different numbers. Use `random(seed)` from `remotion`; the same seed gives the same value everywhere. `random(null)` opts out deliberately.
- **`Date.now()` / `new Date()`** — same problem. Compute it in `calculateMetadata` and pass it as a prop.
- **CSS `animation`, `transition`, and `requestAnimationFrame`** — they advance on wall-clock time, which the renderer does not run. Every animated value must come from `useCurrentFrame()`.
- **State that arrives late.** A `useEffect` that sets state one tick later gets captured mid-flight. Gate on `delayRender` so the frame waits.
- **Unloaded fonts and images.** Use the Remotion tags, which hook into the render lock.

`--concurrency=1` makes these symptoms disappear by rendering single-threaded. It is a diagnostic, not a fix — the bug ships to Lambda at full fan-out.

## Props and schemas

```tsx
import {z} from 'zod';
import {zColor} from '@remotion/zod-types';

export const schema = z.object({
  title: z.string(),
  accent: zColor(),
});
export const MyVideo: React.FC<z.infer<typeof schema>> = ({title, accent}) => …;
```

`@remotion/zod-types` adds `zColor()`, `zTextarea()` and `zMatrix()`, which render real controls in the Studio props editor. It targets Zod v4 as of 4.0.426; `@remotion/zod-types-v3` exists for projects pinned to Zod 3.

Input props override matching keys in `defaultProps` and leave the rest alone:

```bash
npx remotion render MyVideo out/v.mp4 --props='{"title":"Ship it"}'
npx remotion render MyVideo out/v.mp4 --props=./props.json
```

Programmatically, pass the same `inputProps` object to `selectComposition()` **and** `renderMedia()`. Passing it to only one renders a composition whose metadata disagrees with its frames.

## When it goes wrong

| Symptom | Cause | Fix |
| --- | --- | --- |
| Values jump between frames | unseeded randomness or wall-clock time | `random(seed)`, or move it to `calculateMetadata` |
| Preview animates, render is static | CSS animation or `requestAnimationFrame` | drive it from `useCurrentFrame()` |
| Render hangs, then times out | a `delayRender` handle never continued, or an `<Img>` 404 with no `onError` | continue or cancel every handle; handle image errors |
| `delayRender` timeout on the first frame | handle created in the component body | wrap it in `useState(() => delayRender())` |
| Text reflows between preview and render | measured before the font loaded | await the font, then measure |
| Black or missing video frames | codec the media tag cannot decode | fall back to `<OffthreadVideo>` |
| Nothing visible after the first scene | a `<Sequence>` with no `durationInFrames` swallowing the rest | set explicit durations, or use `<Series>` |

## Related

- `~/.agents/skill-modules/remotion-animation/SKILL.md` — interpolate, spring, transitions
- `~/.agents/skill-modules/remotion-cli/SKILL.md` — studio, render, config, Lambda
- `~/.agents/skill-modules/remotion/SKILL.md` — the router that owns task selection
