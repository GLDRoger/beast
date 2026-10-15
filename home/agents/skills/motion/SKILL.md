---
name: motion
description: Design and verify micro-interactions, transitions, scroll scenes, and animation feel. Use when motion itself is the main product change.
---

# Motion

Give each transition a job: feedback, continuity, guidance, or earned delight. Derive the style from the product and current interaction rather than requiring a new design interview.

- Frequent actions need fast, restrained, interruptible feedback. Frequency is not an absolute ban on animation; rare moments may justify more expression.
- Use a small coherent vocabulary of timing, easing, and movement. Prefer transform and opacity; use layout or color when they serve the interaction and measurement supports them.
- Preserve focus, keyboard behavior, state continuity, input responsiveness, and reduced-motion alternatives. Avoid hiding work behind motion or reporting success before completion.
- Inspect the actual interaction, including interruption/reversal and narrow layouts when relevant. Measure jank if performance is in question.

## Optional craft material

- Interaction feel: `~/.agents/skill-modules/taste-craft/SKILL.md`
- Panels, routes, and loading transitions: `~/.agents/skill-modules/transitions-dev/SKILL.md`
- Non-trivial animation review: `~/.agents/skill-modules/review-animations/SKILL.md`
- Scroll-controlled argument/state: `~/.agents/skill-modules/scroll-scenes/SKILL.md`
- 3D and WebGL motion: `~/.agents/skill-modules/3d-scenes/SKILL.md`
- Synthetic visual patterns: `~/.agents/skill-modules/unslop/SKILL.md` (visual mode)

Load the material relevant to the current interaction, not the whole catalog. Use frontend for structural UI changes, performance for measured bottlenecks, and media for video deliverables.
