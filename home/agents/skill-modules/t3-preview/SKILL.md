---
name: t3-preview
description: Use when driving a page with T3 Code's `preview_*` tools in the in-app browser. It covers recovering from timeouts, aria-ref targets, what `preview_wait_for` really matches, `preview_evaluate` limits, navigation dialogs, dev-server readiness, and stuck snapshots.
---

# Driving the T3 preview

Parallel agents each open their own tab and pass its `tabId` on every call.

## After any timeout

Call `preview_status` for the tab, then take a fresh `preview_snapshot`, before repeating anything. A timed-out click or type may already have happened, so check the resulting state before retrying an action that writes, submits, signs out or deletes.

## Targets

Use `locator='aria-ref=<ref>'` from the latest snapshot. Refs die on navigation or a new snapshot. A placeholder or visible label is not always the accessible name, so read role and name from the snapshot instead of guessing.

## Waiting

- `preview_wait_for` matches text against the page's body text, case-sensitively. It never sees the value of an input or textarea.
- Every condition you pass must hold at once.
- Wait only for a URL or text you have seen in this app. A login may land on `/`, not the route you expect.
- The default is 15,000 ms; `timeoutMs` goes up to 60,000.

## `preview_evaluate`

It awaits returned promises and has a fixed 15-second limit with no `timeoutMs`. Don't use it as a sleep, and don't put long loops, timers or multi-step flows in one expression: split them into short calls and wait for real conditions with `preview_wait_for`. A timeout does not undo statements that already ran. Never wait on a selector that cannot match just to pass time.

## Navigation and dialogs

A navigation can raise a beforeunload dialog. After a navigation timeout, check `preview_status`, and resolve a pending dialog with `preview_dialog` only when that is safe: accepting can discard unsaved work. An in-page overlay or modal is not a browser dialog; inspect it and use its own controls.

## Dev servers

A listening port is not a ready page. Before opening a freshly started dev server, confirm the page responds and the compile has finished. After a timeout, read the server log before raising timeouts.

## Stuck snapshots

When `preview_snapshot` times out repeatedly but a small `preview_evaluate` still works, the capture path is stuck. Stop retrying the snapshot: close and reopen your own tab, which has recovered it, and read the DOM with small `preview_evaluate` calls meanwhile. Heavy machine load, such as many test runs or builds at once, makes this more likely.

## Reporting

Keep what you verified in the preview separate from what you verified from source, an API call, or a separate browser script.
