"""FERRET installs itself for the current user, updates in place, recovers an interrupted install, and removes its own.

Every test runs the built artifact as a separate process against an isolated HOME. A real process cannot be stopped
at an exact step, so each crash test lays down the objects a crash at that step leaves, byte for byte, and then runs
the built artifact to recover; the interruption at every step is proved in the Unit and Integration suites.
"""

import json
import os
import re
import stat
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest

from event_documents import numbered_event
from ferret_process import Completed, capture_documents, run_artifact, run_installed
from install_area import (
    ARTIFACT_MODE,
    DIRECTORY_MODE,
    LAUNCHER_MODE,
    MANIFEST_MODE,
    OLDER_VERSION,
    STAGE_NONCE,
    Layout,
    Tree,
    area,
    completed,
    launcher_starts,
    manifest_bytes,
    older_artifact,
    pinned_launcher,
    tree,
)

INSTALL = ["self", "install", "--target", "user", "--json"]
UNINSTALL = ["self", "uninstall", "--json"]
PATH_WITHOUT_USER_BIN = "/usr/bin:/bin"
TIMESTAMP = re.compile(r"\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z")


@pytest.fixture
def layout(home: Path) -> Layout:
    return Layout(home)


@pytest.fixture
def version(artifact: Path, home: Path) -> str:
    ran = run_artifact(artifact, ["version"], home=home)
    assert (ran.returncode, ran.stderr) == (0, b"")
    return ran.stdout.decode().split()[1]


@pytest.fixture
def older(artifact: Path, tmp_path: Path) -> Path:
    return older_artifact(artifact, OLDER_VERSION, tmp_path / "older" / "ferret.pyz")


def run(artifact: Path, home: Path, arguments: list[str], *, path: str = PATH_WITHOUT_USER_BIN) -> Completed:
    return run_artifact(artifact, arguments, home=home, extra_environment={"PATH": path})


def succeeded(ran: Completed) -> dict[str, Any]:
    assert (ran.returncode, ran.stderr) == (0, b""), ran
    assert ran.stdout.count(b"\n") == 1
    document: dict[str, Any] = json.loads(ran.stdout)
    return document


def refused(ran: Completed, code: str, exit_code: int) -> None:
    assert (ran.returncode, ran.stdout) == (exit_code, b""), ran
    envelope: dict[str, Any] = json.loads(ran.stderr)
    assert envelope["exitCode"] == exit_code
    assert envelope["error"] == {"code": code, "field": None, "retryable": False}


def install(artifact: Path, home: Path, *, path: str = PATH_WITHOUT_USER_BIN) -> dict[str, Any]:
    return succeeded(run(artifact, home, INSTALL, path=path))


def uninstall(artifact: Path, home: Path, *options: str) -> dict[str, Any]:
    return succeeded(run(artifact, home, [*UNINSTALL, *options]))


def recorded_time(layout: Layout) -> str:
    """When the manifest on disk says the install happened; it must be a real, recent, canonical UTC instant."""
    recorded: str = json.loads(layout.manifest.read_bytes())["installedAt"]
    assert TIMESTAMP.fullmatch(recorded)
    moment = datetime.fromisoformat(recorded)
    assert abs(datetime.now(UTC) - moment) < timedelta(minutes=5)
    return recorded


def place(path: Path, content: bytes, mode: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)
    path.chmod(mode)


def install_report(
    layout: Layout, version: str, *, result: str, replaced: str | None, path_action: str
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "command": "self.install",
        "exitCode": 0,
        "result": result,
        "version": version,
        "artifactPath": str(layout.artifact(version)),
        "launcherPath": str(layout.launcher),
        "manifestPath": str(layout.manifest),
        "pathAction": path_action,
        "replacedOwnedVersion": replaced,
    }


def uninstall_report(*, result: str, removed: list[Path], data: str = "kept") -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "command": "self.uninstall",
        "exitCode": 0,
        "result": result,
        "removedPaths": sorted(str(path) for path in removed),
        "pathAction": "none",
        "dataAction": data,
    }


def test_user_install_update_uninstall(artifact: Path, older: Path, layout: Layout, version: str) -> None:
    current, previous = artifact.read_bytes(), older.read_bytes()

    first = install(older, layout.home)

    assert first == install_report(
        layout, OLDER_VERSION, result="installed", replaced=None, path_action="add_home_local_bin"
    )
    assert area(layout) == completed(layout, OLDER_VERSION, previous, recorded_time(layout))
    assert [path.name for path in layout.home.iterdir()] == [".local"]

    updated = install(artifact, layout.home)

    assert updated == install_report(
        layout, version, result="installed", replaced=OLDER_VERSION, path_action="add_home_local_bin"
    )
    assert area(layout) == completed(layout, version, current, recorded_time(layout))
    launched = run_installed(layout.launcher, ["version"], home=layout.home)
    assert launched == Completed(0, f"ferret {version}\n".encode(), b"")

    before = area(layout)
    unchanged = install(artifact, layout.home)

    assert unchanged == install_report(
        layout, version, result="already_installed", replaced=None, path_action="add_home_local_bin"
    )
    assert area(layout) == before

    assert succeeded(run(artifact, layout.home, ["init", "--json"]))["result"] == "created"
    capture_documents(artifact, layout.home, [numbered_event(1, now=datetime.now(UTC), ago=timedelta(minutes=1))])
    data = tree(layout.home / ".ferret")

    removed = uninstall(artifact, layout.home)

    assert removed == uninstall_report(
        result="uninstalled", removed=[layout.launcher, layout.artifact(version), layout.manifest]
    )
    assert area(layout) == {
        ".local": ("directory", DIRECTORY_MODE, None),
        ".local/bin": ("directory", DIRECTORY_MODE, None),
        ".local/share": ("directory", DIRECTORY_MODE, None),
    }
    assert tree(layout.home / ".ferret") == data

    again = uninstall(artifact, layout.home)

    assert again == uninstall_report(result="not_installed", removed=[])
    assert not os.path.lexists(layout.launcher)


def test_the_installed_launcher_removes_its_own_installation(artifact: Path, layout: Layout, version: str) -> None:
    install(artifact, layout.home, path=f"{layout.bin}:{PATH_WITHOUT_USER_BIN}")

    removed = succeeded(run_installed(layout.launcher, UNINSTALL, home=layout.home))

    assert removed == uninstall_report(
        result="uninstalled", removed=[layout.launcher, layout.artifact(version), layout.manifest]
    )
    assert not os.path.lexists(layout.launcher)
    assert not layout.share.exists()


def test_owner_only_modes_do_not_depend_on_the_umask(artifact: Path, layout: Layout, version: str) -> None:
    previous = os.umask(0)
    try:
        install(artifact, layout.home)
    finally:
        os.umask(previous)

    assert area(layout) == completed(layout, version, artifact.read_bytes(), recorded_time(layout))


def test_directories_that_already_exist_keep_their_mode_and_their_files(
    artifact: Path, layout: Layout, version: str
) -> None:
    other = layout.bin / "other-tool"
    place(other, b"#!/bin/sh\n", 0o755)
    for directory in (layout.home / ".local", layout.bin):
        directory.chmod(0o755)

    install(artifact, layout.home)

    assert {path: stat.S_IMODE(os.lstat(path).st_mode) for path in (layout.home / ".local", layout.bin)} == {
        layout.home / ".local": 0o755,
        layout.bin: 0o755,
    }
    assert other.read_bytes() == b"#!/bin/sh\n"
    assert stat.S_IMODE(os.lstat(layout.share).st_mode) == DIRECTORY_MODE

    uninstall(artifact, layout.home)

    assert sorted(path.name for path in layout.bin.iterdir()) == ["other-tool"]
    assert other.read_bytes() == b"#!/bin/sh\n"


def test_a_shell_startup_file_is_never_written(artifact: Path, layout: Layout) -> None:
    startup = {".zshrc": b"export EDITOR=vi\n", ".bashrc": b"# bash\n", ".profile": b"# login\n"}
    for name, content in startup.items():
        place(layout.home / name, content, 0o644)

    install(artifact, layout.home)
    uninstall(artifact, layout.home)

    assert {name: (layout.home / name).read_bytes() for name in startup} == startup
    assert {path.name for path in layout.home.iterdir()} == {".local", *startup}


def test_the_path_action_follows_the_environment_path(artifact: Path, layout: Layout) -> None:
    absent = install(artifact, layout.home, path=PATH_WITHOUT_USER_BIN)
    present = install(artifact, layout.home, path=f"/usr/bin:{layout.bin}/:/bin")

    assert (absent["pathAction"], present["pathAction"]) == ("add_home_local_bin", "none")


@dataclass(frozen=True, slots=True)
class Crash:
    """The objects an interrupted install of ``artifact`` leaves at each point, laid down exactly."""

    layout: Layout
    version: str
    artifact: bytes

    @property
    def staged_artifact(self) -> Path:
        return self.layout.version_directory(self.version) / f".ferret.pyz.stage-{STAGE_NONCE}"

    @property
    def staged_launcher(self) -> Path:
        return self.layout.bin / f".ferret.stage-{STAGE_NONCE}"

    @property
    def staged_manifest(self) -> Path:
        return self.layout.share / f".install.json.stage-{STAGE_NONCE}"

    def staged(self) -> None:
        """Everything is written beside its final name and nothing has replaced anything yet."""
        self.layout.version_directory(self.version).mkdir(mode=DIRECTORY_MODE, exist_ok=True)
        place(self.staged_artifact, self.artifact, ARTIFACT_MODE)
        place(self.staged_launcher, pinned_launcher(self.layout, self.version), LAUNCHER_MODE)
        place(self.staged_manifest, manifest_bytes(self.layout, self.version, self.artifact), MANIFEST_MODE)

    def replaced_artifact(self) -> None:
        os.replace(self.staged_artifact, self.layout.artifact(self.version))

    def replaced_launcher(self) -> None:
        os.replace(self.staged_launcher, self.layout.launcher)

    def replaced_manifest(self) -> None:
        os.replace(self.staged_manifest, self.layout.manifest)


@pytest.fixture
def crash(artifact: Path, older: Path, layout: Layout, version: str) -> Crash:
    """An installed older version, and the means to leave the update to ``version`` half done."""
    install(older, layout.home)
    return Crash(layout, version, artifact.read_bytes())


def test_crash_a_before_the_artifact_replace_leaves_the_old_install_whole_and_the_next_install_finishes(
    artifact: Path, layout: Layout, version: str, crash: Crash
) -> None:
    before = area(layout)

    crash.staged()

    after = area(layout)
    assert {key: after[key] for key in before} == before
    assert sorted(set(after) - set(before)) == sorted(
        str(path.relative_to(layout.home))
        for path in (
            layout.version_directory(version),
            crash.staged_artifact,
            crash.staged_launcher,
            crash.staged_manifest,
        )
    )
    assert launcher_starts(layout) == layout.artifact(OLDER_VERSION)

    finished = install(artifact, layout.home)

    assert finished == install_report(
        layout, version, result="installed", replaced=OLDER_VERSION, path_action="add_home_local_bin"
    )
    assert area(layout) == completed(layout, version, crash.artifact, recorded_time(layout))


def test_crash_b_after_the_artifact_before_the_launcher_keeps_the_old_manifest_authoritative(
    artifact: Path, layout: Layout, version: str, crash: Crash
) -> None:
    crash.staged()
    crash.replaced_artifact()

    assert launcher_starts(layout) == layout.artifact(OLDER_VERSION)
    assert json.loads(layout.manifest.read_bytes())["version"] == OLDER_VERSION

    finished = install(artifact, layout.home)

    assert finished == install_report(
        layout, version, result="installed", replaced=OLDER_VERSION, path_action="add_home_local_bin"
    )
    assert area(layout) == completed(layout, version, crash.artifact, recorded_time(layout))


def test_crash_b_then_removal_takes_only_what_the_old_manifest_owns(
    artifact: Path, layout: Layout, version: str, crash: Crash
) -> None:
    crash.staged()
    crash.replaced_artifact()

    removed = uninstall(artifact, layout.home)

    assert removed == uninstall_report(
        result="uninstalled", removed=[layout.launcher, layout.artifact(OLDER_VERSION), layout.manifest]
    )
    remaining = area(layout)
    assert remaining[str(layout.artifact(version).relative_to(layout.home))] == ("file", ARTIFACT_MODE, crash.artifact)
    assert not os.path.lexists(layout.version_directory(OLDER_VERSION))
    assert not os.path.lexists(layout.manifest)

    finished = install(artifact, layout.home)

    assert finished == install_report(
        layout, version, result="installed", replaced=None, path_action="add_home_local_bin"
    )
    assert area(layout) == completed(layout, version, crash.artifact, recorded_time(layout))


def test_crash_c_after_the_launcher_before_the_manifest_refuses_removal_and_the_next_install_finishes(
    artifact: Path, layout: Layout, version: str, crash: Crash
) -> None:
    crash.staged()
    crash.replaced_artifact()
    crash.replaced_launcher()
    crashed = tree(layout.home)
    assert launcher_starts(layout) == layout.artifact(version)
    assert json.loads(layout.manifest.read_bytes())["version"] == OLDER_VERSION

    refused(run(artifact, layout.home, UNINSTALL), "install_ownership_mismatch", 3)

    assert tree(layout.home) == crashed

    finished = install(artifact, layout.home)

    assert finished == install_report(
        layout, version, result="installed", replaced=OLDER_VERSION, path_action="add_home_local_bin"
    )
    assert area(layout) == completed(layout, version, crash.artifact, recorded_time(layout))


def test_crash_d_after_the_manifest_makes_the_new_install_authoritative_and_leaves_the_old_artifact_unowned(
    artifact: Path, older: Path, layout: Layout, version: str, crash: Crash
) -> None:
    crash.staged()
    crash.replaced_artifact()
    crash.replaced_launcher()
    crash.replaced_manifest()
    crashed = tree(layout.home)
    assert json.loads(layout.manifest.read_bytes())["version"] == version
    assert layout.artifact(OLDER_VERSION).read_bytes() == older.read_bytes()

    unchanged = install(artifact, layout.home)

    assert unchanged == install_report(
        layout, version, result="already_installed", replaced=None, path_action="add_home_local_bin"
    )
    assert tree(layout.home) == crashed

    removed = uninstall(artifact, layout.home)

    assert removed == uninstall_report(
        result="uninstalled", removed=[layout.launcher, layout.artifact(version), layout.manifest]
    )
    assert layout.artifact(OLDER_VERSION).read_bytes() == older.read_bytes()
    assert not os.path.lexists(layout.version_directory(version))


def launcher_is_a_regular_file(layout: Layout, version: str) -> None:
    place(layout.launcher, b"#!/bin/sh\necho mine\n", 0o755)


def launcher_is_a_foreign_link(layout: Layout, version: str) -> None:
    layout.bin.mkdir(parents=True)
    os.symlink("/usr/bin/env", layout.launcher)


def launcher_is_a_directory(layout: Layout, version: str) -> None:
    layout.launcher.mkdir(parents=True)


def artifact_is_someone_elses_file(layout: Layout, version: str) -> None:
    place(layout.artifact(version), b"not the FERRET artifact", 0o700)


def manifest_is_not_a_manifest(layout: Layout, version: str) -> None:
    place(layout.manifest, b"not json", 0o600)


COLLISIONS = [
    launcher_is_a_regular_file,
    launcher_is_a_foreign_link,
    launcher_is_a_directory,
    artifact_is_someone_elses_file,
    manifest_is_not_a_manifest,
]


@pytest.mark.parametrize("arrange", COLLISIONS, ids=lambda arrange: arrange.__name__)
def test_a_file_that_is_not_ours_in_the_way_is_a_collision_and_nothing_changes(
    arrange: Callable[[Layout, str], None], artifact: Path, layout: Layout, version: str
) -> None:
    arrange(layout, version)
    before = tree(layout.home)

    refused(run(artifact, layout.home, INSTALL), "install_collision", 3)

    assert tree(layout.home) == before


def artifact_was_edited(layout: Layout, version: str) -> None:
    layout.artifact(version).write_bytes(layout.artifact(version).read_bytes() + b"# edited by hand\n")


def launcher_points_elsewhere(layout: Layout, version: str) -> None:
    layout.launcher.unlink()
    os.symlink("/usr/bin/env", layout.launcher)


def launcher_became_a_file(layout: Layout, version: str) -> None:
    layout.launcher.unlink()
    place(layout.launcher, b"#!/bin/sh\n", 0o755)


def manifest_lost_its_content(layout: Layout, version: str) -> None:
    layout.manifest.write_bytes(b"not json")


def manifest_became_readable_by_others(layout: Layout, version: str) -> None:
    layout.manifest.chmod(0o644)


MISMATCHES = [
    artifact_was_edited,
    launcher_points_elsewhere,
    launcher_became_a_file,
    manifest_lost_its_content,
    manifest_became_readable_by_others,
]


@pytest.mark.parametrize("change", MISMATCHES, ids=lambda change: change.__name__)
def test_removal_refuses_and_deletes_nothing_when_ownership_cannot_be_proved(
    change: Callable[[Layout, str], None], artifact: Path, layout: Layout, version: str
) -> None:
    install(artifact, layout.home)
    change(layout, version)
    before = tree(layout.home)

    refused(run(artifact, layout.home, UNINSTALL), "install_ownership_mismatch", 3)

    assert tree(layout.home) == before


def test_purging_data_without_confirmation_changes_nothing(artifact: Path, layout: Layout) -> None:
    install(artifact, layout.home)
    assert succeeded(run(artifact, layout.home, ["init", "--json"]))["result"] == "created"
    before = tree(layout.home)

    refused(run(artifact, layout.home, [*UNINSTALL, "--purge-data"]), "confirmation_required", 2)

    assert tree(layout.home) == before


def test_confirmed_purge_removes_the_install_and_then_the_data(artifact: Path, layout: Layout, version: str) -> None:
    install(artifact, layout.home)
    assert succeeded(run(artifact, layout.home, ["init", "--json"]))["result"] == "created"

    removed = uninstall(artifact, layout.home, "--purge-data", "--yes")

    assert removed == uninstall_report(
        result="uninstalled", removed=[layout.launcher, layout.artifact(version), layout.manifest], data="deleted"
    )
    assert not os.path.lexists(layout.home / ".ferret")
    assert not os.path.lexists(layout.launcher)


def test_confirmation_alone_purges_nothing(artifact: Path, layout: Layout) -> None:
    install(artifact, layout.home)
    assert succeeded(run(artifact, layout.home, ["init", "--json"]))["result"] == "created"
    data: Tree = tree(layout.home / ".ferret")

    removed = uninstall(artifact, layout.home, "--yes")

    assert removed["dataAction"] == "kept"
    assert tree(layout.home / ".ferret") == data


def test_a_confirmed_purge_needs_no_installation_and_no_data(artifact: Path, layout: Layout) -> None:
    removed = uninstall(artifact, layout.home, "--purge-data", "--yes")

    assert removed == uninstall_report(result="not_installed", removed=[], data="deleted")
    assert list(layout.home.iterdir()) == []


def test_installed_files_record_the_digest_of_the_artifact_that_was_installed(
    artifact: Path, layout: Layout, version: str
) -> None:
    install(artifact, layout.home)

    recorded: dict[str, Any] = json.loads(layout.manifest.read_bytes())

    assert list(recorded) == [
        "schemaVersion",
        "version",
        "artifactPath",
        "artifactSha256",
        "launcherPath",
        "installedAt",
    ]
    assert recorded == json.loads(manifest_bytes(layout, version, artifact.read_bytes(), recorded_time(layout)))
    assert layout.artifact(version).read_bytes() == artifact.read_bytes()
