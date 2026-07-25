---
name: audit
description: "Run a scored pass over a11y, performance, theming, responsive behavior, and anti-patterns. Use when you need a prioritized quality map before polish or release."
argument-hint: "[area (feature, page, component...)]"
---

Technical quality audit. **Document, don't fix.** Design judgment → `$critique`.

## Prep

Invoke `$impeccable` Context Gathering Protocol. Then score the implementation only — measurable, code-backed findings.

## Score 0–4 on five dimensions

| # | Dimension | Look for |
|---|-----------|----------|
| 1 | **Accessibility** | Contrast, ARIA/labels, keyboard/focus, semantics, alt text, form errors |
| 2 | **Performance** | Layout thrash, layout-property animation, lazy-load gaps, bundle bloat, re-renders |
| 3 | **Theming** | Hard-coded colors, broken dark mode, inconsistent tokens |
| 4 | **Responsive** | Fixed widths, <44px targets, overflow, text zoom, missing breakpoints |
| 5 | **Anti-patterns** | AI-slop tells and design DON'Ts from `$impeccable` |

**Bands (total /20):** 18–20 excellent · 14–17 good · 10–13 acceptable · 6–9 poor · 0–5 critical

### Score anchors (shared)

- **0** broken / absent · **1** major gaps · **2** partial · **3** mostly solid · **4** excellent

## Report

1. **Health table** — dimension, score, one key finding each; total + band
2. **Anti-patterns verdict** — would someone say “AI made this?” List specific tells
3. **Executive summary** — P0–P3 counts, top 3–5 issues, next steps
4. **Findings** — each: severity, location (file/line), category, impact, standard if any, fix, suggested `$skill`
5. **Systemic patterns** — recurring issues (e.g. hard-coded colors in 15 components)
6. **What's working** — 2–3 practices to keep
7. **Action list** — ordered `$skill` recommendations; end with `$polish` if any fixes

### Severity

- **P0** blocks task · **P1** major / WCAG AA · **P2** minor · **P3** polish only

## Rules

- Cite real locations; no generic “improve accessibility”
- Prioritize; dump of P3s is noise
- Recommend only design/production skills the user already has (`$harden`, `$optimize`, `$adapt`, `$clarify`, …)
- Tell the user they can re-run `$audit` after fixes
---