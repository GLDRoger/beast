# beast — PowerShell entry points. Dot-source from your profile:
#   . "$HOME\.beast\beast.ps1"
#
# Find your profile with `$PROFILE`; create it if missing:
#   New-Item -ItemType File -Path $PROFILE -Force
#
# POSIX equivalent: beast.zsh. Keep the two in sync — same three commands.
# Nothing here touches credentials; auth stays with each tool.

# Claude Code with the BEAST system prompt replacing the default.
function c {
    claude --system-prompt-file "$HOME\.claude\BEAST.v2.md" @args
}

# Codex. Its system prompt comes from `model_instructions_file` in config.toml,
# not a flag, so this only carries run options.
function co {
    codex @args -c model_reasoning_summary_format=experimental
}

# Grok, pointed at the Codex prompt (it has no --system-prompt-file equivalent).
function gro {
    grok --system-prompt-override "read and follow ~/.codex/BEAST.v2.md" --effort max @args
}

# ponytail: no --dangerously-skip-permissions / --yolo defaults here on purpose,
# matching beast.zsh. Add them per-invocation if you want them.

# Windows note: beast creates junctions for directories (no elevation needed) but
# real symlinks for files, which require Developer Mode or an elevated shell.
# Enable Developer Mode: Settings > System > For developers > Developer Mode.
