"""The commands a user runs against a purely local FERRET, and one place that runs them all from the built artifact."""

from collections.abc import Iterable, Mapping
from pathlib import Path
from typing import Any

from event_documents import encode_document
from ferret_process import Completed, run_artifact

# What the standalone scenario runs, in order; export is a stream, so it takes no --json.
LOCAL_COMMANDS: dict[str, list[str]] = {
    "capture": ["capture", "--json"],
    "events list": ["events", "list", "--json"],
    "events export": ["events", "export", "--format", "jsonl"],
    "usage": ["usage", "--group-by", "harness,tool", "--json"],
    "outcomes": ["outcomes", "--group-by", "harness,tool", "--json"],
    "maintenance": ["maintenance", "--json"],
}
# A name containing one of these words would point at a backend, a network address, or a credential.
BACKEND_WORDS = ("backend", "network", "socket", "http", "url", "token", "server")


def backend_traces(names: Iterable[str]) -> list[str]:
    """The names among ``names`` that mention a backend, a network address, or a credential."""
    return [name for name in names if any(word in name.lower() for word in BACKEND_WORDS)]


def run_local_commands(
    artifact: Path, home: Path, *, event: dict[str, Any], cwd: Path, environment: Mapping[str, str]
) -> dict[str, Completed]:
    """Capture ``event``, then list, export, summarize, and maintain, as one user would; each result by command name."""
    results: dict[str, Completed] = {}
    for name, arguments in LOCAL_COMMANDS.items():
        stdin = encode_document(event) if name == "capture" else b""
        results[name] = run_artifact(
            artifact, arguments, home=home, stdin=stdin, cwd=cwd, extra_environment=environment
        )
    return results
