"""A small but real zipapp, so an install has an artifact to copy without depending on the project's build."""

import hashlib
import zipfile
from pathlib import Path

SHEBANG = b"#!/usr/bin/env python3\n"


def write_test_artifact(path: Path, *, marker: str = "ferret test artifact") -> str:
    """Write a shebang and a zip archive whose entry point prints ``marker`` to ``path``; return its SHA-256."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("wb") as artifact:
        artifact.write(SHEBANG)
        with zipfile.ZipFile(artifact, "w") as archive:
            archive.writestr("__main__.py", f"print({marker!r})\n")
    path.chmod(0o755)
    return hashlib.sha256(path.read_bytes()).hexdigest()
