#!/usr/bin/env python3
"""Create a compact repo snapshot for agents before fetching many files."""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path
from typing import Any

IMPORTANT_NAMES = ["AGENTS.md", "BEAST.md", "package.json", "pnpm-workspace.yaml", "turbo.json", "tsconfig.json", "next.config.ts", "next.config.js", "pyproject.toml", "Cargo.toml", "go.mod"]
SOURCE_DIRS = ["apps", "packages", "src", "app", "components", "lib", "utils", "scripts", "docs", "prisma", "server", "tests", "test"]


def run(cmd: list[str], cwd: Path) -> tuple[int, str]:
    try:
        proc = subprocess.run(cmd, cwd=cwd, text=True, capture_output=True, timeout=10)
        return proc.returncode, (proc.stdout + proc.stderr).strip()
    except Exception as exc:
        return 1, str(exc)


def load_package(path: Path) -> dict[str, Any]:
    package = path / "package.json"
    if not package.exists():
        return {}
    try:
        data = json.loads(package.read_text())
    except Exception as exc:
        return {"error": str(exc)}
    return {
        "name": data.get("name"),
        "packageManager": data.get("packageManager"),
        "scripts": data.get("scripts", {}),
        "dependencies_count": len(data.get("dependencies", {})),
        "devDependencies_count": len(data.get("devDependencies", {})),
    }


def snapshot(repo: Path) -> dict[str, Any]:
    repo = repo.resolve()
    code, root = run(["git", "rev-parse", "--show-toplevel"], repo)
    git_root = Path(root.splitlines()[0]).resolve() if code == 0 and root else repo
    status_code, status = run(["git", "status", "--short"], git_root)
    branch_code, branch = run(["git", "branch", "--show-current"], git_root)
    files = sorted(p.name for p in git_root.iterdir() if p.name in IMPORTANT_NAMES)
    dirs = sorted(p.name for p in git_root.iterdir() if p.is_dir() and not p.name.startswith(".") and p.name in SOURCE_DIRS)
    agents = [str(p.relative_to(git_root)) for p in git_root.rglob("AGENTS.md") if ".git" not in p.parts][:20]
    package = load_package(git_root)
    package_scripts = package.get("scripts", {}) if isinstance(package.get("scripts"), dict) else {}
    likely_checks = [name for name in package_scripts if any(token in name for token in ["test", "lint", "typecheck", "build", "quality", "verify", "audit", "security"])]
    return {
        "repo": str(git_root),
        "cwd_requested": str(repo),
        "git": {
            "branch": branch.strip() if branch_code == 0 else None,
            "status_short": status.splitlines()[:80] if status_code == 0 else [],
            "dirty_count": len(status.splitlines()) if status_code == 0 and status else 0,
        },
        "top_level_files": files,
        "source_dirs": dirs,
        "agents_files": agents,
        "package": {k: v for k, v in package.items() if k != "scripts"},
        "likely_check_scripts": likely_checks,
    }


def print_text(data: dict[str, Any]) -> None:
    print(f"Repo: {data['repo']}")
    print(f"Branch: {data['git']['branch']}")
    print(f"Dirty files: {data['git']['dirty_count']}")
    if data["top_level_files"]:
        print("Top-level config:", ", ".join(data["top_level_files"]))
    if data["source_dirs"]:
        print("Source dirs:", ", ".join(data["source_dirs"]))
    if data["likely_check_scripts"]:
        print("Likely checks:", ", ".join(data["likely_check_scripts"][:30]))
    if data["agents_files"]:
        print("AGENTS files:", ", ".join(data["agents_files"][:10]))
    if data["git"]["status_short"]:
        print("\nStatus:")
        print("\n".join(data["git"]["status_short"][:40]))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("repo", nargs="?", default=".", type=Path)
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    data = snapshot(args.repo)
    if args.output:
        args.output.write_text(json.dumps(data, indent=2), encoding="utf-8")
    if args.json:
        print(json.dumps(data, indent=2))
    else:
        print_text(data)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
