---
description: Build a visual or creative piece from a Claude-written creative brief, then render, inspect, and finish it
argument-hint: <what to make, e.g. "a short film about a lighthouse keeper">
---
Make this: $ARGUMENTS

I am asking you to use Claude for the creative direction on this job. Dispatching to it through agent-broker is authorized, and I expect it. If agent-broker is unavailable, call Claude Code headless instead, as `~/.beast/delegation.md` shows.

1. Get the brief from Claude. Create a chat with the agent-broker `chat_new` tool (cwd: this working directory), then call `agent_send` to its claude side with my request above, the relevant context from this directory, and this outline: idea (three concepts, reject the obvious one, pick the memorable one), audience and feeling, visual language (named style, three to five hex colors, a type pairing that is not a platform default, lighting or texture, motion character), structure (film beats with timings, page sections and states, or 3D subject, camera, and loop), signature moment, and five to eight done-when criteria checkable by looking. Ask it for a distinctive direction, not the category default. Without the broker, write that request to a file and run `AGENT_CALL_DEPTH=1 claude -p --model opus --effort high --output-format json < <request file> > brief.json` from this directory; the brief is `.result`, and keep `.session_id`. Show me the brief in one short block.
2. Build it to the brief, loading the matching workflow: `~/.agents/skills/media/SKILL.md` for films and video, `~/.agents/skill-modules/3d-scenes/SKILL.md` for 3D, and `~/.agents/skills/frontend/SKILL.md` plus `~/.agents/skill-modules/taste-craft/SKILL.md` for pages and apps. Where the brief is silent, choose what fits its direction.
3. Render and look. Take screenshots at narrow and wide viewports, capture motion mid-flight, and check film frames at full size. Fix what you see and look again.
4. Send Claude (the same chat, through `agent_send`) the brief and your final screenshots or frames for one critique. Without the broker, use `claude -p --resume <session_id> --output-format json < <critique request>`, listing the paths of the screenshots or frames (Claude reads image files). Fix what it finds.
5. Walk the done-when list. Report the result with a link or path and the frames you checked.
