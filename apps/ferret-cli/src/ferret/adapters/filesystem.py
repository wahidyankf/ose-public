"""Where the data home lives: ``$HOME/.ferret`` or the one override, and whether a path is on a local disk."""

import re
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path

from ferret.domain.errors import FerretError
from ferret.domain.storage import DATA_HOME_VARIABLE, DEFAULT_DATA_HOME_NAME

_URL_LIKE = re.compile(r"[A-Za-z][A-Za-z0-9+.-]*:")
_LINUX_MIN_FIELDS = 10
_LINUX_SEPARATOR_FROM = 6

REMOTE_TYPES = frozenset(
    {
        "nfs",
        "nfs3",
        "nfs4",
        "smbfs",
        "smb",
        "smb3",
        "cifs",
        "afpfs",
        "afs",
        "webdav",
        "davfs",
        "davfs2",
        "9p",
        "ceph",
        "glusterfs",
        "lustre",
        "ncpfs",
        "fuse.sshfs",
        "fuse.rclone",
        "fuse.s3fs",
        "fuse.gcsfuse",
    }
)


@dataclass(frozen=True, slots=True)
class Mount:
    """One mounted filesystem: where it is attached and its type."""

    point: Path
    fstype: str


def resolve_data_home(environment: Mapping[str, str], home: Path) -> Path:
    """The absolute data-home path for this user, or ``unsafe_storage`` if the override cannot be trusted.

    The default is ``<home>/.ferret``. ``FERRET_DATA_HOME`` relocates it and must be an absolute, normalized,
    non-URL path; an empty value counts as unset. Whether the path is local, unlinked, and owned by the user is
    checked against the real filesystem when the store is opened, not here.
    """
    override = environment.get(DATA_HOME_VARIABLE, "")
    if not override:
        if not home.is_absolute():
            raise FerretError("unsafe_storage")
        return home / DEFAULT_DATA_HOME_NAME
    if "\x00" in override or _URL_LIKE.match(override) is not None:
        raise FerretError("unsafe_storage")
    path = Path(override)
    if not path.is_absolute() or ".." in path.parts or len(path.parts) < 2:
        raise FerretError("unsafe_storage")
    return path


def parse_linux_mounts(text: str) -> list[Mount]:
    """Read ``/proc/self/mountinfo``: the mount point is field 5 and the type follows the ``-`` separator."""
    mounts: list[Mount] = []
    for line in text.splitlines():
        fields = line.split()
        if len(fields) < _LINUX_MIN_FIELDS or "-" not in fields[_LINUX_SEPARATOR_FROM:]:
            continue
        separator = fields.index("-", _LINUX_SEPARATOR_FROM)
        if separator + 1 < len(fields):
            mounts.append(Mount(Path(fields[4].replace("\\040", " ")), fields[separator + 1]))
    return mounts


def parse_macos_mounts(text: str) -> list[Mount]:
    """Read ``mount`` output: ``<device> on <point> (<type>, <options>...)``."""
    mounts: list[Mount] = []
    for line in text.splitlines():
        parts = line.split(" on ", 1)
        if len(parts) != 2 or " (" not in parts[1]:
            continue
        point, _, options = parts[1].rpartition(" (")
        fstype = options.rstrip(")").split(",")[0].strip()
        if point and fstype:
            mounts.append(Mount(Path(point), fstype))
    return mounts


def is_local_filesystem(path: Path, mounts: Sequence[Mount]) -> bool:
    """True only when the deepest mount containing ``path`` is known and is not a network filesystem."""
    containing = [mount for mount in mounts if path == mount.point or mount.point in path.parents]
    if not containing:
        return False
    deepest = max(containing, key=lambda mount: len(mount.point.parts))
    return deepest.fstype.lower() not in REMOTE_TYPES
