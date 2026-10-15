# Changelog

## 2026-08-06

### Added Partner voice section

- Five reply-level rules (15–19): one term per concept, claim tracking (retire a
  changed answer out loud), verified-vs-unverified registers, single apology,
  and Simplified-English economy adapted from the principles of ASD-STE100
  (one instruction per sentence, ~20-word sentences, common-word preference,
  noun-cluster unstacking, active voice / imperative split).
- Three matching quick checks: two-named concepts, unretired contradictions,
  second apologies.
- Scope note: the BEAST prompts now hold every agent-written word to this skill
  — answers, docs, commit messages, code comments, error and log messages.

## 2026-07-19

### Merged honest-prose into unslop

- Absorbed essay craft rules (insight announcement, restatement tax, setup/payoff, noun glosses, fan vs critic voice, fact-check pride lines, pull-quote discipline, form-follows-argument).
- Expanded phrase and structure catalogs with classic AI lexicon, marketing slogans, chat sycophancy, both-sides endings, rhythm and formatting tells.
- Added `references/craft.md` (long-form craft) and `references/tells.md` (master audit checklist).
- Scoring now six dimensions (adds Craft); threshold 42/60.
- Description/triggers cover essays and "feels AI/stiff/forced" cases formerly routed to honest-prose.
- **Deleted** standalone `honest-prose` skill. Use `unslop` only.

### Notes

- Earlier versions kept design/visual tells in a separate module. The current entrypoint routes visual cleanup to `references/visual.md`.
- Detection is density + co-occurrence, not single-token bans.

## 2026-01-13

### Added

**Phrases (references/phrases.md)**
- Throat-clearing: "Here's what I find interesting", "Here's the problem though"
- Performative emphasis: "creeps in", "I promise", "They exist, I promise"
- Telling instead of showing: "This is genuinely hard", "This is what leadership actually looks like"

**Structures (references/structures.md)**
- Binary contrasts: "Not X. But Y.", "It's not this. It's that.", "stops being X and starts being Y"
- Rhythm patterns: staccato fragmentation, dashes for dramatic pause, hedging as reassurance
- Word patterns: absolute words (always, never, everyone, etc.), AI-overused intensifiers

## 2026-01-12

- Restructured skill following Claude Code best practices (PR #1)
- Split into SKILL.md and references/ folder

## 2025-01-12

- Initial release
