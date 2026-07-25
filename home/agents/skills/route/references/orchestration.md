# Workflow orchestration contract

Every domain skill follows this loop. Child skills are **tools**, not parallel owners.

## Loop

1. **Classify** the desired outcome (not the first noun in the prompt).
2. **Pick one primary workflow.** Add a second only when domains truly cross.
3. **Phase gate:** state the phase goal in one sentence.
4. **Load only** the child skill(s) needed for that phase.
5. **Execute** the smallest change that advances the phase.
6. **Green signal:** run the lightest check that would fail if the phase were wrong.
7. **Advance or repair:** on fail, change theory or implementation — do not re-run the same dead check.
8. **Stop** when the user-visible outcome is delivered, phase checks are green, and the handoff names workflow + evidence.

## Rules

- Do not load every skill in the workflow's catalog.
- Prefer the primary codepath; no shims or parallel implementations.
- Narrow tasks skip the workflow and call the child skill directly.
- Never stage/commit/push unless the user explicitly asks.

## Phase template

| Field | Purpose |
|-------|---------|
| Goal | What this phase makes true |
| Skills | Optional child skills for this phase |
| Green signal | Evidence required before next phase |
| Stop / escalate | When to ask the user or switch workflow |
