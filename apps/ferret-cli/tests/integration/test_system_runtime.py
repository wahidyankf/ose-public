"""The system adapter: where the home directory and the data home come from, and what makes the runtime refuse."""

import io
import json
import pwd
from collections.abc import Callable, Sequence
from pathlib import Path

import pytest

from ferret import cli
from ferret.adapters import system
from ferret.adapters.filesystem import Mount
from ferret.adapters.system import home_directory, require_local, system_runtime
from ferret.commands import default_handlers
from support.results import refusal_of, value_of

LOCAL = [Mount(Path("/"), "ext4")]
NETWORK = [Mount(Path("/"), "nfs4")]
UNREADABLE: list[Mount] = []
STATUS = ["status", "--json"]
INIT = ["init", "--json"]
HOOK = ["capture-hook", "--harness", "claude_code", "--event", "tool.started"]
NO_HOME_IN_THE_ENVIRONMENT = pytest.mark.parametrize("environment", [{}, {"HOME": ""}], ids=["unset", "empty"])
NOT_KNOWN_TO_BE_LOCAL = pytest.mark.parametrize(
    "table", [NETWORK, UNREADABLE], ids=["a-network-filesystem", "an-unreadable-mount-table"]
)
UNAVAILABLE = {
    "code": "ferret.storage.unavailable",
    "message": "storage is unavailable",
    "field": None,
    "retryable": False,
}
UNSAFE = {
    "code": "ferret.storage.unsafe",
    "message": "the data home is not private to the current user",
    "field": None,
    "retryable": False,
}


def unknown_account(monkeypatch: pytest.MonkeyPatch) -> None:
    """Make the account database lack this process's user, as it can in a container run as an arbitrary user ID."""

    def missing(uid: int) -> pwd.struct_passwd:
        raise KeyError(f"getpwuid(): uid not found: {uid}")

    monkeypatch.setattr(pwd, "getpwuid", missing)


def known_account(monkeypatch: pytest.MonkeyPatch, home: str) -> None:
    """Make the account database hold this process's user, with ``home`` as the home directory."""

    def found(uid: int) -> pwd.struct_passwd:
        return pwd.struct_passwd(("someone", "x", uid, uid, "", home, "/bin/sh"))

    monkeypatch.setattr(pwd, "getpwuid", found)


def mounted(monkeypatch: pytest.MonkeyPatch, table: list[Mount]) -> None:
    """Make the platform report ``table`` as its mounted filesystems."""
    monkeypatch.setattr(system, "mount_table", lambda: table)


def invoke(argv: Sequence[str]) -> tuple[int, str, str]:
    """Run one command in process over the real ports, which read their environment from the process."""
    stdout, stderr = io.StringIO(), io.StringIO()
    code = cli.main(list(argv), stdout=stdout, stderr=stderr, handlers=default_handlers())
    return code, stdout.getvalue(), stderr.getvalue()


def error_of(stderr: str) -> object:
    """The ``error`` object of a failure envelope."""
    return json.loads(stderr)["error"]


@NO_HOME_IN_THE_ENVIRONMENT
def test_an_unset_or_empty_home_is_the_account_databases(
    monkeypatch: pytest.MonkeyPatch, environment: dict[str, str]
) -> None:
    known_account(monkeypatch, "/home/someone")

    assert value_of(home_directory(environment)) == Path("/home/someone")


def test_the_home_the_environment_names_outranks_the_account_database(monkeypatch: pytest.MonkeyPatch) -> None:
    known_account(monkeypatch, "/home/someone")

    assert value_of(home_directory({"HOME": "/srv/other"})) == Path("/srv/other")


@NO_HOME_IN_THE_ENVIRONMENT
def test_a_home_no_account_database_knows_is_unavailable_storage(
    monkeypatch: pytest.MonkeyPatch, environment: dict[str, str]
) -> None:
    unknown_account(monkeypatch)

    refusal = refusal_of(home_directory(environment))

    assert (refusal.code, refusal.exit_code, refusal.retryable) == ("ferret.storage.unavailable", 2, False)


def test_a_data_home_on_a_local_filesystem_is_accepted(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    mounted(monkeypatch, LOCAL)

    assert value_of(require_local(tmp_path / "data")) == tmp_path / "data"


@NOT_KNOWN_TO_BE_LOCAL
def test_a_data_home_not_known_to_be_local_is_unsafe(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, table: list[Mount]
) -> None:
    mounted(monkeypatch, table)

    refusal = refusal_of(require_local(tmp_path / "data"))

    assert (refusal.code, refusal.exit_code, refusal.retryable) == ("ferret.storage.unsafe", 2, False)


def test_the_runtime_keeps_its_data_home_under_the_home_directory(tmp_path: Path) -> None:
    runtime = value_of(system_runtime({"HOME": str(tmp_path)}))

    assert runtime.data_home == tmp_path / ".local" / "share" / "ferret"


def test_a_named_data_home_on_a_local_filesystem_is_the_runtimes(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    mounted(monkeypatch, LOCAL)
    named = tmp_path / "named"

    runtime = value_of(system_runtime({"HOME": str(tmp_path), "FERRET_DATA_HOME": str(named)}))

    assert runtime.data_home == named


@NOT_KNOWN_TO_BE_LOCAL
def test_a_named_data_home_not_known_to_be_local_refuses_the_runtime(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, table: list[Mount]
) -> None:
    mounted(monkeypatch, table)

    refusal = refusal_of(system_runtime({"HOME": str(tmp_path), "FERRET_DATA_HOME": str(tmp_path / "named")}))

    assert refusal.code == "ferret.storage.unsafe"


def test_an_unsafe_override_refuses_the_runtime(tmp_path: Path) -> None:
    refusal = refusal_of(system_runtime({"HOME": str(tmp_path), "FERRET_DATA_HOME": "relative/data"}))

    assert refusal.code == "ferret.storage.unsafe"


def test_a_runtime_with_no_home_to_be_found_is_unavailable_storage(monkeypatch: pytest.MonkeyPatch) -> None:
    unknown_account(monkeypatch)

    assert refusal_of(system_runtime({})).code == "ferret.storage.unavailable"


def test_a_home_nobody_can_name_answers_unavailable_storage(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("HOME", "")
    unknown_account(monkeypatch)

    code, stdout, stderr = invoke(STATUS)

    assert (code, stdout, error_of(stderr)) == (2, "", UNAVAILABLE)


def test_the_home_is_resolved_before_the_override_is_judged(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("HOME", "")
    monkeypatch.setenv("FERRET_DATA_HOME", "relative/data")
    unknown_account(monkeypatch)

    code, stdout, stderr = invoke(STATUS)

    assert (code, stdout, error_of(stderr)) == (2, "", UNAVAILABLE)


def test_a_relative_override_answers_unsafe_storage(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("FERRET_DATA_HOME", "relative/data")

    code, stdout, stderr = invoke(STATUS)

    assert (code, stdout, error_of(stderr)) == (2, "", UNSAFE)


@NOT_KNOWN_TO_BE_LOCAL
def test_an_override_not_known_to_be_local_answers_unsafe_storage_and_creates_nothing(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, table: list[Mount]
) -> None:
    mounted(monkeypatch, table)
    monkeypatch.setenv("FERRET_DATA_HOME", str(tmp_path / "data"))

    code, stdout, stderr = invoke(INIT)

    assert (code, stdout, error_of(stderr)) == (2, "", UNSAFE)
    assert list(tmp_path.iterdir()) == []


def test_a_legacy_data_home_is_adopted_when_ferret_chose_the_location(isolated_home: Path) -> None:
    legacy = isolated_home / ".ferret"
    legacy.mkdir(mode=0o700)
    (legacy / "marker").write_text("kept", encoding="utf-8")
    adopted = isolated_home / ".local" / "share" / "ferret"

    code, stdout, stderr = invoke(INIT)

    assert (code, stderr, json.loads(stdout)["dataHome"]) == (0, "", str(adopted))
    assert not legacy.exists()
    assert (adopted / "marker").read_text(encoding="utf-8") == "kept"


def test_a_legacy_data_home_is_left_alone_when_the_caller_named_the_location(
    tmp_path: Path, isolated_home: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    legacy = isolated_home / ".ferret"
    legacy.mkdir(mode=0o700)
    named = tmp_path / "named"
    monkeypatch.setenv("FERRET_DATA_HOME", str(named))

    code, stdout, stderr = invoke(INIT)

    assert (code, stderr, json.loads(stdout)["dataHome"]) == (0, "", str(named))
    assert legacy.is_dir()
    assert not (isolated_home / ".local").exists()


def relative_override(monkeypatch: pytest.MonkeyPatch, root: Path) -> None:
    monkeypatch.setenv("FERRET_DATA_HOME", "relative/data")


def network_override(monkeypatch: pytest.MonkeyPatch, root: Path) -> None:
    mounted(monkeypatch, NETWORK)
    monkeypatch.setenv("FERRET_DATA_HOME", str(root / "data"))


def nameless_home(monkeypatch: pytest.MonkeyPatch, root: Path) -> None:
    monkeypatch.setenv("HOME", "")
    unknown_account(monkeypatch)


@pytest.mark.parametrize(
    "arrange",
    [relative_override, network_override, nameless_home],
    ids=["an-unsafe-override", "an-override-on-a-network-filesystem", "a-home-nobody-can-name"],
)
def test_the_capture_hook_stays_silent_and_writes_nothing_when_the_runtime_cannot_be_built(
    tmp_path: Path,
    isolated_home: Path,
    monkeypatch: pytest.MonkeyPatch,
    arrange: Callable[[pytest.MonkeyPatch, Path], None],
) -> None:
    arrange(monkeypatch, tmp_path)

    assert invoke(HOOK) == (0, "", "")
    assert list(isolated_home.iterdir()) == []
    assert list(tmp_path.iterdir()) == []


def test_a_usage_mistake_in_the_callback_is_silent_even_when_no_home_can_be_named(
    isolated_home: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("HOME", "")
    unknown_account(monkeypatch)
    stdout, stderr = io.StringIO(), io.StringIO()

    code = cli.main(["capture-hook"], stdout=stdout, stderr=stderr, handlers={})

    assert (code, stdout.getvalue(), stderr.getvalue()) == (0, "", "")
    assert list(isolated_home.iterdir()) == []
