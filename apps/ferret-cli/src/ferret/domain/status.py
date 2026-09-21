"""What ``status`` may say about the interpreter FERRET runs on and about each harness adapter.

Every state here is a reported fact, never an absence: a missing or wrong interpreter, or a harness that has not
reported, is named rather than presented as an empty result or as zero usage.
"""

import re
from typing import Final, Literal

type InterpreterState = Literal["supported", "unsupported_version", "unresolved"]
type PlatformSupport = Literal["supported", "probe_required"]
type ConfigurationState = Literal["configured", "not_configured"]

SUPPORTED_INTERPRETER: Final = (3, 14)
_VERSION: Final = re.compile(r"(\d+)\.(\d+)")

# Every harness with an adapter in this plan, in report order, and whether its platform support is already established
# or still has to be probed on the machine.
ADAPTERS: Final[tuple[tuple[str, PlatformSupport], ...]] = (
    ("claude_code", "supported"),
    ("codex", "supported"),
    ("opencode", "probe_required"),
)


def interpreter_state(path: str, version: str) -> InterpreterState:
    """``supported`` for the Python minor this build runs on, ``unsupported_version`` for another, else ``unresolved``.

    Unresolved means the interpreter's path or version is empty or unreadable, so nothing can be said about support.
    """
    parsed = _VERSION.match(version)
    if not path or parsed is None:
        return "unresolved"
    return "supported" if (int(parsed[1]), int(parsed[2])) == SUPPORTED_INTERPRETER else "unsupported_version"
