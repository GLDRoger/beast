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

# Codex. model_instructions_file makes Beast its base prompt. config.toml normally sets it
# too (every launcher, including T3 Code, reads that); the -c keeps `co` correct without it.
co() {
  codex -c model_instructions_file="$HOME/.codex/BEAST.v2.md" "$@"
}

# Grok. It has no prompt-file flag; it appends ~/.grok/AGENT.md (Beast) and AGENTS.md to its
# native prompt on every launch, T3 Code included, so this only sets effort.
gro() {
  grok --effort max "$@"
}

# ponytail: co and gro carry no --yolo / --dangerously-bypass-approvals-and-sandbox
# defaults on purpose. The originals had them; shipping "skip every confirmation" to
# someone else's machine is not a default anyone should inherit. c is the one
# exception, scoped to Claude Code's own permission model. Add per-invocation for the
# other two if you want it.

# Muse Code. It takes its system prompt as text in settings.json (run.system_prompt), not as a
# file, so mu copies Beast in before each launch; T3 Code's `muse serve` reads the same settings.
# Approvals and sandboxing follow Muse's own permissions.default_profile; mu only trusts the
# workspace so its rules, skills, and delegation load.
typeset -g _BEAST_PROMPT="${${(%):-%x}:A:h:h}/shared/BEAST.md"
beast_muse_sync() {
  local s="$HOME/.config/muse/settings.json" t
  [[ -f $s && -f $_BEAST_PROMPT ]] || return 0
  [[ "$(jq -r '.run.system_prompt // ""' "$s")" == "$(<"$_BEAST_PROMPT")" ]] && return 0
  t="$s.beast-tmp"
  jq --rawfile sp "$_BEAST_PROMPT" '.run.system_prompt = $sp' "$s" > "$t" && mv "$t" "$s"
}
mu() {
  beast_muse_sync
  muse --trust-workspace "$@"
}
