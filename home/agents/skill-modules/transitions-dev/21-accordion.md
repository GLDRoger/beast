# Accordion expand

## When to use

A disclosure / accordion / collapsible section whose panel grows and shrinks in height when toggled, with the header chevron flipping between a downward "v" and an upward "^". Use for settings groups, FAQs, filter sections, "show more" details — any header + collapsible body.

Height animates via `grid-template-rows: 0fr ↔ 1fr`, so there's **no JS height measuring** and content of any size animates cleanly. The chevron rotates 180° to flip the "v" into a "^".

## HTML usage

```html
<div class="t-acc" data-open="false">
  <button class="t-acc-head" aria-expanded="false">
    Title
    <span class="t-acc-chevron">
      <svg viewBox="0 0 16 16"><path d="M4 6.5L8 10.5L12 6.5"/></svg>
    </span>
  </button>
  <div class="t-acc-panel"><div class="t-acc-panel-inner"> … </div></div>
</div>
```

Toggle `data-open` on the item. The panel animates via
grid-template-rows 0fr ↔ 1fr (no JS height measuring) and
the chevron rotates 180° to flip the "v" into a "^".

## Tunable variables

| Variable | Default | Notes |
| --- | --- | --- |
| `--acc-expand` | `250ms` | sourced from `--p21-expand-dur` |
| `--acc-collapse` | `250ms` | sourced from `--p21-collapse-dur` |
| `--acc-chevron` | `250ms` | sourced from `--p21-chevron-dur` |
| `--acc-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` | sourced from `--p21-ease` |

The `:root` defaults below match the live tuning on [transitions.dev](https://transitions.dev). Drop them into your global stylesheet once — every transition in this skill reads from semantic names like these, so multiple transitions can share a single `:root` block.

```css
:root {
  --acc-expand: 250ms;
  --acc-collapse: 250ms;
  --acc-chevron: 250ms;
  --acc-ease: cubic-bezier(0.22, 1, 0.36, 1);
}
```

## CSS

```css
/* grid-template-rows 0fr → 1fr gives a clean height animation
   with no JS measurement; the inner element clips overflow. */
.t-acc-panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--acc-collapse) var(--acc-ease);
}
.t-acc[data-open="true"] .t-acc-panel {
  grid-template-rows: 1fr;
  transition: grid-template-rows var(--acc-expand) var(--acc-ease);
}
.t-acc-panel-inner {
  overflow: hidden;
  opacity: 0;
  filter: blur(2px);
  transition:
    opacity var(--acc-collapse) var(--acc-ease),
    filter var(--acc-collapse) var(--acc-ease);
}
.t-acc[data-open="true"] .t-acc-panel-inner {
  opacity: 1;
  filter: blur(0);
  transition:
    opacity var(--acc-expand) var(--acc-ease),
    filter var(--acc-expand) var(--acc-ease);
}
/* Rotate the chevron 180° to flip the "v" into a "^".
   Rotation animates in every browser, unlike CSS `d:` path
   morphing (Chromium only) — so it works on mobile Safari. */
.t-acc-chevron {
  display: inline-flex;
  transform: rotate(0deg);
  transform-origin: center;
  transition: transform var(--acc-chevron) var(--acc-ease);
}
.t-acc[data-open="true"] .t-acc-chevron {
  transform: rotate(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .t-acc-panel, .t-acc-panel-inner, .t-acc-chevron {
    transition: none !important;
  }
}
```

The `@media (prefers-reduced-motion: reduce)` guard at the bottom of the snippet is required — keep it. It zeroes the transition for users who have asked for less motion at the OS level.

## JavaScript orchestration

```js
// Toggle data-open on the item; CSS owns the height + chevron morph.
const acc = document.querySelector(".t-acc");
const head = acc.querySelector(".t-acc-head");

head.addEventListener("click", () => {
  const open = acc.getAttribute("data-open") === "true";
  acc.setAttribute("data-open", String(!open));
  head.setAttribute("aria-expanded", String(!open));
});
```

### Two-element panel + padding placement

The panel needs the two-element structure (`.t-acc-panel` grid track + `.t-acc-panel-inner` with `overflow: hidden`). The `0fr → 1fr` track can only collapse a child that clips its own overflow. Keep padding on `.t-acc-panel-inner`, never on `.t-acc-panel` — padding on the `0fr` track leaves a residual height strip so the panel never fully closes.

### Why the chevron rotates instead of morphing its path

It's tempting to morph the chevron's SVG `d` between a "v" and a "^", but CSS `d:` path interpolation is **Chromium-only** — on mobile Safari and Firefox it snaps (or doesn't move at all). Rotating the whole chevron 180° is visually identical for a symmetric glyph and animates in every browser, so that's what the snippet ships.

