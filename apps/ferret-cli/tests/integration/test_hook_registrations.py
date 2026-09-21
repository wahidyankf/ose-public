"""The repository's hook configuration registers exactly the FERRET events the mappers support, and nothing else."""

import json
import re
from pathlib import Path
from typing import Any

import pytest

from support.hook_payloads import CLAUDE_CODE, CODEX, OPENCODE, REGISTRATIONS
from support.wrapper import REPOSITORY

CLAUDE_HOOKS = {
    "session.started": "SessionStart",
    "session.ended": "SessionEnd",
    "agent.started": "SubagentStart",
    "agent.ended": "SubagentStop",
    "tool.started": "PreToolUse",
    "skill.invoked": "PreToolUse",
    "tool.completed": "PostToolUse",
    "tool.failed": "PostToolUseFailure",
}
CODEX_HOOKS = {event: hook for event, hook in CLAUDE_HOOKS.items() if event not in ("tool.failed", "skill.invoked")}
# Only Claude Code's skill registration is narrowed to one tool, so it does not run for every tool call.
MATCHERS = {"skill.invoked": "Skill"}
CLAUDE_COMMAND = '"$CLAUDE_PROJECT_DIR"/.claude/hooks/ferret-capture.sh claude_code {event}'
CODEX_COMMAND = '"$(git rev-parse --show-toplevel)"/.claude/hooks/ferret-capture.sh codex {event}'
PLUGIN = REPOSITORY / ".opencode" / "plugins" / "ferret.ts"
# The shortest budget any harness gives a hook: Codex ends a session hook after between one and three seconds.
SESSION_END_TIMEOUT_SECONDS = 2


def registered(path: Path) -> dict[str, list[dict[str, Any]]]:
    """Every FERRET command hook in a harness configuration file, by the harness hook name that runs it.

    Each hook comes with the ``matcher`` of the entry that holds it, ``None`` when that entry has none.
    """
    hooks: dict[str, list[dict[str, Any]]] = json.loads(path.read_text())["hooks"]
    return {
        name: [
            {**hook, "matcher": entry.get("matcher")}
            for entry in entries
            for hook in entry["hooks"]
            if "ferret-capture" in hook["command"]
        ]
        for name, entries in hooks.items()
    }


def events_of(harness: str) -> set[str]:
    return {event for owner, event, _ in REGISTRATIONS if owner == harness}


@pytest.mark.parametrize(
    ("path", "harness", "hooks", "template"),
    [
        (REPOSITORY / ".claude" / "settings.json", CLAUDE_CODE, CLAUDE_HOOKS, CLAUDE_COMMAND),
        (REPOSITORY / ".codex" / "hooks.json", CODEX, CODEX_HOOKS, CODEX_COMMAND),
    ],
    ids=[CLAUDE_CODE, CODEX],
)
def test_each_shell_harness_registers_the_wrapper_once_for_every_event_it_can_report(
    path: Path, harness: str, hooks: dict[str, str], template: str
) -> None:
    assert set(hooks) == events_of(harness)
    found = registered(path)

    for event, hook in hooks.items():
        matching = [entry for entry in found[hook] if entry["command"] == template.format(event=event)]
        assert [entry["matcher"] for entry in matching] == [MATCHERS.get(event)], f"{harness} {event}"


@pytest.mark.parametrize(
    ("path", "hooks"),
    [(REPOSITORY / ".claude" / "settings.json", CLAUDE_HOOKS), (REPOSITORY / ".codex" / "hooks.json", CODEX_HOOKS)],
    ids=[CLAUDE_CODE, CODEX],
)
def test_no_other_hook_runs_the_wrapper(path: Path, hooks: dict[str, str]) -> None:
    assert {name for name, commands in registered(path).items() if commands} == set(hooks.values())


def test_codex_gives_the_session_end_hook_the_budget_the_wrapper_needs() -> None:
    (entry,) = registered(REPOSITORY / ".codex" / "hooks.json")["SessionEnd"]

    assert entry["timeout"] >= SESSION_END_TIMEOUT_SECONDS


def test_every_registered_command_names_a_harness_and_an_event_the_mapper_knows() -> None:
    commands = [
        entry["command"]
        for path in (REPOSITORY / ".claude" / "settings.json", REPOSITORY / ".codex" / "hooks.json")
        for entries in registered(path).values()
        for entry in entries
    ]
    pairs = {tuple(re.findall(r"ferret-capture\.sh (\w+) ([\w.]+)$", command)[0]) for command in commands}

    assert pairs == {(harness, event) for harness, event, _ in REGISTRATIONS if harness != OPENCODE}


def test_the_opencode_plugin_forwards_each_event_the_mappers_support_for_it() -> None:
    source = PLUGIN.read_text()

    for event in sorted(events_of(OPENCODE)):
        assert f'send("{event}"' in source, event
