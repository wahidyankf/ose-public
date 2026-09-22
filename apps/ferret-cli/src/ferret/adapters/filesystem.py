"""Where the data home lives: ``$HOME/.ferret`` or the one override, and whether a path is on a local disk."""

import re
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path

from ferret.domain.errors import FerretError
from ferret.domain.storage import (
    DATA_HOME_NAME,
    DATA_HOME_VARIABLE,
    LEGACY_DATA_HOME_NAME,
    XDG_DATA_HOME_DEFAULT,
    XDG_DATA_HOME_VARIABLE,
)

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


def adopt_legacy_data_home(home: Path, data_home: Path) -> Path:
    """Move a pre-specification ``<home>/.ferret`` to where FERRET now keeps its data, and say where that is.

    Only when the old directory exists and the new one does not, so it happens once and never overwrites. The
    move is one rename, which is atomic within a filesystem; when it cannot be done -- a different filesystem,
    a permission the user does not hold -- the old directory is used where it stands rather than the user losing
    sight of their own data over a tidying step.
    """
    legacy = home / LEGACY_DATA_HOME_NAME
    if data_home.exists() or not legacy.is_dir():
        return data_home
    try:
        data_home.parent.mkdir(parents=True, exist_ok=True)
        legacy.rename(data_home)
    except OSError:
        return legacy
    return data_home


def resolve_data_home(environment: Mapping[str, str], home: Path) -> Path:
    """The absolute data-home path for this user, or ``unsafe_storage`` if the override cannot be trusted.

    Precedence, highest first:

    1. ``FERRET_DATA_HOME``, which must be an absolute, normalized, non-URL path.
    2. ``XDG_DATA_HOME``, which must be absolute, joined with ``ferret``.
    3. ``<home>/.local/share/ferret``, the base directory specification's own default.

    An empty value counts as unset at every level, which the specification requires and which matters because a
    shell that exports a variable it never assigned hands it on as the empty string. An ``XDG_DATA_HOME`` that
    is set and relative is treated the same way, for the same reason the specification gives: a relative base
    directory means a different place depending on where the process happened to start.

    Whether the path is local, unlinked, and owned by the user is checked against the real filesystem when the
    store is opened, not here.
    """
    override = environment.get(DATA_HOME_VARIABLE, "")
    if not override:
        base = environment.get(XDG_DATA_HOME_VARIABLE, "")
        if base and Path(base).is_absolute() and "\x00" not in base and ".." not in Path(base).parts:
            return Path(base) / DATA_HOME_NAME
        if not home.is_absolute():
            raise FerretError("ferret.storage.unsafe")
        return home / XDG_DATA_HOME_DEFAULT / DATA_HOME_NAME
    if "\x00" in override or _URL_LIKE.match(override) is not None:
        raise FerretError("ferret.storage.unsafe")
    path = Path(override)
    if not path.is_absolute() or ".." in path.parts or len(path.parts) < 2:
        raise FerretError("ferret.storage.unsafe")
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
