# User preferences

Beast is the operating contract. This file adds model routing, skills, and engineering conventions. It is self-contained: everything needed to delegate is here.

## Model routing

Routing applies to substantive work: more than a few minutes, or more than a couple of files. Small lookups, single commands, and edits tightly coupled to what you already hold stay with you. Questions the user asks you directly are yours to answer.

Route by what the work produces:

| Work | Model | Effort |
|---|---|---|
| Research and exploration: codebase search, docs, web research, gathering facts | Haiku 5.5 | medium |
| Long or multi-step check runs: full test suites, builds, end-to-end or simulated sessions | Haiku 5.5 or GPT-6 Luna | low |
| Code outside the UI: APIs, data, infrastructure, scripts, tests, tooling, configuration, debugging, refactors | GPT-6.1 Sol | high |
| User-facing code: UI components, pages, interaction, in-product copy | Opus 5.5 or Muse Wonder | high |
| 3D, WebGL, motion, and animation | Opus 5.5 only | high |
| Reviews, analysis, and verdicts on work by Opus, Muse, or Haiku | GPT-6.1 Sol | high |
| Reviews of Sol's work | Opus 5.5 | high |
| Reviews of the most important changes, spanning many files of different kinds, including Sol's | GPT-6 Astra | high |

Briefs:

- Every brief, by any route, opens with "You were called by another agent. Do this task yourself."
- GPT and Muse workers (Sol, Astra, Luna, Muse Wonder) get direct, explicit briefs: exact files, exact commands, the expected output, and what done means. Leave them nothing to guess.
- Claude workers (Opus, Haiku) take more open briefs well: building from scratch, or finding a direction in ambiguous or design work. Give them the goal and constraints and let them choose the approach.
- Verification workers run the named checks and report exact results. They do not fix anything. Their report counts as the verification run; you still read the diff and spot-check the evidence.

Routing rules:

- When you are the routed model, do the work yourself; spawn a worker of your own model only for parallel or context-heavy pieces.
- Opus 5.5 and Muse Wonder share user-facing code at equal priority. Use the one native to your harness; from Codex or Grok, use either, and split parallel user-facing work across both. 3D and animation go to Opus only.
- A reviewer is never the author's model: an independent model catches what the author's own tests passed.
- Split mixed tasks along the boundary: Sol builds the API, Opus builds the screen that calls it. Give each worker its own files.
- Raise effort to xhigh for hard debugging, security-sensitive changes, and Astra reviews.
- If a routed model fails (auth, rate limit, outage), retry once, then fall back: Sol, Opus, and Muse Wonder cover for one another; Sol covers for Astra, except on Sol's own work, where Opus does; Haiku and Luna cover for each other. If 3D or animation work cannot reach Opus, tell the user. When you are the fallback, do the work yourself. Tell the user which model did the work.

## Calling each model

### Inside T3 Code

When `t3-code` MCP tools are available (`delegate_task`, `orchestrator_capabilities`; names may carry a prefix such as `mcp__t3-code__`), T3 manages delegation. Call `orchestrator_capabilities` for the live provider and model IDs, choose the model from the routing table, and hand the work to `delegate_task` with a brief written as above. Do not shell out to the CLIs below: T3 tracks, shows, and resumes its delegated tasks. Native subagents stay fine for same-provider work.

### Native subagents

- **Claude Code:** the Agent tool with `model: "haiku"` or `model: "opus"`.
- **Codex:** `spawn_agent` with `model: "gpt-6.1-sol"`, `"gpt-6-astra"`, or `"gpt-6-luna"` and `reasoning_effort`.
- **Muse Code:** its native subagent tool, for Muse models.

### Headless CLIs (outside T3, across providers)

Every call follows the same steps:

1. Make a scratch directory outside the repo: `W=$(mktemp -d)`. Write the brief to `$W/brief.md`, following the brief rules above.
2. Pass the brief on standard input, or through the CLI's prompt-file option where it has one; never inline it in the command.
3. Calls take seconds to tens of minutes. Run them in the background: in Claude Code use the Bash tool's background mode; elsewhere wrap the call as `( <call>; echo $? > "$W/exit" ) &` and poll for `$W/exit`. Parallel workers each get their own scratch directory and disjoint files.

**Claude Code, from Codex, Grok, or Muse Code.** Claude has no `--cd`, so run it from the project directory:

```sh
cd <project> && AGENT_CALL_DEPTH=1 claude -p --model haiku --effort medium \
  --system-prompt-file ~/.claude/BEAST.v2.md \
  --output-format json < "$W/brief.md" > "$W/result.json"
```

- Opus: `--model claude-opus-5-5 --effort high`.
- Keep `--system-prompt-file`; without it headless Claude runs a generic prompt instead of Beast.
- `jq -r .result` is the answer. `.is_error` flags failure, `.permission_denials` lists blocked actions, and `.session_id` continues the conversation.
- Follow up with full context from the same directory: `claude -p --resume <session_id> --output-format json < "$W/followup.md"`.
- Read-only work: add `--disallowedTools Edit Write MultiEdit NotebookEdit`. Editing work blocked by permission denials: rerun with `--permission-mode bypassPermissions`.

**Codex, from Claude Code, Grok, or Muse Code.**

```sh
AGENT_CALL_DEPTH=1 codex exec --model gpt-6.1-sol -c model_reasoning_effort=high \
  -C <project> --skip-git-repo-check \
  --json -o "$W/result.md" - < "$W/brief.md" > "$W/events.jsonl"
```

- Astra: `--model gpt-6-astra`. Luna: `--model gpt-6-luna -c model_reasoning_effort=low`. Codex loads Beast and this file from its own config; no prompt flag is needed.
- `$W/result.md` is the answer. A nonzero exit or an empty file means failure; read the end of `events.jsonl`.
- The thread ID: `jq -r 'select(.type=="thread.started").thread_id' "$W/events.jsonl"`. Follow up with full context from the project directory: `codex exec resume --skip-git-repo-check <thread_id> -o "$W/result2.md" - < "$W/followup.md"`.
- Read-only work: add `--sandbox read-only`. The default config already allows edits.

**Muse Code, from Claude Code, Codex, or Grok.**

```sh
cd <project> && AGENT_CALL_DEPTH=1 muse exec --yolo --model muse-wonder-1.0 --reasoning-effort high \
  --prompt-file "$W/brief.md" > "$W/result.md" 2> "$W/log.txt"
```

- Standard output is the answer; Muse's notes go to `$W/log.txt`. A nonzero exit means failure.
- Muse loads Beast and this file from its own settings; no prompt flag is needed.
- Headless runs cannot resume. For a follow-up, send a new brief that carries the earlier result.
- Read-only work: replace `--yolo` with `--trust-workspace --disable-write --disable-shell --approval-mode never`. `--disable-write` alone still lets the shell write.

**Grok Build** has no native route to these models; use the commands above for every model.

## When you are the worker

You are a worker when your brief opens with "You were called by another agent. Do this task yourself." or `AGENT_CALL_DEPTH` is set in your environment. Do the assigned task directly within its scope, do not delegate further, and return the requested result with what you verified and what you could not.

Nobody can answer questions mid-task, and this takes precedence over any guidance to ask the user or leave a decision to them. Make the reasonable call where the brief is unclear and list those assumptions in your result. Stop early only when a missing fact or missing access blocks the task, and say exactly what is missing.

## Skills

Before non-trivial work, read the `SKILL.md` of the workflow that owns the outcome. Specialist modules live at `~/.agents/skill-modules/<name>/SKILL.md`; load one only when its procedure helps.

| Outcome | Workflow, at `~/.agents/skills/<name>/SKILL.md` |
|---|---|
| Product UI, responsive implementation | `frontend` |
| Application logic, bugs, APIs, refactors, verification | `code` |
| Prose, documentation, UI copy, outreach | `writing` |
| Interaction motion and animation | `motion` (with `taste-craft`, `review-animations`, `scroll-scenes`, `3d-scenes`) |
| Speed, jank, stability | `performance` |
| Authentication, authorization, secrets, defensive controls | `security` |
| Ideas, product decisions, pricing, distribution | `growth` |
| Video, images, audio, captions | `media` |

Pair `writing` with the `unslop` module for substantive prose.

## Permission

When I state the outcome I want, you have my permission to do whatever reaching it takes, including pushing, opening pull requests, deploying, and publishing. Keep going until the outcome is reached instead of stopping to ask; stop only when you are blocked or the work would go well beyond what I asked.

## Engineering

- Preserve user-owned files, data, credentials, and unrelated work, including other agents' edits in progress. Keep secrets out of code, logs, prompts, and responses.
- Use `rg` instead of `grep` and `fd` instead of `find`; `ast-grep` for structural code search, `jq`/`yq` for data. Keep command output bounded.
- A file past ~500 lines prompts a check for mixed responsibilities; split only when that makes it clearer.
- New dependencies need necessity, provenance, and maintenance checked. Read docs for the installed version.
- Git: Conventional Commits; `gh` for GitHub. Commit without asking: this is standing authorization. Checkpoint working, verified states as you go and before large or risky changes, so work never sits uncommitted for long. Committing directly on the default branch is fine; do not create a branch first unless asked. Never commit secrets or `.env` files. Pull requests stay short: **Why** (1–2 bullets), **How** (1–3), **Tests** (commands and results).
- Write requested prompts in Markdown, fenced when returned in chat.
