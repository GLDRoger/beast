#!/usr/bin/env python3
"""Analyze Codex session logs and rank skills by observed usage.

This script is intentionally conservative:
- It only counts a skill when a non-user/non-developer session line references
  a path ending in `SKILL.md` beneath a `skills/` directory.
- It counts a skill at most once per session.
- It filters sessions by filename timestamp first so the 4-month window is
  deterministic and does not depend on file mtimes.

Usage examples:
  python3 scripts/analyze_skill_usage.py
  python3 scripts/analyze_skill_usage.py --months 4 --rare-threshold 3
  python3 scripts/analyze_skill_usage.py --format json > skill-usage.json
"""

from __future__ import annotations

import argparse
import dataclasses
import datetime as dt
import json
import re
import sys
from pathlib import Path
from typing import Iterable, Iterator


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SESSION_ROOTS = (ROOT / "sessions", ROOT / "archived_sessions")
DEFAULT_SKILLS_ROOT = ROOT / "skills"
ROLL_OUT_RE = re.compile(
    r"rollout-(?P<stamp>\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})-"
)
SKILL_PATH_TOKEN_RE = re.compile(r"(?P<token>[^\s\"'`<>]+SKILL\.md)")
SKIP_LINE_MARKERS = (
    '"role":"user"',
    '"role":"developer"',
    '"role":"system"',
)
SKIP_TYPE_MARKERS = (
    '"type":"session_meta"',
    '"type":"turn_context"',
    '"type":"event_msg"',
)


@dataclasses.dataclass(frozen=True)
class SkillSpec:
    rel_path: str
    skill_name: str
    markers: tuple[str, ...]


@dataclasses.dataclass
class SkillStat:
    sessions: int = 0
    first_seen: dt.datetime | None = None
    last_seen: dt.datetime | None = None
    example_sessions: list[str] = dataclasses.field(default_factory=list)

    def record(self, session_ts: dt.datetime, session_path: Path) -> None:
        self.sessions += 1
        if self.first_seen is None or session_ts < self.first_seen:
            self.first_seen = session_ts
        if self.last_seen is None or session_ts > self.last_seen:
            self.last_seen = session_ts
        if len(self.example_sessions) < 3:
            self.example_sessions.append(session_path.name)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Analyze Codex session logs for rarely or never used skills."
    )
    parser.add_argument(
        "--months",
        type=int,
        default=4,
        help="Rolling calendar months to include (default: 4).",
    )
    parser.add_argument(
        "--rare-threshold",
        type=int,
        default=3,
        help="Maximum session count for a skill to count as rare (default: 3).",
    )
    parser.add_argument(
        "--session-root",
        action="append",
        dest="session_roots",
        type=Path,
        help=(
            "Additional root containing rollout-*.jsonl files. "
            "Can be provided multiple times."
        ),
    )
    parser.add_argument(
        "--skills-root",
        type=Path,
        default=DEFAULT_SKILLS_ROOT,
        help="Root directory containing SKILL.md files (default: ./skills).",
    )
    parser.add_argument(
        "--format",
        choices=("text", "json"),
        default="text",
        help="Output format (default: text).",
    )
    return parser.parse_args()


def month_floor(now: dt.datetime, months: int) -> dt.datetime:
    """Return the datetime `months` calendar months before `now`."""
    year = now.year
    month = now.month - months
    while month <= 0:
        month += 12
        year -= 1

    day = min(now.day, _days_in_month(year, month))
    return now.replace(year=year, month=month, day=day)


def _days_in_month(year: int, month: int) -> int:
    next_month = month + 1
    next_year = year
    if next_month == 13:
        next_month = 1
        next_year += 1
    start = dt.datetime(year, month, 1)
    end = dt.datetime(next_year, next_month, 1)
    return (end - start).days


def iter_session_files(roots: Iterable[Path]) -> Iterator[Path]:
    seen: set[Path] = set()
    for root in roots:
        if not root.exists():
            continue
        for path in root.rglob("rollout-*.jsonl"):
            if path.is_file() and path not in seen:
                seen.add(path)
                yield path


def parse_session_timestamp(path: Path) -> dt.datetime | None:
    """Parse the session timestamp from the filename, with a JSON fallback."""
    match = ROLL_OUT_RE.search(path.name)
    if match:
        return dt.datetime.strptime(match.group("stamp"), "%Y-%m-%dT%H-%M-%S")

    try:
        with path.open("r", encoding="utf-8", errors="replace") as fh:
            first_line = fh.readline()
        if not first_line:
            return None
        payload = json.loads(first_line)
        raw_ts = (
            payload.get("payload", {})
            .get("timestamp")
            or payload.get("payload", {})
            .get("session_timestamp")
        )
        if not raw_ts:
            return None
        parsed = dt.datetime.fromisoformat(raw_ts.replace("Z", "+00:00"))
        return parsed.astimezone().replace(tzinfo=None)
    except Exception:
        return None


def load_skill_specs(skills_root: Path) -> list[SkillSpec]:
    if not skills_root.exists():
        raise FileNotFoundError(f"skills root does not exist: {skills_root}")

    specs: list[SkillSpec] = []
    for skill_file in sorted(skills_root.rglob("SKILL.md")):
        if not skill_file.is_file():
            continue
        rel_path = skill_file.parent.relative_to(skills_root).as_posix()
        skill_name = skill_file.parent.name
        markers = build_markers(rel_path, skills_root)
        specs.append(SkillSpec(rel_path=rel_path, skill_name=skill_name, markers=markers))
    return specs


def build_markers(rel_path: str, skills_root: Path) -> tuple[str, ...]:
    absolute_root = skills_root.resolve().as_posix().rstrip("/")
    prefixes = (
        "skills/",
        "/skills/",
        "~/.codex/skills/",
        "~/.agents/skills/",
        absolute_root + "/",
        str(Path.home() / ".codex" / "skills").replace("\\", "/").rstrip("/") + "/",
        str(Path.home() / ".agents" / "skills").replace("\\", "/").rstrip("/") + "/",
    )
    markers = {
        f"{prefix}{rel_path}/SKILL.md".replace("//", "/") for prefix in prefixes
    }
    return tuple(sorted(markers))


def session_skill_hits(path: Path, specs: list[SkillSpec]) -> set[str]:
    """Return the relative skill paths referenced in this session file."""
    hits: set[str] = set()
    if not specs:
        return hits

    markers_to_rel: dict[str, str] = {}
    for spec in specs:
        for marker in spec.markers:
            markers_to_rel[marker] = spec.rel_path

    with path.open("r", encoding="utf-8", errors="replace") as fh:
        for raw_line in fh:
            if any(marker in raw_line for marker in SKIP_LINE_MARKERS):
                continue
            if any(marker in raw_line for marker in SKIP_TYPE_MARKERS):
                continue
            if "SKILL.md" not in raw_line or "skills/" not in raw_line:
                continue

            for token in SKILL_PATH_TOKEN_RE.findall(raw_line):
                normalized = _normalize_skill_token(token)
                mapped_rel = markers_to_rel.get(normalized)
                if mapped_rel:
                    hits.add(mapped_rel)
    return hits


def _normalize_skill_token(token: str) -> str:
    token = token.rstrip(").,;:>]}\"'")
    token = token.split("#", 1)[0]
    token = re.sub(r"(?::\d+(?::\d+)?)$", "", token)
    token = re.sub(r"(?:#L\d+(?:C\d+)?)$", "", token)
    return token


def format_ts(value: dt.datetime | None) -> str:
    return value.strftime("%Y-%m-%d") if value else "n/a"


def main() -> int:
    args = parse_args()
    now = dt.datetime.now()
    cutoff = month_floor(now, args.months)

    session_roots = list(DEFAULT_SESSION_ROOTS)
    if args.session_roots:
        session_roots.extend(args.session_roots)

    specs = load_skill_specs(args.skills_root)
    stats = {spec.rel_path: SkillStat() for spec in specs}

    session_files = sorted(iter_session_files(session_roots))
    included_sessions = 0
    skipped_old = 0
    skipped_unparsed = 0

    for session_file in session_files:
        session_ts = parse_session_timestamp(session_file)
        if session_ts is None:
            skipped_unparsed += 1
            continue
        if session_ts < cutoff:
            skipped_old += 1
            continue

        included_sessions += 1
        hits = session_skill_hits(session_file, specs)
        for rel_path in hits:
            stats[rel_path].record(session_ts, session_file)

    ranked = sorted(
        specs,
        key=lambda spec: (
            stats[spec.rel_path].sessions,
            spec.rel_path,
        ),
    )

    report = build_report(
        now=now,
        cutoff=cutoff,
        window_months=args.months,
        session_roots=session_roots,
        session_files=session_files,
        included_sessions=included_sessions,
        skipped_old=skipped_old,
        skipped_unparsed=skipped_unparsed,
        specs=specs,
        stats=stats,
        rare_threshold=args.rare_threshold,
        ranked=ranked,
    )

    if args.format == "json":
        json.dump(report, sys.stdout, indent=2, sort_keys=True, default=str)
        sys.stdout.write("\n")
    else:
        sys.stdout.write(render_text_report(report))

    return 0


def build_report(
    *,
    now: dt.datetime,
    cutoff: dt.datetime,
    window_months: int,
    session_roots: list[Path],
    session_files: list[Path],
    included_sessions: int,
    skipped_old: int,
    skipped_unparsed: int,
    specs: list[SkillSpec],
    stats: dict[str, SkillStat],
    rare_threshold: int,
    ranked: list[SkillSpec],
) -> dict:
    never_used = [spec for spec in ranked if stats[spec.rel_path].sessions == 0]
    rare_used = [
        spec
        for spec in ranked
        if 0 < stats[spec.rel_path].sessions <= rare_threshold
    ]
    used = [spec for spec in ranked if stats[spec.rel_path].sessions > 0]

    return {
        "window": {
            "start": cutoff.isoformat(timespec="seconds"),
            "end": now.isoformat(timespec="seconds"),
            "months": window_months,
        },
        "roots": [str(root) for root in session_roots],
        "session_count": len(session_files),
        "included_session_count": included_sessions,
        "skipped_old_session_count": skipped_old,
        "skipped_unparsed_session_count": skipped_unparsed,
        "skill_count": len(specs),
        "rare_threshold": rare_threshold,
        "never_used": [
            skill_to_dict(spec, stats[spec.rel_path]) for spec in never_used
        ],
        "rarely_used": [
            skill_to_dict(spec, stats[spec.rel_path]) for spec in rare_used
        ],
        "used": [skill_to_dict(spec, stats[spec.rel_path]) for spec in used],
    }


def skill_to_dict(spec: SkillSpec, stat: SkillStat) -> dict:
    return {
        "rel_path": spec.rel_path,
        "skill_name": spec.skill_name,
        "sessions": stat.sessions,
        "first_seen": format_ts(stat.first_seen),
        "last_seen": format_ts(stat.last_seen),
        "example_sessions": stat.example_sessions,
    }


def render_text_report(report: dict) -> str:
    lines: list[str] = []
    lines.append(
        f"Window: {report['window']['start']} -> {report['window']['end']} "
        f"({report['window']['months']} calendar months)"
    )
    lines.append(f"Session roots: {', '.join(report['roots'])}")
    lines.append(
        f"Sessions scanned: {report['session_count']} | "
        f"in window: {report['included_session_count']} | "
        f"skipped old: {report['skipped_old_session_count']} | "
        f"skipped unparsed: {report['skipped_unparsed_session_count']}"
    )
    lines.append(f"Skills discovered: {report['skill_count']}")
    lines.append("")

    never_used = report["never_used"]
    rare_used = report["rarely_used"]
    used = report["used"]

    lines.append(f"Never used: {len(never_used)}")
    lines.extend(_render_skill_list(never_used, show_examples=False))
    lines.append("")
    lines.append(
        f"Rarely used (1-{report['rare_threshold']} sessions): {len(rare_used)}"
    )
    lines.extend(_render_skill_list(rare_used, show_examples=True))
    lines.append("")
    lines.append("Most used (top 10):")
    top_used = sorted(used, key=lambda item: (-item["sessions"], item["rel_path"]))[:10]
    lines.extend(_render_skill_list(top_used, show_examples=False, include_counts=True))
    lines.append("")
    lines.append(
        "Method: conservative path-based counting of `SKILL.md` references in "
        "assistant and tool output lines only."
    )
    return "\n".join(lines) + "\n"


def _render_skill_list(
    items: list[dict],
    *,
    show_examples: bool,
    include_counts: bool = False,
) -> list[str]:
    if not items:
        return ["- none"]

    lines: list[str] = []
    for item in items:
        prefix = f"- `{item['rel_path']}`"
        if include_counts or item["sessions"]:
            prefix += f" — {item['sessions']} session"
            if item["sessions"] != 1:
                prefix += "s"
        if show_examples and item["example_sessions"]:
            prefix += f" (e.g. {', '.join(item['example_sessions'])})"
        lines.append(prefix)
    return lines


if __name__ == "__main__":
    raise SystemExit(main())
