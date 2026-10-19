# Setup

## Install options

```sh
beast install                     # pick harnesses and packs interactively
beast install --all               # every harness and pack, no prompts
beast install --harness=claude,codex --packs=core,design,engineering --write-config
beast install --dry-run           # summarise planned links and config edits, write nothing
```

Harnesses: `claude`, `codex`, `grok`, `gemini` (Gemini CLI and Antigravity), `muse`, `hermes`. Packs are listed in [skills.md](skills.md); `core` is always included.

Your choice is saved in `~/.beast/selection.json`, which `beast doctor` and the delegation guide read. `beast install` doesn't reuse it: without flags it asks again, or (non-interactively) detects your CLIs and installs every pack. Repeat your `--harness` and `--packs` flags when you reinstall.

**Config files.** `--write-config` adds what a harness needs to load Beast:

- **Codex:** `model_instructions_file` in `~/.codex/config.toml`, if missing.
- **Grok:** `skills.paths` and `skills.ignore` in `~/.grok/config.toml`, if missing. Existing values are kept even when they differ.
- **Gemini:** sets `context.fileName` to `["GEMINI.md", "AGENTS.md"]` in `~/.gemini/settings.json` and `GEMINI_SYSTEM_MD` in `~/.gemini/.env`, replacing what was there.

TOML edits need Python 3.11+, keep the file's permissions, and are checked to change nothing else. Claude, Muse, and Hermes get no config edits. Non-interactive installs touch config only with `--write-config`; interactive installs ask. `--no-write-config` rules it out.

## Where it lands

| Harness | System prompt | Your instructions | Skills |
|---|---|---|---|
| Claude Code | `~/.claude/BEAST.v2.md`, passed by the `c` helper | `~/.claude/CLAUDE.md` | `~/.claude/skills` |
| Codex | `~/.codex/BEAST.v2.md` via `model_instructions_file` | `~/.codex/AGENTS.md` | `~/.agents/skills` |
| Grok | `~/.grok/AGENT.md`, appended to Grok's own prompt | `~/.grok/AGENTS.md` | `~/.agents/skills` |
| Gemini CLI | `~/.gemini/system.md` (generated) via `GEMINI_SYSTEM_MD` | `~/.gemini/GEMINI.md` | `~/.agents/skills` |
| Antigravity | `~/.gemini/config/AGENTS.md` (generated, both in one file) | (same file) | `~/.gemini/config/skills`, `~/.gemini/antigravity-cli/skills` |
| Muse Code | `run.system_prompt` in `~/.config/muse/settings.json`, written by the `mu` helper | (same field) | `~/.agents/skills` |
| Hermes | `~/.hermes/SOUL.md` (generated) | (same file) | `~/.agents/skills` through `skills.external_dirs`, else `~/.hermes/skills/beast` |

Grok cuts each rules file at 10,000 characters, so keep `BEAST.md` under that. Generated files carry an ownership marker; a hand-written file in their place is backed up, not overwritten.

## Launch helpers

Add `source ~/.beast/beast.zsh` to your `~/.zshrc`:

| Command | Does |
|---|---|
| `c` | Claude Code with the Beast system prompt and permission prompts off (`bypassPermissions`) |
| `co` | Codex with Beast as its base prompt |
| `gro` | Grok at max effort |
| `mu` | Copies Beast and `USER.md` into Muse's settings (needs `jq` and an existing settings file), then launches Muse |
| `gemini`, `agy` | Regenerate the Gemini and Antigravity prompts, then launch |
| `aug` | Auggie with Beast and `USER.md` as rules |

On Windows, dot-source `~/.beast/beast.ps1`. It has `c`, `co`, `gro`, and a `mu` that only launches Muse, without copying the prompt.

`c` is the only helper that turns off confirmations. Launchers that skip the helpers (T3 Code, an IDE) read the same config files; Claude Code's needs `--system-prompt-file ~/.claude/BEAST.v2.md` in its launch arguments.

## Updating

```sh
cd ~/code/beast && git pull
```

Linked files (`BEAST.md`, `USER.md`, skills) update at once; a running session keeps the old text until you start a new one. Generated files don't:

- **Gemini, Antigravity, Hermes:** rerun `beast install` with that harness. The `gemini` and `agy` helpers also regenerate on launch.
- **Muse:** launch through `mu`.
- **Delegation guide:** `beast delegation` refreshes `~/.beast/delegation.md`, which lists your harnesses and the CLIs found on PATH. It doesn't check logins or model access.

Rerun `beast install` when skills are added or removed.

## What install touches

- It links individual files and skill directories into shared roots like `~/.agents/skills`, without replacing the roots, so skills of your own next to Beast's survive.
- A real file or a foreign link in Beast's way is moved to `~/.beast/pre-beast/<original path>` first. If that move fails, the entry is skipped and the install reports failure at the end.
- It removes only links that point into this clone, including links to retired skills (`RETIRED_SKILLS` in `lib/manifest.mjs`). Real directories and other links stay.
- It never touches credentials, sessions, or memories. Configs that hold your own state ship only as examples (`home/*/settings.json.example`, `config.toml.example`).

## Checking it

```sh
beast doctor   # links, configs, duplicate or exposed skills, secrets, and Claude Code's skill-listing budget
beast scan     # skills in the known home roots, Claude plugins, and Codex system skills, with how to retire each
npm test
```

To see what a harness actually loaded: `grok inspect --json`, `muse skills list --source user --json`, or `hermes skills list --enabled-only`.

**Windows:** file symlinks need Developer Mode or an elevated shell; directory links don't. **WSL2:** keep the clone and your home in the Linux filesystem and use the Linux CLIs.
