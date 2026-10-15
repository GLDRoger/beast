---
name: review-swarm
description: "Run a multi-model PR/diff review panel and sort findings into actionable, nit, or ambiguous. Use when one reviewer’s lens isn’t enough and you want arbitration plus fixes."
---

# Review Swarm

Review the selected change with independent judgment when the task and runtime permit delegation. Match completion to the user's authorization: a review ends with verified findings; a fix request includes scoped implementation and checks; an explicitly authorized PR shepherding request can include commit, push, CI, and feedback follow-through. The presence of a PR URL alone does not authorize any mutation.

## Invariants

- Read the applicable `AGENTS.md` files before reviewing or editing.
- Treat the target diff as the boundary, but trace changed code through callers,
  tests, schemas, configuration, and shared primitives when needed.
- Never turn a change review into an unrelated whole-repository audit.
- Reviewers are independent and do not see one another's output.
- Reviewers propose findings; the arbiter alone accepts and classifies them.
- Never post raw reviewer output to GitHub.
- Every accepted item ends as `actionable`, `nit`, or `ambiguous`.
- Classify actionable items by demonstrated impact. Fix them when the user requested fixes; severity does not determine whether a claim is true.
- Do not pause for ambiguous items while independent work remains.
- Never touch unrelated user work. A correct root-cause fix may edit files that
  were not in the original diff.
- Never force-push, rewrite history, change a PR's base, or delete branches.
- Never expose secrets, private production data, or sensitive logs in prompts,
  reports, commits, or GitHub comments.
- Do not autonomously perform destructive migrations, delete user data/assets,
  rotate secrets, change billing behavior, weaken security/compliance controls,
  add a dependency with meaningful supply-chain risk, or make a breaking public
  API change. Classify these as ambiguous with the exact decision required.

## Accepted targets

Accept one of:

1. GitHub PR URL.
2. PR number in the current repository.
3. No argument when the current branch has a PR.
4. `working-tree` for current staged and unstaged changes.
5. A commit SHA.
6. A branch or Git revision range.

Resolve the requested target and repository context before acting. A closed/merged PR or missing push permission does not prevent a read-only review. Verify write permissions only when an authorized action needs them; do not guess past a genuinely ambiguous target.

GitHub posting, review-thread mutation, commits, pushes, and iterative PR shepherding require explicit authorization for that work. Non-PR reviews report locally; editing still requires a change request. A child review within an authorized build returns its findings to the primary workflow rather than creating a new approval gate.

## Phase 1: Resolve and isolate the target

For a PR, resolve metadata in one call where possible:

```bash
gh pr view <pr> --json number,url,state,isCrossRepository,headRefName,headRefOid,headRepositoryOwner,baseRefName,baseRefOid,reviewDecision,statusCheckRollup
```

Derive owner/repository from `url`. Record the initial head SHA. Use plain
`git` and `gh`; do not require Graphite.

- Use the current checkout only when it is clean and already on the PR head.
- Otherwise create an isolated temporary worktree for the PR head.
- Never overwrite, stash, clean, or absorb existing user changes.
- Before each commit, use
  `~/.codex/scripts/dirty_worktree_report.py` when available to
  prove the staged scope. Include every file required for the finding's proper
  root-cause fix, even if it was previously unmodified.

For all targets, gather the diff, changed files, relevant commits, applicable
instructions, and a compact repository map. Prefer
`~/.codex/scripts/repo_snapshot.py` when available. Read full
files only when a reviewer needs them; do not paste an entire large repository
or sensitive generated artifacts into prompts.

## Phase 2: Launch the independent panel

Select independent lenses that add value for this diff, preserving any panel size or roles the user explicitly requested:

- **Correctness and architecture:** invariants, callers, concurrency, failure modes, duplication, and contracts.
- **Product and design:** actual workflow, accessibility, copy, hidden scope, and brittle assumptions; omit invented UI commentary on non-UI changes.
- **Security and boundaries:** authentication, authorization, tenancy, input/files, privacy, and dependencies.
- **Tests and operations:** regression coverage, migrations, observability, performance, and rollback.

Read `~/.beast/delegation.md` and use current runtime capabilities. Prefer native subagents for suitable same-task review. Use agent-broker for intentional cross-provider work; discover actual provider/model availability before dispatch. When agent-broker is unavailable, call Codex or Claude Code headless as that runbook shows. Do not require a saved model roster or a wrapper CLI when native tools fit. If delegation is unavailable or disallowed, review directly and disclose the lack of independence.

Give reviewers the minimum relevant diff/context and read-only access. They must not see one another's findings or mutate the target. The primary owner integrates the results.

Each reviewer returns only:

```text
REVIEWER: <role>
SUMMARY: <one paragraph>
FINDINGS:
- id: <stable short id>
  title: <short title>
  severity: <critical|high|medium|low|nit>
  file: <path or general>
  line: <line or general>
  claim: <what is wrong>
  evidence: <specific code/data-flow evidence>
  consequence: <real failure mode>
  fix: <smallest correct root-cause fix>
  confidence: <high|medium|low>
```

Use `FINDINGS: (none)` when clean. No reviewer may edit files, post to GitHub,
or see another reviewer's findings.

## Phase 3: Collect all existing PR review items

For PR targets, fetch and account for:

- every unresolved, non-outdated inline review thread, including all comments
  and participants;
- submitted review bodies containing concrete findings;
- top-level PR comments or bot summaries containing concrete review findings.

Ignore general discussion, release notes, CI logs, label/protocol messages, and
stale bot summaries tied to an older SHA. Trim large bodies during the initial
fetch and refetch the full item before acting. If a participant cannot be
classified confidently, treat the item as human-authored.

Human authorship does not make a clear finding ambiguous. Fix eligibility still depends on the user's requested scope; fetching review comments alone is read-only.

## Phase 4: Arbitrate every item

The primary owner verifies the panel findings against the current target. Use a separate available arbiter only when independent arbitration adds value and delegation is permitted. The arbiter remains read-only and must:

1. Verify every claim against current code and the actual target.
2. Reject false, stale, already-fixed, duplicate, or out-of-scope claims.
3. Merge findings that share the same root cause and record convergence.
4. Classify every accepted item:
   - `actionable`: concrete, correct, in scope, and implementable without a
     product/architecture decision. Includes LOW findings with real impact.
   - `nit`: style-only, speculative, duplicate, intentional, or lacking a
     worthwhile behavior, safety, accessibility, or maintainability benefit.
   - `ambiguous`: evidence cannot determine the right product or architectural
     outcome, or the fix crosses a protected safety boundary.
5. For ambiguous items, state the smallest exact decision the user must make,
   the viable options, and the arbiter's recommendation.

The arbiter may not edit, post, resolve, commit, or push. Do not accept a
finding merely because multiple reviewers repeated it; convergence raises
confidence but is not proof.

## Phase 5: Publish the accepted PR review

Only when posting a PR review is authorized: post accepted, deduplicated findings as one GitHub review with
inline comments where valid diff positions exist. Use a top-level review item
for general findings. Every automated body begins with:

```markdown
> [!NOTE]
> Automated by **Review Swarm** — not written by a human
```

Maintain exactly one top-level sticky summary marked
`<!-- review-swarm-summary -->`; update it in place on every round. Include:

- round and head SHA;
- panel models actually used;
- actionable, nit, and ambiguous counts;
- fixes and verification results;
- nit dispositions and reasons;
- unresolved ambiguities with exact decisions needed;
- required CI state;
- compact prior-round history.

Do not post rejected/raw findings. Avoid duplicate inline comments by matching
the marker, path, line, and normalized finding title before creating a comment.

## Phase 6: Fix, verify, commit, and triage

Only when fixes are authorized: process actionable items by shared root cause, not one comment at a time. Commit, push, post, and resolve threads only when those external actions are also authorized. Otherwise finish with the local diff and evidence.

1. Inspect every caller of the shared function or primitive being changed.
2. Apply the smallest canonical fix. Delete obsolete duplicate paths only when
   the requested fix makes them dead and removal is safe.
3. Add or update one proportional regression check for non-trivial behavior,
   using the repository's existing test style. Skip manufactured tests for
   formatting, copy-only edits, or trivial corrections.
4. Discover verification from applicable `AGENTS.md`, changed files, package
   scripts, CI workflows, and repository tooling. Prefer
   the actual repository scripts and `~/.agents/skills/code/references/verification.md` when choosing checks.
5. Run targeted checks before each push. Before declaring clean, run the
   strongest practical repository handoff gate.
6. If the fix caused a failure, keep working and do not push. If a failure is
   demonstrably pre-existing or environmental, the valid fix may be pushed,
   but leave the affected thread unresolved and report exact evidence.
7. Stage only files required by accepted findings. Commit with a concise
   Conventional Commit message, then push normally to the existing PR head.

After a verified push:

- reply to human-authored actionable threads with the fix commit and exact
  verification result, then resolve them;
- resolve bot/panel actionable threads with the same traceability;
- resolve nits and record the reason in the sticky summary;
- leave ambiguous threads unresolved;
- for actionable top-level comments/review bodies that cannot be resolved,
  reply only when needed for traceability and record disposition in the summary.

Never resolve an actionable thread whose fix is unverified.

## Phase 7: Converge

For PRs, after each push:

1. Wait for required CI checks to complete. Do not wait indefinitely for
   optional bots without required status checks.
2. Refetch the PR head and all current review items.
3. Rerun the independent panel on the new HEAD when substantive code changed.
4. Re-arbitrate new and remaining items.
5. Repeat fix, verify, push, and triage.

GitHub and the current head SHA are the restartable source of truth. Before any
mutation, confirm the PR head still equals the SHA reviewed. If it moved, fetch
and restart the round; never push stale work over another contributor.

Use a convergence guard instead of a blind iteration cap. If substantially the
same finding survives two verified fix attempts, or reviewers alternate between
incompatible demands, reclassify it as ambiguous and show the evidence. Stop
immediately on permission failure, merge conflict, unsafe branch state, or a
protected safety boundary.

## Completion contract

A read-only run is complete when the requested findings are verified and reported. An authorized local fix is complete when the scoped implementation and relevant checks are done. For an explicitly authorized PR shepherding run, completion additionally requires:

- required checks pass, or an exact pre-existing/environmental blocker is
  proven and reported;
- no current actionable findings remain;
- all nits have recorded dispositions and are resolved where possible;
- every current review item is accounted for;
- only ambiguous items remain unresolved and each contains one exact decision
  for the user;
- the sticky summary reflects the final HEAD.

Return a terse final report with the final SHA, commits pushed, checks run,
threads resolved, and ambiguous decisions. If none remain, say so explicitly.
For non-PR targets, return the same classification and verification evidence
locally, omitting GitHub and push state.
