---
name: scroll-scenes
description: Build scroll-driven visual essays and animated story pages (sticky scenes, CSS-var animation, per-chapter art direction). Use when someone wants a page where scrolling drives illustration, not just fade-ins.
---

# Scroll Scenes

How to build a page where the scroll bar is the timeline. Written after shipping one;
every rule here is a scar.

## 1. The thinking (do this before you touch code)

**A scene must earn its scroll.** Every scene costs the reader viewport-heights of
their life. If the scene only restages a sentence they already read, cut the scene or
cut the sentence. Never both.

**One scene, one statement.** If you can't finish "this scene says: ___" in one clause,
it's two scenes. A scene that does two things reads as neither. (Real example: a scene
that showed both "the feed drowns you in slop" *and* "these tools raise the floor for
everyone" — the reader hit the second half and asked "why is this hopeful now?" Split
it into two scenes; both landed.)

**The scene is the argument, not the decoration.** Ask what the reader can *see* that
prose can't say. Scale, accumulation, simultaneity, before/after, cause and effect over
time — those are visual. A definition is not visual; leave it in prose.

**Storyboard in one sentence per scene, in the reader's order, before building.** If the
storyboard reads like a list of pretty pictures, you have a slideshow. If it reads like
an argument, you have an essay.

**Callbacks are cheap and powerful.** If chapter 2 fanned a chip into its layers, the
finale can fan the page into its layers and the reader *feels* the rhyme. But only if the
callback carries meaning — if it's just "we know this trick," cut it.

## 2. The design process

- **Per-chapter art direction.** Each chapter gets its own palette, type treatment, and
  stylesheet, wrapped in one class (`.manga`, `.lab`, `.orb`). The page changing colour
  under the reader is the strongest signal that the subject changed. It costs one CSS
  file per chapter.
- **Draw the thing the words describe, literally.** The abstraction is the failure mode.
  If the sentence says "a feed," draw posts with avatars, handles, body lines, engagement
  rows, scrolling forever. A grid of grey rectangles is not a feed, and the reader will
  ask what they're looking at. Same for a light bulb: it needs a *stem and a screw base*,
  or it's a circle with lines.
- **Physical things must be physically plausible.** Gears must actually mesh: centre
  distance = r₁ + r₂, same tooth pitch on every gear, angular speed inverse to radius,
  direction flipping across each contact. Readers who know will see it, and it breaks
  the spell for everyone else in a way they can't articulate.
- **Label what a stranger can't name.** Every symbol on screen that isn't self-evident
  gets a one-line label in the scene's mono voice: `the idea`, `an infinite feed`,
  `still lit: the ones a person made`. Jargon is not a label — `GDT_TS vs. experiment`
  taught nobody anything; `accuracy, scored out of 100` did.
- **A number on screen must be doing honest work.** A depth counter that keeps ticking
  while the picture stops moving is a lie, and it reads as broken. Either the number
  tracks something visibly changing, or it stops.

## 3. The architecture

```
essay/
  content.tsx      # ALL prose. single source of truth.
  experience.tsx   # composition; swaps scenes for plain beats under reduced-motion
  use-scene.ts     # the driver
  <name>-scene.tsx # one per scene
  <chapter>.css    # one per art direction
```

**`content.tsx` owns every word.** Scenes import their copy from it, or at minimum the
big on-screen lines exist in it too. The moment prose lives in two places, they drift,
and a scene ends up arguing with the paragraph under it.

**Reduced motion loses the motion, never the words.** `Body({withScenes})` renders either
the scene or the plain typographic `Beat` it delivers. Same words, no animation. This is
also your fallback for anyone whose JS fails.

## 4. The driver

```ts
export function useScene<T extends HTMLElement>(frame: (p: number, el: T) => void) {
  const ref = useRef<T>(null);
  const cb = useRef(frame);
  useEffect(() => { cb.current = frame; });
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let raf = 0, last = -1;
    const paint = () => {
      const r = el.getBoundingClientRect();
      const track = r.height - window.innerHeight;
      const p = track > 0 ? clamp01(-r.top / track) : 0;   // 0..1 through the scene
      if (p !== last) { last = p; cb.current(p, el); }
    };
    const loop = () => { paint(); raf = requestAnimationFrame(loop); };
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? (raf ||= requestAnimationFrame(loop))
                                 : (cancelAnimationFrame(raf), (raf = 0))),
      { rootMargin: "50% 0px" },
    );
    paint(); io.observe(el);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, []);
  return ref;
}
```

**rAF gated by IntersectionObserver. Never a scroll listener.** iOS Safari coalesces and
withholds scroll events during momentum scrolling, so a scroll-driven scene simply stops
updating and every element sits at its CSS default — which is usually `opacity: 0`. The
bug presents as *blank scenes on a real iPhone*, and it will not reproduce in desktop
Chrome.

**The frame callback writes CSS custom properties. Nothing else.** No React state, no
re-renders, no layout reads beyond the one `getBoundingClientRect`. The stylesheet
consumes the vars.

```ts
const ref = useScene<HTMLElement>((p, el) => {
  const s = el.style;
  s.setProperty("--fold", easeIO(seg(p, 0.06, 0.34)).toFixed(4));
  s.setProperty("--seal", seg(p, 0.4, 0.48).toFixed(4));
});
```

Helpers you will use constantly: `clamp01`, `seg(p, a, b)` (remap a slice of the scroll
to 0..1), `easeIn`, `easeOut`, `easeIO`.

**Timing pattern for a thing that appears then leaves:**
`seg(p, in0, in1) * (1 - seg(p, out0, out1))`

**Staggering children:** give each a `--d` (its own delay), and let CSS do
`opacity: clamp(0, calc((var(--x) - var(--d)) * 4), 1)`. Never stagger in JS.

**Never let windows overlap when only one element may be visible.** Two clauses lit at
once print on top of each other and produce literal gibberish. If it's a slideshow of
lines, the windows must be disjoint. Check the arithmetic, don't eyeball it.

## 5. The styling

- Scene = a tall `<section>` (180vh–320vh) containing a `position: sticky` stage.
- Stack everything that must occupy the same space in one grid cell:
  `grid-area: 1 / 1`.
- Prefer `transform` and `opacity`. `will-change` only on things that move every frame.
- Scale/zoom effects: interpolate in JS if the math is exponential (a powers-of-ten
  ladder needs `Math.pow(STEP, d)`), because CSS can't `pow()`.
- Reserve one accent colour for the thing that matters. If everything glows, nothing does.
- Every scene gets a `@media (max-width: 760px)` block. Assume it's broken on mobile until
  you've looked.

## 6. The traps (each of these cost hours)

**`overflow-x` on `html`/`body` silently breaks every `position: sticky` descendant.**
Not just `hidden` — `clip` also breaks it on *shipped* iOS Safari, while working fine in
Chrome and in trunk WebKit (which is what Playwright ships, which is how it survives
testing). Carry no `overflow-x` on ancestors at all. Clip inside the scene instead.

**Next.js dev blocks cross-origin resources.** A phone on your LAN loading
`192.168.x.x:3000` gets the SSR HTML and *none of the JS*. Nothing hydrates, every scene
is blank, and there is no error on the page. The only tell is in the dev server log:
`⚠ Blocked cross-origin request to Next.js dev resource`. Fix:
`allowedDevOrigins: ["192.168.0.*"]` in `next.config.ts`. Restart required.

**A blank scene almost always means "JS never wrote the vars," not "sticky broke."**
Confirm by loading with JS disabled: if it looks identical to the bug report, it's the
driver, not the CSS.

**Raw numbers in React `style` custom properties cause hydration mismatches.** The server
and client serialize them differently. Always `String(n)` or `.toFixed(n)`. Same for raw
floats in SVG attributes — round them at authoring time.

**Children of a fading container cannot outlive the fade.** If the survivors of a flood
live inside `.tiles { opacity: var(--fade) }`, they die with everything else. Fade the
*siblings*, not the parent.

**`text-transform: uppercase` turns µ into Greek Mu.** "µm" renders as "MM". Leave unit
labels literal-cased.

**A side-view α-helix needs both a normal sine offset and an along-axis cosine offset.**
Sine alone gives you a flat zigzag. ≥7 residues per turn.

## 7. Verification (non-negotiable)

**Grepping the HTML is not verification. Looking at it is.** Shipping a page you never
looked at, and calling it done, destroys trust in one move — and you will do it, because
the code "obviously" works.

- Screenshot every scene at ~10 scroll positions (puppeteer-core + system Chrome against
  the dev server). Look at all of them.
- Test the iOS engine with **Playwright WebKit** (`devices["iPhone 14 Pro"]`). Desktop
  Chrome will not reproduce iOS bugs. It caught the sticky break and a hydration mismatch
  Chrome stayed silent about.
- To reproduce a phone-on-LAN bug, point the browser at **the LAN IP**, not localhost —
  localhost is same-origin and can never trigger it.
- If your screenshot harness returns identical frames, it is broken. Say so out loud
  instead of reporting "looks good."

## 8. Interaction, if you earn it

The best ending we shipped: the final scene is a blank page, and once it is more than half
on screen, an IntersectionObserver arms a `keydown` listener. The first character the
reader types focuses a hidden `<textarea>`, inserts that character, and the page becomes
theirs. The essay ends by handing over the caret.

Rules if you do this:
- Use a real `<textarea>`, not a fake surface. You get selection, backspace, arrow keys,
  Enter, and a mobile keyboard on tap, for free.
- Never swallow modifier combos (⌘R, ⌘L, ⌘T). Check `metaKey || ctrlKey || altKey` and bail.
- `pointer-events: none` until the scene is live, or it steals clicks from scenes above it.
- One hint, small, that disappears the moment they start.

## 9. Ambient motion vs scroll motion

Two clocks are allowed, and they mean different things:
- **Scroll-driven** = the argument advancing. The reader controls it.
- **Time-driven CSS keyframes** = the world being alive (a droplet falling on a 1.15s loop,
  stars twinkling). Ambient only. Never put a *fact* on a time loop, because the reader
  will scroll back and it will have moved.

## 10. When you cut, cut the CSS too

Deleting a scene element and leaving its stylesheet rules behind is how a codebase rots in
one session. If `.sg-verdict` is gone from the TSX, its rules and its mobile overrides go
too. Same for now-unused JS constants and imports — the linter will tell you; listen.

## 11. Commit before you're proud of it

The essay directory sat untracked for an entire session. Mid-session the content file was
truncated mid-word by an editor accident, and chapters 4 through 7 were unrecoverable —
not in git, not in the build cache, not in a backup. Everything after that was rebuilt from
memory. **Commit the scaffold the hour it exists.** Perfectionism is not a backup strategy.

## 12. Scroll budget

Readers complain past roughly 40 viewport-heights. Keep a scene's sticky track to 2–3
viewports, not 4–5. Give mouse users an escape hatch: a fixed chapter rail whose pads are
clickable jumps. Cutting a scene is always an option, and usually the right one.
