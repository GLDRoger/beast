---
name: long-work
description: Plan and carry long, multi-stage work (many hours, many files, several sessions or rounds) by breaking the goal into sub-goals with their own checks and a plan file that survives compaction. Use when a request won't fit in one sitting or one context.
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

## Working through it

- Finish, check and commit one sub-goal before starting the next. A commit per sub-goal is the restore point.
- When a sub-goal reveals the plan is wrong, change the plan file first, then the code. Don't let the plan and the work drift apart.
- Keep the change size in proportion to what each sub-goal gains. Drop a sub-goal whose cost has grown past its payoff, and note why.
- Report progress at sub-goal boundaries: what landed, its evidence, what's next. Not every edit.
- The goal is reached when the outcome's own check passes, not when the list is ticked.
