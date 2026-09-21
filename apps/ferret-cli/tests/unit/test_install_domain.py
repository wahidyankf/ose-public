"""The install layout and the manifest rules: where each object lives, and what a manifest must be to be trusted."""

import json
from pathlib import Path
from typing import Any

import pytest

from ferret.domain.install import (
    ARTIFACT_MODE,
    DIRECTORY_MODE,
    MANIFEST_MEMBERS,
    MANIFEST_MODE,
    InstallPaths,
    Manifest,
    is_ferret_artifact_path,
    is_stage_name,
    is_version,
    on_path,
    parse_manifest,
    path_action,
    stage_name,
)

HOME = Path("/users/example")
PATHS = InstallPaths(HOME)
DIGEST = "5af9c9b721982f278c9c61c8f402055711b17621f63b25f671bda1eff9db0eb3"
MANIFEST = Manifest(
    version="0.1.0",
    artifact_path=PATHS.artifact("0.1.0"),
    artifact_sha256=DIGEST,
    launcher_path=PATHS.launcher,
    installed_at="2026-09-18T08:00:00.000Z",
)


def document(**changes: Any) -> dict[str, Any]:
    fields: dict[str, Any] = json.loads(MANIFEST.to_bytes())
    fields.update(changes)
    return fields


def encoded(fields: dict[str, Any]) -> bytes:
    return json.dumps(fields, separators=(",", ":")).encode()


def test_every_object_lives_where_the_contract_puts_it() -> None:
    assert PATHS.share == HOME / ".local" / "share" / "ferret"
    assert PATHS.bin == HOME / ".local" / "bin"
    assert PATHS.launcher == HOME / ".local" / "bin" / "ferret"
    assert PATHS.manifest == HOME / ".local" / "share" / "ferret" / "install.json"
    assert PATHS.version_directory("0.1.0") == HOME / ".local" / "share" / "ferret" / "0.1.0"
    assert PATHS.artifact("0.1.0") == HOME / ".local" / "share" / "ferret" / "0.1.0" / "ferret.pyz"


def test_the_modes_are_owner_only() -> None:
    assert (DIRECTORY_MODE, ARTIFACT_MODE, MANIFEST_MODE) == (0o700, 0o700, 0o600)


@pytest.mark.parametrize("version", ["0.1.0", "10.20.30", "1.0.0-rc.1", "1.0.0+build.5"])
def test_a_semantic_version_names_a_directory(version: str) -> None:
    assert is_version(version)


@pytest.mark.parametrize(
    "version", ["", "1.0", "v1.0.0", "1.0.0/../x", "../1.0.0", "1.0.0 ", "1.0.0\n", "a.b.c", "1.0.0-"]
)
def test_anything_else_is_not_a_version(version: str) -> None:
    assert not is_version(version)


def test_the_manifest_bytes_follow_the_normative_order() -> None:
    assert MANIFEST.to_bytes() == (
        b'{"schemaVersion":"1.0","version":"0.1.0",'
        b'"artifactPath":"/users/example/.local/share/ferret/0.1.0/ferret.pyz",'
        b'"artifactSha256":"5af9c9b721982f278c9c61c8f402055711b17621f63b25f671bda1eff9db0eb3",'
        b'"launcherPath":"/users/example/.local/bin/ferret","installedAt":"2026-09-18T08:00:00.000Z"}\n'
    )
    assert tuple(json.loads(MANIFEST.to_bytes())) == MANIFEST_MEMBERS


def test_a_manifest_reads_back_as_written() -> None:
    assert parse_manifest(MANIFEST.to_bytes(), PATHS) == MANIFEST


def test_whitespace_between_tokens_is_not_significant() -> None:
    assert parse_manifest(json.dumps(document(), indent=2).encode(), PATHS) == MANIFEST


DUPLICATE = MANIFEST.to_bytes().replace(b'"version":"0.1.0",', b'"version":"0.1.0","version":"0.1.0",')
REORDERED = encoded({name: document()[name] for name in reversed(MANIFEST_MEMBERS)})


@pytest.mark.parametrize(
    "content",
    [
        pytest.param(b"", id="empty"),
        pytest.param(b"{", id="malformed"),
        pytest.param(b"\xff\xfe", id="not utf-8"),
        pytest.param(b"[]", id="not an object"),
        pytest.param(DUPLICATE, id="duplicate member"),
        pytest.param(REORDERED, id="wrong property order"),
        pytest.param(encoded({**document(), "extra": "member"}), id="unknown member"),
        pytest.param(encoded({name: document()[name] for name in MANIFEST_MEMBERS[:-1]}), id="missing member"),
        pytest.param(encoded(document(schemaVersion="2.0")), id="other schema version"),
        pytest.param(encoded(document(version="1.0")), id="malformed version"),
        pytest.param(encoded(document(version=1)), id="non-text member"),
        pytest.param(encoded(document(artifactSha256=DIGEST.upper())), id="uppercase digest"),
        pytest.param(encoded(document(artifactSha256=DIGEST[:-1])), id="short digest"),
        pytest.param(encoded(document(installedAt="yesterday")), id="unparseable time"),
        pytest.param(encoded(document(installedAt="2026-09-18T08:00:00Z")), id="non-canonical time"),
        pytest.param(encoded(document(artifactPath="/etc/passwd")), id="artifact outside the install area"),
        pytest.param(
            encoded(document(artifactPath="/users/example/.local/share/ferret/0.2.0/ferret.pyz")),
            id="other version's artifact",
        ),
        pytest.param(encoded(document(launcherPath="/usr/local/bin/ferret")), id="launcher elsewhere"),
    ],
)
def test_anything_but_the_closed_manifest_for_these_paths_is_refused(content: bytes) -> None:
    with pytest.raises(ValueError, match="manifest"):
        parse_manifest(content, PATHS)


def test_a_manifest_for_another_home_is_refused() -> None:
    with pytest.raises(ValueError, match="manifest"):
        parse_manifest(MANIFEST.to_bytes(), InstallPaths(Path("/users/other")))


@pytest.mark.parametrize(
    ("variable", "expected"),
    [
        ("/usr/bin:/users/example/.local/bin:/bin", "none"),
        ("/users/example/.local/bin", "none"),
        ("/usr/bin:/users/example/.local/bin/:/bin", "none"),
        ("/usr/bin:/users/example/./.local/bin", "none"),
        ("/usr/bin:/bin", "add_home_local_bin"),
        ("", "add_home_local_bin"),
        ("/usr/bin::/bin", "add_home_local_bin"),
        (".local/bin", "add_home_local_bin"),
        ("/users/example/.local/bin2:/users/example/.local", "add_home_local_bin"),
    ],
)
def test_the_path_action_says_whether_the_user_bin_directory_is_already_on_path(variable: str, expected: str) -> None:
    assert path_action(variable, PATHS.bin) == expected
    assert on_path(variable, PATHS.bin) == (expected == "none")


def test_a_staged_name_sits_beside_its_final_name_and_carries_a_nonce() -> None:
    nonce = "0123456789abcdef0123456789abcdef"

    assert stage_name("ferret.pyz", nonce) == ".ferret.pyz.stage-0123456789abcdef0123456789abcdef"
    assert is_stage_name(stage_name("ferret.pyz", nonce), "ferret.pyz")


@pytest.mark.parametrize(
    ("name", "final"),
    [
        ("ferret.pyz", "ferret.pyz"),
        (".ferret.pyz.stage-", "ferret.pyz"),
        (".ferret.pyz.stage-0123", "ferret.pyz"),
        (".ferret.pyz.stage-0123456789ABCDEF0123456789ABCDEF", "ferret.pyz"),
        (".ferret.pyz.stage-0123456789abcdef0123456789abcdef0", "ferret.pyz"),
        (".ferret.stage-0123456789abcdef0123456789abcdef", "ferret.pyz"),
        (".ferret.pyz.stage-0123456789abcdef0123456789abcdef.bak", "ferret.pyz"),
    ],
)
def test_no_other_name_is_a_staged_name(name: str, final: str) -> None:
    assert not is_stage_name(name, final)


@pytest.mark.parametrize(
    "target",
    [
        "/users/example/.local/share/ferret/0.1.0/ferret.pyz",
        "/users/example/.local/share/ferret/0.0.9/ferret.pyz",
        "/users/example/.local/share/ferret/1.0.0-rc.1/ferret.pyz",
    ],
)
def test_a_path_shaped_like_an_installed_artifact_is_recognised(target: str) -> None:
    assert is_ferret_artifact_path(target, PATHS)


@pytest.mark.parametrize(
    "target",
    [
        "",
        "ferret.pyz",
        "/usr/local/bin/ferret",
        "/users/example/.local/share/ferret/ferret.pyz",
        "/users/example/.local/share/ferret/0.1.0/other.pyz",
        "/users/example/.local/share/ferret/latest/ferret.pyz",
        "/users/example/.local/share/ferret/0.1.0/nested/ferret.pyz",
        "/users/other/.local/share/ferret/0.1.0/ferret.pyz",
        "/users/example/.local/share/ferret/../ferret/0.1.0/ferret.pyz",
    ],
)
def test_any_other_path_is_not(target: str) -> None:
    assert not is_ferret_artifact_path(target, PATHS)
