"""Workspace roots on a POSIX filesystem: the nearest ancestor that holds a ``.git`` entry."""

import os
from pathlib import PurePosixPath

GIT_ENTRY = ".git"


class PosixWorkspaceRoots:
    """Resolve a reported directory to the repository root it belongs to, without requiring that it exists."""

    def root_of(self, directory: str) -> str:
        resolved = PurePosixPath(os.path.realpath(directory))
        for candidate in (resolved, *resolved.parents):
            # A worktree or submodule keeps ``.git`` as a file, so any entry counts, and a dangling link is still one.
            if os.path.lexists(candidate / GIT_ENTRY):
                return str(candidate)
        return str(resolved)
