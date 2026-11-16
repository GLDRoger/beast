---
name: long-work
description: Use when a task will take many hours, many files, or several sessions, and needs sub-goals with their own checks and a plan file that survives compaction.
---

# Long work

## Plan before the first edit

1. Write the outcome in one or two sentences, as the user would judge it. Name the check that proves it.
2. Break it into sub-goals. Each one:
   - leaves the system working and committable on its own;
   - has its own check (a test, a command, a rendered state, a measured number);
   - is small enough to finish in one stretch of context.
3. Order them so the riskiest or most uncertain sub-goal comes first. Learning early that the approach fails is cheap; learning it at stage nine is not.
4. Mark which sub-goals are independent. Those can go to parallel workers with disjoint files.

## Keep the plan where it survives

Keep the plan in a file in the repo's scratch area or a temp path, not only in context: `PLAN.md` (or the project's own convention). It holds the outcome, the sub-goals with status (todo, doing, done, dropped), the decisions made and why, and open questions. Update it as each sub-goal lands. After a compaction or a new session, read it before anything else.

Make a question a sub-goal once you can state it precisely, even if it is blocked; until then, keep it as a loose note under open questions rather than slicing it into guessed sub-goals. When parallel sessions share the plan, each marks its sub-goal `doing` and saves before starting work, so the others skip it.

## Working through it

- Finish, check and commit one sub-goal before starting the next. A commit per sub-goal is the restore point.
- When a sub-goal reveals the plan is wrong, change the plan file first, then the code. Don't let the plan and the work drift apart.
- Keep the change size in proportion to what each sub-goal gains. Drop a sub-goal whose cost has grown past its payoff, and note why.
- For many similar edits, do the first one by hand, then write the script or codemod that does the rest, and check it reproduces your hand-made edit, so a reviewer can rerun one script instead of rereading every edit.
- Report progress at sub-goal boundaries: what landed, its evidence, what's next. Not every edit.
- The goal is reached when the outcome's own check passes, not when the list is ticked.

## When the goal is a number

For sustained work on one measurable thing (load time, bundle size, an eval score, test runtime):

1. Fix the metric, which direction is better, and a stop condition that pairs a target with a minimum number of attempts, so one lucky early win does not end the run.
2. Build the measurement once, show that it separates a bad case from a good one, then freeze it. It reports the median of several runs, an error count, and a count of the work done. Record the baseline and a green run of the tests that must keep passing.
3. One change per attempt. Each names the mechanism it targets ("move X off the startup path because it blocks first paint"), not "try memoising something".
4. Measure, run the tests, and keep the change only when the number moves past the noise and the tests stay green. Otherwise revert it completely. One commit per kept change.
5. Log every attempt, kept or reverted, with before, after, and why, in the plan file.
6. At the first plateau, change category, combine near misses, or try something bolder before stopping. Never loosen the stop condition to meet it. Correctness and simplicity outrank the number.

Report the baseline, the final number with the change in percent, attempts kept and reverted, one line per kept change, and the best idea not yet tried.

## Directing workers

When sub-goals go to other agents:

- Take one unit through brief, work, review, and merge before fanning out, so a flaw in the brief costs one worker, not ten.
- Each brief names the evidence that proves the unit done (a command and its expected output, a capture, a chart) and the files the worker may and may not touch. If you cannot name the evidence, the unit is not scoped yet.
- Judge the diff and the artifact, not the worker's summary. A verdict covers one commit; a new push needs a new look.
- Retry by cause: a smaller scope after running out of context, the same brief after a dropped connection, and the fallback your model routing names after an outage or repeated errors. After two failed retries, drop the unit and replan around it.
