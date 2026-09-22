"""Initialization: where the data home is, and how one private store is created, verified, and completed."""

import json
from pathlib import Path
from typing import Any

import pytest

from ferret.adapters.filesystem import adopt_legacy_data_home, resolve_data_home
from ferret.application.initialization import initialize_store
from ferret.domain.errors import FerretError
from support.fakes import (
    FAKE_DATA_HOME,
    FAKE_HOME,
    INSTALLATION_ID,
    FakeDataHome,
    FakeSchema,
    SequenceRandomness,
    SimulatedCrash,
    World,
    make_world,
)

OTHER_UUID = "00000000-0000-4000-8000-0000000000ff"
CREATED_IN_ORDER = [
    ("identity.key", 0o600),
    ("identity.json", 0o600),
    ("config.json", 0o600),
    ("ferret.sqlite3", 0o600),
]


def initialized_world() -> World:
    world = make_world()
    initialize_store(world.runtime)
    return world


def test_private_machine_store() -> None:
    world = make_world()

    first = initialize_store(world.runtime)

    assert first.result == "created"
    assert first.data_home == FAKE_DATA_HOME
    assert first.database_path == FAKE_DATA_HOME / "ferret.sqlite3"
    assert first.schema_number == 1
    assert first.installation_id == INSTALLATION_ID
    assert first.retention_days == 30
    assert first.permissions_state == "private"
    assert world.files.directory is not None
    assert world.files.directory.mode == 0o700
    assert world.files.creates == CREATED_IN_ORDER
    assert world.files.files["identity.key"].content == bytes(range(32))
    identity: dict[str, Any] = json.loads(world.files.files["identity.json"].content)
    assert list(identity) == ["schemaVersion", "installationId", "createdAt"]
    assert identity == {
        "schemaVersion": "1.0",
        "installationId": INSTALLATION_ID,
        "createdAt": "2026-09-18T08:00:00.000Z",
    }
    assert json.loads(world.files.files["config.json"].content) == {
        "schemaVersion": "1.0",
        "retentionDays": 30,
        "maintenanceIntervalSeconds": 3600,
    }
    assert world.files.files["ferret.sqlite3"].content == b""

    second = initialize_store(world.runtime)

    assert second.result == "already_initialized"
    assert second.installation_id == first.installation_id
    assert second.database_path == first.database_path
    assert world.files.creates == CREATED_IN_ORDER
    assert world.files.files["identity.key"].content == bytes(range(32))
    assert world.randomness.uuid_calls == 1
    assert world.randomness.key_calls == 1


def test_initialization_holds_the_exclusive_lock_around_every_write() -> None:
    world = make_world()

    initialize_store(world.runtime)

    assert world.files.lock_count == 1
    assert world.files.lock_depth == 0
    assert world.schema.calls == 1


@pytest.mark.parametrize(
    ("environment", "expected"),
    [
        pytest.param({}, FAKE_DATA_HOME, id="neither-variable-set"),
        pytest.param({"FERRET_DATA_HOME": ""}, FAKE_DATA_HOME, id="an-empty-override-counts-as-unset"),
        pytest.param({"XDG_DATA_HOME": ""}, FAKE_DATA_HOME, id="an-empty-base-falls-back-to-the-default"),
        pytest.param({"XDG_DATA_HOME": "share"}, FAKE_DATA_HOME, id="a-relative-base-is-not-a-base-directory"),
        pytest.param({"XDG_DATA_HOME": "/srv/share"}, Path("/srv/share/ferret"), id="the-base-directory"),
        pytest.param({"XDG_DATA_HOME": "/srv/../share"}, FAKE_DATA_HOME, id="a-base-that-climbs-is-refused"),
        pytest.param(
            {"XDG_DATA_HOME": "/srv/share", "FERRET_DATA_HOME": "/srv/ferret-data"},
            Path("/srv/ferret-data"),
            id="the-override-outranks-the-base",
        ),
        pytest.param({"FERRET_DATA_HOME": "/srv/ferret-data"}, Path("/srv/ferret-data"), id="an-override"),
        pytest.param({"FERRET_DATA_HOME": "/srv//ferret-data/"}, Path("/srv/ferret-data"), id="normalized"),
        pytest.param({"FERRET_DATA_HOME": "/srv/./ferret-data"}, Path("/srv/ferret-data"), id="a-dot-segment"),
    ],
)
def test_the_data_home_follows_the_base_directory_specification_unless_overridden(
    environment: dict[str, str], expected: Path
) -> None:
    assert resolve_data_home(environment, FAKE_HOME) == expected


def test_a_pre_specification_data_home_is_moved_once_into_the_new_location(tmp_path: Path) -> None:
    home = tmp_path / "home"
    legacy = home / ".ferret"
    legacy.mkdir(parents=True)
    (legacy / "identity.json").write_text("{}")
    data_home = home / ".local" / "share" / "ferret"

    assert adopt_legacy_data_home(home, data_home) == data_home
    assert (data_home / "identity.json").read_text() == "{}"
    assert not legacy.exists()

    # Once: a directory that reappears under the old name is left alone, because the new one now exists.
    legacy.mkdir()
    assert adopt_legacy_data_home(home, data_home) == data_home
    assert legacy.is_dir()


def test_nothing_is_adopted_when_there_is_no_old_data_home(tmp_path: Path) -> None:
    home = tmp_path / "home"
    home.mkdir()
    data_home = home / ".local" / "share" / "ferret"

    assert adopt_legacy_data_home(home, data_home) == data_home
    assert not data_home.exists()


def test_a_move_that_cannot_be_done_leaves_the_data_where_the_user_can_still_find_it(tmp_path: Path) -> None:
    # Losing sight of a user's own history is worse than an untidy path, so a refused rename keeps the old home.
    home = tmp_path / "home"
    legacy = home / ".ferret"
    legacy.mkdir(parents=True)
    share = home / ".local" / "share"
    share.mkdir(parents=True)
    share.chmod(0o500)
    try:
        assert adopt_legacy_data_home(home, share / "ferret") == legacy
    finally:
        share.chmod(0o700)
    assert legacy.is_dir()


@pytest.mark.parametrize(
    "override",
    [
        "ferret-data",
        "./ferret-data",
        "~/ferret-data",
        "/",
        "/srv/../etc/ferret",
        "/srv/ferret/..",
        "file:///srv/ferret-data",
        "https://example.invalid/ferret-data",
        "/srv/ferret\x00data",
    ],
)
def test_an_unsafe_override_is_refused_without_echoing_it(override: str) -> None:
    with pytest.raises(FerretError) as caught:
        resolve_data_home({"FERRET_DATA_HOME": override}, FAKE_HOME)

    assert caught.value.code == "ferret.storage.unsafe"
    assert caught.value.exit_code == 2
    assert override not in str(caught.value)


def test_a_relative_home_is_refused() -> None:
    with pytest.raises(FerretError) as caught:
        resolve_data_home({}, Path("relative/home"))

    assert caught.value.code == "ferret.storage.unsafe"


@pytest.mark.parametrize(
    ("target", "change"),
    [
        (None, {"mode": 0o755}),
        (None, {"mode": 0o770}),
        (None, {"owned": False}),
        (None, {"kind": "symlink"}),
        (None, {"kind": "file"}),
        ("identity.key", {"mode": 0o644}),
        ("identity.key", {"owned": False}),
        ("identity.key", {"links": 2}),
        ("identity.key", {"kind": "symlink"}),
        ("identity.json", {"mode": 0o666}),
        ("identity.json", {"kind": "symlink"}),
        ("config.json", {"kind": "directory"}),
        ("config.json", {"links": 3}),
        ("ferret.sqlite3", {"mode": 0o640}),
        ("ferret.sqlite3", {"links": 2}),
        ("ferret.sqlite3", {"kind": "other"}),
    ],
)
def test_an_existing_unsafe_object_is_refused_and_nothing_is_changed(
    target: str | None, change: dict[str, Any]
) -> None:
    world = initialized_world()
    entry = world.files.directory if target is None else world.files.files[target]
    assert entry is not None
    for attribute, value in change.items():
        setattr(entry, attribute, value)
    creates_before = list(world.files.creates)

    with pytest.raises(FerretError) as caught:
        initialize_store(world.runtime)

    assert caught.value.code == "ferret.storage.unsafe"
    assert caught.value.exit_code == 2
    assert str(FAKE_HOME) not in str(caught.value)
    assert world.files.creates == creates_before


@pytest.mark.parametrize(
    ("crash_after", "identity_calls", "expected_identity"),
    [(1, 2, OTHER_UUID), (2, 1, INSTALLATION_ID), (3, 1, INSTALLATION_ID)],
)
def test_an_interrupted_initialization_is_completed_and_keeps_any_identity_already_stored(
    crash_after: int, identity_calls: int, expected_identity: str
) -> None:
    world = make_world(
        files=FakeDataHome(crash_after_creates=crash_after),
        randomness=SequenceRandomness((INSTALLATION_ID, OTHER_UUID)),
    )
    with pytest.raises(SimulatedCrash):
        initialize_store(world.runtime)
    assert len(world.files.creates) == crash_after
    world.files.crash_after_creates = None

    result = initialize_store(world.runtime)

    assert result.result == "created"
    assert world.files.creates[:crash_after] == CREATED_IN_ORDER[:crash_after]
    assert sorted(name for name, _ in world.files.creates) == sorted(name for name, _ in CREATED_IN_ORDER)
    identity: dict[str, Any] = json.loads(world.files.files["identity.json"].content)
    assert identity["installationId"] == expected_identity == result.installation_id
    assert world.randomness.uuid_calls == identity_calls
    assert world.randomness.key_calls == 1
    assert world.schema.applied


def test_an_interrupted_schema_creation_is_completed_by_the_next_initialization() -> None:
    world = make_world(schema=FakeSchema(crash=True))
    with pytest.raises(SimulatedCrash):
        initialize_store(world.runtime)
    assert world.files.creates == CREATED_IN_ORDER
    assert not world.schema.applied
    world.schema.crash = False

    result = initialize_store(world.runtime)

    assert result.result == "created"
    assert result.installation_id == INSTALLATION_ID
    assert world.files.creates == CREATED_IN_ORDER
    assert world.schema.applied


def test_a_missing_key_before_any_database_exists_is_recreated_under_the_same_identity() -> None:
    world = make_world(files=FakeDataHome(crash_after_creates=2))
    with pytest.raises(SimulatedCrash):
        initialize_store(world.runtime)
    del world.files.files["identity.key"]
    world.files.crash_after_creates = None

    result = initialize_store(world.runtime)

    assert result.result == "created"
    assert result.installation_id == INSTALLATION_ID
    assert world.files.files["identity.key"].content == bytes(range(32))
    assert world.randomness.uuid_calls == 1


@pytest.mark.parametrize("missing", ["identity.key", "identity.json", "config.json"])
def test_an_existing_database_without_its_companions_is_refused(missing: str) -> None:
    world = initialized_world()
    del world.files.files[missing]
    creates_before = list(world.files.creates)

    with pytest.raises(FerretError) as caught:
        initialize_store(world.runtime)

    assert caught.value.code == "ferret.storage.unavailable"
    assert caught.value.exit_code == 2
    assert world.files.creates == creates_before


@pytest.mark.parametrize(
    "content",
    [
        b"not json",
        b"[]",
        b'{"schemaVersion":"1.0","installationId":"00000000-0000-4000-8000-000000000002"}',
        b'{"schemaVersion":"1.0","installationId":"00000000-0000-4000-8000-000000000002",'
        b'"createdAt":"2026-09-18T08:00:00.000Z","extra":1}',
        b'{"schemaVersion":"2.0","installationId":"00000000-0000-4000-8000-000000000002",'
        b'"createdAt":"2026-09-18T08:00:00.000Z"}',
        b'{"schemaVersion":"1.0","installationId":"not-a-uuid","createdAt":"2026-09-18T08:00:00.000Z"}',
        b'{"schemaVersion":"1.0","installationId":"00000000-0000-1000-8000-000000000002",'
        b'"createdAt":"2026-09-18T08:00:00.000Z"}',
        b'{"schemaVersion":"1.0","installationId":"00000000-0000-4000-8000-000000000002","createdAt":"yesterday"}',
        b"\xff\xfe",
    ],
)
def test_an_invalid_identity_document_is_refused(content: bytes) -> None:
    world = initialized_world()
    world.files.files["identity.json"].content = content

    with pytest.raises(FerretError) as caught:
        initialize_store(world.runtime)

    assert caught.value.code == "ferret.storage.unavailable"


@pytest.mark.parametrize("key", [b"", b"short", bytes(31), bytes(33)])
def test_an_identity_key_of_the_wrong_length_is_refused(key: bytes) -> None:
    world = initialized_world()
    world.files.files["identity.key"].content = key

    with pytest.raises(FerretError) as caught:
        initialize_store(world.runtime)

    assert caught.value.code == "ferret.storage.unavailable"


@pytest.mark.parametrize(
    "content",
    [
        b"{}",
        b"nope",
        b'{"schemaVersion":"1.0","retentionDays":7,"maintenanceIntervalSeconds":3600}',
        b'{"schemaVersion":"1.0","retentionDays":30,"maintenanceIntervalSeconds":3600,"backend":"x"}',
    ],
)
def test_a_configuration_other_than_the_supported_one_is_refused(content: bytes) -> None:
    world = initialized_world()
    world.files.files["config.json"].content = content

    with pytest.raises(FerretError) as caught:
        initialize_store(world.runtime)

    assert caught.value.code == "ferret.storage.unavailable"
