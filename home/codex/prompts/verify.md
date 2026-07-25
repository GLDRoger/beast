---
description: Verify code quality by running lint, tests, build, and type-check
argument-hint: [VERIFY=true]
---
Make sure all quality checks pass and fix any issues that arise:
1) `pnpm lint` to check code style and formatting.
2) `pnpm lint:ci` to run linting in CI mode.
3) `pnpm test` to run the test suite.
4) `pnpm build` to verify the build succeeds.
5) `pnpm tsc --noEmit` to perform type checking without emitting files.
Report each command's result with timing; surface failing tests/files; suggest fixes and reruns. Include next actions if any step fails.
