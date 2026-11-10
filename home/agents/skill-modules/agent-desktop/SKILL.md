---
name: agent-desktop
description: Use when a task needs you to operate a native desktop app's window (click, type, read its screen) rather than a browser page or a terminal. It covers agent-desktop CLI sessions, the visible cursor, snapshots, screenshots, and when headed mode is needed.
---

# Driving desktop apps

For native GUI apps, not the browser. In Codex, use its native Computer Use and fall back to `agent-desktop` only if that is unavailable. Every other harness uses the `agent-desktop` CLI. Install it with `npm install -g agent-desktop` if it is missing.

## Before first use in a session

Run `agent-desktop skills get desktop` and `agent-desktop skills get platform` and follow them. They hold the current command reference, which changes between versions.

## Work one step at a time

Look, act once, look again. An app's state after a click is not predictable enough to chain blind.

- Read the screen with `snapshot` after every action.
- Take and view a `screenshot` when layout matters, since a snapshot does not show it.
- Use `batch --stop-on-error` only for proven steps with nothing to judge in between.

## Show your cursor

The user watches what you do through the cursor overlay.

1. `session start --name <task> --cursor`, then pass `--session <id>` on every call.
2. `cursor-overlay enable --fill <c> --accent <c> --label "<step>"` in your model family's colour: Claude `#D97757`, GPT `#10A37F`, Muse `#4299FF`, others `#A855F7`.
3. End the session when the task is done.

## Headless by default

Stay headless. Add `--headed` only for what headless refuses: `mouse-click --xy` from a screenshot, double or triple click, hover, and drag. Warn the user first, because headed mode moves the real pointer and takes focus.

## zsh

Write refs as `"@${sid}:e5"`. A bare `$sid:e5` gets mangled by zsh's modifier syntax.
