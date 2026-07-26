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

# Codex. Carries the system prompt as a -c override, so config.toml needs no edit.
function co {
    codex @args `
      -c features.model_instructions_file=true `
      -c "model_instructions_file=$HOME\.codex\BEAST.v2.md" `
      -c model_reasoning_summary_format=experimental
}

# Grok. It has no --system-prompt-file equivalent, so it reads the prompt from a path.
# ~/.grok/BEAST.v2.md is the same real file as the Codex prompt, under Grok's own
# namespace, so a grok-only install has it.
function gro {
    grok --system-prompt-override "read and follow ~/.grok/BEAST.v2.md" --effort max @args
}

# ponytail: no --dangerously-skip-permissions / --yolo defaults here on purpose,
# matching beast.zsh. Add them per-invocation if you want them.

# Windows note: beast creates junctions for directories (no elevation needed) but
# real symlinks for files, which require Developer Mode or an elevated shell.
# Enable Developer Mode: Settings > System > For developers > Developer Mode.
