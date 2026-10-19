# beast

A curated agent setup for Claude Code, Codex, Grok Build, Gemini / Antigravity, and Hermes.

Beast keeps shared operating principles, partner/taste guidance, and optional specialist methods in one repository. Eight primary workflows own the requested outcome. They load specialist material when it helps instead of imposing every checklist, interview, or report format on every task.

Corrections should advance the unresolved goal. More context or more agents does not by itself prove better completion. Evaluate setup changes against actual outcomes and scope violations.

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
- **A specific moment:** vague feedback, and a second vague correction in the same session. Worker sessions get neither.

Two rules keep the layers consistent:

1. **Repetition is deliberate, contradiction is a bug.** Over a long session a model stops following its system prompt, so a Jevis tip may restate a Beast or `USER.md` rule in fewer words. Some guidance lives only in Jevis: the session guide, the judgment examples, the design reminders, the per-family corrections, and the feedback tips. Everything else a tip says must have a source in another layer, and when a reminder and its source drift apart, the source wins and the reminder is rewritten.
2. **Place a line by asking where it is true.** For anyone: Beast. For this user on every project: `USER.md`. For one project: its `AGENTS.md`. Only while doing one kind of task: a skill. Only at one moment or for one model: Jevis. For no one: delete it.

## Install deliberately

Requirements: Node.js 22+, Git, and a supported harness. Keep the clone at its installed path: home-directory entries are symlinks into it.

```sh
git clone https://github.com/Questili/beast.git ~/code/beast
cd ~/code/beast
npm link
beast install --dry-run
beast install
```

There are no package dependencies to install. `npm link` exposes the CLI; alternatively run `node bin/beast.mjs <command>` from the clone. This package is private because an immutable npm installation cannot serve as the writable source for this setup.

Interactive installation selects harnesses and packs and asks before writing. Explicit examples:

```sh
beast install --all
beast install --harness=codex --packs=core,design,engineering
beast install --harness=claude,codex --packs=core,remotion
beast install --dry-run --harness=codex --packs=core
```

`core` is always included. A partial selection can omit optional modules named by a workflow; the installer reports gaps. An unavailable optional method should not prevent ordinary work. Unknown options or pack names fail rather than broadening an installation.

Installation targets describe which harness files to configure, not authentication, subscription entitlement, or permission to dispatch work. Verify model availability and limits in the current runtime. API billing and subscription allowance are not interchangeable; this repository makes no fixed pricing or quota recommendation.

### Launch helpers and base instructions

On macOS/Linux, source `~/.beast/beast.zsh` from the shell profile. On Windows, source the installed `beast.ps1` helper.

- `c` launches Claude Code with its Beast system-prompt file.
- `co` launches Codex with the Beast `model_instructions_file` override.
- `gro` launches Grok at max effort.

One prompt, `home/shared/BEAST.md`, serves every harness, and one brief user file, `home/shared/USER.md`, sits beside it. Claude Code and Codex use Beast as their base prompt. Grok has no prompt-file option, so it appends `~/.grok/AGENT.md` (Beast) to its native prompt. Grok truncates rules files at 10,000 characters, so keep Beast under that. Launchers that bypass the helpers need the same wiring: Codex reads `model_instructions_file` from `config.toml`, Grok always reads `AGENT.md`, and T3 Code's Claude provider takes `--system-prompt-file` in its launch arguments.

Read the helpers before adopting them. Command-line overrides can supersede configuration files. Codex's model-instruction override replaces the built-in base rather than merely adding personality. Comparing it with native-base instructions plus a compact global policy is a separate controlled choice, not something installation silently decides.

The Claude helper currently uses `bypassPermissions`. The Codex and Grok helpers do not add blanket sandbox-bypass flags, but effective permissions still depend on user configuration. These are trust decisions, not performance settings.

### Configuration and generated files

`--write-config` adds supported missing keys needed by selected harnesses. `--no-write-config` leaves configuration untouched. Non-interactive installation does not write config unless requested. Existing values are preserved and reported.

The TOML writer requires Python 3.11+, verifies the intended semantic change, preserves permissions, and backs up the original. Malformed input or an unrelated semantic change causes refusal. Claude's user settings are not rewritten. Examples are guidance, not files to copy over credentials or project state.

Hermes reads generated `~/.hermes/SOUL.md`. Its assembler combines the shared Beast body and partner policy with `home/hermes/SOUL.overlay.md`. Hermes generation runs only when Hermes is selected for installation. Ownership markers distinguish generated content from hand-written files, which are backed up rather than truncated.

Gemini reads generated `~/.gemini/system.md` (Beast plus `home/gemini/system.overlay.md`) via `GEMINI_SYSTEM_MD`; `~/.gemini/GEMINI.md` links to the shared user file. Antigravity's documented rule loading does not use that Gemini-specific override; its generated `~/.gemini/config/AGENTS.md` contains Beast, the user instructions, and the Google compatibility paragraph, without Gemini's capability placeholders. `beast install --harness=gemini --write-config` backs up and preserves other Gemini settings while setting `context.fileName` to `["GEMINI.md", "AGENTS.md"]` and the system-prompt environment variable. Shell `gemini` and `agy` helpers refresh the generated prompts before launch. Direct and GUI launches need a reinstall after source edits. Rule discovery varies between Antigravity versions; confirm the loaded files in that runtime rather than assuming overlapping global rules are deduplicated.

Muse's `mu` helper synchronizes Beast and the shared user instructions into `run.system_prompt` before launch. `aug` passes the two current source files through Auggie's repeatable `--rules` option; it replaces the legacy shell alias without editing the shell profile.

Shared policy edits affect symlinked files immediately on disk. Generated outputs and running sessions need an appropriate refresh. Do not reinstall every harness merely to refresh delegation guidance.

## Skills and scope

Primary workflows live under `home/agents/skills/`; specialist bodies live under `home/agents/skill-modules/`. Some specialists also have discovery links resolving to that same source.

Installed files, discoverable descriptions, and loaded skill bodies are different things. Inspect the current harness to establish what is loaded; do not infer context cost from directory counts.

| Pack | Skills | Purpose |
|---|---:|---|
| `core` | 8 | Primary workflow ownership |
| `design` | 10 | Optional visual/interaction craft and Lottie |
| `remotion` | 4 | React video composition, animation, rendering |
| `prose` | 7 | Prose/visual cleanup, docs, outreach |
| `product` | 8 | Positioning, pricing, discoverability, validation |
| `engineering` | 13 | Architecture, review, performance, investigation |
| `tooling` | 4 | Local agent/runtime diagnostics |

Remotion is the retained video stack. Follow its current project/version and licensing instructions for video work. Removing a production skill does not authorize migrating existing user projects or deleting their assets.

`unslop` separates prose and visual cleanup into optional references. It preserves user voice, brand, facts, uncertainty, accessibility, and review/edit scope. Aesthetic modules are optional recipes, not mandatory brand interviews.

Retired families and aliases are recorded in `RETIRED_SKILLS` in `lib/manifest.mjs`. Bootstrap excludes them so stale local installations cannot silently bring them back. Product-specific prompts belong in the owning project, not this global payload.

```sh
beast skills
beast skills add apple-design
beast skills rm apple-design
beast scan
```

Adding/removing a skill changes discovery. Intentionally reinstall selected harnesses when their mirror links need updating. System/plugin and project-local skills remain owned by their installers or projects.

## Delegation

`beast delegation` refreshes `~/.beast/delegation.md` without reinstalling skills, rewriting configuration, changing the saved selection, or regenerating SOUL files.

The guide separates native tools exposed by the current harness, directly detected executables on PATH, and intentional cross-provider work through agent-broker. Executable presence is not authenticated reachability. A broker installation does not prove every provider or model is available. Discover current capabilities; do not use a fixed model roster or ranking.

If delegation is unavailable or disallowed, continue directly. The primary workflow owns scope, integration, verification, and the final decision.

## Verification

There is no mandatory verification-router script or universal five-command pipeline. The code workflow uses `home/agents/skills/code/references/verification.md` to choose project checks from changed behavior and risk.

Whitespace checks validate diff hygiene, not dependency or runtime correctness. A build is not visual QA; mocked tests do not prove database policy. Inspect scripts and targets before executing commands that may contact live services.

## Ownership and recovery

`lib/manifest.mjs` maps policy files, skill entries, prompts/helpers, and shell snippets. Installation does not replace shared skill directories wholesale: they may contain private user-owned modules.

Displaced real files and unowned links are parked under `~/.beast/pre-beast/<original path>`, outside skill discovery. If a backup cannot be made safely, installation fails. Stale links are removed only when they point inside this checkout; unrelated links and sibling repositories are preserved.

Generated outputs also use ownership markers and backup protection. Read the diff and preserve concurrent changes before editing or reinstalling. Credentials, sessions, memories, databases, worktrees, and unrelated caches are not cleanup targets for a policy change.

## Diagnostics and maintenance

```sh
beast scan
beast doctor
npm test
npm run notice
npm run notice -- --strict
npm run scrub
```

`scan` inventories skill sources and discovery cost, including sources Beast does not own. `doctor` checks links, config shape, exclusions, secrets, references, and platform concerns against the saved selection. Neither proves account entitlement or future model behavior. Listing-budget heuristics are harness-specific, not a universal Codex token limit.

The tests cover installation, packs, ownership, configuration, generated output, retired-skill exclusion, and delegation. Tests for removed vendor implementations are removed with those implementations, not retained as meaningless green checks. CI runs its declared Node/platform matrix; Windows clean-install remains informational pending real-hardware verification.

Inspect the saved selection and a dry run before repairing links. On Windows, file symlinks require Developer Mode or elevation; directory junctions do not. In WSL2, keep the checkout/home in the Linux filesystem and use the Linux CLI. Tests do not replace verification on the actual platform.

`node scripts/bootstrap.mjs --force` refreshes the payload from a local installation through a staged, scrubbed, scanned copy. It is a maintainer operation, not a way to discard a dirty checkout. Inspect scrub and generated-attribution diffs before publication.

## Attribution

`NOTICE.md` records upstreams and terms for shipped material. `LICENSE` explains the split between original tooling and vendored material; supporting texts live under `licenses/` and relevant modules. Preserve applicable attribution when modifying or redistributing the library. `npm run notice -- --strict` must pass before publication.
