---
name: media
description: >
  Content media: HyperFrames video, Lottie, images, captions, multi-file media pipelines.
---

# Media

Own artifact work from contract to rendered output. Orchestration loop: follow `$route` → `references/orchestration.md`.


## Module convention

Top-level skills are only: `$route` `$frontend` `$code` `$writing` `$motion` `$performance` `$security` `$growth` `$media`.

Any other `$name` (e.g. `$impeccable`, `$unslop`) is a **module**. Load it by reading:

`~/.agents/skill-modules/<name>/SKILL.md`

The skills menu lists only the nine top-level skills; every module loads by that path. If the file is missing, search `~/.agents/skill-modules/` and pick the closest match.

## Phase 0 — Contract

**Goal:** Format, path, audience, constraints, success check (render/preview/lint).

- `$decision-doc` only if choosing between artifact directions
- `$product-brief` only if the artifact *is* a product/launch spec

**Green:** Output type + verification method explicit.

## Phase 1 — Words (if any)

- `$writing` / `$unslop` / `$app-copy` / `$readme` / `$changelog` as needed

**Green:** Text is specific before expensive renders.

## Phase 2 — Media lane

| Need | Skill |
|------|--------|
| Any video/composition (entry) | `$hyperframes` |
| CLI/render/doctor | `$hyperframes-cli` |
| Registry blocks | `$hyperframes-registry` |
| Video in React/TSX (entry) | `$remotion` |
| Remotion render/deploy | `$remotion-cli` |
| Media resolve (BGM/TTS/images) | `$media-use` |
| Known type | `$product-launch-video`, `$faceless-explainer`, `$general-video`, `$motion-graphics`, `$talking-head-recut`, `$embedded-captions`, … |
| Lottie | `$text-to-lottie` |
| Figma assets into HF | `$figma` |

**Green:** Artifact renders/previews; required lint/doctor passes.

## Phase 3 — Package

- Absolute paths in handoff
- Commands run + limitations
- Optional preview URL only if user asked

## Hand off when

| Signal | Switch to |
|--------|-----------|
| In-app UI, not a video | `$frontend` |
| Motion craft inside a product | `$motion` |
---

## Modules (load by path)

Base: `~/.agents/skill-modules/`

When a phase names a former skill like impeccable or unslop, **read**:

`~/.agents/skill-modules/<module-name>/SKILL.md`

| Module | Path |
|--------|------|
| `hyperframes` | `~/.agents/skill-modules/hyperframes/SKILL.md` |
| `hyperframes-cli` | `~/.agents/skill-modules/hyperframes-cli/SKILL.md` |
| `hyperframes-core` | `~/.agents/skill-modules/hyperframes-core/SKILL.md` |
| `hyperframes-creative` | `~/.agents/skill-modules/hyperframes-creative/SKILL.md` |
| `hyperframes-animation` | `~/.agents/skill-modules/hyperframes-animation/SKILL.md` |
| `hyperframes-keyframes` | `~/.agents/skill-modules/hyperframes-keyframes/SKILL.md` |
| `hyperframes-registry` | `~/.agents/skill-modules/hyperframes-registry/SKILL.md` |
| `remotion` | `~/.agents/skill-modules/remotion/SKILL.md` |
| `remotion-core` | `~/.agents/skill-modules/remotion-core/SKILL.md` |
| `remotion-animation` | `~/.agents/skill-modules/remotion-animation/SKILL.md` |
| `remotion-cli` | `~/.agents/skill-modules/remotion-cli/SKILL.md` |
| `media-use` | `~/.agents/skill-modules/media-use/SKILL.md` |
| `product-launch-video` | `~/.agents/skill-modules/product-launch-video/SKILL.md` |
| `faceless-explainer` | `~/.agents/skill-modules/faceless-explainer/SKILL.md` |
| `general-video` | `~/.agents/skill-modules/general-video/SKILL.md` |
| `motion-graphics` | `~/.agents/skill-modules/motion-graphics/SKILL.md` |
| `music-to-video` | `~/.agents/skill-modules/music-to-video/SKILL.md` |
| `pr-to-video` | `~/.agents/skill-modules/pr-to-video/SKILL.md` |
| `talking-head-recut` | `~/.agents/skill-modules/talking-head-recut/SKILL.md` |
| `embedded-captions` | `~/.agents/skill-modules/embedded-captions/SKILL.md` |
| `slideshow` | `~/.agents/skill-modules/slideshow/SKILL.md` |
| `remotion-to-hyperframes` | `~/.agents/skill-modules/remotion-to-hyperframes/SKILL.md` |
| `figma` | `~/.agents/skill-modules/figma/SKILL.md` |
| `text-to-lottie` | `~/.agents/skill-modules/text-to-lottie/SKILL.md` |
| `web-shader-extractor` | `~/.agents/skill-modules/web-shader-extractor/SKILL.md` |

If a needed module is missing from the table, list `~/.agents/skill-modules/` and open the closest match.

