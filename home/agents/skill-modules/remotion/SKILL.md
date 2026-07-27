---
name: remotion
description: Entry point for any Remotion (React) video work — inspect or scaffold the project, route to the right sibling skill, capture what the video actually has to say, and clear the licence gate before building.
---

# Remotion

The front door for video built with Remotion: React components rendered to frames, one integer frame at a time. Start here, then load exactly one sibling.

| The task | Load |
| --- | --- |
| Structure a project, register a composition, wire media or data | `~/.agents/skill-modules/remotion-core/SKILL.md` |
| Animate anything — curves, springs, scene transitions | `~/.agents/skill-modules/remotion-animation/SKILL.md` |
| Preview, render, tune speed, deploy to Lambda, CI | `~/.agents/skill-modules/remotion-cli/SKILL.md` |

Written against **Remotion 4.0.499** (July 2026). v5 is drafted and unreleased; if `npx remotion versions` reports 5.x, re-check the details in these skills before trusting them.

## Before writing anything

**1. Find out what already exists.**

```bash
cat package.json | rg '"remotion"'     # is this even a Remotion project
npx remotion versions                  # version + package-compatibility check
npx remotion compositions -q           # the ids you can render
```

A project with `src/Root.tsx` and `remotion.config.ts` is one to extend, not to scaffold over. Read the existing compositions first and match their fps, dimensions, prop shape and folder layout.

**2. Say the licence rule out loud, once.**

Remotion is source-available. A paid company licence is mandatory once **four or more people** are involved, counted across every party in the engagement. Individuals, teams of three or fewer, and non-profits are free. If the user is a company adopting this for commercial work, tell them now rather than after they have built on it.

**3. Get the frame budget straight.** Duration in seconds × fps = frames, and the last frame is `durationInFrames - 1`. Everything downstream is counted in frames, so agree on fps first. 30 is the default for most social and product video; 60 for anything that reads as UI motion; 24 when it has to feel filmic.

## What the video has to say

Ask only what changes the build, and stop:

- **What is it for** — a launch, an explainer, a loop for a landing page, a caption pass on existing footage.
- **How long, what shape** — seconds and aspect ratio. 9:16 at 1080×1920, 16:9 at 1920×1080, 1:1 at 1080×1080.
- **What content exists already** — copy, footage, logo, brand colours, a font. Missing assets are the usual reason a build stalls halfway.
- **Where it ends up** — a file, a Player embedded in a React app, or an automated pipeline rendering per-user videos. The third one changes the architecture, because props come from data and `calculateMetadata` does the work.

Write the answers into the project as `defaultProps` and a Zod `schema` rather than into prose. That makes them editable in the Studio and overridable per render.

## Starting from nothing

```bash
npx create-video@latest my-video --blank --yes   # add --no-tailwind to skip Tailwind
cd my-video && npm run dev
```

Templates worth knowing instead of `--blank`: `--tiktok` (word-by-word captions from Whisper), `--audiogram`, `--music-visualization`, `--three` for 3D, `--next` to embed in a Next.js app, `--recorder` for screen-and-webcam capture. `npx create-video@latest --help` lists the current set.

Then work in this loop: `npm run dev` for the Studio, render a range while iterating (`--frames=0-59`), full render only when the whole thing holds together.

## The rule that breaks the most builds

Every visible value must be a pure function of `useCurrentFrame()`. Frames render out of order across parallel Chromium tabs, so CSS animations, `requestAnimationFrame`, `Math.random()`, `Date.now()` and late-arriving state each produce a preview that animates and an export that does not. Sometimes they produce an export that flickers, which is harder to notice and worse to debug. `remotion-core` has the full list and the replacements.

## Remotion's own agent skills

The Remotion team ships an official skill bundle:

```bash
npx remotion skills add
```

It installs into the **project's** `.agents/skills`, so it sits beside these skills rather than replacing them, and it tracks upstream more closely than any vendored copy can. Add it when a project needs depth these four do not cover: the Studio's newer surface area, `@remotion/media` internals, the paid components. Prefer their answer when the two disagree about an API, and say which one you followed.

Their MCP server is deprecated and shuts down no earlier than 31 August 2026. Do not build a workflow on it.

## Related

- `~/.agents/skill-modules/remotion-core/SKILL.md`
- `~/.agents/skill-modules/remotion-animation/SKILL.md`
- `~/.agents/skill-modules/remotion-cli/SKILL.md`
