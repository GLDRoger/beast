---
description: Verify the requested change using repository-specific checks and the affected behavior and risk
argument-hint: [FILES="<paths>"]
---
Inspect the scoped diff, repository instructions, scripts, and the tests that exercise the change. Select meaningful checks using `~/.agents/skills/code/references/verification.md`; do not impose a universal package manager or command sequence.

Run the relevant success/failure checks and broader gates warranted by the changed surface. Configuration and dependencies need effective-tool/build/runtime evidence, not whitespace alone. Confirm that commands use safe targets before executing them.

Report observed results, relevant pre-existing failures, and unverified boundaries. Fix introduced issues when the user's task authorizes changes; a verification-only request remains read-only. Do not repeat unchanged checks without new evidence or weaken a check to claim success.
