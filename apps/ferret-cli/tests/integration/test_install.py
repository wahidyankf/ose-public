"""The install adapter on a real filesystem: private modes whatever the umask, atomic steps, and crash recovery."""

import errno
import hashlib
import json
import os
import re
import stat
import zipfile
from collections.abc import Callable
from dataclasses import dataclass, replace
from pathlib import Path
from typing import Any, cast

import pytest

import ferret
from ferret import __version__
from ferret.adapters.posix_install import PosixUserInstall, running_artifact
from ferret.adapters.system import system_runtime
from ferret.application.install import install_user, uninstall_user
from ferret.application.ports import InstalledFacts, Runtime, StagedInstall, StagePlan, UserInstall
from ferret.domain.errors import FerretError
from ferret.domain.install import (
    ARTIFACT_FILE,
    ARTIFACT_MODE,
    DIRECTORY_MODE,
    LAUNCHER_FILE,
    MANIFEST_FILE,
    MANIFEST_MODE,
    InstallPaths,
    Manifest,
    parse_manifest,
    stage_name,
)
from support.artifacts import write_test_artifact
from support.fakes import SimulatedCrash
from support.machine import make_machine

OLDER = "0.0.9"
STAGE_MASK = re.compile(r"\.stage-[0-9a-f]{32}")
NONCE = "0123456789abcdef0123456789abcdef"
Entry = tuple[str, int, bytes | str | None]
Tree = dict[str, Entry]
DIRECTORY: Entry = ("directory", DIRECTORY_MODE, None)


@dataclass(frozen=True, slots=True)
class Area:
    """A private HOME with two real artifacts to install: the current build and an older one."""

    home: Path
    current: Path
    older: Path

    @property
    def paths(self) -> InstallPaths:
        return InstallPaths(self.home)

    def install(self, artifact: Path | None = None) -> PosixUserInstall:
        return PosixUserInstall(self.home, path_variable="", artifact=artifact)


@pytest.fixture
def area(tmp_path: Path) -> Area:
    home = tmp_path / "home"
    home.mkdir(mode=0o700)
    current, older = tmp_path / "dist" / "current.pyz", tmp_path / "dist" / "older.pyz"
    write_test_artifact(current, marker="current")
    write_test_artifact(older, marker="older")
    return Area(home=home, current=current, older=older)


def runtime_for(area: Area, artifact: Path, *, path: str = "") -> Runtime:
    return system_runtime({"HOME": str(area.home), "PATH": path}, artifact=artifact)


def failure(action: Callable[[], object]) -> str:
    with pytest.raises(FerretError) as caught:
        action()
    return caught.value.code


def tree(root: Path) -> Tree:
    """Every object under ``root`` as plain values; a symlink's own mode is not portable, so it reads as zero."""
    found: Tree = {}
    for directory, names, files in os.walk(root):
        for name in [*names, *files]:
            path = Path(directory) / name
            info = os.lstat(path)
            key = str(path.relative_to(root))
            if stat.S_ISLNK(info.st_mode):
                found[key] = ("symlink", 0, os.readlink(path))
            elif stat.S_ISDIR(info.st_mode):
                found[key] = ("directory", stat.S_IMODE(info.st_mode), None)
            else:
                found[key] = ("file", stat.S_IMODE(info.st_mode), path.read_bytes())
    return found


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def finished_manifest(area: Area, version: str, source: Path, installed_at: str) -> bytes:
    paths = area.paths
    return Manifest(
        version=version,
        artifact_path=paths.artifact(version),
        artifact_sha256=digest(source),
        launcher_path=paths.launcher,
        installed_at=installed_at,
    ).to_bytes()


def completed(area: Area, version: str, source: Path, installed_at: str) -> Tree:
    """What a finished install leaves under HOME, written out from the contract."""
    return {
        ".local": DIRECTORY,
        ".local/share": DIRECTORY,
        ".local/share/ferret": DIRECTORY,
        f".local/share/ferret/{version}": DIRECTORY,
        ".local/bin": DIRECTORY,
        f".local/share/ferret/{version}/ferret.pyz": ("file", ARTIFACT_MODE, source.read_bytes()),
        ".local/bin/ferret": ("symlink", 0, str(area.paths.artifact(version))),
        ".local/share/ferret/install.json": (
            "file",
            MANIFEST_MODE,
            finished_manifest(area, version, source, installed_at),
        ),
    }


def recorded_time(area: Area) -> str:
    recorded: str = json.loads(area.paths.manifest.read_bytes())["installedAt"]
    return recorded


def install_older(area: Area, monkeypatch: pytest.MonkeyPatch) -> None:
    """Install the older artifact as ``OLDER`` would have, so a real newer build has something to replace."""
    with monkeypatch.context() as patch:
        patch.setattr("ferret.application.install.__version__", OLDER)
        assert install_user(runtime_for(area, area.older)).result == "installed"


class DiesBefore:
    """The real install area, except that it raises ``SimulatedCrash`` instead of running one named step."""

    def __init__(self, real: UserInstall, step: str) -> None:
        self._real = real
        self._step = step

    def __getattr__(self, name: str) -> Any:
        if name != self._step:
            return getattr(self._real, name)

        def die(*arguments: object) -> None:
            raise SimulatedCrash

        return die


def dying_before(runtime: Runtime, step: str) -> Runtime:
    return replace(runtime, installer=cast(UserInstall, DiesBefore(runtime.installer, step)))


def test_a_first_install_creates_exactly_the_private_objects_whatever_the_umask(area: Area) -> None:
    previous = os.umask(0)
    try:
        outcome = install_user(runtime_for(area, area.current, path=f"/usr/bin:{area.paths.bin}"))
    finally:
        os.umask(previous)

    assert (outcome.result, outcome.version, outcome.path_action, outcome.replaced_owned_version) == (
        "installed",
        __version__,
        "none",
        None,
    )
    assert tree(area.home) == completed(area, __version__, area.current, recorded_time(area))


def test_directories_that_already_exist_keep_their_mode_and_their_files(area: Area) -> None:
    other = area.paths.bin / "other-tool"
    other.parent.mkdir(parents=True)
    other.write_bytes(b"#!/bin/sh\n")
    for directory in (area.home / ".local", area.paths.bin):
        directory.chmod(0o755)

    install_user(runtime_for(area, area.current))

    assert {stat.S_IMODE(os.lstat(path).st_mode) for path in (area.home / ".local", area.paths.bin)} == {0o755}
    assert other.read_bytes() == b"#!/bin/sh\n"
    assert stat.S_IMODE(os.lstat(area.paths.share).st_mode) == DIRECTORY_MODE

    uninstall_user(runtime_for(area, area.current), purge_data=False, confirmed=False)

    assert sorted(path.name for path in area.paths.bin.iterdir()) == ["other-tool"]


def changed(before: Tree, after: Tree) -> Tree:
    """Every object that is new or different in ``after`` with staged nonces masked, after checking none was removed."""
    assert set(before) <= set(after), f"removed: {sorted(set(before) - set(after))}"
    return {STAGE_MASK.sub(".stage-*", key): value for key, value in after.items() if before.get(key) != value}


@pytest.mark.parametrize("step", ["replace_artifact", "replace_launcher", "replace_manifest", "remove"])
def test_a_crash_before_each_step_leaves_a_readable_state_and_the_next_install_repairs_it(
    area: Area, monkeypatch: pytest.MonkeyPatch, step: str
) -> None:
    install_older(area, monkeypatch)
    old = tree(area.home)
    version_directory = f".local/share/ferret/{__version__}"
    artifact: Entry = ("file", ARTIFACT_MODE, area.current.read_bytes())
    launcher: Entry = ("symlink", 0, str(area.paths.artifact(__version__)))

    with pytest.raises(SimulatedCrash):
        install_user(dying_before(runtime_for(area, area.current), step))

    delta = changed(old, tree(area.home))
    # The manifest is the last file to be replaced, so it is still a staged file until the crash is past that step.
    manifest = delta.pop(
        ".local/share/ferret/install.json" if step == "remove" else ".local/share/ferret/.install.json.stage-*"
    )
    assert (manifest[0], manifest[1]) == ("file", MANIFEST_MODE)
    written = parse_manifest(cast(bytes, manifest[2]), area.paths)
    assert written == Manifest(
        version=__version__,
        artifact_path=area.paths.artifact(__version__),
        artifact_sha256=digest(area.current),
        launcher_path=area.paths.launcher,
        installed_at=written.installed_at,
    )
    assert cast(bytes, manifest[2]) == written.to_bytes()
    expected: dict[str, Tree] = {
        "replace_artifact": {
            version_directory: DIRECTORY,
            f"{version_directory}/.ferret.pyz.stage-*": artifact,
            ".local/bin/.ferret.stage-*": launcher,
        },
        "replace_launcher": {
            version_directory: DIRECTORY,
            f"{version_directory}/ferret.pyz": artifact,
            ".local/bin/.ferret.stage-*": launcher,
        },
        "replace_manifest": {
            version_directory: DIRECTORY,
            f"{version_directory}/ferret.pyz": artifact,
            ".local/bin/ferret": launcher,
        },
        "remove": {
            version_directory: DIRECTORY,
            f"{version_directory}/ferret.pyz": artifact,
            ".local/bin/ferret": launcher,
        },
    }
    assert delta == expected[step]

    crashed = tree(area.home)
    repaired = install_user(runtime_for(area, area.current))

    if step == "remove":
        # The manifest was already replaced, so the new install is authoritative and only the old artifact is left over.
        assert (repaired.result, repaired.replaced_owned_version) == ("already_installed", None)
        assert tree(area.home) == crashed
        return
    assert (repaired.result, repaired.replaced_owned_version) == ("installed", OLDER)
    assert tree(area.home) == completed(area, __version__, area.current, recorded_time(area))


def test_an_older_artifact_left_by_a_crash_after_the_manifest_is_unowned_and_survives_removal(
    area: Area, monkeypatch: pytest.MonkeyPatch
) -> None:
    install_older(area, monkeypatch)
    with pytest.raises(SimulatedCrash):
        install_user(dying_before(runtime_for(area, area.current), "remove"))

    outcome = uninstall_user(runtime_for(area, area.current), purge_data=False, confirmed=False)

    assert outcome.removed_paths == (area.paths.launcher, area.paths.artifact(__version__), area.paths.manifest)
    assert area.paths.artifact(OLDER).read_bytes() == area.older.read_bytes()
    assert not area.paths.launcher.is_symlink()


def test_recovery_deletes_only_staged_leftovers_that_are_files_or_links(area: Area) -> None:
    paths = area.paths
    version_directory = paths.version_directory(__version__)
    version_directory.mkdir(parents=True)
    paths.bin.mkdir(parents=True)
    leftovers = [
        version_directory / stage_name(ARTIFACT_FILE, NONCE),
        paths.share / stage_name(MANIFEST_FILE, NONCE),
    ]
    for leftover in leftovers:
        leftover.write_bytes(b"staged")
    leftovers.append(paths.bin / stage_name(LAUNCHER_FILE, NONCE))
    os.symlink("/nowhere/at/all", leftovers[-1])
    keepers = [
        version_directory / stage_name(ARTIFACT_FILE, "short"),
        version_directory / f"{stage_name(ARTIFACT_FILE, NONCE)}.bak",
        paths.bin / stage_name(ARTIFACT_FILE, NONCE),
        paths.share / "notes.txt",
        paths.share / "latest" / stage_name(ARTIFACT_FILE, NONCE),
    ]
    (paths.share / "latest").mkdir()
    for keeper in keepers:
        keeper.write_bytes(b"mine")
    a_directory = paths.bin / stage_name(LAUNCHER_FILE, "f" * 32)
    a_directory.mkdir()

    area.install().recover()

    assert [os.path.lexists(path) for path in leftovers] == [False, False, False]
    assert all(path.read_bytes() == b"mine" for path in keepers)
    assert a_directory.is_dir()


def test_recovery_never_scans_through_a_symlinked_share_directory(area: Area, tmp_path: Path) -> None:
    elsewhere = tmp_path / "elsewhere"
    elsewhere.mkdir()
    leftover = elsewhere / stage_name(MANIFEST_FILE, NONCE)
    leftover.write_bytes(b"not ours")
    area.paths.share.parent.mkdir(parents=True)
    os.symlink(elsewhere, area.paths.share)

    area.install().recover()

    assert leftover.read_bytes() == b"not ours"


def test_facts_describe_each_kind_of_object_without_following_links(area: Area) -> None:
    install = area.install()
    file, link, directory, fifo = (area.home / name for name in ("file", "link", "directory", "fifo"))
    file.write_bytes(b"content")
    file.chmod(0o640)
    os.symlink("/nowhere/at/all", link)
    directory.mkdir()
    directory.chmod(0o750)
    os.mkfifo(fifo)

    assert install.facts(file) == InstalledFacts(kind="file", mode=0o640, sha256=hashlib.sha256(b"content").hexdigest())
    linked = install.facts(link)
    assert (linked.kind, linked.target, linked.owned_by_current_user) == ("symlink", "/nowhere/at/all", True)
    assert install.facts(directory) == InstalledFacts(kind="directory", mode=0o750)
    assert install.facts(fifo).kind == "other"
    assert install.facts(area.home / "absent") == InstalledFacts(kind="missing")
    assert install.facts(file / "below-a-file") == InstalledFacts(kind="missing")


def test_a_file_too_large_to_be_an_artifact_has_an_empty_digest(area: Area, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("ferret.adapters.posix_install.MAX_ARTIFACT_BYTES", 3)
    file = area.home / "big"
    file.write_bytes(b"four")

    assert area.install().facts(file).sha256 == ""


def test_the_manifest_is_read_back_without_following_a_link(area: Area) -> None:
    install = area.install()
    assert install.read_manifest() is None
    area.paths.share.mkdir(parents=True)

    area.paths.manifest.write_bytes(b"manifest bytes")
    assert install.read_manifest() == b"manifest bytes"

    area.paths.manifest.write_bytes(b"x" * 5000)
    assert len(install.read_manifest() or b"") == 4097

    area.paths.manifest.unlink()
    os.symlink("/etc/hosts", area.paths.manifest)
    assert failure(install.read_manifest) == "storage_unavailable"


def test_the_source_is_the_artifact_it_was_given_and_its_digest(area: Area) -> None:
    source = area.install(area.current).source()

    assert (source.path, source.sha256) == (area.current, digest(area.current))


def test_a_source_that_cannot_be_read_is_unavailable(area: Area, monkeypatch: pytest.MonkeyPatch) -> None:
    assert failure(area.install(area.home / "absent").source) == "storage_unavailable"
    monkeypatch.setattr("ferret.adapters.posix_install.MAX_ARTIFACT_BYTES", 3)
    assert failure(area.install(area.current).source) == "storage_unavailable"


def test_a_source_tree_is_not_an_artifact_to_install(area: Area) -> None:
    assert running_artifact() is None
    assert failure(area.install().source) == "storage_unavailable"


def test_the_running_artifact_is_the_archive_the_package_was_imported_from(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    archive = tmp_path / "app.pyz"
    with zipfile.ZipFile(archive, "w") as bundle:
        bundle.writestr("ferret/__init__.py", "")
    monkeypatch.setattr(ferret, "__file__", str(archive / "ferret" / "__init__.py"))

    assert running_artifact() == archive


def test_staging_writes_three_verified_files_and_touches_no_final_name(area: Area) -> None:
    install = area.install(area.current)
    install.source()

    staged = install.stage(StagePlan(version=__version__, manifest=b"the manifest\n"))

    paths = area.paths
    assert tree(area.home) == {
        ".local": DIRECTORY,
        ".local/share": DIRECTORY,
        ".local/share/ferret": DIRECTORY,
        f".local/share/ferret/{__version__}": DIRECTORY,
        ".local/bin": DIRECTORY,
        str(staged.artifact.relative_to(area.home)): ("file", ARTIFACT_MODE, area.current.read_bytes()),
        str(staged.manifest.relative_to(area.home)): ("file", MANIFEST_MODE, b"the manifest\n"),
        str(staged.launcher.relative_to(area.home)): ("symlink", 0, str(paths.artifact(__version__))),
    }
    assert (staged.version, staged.artifact.parent, staged.launcher.parent, staged.manifest.parent) == (
        __version__,
        paths.version_directory(__version__),
        paths.bin,
        paths.share,
    )


def test_staging_needs_a_source_first(area: Area) -> None:
    assert failure(lambda: area.install(area.current).stage(StagePlan(version=__version__, manifest=b"m"))) == (
        "storage_unavailable"
    )


def refuse(*arguments: object) -> None:
    raise OSError(errno.EIO, "injected failure")


def busy(*arguments: object) -> None:
    raise OSError(errno.EBUSY, "injected busy")


def wrong_digest(path: Path) -> str:
    return "0" * 64


def test_a_failed_stage_leaves_none_of_its_files_behind(area: Area, monkeypatch: pytest.MonkeyPatch) -> None:
    install = area.install(area.current)
    install.source()
    monkeypatch.setattr("ferret.adapters.posix_install.os.symlink", refuse)

    assert failure(lambda: install.stage(StagePlan(version=__version__, manifest=b"m"))) == "storage_unavailable"

    monkeypatch.undo()
    assert [key for key, (kind, _, _) in tree(area.home).items() if kind != "directory"] == []


def test_a_staged_artifact_that_does_not_read_back_is_refused_and_removed(
    area: Area, monkeypatch: pytest.MonkeyPatch
) -> None:
    install = area.install(area.current)
    install.source()
    monkeypatch.setattr("ferret.adapters.posix_install._sha256_of", wrong_digest)

    assert failure(lambda: install.stage(StagePlan(version=__version__, manifest=b"m"))) == "storage_unavailable"

    monkeypatch.undo()
    assert [key for key, (kind, _, _) in tree(area.home).items() if kind != "directory"] == []


def test_a_file_where_a_directory_must_go_is_a_collision_and_nothing_is_written(area: Area) -> None:
    (area.home / ".local").mkdir()
    (area.home / ".local" / "share").write_bytes(b"a file")
    before = tree(area.home)

    assert failure(lambda: install_user(runtime_for(area, area.current))) == "install_collision"

    assert tree(area.home) == before


def test_a_dangling_link_where_the_user_bin_directory_must_go_is_a_collision(area: Area) -> None:
    (area.home / ".local").mkdir()
    os.symlink("/nowhere/at/all", area.paths.bin)
    before = tree(area.home)

    assert failure(lambda: install_user(runtime_for(area, area.current))) == "install_collision"

    assert tree(area.home) == before


def test_a_missing_home_directory_is_unavailable_storage(area: Area) -> None:
    absent = Area(home=area.home / "absent", current=area.current, older=area.older)

    assert failure(lambda: install_user(runtime_for(absent, area.current))) == "storage_unavailable"


@pytest.mark.parametrize("step", ["replace_artifact", "replace_launcher", "replace_manifest"])
def test_a_failed_replace_is_unavailable_storage_and_replaces_nothing(
    area: Area, monkeypatch: pytest.MonkeyPatch, step: str
) -> None:
    install = area.install(area.current)
    install.source()
    staged = install.stage(StagePlan(version=__version__, manifest=b"m"))
    staged_tree = tree(area.home)
    monkeypatch.setattr("ferret.adapters.posix_install.os.replace", refuse)
    replace_step: Callable[[StagedInstall], None] = getattr(install, step)

    assert failure(lambda: replace_step(staged)) == "storage_unavailable"

    monkeypatch.undo()
    assert tree(area.home) == staged_tree


def test_removing_forgives_a_file_that_is_already_gone_and_refuses_a_directory(area: Area) -> None:
    install = area.install()
    file = area.home / "file"
    file.write_bytes(b"x")

    install.remove(file)
    install.remove(file)

    assert not os.path.lexists(file)
    assert failure(lambda: install.remove(area.home)) == "storage_unavailable"


def test_only_an_empty_plain_directory_is_removed(area: Area, monkeypatch: pytest.MonkeyPatch) -> None:
    install = area.install()
    empty, full, target = (area.home / name for name in ("empty", "full", "target"))
    for directory in (empty, full, target):
        directory.mkdir()
    (full / "keeper").write_bytes(b"mine")
    link = area.home / "link"
    os.symlink(target, link)

    for directory in (empty, full, link, area.home / "absent"):
        install.remove_empty_directory(directory)

    assert (empty.exists(), (full / "keeper").exists(), link.is_symlink(), target.is_dir()) == (False, True, True, True)
    monkeypatch.setattr("ferret.adapters.posix_install.os.rmdir", busy)
    assert failure(lambda: install.remove_empty_directory(target)) == "storage_unavailable"


def test_purging_deletes_the_data_home_and_everything_in_it(tmp_path: Path) -> None:
    machine = make_machine(tmp_path)
    assert machine.data_home.is_dir()

    machine.runtime().files.purge()
    machine.runtime().files.purge()

    assert not os.path.lexists(machine.data_home)


def test_purging_a_symlinked_data_home_is_refused_and_the_target_is_kept(tmp_path: Path) -> None:
    machine = make_machine(tmp_path, initialized=False)
    target = tmp_path / "elsewhere"
    target.mkdir()
    (target / "keeper").write_bytes(b"mine")
    os.symlink(target, machine.data_home)

    assert failure(machine.runtime().files.purge) == "storage_unavailable"

    assert (target / "keeper").read_bytes() == b"mine"
