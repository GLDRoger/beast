#!/usr/bin/env python3
"""Choose small sufficient verification commands from touched files and change type."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

TEXT_EXTS = {".md", ".txt", ".mdx", ".json", ".yml", ".yaml", ".toml"}
WEB_EXTS = {".ts", ".tsx", ".js", ".jsx", ".css", ".scss"}
HIGH_RISK_HINTS = ["auth", "security", "prisma", "migration", "api", "route", "webhook", "payment", "token", "secret", "sentry"]


def package_scripts(repo: Path) -> dict[str, str]:
    package = repo / "package.json"
    if not package.exists():
        return {}
    try:
        return json.loads(package.read_text()).get("scripts", {})
    except Exception:
        return {}


def command_if_script(scripts: dict[str, str], name: str) -> str | None:
    if name in scripts:
        return f"pnpm {name}"
    return None


def route(repo: Path, files: list[str], change_type: str | None, risk: str | None) -> dict[str, Any]:
    repo = repo.resolve()
    scripts = package_scripts(repo)
    lower_files = [f.lower() for f in files]
    suffixes = {Path(f).suffix for f in files}
    joined = "\n".join(lower_files)
    high_risk = risk == "high" or any(hint in joined for hint in HIGH_RISK_HINTS)
    commands: list[str] = []
    notes: list[str] = []

    if files and suffixes <= TEXT_EXTS and not high_risk:
        commands.extend(["git diff --check"])
        notes.append("Text/config-only change: use diff whitespace/exact grep checks; no full test suite by default.")
    elif any(s in WEB_EXTS for s in suffixes):
        if "typecheck:web" in scripts:
            commands.append("pnpm typecheck:web")
        elif "lint" in scripts:
            commands.append("pnpm lint")
        else:
            commands.append("pnpm exec tsc --noEmit --pretty false")
        if any(f.endswith((".tsx", ".jsx", ".css", ".scss")) for f in lower_files):
            lint = command_if_script(scripts, "lint") or command_if_script(scripts, "quality:check")
            if lint and lint not in commands:
                commands.append(lint)
            notes.append("UI-affecting change: add browser/visual check when behavior or layout changed.")
    else:
        for candidate in ["test", "typecheck", "lint"]:
            cmd = command_if_script(scripts, candidate)
            if cmd:
                commands.append(cmd)
                break
        if not commands:
            commands.append("git diff --check")

    if high_risk:
        for candidate in ["security:check", "quality:check", "verify:handoff"]:
            cmd = command_if_script(scripts, candidate)
            if cmd and cmd not in commands:
                commands.append(cmd)
                if candidate == "verify:handoff":
                    break
        notes.append("High-risk surface detected: use stronger project gates before declaring done.")

    # Prefer a repo's own canonical gate over ad-hoc scanners when one exists.
    if "quality:check" in scripts and high_risk and "pnpm quality:check" not in commands:
        commands.insert(0, "pnpm quality:check")
        notes.append("Repo defines quality:check: prefer canonical scripts over one-off scanners.")

    # Deduplicate preserving order.
    deduped = list(dict.fromkeys(commands))
    return {"repo": str(repo), "files": files, "change_type": change_type, "risk": risk, "commands": deduped, "notes": notes}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("files", nargs="*", help="Touched files relative to repo")
    parser.add_argument("--repo", type=Path, default=Path.cwd())
    parser.add_argument("--change-type", choices=["text", "ui", "api", "config", "security", "deps", "unknown"])
    parser.add_argument("--risk", choices=["low", "medium", "high"])
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    data = route(args.repo, args.files, args.change_type, args.risk)
    if args.json:
        print(json.dumps(data, indent=2))
    else:
        print("Verification commands:")
        for cmd in data["commands"]:
            print(f"- {cmd}")
        if data["notes"]:
            print("Notes:")
            for note in data["notes"]:
                print(f"- {note}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
