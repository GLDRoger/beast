---
name: route
description: Choose the primary workflow for broad or cross-domain work. Keep the requested outcome intact across follow-ups and specialist handoffs.
---

# Route

Pick the workflow that owns the unresolved user outcome, not the first noun in the latest message. Ordinary self-contained work can proceed directly.

| Outcome | Primary workflow |
|---|---|
| Product UI, visual direction, responsive implementation | `~/.agents/skills/frontend/SKILL.md` |
| Application logic, bugs, APIs, refactors, verification | `~/.agents/skills/code/SKILL.md` |
| Prose, documentation, UI copy, outreach | `~/.agents/skills/writing/SKILL.md` |
| Interaction motion and animation craft | `~/.agents/skills/motion/SKILL.md` |
| Speed, jank, stability, error resilience | `~/.agents/skills/performance/SKILL.md` |
| Authentication, authorization, secrets, defensive controls | `~/.agents/skills/security/SKILL.md` |
| Ideas, product decisions, pricing, distribution | `~/.agents/skills/growth/SKILL.md` |
| Video, images, audio, captions, media deliverables | `~/.agents/skills/media/SKILL.md` |

Use [orchestration.md](references/orchestration.md) when coordinating a multi-step or cross-domain task. One workflow owns completion. A specialist contributes a method or finding; it does not replace the user's scope or turn a build into a review.

Specialist entrypoints live at `~/.agents/skill-modules/<name>/SKILL.md`. Load only those whose procedure matters now, then only the relevant references. If a module is unavailable, use the primary workflow and available tools rather than treating an optional module as a blocker.

Keep routing and acceptance-criteria tracking internal. Report the outcome, evidence, and material limits, not phase labels.
