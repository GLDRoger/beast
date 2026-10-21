# Beast and Jevis

Beast and [Jevis](https://github.com/GLDRoger/jevis) are separate projects by the same maintainer. Both shape what a coding agent reads, but they work differently.

| | Beast | Jevis |
|---|---|---|
| What it is | Instruction files and skills, installed as links into each harness | Hooks the harness calls at fixed moments in a session |
| What the agent gets | The system prompt and `USER.md` at session start; a one-line listing per skill, with the skill's full text read only when a task needs it | Short tips at session start, on each message, and before some commands; one end-of-turn check; an optional design review |
| Harnesses | Claude Code, Codex, Grok, Gemini CLI, Antigravity, Muse Code, Hermes | Claude Code and Codex through its installer; Gemini CLI, Antigravity, and Muse Code by hand |
| Network and keys | None | None for tips. The optional design review and any lessons you add call a decision model: hosted ones need a key, a self-hosted one may not |
| Removing it | Manual ([Removing Beast](setup.md#removing-beast)) | `node bin/install.mjs --uninstall` |

Beast supplies the standing text. Jevis repeats selected lines of guidance, in fewer words, while the work is happening.

## Using them separately or together

**Beast only.** Your agents get the system prompt, your instructions, and the skills in every harness. They don't get the session guide, the judgment examples, or the design reminders, which ship only as Jevis tips. To keep any of them without Jevis, copy the text from Jevis's `nudges/` folder into `USER.md`. The maintainer moved the design reminders out of `BEAST.md` and `USER.md` after seeing agents ignore them there. That was an observation, not a measurement.

**Jevis only.** Tips work alongside any instruction files. Two shipped tips assume Beast-style preferences: the per-message reminder (`base-prompt.md`) asks for bold, ambitious work, and the search tip (`base-search.md`) assumes `rg` and `fd` are installed. If either conflicts with your setup, replace or switch it off in `~/.jevis/nudges/` ([Jevis tips](https://github.com/GLDRoger/jevis/blob/main/docs/tips.md)).

**Both.** Their installers don't edit the same files. Beast links instruction files and skills and may add a few config keys, while Jevis's installer adds hook entries to `~/.claude/settings.json` and `~/.codex/hooks.json`. If you add Jevis's Gemini hooks by hand, they go in `~/.gemini/settings.json`, where Beast's `--write-config` also sets `context.fileName`. Merge rather than overwrite there. They connect at one point: every brief in Beast's `USER.md` opens with "You were called by another agent. Do this task yourself.", and Jevis uses that phrase (or `AGENT_CALL_DEPTH`) to recognise a worker session. Worker sessions get a worker tip in place of the per-message tips, no feedback tips, and no design review.

### Adopting both, at the lowest cost

1. Install Beast and check it: `beast install --dry-run`, then `beast install` and `beast doctor` ([Setup](setup.md)).
2. Rewrite `home/shared/USER.md` for yourself ([Make it yours](setup.md#make-it-yours)).
3. Install Jevis with the design review off. With only the shipped tips and check, that makes no decision-model calls and needs no key:

   ```sh
   git clone https://github.com/GLDRoger/jevis.git ~/code/jevis
   cd ~/code/jevis && npm install
   node bin/install.mjs --critic off --dry-run
   node bin/install.mjs --critic off
   node bin/jevis.mjs doctor
   ```

   Leave out `--critic off` only if you want the design review, which needs a decision-model key, Chrome, and a signed-in `claude` or `codex` CLI. Without the flag, the reviewer is Claude.
4. Start a new session (for example with `c` or `co`). To see exactly what a tip hook sends, run one by hand: `echo '{"session_id":"try","model":"gpt-6-sol"}' | node ~/code/jevis/bin/jevis.mjs hook session`.
5. After a week or two of real work, judge whether it helped ([Judging it on your own work](https://github.com/GLDRoger/jevis/blob/main/docs/evidence.md#judging-it-on-your-own-work)).

## Where an instruction belongs

An agent reads instructions from five places. Each place has one job, and a rule belongs in the place whose job it matches. Many lines belong nowhere: a line no model needs to be told costs context and adds nothing.

| Place | Its job | Loaded |
|---|---|---|
| `home/shared/BEAST.md` (system prompt) | How the agent works: its stance and working principles. True for any user on any machine. | Every session, as the system prompt |
| `home/shared/USER.md` (global `CLAUDE.md` / `AGENTS.md`) | How this user's work is done: model routing and briefs, how to call each model, the worker contract, the skill index, engineering and git conventions. | Every session |
| A project's `AGENTS.md` (`CLAUDE.md` is just `@AGENTS.md`) | That project's specifics: what it is, its goals, commands, architecture, and gotchas. Nothing that's true of every project. | Sessions in that repository |
| Skills (`home/agents/skills`, `skill-modules`) | Procedures an agent needs only while doing one kind of task. | When the task calls for them |
| [Jevis](https://github.com/GLDRoger/jevis) tips | Short text that hooks inject at a fixed moment, without waiting for the model to go and read it. | At session start, on each message, or at a specific moment ([Jevis tips](https://github.com/GLDRoger/jevis/blob/main/docs/tips.md)) |

Two rules keep the places consistent:

1. **Place a line by asking where it's true.** For anyone, it goes in Beast. For this user on every project, `USER.md`. For one project, its `AGENTS.md`. Only while doing one kind of task, a skill. Only at one moment or for one model family, a Jevis tip. For no one, delete it.
2. **Repetition is deliberate; contradiction is a bug.** A Jevis tip may restate a Beast or `USER.md` rule in fewer words. A few things live only in Jevis: the session guide, the judgment examples, the design reminders, the per-family corrections, and the feedback tips. Everything else a tip says must have a source in another place. When a reminder and its source drift apart, the source wins and the reminder is rewritten.

## The October 2026 sort

In October 2026, the maintainer sorted every instruction line across these places, one line at a time. The diagram records the final placements from that sort, the agreed result. Each tag shows where a line lived before the sort. Treat it as a record of that migration, not as the place to start. The table and rules above are the current guidance.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="media/layers-dark.png">
  <img src="media/layers-light.png" width="900" alt="The final placement of each instruction. Every session: Beast, the system prompt (14 items); USER.md (16, including the worker contract, the skill list, and preserving user work); the project AGENTS.md (what it is, commands, architecture, gotchas). On demand: the code, frontend, writing and motion skills. Jevis: the full session guide and design notes at session start and after compaction; a two-line reminder, the interface-copy line and GPT corrections on every message; feedback, search, rerun and port tips at a specific moment. Eleven lines were removed.">
</picture>

The source is [`media/layers.html`](media/layers.html). Re-render the images with `node docs/media/render-layers.mjs`.
