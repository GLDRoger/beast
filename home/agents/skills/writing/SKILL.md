---
name: writing
description: >
  Writing and copy: UI microcopy, docs, essays, marketing, outreach. Use when words are the product.
---

# Writing

Own language from draft to verified clarity. Orchestration loop: follow `$route` → `references/orchestration.md`.


## Module convention

Top-level skills are only: `$route` `$frontend` `$code` `$writing` `$motion` `$performance` `$security` `$growth` `$media`.

Any other `$name` (e.g. `$impeccable`, `$unslop`) is a **module**. Load it by reading:

`~/.agents/skill-modules/<name>/SKILL.md`

Do not expect modules in the skills menu. If the file is missing, search `~/.agents/skill-modules/` and pick the closest match.

## Phase 0 — Brief

**Goal:** Audience, channel, job-to-be-done, tone constraints.

- Infer from product context; ask one question only if a missing fact changes the words
- UI work: know the screen state (empty/error/success/loading)
- Long-form: know thesis and reader

**Green:** You can name who reads this and what they must do or believe next.

## Phase 1 — Draft / rewrite

| Job | Skill |
|-----|--------|
| Kill AI prose habits (essays, docs, chat, marketing) | `$unslop` (`$honest-prose` aliases here) |
| UI labels, empty/error/success, tooltips | `$app-copy`, `$clarify` |
| Design-system / visual AI-slop audit of copy+UI tells | `$remove-ai-slop` |
| README | `$readme` |
| Changelog card | `$changelog` |
| Cold email / sequence | `$cold-email`, `$cold-outreach-sequence` |
| Product onboarding copy | `$onboard` (with `$frontend` if UI structure changes) |

**Green:** Specific, audience-aware, no placeholder voice.

## Phase 2 — Consistency pass

**Goal:** One term per concept; voice matches product.

- Align with existing in-app strings before inventing new vocabulary
- Cut redundant headers that restate body copy
- Errors: what happened + how to fix + no blame

**Green:** Glossary holds; no competing names for the same thing.

## Phase 3 — Verify

**Goal:** Words work in context.

- UI: read strings on the real screen/state if available
- Docs: open the rendered page; links resolve
- Outbound: length, CTA, personalization claims are honest

**Green:** Next action is obvious to a cold reader.

## Hand off when

| Signal | Switch to |
|--------|-----------|
| Layout/hierarchy is the real problem | `$frontend` |
| Full product/launch strategy | `$growth` |
| Video/script for HyperFrames | `$media` |
---

## Modules (load by path, not slash menu)

Base: `~/.agents/skill-modules/`

When a phase names a former skill like impeccable or unslop, **read**:

`~/.agents/skill-modules/<module-name>/SKILL.md`

| Module | Path |
|--------|------|
| `unslop` | `~/.agents/skill-modules/unslop/SKILL.md` |
| `honest-prose` | `~/.agents/skill-modules/honest-prose/SKILL.md` |
| `app-copy` | `~/.agents/skill-modules/app-copy/SKILL.md` |
| `clarify` | `~/.agents/skill-modules/clarify/SKILL.md` |
| `remove-ai-slop` | `~/.agents/skill-modules/remove-ai-slop/SKILL.md` |
| `readme` | `~/.agents/skill-modules/readme/SKILL.md` |
| `changelog` | `~/.agents/skill-modules/changelog/SKILL.md` |
| `cold-email` | `~/.agents/skill-modules/cold-email/SKILL.md` |
| `cold-outreach-sequence` | `~/.agents/skill-modules/cold-outreach-sequence/SKILL.md` |
| `onboard` | `~/.agents/skill-modules/onboard/SKILL.md` |

If a needed module is missing from the table, list `~/.agents/skill-modules/` and open the closest match.

