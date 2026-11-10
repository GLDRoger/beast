---
name: frontend
description: Use when the work changes anything a user will look at in a product, such as pages, components, layouts, styling, UI states, or a small visual fix. Load the design modules it lists only when a specific look is asked for, and use motion when animation is the main change.
---

# Frontend

Start from the existing product, audience, workflow, brand, and requested change. Infer routine choices from available context; ask only when a missing decision would change the result materially. A small UI fix does not need a brief, a design plan, or a brand interview.

## Ground the design in the subject

When the visual direction is open (a new page, product, or redesign), first name the concrete subject, the audience, and the design's main job, using the request, the repository, and anything known about the user. State that reading in one line and proceed. Distinctive choices come from the subject's industry, materials, and vocabulary: a toy for eight-year-olds and a dashboard for financial analysts should not look alike. Build with real content; when none is given, write realistic copy rather than lorem ipsum. Third-party logos come from the brand's own SVG or `simple-icons`, never a placeholder or a redrawn imitation.

## Design and build

- Make the important action and information hierarchy clear. Carry one visual direction through typography, spacing, color, shape, copy, and interaction.
- Preserve the existing design system unless changing it is part of the request. Where the brief or product sets a direction, follow it exactly, even when it is one of the defaults listed below.
- Spend boldness in one place. Let one element be the memorable thing, keep everything around it quiet, and cut decoration that does not serve the brief. Before finishing, look for an accessory that adds nothing and remove it; if every element earns its place, leave the design as it is.
- Typography carries the personality. Use one family, or two that are clearly distinct, chosen for this subject rather than the family you would reach for on any project. Set a clear type scale with deliberate weights and spacing. Keep body lines under about 80 characters, and give serif body text slightly more line height than sans.
- Structure is information. Borders, dividers, numbering, eyebrows, and labels should say something about the content, not decorate it. Number items only when they really are a sequence.
- Keep frequent feedback fast and restrained. Motion that answers a person's action should show what changed. For motion nobody triggered, one orchestrated moment beats a fade-up on every section and a hover effect on every card. Never hide content until an animation runs, and honor reduced motion.
- Build the primary workflow and its applicable loading, empty, error, success, disabled, focus, keyboard, and responsive states. Consider awkward content, overflow, localization, and stale data.
- Reuse meaningful components, patterns, and the project's icon set. Remove directly superseded UI within scope; do not use visual cleanup as permission for an unrelated redesign.
- Watch CSS specificity: section-level and component-level rules easily cancel each other, especially padding and margin between sections.

## Defaults that read as generated

Each of these suits some brief, but they appear whatever the subject, so they are defaults rather than choices. Use one only when the brief asks for it or the subject clearly calls for it:

- A warm cream background with a high-contrast serif display and a terracotta accent (often near `#D97757`, Claude's own interface accent).
- Near-black with a single acid-green or vermilion accent, or a tinted near-black (`#0B0B0B`, `#111`) standing in for black.
- A broadsheet layout: hairline rules, zero radius, dense newspaper columns.
- The SaaS card kit: content cut into identical rounded cards, one radius on everything, the same soft grey shadow under each, gradient washes, purple gradients, gradient text.
- Template chrome: a tracked all-caps eyebrow above every heading, `A · B · C` meta strings, `WORD — fragment` labels, monospace for small data labels, `→` appended to links and buttons, one headline word set apart in italic or color, `01 / 02 / 03` on content that is not a sequence.
- A colored accent border down the left of cards or callouts, fake browser or app windows framing content, hand-drawn SVG icons, and the hero made of a big number, a small label, supporting stats, and a gradient accent.

## New visual direction: plan, check, build

When the direction is free, plan before writing code:

- **Color:** 4–6 named hex values.
- **Type:** the typefaces and their roles.
- **Layout:** the concept in a sentence plus an ASCII wireframe, including alignment.
- **Principles:** what makes this design specific to this subject.

Then check the plan. Any part you would produce for any similar prompt gets revised; say what changed and why. Build to the revised plan. On the web, open with the most characteristic thing in the subject's world, in whatever form suits it: a headline, an image, a live demo, an interactive moment.

## Words

Copy is design content and can make a page feel as templated as its layout. Write from the user's side, naming things as users understand them: they manage notifications, not webhook config. Buttons say what happens ("Save changes", not "Submit"), and an action keeps its name through the flow ("Publish" leads to "Published"). Errors say what went wrong and how to fix it, without apology or vagueness; empty states point to the next action. Use sentence case and plain verbs, with no filler and no selling.

## Verify

Inspect the rendered result at narrow and wide viewports when layout can change, and critique screenshots as you build, not only at the end. Exercise the important path and relevant edge states. Meet the quality floor without announcing it: responsive down to mobile, visible keyboard focus, readable contrast, touch targets about 44px with padding inside the clickable area, reduced motion respected. A source search, a screenshot of one static state, or a successful build alone does not prove the workflow.

For a critique, rank concrete problems and recommend what to ship, revise, or remove. Keep it read-only unless changes were requested. For an authorized build, resolve relevant critique findings before finishing rather than handing them back as a new task.

## Optional specialists

- Generic/synthetic design or copy: `~/.agents/skill-modules/unslop/SKILL.md` (visual mode)
- Interaction feel: `~/.agents/skill-modules/taste-craft/SKILL.md`
- Substantial motion: `~/.agents/skills/motion/SKILL.md`
- 3D, WebGL, or shader scenes: `~/.agents/skill-modules/3d-scenes/SKILL.md`
- Extracting or porting a shader or canvas effect from a live page: `~/.agents/skill-modules/web-shader-extractor/SKILL.md`
- UI language: `~/.agents/skill-modules/app-copy/SKILL.md`
- Specific requested aesthetic: `~/.agents/skill-modules/apple-design/SKILL.md`, `~/.agents/skill-modules/redesign-skill/SKILL.md`, `~/.agents/skill-modules/tushar-design/SKILL.md`, or `~/.agents/skill-modules/compact-landing/SKILL.md`
- Streaming, pricing, credits, or email workflows: load the corresponding specialist only when implementing that feature.

These are available methods, not mandatory stages. Use the code, performance, or security workflow when that domain is the main problem.
