# Skills layout

## Primary skills (orchestration — short names)

| Skill | Job |
|-------|-----|
| `route` | Pick which skill owns the work |
| `frontend` | UI design + build + visual QA |
| `code` | TypeScript / app logic / verify |
| `writing` | Prose, UI copy, docs, outreach |
| `motion` | Taste, micro-interactions, animation |
| `performance` | Speed, jank, stability |
| `security` | AuthZ, secrets, CASA, abuse controls |
| `growth` | Product strategy, SEO/AEO, launch |
| `media` | HyperFrames, Lottie, video, images |

## Legacy path restores (symlinks → `skill-modules`)

These exist **again** at `~/.agents/skills/<name>` because BEAST / config / packs hard-code paths or names. Content lives in `~/.agents/skill-modules/`; the skill dir is a symlink.

| Path | Why |
|------|-----|
| `unslop` | `BEAST.v2.md` — `Read ~/.agents/skills/unslop/SKILL.md` every session |
| `remove-ai-slop` | Named with unslop in BEAST prose section |
| `impeccable`, `taste-craft` | BEAST frontend/design section |
| `master-content-media` | config.toml path (alias → `$media`) |
| `master-frontend` → `$frontend`, `master-engineering` → `$code`, `master-product-growth` → `$growth`, `master-skill-router` → `$route` | Legacy master names |

The hyperframes family (`hyperframes*`, `website-to-hyperframes`) was delisted from the
active set in 2026-08: seven entries cost 3,584 of the ~6,000-char Claude listing budget.
The modules remain in the library; the `$media` router loads them by path.

## Modules library

Full former skill tree (not all re-linked into the menu):

`~/.agents/skill-modules/`

Load any module: `~/.agents/skill-modules/<name>/SKILL.md`

## Mirrors

`~/.claude/skills` and `~/.codex/skills` mirror the same set (primary + legacy restores).
