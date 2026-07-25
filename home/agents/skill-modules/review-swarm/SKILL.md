---
name: review-swarm
description: "Run a multi-model PR/diff review panel and sort findings into actionable, nit, or ambiguous. Use when one reviewer’s lens isn’t enough and you want arbitration plus fixes."
---

# Review Swarm

Review exactly one change target. For PRs, own the complete loop: review,
triage, fix, verify, push, wait for required CI, refetch feedback, and repeat.
Finish only when all current findings and review items are resolved except
genuine ambiguities surfaced for the user.

## Invariants

- Read the applicable `AGENTS.md` files before reviewing or editing.
- Treat the target diff as the boundary, but trace changed code through callers,
  tests, schemas, configuration, and shared primitives when needed.
- Never turn a change review into an unrelated whole-repository audit.
- Reviewers are independent and do not see one another's output.
- Reviewers propose findings; the arbiter alone accepts and classifies them.
- Never post raw reviewer output to GitHub.
- Every accepted item ends as `actionable`, `nit`, or `ambiguous`.
- Fix actionable items regardless of severity. Severity does not determine truth.
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

Reject multiple targets, closed/merged PRs, ambiguous repository context, and
fork PRs without head-branch push permission. Explain the blocker; do not guess.

PR-only behavior: GitHub posting, review-thread mutation, automatic commits and
pushes, required-CI waiting, and the iterative shepherd loop. For non-PR
targets, report locally and may edit the current working tree, but never commit
or push unless the user explicitly requests it.

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

Run all four reviewers concurrently. Tell each it is the sole reviewer, give it
the target diff and repository path, allow repo-aware read-only inspection, and
require the output contract below.

1. **Correctness and architecture — `gpt-5.6-sol`**
   Trace invariants, callers, data flow, concurrency, failure modes, duplication,
   maintainability, API contracts, and root-cause placement.
2. **Adversarial product and design — `fable-5`**
   Challenge product behavior, UX, accessibility, copy, API taste, hidden scope,
   and brittle assumptions. For non-user-facing changes, focus on adversarial
   code judgment instead of inventing design commentary.
3. **Security and boundaries — `gpt-5.6-terra`**
   Review authentication, authorization, tenancy, validation, injection, SSRF,
   unsafe files/uploads, secrets, privacy, dependencies, and compliance impact.
4. **Tests and operations — `gpt-5.6-terra`**
   Review regression coverage, error handling, migrations, observability,
   performance, deploy/runtime risk, provider parity, and rollback behavior.

Use native Codex agents for GPT models. For Claude models, spawn a thin Codex
wrapper agent labelled with a `claude:` prefix. The wrapper writes a
self-contained prompt, runs `claude -p --model fable --tools "Read,Grep,Glob"
--add-dir <repo>`, and returns the report. Give long Claude runs a real timeout;
if Fable is unavailable, use `opus-4.8`. If Claude itself is unavailable, use
`gpt-5.6-sol` and disclose the substitution.

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

Human-authored actionable items are eligible for auto-fixing. Human authorship
does not make a clear finding ambiguous.

## Phase 4: Arbitrate every item

Launch a separate `gpt-5.6-sol` arbiter. Give it the panel findings, existing
PR review items, current target diff, and read-only repository access. It must:

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

PR targets only. Post accepted, deduplicated findings as one GitHub review with
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

Process actionable items by shared root cause, not one comment at a time.

1. Inspect every caller of the shared function or primitive being changed.
2. Apply the smallest canonical fix. Delete obsolete duplicate paths only when
   the requested fix makes them dead and removal is safe.
3. Add or update one proportional regression check for non-trivial behavior,
   using the repository's existing test style. Skip manufactured tests for
   formatting, copy-only edits, or trivial corrections.
4. Discover verification from applicable `AGENTS.md`, changed files, package
   scripts, CI workflows, and repository tooling. Prefer
   `~/.codex/scripts/verification_router.py` when available.
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

A PR run is complete only when:

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
