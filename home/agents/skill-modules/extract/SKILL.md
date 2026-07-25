---
name: extract
description: "Pull repeated UI into a living system — components, tokens, patterns. Use when the codebase is copy-paste rich and the design system should grow from real use."
argument-hint: "[target]"
---

Grow the design system from real reuse — not speculative abstractions.

## Discover

1. Locate the existing system (`components/`, `ui/`, tokens, Storybook). Match its conventions.
2. If none exists, **ask** before creating one (path + structure).
3. Hunt for: repeated UI (≥3 uses or clear reuse), hard-coded visual values, inconsistent variants of one concept.
4. Skip one-offs and context-specific glue.

## Plan

- Components to extract + variants + props API
- Tokens (primitive vs semantic naming)
- Migration path for existing call sites
- Names that match the current system

## Extract

- Components: sensible defaults, a11y built in, typed props, short usage example
- Tokens: semantic meaning required — not a token for every literal
- Patterns: when to use, example, allowed variants

## Migrate

Find all instances → replace → verify visual/functional parity → delete dead implementations.

## Document

Update the catalog/Storybook the team already uses. Do not invent a parallel docs stack.

## Never

- Extract once-used code “for later”
- Over-generic components that need 20 props to be useful
- Ignore existing naming/token conventions
---