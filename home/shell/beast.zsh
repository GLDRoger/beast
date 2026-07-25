# beast — shell entry points. Source this from ~/.zshrc:
#   source ~/.beast/beast.zsh
#
# Each function launches a CLI with the matching system-prompt override.
# Nothing here touches credentials; auth stays with each tool.

# Claude Code with the BEAST system prompt replacing the default.
c() {
  claude --system-prompt-file "$HOME/.claude/BEAST.v2.md" "$@"
}

# Codex. The system prompt comes from `model_instructions_file` in config.toml,
# not a flag, so this only carries run options.
co() {
  codex "$@" -c model_reasoning_summary_format=experimental
}

# Grok, pointed at the Codex prompt (it has no --system-prompt-file equivalent).
gro() {
  grok --system-prompt-override "read and follow ~/.codex/BEAST.v2.md" --effort max "$@"
}

# ponytail: no --dangerously-skip-permissions / --yolo defaults here on purpose.
# The originals had them; shipping "skip every confirmation" to someone else's
# machine is not a default anyone should inherit. Add per-invocation if you want it.
