# Beast

One agent setup, installed into every coding harness you use: a system prompt, your standing instructions, and a library of skills. Edit it once here, and Claude Code, Codex, Grok, Gemini CLI, Antigravity, Muse Code, and Hermes all pick it up.

- **[`home/shared/BEAST.md`](home/shared/BEAST.md)**, the system prompt: how the agent works, for any user on any machine.
- **[`home/shared/USER.md`](home/shared/USER.md)**, your global `CLAUDE.md` / `AGENTS.md`: model routing, how to call each model, skills, and engineering conventions.
- **Eight workflow skills** (`code`, `frontend`, `writing`, `motion`, `performance`, `security`, `growth`, `media`), plus a library of 51 specialist modules they load when a task needs one.

Everything in your home directory is a symlink into this clone, so `git pull` updates every harness at once and `git diff` shows exactly what changed.

## What each file holds

Every instruction an agent sees comes from one of five places. Each has one job, and a rule lives in the place whose job it matches. Many things belong nowhere: a line that no model needs to be told is cost without benefit.

| File | Its job | Loaded |
|---|---|---|
| `home/shared/BEAST.md` (system prompt) | How the agent lives: its stance and working principles. True for any user on any machine. | Every session, as the system prompt |
| `home/shared/USER.md` (global `CLAUDE.md` / `AGENTS.md`) | How the work is done here, as given: model routing and briefs, how to call each model, the worker contract, the skill index, engineering and git conventions. | Every session |
| A project's `AGENTS.md` (`CLAUDE.md` is just `@AGENTS.md`) | The specifics of that project: what it is, its goals, commands, architecture, and gotchas. Nothing that is true of every project. | Sessions in that repository |
| Skills (`home/agents/skills`, `skill-modules`) | Workflows and behaviours injected by circumstance. Procedures an agent needs only while doing that kind of task. | When the task calls for them |
| [Jevis](https://github.com/GLDRoger/jevis) tips | Like skills, but injected deterministically by hooks instead of waiting for the model to go and read them. | At a fixed moment, below |

Jevis tips arrive at three kinds of moment:

- **Session start and after compaction:** the session guide, the judgment examples, and the design reminders, including each model family's defaults to avoid. Design reminders live here rather than in the system prompt or `USER.md`, where they had no effect; at session start they reach the first file an agent writes. The `frontend` and `motion` skills keep their task procedures.
- **Every message:** a short reminder of the session guide, the interface-copy line, and the GPT-only corrections. In a session started by another agent, the worker tip replaces all three.
- **A specific moment:** vague feedback and a second vague correction; a `grep` or `find` where `rg` and `fd` fit; a command about to rerun after failing twice; a check about to rerun with nothing changed; a port already in use. Worker sessions get no feedback tips.

Two rules keep the layers consistent:

1. **Repetition is deliberate, contradiction is a bug.** Over a long session a model stops following its system prompt, so a Jevis tip may restate a Beast or `USER.md` rule in fewer words. Some guidance lives only in Jevis: the session guide, the judgment examples, the design reminders, the per-family corrections, and the feedback tips. Everything else a tip says must have a source in another layer, and when a reminder and its source drift apart, the source wins and the reminder is rewritten.
2. **Place a line by asking where it is true.** For anyone: Beast. For this user on every project: `USER.md`. For one project: its `AGENTS.md`. Only while doing one kind of task: a skill. Only at one moment or for one model: Jevis. For no one: delete it.

## Install

You need Node 22+, Git, and at least one supported harness. Keep the clone where it is after installing: everything links into it.

```sh
git clone https://github.com/Questili/beast.git ~/code/beast
cd ~/code/beast
npm link                  # puts `beast` on your PATH (or run node bin/beast.mjs)
beast install --dry-run   # show every link and change, touch nothing
beast install             # pick harnesses and packs interactively
```

Or say exactly what you want:

```sh
beast install --all
beast install --harness=claude,codex --packs=core,design,engineering --write-config
```

Harnesses: `claude`, `codex`, `grok`, `gemini` (Gemini CLI and Antigravity), `muse`, `hermes`. Packs are listed under [Skills](#skills); `core` is always included. Your choice is saved in `~/.beast/selection.json`, so later runs of `beast install` and `beast doctor` use it.

`--write-config` adds the few keys a harness needs to load Beast (below), keeps everything else, backs the file up, and checks the result parses with nothing else changed. Without it, config files aren't touched. TOML edits need Python 3.11+.

## Where it lands

| Harness | System prompt | Your instructions | Skills |
|---|---|---|---|
| Claude Code | `~/.claude/BEAST.v2.md`, passed by the `c` helper | `~/.claude/CLAUDE.md` | `~/.claude/skills` |
| Codex | `~/.codex/BEAST.v2.md` via `model_instructions_file` in `config.toml` | `~/.codex/AGENTS.md` | `~/.agents/skills` |
| Grok | `~/.grok/AGENT.md`, appended to Grok's own prompt | `~/.grok/AGENTS.md` | `~/.agents/skills` |
| Gemini CLI | `~/.gemini/system.md` (generated) via `GEMINI_SYSTEM_MD` | `~/.gemini/GEMINI.md` | `~/.agents/skills` |
| Antigravity | `~/.gemini/config/AGENTS.md` (generated, both files in one) | (same file) | `~/.gemini/config/skills`, `~/.gemini/antigravity-cli/skills` |
| Muse Code | `run.system_prompt` in `~/.config/muse/settings.json`, written by the `mu` helper | (same field) | `~/.agents/skills` |
| Hermes | `~/.hermes/SOUL.md` (generated) | (same file) | `~/.agents/skills` through `skills.external_dirs`, else `~/.hermes/skills/beast` |

The 51 modules live in `~/.agents/skill-modules/`, which no harness scans, so they cost nothing until a workflow or `USER.md` points an agent at one. Only the eight workflows are discoverable.

Grok cuts each rules file at 10,000 characters, so keep `BEAST.md` under that. Generated files carry ownership markers: a hand-written file in their place is backed up, never overwritten.

## Launch helpers

Add `source ~/.beast/beast.zsh` to your `~/.zshrc` (on Windows, the installed `beast.ps1`):

| Command | Does |
|---|---|
| `c` | Claude Code with the Beast system prompt and permission prompts off (`bypassPermissions`) |
| `co` | Codex with Beast as its base prompt |
| `gro` | Grok at max effort |
| `mu` | Copies Beast and `USER.md` into Muse's settings, then launches Muse |
| `gemini`, `agy` | Regenerate the Gemini and Antigravity prompts, then launch |
| `aug` | Auggie with Beast and `USER.md` as rules |

`c` is the only helper that turns off confirmations. Drop the flag if you want them back. Launchers that don't go through these helpers (T3 Code, an IDE) read the same config files; Claude Code's needs `--system-prompt-file ~/.claude/BEAST.v2.md` in its launch arguments.

## Updating

```sh
cd ~/code/beast && git pull
```

Linked files update immediately; a session already running keeps the old text until you start a new one. Generated prompts need a refresh: the `gemini`, `agy`, and `mu` helpers do it on launch, otherwise run `beast install` again. Rerun `beast install` too when skills are added or removed. `beast delegation` refreshes `~/.beast/delegation.md` (which agents and models this machine can reach) without reinstalling anything.

## Skills

Each workflow owns one kind of outcome and loads modules only when the task needs them. `beast skills` lists them; `beast install --packs=...` chooses which modules to install.

| Pack | Modules | For |
|---|---:|---|
| `core` | 8 | The eight workflows (always installed) |
| `design` | 12 | Visual and interaction craft, Lottie, 3D scenes, canvas films |
| `prose` | 8 | Writing cleanup, explaining, docs, changelogs, outreach |
| `product` | 8 | Positioning, pricing, discoverability, validation |
| `engineering` | 18 | Architecture, review, planning, data, AI features, mobile, upgrades |
| `tooling` | 5 | Agent and runtime diagnostics, headless model calls |

Skills that were retired or renamed are listed in `RETIRED_SKILLS` in `lib/manifest.mjs`, so a reinstall removes stale copies instead of bringing them back. Skills that belong to one product live in that product's repository, not here.

## What install touches

- It links files one by one, never whole directories, so private skills you keep next to Beast's survive.
- A real file or a foreign link in Beast's way is moved to `~/.beast/pre-beast/<original path>` first. If it can't be backed up, the install stops.
- It removes only links that point into this clone.
- It never touches credentials, sessions, memories, or Claude's `settings.json`. Configs that hold your own state ship only as examples (`home/*/settings.json.example`, `config.toml.example`).

## Checking it

```sh
beast doctor   # links, config keys, duplicate or exposed skills, secrets, and how much skill listing each harness pays for
beast scan     # every skill source on this machine, including ones Beast doesn't own, and how to retire each
npm test
```

To see what a harness actually loaded: `grok inspect --json`, `muse skills list --source user --json`, or `hermes skills list --enabled-only`.

**Windows:** file symlinks need Developer Mode or an elevated shell; directory links don't. **WSL2:** keep the clone and your home in the Linux filesystem and use the Linux CLIs.

## Maintaining

- `npm run notice -- --strict` must pass before publishing. [`NOTICE.md`](NOTICE.md) records where vendored skills came from and under what terms; `LICENSE` explains the split between original tooling and vendored material.
- `npm run scrub` applies the scrub rules (rewrites that remove private details) to the payload in place.
- `node scripts/bootstrap.mjs --force` pulls changes from a live installation back into this repository through a scrubbed, scanned copy. Read the diff before committing.
