---
name: drawing-canvas-films
description: Use when the person wants a video, launch film, short, or animation where Claude draws every frame in code (the "Claude drew every frame of this animation in JavaScript" trend), asks for a procedural canvas animation exported to MP4, or wants to extend, restyle, or re-render a film built from this skill's template.
---

# Drawing canvas films

One HTML file draws every frame on a `<canvas>` with JavaScript. Headless Chrome seeks each frame, and ffmpeg encodes the PNG stream plus a synthesized soundtrack into an MP4. The file contains no images, video, font files, or audio files, so the claim "Claude drew every frame" is literally true and anyone can check it.

Origin: Kevin Ngo (@kevin_t_ngo) popularized the format in September 2026. He never published his prompts. A reply of his quoted Claude's own breakdown of his film: one 506 KB HTML file, 42 scene functions `plate(name, (S, R) => …)`, a seeded random-number generator, and frames driven by `?f=&s=` URL parameters. A frame could be rendered with the network disabled. `examples/made-of-words.html` is a 40-second launch film built with this skill. It rendered in 90 s on an M4 Pro.

## Files

- `assets/template.html`: an 8-second starter film already wired to the renderer. Start every new film from it.
- `scripts/render.mjs` + `scripts/package.json`: the renderer, which uses `puppeteer-core` with the system Chrome.
- `examples/made-of-words.html`: the full reference film. Read the matching function before building a similar effect: a perspective sea of text (`sea`), a planet with a code ring (`planet`), the collapse into a point (`codeView`), a starburst of rays (`burst`), a title made of words (`TITLE_CELLS`), and the whole sound design (`renderAudio`).

## Steps

### 1. Treatment

Before any code, write the treatment in chat:

- **Style:** choose one with a name, a palette of at most 4 inks, and a background. Unless the person asks otherwise, pick a style distinct from the ones already circulating: paper cut-out, risograph, pencil, ink, doodle (Kevin's) and typographic cinema (the example).
- **Beats:** 5–7 story beats, each with a time range and a one-sentence job. Motivate every transition from inside the story: letters *fall into* the sea, the moon *becomes* the planet, the dive *lands in* the code. Unmotivated crossfades read like a slideshow.
- **Copy:** list every on-screen line. Every claim must be true by construction. Compute numbers from the file itself (the example counts its own source lines). Never invent benchmarks, features, or specs.
- **Length:** 30–45 s at 24 fps. End on an image that echoes the opening.

Done when every beat has start and end seconds and a stated transition, and every copy line has been checked for truth.

### 2. Scaffold

```bash
S=~/.agents/skill-modules/drawing-canvas-films
mkdir -p <project> && cd <project>
cp $S/assets/template.html film.html
cp $S/scripts/render.mjs $S/scripts/package.json .
npm install --no-audit --no-fund
node render.mjs film.html --grid 12
```

Done when the run prints `external requests: none` and `out/film-grid.png` exists.

### 3. Build the scenes

- Put every scene boundary in the timeline constants (`T` in the template). Picture and sound both read them, so sound stays in sync by construction.
- Make `draw(f)` depend on nothing except `f` and `SEED`:
  - For per-element randomness inside a frame, use `hash(i, j, k)`.
  - Use `rng()` only for things generated once at load, such as ray layouts and typing rhythm.
  - Motion that should flicker changes its hash key on a clock, e.g. `hash(i, j, Math.floor(t * 10))`.
- Get fades and positions from `seg(t, a, b)` passed through an easing function. Never accumulate state across frames. The renderer may jump to any frame.
- To make a film read its own source, use `document.getElementById('film').textContent`. The string `</script>` must never appear inside the script.

Done when the same frame rendered twice gives identical files, and `--seed 3` gives a different one:

```bash
node render.mjs film.html --only 300 --out out/a
node render.mjs film.html --only 300 --out out/b
node render.mjs film.html --only 300 --seed 3 --out out/c
md5 -q out/{a,b,c}/*.png   # a == b, and c differs
```

### 4. Look loop

This loop is the method; it's how the work gets checked. Repeat until nothing is left to fix:

1. `node render.mjs film.html --grid 36`, then Read the sheet: overall pacing and composition.
2. `node render.mjs film.html --only <frames>`, then Read each frame at full size. Check every transition midpoint, every caption, the title, and the brightest moment.
3. Fix what's wrong, then re-render only the frames you touched.

Thumbnails lie. A title made of glyphs read perfectly on the contact sheet and dissolved into texture at 1080p. Always check the title and captions at full size.

Done when every beat has been inspected at full size and every caption sits on a clean background.

### 5. Sound

Build `renderAudio()` from the same timeline constants. Useful parts are in the template and example:

- Keystroke clicks: filtered noise plus a short sine thump, one per typed character, captions included.
- Pads: detuned sawtooth waves through a lowpass filter whose cutoff moves.
- Bells: sine partials at ×1, ×2.01, and ×3.98, sent through a delay.
- A riser into the big moment: noise through a bandpass swept from 300 to 7000 Hz.
- A hit: a sine dropping from 110 to 36 Hz, with a noise burst.
- Reverb: a convolver fed an impulse response made from decaying noise.

You can't hear the result, so check it by eye:

```bash
ffmpeg -loglevel error -y -i out/film.wav -lavfi "showspectrumpic=s=1600x400:legend=1:scale=log" out/spec.png
```

Done when the spectrogram shows every sound event at the second its visual cue happens.

### 6. Render and verify

```bash
node render.mjs film.html            # -> out/film.mp4 and out/film.wav
ffprobe -v error -show_entries stream=codec_name,nb_frames:format=duration -of compact out/film.mp4
ffmpeg -hide_banner -nostats -i out/film.mp4 -af ebur128=peak=true -f null - 2>&1 | rg '^\s+(I|Peak):'
ffmpeg -loglevel error -y -i out/film.mp4 -vf "select='not(mod(n\,80))',scale=480:-1,tile=6x2" -frames:v 1 out/mp4-sheet.png
```

Done when all of these hold:

- The video frame count equals `N` and the duration equals `DUR`.
- Integrated loudness is about -16 LUFS and the peak is at or below -0.9 dBFS.
- The sheet pulled from the encoded MP4 matches the source frames.

### 7. Report

Report:

- The MP4 path, the beats, and the checks you ran, with their numbers.
- What you could not check: the audio by ear, and live playback in a visible browser.
- The one moment you would still fix.

Mention that `film.html` also plays live in a browser: open it and click to play. `?f=N` shows a single frame.

## Reference

### Renderer contract

`render.mjs` requires `window.FILM = { W, H, FPS, N, canvas, draw(f), sheet(frames), renderAudio(), wavBase64(buf), lines, ready: true }`. It loads the page with `?render=1`, which must stop the preview player from starting.

| Flag | Output |
|---|---|
| (none) | full MP4 |
| `--grid N` | contact sheet of N evenly spaced frames |
| `--frames a,b,c` (with `--grid`) | sheet of those exact frames |
| `--only a,b` | full-size PNGs |
| `--seed S` | render with a different seed |
| `--from/--to` | a frame range |
| `--out DIR` | output folder |

The renderer blocks every non-`file:` request and lists any it blocked. Any listed request means the film depends on something outside the file: remove it. The mix passes through `loudnorm=I=-16:TP=-1.5:LRA=14` at mux time; the raw in-browser mix measured -24 LUFS. Video is H.264 `yuv420p` at CRF 14, the format X and phones require. It softens thin saturated edges a little.

### Performance

About 100 ms per frame is fine offline; 960 frames took 80 s.

- `fillStyle` strings are expensive. Precompute a quantized palette (`PAL`, 64 levels per ink blended into the background) and index it.
- Drawing one character per `fillText` call gets slow above roughly 5k calls per frame. Draw distant or small text as whole-string `fillText` calls. Go per character only where a character needs its own offset or color: waves, glints, reveals.
- The glyph grid (`gPut` with a z-priority, then one `gFlush`) settles overlaps without extra passes.
- Bloom: draw the canvas into a quarter-size canvas with `filter = 'blur(5px)'` and composite it back with `'lighter'`. Build the vignette and grain once at load, from seeded noise.

### Legibility (lessons from making the example)

- **Text-built titles over text-built backgrounds:**
  - Use at least a 350 px source font sampled into the 10×18 px grid, filled with heavy uppercase letters.
  - Add a keep-out halo: suppress background cells within 1–2 cells of the letters.
  - Dim the background to about 0.17.
- **Captions over busy text:** place them in empty regions (the sky in a sea scene) or put a gradient plate behind them that is about 0.9 opaque.
- **Full-screen flashes:** 'lighter' at no more than 0.45 alpha, with a fast decay (`exp(-age * 7)`). At 0.9 the whole frame washes out beige.
- **Implosions:** a left-aligned source collapsing to the center reads as a comet. Center the source when the implosion should read as symmetric.
- **Ground-plane text:** squash glyphs vertically by the perspective factor (clamp between 0.28 and 1.45), or distant lines overlap and near lines float apart.

### Looks

- **Typographic cinema** (the example): the glyph grid shaded by lighting or coverage. Glyph identity comes from real sentences, so paused frames are readable.
- **Risograph** (Kevin): draw three ink separations (blue, fluorescent pink, yellow), halftone each, offset them slightly, and blend with `globalCompositeOperation = 'multiply'`. Never paint color directly.
- **Hand-drawn pencil/ink:** generate stroke wobble once per drawing and hold it across that drawing's frames, changing drawings on twos. Uniform wobble on every frame reads as a filter, not drawing. The community skill `alesha-pro/tools/skills/hand-drawn-canvas-animation` covers pencil, ink, riso, screen print, and doodle finishes in depth. Fetch it when you need one of those looks.

### Environment

- The renderer needs Node 22+, Google Chrome (the path can be overridden with the `CHROME` environment variable), and ffmpeg on the `PATH`.
- System fonts are allowed because the file carries no font files. That makes output machine-dependent: Menlo and Georgia on macOS. The template's font stack falls back to DejaVu Sans Mono on Linux.
- Tested with `puppeteer-core` 25.11.0 and Chrome 153.
