# Specialist modules

Load a module from `~/.agents/skill-modules/<name>/SKILL.md` only when its procedure helps the current task, and read only the references you need. A workflow owns the result; a module is a method it can use, not a required step. A standalone review stays read-only; a review inside an implementation feeds its findings back to that implementation.

Which modules are installed depends on the packs chosen with `beast install --packs=…`.

## Engineering

| Module | Use when |
|---|---|
| `ai-features` | an app calls an LLM, or you are changing prompts, choosing models, setting up caching, or building evals |
| `ai-streaming` | a Next.js or React app should stream model output token by token with the Vercel AI SDK |
| `data-work` | work reads or writes a database: migrations, SQL questions, backfills, data fixes |
| `debug-perf` | a Next.js or web app is slow: hot reload loops, high CPU, bundle bloat, slow server responses |
| `dependency-upgrades` | bumping package, runtime, or framework versions, or fixing a dependency advisory |
| `domain-modeling` | business terms are fuzzy and need a glossary and recorded decisions |
| `grilling` | the user asks to be questioned on a plan before building, and is present to answer |
| `handoff` | another agent or person must continue the work from a compact handoff document |
| `improve` | the user wants an advisory codebase review delivered as plans, not edits |
| `long-work` | a task spans many hours, files, or sessions and needs a plan file with checked sub-goals |
| `agent-desktop` | you must operate a native desktop app's window rather than a browser or terminal |
| `mobile` | the work targets an iOS or Android app on a simulator or emulator |
| `rate-limit` | Next.js API routes need rate limits against abuse or AI cost |
| `review-swarm` | the user asks for an independent or multi-model review of a PR or diff |
| `ruthless-release-qa` | the user asks for exhaustive testing before a public release |
| `thermo-nuclear-code-quality-review` | the user asks for a strict maintainability and structure review of a branch |
| `web-shader-extractor` | the user wants a WebGL, WebGPU, canvas, or shader effect from a live page understood or replayed locally |

## Design and motion

| Module | Use when |
|---|---|
| `3d-scenes` | the deliverable renders real-time 3D in the browser with three.js or React Three Fiber |
| `apple-design` | the user asks for Apple-style UI, or you are building gestures, sheets, springs, or momentum |
| `compact-landing` | the user asks for a narrow, dense, quiet micro-SaaS landing page |
| `drawing-canvas-films` | a film or animation should be drawn frame by frame on a canvas and rendered to MP4 |
| `redesign-skill` | an existing site works but looks generic and needs its visual quality raised without a rewrite |
| `review-animations` | existing motion code needs a pass or fail review |
| `scroll-scenes` | scrolling should drive the story of a page, not just trigger fade-ins |
| `taste-craft` | building or reviewing how components feel in use: feedback, origins, interaction polish |
| `text-to-lottie` | the deliverable is a Lottie JSON file for the Skottie player |
| `transitions-dev` | implementing a specific CSS transition such as a modal, dropdown, tabs, or toast |

## Prose

| Module | Use when |
|---|---|
| `app-copy` | the words inside a product need writing or auditing: empty states, errors, buttons, onboarding |
| `changelog` | the user wants a "what shipped" social card built from recent git history |
| `cold-email` | writing one cold email, or checking a sending domain's authentication |
| `cold-outreach-sequence` | planning a multi-touch outreach campaign with a schedule |
| `explaining` | the user asks what something means, how it works, or why it behaves as it does |
| `readme` | writing, auditing, or improving a README.md |
| `unslop` | prose or UI reads as machine-generated, or the user asks for an AI-slop cleanup |

## Product and growth

| Module | Use when |
|---|---|
| `aeo-ready` | only AI answer-engine visibility is asked for: llms.txt, AI crawler rules, structured data |
| `pricing-page` | a product needs a pricing page with tiers, gating, and checkout |
| `segment-users` | users should be grouped by behaviour from the database, with an action per group |
| `seo-ready` | a site needs a full search audit and fixes, covering Google and answer engines |
| `ship-credits` | a product needs a prepaid credits balance users buy and spend |
| `ship-email` | an app needs to send real email to its users |
| `startup-pressure-test` | the user asks whether an idea can be a viable business |
| `teardown` | a competitor's product or landing page should be picked apart for lessons |

## Tooling

| Module | Use when |
|---|---|
| `codex-session-miner` | asked to analyse past Codex session logs for repeated work and skill candidates |
| `headless-models` | calling Claude, Codex, or Muse from a CLI outside T3 Code |
| `mac-codex-tooling-repair` | local agent tooling on this Mac is broken and blocks the work |
| `next-runtime-triage` | the user pastes a noisy Next.js stack trace or runtime log |
