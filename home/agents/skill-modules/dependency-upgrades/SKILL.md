---
name: dependency-upgrades
description: Upgrade packages, runtimes, frameworks and CLIs safely: reading changelogs and migration guides, upgrading in steps, and verifying behaviour. Use when bumping versions, fixing security advisories, or moving to a new major version.
---

# Dependency upgrades

- Find what's installed now (lockfile, `--version`) and the target version. Read the official changelog and migration guide for every major version you cross.
- Upgrade one major version or one package family at a time, with a commit after each verified step. A big-bang upgrade hides which change broke what.
- Use the project's package manager and keep the lockfile consistent; don't mix managers.
- Apply the documented codemods and migration steps, then search the code for removed or renamed APIs the guide lists.
- Verify with the project's full checks plus a run of the affected feature: build, tests, types, lint, and the rendered app for UI frameworks.
- For security advisories, check whether the vulnerable path is actually used and pick the smallest version that fixes it.
- Report the versions moved, breaking changes handled, and anything deferred with why.
- Weigh the upgrade against its payoff: a large migration for a minor version nobody needs is not worth doing unprompted.
