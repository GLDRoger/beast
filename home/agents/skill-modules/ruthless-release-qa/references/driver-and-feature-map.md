# App driver and feature map

Loaded from `SKILL.md` when a project has no scripted way to drive its real app, or its feature map may have drifted. Build these once per project; every later check reuses them: routine verification of a change, release QA, UI property runs, and comparing builds. Without them, every agent rebuilds its own setup, and some end up checking by page text or not at all.

Keep both in the project as a project-local skill (for example `.agents/skills/verify-<app>/SKILL.md` with `features/` beside it, or the repo's own convention), with frontmatter that names the app and says when to use it. Write it for an agent that reads it cold, mid-task, and has never seen the app.

## Find out from the repo

Answer these from the code and docs; ask only what you cannot observe.

- **Surface.** What does a user touch: web, desktop, mobile, CLI or TUI, an API, an agent tool? Note each kind of user (signed out, member, admin, owner, a second tenant) and each client.
- **Run.** The repo's own dev command, ports, env vars, seed data, and auth.
- **Drive.** Existing harnesses first: Playwright or Cypress specs, a CDP port, PTY helpers, curl-able routes, the agent tool's own entry point.
- **Observe.** Accessibility tree, screenshots, terminal transcripts, response bodies, logs, exit codes, stored rows.
- **Isolate.** Can two instances run side by side with their own ports and data directories? If not, the driver refuses to drive an instance it did not start.

If the checkout does not build or start as it is, fix that or report it precisely first. A driver written against a broken base teaches wrong steps.

## The driver

One small command set, built on the harness the repo already has. Size it to the flows that keep breaking, not to every feature at once.

| Command | Does |
|---|---|
| `start` | Starts an isolated instance from an empty data directory: its own ports and data, migrations applied, seeded with invented people and records. Reports ready only when the app is usable, not when a port answers. Refuses to start against the user's real data directory. Records the PIDs it started. |
| `doctor` | Read-only: the process is up, it is this checkout's build, the port belongs to our PID, the data directory is the isolated one, and the session is the expected user. Run it first and after anything surprising. |
| `as <role>` | Signs in as each kind of user without clicking through the login form (seeded sessions or tokens), so every check can run per role. |
| `snapshot` | The screen as text: the accessibility tree (role and name) plus visible text. Cheaper for an agent to read than a screenshot. |
| `click`, `fill`, `press` | Act by role and accessible name, never by coordinates, CSS position, or tab order. A control the driver cannot name is an accessibility finding. |
| `screenshot --out <path>` | Captures only to an explicit path. Refuses paths inside the real app's home or data directory. |
| `call <entry point>` | Calls the backend the way the real entry point does: the same route, RPC, or agent tool handler a client or agent hits, not an internal function. Bugs fixed in a unit test can still break through the entry point. |
| `clock`, `deliver` | Only when the product has time or inbound events: advance the clock, deliver a fake email or webhook. |
| `stop` | Kills only the PIDs `start` recorded, removes scratch state, and keeps the evidence. |

Prove it before handing it over: `start`, `doctor`, drive one mapped feature, capture, `stop`, then confirm the evidence still exists. A driver that was never run end to end is a draft.

## Proof standards

- Exercise the real user path, not test-only setters or endpoints.
- Capture the action and the resulting state, not just the final screen: a text snapshot plus a screenshot with the app visibly identifiable.
- Confirm a change through a second, read-only view: reopen the record, read the stored value.
- Mock only where production already isolates the external system.
- When the safe path is a dry run or test mode, observe what it actually skips (files, network, external calls) instead of trusting its name.
- Report an unreachable entry point with the missing precondition and what you tried. Never report a skipped entry point as verified through a different one.

## The feature map

An index (`features/README.md`) plus one file per user-facing feature, in the user's words. It is the shared vocabulary between the owner and agents: "Settings › Notifications › Email digest", not "the toggle in the sidebar".

Each feature file has:

- **What it is:** one paragraph on what the user gets.
- **Sub-features:** short ids with one line each, such as `digest-enable`, `digest-time`.
- **How to get to it:** every entry point, per kind of user and per client: the menu path, keyboard shortcut, command palette, deep link, CLI command, agent tool.
- **Driving it:** preconditions, then one line per step pairing the user's action, the exact driver command, and the observable result.
- **Proof:** the test or driver script that proves each sub-feature through each entry point.
- **Gotchas:** traps that waste or invalidate a run.

Keep implementation details out. Start with the three to five features that matter most and grow the map as features are touched.

Example entry, invented:

```markdown
# Email digest

Members choose whether to get a daily email of what changed, and at what time.

## Sub-features
- `digest-enable` turns the digest on or off.
- `digest-time` sets the hour it is sent.

## How to get to it
- Web and desktop, any signed-in role: Settings › Notifications › Email digest.
- Mobile: Profile › Notifications › Email digest.
- Command palette: "Email digest".

## Driving it
Preconditions: signed in as `member`, digest off.
- Open settings. `app click --role link --name "Settings"`. The Settings page shows.
- Turn it on. `app click --role switch --name "Email digest"`. The switch reads on and a time picker appears.
- Confirm it stuck. `app click --role link --name "Home"`, `app click --role link --name "Settings"`, then `app snapshot`. The switch still reads on.

## Proof
- `digest-enable`, web: `e2e/settings/digest.spec.ts`. Mobile: `scripts/verify/digest-mobile.sh`.
- `digest-time`: none yet.

## Gotchas
- The time picker uses the member's time zone, not the server's.
```

## Checks that keep the map honest

Cheap scripts in CI, each with an error that names the fix:

- **Every entry point has a proof.** A feature with an entry point and no proof fails ("`digest-time` has no proof; add a test or driver script and list it under Proof in `features/email-digest.md`").
- **Proof paths exist.** Every path under Proof resolves to a file.
- **New surfaces are mapped.** Compare the router's routes, the command registry, or the menu definitions with the map; a new screen or command without an entry fails.
- **Depth stays within the agreed limit.** When the product has a rule such as "list → record → sheet, no deeper", record each feature's depth and fail past it.

These turn "works on web, never tried on the phone or as a member" into a failing check instead of a review comment.

## Keeping the map true

Run this pass before release QA, after a large merge, or when a check above starts failing often.

1. Fix the index: missing, extra, duplicate, or dead entries.
2. Read each feature from source (parallel read-only workers are fine) and note likely drift with citations.
3. Drive every feature live at least once. Run `doctor` first and again after any failed step; reset or restart rather than driving a wedged instance. Evidence survives every cleanup, and nothing the run started outlives it.
4. Sort what you find: a wrong or missing description is drift (fix the map); behaviour that works but the driver cannot drive is a driver gap (fix the driver and drive it again); behaviour that is broken is a product finding (report it; never paper over it in the map).
5. Edit only the verification skill's own files. Report one outcome: clean, changed, or blocked, with what blocked it.
