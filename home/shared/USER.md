# User preferences

Beast is the operating contract. This file adds my model routing, skills, and engineering conventions.

## Model routing

Routing applies to substantive work: more than a few minutes, or more than a couple of files. Small lookups, single commands, and tightly coupled edits stay with you. Direct questions from me are yours to answer.

Route by what the work produces:

| Work | Model | Effort |
|---|---|---|
| Research, exploration, docs, web research, gathering facts | Haiku 5.5 | medium |
| Long or multi-step check runs: test suites, builds, e2e walks | Haiku 5.5 | low |
| Code outside the UI: APIs, data, infra, scripts, tests, tooling, config, debugging, refactors | GPT-6.2 Sol | medium |
| User-facing code: UI components, pages, interaction, in-product copy | Opus 5.5, Gemini 4 Neon, Mythos 5.2, or Fable 5.2 | medium |
| 3D, WebGL, motion, and animation | Opus 5.5, Gemini 4 Neon, Mythos 5.2, or Fable 5.2 | medium |
| 3D Blender and game assets (focused tasks, not long unattended threads) | GPT-6.2 Astra | medium |
| Reviews, analysis, and verdicts on work by Sol, Muse, or Haiku | Opus 5.5, Gemini 4 Neon, Mythos 5.2, or Fable 5.2 | medium |
| Reviews of SSS-tier code outside the UI | GPT-6.2 Sol | medium |
| Reviews of SSS-tier user-facing, 3D, or animation work | Another SSS model (or a fresh worker that didn't write it) | medium |
| Reviews of big, high-stakes changes spanning many files | GPT-6.2 Sol, or an SSS model when Sol wrote them | high |
| Directing a whole long project, creative direction, architecture/plan/spec review, second opinion after two failed attempts | Mythos 5.2, Fable 5.2, Gemini 4 Neon, or Opus 5.5 | medium |

**Top tier (SSS):** Opus 5.5, Mythos 5.2, Fable 5.2, and Gemini 4 Neon sit together at the top. Mythos 5.2 and Fable 5.2 burn twice Opus's allowance on a capped plan, so don't waste them on grunt work that GPT-6.2 Sol or Haiku 5.5 handles cheaper: let them direct, plan, design, build user-facing work, and judge results while Sol and Haiku handle backend grinding and checks.

**Gemini & Astra caveats:** Gemini 4 Neon is the only Gemini model worth using — don't route to other Gemini models. GPT-6.2 Astra is best in class for 3D Blender and game assets, but it's spiky; use it on focused tasks, never long unattended threads.

**Effort:** `medium` is enough for ~90% of work. Use `high` only for the hardest debugging, security-sensitive changes, and critical reviews. Don't use `xhigh`.

**Briefs:**
- Every brief opens with `"You were called by another agent. Do this task yourself."`
- GPT and Muse workers (GPT-6.2 Sol, GPT-6.2 Astra, Muse Wonder Full) need explicit briefs: exact files, commands, expected output, and done criteria. Leave nothing to guess.
- Claude and Gemini 4 Neon workers take open briefs well: give them the goal and constraints and let them pick the approach.
- Verification workers run the named checks and report exact results without editing. Read the diff and spot-check their evidence anyway.

**Routing rules:**
- When you are already one of the routed models, do the work yourself; spawn workers only for parallel or context-heavy pieces (except when directing a large project on Mythos/Fable and delegating grunt work).
- Muse Wonder Full is the backup for GPT-6.2 Sol. Never use it for frontend or 3D.
- A reviewer shouldn't be the same model that wrote the code. For SSS UI/3D/animation work, use another SSS model (e.g., Neon reviewing Opus or vice versa) or a fresh worker.
- Cap parallel workers at three unless I ask for more.
- Split mixed tasks along the boundary (e.g., GPT-6.2 Sol builds the API, Opus/Neon builds the UI) and give each worker disjoint files.
- On failure (auth, rate limit, outage), retry once, then fall back: Muse Wonder Full covers for GPT-6.2 Sol; any available SSS model covers for the others; if Haiku is unavailable, do the lookup/check yourself. Tell me which model did the work.

## Calling each model

### Inside T3 Code

When `t3-code` MCP tools are present (`orchestrator_capabilities`, `delegate_task`), let T3 manage cross-provider delegation. Call `orchestrator_capabilities` once to confirm live provider and model IDs, then pass the brief to `delegate_task`. Don't shell out to headless CLIs inside T3. Native subagents are fine for same-provider work.

### Native subagents

- **Claude Code:** Agent tool with `model: "haiku"` or `model: "opus"`. For Mythos/Fable, use `claude-mythos-5-2` or `claude-fable-5-2` via `delegate_task` or the headless CLI.
- **Codex:** `spawn_agent` with `model: "gpt-6.2-sol"` (or `"gpt-6.2-astra"` for focused Blender/game-asset work) and `reasoning_effort: "medium"`.
- **Antigravity:** native subagent (`self`) inherits `gemini-4-neon`.
- **Muse Code:** native subagent tool for Muse models.

### Headless CLIs (outside T3, across providers)

Read `~/.agents/skill-modules/headless-models/SKILL.md` for exact CLI invocations, background execution, resuming, and read-only flags.

## When you are the worker

You are a worker if your brief opens with `"You were called by another agent. Do this task yourself."` or `AGENT_CALL_DEPTH` is set. Stay in scope, don't delegate further, and report what you verified and couldn't verify.

Nobody can answer questions mid-task; make the reasonable call on ambiguities and list your assumptions. Stop early only if a missing fact or missing access blocks the work, and name what's missing.

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

Pair `writing` with `unslop` for substantive prose. Other modules to know: `long-work` (multi-stage planning), `ai-features` (evals, caching, model cost), `data-work` (schemas, migrations, SQL), `mobile` (iOS/Android), `explaining`, `statecharts` (draw a flow to judge before coding), `dependency-upgrades`.

Desktop apps (native GUI, not browser): read `agent-desktop` first. Read `t3-preview` before using T3 Code's `preview_*` tools.

## Permission

When I state the outcome I want, you have my permission to do what reaching it takes — including pushing, PRs, deploying, and publishing — without stopping to ask.

Don't shy away from the better path just because it feels risky: my work is in git and you commit as you go, so a bold attempt is cheap to undo.

Still ask before: deleting or overwriting files/data outside git; force-pushing or rewriting pushed history; mutating production data or running production migrations; spending money or raising paid limits; sending messages or posts to other people — unless that action is explicitly what I asked for.

## Engineering

- Preserve user-owned files, data, credentials, and unrelated work (including other agents' edits). Keep secrets out of code, logs, prompts, and replies.
- Use `rg` over `grep`, `fd` over `find`, `ast-grep` for structural search, `jq`/`yq` for data. Keep command output bounded.
- macOS zsh + BSD tools: in-place `sed` is `sed -i ''`, and variables holding a command + args don't word-split (use a function).
- Past ~500 lines, check if a file mixes responsibilities; split only if it makes things clearer.
- Vet new dependencies for necessity, provenance, and maintenance; read docs for the installed version.
- Git: Conventional Commits; `gh` for GitHub. Standing permission to commit as you go on the default branch (don't branch unless asked). Never commit secrets or `.env`. Keep PRs short: **Why** (1–2 bullets), **How** (1–3), **Tests** (commands and results).
- Deploying: ask where to deploy and what cloud specifics (accounts, regions, quotas, credits) to use. Report quotas, full disks, cache issues, or spend limits immediately.
- Apps embedding AI: ask me about caching and economical vs. balanced models before picking.
- Return requested prompts in fenced Markdown.
