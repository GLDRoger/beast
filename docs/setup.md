# Setup

## Install options

```sh
beast install                     # interactive harness + pack picker
beast install --all               # everything, no prompts
beast install --harness=claude,codex --packs=core,design,engineering --write-config
beast install --dry-run           # preview without writing
```

Harnesses: `claude`, `codex`, `grok`, `gemini` (Gemini CLI + Antigravity), `muse`, `hermes`. Packs are in [skills.md](skills.md); `core` is always installed.

Your selection is saved in `~/.beast/selection.json` for `beast doctor` and `beast delegation`. `beast install` doesn't reuse it automatically, so repeat your `--harness` and `--packs` flags when reinstalling.

**`--write-config`** adds the minimum config each harness needs:
- **Codex:** `model_instructions_file` in `~/.codex/config.toml` (only if missing).
- **Grok:** `skills.paths` and `skills.ignore` in `~/.grok/config.toml` (only if missing).
- **Gemini:** `context.fileName = ["GEMINI.md", "AGENTS.md"]` in `~/.gemini/settings.json` and `GEMINI_SYSTEM_MD` in `~/.gemini/.env`.

TOML edits need Python 3.11+ and leave everything else untouched. Claude, Muse, and Hermes need no config edits. Pass `--no-write-config` to skip config edits completely.

## Where files land

| Harness | System prompt | Standing instructions | Skills |
|---|---|---|---|
| Claude Code | `~/.claude/BEAST.v2.md` (passed by `c`) | `~/.claude/CLAUDE.md` | `~/.claude/skills` |
| Codex | `~/.codex/BEAST.v2.md` via `model_instructions_file` | `~/.codex/AGENTS.md` | `~/.agents/skills` |
| Grok | `~/.grok/AGENT.md` (appended to Grok's prompt) | `~/.grok/AGENTS.md` | `~/.agents/skills` |
| Gemini CLI | `~/.gemini/system.md` (generated) via `GEMINI_SYSTEM_MD` | `~/.gemini/GEMINI.md` | `~/.agents/skills` |
| Antigravity | `~/.gemini/config/AGENTS.md` (generated, both combined) | (same file) | `~/.gemini/config/skills`, `~/.gemini/antigravity-cli/skills` |
| Muse Code | `run.system_prompt` in `~/.config/muse/settings.json` (written by `mu`) | (same field) | `~/.agents/skills` |
| Hermes | `~/.hermes/SOUL.md` (generated) | (same file) | `~/.agents/skills` via `skills.external_dirs`, else `~/.hermes/skills/beast` |

Keep `BEAST.md` under 10,000 characters — Grok truncates rules files there. Generated files carry a Beast header; any hand-written file in their spot gets backed up to `~/.beast/pre-beast/` instead of overwritten.

## Launch helpers

Add `source ~/.beast/beast.zsh` to `~/.zshrc` (or dot-source `~/.beast/beast.ps1` on Windows):

| Command | Does |
|---|---|
| `c` | Claude Code with Beast as system prompt and `--permission-mode bypassPermissions` |
| `co` | Codex with Beast as base prompt |
| `gro` | Grok at max effort |
| `mu` | Copies Beast + `USER.md` into `~/.config/muse/settings.json` (`run.system_prompt`) via `jq`, then launches Muse (save your old prompt first; Windows `mu` just launches Muse) |
| `gemini`, `agy` | Regenerates Gemini/Antigravity prompts, then launches |
| `aug` | Auggie with Beast and `USER.md` as rules |

Only `c` disables permission prompts. GUI launchers like T3 Code read the same config files; for Claude Code, pass `--system-prompt-file ~/.claude/BEAST.v2.md` in launch args if you want Beast as the system prompt.

## Make it yours

Always edit files in the clone, not the installed links:

- **`home/shared/USER.md`** — my personal rules, model routing, and standing permissions. Rewrite it to fit your models and comfort level.
- **`home/shared/BEAST.md`** — the core operating contract. Keep it universal and under 10,000 characters (for Grok).
- **Skills** — pick packs with `--packs=`, or toggle individuals via `beast skills add <name>` / `beast skills rm <name>`. Your own skills in `~/.agents/skills` are left untouched.
- **Helpers** — edit `home/shell/beast.zsh` / `beast.ps1` (remove `--permission-mode bypassPermissions` from `c` if you want prompts).

Commit your changes on a fork so `git pull` merges cleanly.

## Cost and privacy

- **Context:** `BEAST.md` + `USER.md` are ~19 KB (~4,700 tokens) at session start. Skills only cost a one-line listing until loaded. `beast doctor` checks Claude Code's skill-listing budget.
- **Network & secrets:** Zero network calls, no API keys. `beast doctor` and `bootstrap` scan installed files for accidental secrets.

## Updating

```sh
cd ~/code/beast && git pull
```

Symlinked files update immediately for new sessions. For generated files:
- **Gemini / Antigravity / Hermes:** rerun `beast install` for that harness (`gemini` and `agy` helpers also refresh on launch).
- **Muse:** launch with `mu`.
- **Delegation guide:** run `beast delegation` to refresh `~/.beast/delegation.md`.
- Rerun `beast install` whenever skills are added or removed.

## What install touches

- Symlinks individual files and skill dirs into shared roots (`~/.agents/skills`, etc.) without replacing the directories themselves.
- Moves existing files or foreign links out of the way into `~/.beast/pre-beast/<path>` before linking.
- Only removes symlinks pointing into this clone (including retired skills in `lib/manifest.mjs`).
- Never touches credentials, sessions, or memory. State lives in `~/.beast/` (`selection.json`, `delegation.md`, helpers, `pre-beast/`).

## Removing Beast

Five manual steps, touching only what Beast created:

1. Check and delete symlinks pointing to the clone:
   ```sh
   find ~/.claude ~/.codex ~/.agents ~/.grok ~/.gemini ~/.hermes ~/.beast -type l -lname "$HOME/code/beast/*" 2>/dev/null
   find ~/.claude ~/.codex ~/.agents ~/.grok ~/.gemini ~/.hermes ~/.beast -type l -lname "$HOME/code/beast/*" -delete 2>/dev/null
   ```
2. Delete generated files (`~/.gemini/system.md`, `~/.gemini/config/AGENTS.md`, `~/.hermes/SOUL.md`) after confirming they carry `generated by beast install`.
3. Restore anything you want back from `~/.beast/pre-beast/` (mirrors `$HOME`). If you edited a config file after installing, undo Beast's keys by hand in step 4 instead of overwriting it.
4. Remove Beast's config keys you didn't restore: `model_instructions_file` (`~/.codex/config.toml`), `skills.paths`/`skills.ignore` (`~/.grok/config.toml`), `context.fileName` (`~/.gemini/settings.json`), `GEMINI_SYSTEM_MD` (`~/.gemini/.env`), and `run.system_prompt` (`~/.config/muse/settings.json`).
5. Remove the `source ~/.beast/beast.zsh` (or `beast.ps1`) line, run `npm unlink -g beast-config`, and delete `~/.beast` when done with `pre-beast/`.

## Checking it

```sh
beast doctor   # links, configs, duplicate/stray skills, secrets, Claude skill budget
beast scan     # skills across home roots, Claude plugins, and Codex system skills
npm test
```

Inspect what a harness loaded directly with `grok inspect --json`, `muse skills list --source user --json`, or `hermes skills list --enabled-only`.

**Windows:** file symlinks need Developer Mode or an elevated shell; directory junctions don't. **WSL2:** keep the clone and `$HOME` on the Linux filesystem and use Linux CLIs.
