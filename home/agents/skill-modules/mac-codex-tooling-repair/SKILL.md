---
name: mac-codex-tooling-repair
description: Use when local agent tooling on this Mac is the blocker, such as a Codex MCP server that will not register, a daemon that is down, auth failures, missing macOS permissions, or a Python package mismatch, and done means the tool works from Codex again.
---

# Mac Codex Tooling Repair

Use this skill for machine-local setup/debugging where "done" means the tool is usable from Codex, not merely installed.

## Default workflow

1. Identify the active path: Codex MCP driver, native app daemon, Python SDK, browser/plugin, or repo-local package. Do not conflate them.
2. Check existing state before installing:
   - versions (`codex --version`, tool `--version`);
   - Codex MCP registration (`codex mcp list` when relevant);
   - daemon/process status;
   - macOS permissions/TCC status for Accessibility and Screen Recording when GUI control is involved;
   - existing venvs or app bundles.
3. Prefer official docs/installers for current third-party tooling, but isolate Python SDK experiments in a venv. Avoid `pip install --user` for CUA-style packages on this Mac unless there is a strong reason.
4. Desktop control on this Mac is `agent-desktop` (npm, `/opt/homebrew/bin/agent-desktop`); `trycua/cua` and its `cua-driver` were retired. Check it with `agent-desktop status` and `agent-desktop permissions`, and don't reinstall CuaDriver unless the user asks for it.
5. For CUA Python SDK work, prefer an isolated venv such as `~/.local/share/cua-sdk-venv`. The old `cua==0.1.0` PyPI package did not match the modern documented `from cua import Sandbox` shape here; split packages like `cua-sandbox` and `cua-agent` were the verified path.
6. For FastMCP/Pydantic startup crashes involving image returns, inspect the registered tool signature. A tool returning `Tuple[str, Image]` may need `@server.tool(structured_output=False)` rather than schema coercion.

## Verification bar

Report concrete evidence, normally including:
- version after install/repair;
- daemon/process status;
- Codex MCP registration visible;
- permission status where relevant;
- import/use smoke test for SDKs;
- original error no longer reproduces.

Stop when the tool is actually usable from Codex or when a specific external permission/user action is the only blocker.
