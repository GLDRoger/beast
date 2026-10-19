# Specialist modules

Load a module from `~/.agents/skill-modules/<name>/SKILL.md` only when its procedure helps the current task, and read only the references you need. A workflow owns the result; a module is a method it can use, not a required step. A standalone review stays read-only; a review inside an implementation feeds its findings back to that implementation.

Which modules are installed depends on the packs chosen with `beast install --packs=…`.

## Engineering

| Module | What it does |
|---|---|
| `ai-features` | Build and judge features that embed AI models: evals and baselines, prompt changes, model choice by cost and quality, prompt caching, streaming, and failure handling |
| `ai-streaming` | Ship streaming AI UX end-to-end — tokens on screen, loading and error states, abort on unmount |
| `data-work` | Change or query data safely: schema changes and migrations, SQL and analytics questions, backfills, and one-off data fixes in development or production |
| `debug-perf` | Hunt Next.js and web performance dragons — HMR loops, CPU spikes, bundle bloat, slow servers |
| `dependency-upgrades` | Upgrade packages, runtimes, frameworks and CLIs safely: reading changelogs and migration guides, upgrading in steps, and verifying behaviour |
| `domain-modeling` | Name the business correctly — ubiquitous language, sharp domain edges, decisions worth recording |
| `grilling` | Pressure-test a plan with relentless questions before you spend build cycles |
| `handoff` | Fold the session into a compact handoff another agent can continue |
| `improve` | Survey a codebase as an advisor and hand other agents ranked, self-contained plans |
| `improve-codebase-architecture` | Review architectural friction, coupled modules, interface complexity, and testability; recommend evidence-backed refactoring opportunities within the requested scope |
| `long-work` | Plan and carry long, multi-stage work (many hours, many files, several sessions or rounds) by breaking the goal into sub-goals with their own checks and a plan file that survives compaction |
| `mobile` | Build and verify iOS and Android apps, including React Native, Expo, Flutter, Swift and Kotlin projects: running on simulators and emulators, inspecting real screens, and handling device-specific behaviour |
| `rate-limit` | Protect Next.js routes with real rate limits — IP/user windows, 429s, Retry-After |
| `review-swarm` | Run a multi-model PR/diff review panel and sort findings into actionable, nit, or ambiguous |
| `ruthless-release-qa` | Behave like a hostile release tester — every path, state, and awkward client |
| `thermo-nuclear-code-quality-review` | Run a harsh maintainability review — abstraction rot, giant files, condition spaghetti |
| `wayfinder` | Map oversized work onto an issue tracker as investigation tickets you can finish one by one |
| `web-shader-extractor` | Extract and locally replay web GPU/canvas/shader effects from a real page |

## Design and motion

| Module | What it does |
|---|---|
| `3d-scenes` | Build and visually verify real-time 3D on the web with three.js or React Three Fiber, including hero scenes, product visuals, data or concept visualizations, and 3D films |
| `apple-design` | Apple's approach to interface design and fluid, physical motion, translated for the web |
| `compact-landing` | Shape narrow, dense, tactile product pages — precise, quiet, premium micro-SaaS energy |
| `drawing-canvas-films` | Make videos, launch films, and animations where every frame is drawn in code on a canvas and exported to MP4 |
| `redesign-skill` | Upgrade an existing site or app toward premium craft without a full rewrite |
| `review-animations` | Review motion code against a high craft bar (Emil-inspired) |
| `scroll-scenes` | Build scroll-driven visual essays and animated story pages (sticky scenes, CSS-var animation, per-chapter art direction) |
| `taste-craft` | Invisible polish — component feel, motion detail, and the small decisions that make software feel inevitable |
| `taste-skill-gpt` | Push elite editorial UI and GSAP-grade scroll motion — bold type, gapless bento, serious craft constraints |
| `text-to-lottie` | Author Lottie (Bodymovin) JSON that plays in a local skia path |
| `transitions-dev` | Implement production UI transitions — modals, tabs, toasts, shared-element moments, state morphs |
| `tushar-design` | Build in Tushar’s dark, precise design system — opinionated questions first, then code |

## Prose

| Module | What it does |
|---|---|
| `app-copy` | Write (or rewrite) the words the product speaks — empty states, errors, buttons, onboarding, toasts |
| `changelog` | Turn recent git history into a weekly social changelog card ready to screenshot |
| `cold-email` | Write cold email that earns replies — signal, brevity, deliverability discipline |
| `cold-outreach-sequence` | Design a multi-touch outreach campaign across email and LinkedIn with distinct jobs per touch |
| `explaining` | Explain or teach a concept, a system, or a piece of code so the user understands it, not just hears it |
| `honest-prose` | Write or edit essays and long-form prose that sound like a person, not a model |
| `readme` | Raise the README to a professional standard — structure, install path, clarity, signal |
| `unslop` | Remove formulaic AI prose and generic visual-design patterns while preserving the user's voice, brand, facts, and requested scope |

## Product and growth

| Module | What it does |
|---|---|
| `aeo-ready` | Make the product legible to answer engines — llms.txt, AI crawler rules, structured data for AI search |
| `pricing-page` | Stand up a real pricing surface — tiers, gates, payments hook, polished UI |
| `segment-users` | Turn schema into behavioral segments and actions — power users, churn risk, re-activation |
| `seo-ready` | Full SEO + AEO pass — meta, structured data, sitemap, robots, llms.txt, crawler rules |
| `ship-credits` | Scaffold credits/token metering end-to-end — schema, spend path, webhooks, UI |
| `ship-email` | Scaffold email infrastructure — provider, templates, segments, send admin |
| `startup-pressure-test` | Assess a startup's business viability, customer pain, substitutes, buyer, and validation plan |
| `teardown` | Dissect a product or landing page — what works, what fails, what to steal |

## Tooling

| Module | What it does |
|---|---|
| `codex-session-miner` | Analyze historical Codex session JSONL logs to find repeated workflows, expensive tool patterns, reusable skill candidates, and script/globalization opportunities without loading raw transcripts into context |
| `cua-driver` | Drive a native GUI app (macOS, Windows, Linux) via the cua-driver CLI (default) or MCP server — snapshot its accessibility tree, click/type/scroll by element_index or pixel coords, verify via re-snapshot, all without bringing the target to the foreground |
| `headless-models` | Call Claude, Codex (GPT), or Muse models headlessly from a CLI, outside T3 Code: scratch directory, brief on stdin, background runs, reading results, follow-ups, and read-only flags |
| `mac-codex-tooling-repair` | Repair the local macOS agent stack — CUA, MCP, daemon, auth, Python mismatches |
| `next-runtime-triage` | Condense noisy Next.js runtime, .next chunk, Prisma, AbortError, and stack trace logs into source candidates and stale-build clues before editing |
