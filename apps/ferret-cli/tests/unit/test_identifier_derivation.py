"""Opaque workspace and session identifiers: pinned vectors, and the properties that make them safe to store."""

import re

import pytest

from ferret.domain.identity import derive_identifier

KEY = bytes(range(32))
OTHER_KEY = bytes(reversed(range(32)))
WORKSPACE = "/users/example/work/repo-a"
SESSION = "native-session-0001"
SHAPE = re.compile(r"^(ws|ss)_[0-9a-f]{32}$")

# Computed independently of this module with HMAC-SHA256 over NUL-joined "ferret/id/1", the kind, and the parts.
WORKSPACE_VECTOR = "ws_044e17fb41c17fb6743c067020051d29"
CLAUDE_SESSION_VECTOR = "ss_1e06f01b971982866cc4ef07162d535b"
CODEX_SESSION_VECTOR = "ss_f75391cea8c462ebad8821b8acf47594"
UNICODE_WORKSPACE_VECTOR = "ws_9e08d4720c60b97d3eda75996c2acd8c"


def test_a_workspace_identifier_matches_its_pinned_vector() -> None:
    assert derive_identifier(KEY, "ws", WORKSPACE) == WORKSPACE_VECTOR


def test_session_identifiers_match_their_pinned_vectors_and_differ_by_harness() -> None:
    assert derive_identifier(KEY, "ss", "claude_code", SESSION) == CLAUDE_SESSION_VECTOR
    assert derive_identifier(KEY, "ss", "codex", SESSION) == CODEX_SESSION_VECTOR


def test_a_non_ascii_path_is_hashed_as_utf8() -> None:
    assert derive_identifier(KEY, "ws", "/users/example/café") == UNICODE_WORKSPACE_VECTOR


def test_the_same_inputs_always_give_the_same_identifier() -> None:
    assert derive_identifier(KEY, "ws", WORKSPACE) == derive_identifier(KEY, "ws", WORKSPACE)


@pytest.mark.parametrize(
    "identifier",
    [
        derive_identifier(KEY, "ws", WORKSPACE),
        derive_identifier(KEY, "ss", "codex", SESSION),
        derive_identifier(KEY, "ws", ""),
    ],
)
def test_an_identifier_has_the_shape_the_event_contract_requires(identifier: str) -> None:
    assert SHAPE.fullmatch(identifier) is not None


def test_a_different_installation_key_gives_a_different_identifier() -> None:
    assert derive_identifier(OTHER_KEY, "ws", WORKSPACE) != derive_identifier(KEY, "ws", WORKSPACE)


def test_the_kind_is_part_of_the_message_so_a_workspace_never_equals_a_session() -> None:
    workspace = derive_identifier(KEY, "ws", SESSION)
    session = derive_identifier(KEY, "ss", SESSION)

    assert workspace[3:] != session[3:]


def test_part_boundaries_matter_so_two_splits_of_the_same_text_differ() -> None:
    assert derive_identifier(KEY, "ss", "ab", "c") != derive_identifier(KEY, "ss", "a", "bc")


def test_the_harness_is_part_of_a_session_identifier() -> None:
    assert derive_identifier(KEY, "ss", "claude_code", SESSION) != derive_identifier(KEY, "ss", "opencode", SESSION)


def test_a_workspace_path_that_differs_by_one_character_gives_an_unrelated_identifier() -> None:
    first = derive_identifier(KEY, "ws", "/users/example/work/repo-a")
    second = derive_identifier(KEY, "ws", "/users/example/work/repo-b")

    assert first != second
    assert sum(left == right for left, right in zip(first[3:], second[3:], strict=True)) < 16
