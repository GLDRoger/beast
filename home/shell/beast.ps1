# beast — PowerShell entry points. Dot-source from your profile:
#   . "$HOME\.beast\beast.ps1"
#
# Find your profile with `$PROFILE`; create it if missing:
#   New-Item -ItemType File -Path $PROFILE -Force
#
# POSIX equivalent: beast.zsh. Keep the two in sync — same three commands.
# Nothing here touches credentials; auth stays with each tool.

# Claude Code with the BEAST system prompt replacing the default, and permission
# prompts off. Of the three harnesses this is the one that stops on every tool call
# by default, which strands the prompt's autonomy instructions. Drop the flag if you
# want the confirmations back.
function c {
    claude --permission-mode bypassPermissions --system-prompt-file "$HOME\.claude\BEAST.v2.md" @args
}

# Codex. model_instructions_file makes Beast its base prompt; config.toml normally sets it too.
function co {
    codex -c "model_instructions_file=$HOME\.codex\BEAST.v2.md" @args
}

# Grok appends ~/.grok/AGENT.md (Beast) and AGENTS.md to its native prompt on every launch.
function gro {
    grok --effort max @args
}

# ponytail: co and gro carry no --yolo / --dangerously-bypass-approvals-and-sandbox
# defaults on purpose, matching beast.zsh. c is the one exception, scoped to Claude
# Code's own permission model. Add them per-invocation for the other two if you want.

# Windows note: beast creates junctions for directories (no elevation needed) but
# real symlinks for files, which require Developer Mode or an elevated shell.
# Enable Developer Mode: Settings > System > For developers > Developer Mode.

# Muse Code in a trusted workspace; approvals follow Muse's permissions.default_profile.
# beast.zsh's mu also copies Beast into ~/.config/muse/settings.json (run.system_prompt) first.
function mu {
    muse --trust-workspace @args
}
