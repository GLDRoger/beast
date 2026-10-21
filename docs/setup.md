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
| `mu` | Replaces `run.system_prompt` in `~/.config/muse/settings.json` with Beast and `USER.md`, then launches Muse. Save your previous prompt first: no backup is kept. Needs `jq`; if the settings file doesn't exist, it silently skips the copy. |
| `gemini`, `agy` | Regenerate the Gemini and Antigravity prompts, then launch |
| `aug` | Auggie with Beast and `USER.md` as rules |

On Windows, dot-source `~/.beast/beast.ps1`. It has `c`, `co`, `gro`, and a `mu` that only launches Muse, without copying the prompt.

`c` is the only helper that turns off confirmations. Launchers that skip the helpers (T3 Code, an IDE) read the same config files; Claude Code's needs `--system-prompt-file ~/.claude/BEAST.v2.md` in its launch arguments.

## Make it yours

Edit the files in your clone, never the installed links: the links point back into the clone, and a generated file is overwritten on the next install.

- **`home/shared/USER.md`** is the maintainer's own instruction file. Rewrite it before you rely on it. Its routing table names models you may not have, and it gives standing permission to commit without asking, push, open pull requests, and deploy. Keep whatever holds for you, delete the rest, and keep the sections in the order [Beast and Jevis](layers.md#where-an-instruction-belongs) describes.
- **`home/shared/BEAST.md`** is meant to hold for any user. Change it only for something that's true of every task. Grok cuts each rules file at 10,000 characters.
- **Skills:** choose packs at install (`--packs=`), or add and remove single skills with `beast skills add <name>` and `beast skills rm <name>`. Your own skills can sit next to Beast's in `~/.agents/skills`, and install leaves them alone.
- **Helpers:** `home/shell/beast.zsh` and `beast.ps1` are ordinary shell functions. To keep Claude Code's permission prompts, remove `--permission-mode bypassPermissions` from `c`.

To keep your changes under version control, commit them in your clone or on a fork. `git pull` then merges upstream changes into your version.

## Cost and privacy

- **Context:** `BEAST.md` and `USER.md` together are about 16 KB of text, roughly 4,000 tokens, read at the start of every session. Each installed skill adds a one-line listing; its full text is read only when a task uses it. `beast doctor` checks Claude Code's skill-listing budget.
- **Network:** Beast makes no network calls and needs no API keys. Your harness talks to its model provider as usual.
- **Secrets:** `beast doctor` looks for secrets in the installed files, and `bootstrap` scans for them before copying a live setup back into the repository.

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
- It writes its own state to `~/.beast/`: `selection.json`, `delegation.md`, the shell helpers, and `pre-beast/` for anything it moved aside.

## Removing Beast

There's no uninstall command. Removing Beast by hand takes five steps. Each one touches only what Beast created.

1. **List the links into the clone,** then delete them once the list looks right:

   ```sh
   find ~/.claude ~/.codex ~/.agents ~/.grok ~/.gemini ~/.hermes ~/.beast -type l -lname "$HOME/code/beast/*" 2>/dev/null
   find ~/.claude ~/.codex ~/.agents ~/.grok ~/.gemini ~/.hermes ~/.beast -type l -lname "$HOME/code/beast/*" -delete 2>/dev/null
   ```

   Use your clone's path if it isn't `~/code/beast`.
2. **Delete the generated files**: `~/.gemini/system.md`, `~/.gemini/config/AGENTS.md`, and `~/.hermes/SOUL.md`. Before deleting each one, check that its first lines contain `generated by beast install`.
3. **Restore anything Beast moved aside.** `~/.beast/pre-beast/` mirrors paths under your home folder, so `~/.beast/pre-beast/.claude/CLAUDE.md` goes back to `~/.claude/CLAUDE.md`. Config files that `--write-config` edited are kept there as they were before the first edit. Restoring one of those replaces any changes you made since, so if you've edited the file since then, remove Beast's keys by hand instead (step 4).
4. **Undo only Beast's config changes in any file you didn't restore.** Compare against `pre-beast/` and keep pre-existing or later custom values: Codex/Grok keys already present were left alone. Check `model_instructions_file` in `~/.codex/config.toml`; `skills.paths` and `skills.ignore` in `~/.grok/config.toml`; `context.fileName` in `~/.gemini/settings.json`; and `GEMINI_SYSTEM_MD` in `~/.gemini/.env`. If you launched Muse through `mu`, restore `run.system_prompt` from your own copy (Muse prompts aren't backed up), or remove it only if you didn't have one.
5. **Remove the `source ~/.beast/beast.zsh` line** from `~/.zshrc`, or the `beast.ps1` line from your PowerShell profile. Run `npm unlink -g beast-config`. Delete `~/.beast` once you no longer need anything in `pre-beast/`.

## Checking it

```sh
beast doctor   # links, configs, duplicate or exposed skills, secrets, and Claude Code's skill-listing budget
beast scan     # skills in the known home roots, Claude plugins, and Codex system skills, with how to retire each
npm test
```

To see what a harness actually loaded: `grok inspect --json`, `muse skills list --source user --json`, or `hermes skills list --enabled-only`.

**Windows:** file symlinks need Developer Mode or an elevated shell; directory links don't. **WSL2:** keep the clone and your home in the Linux filesystem and use the Linux CLIs.
