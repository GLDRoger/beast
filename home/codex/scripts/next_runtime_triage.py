#!/usr/bin/env python3
"""Condense noisy Next.js/runtime stack traces into source candidates and stale-build clues."""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

SOURCE_RE = re.compile(r"(/[\w .@+\-~()\[\]/]+(?:apps/web|src|app|components|utils|lib|packages|prisma)[^\s)\"']+\.(?:ts|tsx|js|jsx|mjs|cjs))")
CHUNK_RE = re.compile(r"(/[\w .@+\-~()\[\]/]+\.next/(?:dev/)?[^\s)\"']+)")
ERROR_RE = re.compile(r"((?:TypeError|ReferenceError|SyntaxError|Error|PrismaClient\w+Error|AbortError|Unhandled Runtime Error)[:\s][^\n]+)")


def triage(text: str) -> dict[str, Any]:
    errors = list(dict.fromkeys(m.group(1).strip() for m in ERROR_RE.finditer(text)))[:20]
    sources = [p for p in dict.fromkeys(m.group(1).strip().rstrip(":,") for m in SOURCE_RE.finditer(text)) if "/.next/" not in p][:40]
    chunks = list(dict.fromkeys(m.group(1).strip().rstrip(":,") for m in CHUNK_RE.finditer(text)))[:20]
    stale_clues = [c for c in chunks if "node_modules/.pnpm/next@" in c or ".next/dev/server/chunks" in c]
    suggestions = []
    if chunks and not sources:
        suggestions.append("Trace mostly points at .next chunks; search source symbols/error text before editing generated files.")
    if stale_clues:
        suggestions.append("Stale dev build/chunk path present; consider clearing .next only after confirming source is already fixed.")
    if any("AbortError" in e for e in errors):
        suggestions.append("AbortError present; inspect callback/reachability/timeouts before blaming the dependency named nearby.")
    if any("Prisma" in e or "P1017" in e for e in errors):
        suggestions.append("Prisma error present; classify retryable disconnects separately from real query/schema regressions.")
    return {"errors": errors, "source_candidates": sources, "next_chunks": chunks, "suggestions": suggestions}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("file", nargs="?", type=Path, help="Trace file; defaults to stdin")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    text = args.file.read_text(errors="ignore") if args.file else sys.stdin.read()
    data = triage(text)
    if args.json:
        print(json.dumps(data, indent=2))
    else:
        for key in ["errors", "source_candidates", "next_chunks", "suggestions"]:
            print(f"{key}:")
            for item in data[key]:
                print(f"- {item}")
            print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
