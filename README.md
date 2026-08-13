# beast

**A curated agent setup for Claude Code, Codex, Grok Build, and Hermes.**

The default system prompts supplied by agent harnesses are too weak for serious,
long-running work. Many users have no skill files at all. Others install every skill
and plugin they find, filling the model's context with overlapping instructions.

beast aims for the useful middle: a strong system prompt, a small active set of routing
skills, and a larger library loaded only when the work needs it. The same configuration
works across all four harnesses and stays in one git repo.

This setup has been tested in real work with **GPT-5.6 Sol**, **GPT-5.6 Terra**,
**Claude Fable 5**, **Claude Opus 5**, **Kimi K3**, and **Grok 4.6**, Any model scoring higher than 51 on Artificial Analysis's intelligence index will work[https://artificialanalysis.ai/#intelligence-tabs].

```text
Claude Code ─┐
Codex ───────┤
Grok ────────┼── beast prompt ── 9 routers ── 23 active skills ── 95-module library
Kimi─────────┤
Hermes ──────┘
```

## What changes

What I actually got out of running every session through this, across Claude Code,
Codex, and Grok. These are observations from daily use, not benchmark numbers.

- **Instructions stick.** A constraint set at turn 3 still holds at turn 40. Scope stays
  where I put it, so I stopped restating the same boundary every few turns and stopped
  finding half-finished work reported as done.
- **It is better to talk to.** No preamble, no fake enthusiasm, no summary of what it is
  about to say. Answers come back at the length the question deserves, and it tells me
  when something is brittle instead of agreeing.
- **The design taste is real.** UI arrives with hierarchy, spacing, and type decisions
  someone made on purpose, rather than the same centered hero and three gradient cards
  every model reaches for by default.
- **Almost no slop, in code or in prose.** Code comes back without speculative
  abstractions, wrapper layers, and defensive scaffolding nobody asked for. Writing comes
  back without the triads, the em dash rash, and "it's not just X, it's Y."
- **Fewer steps to the output I wanted.** Each turn carries a larger system prompt, so a
  single turn costs more. A whole task costs less, because the wrong turns are what
  burn a session, and there are far fewer of them.
- **It tunes the model and the harness into a better version of themselves.** Routers
  pull in the specialist module the work needs and leave the rest out of context, so the
  same model behaves like a stronger one on the problem in front of it.
- **It approaches problems whole.** Change requests come back with the callers checked,
  the failure path handled, and the one risk worth knowing named, instead of a patch on
  the symptom I happened to report.
- **It is nicer to use.** The part I cannot quantify, and the part I would miss most.
  Sessions end with the work finished rather than with me correcting tone, scope, and
  taste for the fourth time.

Your credentials, auth, and per-project config stay yours. The installer offers to add
the handful of config keys beast needs and touches nothing else in those files.

## Before you install

You need:

- Node.js 22 or newer
- At least one supported harness: `claude`, `codex`, `grok`, or `hermes`
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

Delegation itself has two forms, and the installer picks per machine. When the `broker`
binary from [agent-broker](https://github.com/GLDRoger/agent-broker) is on PATH, the
generated routing file sends all cross-CLI work through it — persistent chats that pin
one session per provider, with ETAs, budgets, and turn guards. Without it, the file
lists direct CLI invocations (`claude -p`, `codex exec`, `grok -p`) instead. The policy
files' delegation sections are written for the broker form; `~/.beast/delegation.md` is
what corrects them on a machine that runs bare CLIs.

Your answer does two things. It decides whose config files get written, and it decides
what goes into `~/.beast/delegation.md`, which the prompts treat as the authoritative
list of delegation targets. That file names only the tools you selected — and the path
to reach them — so an agent on a single-harness install is never pointed at something it
cannot reach.

Re-run `beast install` after changing a subscription and the file updates.

## Quick start

Node 22 or newer. A video pack installs by default and HyperFrames needs 22+, so a
machine on Node 20 satisfies the installer and still cannot run what it installed.

```sh
git clone https://github.com/Questili/beast.git ~/code/beast
cd ~/code/beast
npm link
beast install
```

There are no runtime or development dependencies. `npm link` only makes the `beast`
command available globally. If you do not want that, replace any `beast` command with
`node bin/beast.mjs` while inside the repo install location.

**Cloning is the only supported install.** There is no npm package on purpose. beast
links your home directory into this clone, so the clone has to stay put and stay
writable — that is what makes `git diff` show your drift. An immutable copy under
`node_modules` cannot do that job, and npm does not materialise symlinked directories:
`npm pack` shipped 9 of the 31 active skills, silently. `package.json` is marked
`private` so nobody can publish that tarball by accident.

The installer asks which harnesses and skill packs you want. Installed harnesses are
preselected, and every skill pack is selected by default. Press Enter to accept each
list, then confirm the install.

Because both video packs are selected by default, it also asks which video stack you
want — **HyperFrames** (HTML + GSAP, rendered by the hyperframes CLI) or **Remotion**
(React/TSX, rendered by the remotion CLI). Both is an option and so is neither. Passing
`--packs=` skips the question entirely: `--packs=core,remotion` installs one stack,
`--packs=core,video,remotion` installs both.

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
| Grok        | `--system-prompt-override` pointing at `~/.grok/BEAST.v2.md`                                      |

### Hermes

Hermes is the fourth harness and the one exception to "no config file needs editing":
it reads exactly one file — `~/.hermes/SOUL.md` — as its identity, and there is no
launch flag. So `beast install --harness=hermes` **generates** that file instead of
linking it: the SOUL is assembled from the codex payloads plus `home/hermes/
SOUL.overlay.md`, which holds only what differs on Hermes (its tool names, the skill
root, and the operator identity — Hermes is the broker's client, not one of the roster
lanes). Editing the overlay and re-running `beast install` rewrites the SOUL; editing
the payloads rewrites every harness's wording including the SOUL's, which is what keeps
the roster from drifting the way a hand-maintained copy did. The generated file carries
the "edits are overwritten" marker, and a hand-written SOUL.md is moved aside with a
backup on first install rather than truncated.

### Bare `codex` and `grok`

The helpers cover `c`, `co`, and `gro`. Typing `codex` or `grok` directly bypasses them,
and those two read the prompt from their own config instead. The installer offers to add
the keys that close that gap:

| File                   | Key                                            | What it buys                              |
|------------------------|------------------------------------------------|-------------------------------------------|
| `~/.codex/config.toml` | `model_instructions_file` + the `[features]` flag | bare `codex` loads the beast prompt    |
| `~/.grok/config.toml`  | `[system-prompt-overrides] paths`              | bare `grok` loads the beast prompt         |
| `~/.grok/config.toml`  | `[skills] paths` and `ignore`                  | Grok loads the skill set once, not twice   |

Nothing else in either file is read or rewritten. A key you have already set is left
alone and reported, never overwritten.

Answer no and nothing is touched; `--write-config` and `--no-write-config` decide it
without the question, and a non-interactive run declines unless you pass the flag.
`~/.claude/settings.json` is never written at all, because Claude Code needs no key for
any of this and rewrites that file itself at runtime.

Editing TOML that holds your auth is worth being careful about, so the writer:

1. refuses to touch a file it cannot parse, and does nothing at all without a Python
   3.11+ interpreter to parse with (`tomllib`)
2. inserts each key positionally, because appending to the end of the file can drop it
   into whatever `[table]` happens to be last. `model_instructions_file` landing inside
   `[features]` makes Codex refuse to start
3. re-parses the result and compares it against the original, key by key. Anything that
   changed beyond the intended keys is discarded and the original file stays as it was
4. copies the original to `~/.beast/pre-beast/` before replacing it, and preserves the
   file's permissions

On Windows, dot-source the PowerShell helpers from your profile instead:

```powershell
New-Item -ItemType File -Path $PROFILE -Force
Add-Content -Path $PROFILE -Value '. "$HOME\.beast\beast.ps1"'
. "$HOME\.beast\beast.ps1"
```

## Understanding the skills

Installing all packs does **not** activate 104 skills at once.

beast separates skills into three layers:

| Layer              | Purpose                                            |
|--------------------|----------------------------------------------------|
| 9 routers          | Decide which kind of help the task needs           |
| 23 active skills   | Small set visible to the harness by default        |
| 95 library modules | Focused instructions that routers load when needed |

### What the active set costs

Claude Code sends one line per skill every turn, `- name: description`, and caps that
listing in **characters**, not skills:

```
budget = skillListingBudgetFraction × chars-per-token × context-window
       = 0.01 (default)            × 3 or 4          × 200,000
       = 6,000 to 8,000 characters
```

Two of those inputs depend on the model, which beast cannot know in advance, so it
reports a range. Current models count 3 characters per token; a fixed older set
(`claude-3-*` through `claude-{opus,sonnet}-4-6`) counts 4. A 1M-context session gets
five times either. `beast doctor` warns when the listing passes the low end and fails
when it passes the high end, so severity tracks certainty.

Over budget nothing disappears: Claude Code shortens the lowest-scoring entries to bare
names, ranked by how much you use each skill, so a freshly installed one is first to lose
the description it is dispatched on.

Two consequences. A verbose skill costs what five terse ones cost, so `beast skills` and
`beast scan` rank entries by characters. And the budget is shared with anything else the
harness discovers, including plugin skills beast neither installs nor can remove, so
`beast doctor` measures everything that loads rather than only beast's own set.

If the listing is over budget and every skill in it is one you want, raise the reservation
instead of trimming. One extra percent of the window is usually the better trade:

```jsonc
// ~/.claude/settings.json
"skillListingBudgetFraction": 0.02
```

`SLASH_COMMAND_TOOL_CHAR_BUDGET` sets an absolute character budget and overrides the
setting; beast reports whichever one your machine is actually using.

### Skill packs

Packs control which library modules are installed. `core` is always included because
it contains the routing layer.

| Pack          | Skills | Best for                                              |
|---------------|--------|-------------------------------------------------------|
| `core`        | 14     | Routing and compatibility aliases                     |
| `design`      | 29     | Frontend, visual direction, UI copy, and polish       |
| `video`       | 21     | HyperFrames video: HTML + GSAP, Lottie, captions      |
| `remotion`    | 4      | Remotion video: React/TSX compositions                |
| `prose`       | 7      | Documentation, copy, and outreach                     |
| `product`     | 10     | Positioning, pricing, SEO, launch, and monetisation   |
| `engineering` | 15     | Architecture, review, hardening, and investigation    |
| `tooling`     | 4      | Session analysis, triage, and machine-specific repair |

For a first install, use all packs. Partial installs are supported, but some router
menus will point to modules you chose not to install. The installer reports those gaps
before it changes anything.

### Two video stacks

`video` and `remotion` are alternatives. Both build video from web technology and each
brings its own authoring model, CLI and render path:

| | `video` (HyperFrames) | `remotion` |
|---|---|---|
| A composition is | an HTML file with `data-*` timing attributes | a React component reading `useCurrentFrame()` |
| Animation | GSAP on one paused timeline, plus six other runtimes | `interpolate` and `spring`, pure functions of the frame |
| Renders with | `npx hyperframes render` | `npx remotion render`, or AWS Lambda |
| Licence | open | free under four people, paid company licence at four or more |
| Skills | 21, including workflows for launch videos, captions and recuts | 4: router, composition contract, animation, CLI |

Pick the one that matches the codebase you already have. A React product with designers
who live in TSX is a Remotion project; a pipeline that assembles HTML and CSS is a
HyperFrames one. Installing both is supported and costs both listings in every session,
which is why the installer asks instead of assuming.

The Remotion skills are written against 4.0.x from the public docs and a rendered probe
project. Remotion's own agent skills (`npx remotion skills add`) install per-project and
track upstream more closely; the two coexist.

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

beast does not delete existing files. When anything it did not create already occupies a
target path — a real file, a directory, or a symlink of your own — the installer moves it
to:

```text
~/.beast/pre-beast/<original path>
```

Backups live outside the harness skill directories so they cannot be discovered as
duplicate skills.

This covers the two files the installer generates as well, `~/.beast/delegation.md` and
`~/.beast/selection.json`. Each carries a marker line, and beast overwrites a file only
when it finds its own marker there. If it cannot back up what is in the way, the install
reports it and exits non-zero rather than proceeding with stale routing.

Personal config is handled separately:

- `~/.claude/settings.json` is never written
- `~/.codex/config.toml` and `~/.grok/config.toml` get the few keys described under
  [Bare `codex` and `grok`](#bare-codex-and-grok), if you say yes, and nothing else

Safe examples live beside each harness under `home/`. Merge only the settings you want.
The examples do not enable unattended full-filesystem access or automatic dependency
installation.

## Check your setup

### See what else is loading skills

```sh
beast scan
```

Every harness discovers skills from more than one place. beast manages one of them, so
the number it controls is not the number your harness loads. `scan` lists every source
with what it costs and the command that retires it:

- **What each entry costs**, ranked by characters across every source, so the one
  expensive description is visible next to the twelve cheap ones
- **Claude Code plugins**, with their listing cost, the always-on token cost reported by
  `claude plugin details`, and `claude plugin disable <id>` for each enabled one
- **Codex system skills**, shipped by the Codex CLI, with the `[[skills.config]]` block
  that disables one
- **Skills beast does not manage**, which are yours and are left alone
- **Names provided by more than one place**, where which one wins is undefined

It ends with the characters you have spent against the budget, and every lever that
applies: raising `skillListingBudgetFraction`, disabling a plugin, dropping a pack, or
shortening a description. `beast install` points you here when there is something worth
looking at.


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

Run `beast install`. It retires links pointing into this repo that your current selection
no longer calls for. Links pointing anywhere else are yours and are never touched.

**`doctor` says the payload has unscrubbed text**

Run `npm run scrub`. A rewrite rule was added and has not been applied to `home/` yet.

**`The repo moved`**

Run `npm link`, `beast install`, and `beast doctor` again from the new location.

## For contributors

No dependency install is required. Node 22+.

```sh
npm test               # installer, packs, platform logic, isolation, regressions
npm run test:vendored  # the test suites inside the vendored skills
npm run notice         # regenerate NOTICE.md from the payload
npm run scrub          # apply every text-rewrite rule to home/
beast doctor
```

Every one of these gates. `npm test` runs 75 checks including a clean-install-then-doctor
pass for each harness scope. `npm run test:vendored` enumerates all 57 vendored test files
in Node — an earlier shell glob matched one of them and then discarded the exit code — and
fails on any failure not listed in `KNOWN_FAILURES` in `scripts/test-vendored.mjs`, *and*
on any listed failure that starts passing, so the list cannot rot.

Four vendored tests are expected to fail, each for a reason written next to it. Two of
them are worth knowing about as a user:

- **`pr-to-video` cannot complete its design step.** The workflow fixes its style to the
  `claude` frame preset, which is not in the vendored `hyperframes-creative` copy and is
  not in the `hyperframes` npm package either. Recover it with
  `npx hyperframes skills update pr-to-video` in a scratch directory, or pick one of the
  13 presets that do ship.
- **`talking-head-recut`'s contract test outlived its own SKILL.md**, which was rewritten
  upstream. The workflow runs; the assertion is stale.

The other two need the HyperFrames monorepo as an ancestor directory, which a vendored
copy does not have.

`scripts/bootstrap.mjs` is for maintainers refreshing `home/` from an existing local
setup. New users do not need it. It stages, scrubs, scans, and normalizes the payload
before replacing anything:

```sh
node scripts/bootstrap.mjs [--force]
```

CI (`.github/workflows/ci.yml`) runs the unit suite on Node 22 and 24 across macOS, Linux
and Windows; a clean install plus `doctor` plus `scan` for six different harness/pack
scopes; an idempotence check; the vendored suites; and a check that `NOTICE.md` and the
scrubbed payload are both committed up to date. The Windows clean-install job is
informational until it has passed on real hardware once — GitHub's Windows runners are
elevated, so they cannot stand in for a normal user's machine.

Open a [GitHub issue](https://github.com/Questili/beast/issues) for bugs, proposed skill
changes, or attribution corrections.

## Attribution and license

Most library modules began as other people's work. [`NOTICE.md`](NOTICE.md) records
each upstream, license, copyright holder, and substantial rewrite. `npm run notice`
fails when a shipped skill lacks recorded provenance, and lists every publication blocker
it found. `npm run notice -- --strict` exits non-zero while any blocker remains — run that
before publishing anything.

Blockers are computed from the payload each run, not written by hand — an earlier version
listed them as prose and three of the four claims had quietly gone stale. `--strict`
currently exits 0, and how the last four were settled is worth knowing, because the same
four questions will come up again:

- **`impeccable`** promised `NOTICE.md` in its frontmatter and shipped none. Upstream
  (`pbakaus/impeccable`) does ship one, so it is vendored into the skill, along with
  upstream's own third-party notice carried forward as Apache-2.0 section 4(d) requires.
- **`tushar-design`** promised `LICENSE.txt`. Upstream is MIT © 2026 Tushar Mehta, so that
  text now ships with the skill.
- **`web-shader-extractor`** looked ungranted because `lixiaolin94/skills` has no `LICENSE`
  file — GitHub's detector returns 404. The README states `MIT` outright. The grant is
  real, so [`licenses/lixiaolin94-skills-grant.md`](licenses/lixiaolin94-skills-grant.md)
  records the verbatim text, the commit it was read at, and the date.
- **`product-design-psychology` was dropped.** It was distilled from a paid book with no
  repository, no stated license and nobody to ask, and it tracked the book's chapter
  structure closely. There was no version of "settled" available, so it is out rather than
  shipped with an asterisk. Recover it from git history if a grant is ever obtained.

[`licenses/`](licenses/) holds the actual license texts. This matters more than it sounds:
naming Apache-2.0 is not the same as shipping it, section 4(a) requires a copy to travel
with any redistribution, and ~25 of the vendored skills are Apache-2.0.

The root [`LICENSE`](LICENSE) explains the split:

- beast's installer, prompts, scripts, tests, and original routers are MIT-licensed
- vendored skills retain their upstream terms, with full texts under `licenses/`

Review both files before redistributing the full skill library. If your work appears
here and you want it removed or credited differently, open an issue.
