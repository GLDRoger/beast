---
description: Build a visual or creative piece from a creative brief, then render, inspect, and finish it
argument-hint: <what to make, e.g. "a short film about a lighthouse keeper">
---
Make this: $ARGUMENTS

Use a top-tier creative model (Claude Opus 5.5, Mythos 5.2, Fable 5.2, or Gemini 4 Neon) for creative direction on this job. Inside T3 Code, delegate via `delegate_task`; outside T3 Code, call Claude Code headless as `~/.beast/delegation.md` shows.

1. Get the creative brief. Pass my request above, relevant context from this directory, and this outline: idea (three concepts, reject the obvious one, pick the memorable one), audience and feeling, visual language (named style, 3–5 hex colors, non-default type pairing, lighting/texture, motion character), structure (film beats with timings, page sections/states, or 3D subject/camera/loop), signature moment, and 5–8 visual done-when criteria. Ask for a distinctive direction, not the category default. Outside T3 Code, write the request to a file and run `AGENT_CALL_DEPTH=1 claude -p --model opus --effort high --output-format json < <request file> > brief.json`; the brief is `.result` and keep `.session_id`. Show me the brief in one short block.
2. Build it to the brief, loading the matching workflow: `~/.agents/skills/media/SKILL.md` for films/video, `~/.agents/skill-modules/3d-scenes/SKILL.md` for 3D, and `~/.agents/skills/frontend/SKILL.md` plus `~/.agents/skill-modules/taste-craft/SKILL.md` for pages and apps. Where the brief is silent, choose what fits its direction.
3. Render and inspect. Take screenshots at narrow and wide viewports, capture motion mid-flight, and check film frames at full size. Fix what you see and look again.
4. Send the brief and your final screenshots or frames back for one critique (new `delegate_task` in T3 Code, or `claude -p --resume <session_id> --output-format json < <critique request>` outside T3). Fix what it finds.
5. Walk the done-when list and report the result with paths/links and the frames you checked.
