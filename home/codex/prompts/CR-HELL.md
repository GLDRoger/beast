---
description: Perform an explicitly requested deep, evidence-backed review of a selected user flow
argument-hint: [FLOW="<flow>"] [SCOPE="<paths or revision>"]
---
Use this forensic mode only when explicitly requested. Keep the review read-only unless changes are separately authorized.

Infer the selected flow from the user's context; ask for direction only when choosing the wrong flow would waste substantial work. Bound the investigation to that flow and its relevant dependencies. If an exhaustive flow inventory was requested, produce it; do not impose one before every review.

Trace entry points, roles, state transitions, data contracts, side effects, reverse paths, and failure recovery. Use documentation and history as context, checking claims against current source and runtime evidence rather than ignoring them or treating them as truth.

Report demonstrable correctness, security, durability, performance, and workflow defects with exact locations, scenarios, evidence, and fix direction. Distinguish introduced defects, pre-existing issues, and uncertainty. Apply design judgment to real user consequences rather than universal style bans.

Rank the findings and recommend the next useful action. Avoid theatrical insults, filler findings, and blanket rewrite demands. If this review is a child step inside an authorized implementation, return findings to that workflow so it can finish the requested result.
