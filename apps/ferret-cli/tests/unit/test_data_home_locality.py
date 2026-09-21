"""Deciding from a mount table whether a data-home override sits on a local disk."""

from pathlib import Path

import pytest

from ferret.adapters.filesystem import Mount, is_local_filesystem, parse_linux_mounts, parse_macos_mounts

# Home directories appear as the semantic placeholder `<user>` rather than a name: a literal home path is a shape
# the repository's public-safety gate prohibits, and the parsers under test read these rows as opaque strings.
LINUX_TABLE = """\
22 1 259:2 / / rw,relatime shared:1 - ext4 /dev/nvme0n1p2 rw,errors=remount-ro
30 22 0:27 / /mnt/nas rw,relatime shared:9 - nfs4 nas:/export rw,vers=4.2
31 22 0:28 / /mnt/my\\040share rw,relatime shared:10 - cifs //host/share rw
32 22 0:29 / /home/<user>/sshfs rw,nosuid,nodev - fuse.sshfs <user>@host:/ rw
malformed line
33 22 0:30 / /mnt/no-separator rw,relatime shared:11
"""
MACOS_TABLE = """\
/dev/disk3s1s1 on / (apfs, sealed, local, read-only, journaled)
/dev/disk3s5 on /System/Volumes/Data (apfs, local, journaled, nobrowse)
//<user>@<private-host>/share on /Volumes/share (smbfs, nodev, nosuid, mounted by <user>)
nas:/export on /Volumes/export (nfs, nodev, nosuid)
map auto_home on /System/Volumes/Data/home (autofs, automounted, nobrowse)
not a mount line
"""


def test_the_linux_mount_table_yields_the_point_and_type_of_every_well_formed_line() -> None:
    assert parse_linux_mounts(LINUX_TABLE) == [
        Mount(Path("/"), "ext4"),
        Mount(Path("/mnt/nas"), "nfs4"),
        Mount(Path("/mnt/my share"), "cifs"),
        Mount(Path("/home/<user>/sshfs"), "fuse.sshfs"),
    ]


def test_the_macos_mount_table_yields_the_point_and_type_of_every_well_formed_line() -> None:
    assert parse_macos_mounts(MACOS_TABLE) == [
        Mount(Path("/"), "apfs"),
        Mount(Path("/System/Volumes/Data"), "apfs"),
        Mount(Path("/Volumes/share"), "smbfs"),
        Mount(Path("/Volumes/export"), "nfs"),
        Mount(Path("/System/Volumes/Data/home"), "autofs"),
    ]


@pytest.mark.parametrize(
    ("path", "expected"),
    [
        ("/home/<user>/.ferret", True),
        ("/mnt", True),
        ("/mnt/nas", False),
        ("/mnt/nas/ferret", False),
        ("/mnt/my share/ferret", False),
        ("/home/<user>/sshfs/ferret", False),
        ("/mnt/nas-other/ferret", True),
    ],
)
def test_a_path_is_local_unless_its_deepest_mount_is_a_network_filesystem(path: str, expected: bool) -> None:
    assert is_local_filesystem(Path(path), parse_linux_mounts(LINUX_TABLE)) is expected


def test_a_path_on_a_macos_network_share_is_not_local() -> None:
    mounts = parse_macos_mounts(MACOS_TABLE)

    assert is_local_filesystem(Path("/Users/<user>/.ferret"), mounts) is True
    assert is_local_filesystem(Path("/Volumes/share/ferret"), mounts) is False
    assert is_local_filesystem(Path("/Volumes/export"), mounts) is False


def test_a_path_is_not_established_as_local_when_no_mount_contains_it() -> None:
    assert is_local_filesystem(Path("/anywhere"), []) is False
    assert is_local_filesystem(Path("/anywhere"), [Mount(Path("/elsewhere"), "ext4")]) is False
