"""Idempotent identity: an event ID is stored once, the same ID and hash is a duplicate, and anything else conflicts."""

from typekit import Err, Ok

from ferret.domain.identity import resolve_identity

HASH = "a" * 64
OTHER_HASH = "b" * 64


def test_an_unseen_event_id_is_inserted() -> None:
    assert resolve_identity(None, HASH) == Ok("insert")


def test_the_same_event_id_with_the_same_hash_is_a_duplicate() -> None:
    assert resolve_identity(HASH, HASH) == Ok("duplicate")


def test_the_same_event_id_with_a_different_hash_is_a_conflict_that_carries_no_hash() -> None:
    result = resolve_identity(HASH, OTHER_HASH)

    assert isinstance(result, Err)
    error = result.error
    assert (error.code, error.exit_code, error.field, error.retryable) == (
        "ferret.event.idempotency-conflict",
        2,
        None,
        False,
    )
    assert HASH not in str(error)
    assert OTHER_HASH not in str(error)


def test_a_hash_differing_only_in_its_last_character_still_conflicts() -> None:
    result = resolve_identity("a" * 63 + "b", "a" * 63 + "c")

    assert isinstance(result, Err)
    assert result.error.code == "ferret.event.idempotency-conflict"
