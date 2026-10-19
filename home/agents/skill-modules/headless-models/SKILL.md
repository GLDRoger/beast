---
name: headless-models
description: Call Claude, Codex (GPT), or Muse models headlessly from a CLI, outside T3 Code: scratch directory, brief on stdin, background runs, reading results, follow-ups, and read-only flags. Use when delegating across providers without T3's delegate_task.
---

# Calling models headlessly

Briefs follow the rules in the user's instruction file (`~/.claude/CLAUDE.md` / `~/.codex/AGENTS.md`): open with "You were called by another agent. Do this task yourself.", explicit for GPT and Muse, open for Claude.

Every call follows the same steps:

1. Make a scratch directory outside the repo: `W=$(mktemp -d)`. Write the brief to `$W/brief.md`, following the brief rules.
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
