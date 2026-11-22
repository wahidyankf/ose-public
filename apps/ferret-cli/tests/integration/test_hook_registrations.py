"""FERRET capture is registered globally; the repository's own harness configuration holds no FERRET hook.

The repository once registered the shared wrapper in each harness's project configuration. Commit 1bfebba47
moved FERRET to the user's global harness configuration ("Keep FERRET global and enforce repository policy
through local adapters") and left the repository's hook files for repository policy only. These checks hold
that line: no project configuration may start capturing again behind the user's back, the wrapper the global
registrations call must still exist, and the OpenCode plugin, which is the one repository-local adapter, must
still forward every event its mapper supports.
"""

import json
from pathlib import Path

import pytest

from support.hook_payloads import OPENCODE, REGISTRATIONS
from support.wrapper import REPOSITORY, WRAPPER

PROJECT_HOOK_FILES = [
    REPOSITORY / ".claude" / "settings.json",
    REPOSITORY / ".codex" / "hooks.json",
    REPOSITORY / ".commandcode" / "settings.json",
]
PLUGIN = REPOSITORY / ".opencode" / "plugins" / "ferret.ts"


type HarnessDocument = dict[str, HarnessDocument] | list[HarnessDocument] | str | int | float | bool | None


def commands_in(node: HarnessDocument) -> list[str]:
    """Every ``command`` string anywhere in a harness configuration document."""
    if isinstance(node, dict):
        found = [value for key, value in node.items() if key == "command" and isinstance(value, str)]
        return found + [command for value in node.values() for command in commands_in(value)]
    if isinstance(node, list):
        return [command for value in node for command in commands_in(value)]
    return []


@pytest.mark.parametrize("path", PROJECT_HOOK_FILES, ids=lambda path: path.parent.name)
def test_no_project_harness_configuration_registers_the_capture_wrapper(path: Path) -> None:
    assert path.is_file(), f"the repository hook configuration is missing at {path}"
    commands = commands_in(json.loads(path.read_text()))

    assert commands, f"{path} registers no hook at all, so this check would pass on an empty file"
    assert [command for command in commands if "ferret-capture" in command] == []


def test_the_capture_wrapper_the_global_registrations_call_still_exists() -> None:
    assert WRAPPER.is_file()
    assert WRAPPER.stat().st_mode & 0o111, f"{WRAPPER} is not executable"


def events_of(harness: str) -> set[str]:
    return {event for owner, event, _ in REGISTRATIONS if owner == harness}


def test_the_opencode_plugin_forwards_each_event_the_mappers_support_for_it() -> None:
    source = PLUGIN.read_text()

    for event in sorted(events_of(OPENCODE)):
        assert f'send("{event}"' in source, event
