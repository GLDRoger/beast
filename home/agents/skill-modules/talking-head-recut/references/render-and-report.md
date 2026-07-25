# Render & report (steps 10–11)

### 10. Render to MP4

```bash
cd "$WORK_DIR"
PRODUCER_BROWSER_GPU_MODE=hardware npx hyperframes render public \
  --skill=talking-head-recut \
  -o output.mp4 \
  --fps 30
```

`hyperframes render <dir>` reads `<dir>/index.html` and produces the MP4.
The canonical composition keeps the visual `<video>` muted and mounts the same
source as the root `#source-audio` track, so the rendered MP4 preserves the
talking-head audio without a manual remux. This uses a separate audio track
rather than `data-has-audio="true"` so its volume and ducking remain independently
controllable on the timeline.
The flag `PRODUCER_BROWSER_GPU_MODE=hardware` (or `--browser-gpu`) is
strongly recommended on macOS — software-only Chrome rendering times out
on most laptops.

For a sanity check before the full render, capture a single frame at a
specific timestamp:

```bash
npx hyperframes snapshot public --at 5    # → public/snapshots/frame-00-at-5s.png (a single --at ignores --out)
```

### 11. Report Results

Tell the user:

- Work directory path
- `storyboard.json` (the card outline you designed)
- `public/cards/*.html` (one HTML per card)
- `public/index.html` (the assembled composition)
- `output.mp4` (the final video)
- ASR provider used
- Card count + how you chose them (in 1 sentence)
- Any missing keys or quality caveats

**Optional live preview (on request only).** The clip plays unchanged inside `public/index.html` with the overlays on top, so it previews faithfully. **Don't open it during the run.** When the user asks, start a long-lived server **after** render and report the URL:

```bash
(cd "$WORK_DIR/public" && npx hyperframes preview)   # or `npx hyperframes play` for a shareable link
```

Do not delete the work directory unless the user asks.
