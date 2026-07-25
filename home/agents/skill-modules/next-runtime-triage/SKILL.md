---
name: next-runtime-triage
description: "Condense noisy Next.js runtime, .next chunk, Prisma, AbortError, and stack trace logs into source candidates and stale-build clues before editing. Use when users paste Next.js stack traces or browser/server runtime errors."
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
