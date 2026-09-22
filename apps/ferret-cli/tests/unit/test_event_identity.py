"""Idempotent identity: an event ID is stored once, the same ID and hash is a duplicate, and anything else conflicts."""

import pytest

from ferret.domain.errors import FerretError
from ferret.domain.identity import resolve_identity

HASH = "a" * 64
OTHER_HASH = "b" * 64


def test_an_unseen_event_id_is_inserted() -> None:
    assert resolve_identity(None, HASH) == "insert"


def test_the_same_event_id_with_the_same_hash_is_a_duplicate() -> None:
    assert resolve_identity(HASH, HASH) == "duplicate"


def test_the_same_event_id_with_a_different_hash_is_a_conflict_that_carries_no_hash() -> None:
    with pytest.raises(FerretError) as caught:
        resolve_identity(HASH, OTHER_HASH)

    error = caught.value
    assert (error.code, error.exit_code, error.field, error.retryable) == (
        "ferret.event.idempotency-conflict",
        2,
        None,
        False,
    )
    assert HASH not in str(error)
    assert OTHER_HASH not in str(error)


def test_a_hash_differing_only_in_its_last_character_still_conflicts() -> None:
    with pytest.raises(FerretError) as caught:
        resolve_identity("a" * 63 + "b", "a" * 63 + "c")

    assert caught.value.code == "ferret.event.idempotency-conflict"
