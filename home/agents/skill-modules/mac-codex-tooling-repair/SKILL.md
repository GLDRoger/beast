---
name: mac-codex-tooling-repair
description: "Repair the local macOS agent stack — CUA, MCP, daemon, auth, Python mismatches. Use when tooling is the blocker and code changes won’t help until the machine works."
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
4. For `trycua/cua` specifically:
   - Codex integration is the `cua-driver` MCP path, not the Python SDK;
   - expected driver bundle: `/Applications/CuaDriver.app`;
   - useful CLI symlink: `~/.local/bin/cua-driver`;
   - registration pattern: `codex mcp add cua-driver -- ~/.local/bin/cua-driver mcp`;
   - start daemon through the app bundle: `open -n -g -a CuaDriver --args serve`;
   - verify with driver status plus Accessibility and Screen Recording permissions.
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
