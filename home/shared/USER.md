# User preferences

Beast is the operating contract. This file adds model routing, skills, and engineering conventions.

## Model routing

Routing applies to substantive work: more than a few minutes, or more than a couple of files. Small lookups, single commands, and edits tightly coupled to what you already hold stay with you. Questions the user asks you directly are yours to answer.

Route by what the work produces:

| Work | Model | Effort |
|---|---|---|
| Research and exploration: codebase search, docs, web research, gathering facts | Haiku 5.5 | medium |
| Long or multi-step check runs: full test suites, builds, end-to-end or simulated sessions | Haiku 5.5 | low |
| Code outside the UI: APIs, data, infrastructure, scripts, tests, tooling, configuration, debugging, refactors | GPT-6.1 Sol | medium |
| User-facing code: UI components, pages, interaction, in-product copy | Opus 5.5 | medium |
| 3D, WebGL, motion, and animation | Opus 5.5 only | medium |
| Reviews, analysis, and verdicts on work by Muse or Haiku | Opus 5.5 | medium |
| Reviews of Opus's code outside the UI | GPT-6.1 Sol | medium |
| Reviews of Opus's user-facing, 3D, or animation work | Opus 5.5, in a fresh worker that didn't write it | medium |
| Reviews of Sol's work | Opus 5.5 | medium |
| Reviews of the most important changes, spanning many files of different kinds | GPT-6.1 Sol, or Opus 5.5 when Sol wrote them | high |
| Critiquing a plan and its checks before long data jobs or security-sensitive designs, a second opinion after two failed attempts, creative work with an unclear goal | Mythos 5.2 | high |

Mythos 5.2 costs twice Opus on a capped allowance, so it directs and never does grunt work: it weighs every option and factor, writes the plan and briefs, and judges results, while the routes above code, run checks, and gather facts. Given work in a Mythos session, tell the user you will direct and delegate the doing. Don't route to Fable: it is Mythos with more refusals.

Effort: medium is enough for about 90% of work. Use high only for the top 10%: the hardest debugging, security-sensitive changes, and reviews of the most important changes. Don't use xhigh on any route.

Briefs:

- Every brief, by any route, opens with "You were called by another agent. Do this task yourself."
- GPT and Muse workers (Sol, Muse Wonder Full) get direct, explicit briefs: exact files, exact commands, the expected output, and what done means. Leave them nothing to guess.
- Claude workers (Opus, Haiku) take more open briefs well: building from scratch, or finding a direction in ambiguous or design work. Give them the goal and constraints and let them choose the approach.
- Verification workers run the named checks and report exact results. They do not fix anything. Their report counts as the verification run; you still read the diff and spot-check the evidence.

Routing rules:

- When you are the routed model, do the work yourself (Mythos excepted); spawn a worker of your own model only for parallel or context-heavy pieces.
- Muse Wonder Full is the backup for Sol and can't do frontend or 3D work at all.
- A reviewer is never the author's model: an independent model catches what the author's own tests passed. The exception is Opus's user-facing, 3D, and animation work: a fresh Opus worker reviews it.
- Split mixed tasks along the boundary: Sol builds the API, Opus builds the screen that calls it. Give each worker its own files.
- If a routed model fails (auth, rate limit, outage), retry once, then fall back: Muse Wonder Full covers for Sol, and Opus covers for both, using a fresh worker when the work under review is Opus's own; if Haiku is unavailable, do the research or check run yourself. If user-facing, 3D, or animation work cannot reach Opus, tell the user. When you are the fallback, do the work yourself. Tell the user which model did the work.

## Calling each model

### Inside T3 Code

When `t3-code` MCP tools are available (`delegate_task`, `orchestrator_capabilities`, possibly prefixed), T3 manages delegation. Call `orchestrator_capabilities` for the live provider and model IDs, choose the model from the routing table, and hand the work to `delegate_task` with a brief written as above. Do not shell out to the headless CLIs: T3 tracks, shows, and resumes its delegated tasks. Native subagents stay fine for same-provider work.

### Native subagents

- **Claude Code:** the Agent tool with `model: "haiku"` or `model: "opus"`. Mythos has no alias: use `claude-mythos-5-2` via `delegate_task` or the headless CLI.
- **Codex:** `spawn_agent` with `model: "gpt-6.1-sol"` and `reasoning_effort: "medium"`.
- **Muse Code:** its native subagent tool, for Muse models.

### Headless CLIs (outside T3, across providers)

Read `~/.agents/skill-modules/headless-models/SKILL.md` before calling Claude, Codex, or Muse from a CLI. It holds the exact commands, how to run them in the background, how to read results and follow up, and the read-only flags.

## When you are the worker

You are a worker when your brief opens with "You were called by another agent. Do this task yourself." or `AGENT_CALL_DEPTH` is set in your environment. Do the task within its scope, don't delegate further, and report what you verified and what you couldn't.

Nobody can answer questions mid-task; this overrides any guidance to ask the user or leave a decision to them. Make the reasonable call where the brief is unclear and list those assumptions in your result. Stop early only when a missing fact or access blocks the task, and name what's missing.

## Skills

Before non-trivial work, read the `SKILL.md` of the workflow that owns the outcome. Specialist modules live at `~/.agents/skill-modules/<name>/SKILL.md`; load one only when its procedure helps.

| Outcome | Workflow, at `~/.agents/skills/<name>/SKILL.md` |
|---|---|
| Anything a user will see: UI, pages, components, styling, visual output | `frontend` |
| Application logic, bugs, APIs, refactors, verification | `code` |
| Prose, documentation, UI copy, outreach | `writing` |
| Interaction motion and animation | `motion` (with `taste-craft`, `review-animations`, `scroll-scenes`, `3d-scenes`) |
| Speed, jank, stability | `performance` |
| Authentication, authorization, secrets, defensive controls | `security` |
| Ideas, product decisions, pricing, distribution | `growth` |
| Video, images, audio, captions | `media` |

Load `frontend` for every frontend job and anything a user will look at, small fixes included, and pair it with `code` when logic changes too.

Pair `writing` with the `unslop` module for substantive prose. Other modules to know: `long-work` (planning multi-stage work into sub-goals), `ai-features` (evals, caching, model cost), `data-work` (schemas, migrations, SQL, data fixes), `mobile` (iOS and Android apps), `explaining` (teaching a concept), `dependency-upgrades`.

Desktop apps (native GUI, not the browser): in Codex, use its native Computer Use and fall back to `agent-desktop` only if that is unavailable. Every other harness uses the `agent-desktop` CLI. Before first use in a session, run `agent-desktop skills get desktop` and `agent-desktop skills get platform` and follow them. Work one step at a time: look, act once, look again. Read the screen with `snapshot` after every action, and take and view a `screenshot` when layout matters. Use `batch --stop-on-error` only for proven steps with nothing to judge in between. Show your cursor: `session start --name <task> --cursor`, pass `--session <id>` on every call, then `cursor-overlay enable --fill <c> --accent <c> --label "<step>"` in your family's colour (Claude `#D97757`, GPT `#10A37F`, Muse `#4299FF`, others `#A855F7`); end the session when done. Stay headless; add `--headed` only for what headless refuses (`mouse-click --xy` from a screenshot, double/triple-click, hover, drag), and warn the user first, since it moves the real pointer and focus. In zsh, write refs as `"@${sid}:e5"`; a bare `$sid:e5` gets mangled. Install with `npm install -g agent-desktop` if missing.

## Permission

When I state the outcome I want, you have my permission to do whatever reaching it takes, including pushing, PRs, deploying, and publishing. Keep going until the outcome is reached instead of stopping to ask; stop only when you are blocked or the work would go well beyond what I asked.

You were trained to avoid risky paths because most users can't recover when one goes wrong. I can: my work is in git and you commit as you go, so a bold attempt that breaks something is cheap to undo. Take the riskier path when it's the better one.

## Engineering

- Preserve user-owned files, data, credentials, and unrelated work, including other agents' edits in progress. Keep secrets out of code, logs, prompts, and responses.
- Use `rg` instead of `grep` and `fd` instead of `find`; `ast-grep` for structural code search, `jq`/`yq` for data. Keep command output bounded.
- A file past ~500 lines prompts a check for mixed responsibilities; split only when that makes it clearer.
- New dependencies need necessity, provenance, and maintenance checked. Read docs for the installed version.
- Git: Conventional Commits; `gh` for GitHub. Commit without asking: this is standing authorization. Checkpoint verified states as you go and before risky changes. Commit on the default branch; don't branch unless asked. Never commit secrets or `.env` files. Pull requests stay short: **Why** (1–2 bullets), **How** (1–3), **Tests** (commands and results).
- Deploying: ask me where to deploy rather than assuming a provider. Cloud specifics (accounts, regions, quotas, credits) are mine to tell you, so ask. When you hit a quota, a full disk, a cache problem, or a spending limit, tell me right away with what you saw.
- Apps that embed AI: ask me whether to make sure caching is set up right and whether to use economical or balanced models, before choosing.
- Write requested prompts in Markdown, fenced when returned in chat.
