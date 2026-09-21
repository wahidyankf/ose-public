"""Run a process with every network socket denied, and read back what tried to open one."""

from pathlib import Path

# Must match the variable the denial module reads: that module runs inside the process under test and imports nothing.
LOG_VARIABLE = "FERRET_DENIED_SOCKETS_LOG"
DENIAL_DIRECTORY = Path(__file__).resolve().parent / "socket_denial"


def denied_socket_environment(log: Path) -> dict[str, str]:
    """The environment that makes a Python process refuse every socket event and append each one to ``log``."""
    return {"PYTHONPATH": str(DENIAL_DIRECTORY), LOG_VARIABLE: str(log)}


def attempted(log: Path) -> list[str]:
    """Every network event a denied process tried, in order; empty when it tried none and the log was never created."""
    return log.read_text(encoding="utf-8").splitlines() if log.exists() else []
