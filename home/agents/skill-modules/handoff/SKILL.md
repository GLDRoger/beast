---
name: handoff
description: Use when the user asks for a handoff or a pause, at a natural stopping point in long work, or when picking up another session's unfinished work, to stop cleanly with a compact document another agent or person can continue from, or to resume from one without redoing it. For planning multi-stage work up front, use long-work.
argument-hint: "What will the next session be used for?"
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save it to a path produced by `mktemp -t handoff-XXXXXX.md` (read the file before you write to it).

Suggest the skills to be used, if any, by the next session.

Do not duplicate content already captured in other artifacts (PRDs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.

## Pausing

Pause only when asked to, or when a session must end. "Keep going" is not a pause.

1. Stop at a safe boundary: finish the current step or back out of it, start nothing new, and stop any workers you started.
2. Take no irreversible action to pause: no new PR or push that was not already planned.
3. Make the work durable: commit uncommitted edits as one `wip:` commit on the current branch, and say in the commit body if the tree is broken.
4. Write the document with: the intent in the user's words, what is done and how each part was verified, the current state (branch, commits, running processes), the first action on resume, the key files, and the traps found so far.

## Picking up

1. Read the trail first: the handoff document, the plan file, the branch, and what landed (`git log`, `git diff` against the base). Treat the recorded decisions as given; do not re-derive them.
2. Name the resume point: what was planned, what landed, what is left.
3. Do not redo verified work. Check inherited claims of success against the real artifact (rerun the named check, open the capture), because a previous agent's report is not proof.
4. Continue under the workflow that owns the remaining work.

Report where the previous session stopped, what you inherited, anything you had to redo and why, and the outcome.
