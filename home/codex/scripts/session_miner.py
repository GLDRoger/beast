#!/usr/bin/env python3
"""Summarize Codex session JSONL logs without loading transcripts into model context."""
from __future__ import annotations

import argparse
import collections
import json
import re
from pathlib import Path
from statistics import median
from typing import Any

DEFAULT_CODEX = Path.home() / ".codex"
PATH_RE = re.compile(r"/(?:Users/nishchay|workspace|tmp|var|root)[^\s\"'`),;:]+")

TOPIC_RULES = {
    "code_fix": r"fix|bug|error|failing|broken|issue|stack trace|not working|crash",
    "ui_design": r"ui|ux|design|landing|page|modal|component|toast|layout|mobile|responsive|copy|polish|visual|browser|localhost",
    "quality_security": r"quality|audit|security|crap|maintainability|god file|dependency|dependabot|vulnerability|cve|pnpm audit|test|typecheck|lint",
    "git_ops": r"commit|stash|branch|worktree|merge|push|pr\b|pull request|rebase|diff",
    "docs_plans": r"doc|markdown|plan|strategy|roadmap|handoff|write.*md|proposal|deep dive",
    "research_strategy": r"pressure[- ]test|market|competitor|legal|soc ?2|compliance|incorporation|startup|customers",
    "codex_config": r"codex|agents\.md|beast\.md|skill|prompt|memory|session|config\.toml|model|opus|sonnet|haiku|kimi",
    "automation": r"automation|remind|recurring|monitor|watch|check back|every day|weekly",
    "remote_ml": r"runpod|comfyui|cuda|torch|gpu|pod|ssh|model endpoint|ollama",
    "media_docs": r"pptx|slides|spreadsheet|xlsx|docx|pdf|video|hyperframes|image|sprite|pet",
}


def text_from_content(content: Any) -> str:
    if isinstance(content, str):
        return content
    if not isinstance(content, list):
        return ""
    parts: list[str] = []
    for item in content:
        if isinstance(item, dict) and item.get("type") in {"input_text", "output_text", "text"}:
            parts.append(str(item.get("text", "")))
        elif isinstance(item, dict) and "text" in item:
            parts.append(str(item.get("text", "")))
    return "\n".join(parts)


def command_base(cmd: str) -> str:
    s = (cmd or "").strip()
    s = re.sub(r"^(?:cd\s+[^;&]+\s*(?:&&|;|\n)\s*)+", "", s)
    match = re.match(r"(?:env\s+\S+\s+)*([\w./+-]+)", s)
    return match.group(1).split("/")[-1].lower() if match else ""


def classify(text: str, cwd: str = "") -> list[str]:
    haystack = f"{text} {cwd}".lower()
    hits = [name for name, pattern in TOPIC_RULES.items() if re.search(pattern, haystack)]
    return hits or ["other"]


def scan(sessions_dir: Path, recent_samples: int = 30) -> dict[str, Any]:
    files = sorted(sessions_dir.rglob("*.jsonl"))
    file_sizes: list[int] = []
    cwd_counts: collections.Counter[str] = collections.Counter()
    sources: collections.Counter[str] = collections.Counter()
    origins: collections.Counter[str] = collections.Counter()
    cli_versions: collections.Counter[str] = collections.Counter()
    categories: collections.Counter[str] = collections.Counter()
    functions: collections.Counter[str] = collections.Counter()
    custom_tools: collections.Counter[str] = collections.Counter()
    command_bases: collections.Counter[str] = collections.Counter()
    command_exact: collections.Counter[str] = collections.Counter()
    repeated_in_session: collections.Counter[str] = collections.Counter()
    workdirs: collections.Counter[str] = collections.Counter()
    paths: collections.Counter[str] = collections.Counter()
    user_paths: collections.Counter[str] = collections.Counter()
    patch_files: collections.Counter[str] = collections.Counter()
    output_bytes: collections.Counter[str] = collections.Counter()
    big_outputs: list[tuple[int, str, str, str]] = []
    samples: collections.deque[tuple[str, str, str, list[str]]] = collections.deque(maxlen=recent_samples)
    tool_counts: list[int] = []
    user_turn_counts: list[int] = []
    context_compactions = 0
    turn_aborts = 0
    web_search_calls = 0

    for fp in files:
        size = fp.stat().st_size
        file_sizes.append(size)
        cwd = ""
        session_commands: collections.Counter[str] = collections.Counter()
        tool_count = 0
        user_turns = 0
        compacted = False
        with fp.open(errors="ignore") as handle:
            for line in handle:
                try:
                    obj = json.loads(line)
                except Exception:
                    continue
                typ = obj.get("type")
                payload = obj.get("payload") or {}
                if typ == "session_meta":
                    cwd = payload.get("cwd") or ""
                    cwd_counts[cwd] += 1
                    sources[str(payload.get("source", "?"))] += 1
                    origins[str(payload.get("originator", "?"))] += 1
                    cli_versions[str(payload.get("cli_version", "?"))] += 1
                elif typ == "event_msg":
                    event_type = payload.get("type")
                    if event_type == "context_compacted":
                        compacted = True
                    elif event_type == "turn_aborted":
                        turn_aborts += 1
                elif typ == "response_item":
                    ptype = payload.get("type")
                    if ptype == "message" and payload.get("role") == "user":
                        text = text_from_content(payload.get("content"))
                        cats = classify(text[:8000], cwd)
                        for cat in cats:
                            categories[cat] += 1
                        for user_path in PATH_RE.findall(text):
                            user_paths[user_path[:180]] += 1
                        first_line = " ".join(text.strip().split())[:180]
                        if first_line:
                            samples.append((fp.name, cwd, first_line, cats))
                        user_turns += 1
                    elif ptype == "function_call":
                        tool_count += 1
                        name = payload.get("name", "?")
                        functions[name] += 1
                        try:
                            args = json.loads(payload.get("arguments") or "{}")
                        except Exception:
                            args = {}
                        if name == "exec_command":
                            cmd = args.get("cmd", "")
                            base = command_base(cmd)
                            command_bases[base] += 1
                            normalized = re.sub(r"\s+", " ", cmd.strip())[:240]
                            command_exact[normalized] += 1
                            session_commands[normalized] += 1
                            workdirs[args.get("workdir") or ""] += 1
                        for path in PATH_RE.findall(json.dumps(args)[:8000]):
                            paths[path[:180]] += 1
                    elif ptype == "custom_tool_call":
                        tool_count += 1
                        name = payload.get("name", "?")
                        custom_tools[name] += 1
                        text = payload.get("input") or ""
                        for match in re.finditer(r"^\*\*\* (?:Update|Add|Delete) File: (.+)$", text, flags=re.M):
                            patch_files[match.group(1).strip()[:180]] += 1
                    elif ptype == "web_search_call":
                        tool_count += 1
                        web_search_calls += 1
                    elif ptype in {"function_call_output", "custom_tool_call_output"}:
                        name = payload.get("name") or ptype
                        output = str(payload.get("output") or "")
                        output_bytes[name] += len(output)
                        if len(output) > 40_000:
                            big_outputs.append((len(output), fp.name, name, output[:160].replace("\n", " ")))
        if compacted:
            context_compactions += 1
        for cmd, count in session_commands.items():
            if count > 1:
                repeated_in_session[cmd] += count
        tool_counts.append(tool_count)
        user_turn_counts.append(user_turns)

    return {
        "corpus": {
            "session_files": len(files),
            "total_mb": round(sum(file_sizes) / 1_000_000, 2),
            "largest_mb": round((max(file_sizes) if file_sizes else 0) / 1_000_000, 2),
            "median_mb": round((median(file_sizes) if file_sizes else 0) / 1_000_000, 2),
            "sessions_with_context_compaction": context_compactions,
            "turn_aborted_events": turn_aborts,
        },
        "metadata": {
            "top_cwds": cwd_counts.most_common(30),
            "sources": sources.most_common(),
            "originators": origins.most_common(),
            "cli_versions": cli_versions.most_common(15),
        },
        "topics": {
            "category_counts": categories.most_common(),
            "recent_user_samples": list(samples),
        },
        "tools": {
            "function_counts": functions.most_common(60),
            "custom_tool_counts": custom_tools.most_common(20),
            "web_search_calls": web_search_calls,
            "command_bases": command_bases.most_common(80),
            "top_repeated_exact_commands": command_exact.most_common(50),
            "commands_repeated_within_sessions": repeated_in_session.most_common(50),
            "workdirs": workdirs.most_common(40),
            "big_outputs": sorted(big_outputs, reverse=True)[:30],
            "output_bytes_by_tool": output_bytes.most_common(40),
        },
        "paths": {
            "top_paths_in_tool_args": paths.most_common(60),
            "top_paths_in_user_msgs": user_paths.most_common(60),
            "top_patch_files": patch_files.most_common(60),
        },
        "distributions": {
            "avg_tool_calls_per_session": round(sum(tool_counts) / len(tool_counts), 2) if tool_counts else 0,
            "max_tool_calls_session": max(tool_counts) if tool_counts else 0,
            "avg_user_turns_per_session": round(sum(user_turn_counts) / len(user_turn_counts), 2) if user_turn_counts else 0,
            "max_user_turns_session": max(user_turn_counts) if user_turn_counts else 0,
        },
    }


def print_text(report: dict[str, Any]) -> None:
    print(json.dumps({"corpus": report["corpus"], "distributions": report["distributions"]}, indent=2))
    for title, items in [
        ("Top CWDs", report["metadata"]["top_cwds"][:12]),
        ("Categories", report["topics"]["category_counts"]),
        ("Top tools", report["tools"]["function_counts"][:15]),
        ("Top commands", report["tools"]["command_bases"][:25]),
        ("Repeated commands", report["tools"]["top_repeated_exact_commands"][:15]),
    ]:
        print(f"\n{title}:")
        for key, value in items:
            print(value, key)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sessions", type=Path, default=DEFAULT_CODEX / "sessions")
    parser.add_argument("--output", type=Path, default=DEFAULT_CODEX / "session-miner-latest.json")
    parser.add_argument("--format", choices=["text", "json"], default="text")
    parser.add_argument("--recent-samples", type=int, default=30)
    args = parser.parse_args()

    report = scan(args.sessions, recent_samples=args.recent_samples)
    args.output.write_text(json.dumps(report, indent=2), encoding="utf-8")
    if args.format == "json":
        print(json.dumps(report, indent=2))
    else:
        print_text(report)
        print(f"\nWrote JSON report: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
