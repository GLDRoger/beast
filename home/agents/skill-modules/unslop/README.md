# Stop Slop

A skill for removing AI tells from prose — short copy and long-form essays.

## What this is

AI writing has patterns: predictable phrases, structures, rhythms, and essay habits
(announcing, restating, hedging). This skill teaches an agent to catch and remove them
so writing sounds human and specific.

**Writing only.** For visual/design slop (gradients, card grids, glassmorphism), use
`remove-ai-slop`.

This skill **absorbs honest-prose** (essay craft). Prefer `/unslop` for all prose work.

## Skill structure

```
unslop/
├── SKILL.md                 # Core diagnosis, rules, pass, scoring
├── references/
│   ├── phrases.md           # Phrases, jargon, AI lexicon
│   ├── structures.md        # Rhetorical and structural patterns
│   ├── craft.md             # Essay / long-form craft (from honest-prose)
│   ├── tells.md             # Master audit checklist
│   └── examples.md          # Before/after transformations
├── README.md
├── CHANGELOG.md
└── LICENSE
```

## Quick start

**Claude Code / Codex / Grok:** skill loads as `unslop`.

**Projects:** upload `SKILL.md` + `references/`.

**API:** include `SKILL.md` in the system prompt; load references on demand.

## What it catches

- **Banned phrases** — throat-clearing, insight announcements, AI lexicon, adverbs, meta-commentary
- **Structural clichés** — not-X-it's-Y, negative listing, fake triads, false agency, restatement tax
- **Essay craft failures** — missing setup, unexplained nouns, critic voice, research flex without payoff
- **Chat/marketing tells** — sycophancy, both-sides endings, X-into-Y slogans

## Scoring

Rate 1–10: Directness, Rhythm, Trust, Authenticity, Density, Craft. Below **42/60**: revise.

## Authors

- Upstream provenance and license: see NOTICE.md at the repo root.
- Essay craft: honest-prose (merged 2026-07-19)
- Expanded tell catalog: session merge of public AI-writing detectors

## License

MIT. Use freely, share widely.
