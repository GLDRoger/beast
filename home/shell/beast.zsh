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
# file, so mu copies Beast and USER.md in before each launch; T3 Code's `muse serve` reads the same settings.
# Approvals and sandboxing follow Muse's own permissions.default_profile; mu only trusts the
# workspace so its rules, skills, and delegation load.
typeset -g _BEAST_PAYLOAD="${${(%):-%x}:A:h:h}"
typeset -g _BEAST_ROOT="${_BEAST_PAYLOAD:h}"
typeset -g _BEAST_PROMPT="$_BEAST_PAYLOAD/shared/BEAST.md"
typeset -g _BEAST_USER="$_BEAST_PAYLOAD/shared/USER.md"
beast_muse_sync() {
  local s="$HOME/.config/muse/settings.json" t prompt mode
  [[ -f $s && -f $_BEAST_PROMPT && -f $_BEAST_USER ]] || return 0
  prompt="$(<"$_BEAST_PROMPT")"$'\n\n'"$(<"$_BEAST_USER")"
  [[ "$(jq -r '.run.system_prompt // ""' "$s")" == "$prompt" ]] && return 0
  mode="$(stat -f %Lp "$s" 2>/dev/null)" || mode="$(stat -c %a "$s")" || return 1
  t="$(mktemp "$s.beast-tmp.XXXXXX")" || return 1
  # jq computes the same two-newline join, without carrying source trailing newlines.
  if jq --rawfile sp "$_BEAST_PROMPT" --rawfile up "$_BEAST_USER" \
    '.run.system_prompt = (($sp | sub("\\n+$"; "")) + "\n\n" + ($up | sub("\\n+$"; "")))' \
    "$s" > "$t" && chmod "$mode" "$t" && mv "$t" "$s"; then
    return 0
  fi
  rm -f -- "$t"
  return 1
}
mu() {
  beast_muse_sync || return
  muse --trust-workspace "$@"
}

# Gemini's base prompt and Antigravity's global rules are composed files, not
# independent hand copies. Refresh before shell launches after a repository update.
beast_gemini_sync() {
  node "$_BEAST_ROOT/lib/gemini.mjs"
}
gemini() {
  beast_gemini_sync || return
  GEMINI_SYSTEM_MD="$HOME/.gemini/system.md" command gemini "$@"
}
agy() {
  beast_gemini_sync || return
  command agy "$@"
}

# ~/.zshrc may still declare the old aug alias before sourcing this file.
# Unalias first so zsh parses the function definition without expanding it.
unalias aug 2>/dev/null
aug() {
  auggie --rules "$_BEAST_PROMPT" --rules "$_BEAST_USER" "$@"
}
