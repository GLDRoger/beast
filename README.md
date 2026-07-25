# beast

One agent configuration installed across **Claude Code**, **Codex**, and **Grok** from a
single git repo.

## The problem

Run three agent CLIs and you accumulate three copies of the same instructions, which
then drift. In the setup this was extracted from, the standing policy existed in four
copies: two byte-identical but unlinked, one eight months stale. The two system prompts
had each collected safety rules the other was missing, including `"Keep going" is not
authorization` in one and a least-privilege rule in the other.

beast makes `$HOME` a set of symlinks into one repo. Editing a linked file in `$HOME`
edits the repo, so `git diff` is the drift report.

---

## Install

```sh
git clone <this-repo> ~/code/beast
cd ~/code/beast
node bin/beast.mjs install        # or `npm link` first, then `beast install`
```

No `npm install` step. Zero runtime dependencies, zero dev dependencies, so a fresh
clone runs immediately.

`beast install` with no flags prompts:

```
? Which harnesses?
❯ ◉ Claude Code  ~/.claude  · found
  ◉ Codex        ~/.codex   · not on PATH
  ◉ Grok         ~/.grok    · found
  ↑↓ move · space toggle · a all · enter confirm

? Which skill packs?
❯ ◉ Core routing (always)     14 skills · required, the dispatch layer
  ◉ Frontend & design craft   30 skills · visual direction, component feel, polish
  ...
```

Harnesses preselect whatever is on your PATH. Everything is selected by default, so
enter twice installs all of it. Press `a` to toggle everything off or on.

Non-interactive forms:

```sh
beast install --all
beast install --harness=claude,codex --packs=core,design
beast install --dry-run                  # print every link, touch nothing
```

Piped or CI runs skip the prompt and install everything, saying so first. Prompting
without a TTY would hang forever.

Then source the entry points:

```sh
echo 'source ~/.beast/beast.zsh' >> ~/.zshrc     # gives you c, co, gro
```

On Windows, dot-source `beast.ps1` from your `$PROFILE` instead.

---

## What lands in `$HOME`

| Path | Becomes |
|---|---|
| `~/.claude/BEAST.v2.md` | link → `home/claude/BEAST.v2.md` |
| `~/.codex/BEAST.v2.md` | link → `home/codex/BEAST.v2.md` |
| `~/.claude/CLAUDE.md` | link → `home/claude/CLAUDE.md` |
| `~/.codex/AGENTS.md`, `~/.agents/AGENTS.md` | links → **the same** `home/codex/AGENTS.md` |
| `~/.grok/AGENTS.md` | link → `home/grok/AGENTS.md` |
| `~/.agents/skills/*` | per-skill links into the repo |
| `~/.agents/skill-modules/*` | per-module links into the repo |
| `~/.claude/skills/*`, `~/.codex/skills/*` | mirrors of the active set |
| `~/.codex/prompts/*`, `~/.codex/scripts/*` | per-file links |
| `~/.beast/beast.zsh`, `~/.beast/beast.ps1` | links |
| `~/.beast/selection.json` | what the last install asked for |

A full install creates 193 links.

Two `$HOME` paths share one payload file on purpose. That is what collapsed the
duplicate `AGENTS.md`, and you can verify it: both paths report the same inode.

**Nothing is deleted.** Anything real already sitting at a target path is *moved* to
`~/.beast/pre-beast/<same relative path>`. Backups live outside every tool's scan path
because a backup named `hyperframes.pre-beast` left inside `~/.claude/skills/` gets
discovered and loaded as a real skill. That happened during development.

### What beast will not write

`~/.claude/settings.json`, `~/.codex/config.toml`, and `~/.grok/config.toml` hold your
own state: project trust lists, auth, hook hashes. They ship as `.example` files and
you merge by hand. Automatic TOML merging either destroys your comments or silently
drops keys.

---

## Skills

101 distinct skills: 92 modules in the library and 27 active, where the overlap is
active entries that are views onto library modules.

Claude Code loads every discoverable skill's description into context, so the active
set is a context budget rather than a file count. beast caps it at 30.

```sh
beast skills                 # active set, with descriptions
beast skills add clarify     # activate a library module (refuses at the cap)
beast skills rm clarify      # deactivate
beast install                # link the change into the tools
```

### The three tiers

```
home/agents/skill-modules/   92 real directories, the library
home/agents/skills/          27 entries, the active set
                             18 are symlinks into the library
                              9 are real directories (the original routers)
```

The nine routers (`route`, `frontend`, `code`, `writing`, `motion`, `performance`,
`security`, `growth`, `media`) exist only in the active set. Everything else lives in
the library and appears in the active set as a view.

`beast skills rm` on a router **moves** it into the library rather than refusing, so
nothing becomes permanently undeactivatable. `beast skills add` puts it back.

### Packs

| Pack | Skills | Contents |
|---|---|---|
| `core` | 14 | the nine routers plus five compatibility aliases. Always installed. |
| `design` | 30 | visual direction, component feel, polish, UI copy |
| `video` | 21 | HyperFrames, Lottie, captions. Needs the `hyperframes` CLI. |
| `prose` | 7 | prose quality, docs, outreach |
| `product` | 10 | positioning, pricing, SEO, monetisation plumbing |
| `engineering` | 15 | architecture, review, hardening, deep investigation |
| `tooling` | 4 | session mining, triage, macOS repair. Machine-specific. |

`core` is forced into every selection because the routers are the dispatch layer. A
pack without them installs skills nothing routes to.

**Read this before using `--packs`.** The routers reach modules through lookup tables
(`| module | path |`), so a missing module narrows a router's menu rather than breaking
it. Nothing crashes. But the gap is large: `--packs=core` alone leaves **86 module
references unresolved**. The prompt reports the count grouped by pack before you
confirm, `install` repeats it after, and both name the command that fixes it. If you
want the full graph, install everything.

---

## doctor

```sh
beast doctor
```

Exits 0 when healthy, 1 on any failure. A clean full install prints one line:

```
macOS · claude+codex+grok · 193 links, 27 active skills, 3 configs,
178/178 payload refs, 117/117 live refs, 1084 payload files
✓ healthy
```

Findings come in three levels. `note` is context, `warn` is a defensible choice worth
knowing about, `fail` is broken.

**Links.** Every link exists, points where the manifest says, and resolves. Skills
outside the recorded selection are skipped rather than reported missing, which is what
`~/.beast/selection.json` is for. Without it a `--packs=core` install produced 100
bogus "not linked" failures and buried the four real ones.

**Orphans.** Links in `$HOME` pointing into the repo that no longer resolve.
Deactivating a skill leaves these behind, they are invisible to the link check above,
and one is enough to break the next bootstrap. `install` prunes them.

**One-copy invariant.** No skill exists as a real directory in both trees.

**Exclusions.** Private packs, product-coupled prompts, and non-redistributable
assets stay out of the payload.

**Secrets.** Scans the payload, and for anything staged in git it reads the **index
blob rather than the working tree**. Staging a secret and then editing it out of the
file leaves it in the commit while the file on disk looks clean. Patterns: Supabase
PATs, Anthropic and OpenAI keys, GitHub PATs, AWS keys, Slack tokens, private key
headers.

**Config** (`lib/checks/config.mjs`). Parses `settings.json` and both `config.toml`
files. Catches malformed JSON or TOML, plugins naming a marketplace that resolves
nowhere, `directory:` marketplaces with a missing path, a `model_instructions_file`
that does not exist, stale `[[skills.config]]` paths, inline credentials in MCP `env`
tables, and `sandbox_mode = "danger-full-access"` paired with `approval_policy = "never"`.

**Skill budget** (`lib/checks/skills.mjs`). The count beast manages is not the count
the tools load. Plugins contribute skills through a separate discovery path. On the
machine this came from, beast managed 27 while Claude Code discovered 37. Reports the
true total, duplicate names across discovery paths, unmanaged skills, Codex-shipped
system skills, and broken links.

**Payload references** (`lib/checks/paths.mjs`). Every `~/…` path in payload text
resolves twice: against `$HOME`, and against the payload. A reference resolving only in
`$HOME` is satisfied by a local leftover and breaks on a fresh clone. That check found
both `BEAST.v2.md` files pointing at a `slop.md` the repo never shipped.

**Live references** (`lib/checks/installed.mjs`). Reads the skills actually linked in
`$HOME` and resolves their cross-references there. This is what makes an existing
partial install announce itself, with the `beast install --packs=…` line that repairs it.

**Platform.** Under WSL, fails when the repo or `$HOME` sits on `/mnt/c` (DrvFs
symlinks are unreliable), and fails when an agent CLI resolves to a Windows `.exe`,
because that reads `%USERPROFILE%` rather than `$HOME` and cannot see anything beast
linked.

---

## Building the payload

`scripts/bootstrap.mjs` populates `home/` from a machine that already has the setup.
Run it once. `beast install` is the separate step that creates links.

```sh
node scripts/bootstrap.mjs [--force]
```

Four stages, and three of them exist because of a specific failure:

1. **Stage** into `.bootstrap-staging/`, never in place. After `install`, the `$HOME`
   sources *are* symlinks into the payload, so deleting the payload first destroyed the
   content the copy was about to read. Staging must also live outside `home/`: a
   sibling named `BEAST.v2.md.staging` string-prefixes `BEAST.v2.md`, and `cpSync`
   then decides the destination is inside the source and throws `ERR_FS_EISDIR`.

2. **Scrub** staged text. Rewrites author-specific paths to `~/`, drops lines
   referencing excluded private packs, and applies renames. This has to be a repeatable
   step. Anything hand-fixed in the payload gets reverted the next time bootstrap reads
   `$HOME`, which undid one round of path cleanup and one rename before it became a
   stage.

3. **Scan** for secrets. On a hit, staging is discarded and the payload is left
   byte-for-byte untouched. The earlier version copied first and scanned second, so a
   rejected run left the secret sitting in the repo.

4. **Normalize** (`lib/normalize.mjs`). Collapses duplicates so every skill exists once
   and the active set is a view. Also a repeatable step: bootstrap dereferences, so an
   active entry that was a view comes back as a second real copy.

Verify with three cycles of `bootstrap --force && install`. Nothing should drift.

One quirk worth knowing: `cpSync` with `dereference: true` on a symlink source reports
it as a directory and throws unless `recursive: true` is also set, whatever `statSync`
says. Every source becomes a symlink after the first install, so this is the normal case
rather than an edge case.

---

## Attribution and licensing

**Most of the skills here are other people's work.** Nine routers are original. The 92
modules come from 17 upstreams, among them `mattpocock/skills`, `pbakaus/impeccable`,
`emilkowalski/skills`, `heygen-com/hyperframes`, `tushaarmehtaa/tushar-skills`,
`Leonxlnx/taste-skill`, `cursor/plugins`, `diffusionstudio/lottie`, `trycua/cua`, and
`hardikpandya/stop-slop`.

`NOTICE.md` is generated, not hand-written:

```sh
npm run notice     # exits 1 while any shipped skill lacks recorded provenance
```

It lists every upstream with its license and copyright holder, tags entries as
`substantially rewritten` or `grant unresolved`, and names the attribution gaps
inherited from the original setup.

**Attribution lives in `NOTICE.md`, not inside skill files.** These skills are being
rewritten and will diverge from what their authors published, so stamping a name into
each file would misrepresent both sides.

`LICENSE` splits the repo: MIT for `bin/`, `lib/`, `scripts/`, `test/`, the nine
routers, and the prompts. Vendored skills keep their own upstream terms.

Two asset classes were removed rather than vendored: `gsap.min.js` (the GreenSock
Standard License restricts redistribution, and it is on npm anyway) and a Cyberpunk
2077 fankit font whose own terms say non-commercial only.

One upstream has **no usable grant**. `lixiaolin94/skills` ships no LICENSE file and
names no copyright holder, offering only a bare `MIT` line in its README, so
`NOTICE.md` flags `web-shader-extractor` as `grant unresolved`.

If your work is here and you want it removed or credited differently, open an issue.

---

## Platforms

Node ≥ 20, plus whichever of `claude`, `codex`, `grok` you use. doctor warns about the
ones it cannot find rather than failing.

| Platform | Status | Verified by |
|---|---|---|
| macOS | Supported | daily use; doctor clean |
| Linux | Supported | clean install in an Alpine container, non-root, read-only repo mount |
| WSL2 | Supported | runs as Linux. Guards unit-tested, **not run on real WSL** |
| Windows | Supported | code paths fixed and unit-tested, **never executed on Windows** |
| WSL1 | Discouraged | doctor warns; symlink behaviour differs from WSL2 |

Windows and WSL support is written and unit-tested but has not been executed on those
platforms. `parseWslRelease`, `isDrvFs`, `symlinkType`, and `whichBinary` are covered
against the exact inputs those platforms produce, and the crash from
`process.env.HOME` being undefined is reproduced and fixed under a simulated
condition. Treat a first Windows run as untested.

### Windows specifics

Directory links are **junctions**, which need no elevation. File links are real
symlinks, which need **Developer Mode** (Settings → System → For developers) or an
elevated shell. Without it the 6 policy files, 3 prompts, and 7 scripts fail to link
while the skills succeed. `install` reports each failure and continues rather than
aborting on the first.

Junctions cannot store a relative target, so `beast skills add` writes an absolute path
on Windows. Move the repo and you must re-run `beast skills`. POSIX keeps relative
links, so clones stay portable.

### WSL specifics

WSL2 is Linux, so the installer works unchanged. Two setups look fine and silently do
not work, and doctor fails on both:

1. **Repo or `$HOME` on `/mnt/c`.** DrvFs symlinks are unreliable and slow. Clone into
   the WSL filesystem.
2. **An agent CLI resolving to a Windows `.exe`.** `/mnt/c/…/claude.exe` reads
   `%USERPROFILE%\.claude`, not `$HOME/.claude`, so everything beast linked is
   invisible to it. Install the CLI inside WSL, or run beast on the Windows side. Do
   not split them.

---

## Verification

```sh
npm test           # 28 tests: linker, enumeration, platform logic, packs, isolation
beast doctor
npm run notice
```

`npm test` covers `bin/` and `lib/` only. Vendored skills ship their own suites which
are not ours and do not all pass; `npm run test:vendored` runs them separately and
never gates.

`test/pack-isolation.test.mjs` deserves a note. It installs into a scratch `$HOME` and
asserts that `coverage()` predicts the dangling reference set exactly, in both
directions. It does **not** assert zero dangling references, because a partial install
leaves them by design, and a permanently red test is one you learn to ignore. It also
verifies the child process honoured the scratch `HOME` before asserting anything, so a
run can never silently measure the real machine.

---

## Troubleshooting

**`payload missing`**. Run `node scripts/bootstrap.mjs` first.

**`payload already populated`**. Pass `--force`. Safe: staging means a failed run
leaves the payload untouched.

**doctor reports many `not linked`**. Your `~/.beast/selection.json` is missing or
stale. Re-run `beast install`.

**doctor reports a partial install you did not intend**. Run the
`beast install --packs=…` line it prints.

**`orphaned link into this repo`**. Run `beast install`; it prunes them.

**A skill you edited reverted.** You edited a generated or `$HOME`-sourced copy.
Payload edits survive; anything reachable only from `$HOME` gets overwritten by the next
bootstrap. Loose files inside skill trees are the trap, since `skillEntries` yields
directories only. Add them to `FILES` in `lib/manifest.mjs`.

**A vendored patch disappeared.** Upstream updates overwrite vendored skills. The
supply-chain fix in `hyperframes-animation/scripts/package-loader.mjs` is commented and
must be re-applied after `npx hyperframes skills update`.

**Over the skill cap**, `beast doctor` names every source. Plugins count too, and
`claude plugin details <name>` shows what one contributes.

---

## Layout

```
bin/beast.mjs            install | doctor | skills
lib/manifest.mjs         single source of truth: links, targets, exclusions, secrets
lib/platform.mjs         every OS branch lives here and nowhere else
lib/fsutil.mjs           the linker
lib/install.mjs          lib/doctor.mjs  lib/skills.mjs
lib/packs.mjs            pack definitions
lib/coverage.mjs         what a pack selection leaves unreachable
lib/normalize.mjs        the one-copy invariant
lib/scrub.mjs            durable path and rename rewrites
lib/prompt.mjs           dependency-free arrow-key prompts
lib/checks/              config, skills, paths, installed
scripts/bootstrap.mjs    populate the payload
scripts/gen-notice.mjs   generate NOTICE.md
home/                    the payload: 1084 files, 22 MB
```

21 source files, about 2960 lines, no dependencies.

---

## Not included

- Statusline and spinner customisations. The source setup ran an ad-supported statusline.
- Any local model-proxy setup or its credentials.
- Private project packs and product-specific prompts.
- `--dangerously-skip-permissions` and `--yolo` defaults in the shell functions. The
  originals had them. Add them per-invocation if you want them.
