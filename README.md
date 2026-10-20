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

Put each line in the one layer where it's true.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/media/layers-dark.png">
  <img src="docs/media/layers-light.png" width="900" alt="Where each kind of instruction lives. For anyone: Beast, the system prompt. For you on every project: USER.md. For one project: its AGENTS.md. During one kind of task: skills. At one moment or for one model: Jevis tips, at session start, on every message, or at a specific moment. For no one: delete it.">
</picture>

The rules, and when Jevis tips arrive, are in [docs/layers.md](docs/layers.md).

## Docs

- [Setup](docs/setup.md): install options, config edits, where each harness loads Beast from, launch helpers, updating, what install touches, and checks.
- [Skills](docs/skills.md): the workflows, the packs, and maintaining the library.
- [Where an instruction belongs](docs/layers.md): which layer a rule goes in.
- [Coding models](docs/models.md): the tier list, and what each top model is good for. Mirrored in Jevis.
