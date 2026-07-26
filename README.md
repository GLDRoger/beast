# beast

**A curated agent setup for Claude Code, Codex, and Grok Build.**

The default system prompts supplied by agent harnesses are too weak for serious,
long-running work. Many users have no skill files at all. Others install every skill
and plugin they find, filling the model's context with overlapping instructions.

beast aims for the useful middle: a strong system prompt, a small active set of routing
skills, and a larger library loaded only when the work needs it. The same configuration
works across all three harnesses and stays in one git repo.

This setup has been tested in real work with **GPT-5.6 Sol**, **GPT-5.6 Terra**,
**Claude Fable 5**, **Claude Opus 5**, **Kimi K3**, and **Grok 4.5**, Any model scoring higher than 51 on Artificial Analysis's intelligence index will work[https://artificialanalysis.ai/?cost=cost-per-task&total-cost=intelligence-vs-compute&speed=intelligence-vs-speed&intelligence=artificial-analysis-intelligence-index&intelligence-category=text-only-vs-multimodal&model-creators=xai%2Copenai&coding-agents=cost&agents=codex-gpt-5-6-luna-xhigh%2Ccodex-gpt-5-6-luna-none%2Ccodex-gpt-5-6-luna-medium%2Ccodex-gpt-5-6-luna-low%2Ccodex-gpt-5-6-luna-high%2Ccodex-gpt-5-6-luna-max%2Cgrok-build-grok-4-5-high#intelligence-tabs].

```text
Claude Code ─┐
Codex ───────┼── beast prompt ── 9 routers ── 27 active skills ── 92-module library
Grok ────────┘
Kimi─────────┘
```

## What changes

|                         | Default harness setup                     | With beast                                                     |
|-------------------------|-------------------------------------------|----------------------------------------------------------------|
| System prompt           | Vendor default, tuned for broad appeal    | ~2,650 tokens on scope, verification, safety rails, handoffs    |
| Skills visible          | None, or everything you ever installed    | 27 active, hard cap of 30                                      |
| Skills available        | Whatever you remember installing          | 92-module library, loaded only when a router calls for it       |
| Always-on skill cost    | Zero, or unbounded and unmeasured         | ~1,590 tokens, 0.8% of a 200k window                           |
| Standing policy         | One file per tool, drifting apart         | One file, shared by all three harnesses                        |
| Noticing config drift   | When something breaks                     | `git diff` and `beast doctor`                                  |

### Measured on the machine beast was extracted from

Not projections. These are the specific defects that existed before the config was
consolidated, and they are why beast is shaped the way it is:

- **Standing policy existed in four copies.** Two were byte-identical but unlinked, so
  editing one left the other silently stale. A third was eight months out of date. They
  now resolve to a single file, which `beast doctor` verifies by comparing inodes.
- **The two system prompts had each collected safety rules the other lacked.**
  `"Keep going" is not authorization` existed only in the Codex prompt. A rule about not
  trusting your own review inside the same context existed only in the Claude one. Both
  now carry both.
- **37 skills were reaching Claude Code while only 27 were managed.** The other ten came
  from plugins through a discovery path nothing was tracking, so the skill budget was
  being blown without anything reporting it. `beast doctor` now counts every source.

### What beast does not claim

- **No speed or output-quality benchmark.** Prompt quality does not survive that kind of
  measurement, and a percentage here would be invented.
- **It does not reduce token spend.** Per-turn cost goes up: a larger system prompt plus
  skill descriptions in every request. The trade is fewer wrong turns, which is worth it
  when a wrong turn costs a full session, and is not worth it for one-line questions.
- **It does not touch credentials, auth, or per-project config.** Those stay yours.

## What beast gives you

- **Better default behavior.** The system prompt covers design, taste, scope, charecter, verification, safety,
  git hygiene, persistence, and clear handoffs.
- **A controlled skill budget.** The active set is capped at 30 so skill descriptions
  cost about 1,590 tokens, under 1% of a 200k context window.
- **Specialists on demand.** Routers select focused modules for engineering, frontend,
  writing, security, performance, growth, motion, and media work.
- **One source of truth.** Claude Code, Codex, and Grok read files linked from this repo,
  so `git diff` shows every local change.
- **Safe installation.** Existing files are backed up. Personal config and credentials
  are never merged automatically.

## Before you install

You need:

- Node.js 20 or newer
- At least one supported harness: `claude`, `codex`, or `grok`
- Git

beast creates symlinks from your home directory into the cloned repo. Keep the clone
where it is after installation, or re-run the installer after moving it.

### Plan tiers matter

beast is built for long sessions. The system prompt is large, routers pull in modules as
the work needs them, and several skills fan work out to sub-agents. That consumes quota
considerably faster than typing one-off prompts.

**On a $20/month tier you will hit limits quickly.** Anthropic's Pro plan is the
tightest of the three in practice, because Claude Code sub-agents each carry the full
system prompt.

The setup this was extracted from runs:

| Tool        | Plan                                     |
|-------------|------------------------------------------|
| Codex       | $200/month                               |
| Claude Code | $100/month                               |
| Grok        | $20/month, included with X Premium       |

Grok is the cheapest third opinion available, since an X Premium subscription already
covers it.

You do not need all three. One well-funded harness beats three throttled ones, and the
same beast configuration works whether you install one or all of them.

### Select only the tools you pay for

The installer asks which CLIs you have access to. Answer accurately, because the answer
changes what gets written.

The routing guidance in the policy files assumes cross-CLI delegation is possible: Claude
hands bulk mechanical work to Codex, Codex asks Claude for a second read, and either can
reach Grok. If you select a harness you cannot run, an agent will try to invoke
it mid-task, fail, and spend a turn working out why.

Your answer does two things. It decides whose config files get written, and it decides
what goes into `~/.beast/delegation.md`, which the prompts treat as the authoritative
list of delegation targets. That file names only the tools you selected, so an agent on a
single-harness install is never pointed at something it cannot reach.

Re-run `beast install` after changing a subscription and the file updates.

## Quick start

```sh
git clone https://github.com/Questili/beast.git ~/code/beast
cd ~/code/beast
npm link
beast install
```

There are no runtime or development dependencies. `npm link` only makes the `beast`
command available globally. If you do not want that, replace any `beast` command with
`node bin/beast.mjs` while inside the repo intall location.

The installer asks which harnesses and skill packs you want. Installed harnesses are
preselected, and every skill pack is selected by default. Press Enter to accept each
list, then confirm the install.

To see every change before writing anything:

```sh
beast install --dry-run
```

### Finish the harness setup

On macOS, Linux, or WSL, add the launch helpers to your shell:

```sh
echo 'source "$HOME/.beast/beast.zsh"' >> ~/.zshrc
source "$HOME/.beast/beast.zsh"
```

This adds three short commands:

| Command | Opens                                    |
|---------|------------------------------------------|
| `c`     | Claude Code with the beast system prompt |
| `co`    | Codex with the beast system prompt       |
| `gro`   | Grok with the beast system prompt        |

All three pass the prompt as a launch flag, so **no config file needs editing**. Each
tool takes a different flag, which is the only reason they look different:

| Tool        | How it receives the prompt                                                                        |
|-------------|---------------------------------------------------------------------------------------------------|
| Claude Code | `--system-prompt-file ~/.claude/BEAST.v2.md`                                                      |
| Codex       | `-c model_instructions_file=~/.codex/BEAST.v2.md` plus `-c features.model_instructions_file=true` |
| Grok        | `--system-prompt-override` pointing at the Codex prompt                                           |

You can still set `model_instructions_file` in `~/.codex/config.toml` if you want the
prompt to apply to bare `codex` runs as well as `co`. The example file shows the lines.
The installer never writes that file, because it holds your authentication, trust
settings, and project list.

On Windows, dot-source the PowerShell helpers from your profile instead:

```powershell
New-Item -ItemType File -Path $PROFILE -Force
Add-Content -Path $PROFILE -Value '. "$HOME\.beast\beast.ps1"'
. "$HOME\.beast\beast.ps1"
```

## Understanding the skills

Installing all packs does **not** activate 101 skills at once.

beast separates skills into three layers:

| Layer              | Purpose                                            |
|--------------------|----------------------------------------------------|
| 9 routers          | Decide which kind of help the task needs           |
| 27 active skills   | Small set visible to the harness by default        |
| 92 library modules | Focused instructions that routers load when needed |

The active set has a hard cap of 30. Plugins can add their own skills outside beast,
so `beast doctor` also reports the total each harness can discover.

### Skill packs

Packs control which library modules are installed. `core` is always included because
it contains the routing layer.

| Pack          | Skills | Best for                                              |
|---------------|--------|-------------------------------------------------------|
| `core`        | 14     | Routing and compatibility aliases                     |
| `design`      | 30     | Frontend, visual direction, UI copy, and polish       |
| `video`       | 21     | HyperFrames, Lottie, captions, and media production   |
| `prose`       | 7      | Documentation, copy, and outreach                     |
| `product`     | 10     | Positioning, pricing, SEO, launch, and monetisation   |
| `engineering` | 15     | Architecture, review, hardening, and investigation    |
| `tooling`     | 4      | Session analysis, triage, and machine-specific repair |

For a first install, use all packs. Partial installs are supported, but some router
menus will point to modules you chose not to install. The installer reports those gaps
before it changes anything.

Examples:

```sh
beast install --all
beast install --harness=claude,codex --packs=core,design,engineering
beast skills
beast skills add clarify
beast skills rm clarify
```

After adding or removing a skill, run `beast install` again to update the harness links.

## Deliberately not included

- Default `--dangerously-skip-permissions` or `--yolo` flags

## What gets installed

| Home path                                      | Source in this repo                  |
|------------------------------------------------|--------------------------------------|
| `~/.claude/BEAST.v2.md`                        | `home/claude/BEAST.v2.md`            |
| `~/.codex/BEAST.v2.md`                         | `home/codex/BEAST.v2.md`             |
| `~/.claude/CLAUDE.md`                          | `home/claude/CLAUDE.md`              |
| `~/.codex/AGENTS.md` and `~/.agents/AGENTS.md` | The same `home/codex/AGENTS.md`      |
| `~/.grok/AGENTS.md`                            | `home/grok/AGENTS.md`                |
| `~/.agents/skills/*`                           | Active skills                        |
| `~/.agents/skill-modules/*`                    | Skill library                        |
| `~/.claude/skills/*` and `~/.codex/skills/*`   | Harness-specific active skill links  |
| `~/.codex/prompts/*` and `~/.codex/scripts/*`  | Shared prompts and scripts           |
| `~/.beast/beast.zsh` and `~/.beast/beast.ps1`  | Launch helpers                       |
| `~/.beast/selection.json`                      | Your last harness and pack selection |

The repo remains the source of truth. Editing a linked file under `$HOME` edits this
clone, so the change appears in `git diff`.

### Existing files and personal config

beast does not delete existing files. When a real file or directory already occupies a
target path, the installer moves it to:

```text
~/.beast/pre-beast/<original path>
```

Backups live outside the harness skill directories so they cannot be discovered as
duplicate skills.

These personal config files are never written:

- `~/.claude/settings.json`
- `~/.codex/config.toml`
- `~/.grok/config.toml`

Safe examples live beside each harness under `home/`. Merge only the settings you want.
The examples do not enable unattended full-filesystem access or automatic dependency
installation.

## Check your setup

```sh
beast doctor
```

`doctor` exits with status 0 when the setup is healthy and 1 when it finds a failure.
It checks:

- missing, incorrect, and orphaned links
- duplicate or excessive skills, including plugin-provided skills
- malformed or unsafe harness configuration
- missing references between installed skills
- secrets in the payload and staged git content
- WSL and Windows symlink problems

Run it after installation, after changing packs, and before committing changes to the
payload.

## Platform support

| Platform | Status                                                                 |
|----------|------------------------------------------------------------------------|
| macOS    | Used daily and verified with `beast doctor`                            |
| Linux    | Verified in a clean, non-root Alpine container                         |
| WSL2     | Supported and unit-tested, but not yet run on a real WSL machine       |
| Windows  | Implemented and unit-tested, but not yet run on a real Windows machine |
| WSL1     | Discouraged because symlink behavior differs from WSL2                 |

On Windows, directory junctions need no elevation. File symlinks require Developer
Mode or an elevated shell.

On WSL2, keep both the repo and `$HOME` inside the Linux filesystem. Also install the
agent CLI inside WSL. A Windows `.exe` reads the Windows user profile and will not see
the files beast linked under the WSL home directory.

## Troubleshooting

**`beast: command not found`**

Run `npm link` from the repo, or use `node bin/beast.mjs <command>`.

**`Codex does not follow the beast prompt`**

Merge `model_instructions_file` and its feature flag from
`home/codex/config.toml.example` into `~/.codex/config.toml`, then restart Codex.

**`doctor` reports many `not linked` failures**

Re-run `beast install`. Your saved selection is missing or stale.

**`doctor` reports an incomplete selection**

Run the `beast install --packs=...` command it prints, or accept the missing modules if
you chose a small install intentionally.

**`doctor` reports an orphaned link**

Run `beast install`. The installer removes broken links that point into this repo.

**`The repo moved`**

Run `npm link`, `beast install`, and `beast doctor` again from the new location.

## For contributors

No dependency install is required.

```sh
npm test
npm run notice
beast doctor
```

`npm test` covers the installer, pack selection, platform logic, and isolation behavior.
Vendored skills keep their own test suites; `npm run test:vendored` runs them separately
and does not gate this project.

`scripts/bootstrap.mjs` is for maintainers refreshing `home/` from an existing local
setup. New users do not need it. It stages, scrubs, scans, and normalizes the payload
before replacing anything:

```sh
node scripts/bootstrap.mjs [--force]
```

Open a [GitHub issue](https://github.com/Questili/beast/issues) for bugs, proposed skill
changes, or attribution corrections.

## Attribution and license

Most library modules began as other people's work. [`NOTICE.md`](NOTICE.md) records
each upstream, license, copyright holder, and substantial rewrite. `npm run notice`
fails when a shipped skill lacks recorded provenance.

The root [`LICENSE`](LICENSE) explains the split:

- beast's installer, prompts, scripts, tests, and original routers are MIT-licensed
- vendored skills retain their upstream terms
- modules with unresolved grants are marked in `NOTICE.md`

Review both files before redistributing the full skill library. If your work appears
here and you want it removed or credited differently, open an issue.
