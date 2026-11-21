# Coding models

My ranking from daily use, updated 21 November 2026. This is the only copy; Jevis links here. The routing table in [`USER.md`](../home/shared/USER.md) follows it directly.

## What each top model is good for

Everything in tier A+ and above that I actually reach for:

| Model | Tier | Use it for |
|---|---|---|
| Claude Opus 5.5 | SSS | Top tier. User-facing code, 3D, WebGL, motion and animation, open-ended design, and reviewing GPT-6.2 Sol, Muse, and Haiku. |
| Claude Mythos 5.2 | SSS | Top tier, right alongside Opus 5.5. Directing long projects, architecture, plans, specs, creative direction, hard problems, and high-stakes reviews. Costs twice Opus on a capped allowance, so save it for high-leverage work rather than grunt work. |
| Claude Fable 5.2 | SSS | Same top tier as Mythos 5.2 and Opus 5.5. Routed right alongside them. |
| Gemini 4 Neon | SSS | Top tier, right alongside Opus 5.5, Mythos 5.2, and Fable 5.2. Strong across UI, full-stack coding, creative work, direct writing, and reviews. **The only Gemini model worth using.** |
| GPT-6.2 Sol | SS | Replaces GPT-6.1 Sol. Default for backend, APIs, data, infra, scripts, tests, debugging, refactors, reviewing non-UI code from the SSS tier, and reviewing big cross-cutting changes. |
| GPT-6.2 Astra | SS | Best in class right now for **3D Blender and game assets work**. Decent step up over GPT-6 Astra on focused tasks, but highly spiky — don't leave it running on long unattended threads. |
| Muse Wonder Full | SS | Backend backup for GPT-6.2 Sol. Never use it for frontend or 3D — it can't do either. |
| Claude Haiku 5.5 | A+ | Fast codebase research, docs/web lookups, and long check runs (test suites, builds, end-to-end walks). |
| GPT-6 Luna | A+ | Fast research, exploration, and long check runs. |
| Muse Wonder | A+ | Same tier as Sonnet 5.5. |
| GPT-6.1 Terra | A+ | Cheap, fast everyday workhorse and quick agentic/UI checks. |

## Tier list

| Tier | Models |
|---|---|
| SSS | Claude Opus 5.5, Claude Mythos 5.2, Claude Fable 5.2, Gemini 4 Neon |
| SS | GPT-6.2 Sol, GPT-6.2 Astra, Muse Wonder Full |
| S | GPT-6.1 Sol, GPT-6 Astra |
| A+ | Claude Haiku 5.5, Claude Sonnet 5.5, GPT-6 Luna, Muse Wonder, GPT-6.1 Terra |
| A | Grok 4.7, Claude Fable 5.1, Claude Mythos 5.1, GPT-6 Sol, Claude Opus 5, Claude Fable 5, GPT-5.6 Sol, Daybreak Blue, Kimi K3, Qwen3.8 Max 0902, GLM-5.3 Flash, DeepSeek V4.1 Flash, Hy-4 Preview |
| B | Muse Spark 1.3, GPT-5.6 Terra, Qwen3.8-Flash-Next, GLM-5.3, Claude Sonnet 5 |
| C | K2 Horizon 375B A23B, GPT-5.6 Luna, Grok 4.5, Qwen3.8 27B, Muse Spark 1.2, MiMo V2.5 Pro, Hy-3, MiniMax-M3 |
| D | Thinking Machines Inkling, Nemotron 3 Ultra, Muse Glimmer |
| E | Claude Haiku 4.5, Mistral Medium 3.5, Nemotron 3.5 Lightning |

Notes:
- **Gemini:** Gemini 4 Neon is the only Gemini model worth using. Skip Argon, Carbon, and the 3.x Flash models (the older ones reread files and drift off task).
- **Grok:** Grok 4.7 replaces Grok 4.6 at A tier.
- **Daybreak Blue:** GPT-5.6 Sol with lowered safeguards.
- **European & Chinese models:** I haven't kept up with recent launches; from their release posts, the newer ones look roughly around Sonnet 5.5 / Terra level.
