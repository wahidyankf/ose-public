"""What a machine-wide PATH is made of, read so a test can prove an install left every source of it alone."""

from pathlib import Path

#: The files, and the drop-in directories, that the common POSIX shells and login managers build a machine-wide
#: PATH from. A user install may touch none of them, whether or not this process could write to them.
MACHINE_PATH_SOURCES = (
    "/etc/paths",
    "/etc/paths.d",
    "/etc/environment",
    "/etc/profile",
    "/etc/profile.d",
    "/etc/bashrc",
    "/etc/bash.bashrc",
    "/etc/zshenv",
    "/etc/zprofile",
    "/etc/zshrc",
    "/etc/zsh/zshenv",
    "/etc/zsh/zprofile",
)


def machine_path_snapshot() -> dict[str, bytes | None]:
    """The bytes of every machine-wide PATH source, directory entries included; ``None`` marks one that is absent."""
    snapshot: dict[str, bytes | None] = {}
    for name in MACHINE_PATH_SOURCES:
        source = Path(name)
        if source.is_dir():
            for entry in sorted(source.iterdir()):
                snapshot[str(entry)] = entry.read_bytes() if entry.is_file() else None
        else:
            snapshot[name] = source.read_bytes() if source.is_file() else None
    return snapshot
