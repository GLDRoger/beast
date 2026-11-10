---
name: codex-session-miner
description: Use when asked to analyse past Codex sessions in ~/.codex/sessions for repeated workflows, costly tool patterns, or candidates for new skills and scripts, or to refresh the session reuse analysis. It runs a local script and never loads raw logs into context.
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
