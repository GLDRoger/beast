---
name: remotion-cli
description: Run and ship Remotion — studio, render, still, bundle, config precedence, codecs and alpha, programmatic renderMedia, Lambda, Docker and CI, render performance, and the licence rule. Read before rendering or deploying.
---

# Remotion CLI

Preview, render, and ship. The composition contract is in `remotion-core`; motion is in `remotion-animation`.

Written against **Remotion 4.0.499**. Check yours with `npx remotion versions`, which checks that every `@remotion/*` package sits on the same version and flags a `zod` that does not match. Mismatched Remotion packages fail in ways that look like your own code.

## Commands

| Command | Use |
| --- | --- |
| `npx remotion studio` | the editor at localhost:3000. `npm run dev` in a scaffolded project |
| `npx remotion render <id> <out>` | render a composition |
| `npx remotion still <id> <out.png>` | one frame, `--frame=<n>` |
| `npx remotion compositions` | list ids; `-q` prints just the names, for scripts |
| `npx remotion benchmark src/index.ts <ids>` | measure before tuning `--concurrency` |
| `npx remotion bundle` | build a servable bundle for later renders or Lambda |
| `npx remotion browser ensure` | find or download Chrome Headless Shell |
| `npx remotion upgrade` | move every Remotion package in lockstep. Never bump one alone |
| `npx remotion gpu` | print the GPU report for the current `--gl` backend |

`npx create-video@latest <dir> --blank --yes` scaffolds without prompting. `--yes` needs both a template flag and a directory, and it accepts every default, including **Tailwind**. Add `--no-tailwind` to opt out. Template flags are one per template: `--blank`, `--hello-world`, `--tiktok`, `--audiogram`, `--music-visualization`, `--three`, `--next`, `--recorder`, `--still`, `--overlay`, and more from `npx create-video@latest --help`.

### Render flags worth knowing

```bash
npx remotion render MyComp out/video.mp4 \
  --props='{"title":"Ship it"}' \
  --concurrency=4 --crf=18 --log=verbose
```

| Flag | Notes |
| --- | --- |
| `--props=` | inline JSON or a path to a `.json` file |
| `--frames=0-59` | render a range while iterating |
| `--concurrency=<n>` | parallel tabs. Higher is not automatically faster |
| `--codec=` | `h264` (default), `h265`, `av1`, `vp8`, `vp9`, `prores`, `gif`, `mp3`, `aac`, `wav` |
| `--crf=<n>` | quality; lower is better and bigger. Incompatible with `--video-bitrate`, and disabled by hardware acceleration |
| `--image-format=jpeg\|png\|none` | PNG only when you need alpha; it encodes slower |
| `--scale=<n>` | render at a different resolution, 0 < n ≤ 16 |
| `--every-nth-frame=<n>` | GIF only |
| `--muted`, `--audio-codec=` | audio control |
| `--sequence` | image sequence instead of a video |
| `--gl=<backend>` | see performance below |
| `--timeout=<ms>` | per-`delayRender` timeout, default 30000 |
| `--disable-web-security` | last resort for CORS during local iteration |

### remotion.config.ts

```ts
import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
```

Two rules. **CLI flags beat the config file.** And **the config file does nothing for the Node APIs**: `renderMedia()` and friends read their arguments only, so anything you set here must be passed again in code. Studio-only settings such as `setMaxTimelineTracks` and `setKeyboardShortcutsEnabled` have no CLI equivalent and belong here.

## Codecs, containers, alpha

| Codec | Container |
| --- | --- |
| h264 | mp4, mov, mkv |
| h265 | mp4, hevc |
| vp8 / vp9 | webm |
| av1 | mp4, webm, mkv |
| prores | mov |
| mp3 / aac / wav | audio only |

Transparency has exactly two paths:

- **ProRes 4444** (or `4444-xq`) in a `.mov`, pixel format `yuva444p10le`. This is the one to hand an editor.
- **VP8/VP9** in `.webm`, pixel format `yuva420p`. Chunked parallel renders can flicker at chunk boundaries because alpha may depend on previous frames — render it in one pass.

Embed an alpha source with `<OffthreadVideo transparent />`.

## Rendering from code

```ts
import {bundle} from '@remotion/bundler';
import {selectComposition, renderMedia} from '@remotion/renderer';

const serveUrl = await bundle({entryPoint: require.resolve('./src/index.ts')});
const inputProps = {title: 'Ship it'};

const composition = await selectComposition({serveUrl, id: 'MyComp', inputProps});

await renderMedia({
  serveUrl,
  composition,
  codec: 'h264',
  outputLocation: 'out/video.mp4',
  inputProps,
});
```

Bundle once, render many times from the same `serveUrl`. Pass `inputProps` to **both** calls, or the metadata and the frames disagree. `renderStill()` is the single-frame equivalent. `renderFrames()` + `stitchFramesToVideo()` still exist but `renderMedia()` replaced and outperforms them; reach for the pair only when you need the raw frames.

Option churn in the 4.x line. Gone from the type entirely: `parallelism` (use `concurrency`), `ffmpegExecutable` and `ffprobeExecutable` (FFmpeg is bundled; use `binariesDirectory`). Still accepted but deprecated: `dumpBrowserLogs` and `verbose`, both replaced by `logLevel: 'verbose'`. `quality` is typed `never`, so it fails to compile — pass `jpegQuality`.

## Lambda

```bash
npx remotion lambda functions deploy
npx remotion lambda sites create --site-name=my-video
npx remotion lambda render <serve-url> MyComp
```

The render fans out into many concurrent Lambdas, each doing a chunk. In code, `renderMediaOnLambda()` resolves to an object carrying `renderId` and `bucketName`; feed both to `getRenderProgress()` and poll.

- Permissions are two policies, a user policy and a `remotion-lambda-role` policy. Generate and check them with `npx remotion lambda policies user`, `policies role`, `policies validate`.
- AWS allows 1000 concurrent Lambdas per region by default; raise it through a quota request before a big fan-out.
- There is no GPU on Lambda. `--gl=swangle` is the fixed backend, so GPU-bound compositions are slow there by construction.
- `deploySiteFromBundle()` uploads a bundle you already built, and site deploys are zero-downtime as of 4.0.497.

`@remotion/cloudrun` is alpha and not actively developed, which the docs say outright. Use Lambda, or render on your own server.

## Docker and CI

```dockerfile
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
  libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 libxrandr2 \
  libxkbcommon-dev libxfixes3 libxcomposite1 libxdamage1 \
  libatk-bridge2.0-0 libpango-1.0-0 libcairo2 libcups2
COPY package*.json tsconfig.json remotion.config.ts ./
RUN npm ci
COPY src ./src
COPY public ./public
RUN npx remotion browser ensure
CMD ["node", "render.mjs"]
```

Those shared libraries are what Chrome Headless Shell needs; without them the render dies with a linker error, not a Remotion error. In containers, set CPU limits with `--cpus` and enable `enableMultiProcessOnLinux`. GitHub Actions runners have **no GPU**, so `--gl=angle` fails there. Leave the default.

## Performance

- **Measure, then tune.** `npx remotion benchmark src/index.ts MyComp --concurrencies=2,4,8` finds the real sweet spot; guessing high often makes it slower.
- **`--gl` backends:** default (`null`) locally, `swangle` on Lambda. Use `angle` for WebGL and Three.js on a desktop GPU, `angle-egl` on a cloud GPU box. `angle` has known memory leaks, so split long renders into chunks. Chromium disables the GPU in headless mode unless you pass `--gl`, which is why a WebGL-heavy composition can be 10× slower in a render than in the Studio.
- **Skip expensive paint.** `filter: blur()` and large `box-shadow` cost real milliseconds every frame on a GPU-less box. Pre-render them to an image where you can.
- **`--scale=0.5`** to iterate, full scale for the final. Rendering big and downscaling later wastes the whole render.
- **`premountFor`** on a `<Sequence>` loads media before it is visible, which removes the first-frame stall when a clip appears.
- **JPEG frames** encode faster than PNG. Only pay for PNG when you need alpha.

## Licence

Remotion is source-available, not MIT. A company licence is **mandatory once four or more people are involved**, counted across every party in the engagement, so an agency and its client are added together. Individuals, companies of three or fewer, and non-profits use it free. Both sentences are quoted from remotion.dev/docs/license/terms, which is the page to re-read before advising anyone. Licences are bought at remotion.pro; check the tiers there rather than quoting a price from memory.

Say this out loud when a team is about to adopt Remotion for commercial work. Discovering it at the invoice stage is worse than discovering it now.

## Related

- `~/.agents/skill-modules/remotion-core/SKILL.md` — the composition contract
- `~/.agents/skill-modules/remotion-animation/SKILL.md` — motion
- `~/.agents/skill-modules/remotion/SKILL.md` — the router
