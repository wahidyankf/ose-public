"""Put FERRET on an interpreter that can run it, before any module that needs one is imported.

The artifact's shebang is ``#!/usr/bin/env python3`` because that is the only name every POSIX host is sure to
have, and on most hosts today it resolves to something older than the 3.14 the rest of this package is written
in. Such an interpreter cannot even parse the package: it stops at the first 3.14-only construct and prints a
``SyntaxError`` traceback, which under a harness hook is discarded, so every event is lost in silence.

This module and ``ferret/__init__.py`` are therefore the only two files a too-old interpreter ever reads, and
both stay inside a grammar every Python since 3.9 understands. ``from __future__ import annotations`` is what
lets the annotations below use current syntax without the old parser ever evaluating them; there are no ``type``
statements and no unparenthesized ``except`` groups. The unit suite holds that line by parsing both files against
the old grammar, so the guard can never be broken by the very thing it guards against.

Nothing here imports from the rest of ``ferret``. That includes the exit status below, which repeats
``EXIT_ENVIRONMENT_ERROR`` rather than importing it; a unit test asserts the two stay equal.
"""

from __future__ import annotations

import os
import re
import sys
from collections.abc import Callable, Mapping, Sequence

#: The lowest interpreter the rest of the package parses on. Keep equal to ``requires-python`` in pyproject.toml.
REQUIRED = (3, 14)
#: Repeats ``ferret.domain.errors.EXIT_ENVIRONMENT_ERROR``: an unusable host interpreter is an environment fault.
EXIT_ENVIRONMENT_ERROR = 3
#: Names an interpreter to use outright, for a host where no suitable one can be found by name.
OVERRIDE_VARIABLE = "FERRET_PYTHON"
#: Set on the interpreter this module starts, so one that is still too old diagnoses instead of restarting forever.
SENTINEL_VARIABLE = "FERRET_BOOTSTRAPPED"
#: Searched after ``PATH`` so a pinned launcher, a version manager, or a bare hook environment still finds one.
FALLBACK_DIRECTORIES = ("~/.local/bin", "/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin")

_VERSIONED_NAME = re.compile(r"^python([0-9]+)\.([0-9]+)$")


def supports(version: Sequence[int], required: Sequence[int] = REQUIRED) -> bool:
    """Whether an interpreter at ``version`` can run the rest of FERRET.

    Only the major and minor numbers count, so a patch release never changes the answer.
    """
    return tuple(version[:2]) >= tuple(required)


def running_version() -> tuple[int, int]:
    """The major and minor numbers of the interpreter executing this module."""
    return (sys.version_info[0], sys.version_info[1])


def search_directories(environ: Mapping[str, str]) -> list[str]:
    """Where to look for an interpreter: every absolute ``PATH`` entry first, then the usual install locations.

    A relative ``PATH`` entry is skipped rather than resolved, because which directory it names depends on the
    working directory a harness happened to use. Each directory appears once, in first-seen order.
    """
    entries = list(environ.get("PATH", "").split(os.pathsep))
    entries.extend(os.path.expanduser(directory) for directory in FALLBACK_DIRECTORIES)
    seen: set[str] = set()
    ordered: list[str] = []
    for entry in entries:
        if not entry.startswith("/"):
            continue
        directory = os.path.normpath(entry)
        if directory not in seen:
            seen.add(directory)
            ordered.append(directory)
    return ordered


def _executable(path: str) -> bool:
    return os.path.isfile(path) and os.access(path, os.X_OK)


def candidates(environ: Mapping[str, str], required: Sequence[int] = REQUIRED) -> list[str]:
    """Every ``python<major>.<minor>`` in the search path that claims to satisfy ``required``.

    The version comes from the file's name, not from running it: asking each one costs a process, and this runs
    on the hook path. A name that lies is caught by the sentinel, which turns a second too-old interpreter into
    a diagnostic instead of another restart.

    The result is ordered by version, highest first, so a host that later gains 3.15 uses it without a new
    release; ties keep search-path order, so the first directory on ``PATH`` still wins.
    """
    found: list[tuple[tuple[int, int], int, str]] = []
    for position, directory in enumerate(search_directories(environ)):
        try:
            names = sorted(os.listdir(directory))
        except OSError:
            continue
        for name in names:
            matched = _VERSIONED_NAME.match(name)
            if matched is None:
                continue
            version = (int(matched.group(1)), int(matched.group(2)))
            path = os.path.join(directory, name)
            if supports(version, required) and _executable(path):
                found.append((version, position, path))
    found.sort(key=lambda row: (-row[0][0], -row[0][1], row[1]))
    return [row[2] for row in found]


def choose(environ: Mapping[str, str], required: Sequence[int] = REQUIRED) -> str | None:
    """The interpreter to hand control to, or ``None`` when no suitable one can be found.

    ``FERRET_PYTHON`` wins whenever it names an executable, so a host with an unusual layout can be fixed
    without waiting for a release; it is trusted as given and not version-checked by name.
    """
    override = environ.get(OVERRIDE_VARIABLE, "")
    if override and _executable(override):
        return override
    available = candidates(environ, required)
    return available[0] if available else None


def diagnosis(version: Sequence[int], required: Sequence[int] = REQUIRED) -> str:
    """The one line a host without a suitable interpreter gets: what was found, what is needed, what to do.

    It names versions and an environment variable only. No path, argument, or payload reaches it, which is the
    same value-free rule the closed failure contract applies to every other FERRET diagnostic.
    """
    return (
        f"ferret: requires Python {required[0]}.{required[1]} or newer, "
        f"running {version[0]}.{version[1]}; set {OVERRIDE_VARIABLE} to a suitable interpreter"
    )


def relaunch(
    archive: str,
    argv: Sequence[str],
    environ: Mapping[str, str],
    required: Sequence[int] = REQUIRED,
    execute: Callable[[str, list[str], Mapping[str, str]], None] | None = None,
    report: Callable[[str], None] | None = None,
) -> int | None:
    """Restart this archive on a suitable interpreter, or report why it cannot, and say whether to carry on.

    Returns ``None`` when the running interpreter already satisfies ``required`` and the caller should simply
    import FERRET. Otherwise it never returns normally in production: ``execute`` replaces the process. When no
    interpreter is available, or one was already tried, it returns the exit status the caller must exit with.

    The sentinel is set on the child rather than checked on the parent alone, so a name that claims a version it
    does not have costs exactly one extra process and then produces the diagnostic.
    """
    version = running_version()
    if supports(version, required):
        return None
    if environ.get(SENTINEL_VARIABLE) != "1":
        interpreter = choose(environ, required)
        if interpreter is not None:
            child = dict(environ)
            child[SENTINEL_VARIABLE] = "1"
            (execute or os.execve)(interpreter, [interpreter, archive, *argv], child)
            return None
    (report or _to_stderr)(diagnosis(version, required))
    return EXIT_ENVIRONMENT_ERROR


def _to_stderr(line: str) -> None:
    sys.stderr.write(line + "\n")
