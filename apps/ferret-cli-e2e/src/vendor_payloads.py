"""Raw vendor payloads for the three harnesses, each carrying content the privacy boundary must discard.

The shapes follow the field lists each vendor documents for its lifecycle hooks. Every payload also carries prompt
text, tool arguments or results, a transcript path, and environment values, so a test can prove that none of them
reaches the store by searching everything a run wrote for the canaries below.
"""

import json
from typing import Any

WORKSPACE = "/users/example/work/repo-a"
SESSION = "native-session-0001"
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


def claude_tool(hook: str, tool: str = "Read", **fields: Any) -> dict[str, Any]:
    return claude_code(
        hook, tool_name=tool, tool_use_id="toolu_0001", tool_input={"file_path": ARGUMENT_CANARY}, **fields
    )


def codex_tool(hook: str, tool: str = "Bash", **fields: Any) -> dict[str, Any]:
    return codex(hook, tool_name=tool, tool_use_id="call_0001", tool_input={"command": ARGUMENT_CANARY}, **fields)


def opencode_call(hook: str, tool: str = "read", **fields: Any) -> dict[str, Any]:
    """The arguments OpenCode hands one plugin hook, as the driver replays them: ``{"hook": ..., "args": [...]}``."""
    call: dict[str, Any] = {"tool": tool, "sessionID": SESSION, "callID": "call_0001"}
    if hook == "tool.execute.before":
        return {"hook": hook, "args": [call, {"args": {"filePath": ARGUMENT_CANARY}}], **fields}
    if hook == "tool.execute.after":
        result = {"title": "read", "output": RESULT_CANARY, "metadata": {"note": PROMPT_CANARY}}
        return {"hook": hook, "args": [{**call, "args": {"filePath": ARGUMENT_CANARY}}, result], **fields}
    raise AssertionError(hook)


def opencode_session_created(**fields: Any) -> dict[str, Any]:
    info = {"id": SESSION, "directory": WORKSPACE, "title": PROMPT_CANARY, "version": "1.18.7"}
    return {"hook": "event", "args": [{"event": {"type": "session.created", "properties": {"info": info}}}], **fields}


# The event each hook is registered under, per harness, for the vendor payloads a test replays.
CLAUDE_HOOKS = {
    "session.started": claude_code("SessionStart", source="startup"),
    "session.ended": claude_code("SessionEnd", reason="other"),
    "agent.started": claude_code("SubagentStart", agent_id="agent-1", agent_type="Explore"),
    "agent.ended": claude_code("SubagentStop", agent_id="agent-1", agent_type="Explore"),
    "tool.started": claude_tool("PreToolUse"),
    "tool.completed": claude_tool("PostToolUse", duration_ms=27, tool_response={"content": RESULT_CANARY}),
    "tool.failed": claude_tool("PostToolUseFailure", duration_ms=12, error=RESULT_CANARY),
}
CODEX_HOOKS = {
    "session.started": codex("SessionStart", source="startup"),
    "session.ended": codex("SessionEnd", reason="other"),
    "agent.started": codex("SubagentStart", agent_id="agent-1", agent_type="worker"),
    "agent.ended": codex("SubagentStop", agent_id="agent-1", agent_type="worker"),
    "tool.started": codex_tool("PreToolUse"),
    "tool.completed": codex_tool("PostToolUse", tool_response={"output": RESULT_CANARY}),
}
