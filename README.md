# Beast

Beast keeps one set of agent instructions and installs it into every coding harness you use: Claude Code, Codex, Grok, Gemini CLI, Antigravity, Muse Code, and Hermes. You edit the text once in this clone, and every harness reads the same words.

It installs three things:

- **A system prompt**, [`home/shared/BEAST.md`](home/shared/BEAST.md): how the agent works, written to hold for any user on any machine.
- **Your standing instructions**, [`home/shared/USER.md`](home/shared/USER.md), installed as the global `CLAUDE.md` / `AGENTS.md`. It covers model routing, how to call each model, skills, and engineering conventions.
- **Skills**: eight workflows (`code`, `frontend`, `writing`, `motion`, `performance`, `security`, `growth`, `media`) and 51 specialist modules that a workflow loads only when a task needs one.

For example, after `beast install`, `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md` are both links to `home/shared/USER.md` in your clone. Change a line there, and the next Claude Code or Codex session reads the new line. Most installed files are links like these, so `git pull` updates them. A few prompts are generated and need a refresh ([Updating](docs/setup.md#updating)).

## Install

You need Node 22 or newer and Git. Keep the clone where you put it, because the installed files link into it.

```sh
git clone https://github.com/GLDRoger/beast.git ~/code/beast
cd ~/code/beast
npm link                  # puts `beast` on your PATH
beast install --dry-run   # shows what would change
beast install             # asks which harnesses and skill packs
beast doctor              # checks the result
```

Then add `source ~/.beast/beast.zsh` to `~/.zshrc` for the launch helpers, such as `c` for Claude Code and `co` for Codex. [Setup](docs/setup.md) covers flags, config edits, Windows, updating, and removal.

## Before you adopt it

`USER.md` is the maintainer's own file. It routes work to specific models, tells agents to commit without asking, and gives standing permission to push, open pull requests, and deploy. Rewrite it before you rely on it ([Make it yours](docs/setup.md#make-it-yours)). The `c` helper also turns off Claude Code's permission prompts.

The benefit is one setup to maintain across your tools; better model output hasn't been measured. Beast makes no network calls, and adds roughly 4,000 tokens of context per session ([Cost and privacy](docs/setup.md#cost-and-privacy)).

## Beast and Jevis

[Jevis](https://github.com/GLDRoger/jevis) is a separate project by the same maintainer. It uses hooks to add short tips at set moments in a session. Beast is the standing text, and Jevis is the timed reminders. Each works without the other. [Beast and Jevis](docs/layers.md) explains how they fit together, how to adopt either or both, and where a new instruction belongs.

## Docs

- [Setup](docs/setup.md): install options, config edits, where each harness loads Beast from, launch helpers, making it yours, updating, removal, and checks.
- [Skills](docs/skills.md): the workflows, the packs, and maintaining the library.
- [Beast and Jevis](docs/layers.md): what each is, adoption paths, and where an instruction belongs.
- [Coding models](docs/models.md): the maintainer's dated tier list and what each top model is good for.

## License

The original tooling and the vendored skills have different terms. See [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md).
