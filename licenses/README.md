# licenses/

Full license texts for the terms the vendored skills are distributed under, plus the
evidence behind any grant that is not a plain `LICENSE` file upstream.

The root `LICENSE` covers beast's own code. `NOTICE.md` maps every shipped skill to its
upstream, license and copyright holder. This directory holds the actual texts, because
naming a license is not the same as shipping it: Apache-2.0 section 4(a) requires a copy
of the license to travel with any redistribution, and ~25 of the vendored skills are
Apache-2.0. Nothing shipped that text before.

| File                            | Covers                                                        |
|---------------------------------|---------------------------------------------------------------|
| `Apache-2.0.txt`                | every Apache-2.0 upstream (pbakaus/impeccable, heygen-com/hyperframes) |
| `MIT.txt`                       | every MIT upstream, where that upstream shipped no notice of its own |
| `lixiaolin94-skills-grant.md`   | `web-shader-extractor` — the grant is in the README, not a LICENSE file |

Where an upstream shipped its own copyright line or notice, that file travels with the
skill instead of being flattened into a shared template:

- `home/agents/skill-modules/tushar-design/LICENSE.txt` — MIT © 2026 Tushar Mehta
- `home/agents/skill-modules/impeccable/NOTICE.md` — Apache-2.0, plus upstream's own
  third-party notice carried forward

`npm run notice -- --strict` fails while any shipped skill lacks a recorded grant, names
license text it does not ship, or carries an unfilled license stub.
