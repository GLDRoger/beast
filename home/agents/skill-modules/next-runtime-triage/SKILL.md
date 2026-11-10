---
name: next-runtime-triage
description: Use when the user pastes a Next.js stack trace or runtime error log full of .next chunk paths, Prisma errors, or AbortError, before editing anything. A local script condenses it into likely source files and stale-build clues.
---

# Next Runtime Triage

Run the script before manually reading generated chunks:

```bash
~/.codex/scripts/next_runtime_triage.py <trace-file>
```

Or pipe pasted logs through stdin.

## Rules

- Never edit `.next` generated chunks.
- Search extracted source candidates and error text.
- Treat `.next/dev/server/chunks` as stale-build clues, not source files.
- Classify `AbortError` as a reachability/timeout/callback clue before blaming nearby services.
- Classify Prisma disconnect codes separately from real schema/query bugs.
