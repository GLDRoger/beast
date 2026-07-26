This file layers on top of the system prompt (`~/.codex/BEAST.v2.md`). Behavioral basics — intent, scope, verification, safety, communication — live there. Keep this file to user-specific policy and config, and don't restate the base.

# Engineering bar

Production-grade means correct and durable, not big. Reach it with the smallest scope that fully achieves the goal.

- Build for real use (>1000 users), not demo conditions — through correctness and simplicity, not speculative infrastructure.
- Make the change the single canonical implementation in the primary codepath; delete legacy/dead/duplicate paths as part of delivery and disclose consequential deletions.
- Direct, first-class integrations; no shims, wrappers, glue code, or adapter layers.
- One source of truth for business rules (validation, enums, flags, constants, config).
- Clean API invariants: define required inputs, validate up front, fail fast.
- Latest stable libs/docs; when unsure, web-search the newest sources unless an older version is explicitly required.

## Coding style

- Target <=500 LOC per file (hard cap 750; imports/types excluded).
- Keep UI/markup nesting <=3 levels; extract components/helpers when JSX/templating repeats, responsibilities pile up, or variant/conditional switches grow.

## Security

- Do not delete or move user-owned data, assets, or unrelated files without explicit permission. Code made obsolete by the requested change may be removed to leave one canonical implementation; disclose it.
- Validate/sanitize untrusted input: injection, path traversal, SSRF, unsafe uploads.
- Enforce AuthN/AuthZ and tenant boundaries; least privilege.
- Be cautious with new dependencies; flag supply-chain/CVE risk.

## Git

- Ask before any `git push`, even when the task implies one.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, ...).
- `gh` CLI for GitHub operations (issues/PRs/releases).
- If files change unexpectedly mid-task, assume parallel edits and continue; keep your diff scoped. Stop only for conflicts/breakage, then ask.

## Pull requests

- Short and structured: **Why** (1–2 bullets), **How** (1–3 bullets), **Tests** (commands + results).
- No logs/dumps; only key context, risks, and screenshots when UX changes.

## Shell

- Prefer built-in file/search tools over ad-hoc shell plumbing.
- `fd` (files), `rg` (text), `ast-grep` (syntax-aware), `jq`/`yq` (extract/transform).
- Limit output; pick a single result deterministically.

# Picking models for delegated work

`~/.beast/delegation.md` is the authoritative list of CLIs available for delegation on
this machine. Consult it before routing work outward, and delegate only to what it
lists.


Rankings, higher = better; higher cost score = cheaper. These are opinionated starting values —
retune them for your own plans. **Cost** is effective marginal cost under the plans you already
hold, not list price: a model bundled into a subscription you pay for anyway scores well even
when its per-token price is high. **Intelligence** is how hard a problem you can hand the model
unsupervised. **Taste** covers UI/UX, code quality, API design, and copy.

|model        |cost|intelligence|taste|
|-------------|----|------------|-----|
|gpt-5.6-sol  |9   |9           |9    |
|gpt-5.6-terra|10  |7           |6    |
|sonnet-5     |5   |5           |7    |
|opus-5       |4   |8           |8.5  |
|fable-5      |2   |9           |9    |
|grok-4.5     |7   |7           |8    |

Routing:

- Bulk/mechanical work (clear-spec implementation, data analysis, migrations): gpt-5.6-sol — native in Codex, so use the normal execution/review paths rather than shelling out.
- Anything user-facing (UI, copy, API design): taste >= 7.
- Reviews of plans/implementations: fable-5 or opus-5, optionally gpt-5.6-sol as an extra independent perspective.
- Never use Haiku.
- These are defaults with standing permission to escalate: if a cheaper model's output misses the bar, redo it with a smarter model without asking. Judge the output, not the price tag. When axes conflict for anything that ships, intelligence > taste > cost.

Mechanics for non-Codex models:

- Claude via Claude Code CLI: `claude -p --model fable|opus|sonnet`. Pure text/judgment: `--tools ""`. Repo-aware read-only review: `--tools "Read,Grep,Glob" --add-dir <repo>`.
- Grok via grok CLI, same patterns: `grok -p --model grok-4.5 <query>`.
- Inside workflows/subagents, spawn a thin Codex wrapper agent that writes a self-contained prompt, runs the CLI via shell, and returns the report. Label it with the real worker, e.g. `label: "claude: review-auth"`.
- CLI runs can exceed shell timeouts: set an explicit timeout, or run in the background and poll for a report file. If a run hangs, test with `claude -p "Reply with exactly: ok"`; if only the real workload hangs, abandon that CLI for this task and run the review through a Codex-native path.
- Parallel non-Codex implementation agents need isolated worktrees so edits don't collide in the shared checkout.
- Codex token budgets count only Codex tokens; external CLI work is invisible to budget accounting.

# Workspace

- `~/.agents/skills/` is the canonical location for user-managed skills; only Codex's bundled/internal skills live elsewhere.
- Check `~/.codex/scripts/` before rebuilding a workflow; if the same Python/shell logic gets written a second time, promote it into a script there.
  - `session_miner.py` — summarize Codex session JSONL logs (repeated workflows, tool-output bloat, skill/script candidates).
  - `repo_snapshot.py <repo>` — compact repo map: git state, config, source dirs, package metadata, verification scripts.
  - `verification_router.py --repo <repo> <touched-files...>` — smallest sufficient verification commands for touched files.
  - `dirty_worktree_report.py --repo <repo> --touched <files...>` — separate touched files from unrelated dirty work before commit/stash decisions.
  - `next_runtime_triage.py <trace-file>` — condense noisy Next.js/runtime stack traces into source candidates.

# Writing prompts

Write requested prompts in markdown; if not writing to a file, wrap in triple backticks so they can be copied easily.

# Follow-ups

When genuinely useful next actions remain, offer up to a few concrete suggestions. Make them copy-pasteable prompts when that helps the user continue or hand off the work. Skip follow-ups when the answer stands on its own.
