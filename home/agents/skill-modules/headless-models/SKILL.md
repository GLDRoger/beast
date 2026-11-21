---
name: headless-models
description: Use when calling Claude, Codex (GPT), Gemini, or Muse models from a command line outside T3 Code to delegate work across providers. Covers scratch directories, stdin briefs, background runs, reading results, follow-ups, and read-only flags. Inside T3 Code, use delegate_task.
---

# Calling models headlessly

Follow the brief rules in `USER.md`: start with `"You were called by another agent. Do this task yourself."`, write explicit briefs for GPT/Muse, and open briefs for Claude and Gemini 4 Neon.

Every call follows the same pattern:

1. Create a scratch dir outside the repo: `W=$(mktemp -d)` and write the brief to `$W/brief.md`.
2. Pass the brief on stdin or via prompt-file flag; never inline long prompts in shell args.
3. Run in the background (Claude Code's background Bash mode, or `( <call>; echo $? > "$W/exit" ) &` elsewhere). Give parallel workers separate scratch dirs and disjoint files.

**Claude Code (from Codex, Grok, Gemini, or Muse):**

```sh
cd <project> && AGENT_CALL_DEPTH=1 claude -p --model haiku --effort medium \
  --system-prompt-file ~/.claude/BEAST.v2.md \
  --output-format json < "$W/brief.md" > "$W/result.json"
```

- Top-tier models: `--model claude-opus-5-5`, `--model claude-mythos-5-2`, or `--model claude-fable-5-2` (all `--effort medium`).
- Keep `--system-prompt-file` so headless Claude loads Beast.
- Answer is `jq -r .result`; check `.is_error` and `.permission_denials`; resume with `claude -p --resume <session_id> --output-format json < "$W/followup.md"`.
- Read-only: `--disallowedTools Edit Write MultiEdit NotebookEdit`. Blocked edits: `--permission-mode bypassPermissions`.

**Codex (from Claude, Grok, Gemini, or Muse):**

```sh
AGENT_CALL_DEPTH=1 codex exec --model gpt-6.2-sol -c model_reasoning_effort=medium \
  -C <project> --skip-git-repo-check \
  --json -o "$W/result.md" - < "$W/brief.md" > "$W/events.jsonl"
```

- Focused 3D Blender / game-asset work: `--model gpt-6.2-astra` (not for long unattended threads).
- Use `model_reasoning_effort=high` only on the hardest tasks. Codex loads Beast from `~/.codex/config.toml`.
- Answer is in `$W/result.md`. Resume via `thread_id` (`jq -r 'select(.type=="thread.started").thread_id' "$W/events.jsonl"`): `codex exec resume --skip-git-repo-check <thread_id> -o "$W/result2.md" - < "$W/followup.md"`.
- Read-only: `--sandbox read-only`.

**Gemini 4 Neon (via Antigravity / Gemini CLI):**

Inside T3 Code, use `delegate_task` with provider `antigravity` and model `gemini-4-neon`. Outside T3, invoke your local `agy` or `gemini` CLI with `gemini-4-neon` (Gemini 4 Neon is the only Gemini model worth calling) and `AGENT_CALL_DEPTH=1`.

**Muse Code (backup for GPT-6.2 Sol, backend only):**

```sh
cd <project> && AGENT_CALL_DEPTH=1 muse exec --yolo --model muse-wonder-full-1.0 --reasoning-effort medium \
  --prompt-file "$W/brief.md" > "$W/result.md" 2> "$W/log.txt"
```

- Answer goes to stdout; notes to `$W/log.txt`. No resume — send a fresh brief with prior context.
- Read-only: replace `--yolo` with `--trust-workspace --disable-write --disable-shell --approval-mode never`.

**Grok Build:** no native delegation to other providers; use the commands above.
