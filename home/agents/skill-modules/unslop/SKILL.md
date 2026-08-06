---
name: unslop
description: >
  Strip predictable AI prose habits so writing sounds human and specific.
  Use when drafting or editing essays, long-form, UI strings, docs, or marketing
  copy; or when writing feels "AI," stiff, forced, over-explained, or generic.
  Absorbs honest-prose craft rules. For visual/design slop, use remove-ai-slop.
metadata:
  trigger: Writing prose, editing drafts, reviewing content for AI patterns, essays that sound synthetic
---

# Stop Slop

Eliminate predictable AI writing patterns from prose. Write like a person who
trusts the sentence, not a model performing competence.

**Scope:** words, sentences, paragraphs, essay craft, chat/marketing copy.
**Not scope:** layout, color, typography, motion — use `remove-ai-slop` for design.

Detection is **density + co-occurrence**, not one em dash. Humans do some of
these; models do them in clusters.

## The one diagnosis behind most of it

**You keep announcing, restating, and hedging — three ways of not trusting the
sentence you already wrote.** Say the thing once, in the place it belongs, and move.

## Core rules

1. **Cut filler.** Throat-clearing openers, emphasis crutches, empty adverbs, meta
   "in this section we'll…" Full lists: [phrases.md](references/phrases.md).

2. **Break formulaic structures.** Binary contrasts, negative listing, dramatic
   fragments, rhetorical setups, fake-precision triads, setup→reframe→summary
   machines. Full lists: [structures.md](references/structures.md).

3. **Never announce the insight before delivering it.** The good bit does that job.
   Kill "Its deepest idea is…", "Here's the part that…", "Read that again slowly."

4. **Kill "not X, it's Y"** (and family). State Y. Same for "not because… but…",
   "isn't the problem, Y is", "stops being X and starts being Y."

5. **Do not restate after a scene, visual, or fact.** After a scene, pick up where
   the *facts* left off, not where the scene left off.

6. **Active voice; human subjects.** No passive hiding the actor. No abstractions
   performing human actions ("the culture shifts", "the data tells us").

7. **Be specific.** No vague declaratives ("The stakes are high"). Name the stake.
   No lazy extremes ("every/always/never") doing vague work. Prefer proper nouns,
   numbers you verified, times, costs, embarrassments.

8. **Put the reader in the room.** "You" beats "People." Specifics beat abstractions.
   No narrator-from-a-distance lecture voice.

9. **Vary rhythm.** Mix sentence lengths. Two items often beat three. Don't end every
   paragraph with a punchy one-liner. Em dashes: zero (or near zero). Semicolons: rare.

10. **Trust readers.** State facts directly. Skip softening, justification, hand-holding,
    both-sides endings, and "of course there are challenges…" tokens.

11. **Cut quotables and greeting-card lines.** If it sounds like a pull-quote or a
    poster, rewrite. One raised voice per piece — emphasize three sentences, emphasize none.

12. **Sell it, don't review it.** Critic voice describes a property. Fan voice shows
    the chain. Excitement lives in what you choose to say, never in "isn't this amazing."

13. **Essay craft when the form is long.** Setup before payoff; explain nouns on first
    use; research flex must change the reader's mind or get cut/footnoted; form follows
    argument (prose when accumulation is the point; lists when lookup is the point).
    Full craft: [craft.md](references/craft.md).

14. **Fact-check the lines you're proudest of.** Shape-optimized sentences are the ones
    most likely wrong. Look it up before you polish it.

## Partner voice

You are writing to a colleague. These failure modes survive the sentence-level
checks above because they live at the level of the whole reply.

15. **One term per concept, the same term every time.** The file, flag, function,
    or idea keeps one name through the whole piece. Elegant variation reads as a
    second concept and manufactures contradictions.

16. **Track your own claims.** When evidence mid-piece changes an answer, retire
    the old claim out loud ("earlier I said X; the log shows Y"). A reply that
    asserts both versions is worse than either alone.

17. **Verified and unverified are different registers.** State what you checked
    as fact. Mark the rest as what it is: an assumption, a guess, a command you
    did not run. Confidence adverbs are not verification.

18. **Apologize once or not at all.** A mistake gets one acknowledgment and the
    fix. A second sorry is filler wearing humility.

19. **Simplified-English economy** (adapted from the principles of ASD-STE100
    Simplified Technical English):
    - One instruction per sentence. A step containing "and then also" is two steps.
    - Keep sentences near 20 words. A sentence the reader parses twice is over
      budget at any length.
    - Prefer the common word: use over utilize, start over initiate, about over
      approximately, do over perform.
    - Unstack noun clusters of three or more ("workflow runner journal replay
      logic") into clauses.
    - Present tense and active voice for how things work; imperative for what the
      reader must do.

## Quick checks (every delivery)

- Any adverbs / hedges / "honestly/simply/actually/deeply"? Kill.
- Any concept wearing two names? Pick one, replace all.
- Any claim contradicted later without retiring it? Fix the earlier line or name the change.
- Second apology anywhere? Cut it.
- Any passive? Find the actor, make them the subject.
- Inanimate thing doing a human verb? Name the person.
- "Here's what/this/that…"? Cut to the point.
- Any "not X, it's Y" or negative list? State Y / Z directly.
- Any sentence that only announces the next sentence? Delete.
- Paragraph restates the scene/fact above? Cut.
- Three consecutive sentences same length? Break one.
- Paragraph ends punchy *again*? Vary the landing.
- Em dash anywhere? Remove (comma or period).
- Vague declarative ("implications are significant")? Name the specific implication.
- Narrator-from-a-distance ("Nobody designed this")? Put the reader in the scene.
- Meta-joiner ("The rest of this essay…")? Delete.
- Ending restates the whole piece? Replace with a sharper new claim or cut.
- Would you say this out loud to a friend without cringing? If no, rewrite.
- Load-bearing number/date: verified this week?
- At least one human texture (proper noun, time, cost, private detail) when the piece claims lived authority?

Master tell catalog: [tells.md](references/tells.md).
Before/after: [examples.md](references/examples.md).

## The pass (long-form / essays)

On the *rendered* text (not the source):

1. Em dashes: zero. Semicolons: near zero.
2. Any "not X, it's Y"? Any negative listing? Kill.
3. Any sentence that announces the next? Cut.
4. Any paragraph that restates the scene or fact above? Cut.
5. Any fact that opens a question you then answer for a paragraph? Footnote or cut.
6. Any noun a stranger can't define? Explain where it first appears.
7. Pronouns need antecedents; fragments need subjects nearby.
8. Read paragraph lengths aloud. All the same? Break one.
9. Any adverb, hedge, or pull-quote you'd be embarrassed to say out loud?
10. Every load-bearing number and date: verified against a source, this week.
11. Ending: new claim or implication — not a soft restatement.
12. Form matches argument (list vs accumulating prose).

## When editing someone else's voice

- Their restored lines are sacred. Preserve wording; fix only what breaks.
- Distinguish "this is wrong" from "this is not how I would write it." Say which.
- Wrong fact they handed you: say so plainly, give the right one, use it. Don't quietly write around it.
- If you rewrote and didn't verify it renders: say that. "Lint passes; I have not seen it in a browser" is a complete sentence.

## Scoring

Rate 1–10 on each:

| Dimension | Question |
|-----------|----------|
| Directness | Statements or announcements? |
| Rhythm | Varied or metronomic? |
| Trust | Respects reader intelligence? |
| Authenticity | Sounds human? Specific texture? |
| Density | Anything cuttable? |
| Craft | Setup/payoff, nouns explained, no restatement tax? |

Below **42/60**: revise. Below **35/50** on the original five: revise hard.

## Genre notes

- **UI strings / docs:** prioritize directness, density, banned vocab. Less essay craft.
- **Essays / posts:** full craft + full tell list.
- **Marketing:** also kill product slogans ("unlock value", "all-in-one", "X into Y"). Design chrome → `remove-ai-slop`.
- **Chat answers:** no sycophancy, no apology loops, no menu when one answer was asked, no "As an AI…", match length to the question.

## License

MIT — upstream provenance and copyright holder recorded in NOTICE.md at the repo root. Craft sections adapted from honest-prose.
