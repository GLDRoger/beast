# Beast

One agent setup, installed into every coding harness you use: a system prompt, your standing instructions, and a library of skills. Edit it once here, and Claude Code, Codex, Grok, Gemini CLI, Antigravity, Muse Code, and Hermes all pick it up.

- **[`home/shared/BEAST.md`](home/shared/BEAST.md)**, the system prompt: how the agent works, for any user on any machine.
- **[`home/shared/USER.md`](home/shared/USER.md)**, your global `CLAUDE.md` / `AGENTS.md`: model routing, how to call each model, skills, and engineering conventions.
- **Eight workflow skills** (`code`, `frontend`, `writing`, `motion`, `performance`, `security`, `growth`, `media`) and 51 specialist modules they load when a task needs one.

Most of what lands in your home directory is a symlink into this clone, so `git pull` updates it everywhere. A few prompts are generated and need a refresh ([Updating](docs/setup.md#updating)).

## Install

You need Node 22+ and Git. Keep the clone where it is: everything links into it.

```sh
git clone https://github.com/Questili/beast.git ~/code/beast
cd ~/code/beast
npm link                  # puts `beast` on your PATH
beast install --dry-run   # see what would change
beast install             # pick harnesses and packs
beast doctor              # check the result
```

Then add `source ~/.beast/beast.zsh` to your `~/.zshrc` for the launch helpers (`c` for Claude Code, `co` for Codex, and others).

## Where an instruction belongs

| File | Its job | Loaded |
|---|---|---|
| `home/shared/BEAST.md` (system prompt) | How the agent lives: its stance and working principles. True for any user on any machine. | Every session, as the system prompt |
| `home/shared/USER.md` (global `CLAUDE.md` / `AGENTS.md`) | How the work is done here, as given: model routing and briefs, how to call each model, the worker contract, the skill index, engineering and git conventions. | Every session |
| A project's `AGENTS.md` (`CLAUDE.md` is just `@AGENTS.md`) | The specifics of that project: what it is, its goals, commands, architecture, and gotchas. Nothing that is true of every project. | Sessions in that repository |
| Skills (`home/agents/skills`, `skill-modules`) | Workflows and behaviours injected by circumstance. Procedures an agent needs only while doing that kind of task. | When the task calls for them |
| [Jevis](https://github.com/GLDRoger/jevis) tips | Like skills, but injected deterministically by hooks instead of waiting for the model to go and read them. | At a fixed moment |

The full rules, and when Jevis tips arrive, are in [docs/layers.md](docs/layers.md).

## Docs

- [Setup](docs/setup.md): install options, config edits, where each harness loads Beast from, launch helpers, updating, what install touches, and checks.
- [Skills](docs/skills.md): the workflows, the packs, and maintaining the library.
- [Where an instruction belongs](docs/layers.md): which layer a rule goes in.
- [Coding models](docs/models.md): the tier list, and what each top model is good for. Mirrored in Jevis.
