"""Raw harness hook payloads reduced to lifecycle facts: one allowlist and one mapper per harness.

A mapper sees only the scalar values at its allowlisted paths, never the payload, so a prompt, a tool argument or
result, a transcript path, or an environment value cannot reach an event however a vendor nests it. A registration the
payload does not match, and any payload missing what the event needs, maps to nothing: unsupported or ambiguous input
creates no event, and a value that is present but unusable is stored as unknown, never guessed.
"""

import unicodedata
from collections.abc import Mapping
from dataclasses import dataclass, replace
from typing import Final

from ferret.domain import fields
from ferret.domain.event import MAX_DURATION_MS

CLAUDE_CODE: Final = "claude_code"
CODEX: Final = "codex"
OPENCODE: Final = "opencode"

MAX_NATIVE_LENGTH: Final = 256
MAX_DIRECTORY_LENGTH: Final = 4096

type Projected = Mapping[str, str | int | float | bool | None]
type PayloadPath = tuple[str, ...]


@dataclass(frozen=True, slots=True)
class HookFacts:
    """What one hook call says happened, in the vocabulary of an event but with the harness's own raw identifiers.

    ``session`` and ``directory`` are still the harness's values; the application derives the opaque identifiers from
    them under the installation key and never stores these.
    """

    event_type: str
    session: str
    directory: str
    parent_session: str | None = None
    harness_version: str | None = None
    agent_name: str | None = None
    skill_name: str | None = None
    tool_name: str | None = None
    outcome: str = "not_applicable"
    duration_ms: int | None = None
    subject_visibility: str = "not_applicable"
    outcome_visibility: str = "not_applicable"
    duration_visibility: str = "not_applicable"


@dataclass(frozen=True, slots=True)
class Profile:
    """What one harness's hooks let FERRET claim about a tool call.

    ``tool_outcome`` is how the outcome is known: the harness reports it, or it is derived from which hook fired.
    ``tool_duration`` is how a duration is known, or ``None`` when the harness never times a tool call.
    """

    tool_outcome: str
    tool_duration: str | None


PROFILES: Final[Mapping[str, Profile]] = {
    CLAUDE_CODE: Profile(tool_outcome="observed", tool_duration="observed"),
    CODEX: Profile(tool_outcome="derived", tool_duration=None),
    OPENCODE: Profile(tool_outcome="derived", tool_duration=None),
}

_COMMON: Final[tuple[PayloadPath, ...]] = (("session_id",), ("cwd",), ("hook_event_name",))
_ALLOWED: Final[Mapping[str, tuple[PayloadPath, ...]]] = {
    CLAUDE_CODE: (*_COMMON, ("agent_type",), ("tool_name",), ("tool_input", "skill"), ("duration_ms",)),
    CODEX: (*_COMMON, ("agent_type",), ("tool_name",)),
    OPENCODE: (
        ("hook",),
        ("directory",),
        ("input", "tool"),
        ("input", "sessionID"),
        ("output", "args", "name"),
        ("input", "event", "type"),
        ("input", "event", "properties", "info", "id"),
        ("input", "event", "properties", "info", "parentID"),
        ("input", "event", "properties", "info", "version"),
    ),
}

# The hook each registered event arrives as, per harness. Claude Code and Codex name it in ``hook_event_name``.
_VENDOR_EVENTS: Final[Mapping[str, Mapping[str, str]]] = {
    CLAUDE_CODE: {
        "session.started": "SessionStart",
        "session.ended": "SessionEnd",
        "agent.started": "SubagentStart",
        "agent.ended": "SubagentStop",
        "tool.started": "PreToolUse",
        "skill.invoked": "PreToolUse",
        "tool.completed": "PostToolUse",
        "tool.failed": "PostToolUseFailure",
    },
    CODEX: {
        "session.started": "SessionStart",
        "session.ended": "SessionEnd",
        "agent.started": "SubagentStart",
        "agent.ended": "SubagentStop",
        "tool.started": "PreToolUse",
        "tool.completed": "PostToolUse",
    },
}
_OPENCODE_HOOKS: Final[Mapping[str, str]] = {
    "session.started": "event",
    "tool.started": "tool.execute.before",
    "skill.invoked": "tool.execute.before",
    "tool.completed": "tool.execute.after",
}
_CLAUDE_SKILL_TOOL: Final = "Skill"
_OPENCODE_SKILL_TOOL: Final = "skill"
_OPENCODE_SESSION_CREATED: Final = "session.created"


def allowed_paths(harness: str) -> tuple[PayloadPath, ...]:
    """The only payload paths ``harness`` may contribute; a harness FERRET has no mapper for contributes none."""
    return _ALLOWED.get(harness, ())


def _native(values: Projected, path: str, *, limit: int = MAX_NATIVE_LENGTH) -> str | None:
    """A harness-native identifier or directory: printable, non-empty, and bounded, or ``None`` when it is not."""
    value = values.get(path)
    if not isinstance(value, str):
        return None
    text = unicodedata.normalize("NFC", value)
    return text if text and text.isprintable() and len(text) <= limit else None


def _directory(values: Projected, path: str) -> str | None:
    """A reported working directory: an absolute path of printable characters, or ``None``."""
    text = _native(values, path, limit=MAX_DIRECTORY_LENGTH)
    return text if text is not None and text.startswith("/") else None


def _name(values: Projected, path: str, *, logical: bool) -> str | None:
    """A tool, agent, or skill name that is a valid identifier, or ``None`` so its subject is stored as unknown."""
    text = _native(values, path, limit=fields.MAX_NAME_LENGTH)
    return text if text is not None and fields.is_name(text, logical=logical) else None


def _version(values: Projected, path: str) -> str | None:
    text = _native(values, path, limit=64)
    return text if text is not None and fields.HARNESS_VERSION.fullmatch(text) else None


def _duration(value: object) -> int | None:
    """A tool's reported duration in whole milliseconds, or ``None`` when it is absent, negative, or beyond a day."""
    if isinstance(value, bool) or not isinstance(value, int | float):
        return None
    if not 0 <= value <= MAX_DURATION_MS:
        return None
    return int(value)


def _facts(
    profile: Profile,
    event_type: str,
    session: str,
    directory: str,
    *,
    name: str | None = None,
    duration: int | None = None,
    parent_session: str | None = None,
    harness_version: str | None = None,
) -> HookFacts:
    """The facts for one event type: subject, outcome, and duration stated only as far as the harness lets us."""
    base = HookFacts(event_type=event_type, session=session, directory=directory)
    if event_type == "session.started":
        return replace(base, parent_session=parent_session, harness_version=harness_version)
    if event_type == "session.ended":
        return replace(base, outcome="unknown", outcome_visibility="unknown", duration_visibility="unknown")
    subject = "observed" if name is not None else "unknown"
    if event_type == "skill.invoked":
        return replace(base, skill_name=name, subject_visibility=subject)
    if event_type == "tool.started":
        return replace(base, tool_name=name, subject_visibility=subject)
    if event_type == "agent.started":
        return replace(base, agent_name=name, subject_visibility=subject)
    if event_type == "agent.ended":
        return replace(
            base,
            agent_name=name,
            subject_visibility=subject,
            outcome="unknown",
            outcome_visibility="unknown",
            duration_visibility="unknown",
        )
    timed = profile.tool_duration is not None and duration is not None
    return replace(
        base,
        tool_name=name,
        subject_visibility=subject,
        outcome="success" if event_type == "tool.completed" else "failure",
        outcome_visibility=profile.tool_outcome,
        duration_ms=duration if timed else None,
        duration_visibility=profile.tool_duration if timed and profile.tool_duration else "unknown",
    )


def _vendor_hook(harness: str, event: str, values: Projected) -> HookFacts | None:
    """A Claude Code or Codex payload, when its own event name is the one this registration is for."""
    hook = _VENDOR_EVENTS[harness].get(event)
    session, directory = _native(values, "session_id"), _directory(values, "cwd")
    if hook is None or values.get("hook_event_name") != hook or session is None or directory is None:
        return None
    tool = _name(values, "tool_name", logical=True)
    if event == "skill.invoked":
        # Claude Code reports a skill as a call to its ``Skill`` tool; the name inside is read only from that call.
        if values.get("tool_name") != _CLAUDE_SKILL_TOOL:
            return None
        skill = _name(values, "tool_input.skill", logical=False)
        return _facts(PROFILES[harness], event, session, directory, name=skill)
    name = _name(values, "agent_type", logical=False) if event.startswith("agent.") else tool
    return _facts(
        PROFILES[harness], event, session, directory, name=name, duration=_duration(values.get("duration_ms"))
    )


def _opencode_hook(event: str, values: Projected) -> HookFacts | None:
    """An OpenCode plugin call, forwarded as its hook name, the plugin's directory, and the hook's own arguments."""
    profile = PROFILES[OPENCODE]
    directory = _directory(values, "directory")
    if _OPENCODE_HOOKS.get(event) != values.get("hook") or directory is None:
        return None
    if event == "session.started":
        info = "input.event.properties.info."
        session = _native(values, info + "id")
        if values.get("input.event.type") != _OPENCODE_SESSION_CREATED or session is None:
            return None
        return _facts(
            profile,
            event,
            session,
            directory,
            parent_session=_native(values, info + "parentID"),
            harness_version=_version(values, info + "version"),
        )
    session = _native(values, "input.sessionID")
    if session is None:
        return None
    if event == "skill.invoked":
        if values.get("input.tool") != _OPENCODE_SKILL_TOOL:
            return None
        return _facts(profile, event, session, directory, name=_name(values, "output.args.name", logical=False))
    return _facts(profile, event, session, directory, name=_name(values, "input.tool", logical=True))


def map_hook(harness: str, event: str, values: Projected) -> HookFacts | None:
    """The lifecycle facts ``values`` state for the event this hook is registered as, or ``None`` when it is not one."""
    if harness == OPENCODE:
        return _opencode_hook(event, values)
    if harness in _VENDOR_EVENTS:
        return _vendor_hook(harness, event, values)
    return None
