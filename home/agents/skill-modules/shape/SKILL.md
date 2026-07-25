---
name: shape
description: "Shape UX before code — discovery interview and a brief that steers build. Use at the start of a feature when jumping into components would waste motion."
argument-hint: "[feature to shape]"
---

Plan UX/UI before code. Output is a **design brief**, not implementation.

## Prep

1. Invoke `$impeccable` Context Gathering Protocol (`teach` if no design context).
2. Do **not** write code or invent layouts during discovery.

## Phase 1 — Discovery (conversation, not a dump)

Ask only what you cannot infer. Cover:

| Area | Probe |
|------|--------|
| Purpose | Problem, who uses it, success signal, mental state on arrival |
| Content | Data shown/collected, realistic ranges, empty/error/first-use edges |
| Goals | Single most important action; feel (fast / calm / playful / premium); product patterns to match |
| Constraints | Tech, i18n, mobile, a11y bar |
| Anti-goals | Wrong directions; cost of failure |

## Phase 2 — Design brief

Present for confirmation before finishing:

1. **Feature summary** (2–3 sentences)
2. **Primary user action**
3. **Design direction** (feel + how it expresses project design context)
4. **Layout strategy** (hierarchy and flow — not CSS)
5. **Key states** (default, empty, loading, error, success, edges)
6. **Interaction model** (entry → completion, feedback)
7. **Content requirements** (labels, empty/error copy, dynamic ranges)
8. **Impeccable refs to load at build** (e.g. `spatial-design.md`, `motion-design.md`)
9. **Open questions**

## Handoff

On confirmed brief → `$impeccable craft` (or the user's chosen implementer). Revisit discovery if the user rejects any section.
---