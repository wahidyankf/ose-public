"""Command Code hook contract through the built artifact's public process boundary."""

import json
from dataclasses import dataclass
from pathlib import Path

import pytest
from pytest_bdd import given, parsers, scenario, then, when

from ferret_process import Completed, run_artifact
from vendor_payloads import CANARIES, commandcode, encode

FEATURE = "../../../../specs/apps/ferret/cli/behaviours/privacy/metadata-envelope.feature"


@dataclass(slots=True)
class Session:
    artifact: Path
    home: Path
    raw: bytes = b""
    ran: Completed | None = None

    def events(self) -> list[dict[str, object]]:
        ran = run_artifact(self.artifact, ["events", "export", "--format", "jsonl", "--all-time"], home=self.home)
        assert ran.returncode == (0 if ran.stdout else 1)
        assert ran.stderr == b""
        return [json.loads(line) for line in ran.stdout.splitlines()]

    def stored_bytes(self) -> str:
        data = self.home / ".local" / "share" / "ferret"
        return b"".join(path.read_bytes() for path in data.rglob("*") if path.is_file()).decode(
            "utf-8", errors="replace"
        )

    def assert_silent(self) -> None:
        assert self.ran == Completed(0, b"", b"")


@pytest.fixture
def session(artifact: Path, home: Path) -> Session:
    initialized = run_artifact(artifact, ["init", "--json"], home=home)
    assert (initialized.returncode, initialized.stderr) == (0, b"")
    return Session(artifact, home)


@when(parsers.parse("capture-hook receives the registered {event} event"))
def when_captured(session: Session, event: str) -> None:
    session.ran = run_artifact(
        session.artifact,
        ["capture-hook", "--harness", "commandcode", "--event", event],
        home=session.home,
        stdin=session.raw,
    )


@scenario(FEATURE, "Capture only the lifecycle fact a Command Code hook reports")
def test_capture_the_reported_commandcode_fact() -> None:
    """Each example captures only its observed lifecycle fact."""


@scenario(FEATURE, "Refuse unsupported or unusable Command Code hook input silently")
def test_refuse_unusable_commandcode_input() -> None:
    """Each example refuses input without disturbing the harness."""


@given(parsers.parse("an initialized store and a Command Code {hook} payload carrying private content"))
def given_reported_hook(session: Session, hook: str) -> None:
    session.raw = encode(commandcode(hook))


@given(parsers.parse("an initialized store and a Command Code payload with {condition}"))
def given_unusable_hook(session: Session, condition: str) -> None:
    document = commandcode("PreToolUse")
    if condition == "an end-of-turn Stop":
        document["hook_event_name"] = "Stop"
    elif condition == "an unknown event":
        document["hook_event_name"] = "PostToolUseFailure"
    elif condition == "a mismatched hook":
        document["hook_event_name"] = "PostToolUse"
    elif condition == "a missing session":
        del document["session_id"]
    elif condition == "a relative directory":
        document["cwd"] = "relative/path"
    else:
        assert condition == "malformed JSON"
        session.raw = b'{"session_id":'
        return
    session.raw = encode(document)


@then(parsers.parse("the event reports outcome {outcome} with visibility {visibility}"))
def then_outcome_is_honest(session: Session, outcome: str, visibility: str) -> None:
    documents = session.events()
    assert len(documents) == 1
    [document] = documents
    assert (document["outcome"], document["outcomeVisibility"]) == (outcome, visibility)


@then("the store contains no private content or inferred lifecycle metadata")
def then_no_private_or_inferred_metadata(session: Session) -> None:
    documents = session.events()
    assert len(documents) == 1
    [document] = documents
    assert not any(canary in session.stored_bytes() for canary in CANARIES)
    assert document["durationMs"] is None
    assert document["durationVisibility"] == (
        "unknown" if document["eventType"] == "tool.completed" else "not_applicable"
    )
    assert document["agentName"] is None
    assert document["skillName"] is None
    assert document["harnessVersion"] is None
    assert document["parentSessionId"] is None


@then(parsers.parse("it silently stores one {event} event naming {tool}"))
def then_one_event(session: Session, event: str, tool: str) -> None:
    session.assert_silent()
    documents = session.events()
    assert len(documents) == 1
    [document] = documents
    assert (document["harness"], document["eventType"], document["toolName"]) == (
        "commandcode",
        event,
        None if tool == "none" else tool,
    )


@then("it silently stores no event")
def then_no_event(session: Session) -> None:
    session.assert_silent()
    assert session.events() == []
