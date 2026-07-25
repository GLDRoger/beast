---

description: Perform a Code Review From Hell by reverse-engineering intent, documenting all user flows, and brutally auditing one selected flow
argument-hint: [IGNORE_DOCS=true, HELL_MODE=true]
---

Ignore all documentation, READMEs, comments, tickets, and commit history. Treat the repository as if the authors disappeared and left only the code behind.

1. **Infer intent from code alone**
   Scan the repo structure, dependencies, configs, routes, schemas, components, state management, API boundaries, and build setup. From this, form a clear hypothesis of:

* What this product is supposed to do
* Who it is for
* What the core value proposition and execution model appear to be

State assumptions explicitly. If intent is muddled or contradictory, say so.

1. **Document all user flows exhaustively**
   Enumerate every distinct user flow implied by the codebase. For each flow, document:

* Entry point
* Preconditions
* Main path
* Variants and edge cases
* Terminal states

Include partial, broken, duplicated, abandoned, or conflicting flows. If a flow exists in code but makes no product sense, still document it and flag it.

1. **Pause and ask for direction**
   Do not review code yet. Ask me which specific user flow to start with first.

2. **Code Review From Hell for the selected flow**
   Once a flow is chosen, trace it end-to-end across frontend, backend, state, APIs, data, and side effects. Then:

* Identify what works by accident vs by design
* Call out best-practice violations, bad abstractions, incoherent naming, leaky state, tight coupling, dead code, and architectural nonsense
* Flag missing functionality, broken assumptions, security/perf/scaling risks
* Tear apart UX and UI issues: confusing interactions, broken mental models, ugly or unjustified visual choices, pointless complexity

Explicitly label:

* Code that must be rewritten
* Code that should be deleted
* Code that should never have existed

1. **Produce an action plan**
   End with a brutal, prioritized list of fixes required to make this flow production-grade. No politeness. No hedging. Optimize for correctness, clarity, and long-term maintainability.
