---
name: improve-codebase-architecture
description: Review architectural friction, coupled modules, interface complexity, and testability; recommend evidence-backed refactoring opportunities within the requested scope.
---

# Improve Codebase Architecture

Trace the requested behavior and its callers before recommending abstractions. Use existing domain language and relevant decisions; read only the context needed for the affected area. An absent glossary or ADR collection is not a reason to invent one or halt the review.

Look for interface complexity, behavior spread across coupled modules, duplicated contracts, and tests that miss integration failures. Apply the deletion test: does removing an abstraction remove complexity, or merely scatter it among callers? A boundary can earn its place through validation, policy, translation, observability, or vendor isolation; adapter count alone does not decide that.

Use `LANGUAGE.md` and `DEEPENING.md` when a deeper architectural comparison needs their concepts. Preserve the project's established terminology rather than forcing every existing concept into a new vocabulary.

## Deliver the requested result

For a review, give ranked candidates with exact files, the observed problem, a fix direction, tradeoffs, and verification. Recommend what to tackle first and distinguish demonstrated friction from speculation. Keep the review read-only.

Use an HTML or diagram report only when requested or genuinely useful; `HTML-REPORT.md` provides an optional scaffold. A concise inline review is normally sufficient. Do not require a new report, selection question, or grilling loop when the user already chose the change.

When implementation is authorized, return the relevant findings and design to the primary code workflow and complete it there. Use `INTERFACE-DESIGN.md` only when competing interfaces warrant detailed exploration. Create or update domain docs/ADRs only within the authorized scope; a review does not automatically authorize persistent project edits.

Independent exploration is optional when the current runtime and task permit it. Keep ownership, integration, and verification with the primary workflow.
