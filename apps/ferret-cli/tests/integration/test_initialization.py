"""Initialization against a real temporary home: real modes, real SQLite, and real cross-process convergence."""

import json
import os
import sqlite3
import stat
import subprocess
import sys
from pathlib import Path

import pytest

from ferret.adapters.system import system_runtime
from ferret.application.initialization import InitResult, initialize_store
from ferret.domain.errors import FerretError

SOURCE = Path(__file__).resolve().parents[2] / "src"
ARTIFACTS = ["config.json", "ferret.lock", "ferret.sqlite3", "identity.json", "identity.key"]
PROCESS_COUNT = 6
RUNNER = (
    "import sys; sys.path.insert(0, sys.argv[1]); from ferret.cli import main; "
    "raise SystemExit(main(['init', '--json']))"
)


def make_home(tmp_path: Path) -> Path:
    home = tmp_path / "home"
    home.mkdir(mode=0o700)
    return home


def mode_of(path: Path) -> int:
    return stat.S_IMODE(path.lstat().st_mode)


def initialize(home: Path, **environment: str) -> InitResult:
    return initialize_store(system_runtime({"HOME": str(home), **environment}))


def test_two_repository_init_converges(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    home = make_home(tmp_path)
    repositories = [tmp_path / "work" / "repo-a", tmp_path / "work" / "repo-b"]
    for repository in repositories:
        repository.mkdir(parents=True)
    results: list[InitResult] = []
    for repository in repositories:
        monkeypatch.chdir(repository)
        results.append(initialize(home))
    first, second = results
    data_home = home / ".local" / "share" / "ferret"

    assert first.data_home == second.data_home == data_home
    assert first.database_path == second.database_path == data_home / "ferret.sqlite3"
    assert (first.result, second.result) == ("created", "already_initialized")
    assert sorted(path.name for path in data_home.iterdir()) == ARTIFACTS
    assert mode_of(data_home) == 0o700
    assert {path.name: mode_of(path) for path in data_home.iterdir()} == dict.fromkeys(ARTIFACTS, 0o600)
    identity = json.loads((data_home / "identity.json").read_text(encoding="utf-8"))
    assert identity["installationId"] == first.installation_id == second.installation_id
    assert len((data_home / "identity.key").read_bytes()) == 32
    with sqlite3.connect(data_home / "ferret.sqlite3") as connection:
        migrations = connection.execute("SELECT version FROM schema_migration ORDER BY version").fetchall()
    assert migrations == [(first.schema_number,)]
    assert all(not any(repository.iterdir()) for repository in repositories)


def test_a_permissive_umask_never_widens_a_created_artifact(tmp_path: Path) -> None:
    home = make_home(tmp_path)
    previous = os.umask(0)
    try:
        initialize(home)
    finally:
        os.umask(previous)
    data_home = home / ".local" / "share" / "ferret"

    assert mode_of(data_home) == 0o700
    assert {path.name: mode_of(path) for path in data_home.iterdir()} == dict.fromkeys(ARTIFACTS, 0o600)


def test_the_data_home_override_relocates_the_store(tmp_path: Path) -> None:
    home = make_home(tmp_path)
    relocated = tmp_path / "relocated"

    result = initialize(home, FERRET_DATA_HOME=str(relocated))

    assert result.data_home == relocated
    assert sorted(path.name for path in relocated.iterdir()) == ARTIFACTS
    assert not (home / ".local" / "share" / "ferret").exists()


def test_concurrent_initializations_converge_on_one_identity(tmp_path: Path) -> None:
    home = make_home(tmp_path)
    environment = {"HOME": str(home), "PATH": "/usr/bin:/bin"}
    processes = [
        subprocess.Popen(
            [sys.executable, "-c", RUNNER, str(SOURCE)],
            env=environment,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        for _ in range(PROCESS_COUNT)
    ]
    outcomes = [(process.communicate(), process.returncode) for process in processes]

    assert [code for _, code in outcomes] == [0] * PROCESS_COUNT
    assert all(stderr == b"" for (_, stderr), _ in outcomes)
    documents = [json.loads(stdout) for (stdout, _), _ in outcomes]
    assert sorted(document["result"] for document in documents) == ["already_initialized"] * (PROCESS_COUNT - 1) + [
        "created"
    ]
    assert len({document["installationId"] for document in documents}) == 1
    data_home = home / ".local" / "share" / "ferret"
    identity = json.loads((data_home / "identity.json").read_text(encoding="utf-8"))
    assert identity["installationId"] == documents[0]["installationId"]
    with sqlite3.connect(data_home / "ferret.sqlite3") as connection:
        assert connection.execute("SELECT COUNT(*) FROM schema_migration").fetchone() == (1,)


def test_a_symlinked_data_home_is_refused(tmp_path: Path) -> None:
    home = make_home(tmp_path)
    elsewhere = tmp_path / "elsewhere"
    elsewhere.mkdir(mode=0o700)
    (home / ".local" / "share").mkdir(parents=True, mode=0o700)
    (home / ".local" / "share" / "ferret").symlink_to(elsewhere)

    with pytest.raises(FerretError) as caught:
        initialize(home)

    assert caught.value.code == "ferret.storage.unsafe"
    assert list(elsewhere.iterdir()) == []


def test_a_group_readable_data_home_is_refused_and_left_unchanged(tmp_path: Path) -> None:
    home = make_home(tmp_path)
    data_home = home / ".local" / "share" / "ferret"
    data_home.parent.mkdir(parents=True, mode=0o700)
    data_home.mkdir(mode=0o750)
    data_home.chmod(0o750)

    with pytest.raises(FerretError) as caught:
        initialize(home)

    assert caught.value.code == "ferret.storage.unsafe"
    assert mode_of(data_home) == 0o750
    assert list(data_home.iterdir()) == []


@pytest.mark.parametrize("victim", ["identity.key", "identity.json", "config.json", "ferret.sqlite3"])
def test_an_existing_widened_or_linked_artifact_is_refused_and_not_repaired(tmp_path: Path, victim: str) -> None:
    home = make_home(tmp_path)
    initialize(home)
    target = home / ".local" / "share" / "ferret" / victim
    target.chmod(0o644)

    with pytest.raises(FerretError) as widened:
        initialize(home)
    target.chmod(0o600)
    os.link(target, tmp_path / "second-name")
    with pytest.raises(FerretError) as linked:
        initialize(home)

    assert widened.value.code == linked.value.code == "ferret.storage.unsafe"
    assert mode_of(target) == 0o600


def test_a_lock_file_replaced_by_a_symlink_is_refused(tmp_path: Path) -> None:
    home = make_home(tmp_path)
    data_home = home / ".local" / "share" / "ferret"
    data_home.parent.mkdir(parents=True, mode=0o700)
    data_home.mkdir(mode=0o700)
    victim = tmp_path / "victim"
    victim.write_text("keep", encoding="utf-8")
    (data_home / "ferret.lock").symlink_to(victim)

    with pytest.raises(FerretError) as caught:
        initialize(home)

    assert caught.value.code == "ferret.storage.unsafe"
    assert victim.read_text(encoding="utf-8") == "keep"
