"""Raw vendor payloads for the three harnesses, each carrying content the privacy boundary must discard.

The shapes follow the field lists each vendor documents for its lifecycle hooks. Every payload also carries prompt
text, tool arguments or results, a transcript path, and environment values, so a test can prove that none of them
survives the mapper by searching everything a run produced for the canaries below.
"""

import json
from typing import Any

WORKSPACE = "/users/example/work/repo-a"
SESSION = "native-session-0001"
SKILL = "ci-standards"
PROMPT_CANARY = "canary-prompt-text-8f3a"
ARGUMENT_CANARY = "canary-tool-argument-2b9c"
RESULT_CANARY = "canary-tool-result-71de"
ENVIRONMENT_CANARY = "canary-environment-value-c405"
TRANSCRIPT_CANARY = "/users/example/.transcripts/canary-transcript-5d18.jsonl"
CANARIES = (PROMPT_CANARY, ARGUMENT_CANARY, RESULT_CANARY, ENVIRONMENT_CANARY, TRANSCRIPT_CANARY)

CLAUDE_CODE = "claude_code"
CODEX = "codex"
OPENCODE = "opencode"


def encode(document: dict[str, Any]) -> bytes:
    """One payload as the compact UTF-8 JSON a harness writes to standard input."""
    return json.dumps(document, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def claude_code(hook: str, **fields: Any) -> dict[str, Any]:
    """A Claude Code command-hook payload for ``hook``, carrying content around the metadata it may keep."""
    return {
        "session_id": SESSION,
        "transcript_path": TRANSCRIPT_CANARY,
        "cwd": WORKSPACE,
        "permission_mode": "default",
        "hook_event_name": hook,
        "prompt": PROMPT_CANARY,
        "env": {"API_TOKEN": ENVIRONMENT_CANARY},
        **fields,
    }


def codex(hook: str, **fields: Any) -> dict[str, Any]:
    """A Codex command-hook payload for ``hook``, carrying content around the metadata it may keep."""
    return {
        "session_id": SESSION,
        "transcript_path": TRANSCRIPT_CANARY,
        "cwd": WORKSPACE,
        "hook_event_name": hook,
        "model": "gpt-example",
        "turn_id": "turn-0001",
        "prompt": PROMPT_CANARY,
        "env": {"API_TOKEN": ENVIRONMENT_CANARY},
        **fields,
    }


def opencode(hook: str, **fields: Any) -> dict[str, Any]:
    """The raw JSON the OpenCode plugin forwards for one hook, before any allowlist has been applied."""
    return {"hook": hook, "directory": WORKSPACE, "env": {"API_TOKEN": ENVIRONMENT_CANARY}, **fields}


def claude_tool(hook: str, tool: str = "Read", **fields: Any) -> dict[str, Any]:
    return claude_code(
        hook,
        tool_name=tool,
        tool_use_id="toolu_0001",
        tool_input={"file_path": ARGUMENT_CANARY},
        **fields,
    )


def codex_tool(hook: str, tool: str = "Bash", **fields: Any) -> dict[str, Any]:
    return codex(
        hook,
        tool_name=tool,
        tool_use_id="call_0001",
        tool_input={"command": ARGUMENT_CANARY},
        **fields,
    )


def opencode_tool(hook: str, tool: str = "read", **fields: Any) -> dict[str, Any]:
    call = {"tool": tool, "sessionID": SESSION, "callID": "call_0001"}
    if hook == "tool.execute.before":
        return opencode(hook, input=call, output={"args": {"filePath": ARGUMENT_CANARY}}, **fields)
    return opencode(hook, input={**call, "args": {"filePath": ARGUMENT_CANARY}}, **fields)


def claude_skill(**fields: Any) -> dict[str, Any]:
    """A call to Claude Code's ``Skill`` tool, which names the skill in ``tool_input.skill`` (seen in a live run)."""
    document = claude_tool("PreToolUse", tool="Skill", **fields)
    document["tool_input"] = {"skill": SKILL, "args": ARGUMENT_CANARY}
    return document


def opencode_skill(**fields: Any) -> dict[str, Any]:
    """A call to OpenCode's ``skill`` tool, whose arguments name the skill to load."""
    document = opencode_tool("tool.execute.before", tool="skill", **fields)
    document["output"] = {"args": {"name": SKILL, "note": ARGUMENT_CANARY}}
    return document


def opencode_session_created(**fields: Any) -> dict[str, Any]:
    info = {"id": SESSION, "directory": WORKSPACE, "title": PROMPT_CANARY, "version": "1.18.7"}
    return opencode("event", input={"event": {"type": "session.created", "properties": {"info": info}}}, **fields)


# Every registration the plan ships: (harness, registered event, the raw payload its harness sends for it).
REGISTRATIONS: tuple[tuple[str, str, dict[str, Any]], ...] = (
    (CLAUDE_CODE, "session.started", claude_code("SessionStart", source="startup", model="claude-example")),
    (CLAUDE_CODE, "session.ended", claude_code("SessionEnd", reason="other")),
    (CLAUDE_CODE, "agent.started", claude_code("SubagentStart", agent_id="agent-1", agent_type="Explore")),
    (
        CLAUDE_CODE,
        "agent.ended",
        claude_code("SubagentStop", agent_id="agent-1", agent_type="Explore", last_assistant_message=RESULT_CANARY),
    ),
    (CLAUDE_CODE, "tool.started", claude_tool("PreToolUse")),
    (CLAUDE_CODE, "skill.invoked", claude_skill()),
    (
        CLAUDE_CODE,
        "tool.completed",
        claude_tool("PostToolUse", duration_ms=27, tool_response={"content": RESULT_CANARY}),
    ),
    (CLAUDE_CODE, "tool.failed", claude_tool("PostToolUseFailure", duration_ms=12, error=RESULT_CANARY)),
    (CODEX, "session.started", codex("SessionStart", source="startup")),
    (CODEX, "session.ended", codex("SessionEnd", reason="other")),
    (CODEX, "agent.started", codex("SubagentStart", agent_id="agent-1", agent_type="worker")),
    (
        CODEX,
        "agent.ended",
        codex("SubagentStop", agent_id="agent-1", agent_type="worker", last_assistant_message=RESULT_CANARY),
    ),
    (CODEX, "tool.started", codex_tool("PreToolUse")),
    (CODEX, "tool.completed", codex_tool("PostToolUse", tool_response={"output": RESULT_CANARY})),
    (OPENCODE, "session.started", opencode_session_created()),
    (OPENCODE, "tool.started", opencode_tool("tool.execute.before")),
    (OPENCODE, "skill.invoked", opencode_skill()),
    (OPENCODE, "tool.completed", opencode_tool("tool.execute.after")),
)
