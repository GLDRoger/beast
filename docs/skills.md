# Skills

Eight top-level workflows are exposed to every harness: `code`, `frontend`, `writing`, `motion`, `performance`, `security`, `growth`, and `media`. Each owns an outcome and pulls in specialist modules only when needed.

Specialist modules live in `~/.agents/skill-modules/`. Harnesses don't scan that folder, so modules cost zero context until a workflow or `USER.md` points at one. See the [module index](../home/agents/skill-modules/README.md) for the full list.

Run `beast skills` to see what's installed, or choose packs with `beast install --packs=...`:

| Pack | Modules | Covers |
|---|---:|---|
| `core` | 8 | The 8 top-level workflows (always installed) |
| `design` | 10 | Visual and interaction craft, Lottie, 3D scenes, canvas films |
| `prose` | 7 | Unslop, explaining, docs, changelogs, outreach |
| `product` | 8 | Positioning, pricing, SEO/AEO, validation |
| `engineering` | 19 | Architecture, review, planning, statecharts, data, AI features, mobile, upgrades |
| `tooling` | 4 | Agent/runtime diagnostics, T3 preview, headless model calls |

Product-specific skills stay inside that product's own repo, not here.

## Maintaining the library

- `npm run notice -- --strict` — must pass before publishing; [`NOTICE.md`](../NOTICE.md) tracks upstream skill provenance and licenses.
- `npm run scrub` — runs scrub rules in place to strip private details from the payload.
- `node scripts/bootstrap.mjs --force` — copies your live setup back into the repo through a scrubbed, secret-scanned staging copy. Because each mapped tree is replaced whole, always inspect `git diff` before committing.
