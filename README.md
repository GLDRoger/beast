# Beast

One set of coding-agent instructions, symlinked into every harness I use: Claude Code, Codex, Grok, Gemini CLI, Antigravity, Muse Code, and Hermes. Edit a file once here and every harness picks it up.

It installs three things:

- **System prompt** ([`home/shared/BEAST.md`](home/shared/BEAST.md)): how I want agents to think and work — tool-agnostic, no personal preferences.
- **Standing instructions** ([`home/shared/USER.md`](home/shared/USER.md)): installed as global `CLAUDE.md` / `AGENTS.md`. My model routing, brief rules, skills index, permissions, and git/engineering conventions.
- **Skills**: 8 core workflows (`code`, `frontend`, `writing`, `motion`, `performance`, `security`, `growth`, `media`) plus 48 specialist modules loaded only when a workflow needs them.

Most installed files are symlinks back to this clone (for example, `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md` both resolve to `home/shared/USER.md`), so `git pull` updates them immediately. Generated prompts (Gemini, Antigravity, Hermes) just need a quick refresh ([Updating](docs/setup.md#updating)).

## Install

Needs Node 22+ and Git. Keep the clone where you put it since the symlinks point here.

```sh
git clone https://github.com/GLDRoger/beast.git ~/code/beast
cd ~/code/beast
npm link                  # puts `beast` on your PATH
beast install --dry-run   # preview changes
beast install             # pick harnesses and skill packs
beast doctor              # verify links and configs
```

Add `source ~/.beast/beast.zsh` to `~/.zshrc` for the shell shortcuts (`c` for Claude Code, `co` for Codex, etc.). See [Setup](docs/setup.md) for flags, Windows, updating, and uninstalling.

## Make it yours

`USER.md` is my personal setup: it routes to my models, gives agents standing permission to commit, push, open PRs, and deploy, and `c` runs Claude Code with permission prompts off (`bypassPermissions`). Edit `USER.md` and `home/shell/beast.zsh` to match how you actually work ([Make it yours](docs/setup.md#make-it-yours)).

Beast makes zero network calls and adds ~4,700 tokens of session-start context.

## Beast + Jevis

[Jevis](https://github.com/GLDRoger/jevis) is my companion hook project. Beast is the standing text; Jevis injects short reminders at specific moments in a session. Each works on its own. [Beast and Jevis](docs/layers.md) explains how I split instructions between them.

## Docs

- [Setup](docs/setup.md) — install flags, config edits, file map, shell helpers, updating, and removal.
- [Skills](docs/skills.md) — workflows, packs, and library maintenance.
- [Beast and Jevis](docs/layers.md) — how Beast and Jevis fit together and where any rule belongs.
- [Coding models](docs/models.md) — my current model tier list and what each model is actually good for.

## License

Original tooling and vendored skills carry separate terms — see [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md).
