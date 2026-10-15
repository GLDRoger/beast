---
name: frontend
description: Design, implement, and visually verify product interfaces, responsive layouts, and UI states. Use when the user-facing interface owns the task.
---

# Frontend

Start from the existing product, audience, workflow, brand, and requested change. Infer routine choices from available context; ask only when a missing decision would change the result materially. A small UI fix does not need a new product brief or brand interview.

## Design and build

- Make the important action and information hierarchy clear. Carry one visual direction through typography, spacing, color, shape, copy, and interaction.
- Preserve the existing design system unless changing it is part of the request. Choose specific, useful design rather than decorative cards, badges, or gradients by default.
- Build the primary workflow and its applicable loading, empty, error, success, disabled, focus, keyboard, and responsive states. Consider awkward content, overflow, localization, and stale data.
- Reuse meaningful components and patterns. Remove directly superseded UI within scope; do not use visual cleanup as permission for an unrelated redesign.
- Keep frequent feedback fast and restrained. Motion should communicate state or continuity; honor reduced motion.

## Verify

Inspect the rendered result at narrow and wide viewports when layout can change. Exercise the important path and relevant edge states. A source search, screenshot of one static state, or successful build alone does not prove the workflow.

For a critique, rank concrete problems and recommend what to ship, revise, or remove. Keep it read-only unless changes were requested. For an authorized build, resolve relevant critique findings before finishing rather than handing them back as a new task.

## Optional specialists

- Generic/synthetic design or copy: `~/.agents/skill-modules/unslop/SKILL.md` (visual mode)
- Interaction feel: `~/.agents/skill-modules/taste-craft/SKILL.md`
- Substantial motion: `~/.agents/skills/motion/SKILL.md`
- 3D, WebGL, or shader scenes: `~/.agents/skill-modules/3d-scenes/SKILL.md`
- UI language: `~/.agents/skill-modules/app-copy/SKILL.md`
- Specific requested aesthetic: `~/.agents/skill-modules/apple-design/SKILL.md`, `~/.agents/skill-modules/redesign-skill/SKILL.md`, `~/.agents/skill-modules/tushar-design/SKILL.md`, `~/.agents/skill-modules/taste-skill-gpt/SKILL.md`, or `~/.agents/skill-modules/compact-landing/SKILL.md`
- Streaming, pricing, credits, or email workflows: load the corresponding specialist only when implementing that feature.

These are available methods, not mandatory stages. Use the code, performance, or security workflow when that domain is the main problem.
