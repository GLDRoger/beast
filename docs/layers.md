# Where an instruction belongs

Every instruction an agent sees comes from one of five places. Each has one job, and a rule lives in the place whose job it matches. Many things belong nowhere: a line that no model needs to be told is cost without benefit.

| File | Its job | Loaded |
|---|---|---|
| `home/shared/BEAST.md` (system prompt) | How the agent lives: its stance and working principles. True for any user on any machine. | Every session, as the system prompt |
| `home/shared/USER.md` (global `CLAUDE.md` / `AGENTS.md`) | How the work is done here, as given: model routing and briefs, how to call each model, the worker contract, the skill index, engineering and git conventions. | Every session |
| A project's `AGENTS.md` (`CLAUDE.md` is just `@AGENTS.md`) | The specifics of that project: what it is, its goals, commands, architecture, and gotchas. Nothing that is true of every project. | Sessions in that repository |
| Skills (`home/agents/skills`, `skill-modules`) | Workflows and behaviours injected by circumstance. Procedures an agent needs only while doing that kind of task. | When the task calls for them |
| [Jevis](https://github.com/GLDRoger/jevis) tips | Like skills, but injected deterministically by hooks instead of waiting for the model to go and read them. | At a fixed moment, below |

## Jevis tips

Jevis tips arrive at three kinds of moment:

- **Session start and after compaction:** the session guide, the judgment examples, and the design reminders, including each model family's defaults to avoid. Design reminders live here rather than in the system prompt or `USER.md`, where they had no effect; at session start they reach the first file an agent writes. The `frontend` and `motion` skills keep their task procedures.
- **Every message:** a short reminder of the session guide, the interface-copy line, and the GPT-only corrections. In a session started by another agent, the worker tip replaces all three.
- **A specific moment:** vague feedback and a second vague correction; a `grep` or `find` where `rg` and `fd` fit; a command about to rerun after failing twice; a check about to rerun with nothing changed; a port already in use. Worker sessions get no feedback tips.

## Two rules

These keep the layers consistent:

1. **Repetition is deliberate, contradiction is a bug.** Over a long session a model stops following its system prompt, so a Jevis tip may restate a Beast or `USER.md` rule in fewer words. Some guidance lives only in Jevis: the session guide, the judgment examples, the design reminders, the per-family corrections, and the feedback tips. Everything else a tip says must have a source in another layer, and when a reminder and its source drift apart, the source wins and the reminder is rewritten.
2. **Place a line by asking where it is true.** For anyone: Beast. For this user on every project: `USER.md`. For one project: its `AGENTS.md`. Only while doing one kind of task: a skill. Only at one moment or for one model: Jevis. For no one: delete it.
