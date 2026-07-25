---
name: critique
description: "Hold a design up to a real UX bar — hierarchy, emotion, cognitive load, scored feedback. Use when you need a sharp read before another polish loop or a ship decision."
argument-hint: "[area (feature, page, component...)]"
---

Design-director review. **Judge and prioritize — don't implement yet.**

## Prep

1. Invoke `$impeccable` Context Gathering Protocol (`teach` if needed). Know what the UI is trying to accomplish.
2. Load local refs as needed:
   - `reference/cognitive-load.md`
   - `reference/heuristics-scoring.md`
   - `reference/personas.md`

## Dual assessment (independent)

Run **A** and **B** without contaminating each other. Prefer separate sub-agents; if unavailable, sequential with notes held until synthesis. With browser tools, **new tab per assessment** (never reuse).

### A — LLM design review

Read source; visually inspect if possible. Label tab `[LLM] …`.

Evaluate:

- **AI slop** — would you believe “AI made this”? Check `$impeccable` DON'Ts
- **Hierarchy, IA, emotion, discoverability, composition, type, color**
- **States** — empty, loading, error, success
- **Copy** — clarity and tone
- **Cognitive load** — 8-item checklist; options at each decision (>4 = flag); progressive disclosure
- **Emotion** — peak-end; anxiety at high-stakes moments
- **Nielsen 10** — score 0–4 each via `heuristics-scoring.md`

Return: slop verdict, heuristic scores, cognitive load, 2–3 strengths, 3–5 priority issues, minors, provocative questions.

### B — Deterministic detection

```bash
npx impeccable --json [--fast] [target]   # markup files/dirs; not CSS-only; not bare URLs
```

Optional live overlays (user-facing; read console, don't screenshot-scroll):

```bash
npx impeccable live &          # note port
# new tab → page → document.title = '[Human] ' + …
# inject: script src http://localhost:PORT/detect.js
# read_console_messages pattern impeccable
npx impeccable live stop
```

Return: CLI JSON, console findings, known false positives.

## Combined report

Weave A+B — agreements, detector-only hits, false positives.

1. **Health table** — Nielsen 10 + total/40 (honest: most UIs land 20–32)
2. **Anti-patterns verdict** — LLM + detector summary; point user at `[Human]` overlays if used
3. **Overall impression** — gut + single biggest opportunity
4. **What's working** — 2–3 specifics
5. **Priority issues** (P0–P3) — What / Why / Fix / suggested `$skill`
6. **Persona red flags** — 2–3 personas from `personas.md` (+ project-specific if design context exists); concrete element failures, not generic bios
7. **Minor observations**
8. **Questions** — sharp, not soft

## After the report

Ask 2–4 **finding-specific** questions (priority area, intentional tone?, scope, off-limits). Skip if only 1–2 clear issues.

Then emit an **action list** ordered by user priorities — only real skills (`$arrange`, `$polish`, `$harden`, …). End with `$polish` if any fixes. Offer run one-at-a-time or all; re-run `$critique` after.

## Rules

Be specific (name the control). Say why it hurts users. Don't soften. Prioritize ruthlessly.
---