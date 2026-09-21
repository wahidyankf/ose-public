"""The network denial the standalone scenario relies on: it must refuse and record an attempt, and only while active."""

import socket

import pytest

from support.network import NetworkDeniedError, deny_network


def test_a_connection_attempt_is_refused_and_recorded() -> None:
    with deny_network() as attempts, pytest.raises(NetworkDeniedError):
        socket.create_connection(("127.0.0.1", 9))

    assert attempts != []
    assert all(event.startswith("socket.") for event in attempts)


def test_creating_a_socket_is_refused_before_it_can_connect() -> None:
    with deny_network() as attempts, pytest.raises(NetworkDeniedError):
        socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    assert attempts == ["socket.__new__"]


def test_a_name_lookup_is_refused_too() -> None:
    with deny_network() as attempts, pytest.raises(NetworkDeniedError):
        socket.getaddrinfo("example.invalid", 443)

    assert attempts == ["socket.getaddrinfo"]


def test_a_program_that_uses_no_network_records_nothing() -> None:
    with deny_network() as attempts:
        assert sorted({"b": 1, "a": 2}) == ["a", "b"]

    assert attempts == []


def test_the_denial_ends_with_its_block() -> None:
    with deny_network():
        pass

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as unconnected:
        assert unconnected.fileno() >= 0


def test_denials_nest_and_each_records_only_its_own_attempts() -> None:
    with deny_network() as outer:
        with deny_network() as inner, pytest.raises(NetworkDeniedError):
            socket.getaddrinfo("example.invalid", 443)
        with pytest.raises(NetworkDeniedError):
            socket.gethostbyname("example.invalid")

    assert (inner, outer) == (["socket.getaddrinfo"], ["socket.gethostbyname"])
