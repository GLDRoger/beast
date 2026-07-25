---
name: codex-session-miner
description: "Analyze historical Codex session JSONL logs to find repeated workflows, expensive tool patterns, reusable skill candidates, and script/globalization opportunities without loading raw transcripts into context. Use when asked to inspect sessions, optimize repeated Codex work, or refresh the session reuse analysis."
---

# Codex Session Miner

Use the script; do not reimplement JSONL parsing in-chat.

## Command

```bash
~/.codex/scripts/session_miner.py \
  --sessions ~/.codex/sessions \
  --output ~/.codex/session-miner-latest.json
```

Add `--format json` when another script should consume the result.

## Workflow

1. Run the script first.
2. Read only the generated aggregate JSON or text summary.
3. Look for:
   - top CWDs and repeated repo contexts
   - repeated exact commands
   - large tool outputs
   - repeated patch/file surfaces
   - topic clusters that should become skills
4. Recommend or create durable assets:
   - Python scripts for deterministic recurring work
   - skills for procedural/runbook knowledge
   - short global instructions only for universal behavior

## Guardrails

- Do not load raw multi-GB session logs into model context.
- Prefer aggregate counts and samples over transcript excerpts.
- If updating the analysis artifact, write to `~/.codex/session-reuse-globalization-analysis.md`.
