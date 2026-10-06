"""The data-home checks every persistent command makes: a refusal is a returned value that names its closed code."""

import json
from dataclasses import replace
from typing import Literal

import pytest
from typekit import Ok

from ferret.application.ports import FileFacts
from ferret.application.store import (
    ARTIFACTS,
    installation_id_from,
    read_document,
    read_key,
    require_initialized,
    require_safe,
)
from ferret.domain.errors import ErrorCode, FerretError
from ferret.domain.storage import CONFIG_FILE, IDENTITY_FILE, KEY_BYTES, KEY_FILE
from support.fakes import INSTALLATION_ID, Entry, make_world
from support.hook_payloads import CLAUDE_CODE, claude_tool, encode
from support.invoke import run_cli
from support.populate import world_with
from support.results import refusal_of

type Expected = Literal["file", "directory"]

PRIVATE_FILE = FileFacts(kind="file", mode=0o600)
PRIVATE_DIRECTORY = FileFacts(kind="directory", mode=0o700)
IDENTITY = {"schemaVersion": "1.0", "installationId": INSTALLATION_ID, "createdAt": "2026-09-18T08:00:00.000Z"}
# Nested deeper than the interpreter reads, so parsing it raises ``RecursionError`` rather than ``ValueError``.
NESTED_PAST_THE_LIMIT = b"[" * 100_000
# A failure no check of this module produces, so seeing this very object come back shows the check passed it on.
THE_DATA_HOME_FAILED = FerretError("ferret.storage.unavailable", retryable=True)


def assert_closed(error: FerretError, code: ErrorCode) -> None:
    """``error`` is the refusal ``code``, which no data-home check ever gives a field."""
    assert (error.code, error.exit_code, error.field, error.retryable) == (code, 2, None, False)


@pytest.mark.parametrize(
    ("facts", "expected"),
    [
        pytest.param(FileFacts(kind="missing"), "file", id="a-missing-file"),
        pytest.param(FileFacts(kind="missing"), "directory", id="a-missing-directory"),
        pytest.param(PRIVATE_FILE, "file", id="a-private-file"),
        pytest.param(PRIVATE_DIRECTORY, "directory", id="a-private-directory"),
        pytest.param(replace(PRIVATE_DIRECTORY, link_count=3), "directory", id="a-directory-with-links"),
    ],
)
def test_a_missing_or_private_object_of_the_expected_kind_is_safe(facts: FileFacts, expected: Expected) -> None:
    assert require_safe(facts, expected) == Ok(None)


@pytest.mark.parametrize(
    ("facts", "expected"),
    [
        pytest.param(PRIVATE_DIRECTORY, "file", id="a-directory-where-a-file-belongs"),
        pytest.param(PRIVATE_FILE, "directory", id="a-file-where-a-directory-belongs"),
        pytest.param(FileFacts(kind="symlink", mode=0o600), "file", id="a-symlink"),
        pytest.param(replace(PRIVATE_FILE, mode=0o640), "file", id="a-file-open-to-the-group"),
        pytest.param(replace(PRIVATE_DIRECTORY, mode=0o707), "directory", id="a-directory-open-to-others"),
        pytest.param(replace(PRIVATE_FILE, owned_by_current_user=False), "file", id="a-file-owned-by-another-user"),
        pytest.param(replace(PRIVATE_FILE, link_count=2), "file", id="a-file-with-a-second-link"),
    ],
)
def test_anything_else_is_refused_as_unsafe_storage(facts: FileFacts, expected: Expected) -> None:
    assert_closed(refusal_of(require_safe(facts, expected)), "ferret.storage.unsafe")


def test_an_initialized_data_home_is_usable() -> None:
    assert require_initialized(world_with().files) == Ok(None)


def test_a_data_home_with_no_directory_is_uninitialized() -> None:
    error = refusal_of(require_initialized(world_with(initialized=False).files))

    assert_closed(error, "ferret.storage.uninitialized")


@pytest.mark.parametrize("missing", ARTIFACTS)
def test_a_data_home_missing_any_artifact_is_uninitialized(missing: str) -> None:
    world = world_with()
    del world.files.files[missing]

    assert_closed(refusal_of(require_initialized(world.files)), "ferret.storage.uninitialized")


def test_an_unsafe_directory_is_reported_as_unsafe_before_anything_in_it_is_read() -> None:
    world = make_world()
    world.files.directory = Entry(kind="directory", mode=0o755)

    assert_closed(refusal_of(require_initialized(world.files)), "ferret.storage.unsafe")
    assert world.files.touched == [""]


def test_an_unsafe_artifact_is_reported_as_unsafe_rather_than_as_a_missing_one() -> None:
    world = world_with()
    del world.files.files[CONFIG_FILE]
    world.files.files[KEY_FILE].mode = 0o644

    assert_closed(refusal_of(require_initialized(world.files)), "ferret.storage.unsafe")


@pytest.mark.parametrize("looked_up", ["", *ARTIFACTS], ids=lambda name: name or "the-directory")
def test_a_lookup_the_data_home_fails_ends_the_check_with_that_failure_and_looks_up_nothing_further(
    looked_up: str,
) -> None:
    world = world_with()
    world.files.refusals[f"facts:{looked_up}"] = THE_DATA_HOME_FAILED

    assert refusal_of(require_initialized(world.files)) is THE_DATA_HOME_FAILED

    looked_before_and_at = [""] if not looked_up else ["", *ARTIFACTS[: ARTIFACTS.index(looked_up) + 1]]
    assert world.files.touched[-len(looked_before_and_at) :] == looked_before_and_at


def test_a_key_the_data_home_cannot_read_is_that_failure() -> None:
    world = world_with()
    world.files.refusals[f"read_file:{KEY_FILE}"] = THE_DATA_HOME_FAILED

    assert refusal_of(read_key(world.files)) is THE_DATA_HOME_FAILED


def test_a_stored_document_is_the_object_it_holds() -> None:
    assert read_document(b'{"a":[1,{"b":null}]}') == Ok({"a": [1, {"b": None}]})


@pytest.mark.parametrize(
    "content",
    [b"", b"not json", b'{"a":', b"[]", b"7", b'"text"', b"null", b"\xff\xfe", b'{"a":1} {}'],
)
def test_a_stored_document_that_is_not_an_object_is_unavailable_storage(content: bytes) -> None:
    assert_closed(refusal_of(read_document(content)), "ferret.storage.unavailable")


def test_a_stored_document_nested_past_the_limit_is_still_raised_not_refused() -> None:
    # Only a ``ValueError`` is a refusal here, as the ``except`` this replaced named only that. A deeper document has
    # always escaped to the caller's last resort, and the two tests below pin the code each last resort gives it.
    with pytest.raises(RecursionError):
        read_document(NESTED_PAST_THE_LIMIT)


def test_a_stored_configuration_nested_past_the_limit_is_answered_by_the_main_last_resort() -> None:
    world = world_with()
    world.files.files[CONFIG_FILE].content = NESTED_PAST_THE_LIMIT

    ran = run_cli(world, ["init", "--json"])

    assert (ran.code, ran.stdout) == (2, "")
    assert json.loads(ran.stderr)["error"]["code"] == "ferret.storage.unavailable"


def test_a_stored_identity_nested_past_the_limit_is_recorded_by_the_hook_as_an_internal_failure() -> None:
    world = world_with()
    world.input.data = encode(claude_tool("PreToolUse"))
    world.files.files[IDENTITY_FILE].content = NESTED_PAST_THE_LIMIT

    ran = run_cli(world, ["capture-hook", "--harness", CLAUDE_CODE, "--event", "tool.started"])

    assert (ran.code, ran.stdout, ran.stderr) == (0, "", "")
    assert world.hook_failures.codes() == ["ferret.internal.failure"]


def identity_bytes(**changes: object) -> bytes:
    return json.dumps({**IDENTITY, **changes}).encode()


def test_the_installation_id_is_the_one_a_well_formed_identity_document_holds() -> None:
    assert installation_id_from(identity_bytes()) == Ok(INSTALLATION_ID)


@pytest.mark.parametrize(
    "content",
    [
        pytest.param(b"not json", id="not-json"),
        pytest.param(b"[]", id="not-an-object"),
        pytest.param(b"\xff\xfe", id="not-utf-8"),
        pytest.param(json.dumps({"schemaVersion": "1.0", "installationId": INSTALLATION_ID}).encode(), id="missing"),
        pytest.param(identity_bytes(extra=1), id="extra-member"),
        pytest.param(identity_bytes(schemaVersion="2.0"), id="other-schema-version"),
        pytest.param(identity_bytes(installationId="not-a-uuid"), id="not-a-uuid"),
        pytest.param(identity_bytes(installationId="00000000-0000-1000-8000-000000000002"), id="not-version-4"),
        pytest.param(identity_bytes(installationId=7), id="not-text"),
        pytest.param(identity_bytes(createdAt="yesterday"), id="not-a-timestamp"),
        pytest.param(identity_bytes(createdAt="2026-09-18T08:00:00Z"), id="not-the-canonical-timestamp"),
        pytest.param(identity_bytes(createdAt="2026-02-30T08:00:00.000Z"), id="a-moment-that-cannot-exist"),
    ],
)
def test_an_identity_document_that_is_not_exactly_well_formed_is_unavailable_storage(content: bytes) -> None:
    assert_closed(refusal_of(installation_id_from(content)), "ferret.storage.unavailable")


def test_the_installation_key_is_the_file_when_it_has_exactly_the_key_length() -> None:
    assert read_key(world_with().files) == Ok(bytes(range(KEY_BYTES)))


@pytest.mark.parametrize("key", [b"", b"short", bytes(KEY_BYTES - 1), bytes(KEY_BYTES + 1)])
def test_an_installation_key_of_any_other_length_is_unavailable_storage(key: bytes) -> None:
    world = world_with()
    world.files.files[KEY_FILE].content = key

    assert_closed(refusal_of(read_key(world.files)), "ferret.storage.unavailable")
