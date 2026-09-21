"""The per-user install and removal use cases over an in-memory install area that can crash before any step."""

import hashlib
from collections.abc import Callable
from datetime import timedelta
from pathlib import Path

import pytest

from ferret import __version__
from ferret.application.install import InstallOutcome, UninstallOutcome, install_user, uninstall_user
from ferret.domain.errors import FerretError
from ferret.domain.install import InstallPaths, Manifest
from support.fakes import (
    AN_OLDER_VERSION,
    ARTIFACT_BYTES,
    FAKE_HOME,
    FIXED_NOW,
    FakeInstall,
    SimulatedCrash,
    World,
    make_world,
)
from support.populate import stamp, world_with

PATHS = InstallPaths(FAKE_HOME)
OLD_BYTES = b"#!/usr/bin/env python3\nan older artifact\n"
Snapshot = dict[str, tuple[str, int, bytes | str | None]]


def digest(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def completed_tree(*, version: str = __version__, artifact: bytes = ARTIFACT_BYTES, installed_at: str = "") -> Snapshot:
    """Exactly what a finished install leaves: three private directories, the artifact, the launcher, the manifest."""
    manifest = Manifest(
        version=version,
        artifact_path=PATHS.artifact(version),
        artifact_sha256=digest(artifact),
        launcher_path=PATHS.launcher,
        installed_at=installed_at or stamp(FIXED_NOW),
    )
    return {
        str(PATHS.share): ("directory", 0o700, None),
        str(PATHS.version_directory(version)): ("directory", 0o700, None),
        str(PATHS.bin): ("directory", 0o700, None),
        str(PATHS.artifact(version)): ("file", 0o700, artifact),
        str(PATHS.launcher): ("symlink", 0, str(PATHS.artifact(version))),
        str(PATHS.manifest): ("file", 0o600, manifest.to_bytes()),
    }


def install(world: World) -> InstallOutcome:
    return install_user(world.runtime)


def uninstall(world: World, *, purge: bool = False, yes: bool = False) -> UninstallOutcome:
    return uninstall_user(world.runtime, purge_data=purge, confirmed=yes)


def failure(action: Callable[[], object]) -> str:
    with pytest.raises(FerretError) as caught:
        action()
    return caught.value.code


def older_world() -> World:
    world = make_world()
    world.installer.arrange_install(AN_OLDER_VERSION, OLD_BYTES)
    return world


def current_world() -> World:
    world = make_world()
    world.installer.arrange_install(__version__, ARTIFACT_BYTES)
    return world


def test_a_first_install_creates_only_the_three_owned_objects_in_order() -> None:
    world = make_world()

    outcome = install(world)

    assert outcome == InstallOutcome(
        result="installed",
        version=__version__,
        artifact_path=PATHS.artifact(__version__),
        launcher_path=PATHS.launcher,
        manifest_path=PATHS.manifest,
        path_action="add_home_local_bin",
        replaced_owned_version=None,
    )
    assert world.installer.snapshot() == completed_tree()
    assert world.installer.steps == ["recover", "stage", "replace_artifact", "replace_launcher", "replace_manifest"]


def test_the_path_action_is_none_when_the_user_bin_directory_is_already_on_path() -> None:
    world = make_world(installer=FakeInstall(path_variable=f"/usr/bin:{PATHS.bin}"))

    assert install(world).path_action == "none"


def test_installing_again_changes_nothing_and_says_so() -> None:
    world = make_world()
    install(world)
    first = world.installer.snapshot()
    world.installer.steps.clear()
    world.clock.advance(timedelta(hours=1))

    outcome = install(world)

    assert (outcome.result, outcome.replaced_owned_version) == ("already_installed", None)
    assert world.installer.snapshot() == first
    assert world.installer.steps == ["recover"]


def test_a_newer_artifact_replaces_an_owned_older_version_and_removes_its_files() -> None:
    world = older_world()

    outcome = install(world)

    assert (outcome.result, outcome.replaced_owned_version) == ("installed", AN_OLDER_VERSION)
    assert world.installer.snapshot() == completed_tree()


def test_a_rebuilt_artifact_of_the_same_version_is_replaced_in_place() -> None:
    world = make_world()
    world.installer.arrange_install(__version__, OLD_BYTES)

    outcome = install(world)

    assert (outcome.result, outcome.replaced_owned_version) == ("installed", __version__)
    assert world.installer.snapshot() == completed_tree()


def test_a_missing_launcher_is_repaired() -> None:
    world = current_world()
    del world.installer.nodes[PATHS.launcher]

    outcome = install(world)

    assert outcome.result == "installed"
    assert world.installer.snapshot() == completed_tree(installed_at=stamp(FIXED_NOW))


def test_an_artifact_with_the_wrong_mode_is_repaired() -> None:
    world = current_world()
    world.installer.nodes[PATHS.artifact(__version__)].mode = 0o755

    assert install(world).result == "installed"
    assert world.installer.snapshot() == completed_tree()


def test_a_modified_older_artifact_is_never_deleted_because_it_is_no_longer_proved_ours() -> None:
    world = older_world()
    world.installer.put_file(PATHS.artifact(AN_OLDER_VERSION), b"edited by hand", 0o700)

    outcome = install(world)

    assert (outcome.result, outcome.replaced_owned_version) == ("installed", AN_OLDER_VERSION)
    assert world.installer.snapshot() == {
        **completed_tree(),
        str(PATHS.version_directory(AN_OLDER_VERSION)): ("directory", 0o700, None),
        str(PATHS.artifact(AN_OLDER_VERSION)): ("file", 0o700, b"edited by hand"),
    }


def test_a_file_left_beside_an_older_artifact_keeps_its_directory() -> None:
    world = older_world()
    world.installer.put_file(PATHS.version_directory(AN_OLDER_VERSION) / "notes.txt", b"mine", 0o600)

    install(world)

    assert world.installer.snapshot() == {
        **completed_tree(),
        str(PATHS.version_directory(AN_OLDER_VERSION)): ("directory", 0o700, None),
        str(PATHS.version_directory(AN_OLDER_VERSION) / "notes.txt"): ("file", 0o600, b"mine"),
    }


def test_files_outside_the_three_owned_objects_are_never_touched() -> None:
    world = older_world()
    bystanders = {
        FAKE_HOME / ".zshrc": b"export PATH=$PATH\n",
        FAKE_HOME / ".bashrc": b"# bash\n",
        FAKE_HOME / ".local" / "bin" / "other-tool": b"#!/bin/sh\n",
        FAKE_HOME / ".claude" / "settings.json": b"{}\n",
    }
    for path, content in bystanders.items():
        world.installer.put_file(path, content, 0o644)
    before = world.installer.snapshot()

    install(world)
    uninstall(world)

    assert {key: value for key, value in world.installer.snapshot().items() if key in map(str, bystanders)} == {
        key: value for key, value in before.items() if key in map(str, bystanders)
    }


def launcher_is_a_regular_file(installer: FakeInstall) -> None:
    installer.put_file(PATHS.launcher, b"#!/bin/sh\necho mine\n", 0o755)


def launcher_is_a_foreign_link(installer: FakeInstall) -> None:
    installer.put_symlink(PATHS.launcher, "/usr/local/bin/other-ferret")


def launcher_is_a_link_to_a_lookalike_path(installer: FakeInstall) -> None:
    installer.put_symlink(PATHS.launcher, str(PATHS.share / "0.1.0" / "nested" / "ferret.pyz"))


def launcher_is_a_directory(installer: FakeInstall) -> None:
    installer.put_directory(PATHS.launcher)


def artifact_is_someone_elses_file(installer: FakeInstall) -> None:
    installer.put_directory(PATHS.version_directory(__version__))
    installer.put_file(PATHS.artifact(__version__), b"not the FERRET artifact", 0o700)


def artifact_is_a_link(installer: FakeInstall) -> None:
    installer.put_directory(PATHS.version_directory(__version__))
    installer.put_symlink(PATHS.artifact(__version__), "/etc/hosts")


def manifest_is_not_a_manifest(installer: FakeInstall) -> None:
    installer.put_file(PATHS.manifest, b"not json", 0o600)


def manifest_is_a_directory(installer: FakeInstall) -> None:
    installer.put_directory(PATHS.manifest)


def manifest_has_open_permissions(installer: FakeInstall) -> None:
    installer.arrange_install(AN_OLDER_VERSION, OLD_BYTES)
    installer.nodes[PATHS.manifest].mode = 0o644


def manifest_belongs_to_someone_else(installer: FakeInstall) -> None:
    installer.arrange_install(AN_OLDER_VERSION, OLD_BYTES)
    installer.nodes[PATHS.manifest].owned = False


COLLISIONS = [
    launcher_is_a_regular_file,
    launcher_is_a_foreign_link,
    launcher_is_a_link_to_a_lookalike_path,
    launcher_is_a_directory,
    artifact_is_someone_elses_file,
    artifact_is_a_link,
    manifest_is_not_a_manifest,
    manifest_is_a_directory,
    manifest_has_open_permissions,
    manifest_belongs_to_someone_else,
]


@pytest.mark.parametrize("arrange", COLLISIONS, ids=lambda arrange: arrange.__name__)
def test_a_file_that_is_not_ours_in_the_way_is_a_collision_and_nothing_changes(
    arrange: Callable[[FakeInstall], None],
) -> None:
    world = make_world()
    arrange(world.installer)
    before = world.installer.snapshot()

    assert failure(lambda: install(world)) == "install_collision"

    assert world.installer.snapshot() == before
    assert "stage" not in world.installer.steps


def test_an_artifact_that_cannot_be_read_stops_before_anything_is_staged() -> None:
    world = make_world()
    world.installer.source_fails = True

    assert failure(lambda: install(world)) == "storage_unavailable"

    assert (world.installer.snapshot(), world.installer.steps) == ({}, ["recover"])


def test_a_failed_staging_leaves_the_previous_install_exactly_as_it_was() -> None:
    world = older_world()
    before = world.installer.snapshot()
    world.installer.stage_fails = True

    assert failure(lambda: install(world)) == "storage_unavailable"

    assert world.installer.snapshot() == before
    assert world.installer.steps == ["recover", "stage"]


def staged_names(world: World, before: Snapshot) -> list[str]:
    return sorted(Path(path).name for path in set(world.installer.snapshot()) - set(before))


def test_crash_a_before_the_artifact_is_replaced_leaves_the_old_install_whole_and_the_stage_ignorable() -> None:
    world = older_world()
    old = world.installer.snapshot()
    world.installer.crash_before = "replace_artifact"

    with pytest.raises(SimulatedCrash):
        install(world)

    after = world.installer.snapshot()
    assert {key: after[key] for key in old} == old
    # What the crash leaves is the new version's directory and the three staged files beside their final names.
    assert [name.split(".stage-")[0] for name in staged_names(world, old)] == [
        ".ferret.pyz",
        ".ferret",
        ".install.json",
        __version__,
    ]
    assert PATHS.artifact(__version__) not in [Path(path) for path in after]
    world.installer.crash_before = None
    assert install(world).result == "installed"
    assert world.installer.snapshot() == completed_tree()


def test_crash_b_after_the_artifact_before_the_launcher_leaves_the_old_manifest_authoritative() -> None:
    world = older_world()
    old = world.installer.snapshot()
    world.installer.crash_before = "replace_launcher"

    with pytest.raises(SimulatedCrash):
        install(world)

    after = world.installer.snapshot()
    assert {key: after[key] for key in old} == old
    assert after[str(PATHS.artifact(__version__))] == ("file", 0o700, ARTIFACT_BYTES)
    assert after[str(PATHS.launcher)] == ("symlink", 0, str(PATHS.artifact(AN_OLDER_VERSION)))
    world.installer.crash_before = None
    assert install(world).replaced_owned_version == AN_OLDER_VERSION
    assert world.installer.snapshot() == completed_tree()


def test_crash_b_then_removal_takes_only_what_the_old_manifest_owns_and_ignores_the_unowned_version() -> None:
    world = older_world()
    world.installer.crash_before = "replace_launcher"
    with pytest.raises(SimulatedCrash):
        install(world)
    world.installer.crash_before = None

    outcome = uninstall(world)

    assert outcome.result == "uninstalled"
    assert set(world.installer.snapshot()) >= {str(PATHS.artifact(__version__))}
    assert str(PATHS.manifest) not in world.installer.snapshot()
    assert str(PATHS.launcher) not in world.installer.snapshot()
    assert str(PATHS.artifact(AN_OLDER_VERSION)) not in world.installer.snapshot()


def test_crash_c_after_the_launcher_before_the_manifest_makes_removal_refuse_and_delete_nothing() -> None:
    world = older_world()
    world.installer.crash_before = "replace_manifest"
    with pytest.raises(SimulatedCrash):
        install(world)
    world.installer.crash_before = None
    crashed = world.installer.snapshot()
    assert crashed[str(PATHS.launcher)] == ("symlink", 0, str(PATHS.artifact(__version__)))

    assert failure(lambda: uninstall(world)) == "install_ownership_mismatch"

    assert world.installer.snapshot() == crashed


def test_crash_c_is_completed_by_installing_again() -> None:
    world = older_world()
    world.installer.crash_before = "replace_manifest"
    with pytest.raises(SimulatedCrash):
        install(world)
    world.installer.crash_before = None

    outcome = install(world)

    assert (outcome.result, outcome.replaced_owned_version) == ("installed", AN_OLDER_VERSION)
    assert world.installer.snapshot() == completed_tree()


def test_crash_c_across_versions_is_repaired_by_the_next_install_of_another_version(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    world = older_world()
    world.installer.crash_before = "replace_manifest"
    with pytest.raises(SimulatedCrash):
        install(world)
    world.installer.crash_before = None
    world.installer.artifact = b"the artifact of a later build"
    monkeypatch.setattr("ferret.application.install.__version__", "9.9.9")

    outcome = install(world)

    assert (outcome.result, outcome.version, outcome.replaced_owned_version) == ("installed", "9.9.9", AN_OLDER_VERSION)
    assert world.installer.snapshot()[str(PATHS.launcher)] == ("symlink", 0, str(PATHS.artifact("9.9.9")))
    assert world.installer.snapshot()[str(PATHS.artifact(__version__))] == ("file", 0o700, ARTIFACT_BYTES)


def test_a_crashed_install_followed_by_a_different_build_of_the_same_version_is_a_collision() -> None:
    world = older_world()
    world.installer.crash_before = "replace_manifest"
    with pytest.raises(SimulatedCrash):
        install(world)
    world.installer.crash_before = None
    world.installer.artifact = b"a different build of the same version"

    assert failure(lambda: install(world)) == "install_collision"


def test_crash_d_after_the_manifest_makes_the_new_install_authoritative_and_leaves_the_old_artifact_unowned() -> None:
    world = older_world()
    world.installer.crash_before = "remove"

    with pytest.raises(SimulatedCrash):
        install(world)

    crashed = world.installer.snapshot()
    assert {key: value for key, value in crashed.items() if key in completed_tree()} == completed_tree()
    assert crashed[str(PATHS.artifact(AN_OLDER_VERSION))] == ("file", 0o700, OLD_BYTES)
    world.installer.crash_before = None
    world.installer.steps.clear()
    assert install(world).result == "already_installed"
    assert world.installer.steps == ["recover"]
    assert uninstall(world).removed_paths == (PATHS.launcher, PATHS.artifact(__version__), PATHS.manifest)
    assert str(PATHS.artifact(AN_OLDER_VERSION)) in world.installer.snapshot()


def test_uninstalling_when_nothing_is_installed_says_so_and_touches_nothing() -> None:
    world = make_world()

    outcome = uninstall(world)

    assert outcome == UninstallOutcome("not_installed", (), "none", "kept")
    assert (world.installer.snapshot(), world.installer.steps) == ({}, [])


def test_uninstalling_removes_exactly_the_three_owned_files_sorted_and_keeps_the_data() -> None:
    world = world_with()
    world.installer.arrange_install(__version__, ARTIFACT_BYTES)

    outcome = uninstall(world)

    assert outcome == UninstallOutcome(
        "uninstalled", (PATHS.launcher, PATHS.artifact(__version__), PATHS.manifest), "none", "kept"
    )
    assert list(map(str, outcome.removed_paths)) == sorted(map(str, outcome.removed_paths))
    assert {path for path, node in world.installer.nodes.items() if node.kind != "directory"} == set()
    assert world.files.purges == 0
    assert world.files.files != {}


def test_the_manifest_goes_last_so_an_interrupted_removal_can_be_finished() -> None:
    world = current_world()
    world.installer.crash_before = "remove_empty_directory"

    with pytest.raises(SimulatedCrash):
        uninstall(world)

    assert set(world.installer.snapshot()) >= {str(PATHS.manifest)}
    assert str(PATHS.launcher) not in world.installer.snapshot()
    world.installer.crash_before = None
    assert uninstall(world).removed_paths == (PATHS.manifest,)
    assert uninstall(world).result == "not_installed"


def test_removal_resumes_when_only_the_manifest_is_left() -> None:
    world = current_world()
    del world.installer.nodes[PATHS.launcher]
    del world.installer.nodes[PATHS.artifact(__version__)]

    outcome = uninstall(world)

    assert (outcome.result, outcome.removed_paths) == ("uninstalled", (PATHS.manifest,))


def test_a_file_beside_the_artifact_keeps_its_directory_and_is_never_removed() -> None:
    world = current_world()
    world.installer.put_file(PATHS.version_directory(__version__) / "notes.txt", b"mine", 0o600)

    uninstall(world)

    assert str(PATHS.version_directory(__version__) / "notes.txt") in world.installer.snapshot()
    assert str(PATHS.version_directory(__version__)) in world.installer.snapshot()


def mismatch_manifest_is_not_a_manifest(installer: FakeInstall) -> None:
    installer.put_file(PATHS.manifest, b"not json", 0o600)


def mismatch_manifest_has_open_permissions(installer: FakeInstall) -> None:
    installer.nodes[PATHS.manifest].mode = 0o644


def mismatch_manifest_belongs_to_someone_else(installer: FakeInstall) -> None:
    installer.nodes[PATHS.manifest].owned = False


def mismatch_manifest_is_a_link(installer: FakeInstall) -> None:
    installer.put_symlink(PATHS.manifest, "/etc/hosts")


def mismatch_artifact_was_edited(installer: FakeInstall) -> None:
    installer.put_file(PATHS.artifact(__version__), b"edited", 0o700)


def mismatch_artifact_became_a_link(installer: FakeInstall) -> None:
    installer.put_symlink(PATHS.artifact(__version__), "/etc/hosts")


def mismatch_artifact_belongs_to_someone_else(installer: FakeInstall) -> None:
    installer.nodes[PATHS.artifact(__version__)].owned = False


def mismatch_launcher_points_elsewhere(installer: FakeInstall) -> None:
    installer.put_symlink(PATHS.launcher, "/usr/local/bin/other-ferret")


def mismatch_launcher_became_a_file(installer: FakeInstall) -> None:
    installer.put_file(PATHS.launcher, b"#!/bin/sh\n", 0o755)


MISMATCHES = [
    mismatch_manifest_is_not_a_manifest,
    mismatch_manifest_has_open_permissions,
    mismatch_manifest_belongs_to_someone_else,
    mismatch_manifest_is_a_link,
    mismatch_artifact_was_edited,
    mismatch_artifact_became_a_link,
    mismatch_artifact_belongs_to_someone_else,
    mismatch_launcher_points_elsewhere,
    mismatch_launcher_became_a_file,
]


@pytest.mark.parametrize("arrange", MISMATCHES, ids=lambda arrange: arrange.__name__)
def test_removal_refuses_and_deletes_nothing_when_ownership_cannot_be_proved(
    arrange: Callable[[FakeInstall], None],
) -> None:
    world = world_with()
    world.installer.arrange_install(__version__, ARTIFACT_BYTES)
    arrange(world.installer)
    before = world.installer.snapshot()

    assert failure(lambda: uninstall(world)) == "install_ownership_mismatch"

    assert world.installer.snapshot() == before
    assert "remove" not in world.installer.steps
    assert world.files.purges == 0


def test_purging_data_without_confirmation_fails_before_anything_is_removed() -> None:
    world = world_with()
    world.installer.arrange_install(__version__, ARTIFACT_BYTES)
    before = world.installer.snapshot()

    assert failure(lambda: uninstall(world, purge=True)) == "confirmation_required"

    assert (world.installer.snapshot(), world.installer.steps, world.files.purges) == (before, [], 0)


def test_confirmed_purge_removes_the_owned_files_and_then_the_data_home() -> None:
    world = world_with()
    world.installer.arrange_install(__version__, ARTIFACT_BYTES)

    outcome = uninstall(world, purge=True, yes=True)

    assert (outcome.result, outcome.data_action) == ("uninstalled", "deleted")
    assert (world.files.purges, world.files.files) == (1, {})


def test_confirmed_purge_also_deletes_the_data_when_nothing_is_installed() -> None:
    world = world_with()

    outcome = uninstall(world, purge=True, yes=True)

    assert (outcome.result, outcome.removed_paths, outcome.data_action) == ("not_installed", (), "deleted")
    assert world.files.purges == 1


def test_a_confirmed_purge_with_no_data_home_is_not_an_error() -> None:
    world = make_world()

    outcome = uninstall(world, purge=True, yes=True)

    assert (outcome.result, outcome.data_action, world.files.purges) == ("not_installed", "deleted", 0)


def test_an_unsafe_data_home_is_refused_before_any_owned_file_is_removed() -> None:
    world = world_with()
    world.installer.arrange_install(__version__, ARTIFACT_BYTES)
    world.files.directory.mode = 0o755  # type: ignore[union-attr]
    before = world.installer.snapshot()

    assert failure(lambda: uninstall(world, purge=True, yes=True)) == "unsafe_storage"

    assert (world.installer.snapshot(), world.files.purges) == (before, 0)


def test_confirmation_alone_purges_nothing() -> None:
    world = world_with()

    outcome = uninstall(world, yes=True)

    assert (outcome.data_action, world.files.purges) == ("kept", 0)


def share_is_a_file(installer: FakeInstall) -> None:
    installer.put_file(PATHS.share, b"not a directory", 0o600)


def share_is_a_link(installer: FakeInstall) -> None:
    installer.put_symlink(PATHS.share, "/tmp")


def version_directory_is_a_file(installer: FakeInstall) -> None:
    installer.put_file(PATHS.version_directory(__version__), b"not a directory", 0o600)


def version_directory_is_a_link(installer: FakeInstall) -> None:
    installer.put_symlink(PATHS.version_directory(__version__), "/tmp")


@pytest.mark.parametrize(
    "arrange",
    [share_is_a_file, share_is_a_link, version_directory_is_a_file, version_directory_is_a_link],
    ids=lambda arrange: arrange.__name__,
)
def test_an_install_directory_that_is_not_a_directory_is_a_collision_and_nothing_changes(
    arrange: Callable[[FakeInstall], None],
) -> None:
    world = make_world()
    arrange(world.installer)
    before = world.installer.snapshot()

    assert failure(lambda: install(world)) == "install_collision"

    assert world.installer.snapshot() == before
    assert "stage" not in world.installer.steps


class VanishingManifest(FakeInstall):
    """A manifest that is there when it is looked at and gone by the time it is read."""

    def read_manifest(self) -> bytes | None:
        return None


def test_a_manifest_that_vanishes_before_it_is_read_is_a_collision_for_install() -> None:
    world = make_world(installer=VanishingManifest())
    world.installer.arrange_install(AN_OLDER_VERSION, OLD_BYTES)
    before = world.installer.snapshot()

    assert failure(lambda: install(world)) == "install_collision"

    assert world.installer.snapshot() == before


def test_a_manifest_that_vanishes_before_it_is_read_is_an_ownership_mismatch_for_uninstall() -> None:
    world = make_world(installer=VanishingManifest())
    world.installer.arrange_install(__version__, ARTIFACT_BYTES)
    before = world.installer.snapshot()

    assert failure(lambda: uninstall(world)) == "install_ownership_mismatch"

    assert world.installer.snapshot() == before
