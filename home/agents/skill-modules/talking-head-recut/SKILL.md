---
name: talking-head-recut
description: Package an existing talking-head / interview / podcast video with timed, designed GRAPHIC OVERLAY cards — kinetic titles, lower-thirds, data callouts, quotes, side panels, picture-in-picture — synced to the transcript, on a 16:9 / 9:16 / 4:5 canvas of your choice; the clip plays untouched underneath. Trigger on "graphic overlays", "on-screen graphics", "package / dress up my video". Not plain subtitles (/embedded-captions). Unclear → /hyperframes.
---

> **Keeping this skill fresh rewrites your beast checkout, so ask before running it:** `npx hyperframes skills update talking-head-recut`

# Talking Head Recut

Layer timed **graphic cards** on an existing talking-head clip (clip plays full; no recut of footage). Front door is `/hyperframes`. Plain subtitles → `/embedded-captions`.

## Artifacts (`videos/<project>/`)

| File | Role |
|------|------|
| `metadata.json` | duration / width / height / fps |
| `audio.mp3` | extracted audio |
| `transcript.json` | flat word array `[{text,start,end}]` |
| `storyboard.json` | agent plan (not CLI-consumed) |
| `public/cards/card-XX.html` | one card fragment each |
| `public/index.html` | assembled composition |
| `output.mp4` | render |

## Workflow index

| Step | Do | Detail |
|------|-----|--------|
| 1–6 | Env, work dir, ffprobe/ffmpeg, Whisper transcript, fix ASR, draft storyboard | `references/pipeline.md` |
| 7 | Confirm ratio / layout / style / cardCount; theme + zones | `references/render-strategy.md` |
| 8 | Write each card HTML (`data-anim-*`, scoped CSS) | `references/card-html.md` |
| 9 | Stage assets, assemble `index.html` + master GSAP timeline | `references/composition.md` |
| 10–11 | `hyperframes render`, report paths | `references/render-and-report.md` |

## Visual library (already on disk)

Mix per card: **style × layout × frame** — see `references/DESIGN_INDEX.md`, then:

- `references/styles/<key>.html` · `references/layouts/<key>.html` · `references/frames/<key>.html`

## Hard rules (do not skip)

- Clamp card times and composition duration to real media length
- Minimum **5** cards; pace from duration × density (see pipeline)
- Card HTML: single root, scoped CSS, **no** `<script>` / CDN / handlers
- Card-hosts: `class="card-host clip"` + HyperFrames `data-*` timing
- Master timeline: `window.__timelines["talking-head-recut"]`, sync-only, no `Math.random`
- Re-encode source with dense keyframes before render; preserve audio via `#source-audio`
- Prefer `PRODUCER_BROWSER_GPU_MODE=hardware` on macOS

## CLI spine

```bash
npx hyperframes doctor
ffprobe … > metadata.json && ffmpeg … audio.mp3
npx hyperframes transcribe audio.mp3 -d "$WORK_DIR" --json --model small.en
# … author cards + index.html …
PRODUCER_BROWSER_GPU_MODE=hardware npx hyperframes render public --skill=talking-head-recut -o output.mp4 --fps 30
```

Load reference files **as you reach each step** — do not preload all of them.
