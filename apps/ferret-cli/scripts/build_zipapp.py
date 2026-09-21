"""Build the reproducible FERRET zipapp.

The archive holds the ``ferret`` package sources, their bytecode, and a generated ``__main__.py``. Python never
writes bytecode back into an archive, so without it every run would compile every module again; a hook that runs at
every tool call cannot afford that. The bytecode is unchecked-hash, named for its place in the archive rather than
for where it was built, and made from the very sources beside it. Every entry has a fixed timestamp, permission, and
order, and nothing is compressed, so the same sources always produce the same bytes whatever the checkout time, user,
platform, or hash seed.
"""

import argparse
import py_compile
import stat
import sys
import tempfile
import zipfile
from collections.abc import Sequence
from pathlib import Path

SHEBANG = b"#!/usr/bin/env python3\n"
ENTRY_POINT = "import sys\n\nfrom ferret.cli import main\n\nsys.exit(main())\n"
FIXED_TIMESTAMP = (1980, 1, 1, 0, 0, 0)
FILE_MODE = 0o644
ARTIFACT_MODE = 0o755


def _entry(name: str, data: bytes) -> tuple[zipfile.ZipInfo, bytes]:
    info = zipfile.ZipInfo(name, date_time=FIXED_TIMESTAMP)
    info.compress_type = zipfile.ZIP_STORED
    info.create_system = 3
    info.external_attr = (stat.S_IFREG | FILE_MODE) << 16
    return info, data


def _bytecode(path: Path, name: str, scratch: Path) -> bytes:
    """The unchecked-hash bytecode of one source file, whose code objects name ``name`` and no host path."""
    compiled = scratch / "module.pyc"
    py_compile.compile(
        str(path),
        cfile=str(compiled),
        dfile=name,
        doraise=True,
        optimize=0,
        invalidation_mode=py_compile.PycInvalidationMode.UNCHECKED_HASH,
    )
    return compiled.read_bytes()


def build(source: Path, target: Path) -> None:
    """Write the zipapp for the package rooted at ``source`` to ``target``, replacing any earlier file."""
    packages = sorted(
        (path for path in source.rglob("*.py") if "__pycache__" not in path.parts),
        key=lambda path: path.relative_to(source).as_posix(),
    )
    entries = [_entry("__main__.py", ENTRY_POINT.encode())]
    with tempfile.TemporaryDirectory() as scratch:
        for path in packages:
            name = path.relative_to(source).as_posix()
            entries.append(_entry(name, path.read_bytes()))
            entries.append(_entry(name + "c", _bytecode(path, name, Path(scratch))))
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("wb") as artifact:
        artifact.write(SHEBANG)
        with zipfile.ZipFile(artifact, "w") as archive:
            for info, data in entries:
                archive.writestr(info, data)
    target.chmod(ARTIFACT_MODE)


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Build the reproducible FERRET zipapp.")
    parser.add_argument("--source", type=Path, default=Path("src"), help="package root; defaults to src")
    parser.add_argument(
        "--output", type=Path, default=Path("dist/ferret.pyz"), help="artifact path; defaults to dist/ferret.pyz"
    )
    arguments = parser.parse_args(argv)
    build(arguments.source, arguments.output)
    return 0


if __name__ == "__main__":
    sys.exit(main())
