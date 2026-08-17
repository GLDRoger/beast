# beast — shell entry points. Source this from ~/.zshrc:
#   source ~/.beast/beast.zsh
#
# Each function launches a CLI with the matching system-prompt override.
# Nothing here touches credentials; auth stays with each tool.

# Claude Code with the BEAST system prompt replacing the default, and permission
# prompts off. Of the three harnesses this is the one that stops on every tool call
# by default, which strands the prompt's autonomy instructions. Drop the flag if you
# want the confirmations back.
c() {
  claude --permission-mode bypassPermissions --system-prompt-file "$HOME/.claude/BEAST.v2.md" "$@"
}

# Codex. Carries the system prompt as a -c override, so config.toml needs no edit.
# Verified load-bearing: pointing model_instructions_file at a missing file fails with
# "failed to read model instructions file", so codex genuinely reads it rather than
# accepting the key and ignoring it.
co() {
  codex "$@" \
    -c features.model_instructions_file=true \
    -c model_instructions_file="$HOME/.codex/BEAST.v2.md" \
    -c model_reasoning_summary_format=experimental
}

# Grok. It has no --system-prompt-file equivalent, so it reads the prompt from a path.
# ~/.grok/BEAST.v2.md, not ~/.codex/BEAST.v2.md: the same real file, but under Grok's own
# namespace so a grok-only install still has it. Pointing at the Codex path meant the one
# supported single-harness setup started Grok with no system policy at all.
gro() {
  grok --system-prompt-override "read and follow ~/.grok/BEAST.v2.md" --effort max "$@"
}

# ponytail: co and gro carry no --yolo / --dangerously-bypass-approvals-and-sandbox
# defaults on purpose. The originals had them; shipping "skip every confirmation" to
# someone else's machine is not a default anyone should inherit. c is the one
# exception, scoped to Claude Code's own permission model. Add per-invocation for the
# other two if you want it.
