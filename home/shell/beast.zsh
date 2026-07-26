# beast — shell entry points. Source this from ~/.zshrc:
#   source ~/.beast/beast.zsh
#
# Each function launches a CLI with the matching system-prompt override.
# Nothing here touches credentials; auth stays with each tool.

# Claude Code with the BEAST system prompt replacing the default.
c() {
  claude --system-prompt-file "$HOME/.claude/BEAST.v2.md" "$@"
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

# Grok, pointed at the Codex prompt (it has no --system-prompt-file equivalent).
gro() {
  grok --system-prompt-override "read and follow ~/.codex/BEAST.v2.md" --effort max "$@"
}

# ponytail: no --dangerously-skip-permissions / --yolo defaults here on purpose.
# The originals had them; shipping "skip every confirmation" to someone else's
# machine is not a default anyone should inherit. Add per-invocation if you want it.
