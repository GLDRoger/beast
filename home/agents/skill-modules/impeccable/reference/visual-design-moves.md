# Visual Design Moves

Use this reference when `$impeccable` is improving an existing interface and the work calls for a focused visual move: arrange, typeset, colorize, amplify, quiet, delight, distill, polish, or normalize. These are not separate design processes; they are lenses inside the same craft workflow.

## Universal gate

Before choosing a move, answer four questions:

- What user behavior must become easier, faster, clearer, or more trustworthy?
- Which element is the primary action or primary understanding point?
- What is blocking progress: unclear hierarchy, excess choice, weak affordance, low confidence, or visual monotony?
- Are defaults, framing, or visual emphasis pushing users toward a decision they do not have enough context to make?

Pick the smallest set of moves that fixes the behavior. Do not add decoration just because a lens is available.

## Arrange: layout, spacing, rhythm

Use when the interface feels crowded, monotonous, misaligned, or visually flat.

- Establish a clear first, second, and third read. The squint test should reveal the same hierarchy the product intends.
- Group related elements tightly; separate groups generously. Same-size gaps everywhere create dead rhythm.
- Prefer clear grid structure with intentional asymmetry over repeated centered card rows.
- Match density to task: dashboards and data tools can be tighter; marketing, onboarding, and explanatory surfaces need more air.
- Fix optical alignment, not only mathematical alignment. Icons, badges, and cards often need small visual offsets.

Avoid: identical feature-card grids, card-in-card nesting, arbitrary margins, everything centered, and whitespace that has no hierarchy job.

## Typeset: typography and readability

Use when text feels generic, hard to scan, poorly weighted, or visually inconsistent.

- Use fewer sizes with stronger contrast; muddy 14/15/16px ladders create weak hierarchy.
- Keep body line length around 45-75 characters and raise line-height when text is light-on-dark.
- Choose typefaces from brand context, not reflex. Reject generic defaults and overused “distinctive” defaults.
- Use weights intentionally: regular for reading, semibold for labels/actions, heavier only for true emphasis.
- Use tabular numbers for data, prices, metrics, or aligned comparisons.
- Balance or pretty-wrap headings and marketing copy to avoid orphaned words and awkward last lines.

Avoid: one font for everything, arbitrary weights, excessive all-caps, decorative monospace, and tiny body text.

## Colorize: purposeful color

Use when an interface is too gray, lacks emotional warmth, or needs stronger wayfinding.

- Assign every color a job: semantic state, hierarchy, categorization, wayfinding, brand tone, or rare delight.
- Use accents sparingly. One confident accent beats several timid accents.
- Tint neutrals toward the brand hue for cohesion; use OKLCH when creating new palettes.
- Preserve accessibility first: contrast, focus states, color-blind-safe distinctions, and non-color indicators.
- Separate semantic colors from brand colors so errors, warnings, success, and info states stay predictable.

Avoid: rainbow palettes, cyan/purple AI gradients, gray text on colored backgrounds, color with no behavioral purpose, and pure black/white surfaces.

## Bolder: amplify safe or generic design

Use when the design is competent but forgettable, timid, or too template-like.

- Pick one hero moment and make it memorable; do not amplify every element.
- Increase contrast between important and supporting content: scale, weight, spacing, shape, imagery, or motion.
- Choose a specific personality lane: editorial, industrial, playful, luxurious, technical, handmade, etc.
- Use asymmetry, richer composition, stronger typography, and purposeful visual motifs before reaching for effects.
- Keep usability intact: boldness should make the primary behavior clearer, not harder.

Avoid: louder gradients, neon-on-dark, glassmorphism, glow borders, generic metric heroes, and random “wow” effects.

## Quieter: reduce overstimulation

Use when the design feels loud, aggressive, garish, visually competitive, or tiring.

- Preserve one or two strong moments and let everything else recede.
- Reduce saturation, shadow intensity, border contrast, motion amplitude, and simultaneous focal points.
- Replace decoration with structure: spacing, typography, alignment, and calm affordances.
- Keep enough contrast for readability and accessibility; quiet does not mean low-contrast.
- Favor fewer components, fewer colors, and more consistent surfaces.

Avoid: making everything gray, removing all hierarchy, hiding affordances, or turning a distinctive design into a bland one.

## Delight: add memorable, useful moments

Use when a flow is functional but could feel more satisfying, human, or emotionally complete.

- Put delight at natural emotional peaks: success states, first value, milestones, empty states, loading, and recovery.
- Keep delight fast, skippable, and secondary to the task. It must never delay core functionality.
- Use micro-interactions to confirm cause/effect and make the system feel responsive.
- Match domain seriousness: banking, healthcare, legal, and destructive actions need restraint; creative and consumer flows can play more.
- End well. The final moment of a flow often matters more than a decorative flourish midway through.

Avoid: delight that obscures status, surprises during high-stakes decisions, animations over 1 second, and personality that fights the brand.

## Distill: simplify and remove noise

Use when the interface has too many elements, options, explanations, styles, or paths.

- Identify the one primary job and remove anything that does not support it directly.
- Hide advanced or secondary choices behind progressive disclosure.
- Consolidate duplicate actions, repeated copy, redundant headings, and overlapping controls.
- Replace visible complexity with clear state, defaults, grouping, and better sequencing.
- Simplify visual language: fewer borders, fewer surfaces, fewer type treatments, fewer accent colors.

Avoid: deleting necessary context, hiding critical controls, oversimplifying expert workflows, or removing affordances just to look clean.

## Polish: final quality pass

Use when the work is functionally complete and needs shipping-grade refinement.

- Check alignment, spacing scale, optical centering, baseline rhythm, and responsive breakpoints.
- Verify every state: hover, focus, active, disabled, loading, empty, success, error, long content, and narrow screens.
- Tighten microcopy, button labels, labels, helper text, and error text so the next action is obvious.
- Smooth transitions without delaying work; respect reduced-motion preferences.
- Remove tiny inconsistencies: mismatched radius, shadows, borders, icon sizes, truncation, wrapping, and uneven CTAs.

Avoid: polishing unfinished flows, cosmetic changes that mask broken behavior, and “one more effect” after the design already works.

## Normalize: align to the design system

Use when a feature drifts from product standards, tokens, components, or established patterns.

- Find the canonical component, token, and pattern before creating anything new.
- Replace one-off styles with system tokens for color, spacing, type, radius, shadow, and motion.
- Align behavior too, not just visuals: focus handling, validation, empty states, loading, errors, and responsive patterns.
- Keep product-specific exceptions explicit and rare; if a new pattern is needed, make it canonical instead of local glue.
- Normalize toward user trust and consistency, not visual sameness for its own sake.

Avoid: hard-coded values, parallel component variants, local CSS overrides that fight the system, and “almost matching” copies of existing components.
