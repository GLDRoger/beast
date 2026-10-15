---
description: Draft a reusable task prompt from the user's goal and available context; use only when prompt writing is requested
argument-hint: [TASK="<request>"] [PROJECT_PATH=""] [DELIVERABLE="code|plan|docs|analysis|research"]
---
Write the requested prompt, not an implementation of the underlying task. Use the conversation and supplied project context before asking for missing information. An omitted project path does not imply a new project. Ask one focused question only when a missing decision materially changes scope, correctness, or risk.

Include the outcome, relevant inputs, boundaries, deliverables, and proportionate verification. Preserve exact user constraints and distinguish known facts from assumptions. Add security, rollback, output schemas, or detailed command requirements only when the task needs them and the commands are verified.

Tell the executor to carry unresolved goals through corrections, use safe assumptions, complete authorized work, and respect actual external-action and user-owned testing boundaries. Do not require routine restatement, phase narration, fixed question counts, or a rigid schema for ordinary work.

Return the usable prompt in a fenced Markdown block, with a brief note only if a consequential assumption needs explanation.
