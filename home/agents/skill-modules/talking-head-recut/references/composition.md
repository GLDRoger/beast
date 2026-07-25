# Composition assembly (step 9)

Stage the assets and write `$WORK_DIR/public/index.html`:

```bash
# SKILL_DIR is injected by the host ("Base directory for this skill: …")
SKILL_DIR="<SKILL_DIR>"

mkdir -p "$WORK_DIR/public/fonts" "$WORK_DIR/public/vendor" "$WORK_DIR/public/cards"
cp -n "$SKILL_DIR/assets/fonts/"*            "$WORK_DIR/public/fonts/"
cp -n "$SKILL_DIR/assets/vendor/gsap.min.js" "$WORK_DIR/public/vendor/"
# stage the input video — RE-ENCODE with dense keyframes. Sources with a sparse GOP
# (keyframe interval > ~1s) freeze on seek in the renderer (a frozen frame under the
# overlays); -g / -keyint_min set to your composition fps make every frame seekable.
# (Set both to your fps — 30 shown; use 24/25/60 to match.)
ffmpeg -y -i "$VIDEO_PATH" -c:v libx264 -crf 18 -g 30 -keyint_min 30 \
  -pix_fmt yuv420p -movflags +faststart -c:a aac "$WORK_DIR/public/input-video.mp4"
```

#### Composition Template

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      @font-face {
        font-family: "Caveat";
        src: url("fonts/Caveat-400-latin.woff2") format("woff2");
        font-weight: 400;
        font-display: block;
      }
      @font-face {
        font-family: "Caveat";
        src: url("fonts/Caveat-700-latin.woff2") format("woff2");
        font-weight: 700;
        font-display: block;
      }
      @font-face {
        font-family: "LXGW WenKai TC";
        src: url("fonts/LXGWWenKaiTC-400-latin.woff2") format("woff2");
        font-weight: 400;
        font-display: block;
      }
      @font-face {
        font-family: "Inter";
        src: url("fonts/Inter-400-latin.woff2") format("woff2");
        font-weight: 400;
        font-display: block;
      }
      @font-face {
        font-family: "Inter";
        src: url("fonts/Inter-700-latin.woff2") format("woff2");
        font-weight: 700;
        font-display: block;
      }
      @font-face {
        font-family: "Virgil";
        src: url("fonts/Virgil.woff2") format("woff2");
        font-display: block;
      }

      :root {
        /* Pick from the themeId palette table in Step 7 — example: classic */
        --bg: #fff9e3;
        --text: #1e1e1e;
        --accent-0: #1971c2;
        --accent-1: #e03131;
        --accent-2: #2f9e44;
        --accent-3: #e8590c;
        --accent-4: #9c36b5;
        --font-family: "Caveat", "LXGW WenKai TC", serif;
      }
      * {
        box-sizing: border-box;
      }
      /* Body font-family MUST list concrete font names (not just var(--font-family)) —
   the HyperFrames renderer's static analyzer doesn't expand CSS variables when
   resolving fonts, so a var-only chain triggers `font_family_without_font_face`
   lint and falls back to a generic. Use the concrete chain here; cards that
   want the theme font can still reference var(--font-family) internally. */
      html,
      body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #000;
        font-family: "Inter", "Caveat", "LXGW WenKai TC", ui-sans-serif, system-ui, sans-serif;
      }
      #stage {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      /* video-wrapper holds the source video. Its position / size are animated
   over time by the master timeline (one tween per layout transition). */
      .video-wrapper {
        position: absolute;
        left: 0;
        top: 0;
        width: 1920px;
        height: 1080px;
        overflow: hidden;
        border-radius: 0;
        box-shadow: none;
      }
      .video-wrapper video {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .card-host {
        position: absolute;
        pointer-events: none;
        overflow: hidden;
      }
      .card-host .card {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      .card-host .char {
        display: inline-block;
        visibility: visible;
      }

      /* Subtle drop shadow + rounded corners for non-fullscreen video framings */
      .video-wrapper.framed {
        border-radius: 16px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
      }
    </style>
  </head>
  <body>
    <div
      id="stage"
      data-composition-id="talking-head-recut"
      data-start="0"
      data-duration="121.2"
      data-fps="30"
      data-width="1920"
      data-height="1080"
    >
      <!-- Layer 1: source video — initial position matches card-01's layout -->
      <div class="video-wrapper" id="video-wrap">
        <video
          id="bg-video"
          src="input-video.mp4"
          muted
          playsinline
          data-start="0"
          data-duration="121.2"
          data-track-index="1"
        ></video>
      </div>
      <!-- Preserve the source program audio while the visual video stays muted. -->
      <audio
        id="source-audio"
        src="input-video.mp4"
        data-start="0"
        data-duration="121.2"
        data-track-index="10"
        data-volume="1"
      ></audio>

      <!-- Layer 2: each card-host sits at the bounds dictated by its layout. -->
      <!-- IMPORTANT: every card-host MUST carry BOTH "card-host" and "clip" classes. -->
      <!--   - "card-host"  → our positioning + pointer-events styles                 -->
      <!--   - "clip"       → HyperFrames runtime uses this to enforce visibility     -->
      <!--                    only during data-start … data-start+data-duration.      -->
      <!--                    Without "clip" the host stays visible the whole video   -->
      <!--                    (lint: timed_element_missing_clip_class).               -->
      <!-- Example: card-01 with zone="fullscreen" → card-host covers (0,0,1920,1080) -->
      <div
        class="card-host clip"
        data-card-id="card-01"
        data-start="1.0000"
        data-duration="6.5000"
        data-track-index="2"
        style="left:0;top:0;width:1920px;height:1080px;visibility:hidden;opacity:0;"
      >
        <!-- paste the contents of public/cards/card-01.html here -->
      </div>

      <!-- Example: card-02 with zone="side-panel" (split composition layout) → card on left half -->
      <div
        class="card-host clip"
        data-card-id="card-02"
        data-start="8.0000"
        data-duration="12.0000"
        data-track-index="2"
        style="left:0;top:0;width:960px;height:1080px;visibility:hidden;opacity:0;"
      >
        <!-- card-02 HTML -->
      </div>

      <!-- ...one "card-host clip" per card with inline bounds matching resolveZoneBounds(card.zone)... -->

      <script src="vendor/gsap.min.js"></script>
      <script>
        (function () {
          // count-up formatter helper
          window.__fmt = function (v, fmt) {
            if (typeof fmt === "string" && /^\.[0-9]+f$/.test(fmt)) {
              return Number(v).toFixed(Number(fmt.slice(1, -1)));
            }
            if (fmt === ",d") return Math.round(v).toLocaleString();
            return String(Math.round(v));
          };

          const tl = window.gsap.timeline({ paused: true });

          // ── Card lifecycle (one block per card) ──
          // Example for card-01 [1.0, 7.5] with kinetic-chars at +0.3, grow-x at +0.65:

          // Enter (fade in over 0.4s)
          tl.set('.card-host[data-card-id="card-01"]', { visibility: "visible" }, 1.0);
          tl.fromTo(
            '.card-host[data-card-id="card-01"]',
            { opacity: 0 },
            { opacity: 1, duration: 0.4, ease: "power2.out" },
            1.0,
          );

          // Card-internal anims (compile each data-anim-* declaration here)
          tl.from(
            '.card[data-card-id="card-01"] #card-01-title .char',
            { opacity: 0, y: 8, scale: 0.8, duration: 0.5, ease: "power2.out", stagger: 0.04 },
            1.3,
          );
          tl.fromTo(
            '.card[data-card-id="card-01"] #card-01-line',
            { width: 0 },
            { width: 420, duration: 0.5, ease: "power2.out" },
            1.65,
          );

          // Exit (fade out over 0.35s, ending at endSec)
          tl.to(
            '.card-host[data-card-id="card-01"]',
            { opacity: 0, duration: 0.35, ease: "power2.in" },
            7.15,
          );
          tl.set('.card-host[data-card-id="card-01"]', { visibility: "hidden" }, 7.5);

          // ── Video framing transitions ──
          // When the next card uses a different composition layout, animate the
          // video-wrapper to its new bounds. Example: card-01 = fullscreen
          // (video hidden behind), card-02 = split composition (zone="side-panel"
          // → video on right, card on left).

          // Card-02 enters at 8.0s with the split composition. Animate video to
          // the right half during the card-01 → card-02 gap (between 7.5 and 8.0s).
          tl.set("#video-wrap", { className: "video-wrapper framed" }, 7.5);
          tl.to(
            "#video-wrap",
            { left: 960, top: 0, width: 960, height: 1080, duration: 0.6, ease: "power2.inOut" },
            7.5,
          );

          // Card-02 enter — same pattern as card-01
          tl.set('.card-host[data-card-id="card-02"]', { visibility: "visible" }, 8.0);
          tl.fromTo(
            '.card-host[data-card-id="card-02"]',
            { opacity: 0 },
            { opacity: 1, duration: 0.4, ease: "power2.out" },
            8.0,
          );
          // ...card-02 internal anims...

          // ── repeat for each card; if the NEXT card's layout differs,
          //    insert another tl.to('#video-wrap', ...) tween before its enter ──

          window.__timelines = window.__timelines || {};
          window.__timelines["talking-head-recut"] = tl;
        })();
      </script>
    </div>
  </body>
</html>
```

#### GSAP Statement Cheat Sheet

Compile each `data-anim` attribute into a GSAP statement. Times are
**absolute seconds** = card.startSec + data-anim-at, quantized to 1/fps.
Selector is `.card[data-card-id="X"] #elementId`.

| data-anim                       | GSAP statement template                                                                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `fade-in`                       | `tl.fromTo(SEL, { opacity: 0 }, { opacity: 1, duration: D, ease: 'power2.out' }, T);`                                                                                                                              |
| `fade-out`                      | `tl.to(SEL, { opacity: 0, duration: D, ease: 'power2.in' }, T);`                                                                                                                                                   |
| `slide-in` (from=left, dist=80) | `tl.fromTo(SEL, { opacity: 0, x: -80 }, { opacity: 1, x: 0, duration: D, ease: 'power2.out' }, T);`                                                                                                                |
| `kinetic-chars` (pop)           | `tl.from(SEL + ' .char', { opacity: 0, y: 8, scale: 0.8, duration: D, ease: 'power2.out', stagger: S }, T);`                                                                                                       |
| `count-up`                      | `(function(){const o={v:FROM};tl.to(o,{v:TO,duration:D,ease:'power2.out',onUpdate:function(){const el=document.querySelector(SEL);if(el)el.textContent=__fmt(o.v,'FMT');}},T);})();`                               |
| `draw-path`                     | `(function(){const el=document.querySelector(SEL);if(el){const L=el.getTotalLength();tl.set(SEL,{strokeDasharray:L,strokeDashoffset:L},T);tl.to(SEL,{strokeDashoffset:0,duration:D,ease:'power2.inOut'},T);}})();` |
| `grow-x` (target-w=W)           | `tl.fromTo(SEL, { width: 0 }, { width: W, duration: D, ease: 'power2.out' }, T);`                                                                                                                                  |
| `grow-y` (target-h=H)           | `tl.fromTo(SEL, { height: 0 }, { height: H, duration: D, ease: 'power2.out' }, T);`                                                                                                                                |
| `scale-pop`                     | `tl.fromTo(SEL, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: D, ease: 'back.out(1.6)' }, T);`                                                                                                     |
| `mask-reveal` (direction=left)  | `tl.fromTo(SEL, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)', duration: D, ease: 'power2.inOut' }, T);`                                                                                         |

Quantize: `T = Math.round(absSec * fps) / fps`. At 30fps the smallest
step is `1/30 ≈ 0.0333s`; rounding to 4 decimals (`.toFixed(4)`) is fine
inside the JS literal.

#### Video Framing Reference (per `layout` value)

The selector for the video container is `#video-wrap`. Animate its
bounds between cards using `tl.to('#video-wrap', { ...bounds }, T)`.
Initial bounds should be set inline on the element to match card-01's
layout. Pick a transition duration of 0.5–0.7s with `ease: 'power2.inOut'`.

**Decorative frames** (`clean` / `hairline` / `polaroid`) sit as a
**sibling** of `#video-wrap` and follow it through layout transitions.
See
[`references/frames/`](references/frames/) for each frame's placement
HTML, suggested CSS, and which layouts it pairs with. Quick rule:
`overlay` layout suppresses decorative frames (the full-bleed video
clashes with chrome); PiP layouts already have their own pill treatment
(border-radius + white ring + shadow), so add a decorative frame only on
top of `split` / `stack`.

**GSAP target lookup table** for `#video-wrap` per composition layout
(landscape 1920×1080 — for portrait & 4:5 see `references/layouts/*.html`
which list all three ratios):

| composition layout                   | typical card.zone | `#video-wrap` GSAP target                                                 | extra css class                            |
| ------------------------------------ | ----------------- | ------------------------------------------------------------------------- | ------------------------------------------ |
| `split`                              | `side-panel`      | `{ left: 960, top: 0, width: 960, height: 1080 }`                         | —                                          |
| `stack`                              | `lower-third`     | `{ left: 14, top: 14, width: 1892, height: 548 }` (top 52%)               | —                                          |
| `pip` (bottom-right)                 | `fullscreen`      | `{ left: 1480, top: 760, width: 400, height: 300 }`                       | `pip-pill` (border-radius + ring + shadow) |
| `pip` (top-left)                     | `fullscreen`      | `{ left: 40, top: 40, width: 400, height: 300 }`                          | `pip-pill`                                 |
| `overlay` (video full-bleed)         | `video-overlay`   | `{ left: 0, top: 0, width: 1920, height: 1080 }` (no change from default) | —                                          |
| **hide video** (pure-graphic moment) | `fullscreen`      | `{ opacity: 0 }` (or move off-canvas)                                     | —                                          |

To toggle the pip-pill chrome (border-radius + white ring + drop shadow)
when entering or leaving a pip moment:

```js
// Enter pip — add chrome
tl.set("#video-wrap", { className: "video-wrapper pip-pill" }, T);
tl.to(
  "#video-wrap",
  { left: 1480, top: 760, width: 400, height: 300, duration: 0.6, ease: "power2.inOut" },
  T,
);

// Leave pip — back to clean full-bleed
tl.set("#video-wrap", { className: "video-wrapper" }, T_NEXT);
tl.to(
  "#video-wrap",
  { left: 0, top: 0, width: 1920, height: 1080, duration: 0.6, ease: "power2.inOut" },
  T_NEXT,
);
```

**Card-host bounds match the zone**. Resolve the card's `zone` into
pixel bounds using the table at the top of Step 6, then write those
into the card-host's inline `style="left:Xpx;top:Ypx;width:Wpx;
height:Hpx;..."`. For `video-overlay` zone (overlay recipe), the
card-host fills the full canvas — your CSS inside `.card .root`
decides where the actual visible card sits.

#### HyperFrames Layout / Animation QA Rules

- Build each card's static hero frame first: the moment where the card is fully visible and readable.
- Confirm video, cards, subtitles/captions, and diagrams do not unintentionally overlap.
- Confirm hidden video areas are clipped by the frame and not visible outside intended bounds.
- Register one paused master timeline as `window.__timelines["talking-head-recut"]`.
- Build timelines synchronously at page load; no `async`, `setTimeout`, Promises, or media `play()` calls.
- Do not use `Math.random()` or `Date.now()` in render paths.
- Do not use `repeat: -1`; calculate finite repeats from the video duration.
- Prefer GSAP transforms and opacity (`x`, `y`, `scale`, `rotation`, `opacity`) over layout properties (`top`, `left`, `width`, `height`) for motion.
- Animate wrappers such as `#video-wrap`, not the video element dimensions directly.
- Avoid animating the same property on the same element from multiple timelines at the same time.
- Use `data-track-index`, not `data-layer`; use `data-duration`, not `data-end`.
- Every timed element (`card-host`, sub-composition, etc.) MUST include `class="clip"` alongside its own classes — e.g. `class="card-host clip"`. The HyperFrames runtime uses `.clip` to gate visibility to the `data-start … data-start+data-duration` window. Without it the element is visible for the whole video (lint: `timed_element_missing_clip_class`).
- For body / global `font-family`, list **concrete font names** (`'Inter', 'Caveat', …`) — not a CSS variable like `var(--font-family)`. The HyperFrames font resolver doesn't expand CSS vars during static analysis (lint: `font_family_without_font_face`). Cards may still use `var(--font-family)` internally since their `@font-face` declarations are loaded.

