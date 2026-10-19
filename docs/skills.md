# Skills

Eight workflows are discoverable in every harness: `code`, `frontend`, `writing`, `motion`, `performance`, `security`, `growth`, and `media`. Each owns one kind of outcome and loads a specialist module only when the task needs it.

Modules live in `~/.agents/skill-modules/`, which no harness scans, so they cost nothing until a workflow or `USER.md` points an agent at one. The [module index](../home/agents/skill-modules/README.md) lists each with a one-line description.

`beast skills` lists what's installed. `beast install --packs=...` chooses which modules to install:

| Pack | Modules | For |
|---|---:|---|
| `core` | 8 | The eight workflows (always installed) |
| `design` | 12 | Visual and interaction craft, Lottie, 3D scenes, canvas films |
| `prose` | 8 | Writing cleanup, explaining, docs, changelogs, outreach |
| `product` | 8 | Positioning, pricing, discoverability, validation |
| `engineering` | 18 | Architecture, review, planning, data, AI features, mobile, upgrades |
| `tooling` | 5 | Agent and runtime diagnostics, headless model calls |

Skills that belong to one product live in that product's repository, not here.

## Maintaining the library

- `npm run notice -- --strict` must pass before publishing. [`NOTICE.md`](../NOTICE.md) records where vendored skills came from and under what terms; `LICENSE` explains the split between original tooling and vendored material.
- `npm run scrub` applies the scrub rules (rewrites that remove private details) to the payload in place.
- `node scripts/bootstrap.mjs --force` copies the live installation back into this repository through a scrubbed, secret-scanned staging copy. Each mapped file or tree is replaced whole, so a partial live module library can delete modules here. Read the diff before committing.
