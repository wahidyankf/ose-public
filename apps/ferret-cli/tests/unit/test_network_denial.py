"""The network denial the standalone scenario relies on: it must refuse and record an attempt, and only while active.

The attempts are raised as the events the socket module itself raises, through ``sys.audit``, so a unit test never
imports the socket module (C12) and still exercises the same audit path a real connection would take.
"""

import sys

import pytest

from support.network import NetworkDeniedError, deny_network


def test_a_connection_attempt_is_refused_and_recorded() -> None:
    with deny_network() as attempts, pytest.raises(NetworkDeniedError):
        sys.audit("socket.connect", None, ("127.0.0.1", 9))

    assert attempts == ["socket.connect"]


def test_creating_a_socket_is_refused_before_it_can_connect() -> None:
    with deny_network() as attempts, pytest.raises(NetworkDeniedError):
        sys.audit("socket.__new__")

    assert attempts == ["socket.__new__"]


def test_a_name_lookup_is_refused_too() -> None:
    with deny_network() as attempts, pytest.raises(NetworkDeniedError):
        sys.audit("socket.getaddrinfo", "example.invalid", 443)

    assert attempts == ["socket.getaddrinfo"]


def test_a_program_that_uses_no_network_records_nothing() -> None:
    with deny_network() as attempts:
        assert sorted({"b": 1, "a": 2}) == ["a", "b"]

    assert attempts == []


def test_the_denial_ends_with_its_block(network_denied: list[str]) -> None:
    with deny_network() as inner:
        pass

    with pytest.raises(NetworkDeniedError):
        sys.audit("socket.__new__")

    assert inner == []
    # The unit suite's own denial is active around every test, so the attempt lands there and nowhere else.
    assert network_denied == ["socket.__new__"]
    network_denied.clear()


def test_denials_nest_and_each_records_only_its_own_attempts() -> None:
    with deny_network() as outer:
        with deny_network() as inner, pytest.raises(NetworkDeniedError):
            sys.audit("socket.getaddrinfo", "example.invalid", 443)
        with pytest.raises(NetworkDeniedError):
            sys.audit("socket.gethostbyname", "example.invalid")

    assert (inner, outer) == (["socket.getaddrinfo"], ["socket.gethostbyname"])
