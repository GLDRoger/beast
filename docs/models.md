# Coding models

The maintainer's ranking from daily use, as of 19 October 2026. It's judgment, not a benchmark. This page is kept identical in [Beast](https://github.com/Questili/beast/blob/main/docs/models.md) and [Jevis](https://github.com/GLDRoger/jevis/blob/main/docs/models.md).

## What each is good for

Models in tier A+ and above.

| Model | Tier | Good for |
|---|---|---|
| Claude Opus 5.5 | SSS | The best model available. User-facing code, 3D, WebGL, motion and animation, and reviewing GPT-6.1 Sol's work. |
| GPT-6.1 Sol | SS | Code outside the UI (APIs, data, infrastructure, scripts, tests, debugging, refactors), and reviewing work by Claude and Muse models. As good as Astra. |
| GPT-6 Astra | SS | 3D modeling work and decent frontend designs. Expensive: use GPT-6.1 Sol instead, except for the most thorough reviews. |
| Muse Wonder Full | SS | User-facing code, on a par with Opus 5.5. |
| Claude Fable 5.1 | S | Frontend animation. Strong, but Opus 5.5 is better and cheaper. |
| Claude Mythos 5.1 | S | Fable 5.1 with lowered safeguards. |
| Claude Haiku 5.5 | A+ | Research and exploration (codebase search, docs, web research), and long check runs. |
| GPT-6 Luna | A+ | Research and exploration (codebase search, docs, web research), and long check runs. |
| Gemini 4 Argon | A+ | 3D modeling work, spatial reasoning, and multilingual and multimodal reasoning. Don't use it for frontend or backend code. |

## Tier list

| Tier | Models |
|---|---|
| SSS | Claude Opus 5.5 |
| SS | GPT-6.1 Sol, GPT-6 Astra, Muse Wonder Full |
| S | Claude Fable 5.1, Claude Mythos 5.1 |
| A+ | Claude Haiku 5.5, Claude Sonnet 5.5, Gemini 4 Argon, GPT-6 Luna |
| A | GPT-6 Sol, Claude Opus 5, Claude Fable 5, GPT-5.6 Sol, Daybreak Blue, Kimi K3, Grok 4.7, Grok 4.6, Qwen3.8 Max 0902, GLM-5.3 Flash, Muse Spark 1.3, DeepSeek V4.1 Flash, Hy-4 Preview |
| B | Muse Wonder, GPT-5.6 Terra, Qwen3.8-Flash-Next, GLM-5.3, Claude Sonnet 5, K2 Horizon 375B A23B |
| C | GPT-5.6 Luna, Grok 4.5, Qwen3.8 27B, Muse Spark 1.2, MiMo V2.5 Pro, Hy-3, MiniMax-M3 |
| D | Thinking Machines Inkling, Nemotron 3 Ultra, Muse Glimmer |
| E | Claude Haiku 4.5, Mistral Medium 3.5, Nemotron 3.5 Lightning |
| Below E | Gemini 3.8 Flash, Gemini 3.7 Flash, Gemini 3.6 Flash, Gemini 3.5 Flash |

Daybreak Blue is GPT-5.6 Sol with lowered safeguards.

The Gemini 3.x Flash models tend to reread the same files and drift off the task, so they aren't recommended. Gemini 4 Argon doesn't share that ranking.
