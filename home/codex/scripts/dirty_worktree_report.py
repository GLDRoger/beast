#!/usr/bin/env python3
"""Summarize dirty git files and separate explicitly touched files from unrelated work."""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path
from typing import Any


def run(cmd: list[str], cwd: Path) -> str:
    return subprocess.run(cmd, cwd=cwd, text=True, capture_output=True, check=False).stdout


def parse_status(output: str) -> list[dict[str, str]]:
    rows = []
    for line in output.splitlines():
        if not line:
            continue
        status = line[:2]
        path = line[3:]
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        rows.append({"status": status, "path": path})
    return rows


def report(repo: Path, touched: list[str]) -> dict[str, Any]:
    repo = repo.resolve()
    root_out = run(["git", "rev-parse", "--show-toplevel"], repo).strip()
    root = Path(root_out).resolve() if root_out else repo
    rows = parse_status(run(["git", "status", "--short"], root))
    touched_set = {str(Path(t)) for t in touched}
    ours = [row for row in rows if row["path"] in touched_set]
    unrelated = [row for row in rows if row["path"] not in touched_set]
    staged = [row for row in rows if row["status"][0] != " " and row["status"] != "??"]
    unstaged = [row for row in rows if row["status"][1] != " " or row["status"] == "??"]
    return {"repo": str(root), "dirty_count": len(rows), "touched_count": len(ours), "unrelated_count": len(unrelated), "touched": ours, "unrelated": unrelated, "staged": staged, "unstaged_or_untracked": unstaged}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=Path.cwd())
    parser.add_argument("--touched", nargs="*", default=[])
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    data = report(args.repo, args.touched)
    if args.json:
        print(json.dumps(data, indent=2))
    else:
        print(f"Repo: {data['repo']}")
        print(f"Dirty: {data['dirty_count']} | touched: {data['touched_count']} | unrelated: {data['unrelated_count']}")
        if data["touched"]:
            print("\nTouched files:")
            for row in data["touched"]:
                print(f"{row['status']} {row['path']}")
        if data["unrelated"]:
            print("\nUnrelated dirty files:")
            for row in data["unrelated"][:80]:
                print(f"{row['status']} {row['path']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
