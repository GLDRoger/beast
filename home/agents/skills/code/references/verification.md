# Choose verification from behavior and risk

Start with the changed contract and a falsifying observation. File extensions are clues, not risk classifications: JSON can configure authorization; Markdown/MDX can execute or generate application behavior.

Inspect package manifests, lockfiles, CI configuration, and the relevant test before selecting commands. Use the repository's declared package manager and existing scripts. A command's name does not establish safety: tests, installs, seeds, builds, and type-generation scripts can contact live services or write data.

| Change | Meaningful evidence |
|---|---|
| Prose or instructions only | Read the final text, check referenced paths/links, and review the scoped diff. For behavior-shaping instructions, use realistic task cases when warranted. |
| Application behavior | Reproduce the defect or write a failing regression; verify the relevant success and failure paths. Run applicable type/lint/build checks without assuming every project has all of them. |
| Dependencies or lockfile | Verify manifest/lockfile consistency, changed dependency behavior and compatibility, and relevant build/runtime tests. Review provenance/security where warranted. Use the locked package-manager workflow in a safe environment when installation is needed. |
| Compiler, framework, CI, deployment, or runtime configuration | Parse with the owning tool, inspect the effective setting in its actual precedence chain, and exercise the affected build/runtime boundary. A syntactically valid file can still be ineffective. |
| Authentication, authorization, secrets, payments | Prove allowed and denied paths, tenant/role isolation, error behavior, and absence of secret leakage at the affected boundaries. Use project-specific security gates when present. |
| Schema, migration, data integrity, RLS, or RPC | Inspect effective contracts and callers; validate atomicity, concurrency, allowed/denied access, and failure recovery against an isolated database when needed. Preserve backup/migration order for an authorized release. |
| UI, responsive layout, or motion | Inspect the rendered affected states at relevant narrow/wide viewports; exercise keyboard, errors, and awkward content where applicable. Check reduced motion for animation changes. |
| Performance | Compare a relevant baseline and changed measurement under comparable conditions; retain the correctness checks. |

If a required boundary cannot be exercised, say what evidence exists, what remains unverified, and which fact/access would resolve it. Do not turn an unavailable check into a pass or silently substitute a weaker check.

Run additional checks when new evidence, a changed surface, or a release requirement calls for them. Repeating an unchanged successful command adds no proof. Whitespace checks are useful diff hygiene, not behavioral validation.
