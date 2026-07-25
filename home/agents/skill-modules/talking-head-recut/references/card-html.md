# Card HTML contract (step 8)

Create `$WORK_DIR/public/cards/{card-id}.html` for each card. Each file
contains a single rooted HTML fragment that follows this contract:

#### Card HTML Contract

```html
<div class="card" data-card-id="{cardId}">
  <style>
    /* MUST: every rule starts with .card[data-card-id="{cardId}"] */
    .card[data-card-id="card-01"] .root {
      width: 100%; height: 100%;
      display: flex; ...;
      font-family: 'Caveat', 'LXGW WenKai TC', serif;
      color: var(--text);
      background: var(--bg);
    }
    .card[data-card-id="card-01"] .title { font-size: 84px; ... }
  </style>

  <div class="root">
    <h1
      id="card-01-title"
      data-anim="kinetic-chars"
      data-anim-at="0.3"
      data-anim-duration="0.5"
      data-anim-stagger="0.04"
      data-anim-pattern="pop"
    >
      <span class="char">S</span>
      <span class="char">u</span>
    </h1>
    <div
      id="card-01-line"
      data-anim="grow-x"
      data-anim-at="0.65"
      data-anim-duration="0.5"
      data-anim-target-w="420"
      style="width:0;height:8px;background:var(--accent-0);border-radius:4px;"
    ></div>
  </div>
</div>
```

**Hard rules** (`hyperframes` lint will reject violations):

- Single root `<div class="card" data-card-id="{cardId}">`
- Inline `<style>` rules MUST be prefixed with the scope selector above
- **No `<script>` tags**
- **No external URLs** in `src=` / `href=` (no CDN, no remote fonts)
- **No inline event handlers** (`onclick=` etc.)
- All assets via relative paths into the same `public/` directory
- Colors via `var(--accent-N)` etc. for portability across themes

**Animations are declared, not coded.** Use `data-anim-*` attributes
only; never write `<script>` to animate. You compile every `data-anim-*`
declaration into the single master GSAP timeline in Step 9.

#### Card Sizing — Mobile-First in Portrait

The 10 `references/styles/*.html` are sized for a **1920×1080 landscape**
preview. When `storyboard.layout = "portrait"` (1080×1920, the dominant
case for social / mobile), **scale every visual size up** — phones hold
the screen close, and the same pixel count reads smaller than on a
landscape TV-style canvas.

| token                     | landscape baseline | **portrait target** | scale         |
| ------------------------- | ------------------ | ------------------- | ------------- |
| title (h1/h2 hero)        | 64–96px            | **88–132px**        | ×1.35         |
| detail / body             | 24–30px            | **30–40px**         | ×1.30         |
| kicker / chip label       | 14–16px            | **18–22px**         | ×1.30         |
| timecode / meta           | 12–14px            | **16–18px**         | ×1.30         |
| data block primary number | 48–60px            | **64–88px**         | ×1.40         |
| line-height multiplier    | 1.05–1.5           | same                | (don't scale) |

**Rule of thumb:** `portraitPx = round(landscapePx × 1.3)`, then floor
to a nearby 4px multiple for visual rhythm. Hero headlines may go up to
×1.4; small meta text stays at ×1.2 to avoid crowding.

Padding **shrinks slightly** in portrait — the card is narrower so big
landscape padding (40–64px) eats too much width. Use 24–36px horizontal
padding in portrait.

If you're producing a single card that must work in **both** layouts,
prefer a `@container` query on the card root over hard-coding sizes:

```css
.card[data-card-id="X"] .root {
  container-type: inline-size;
}
.card[data-card-id="X"] .title {
  font-size: clamp(64px, 8.5cqi, 132px);
}
.card[data-card-id="X"] .detail {
  font-size: clamp(24px, 3.2cqi, 40px);
}
```

But for most cards, a single layout choice is fine — just pick the size
table column that matches the storyboard's `layout` field.

#### Available `data-anim` Kinds

| kind            | use for             | key params                                                                                      |
| --------------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| `fade-in`       | enter               | `at`, `duration`, `ease?`                                                                       |
| `fade-out`      | exit                | `at`, `duration`, `ease?`                                                                       |
| `slide-in`      | slide enter         | `at`, `duration`, `from=left\|right\|top\|bottom`, `distance`                                   |
| `kinetic-chars` | per-char pop        | `at`, `duration`, `stagger`, `pattern=pop\|fade` — element needs `<span class="char">` children |
| `typewriter`    | per-char fade       | same as kinetic-chars but slower default stagger                                                |
| `count-up`      | animate number      | `at`, `duration`, `from`, `to`, `format=.0f\|.1f\|.2f\|,d`                                      |
| `draw-path`     | SVG path reveal     | `at`, `duration` — element should be a `<path>`                                                 |
| `grow-y`        | bar height          | `at`, `duration`, `target-h` (px) — element starts `height:0`                                   |
| `grow-x`        | bar width           | `at`, `duration`, `target-w` (px) — element starts `width:0`                                    |
| `scale-pop`     | pop entrance        | `at`, `duration`                                                                                |
| `blur-in`       | unfocused → focused | `at`, `duration`                                                                                |
| `mask-reveal`   | clip reveal         | `at`, `duration`, `direction=left\|right\|top\|bottom`                                          |
| `morph-to`      | tween any CSS       | `at`, `duration`, `props='{...JSON...}'`                                                        |

`data-anim-at` is **seconds relative to the card's startSec** — when you
compile each declaration into the GSAP timeline in Step 9, add the
card's `startSec` to get the absolute time and quantize to 1/fps.

