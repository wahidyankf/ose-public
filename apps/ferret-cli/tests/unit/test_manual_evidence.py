"""The manual-evidence helper isolates every root it touches, checks each command's contract, and records safe facts."""

import importlib.util
import json
import re
import sys
from pathlib import Path
from types import ModuleType

import pytest

HELPER = Path(__file__).resolve().parents[1] / "support" / "manual_evidence.py"
RUN_ID = "unit-run"
RAW_ROOT = f"local-tmp/ferret-plan01/{RUN_ID}"
SUMMARY_LINE = re.compile(r"^(case|command|exit|bytes|sha256|assertion)=")
SHA256_LINE = re.compile(r"^sha256=[0-9a-f]{64} [\w][\w./-]*$")
BYTES_LINE = re.compile(r"^bytes=stdout:\d+ stderr:\d+$")


def load_helper() -> ModuleType:
    """The helper module, or an assertion failure that names it when it does not exist yet."""
    assert HELPER.is_file(), "missing manual_evidence: apps/ferret-cli/tests/support/manual_evidence.py"
    spec = importlib.util.spec_from_file_location("manual_evidence", HELPER)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules["manual_evidence"] = module
    spec.loader.exec_module(module)
    return module


def run_case(case: str, binary: Path, *, run_id: str = RUN_ID, raw_root: str = RAW_ROOT) -> int:
    return load_helper().main(
        [case, "--run-id", run_id, "--raw-root", raw_root, "--bin", str(binary), "--summary", f"{case}-summary.txt"]
    )


def summary_lines(repository: Path, case: str) -> list[str]:
    return (repository / f"{case}-summary.txt").read_text().splitlines()


def exits(lines: list[str]) -> list[int]:
    return [int(line.removeprefix("exit=")) for line in lines if line.startswith("exit=")]


def commands(lines: list[str]) -> list[str]:
    return [line.removeprefix("command=") for line in lines if line.startswith("command=")]


def failed_assertions(lines: list[str]) -> list[str]:
    return [line for line in lines if line.startswith("assertion=") and not line.endswith(": pass")]


def test_isolates_all_user_roots(repository: Path, monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    callers_home = tmp_path / "callers-home"
    callers_home.mkdir()
    monkeypatch.setenv("HOME", str(callers_home))
    monkeypatch.setenv("XDG_DATA_HOME", str(callers_home / "xdg"))
    monkeypatch.setenv("FERRET_DATA_HOME", str(callers_home / "ferret-data"))
    monkeypatch.setenv("FERRET_BIN", "/nonexistent/ferret")
    log = tmp_path / "environments.jsonl"
    recorder = tmp_path / "recorder.py"
    recorder.write_text(
        "import json, os\n"
        f"with open({str(log)!r}, 'a') as handle:\n"
        "    handle.write(json.dumps(dict(os.environ)) + '\\n')\n"
    )

    run_case("capture", recorder)

    environments = [json.loads(line) for line in log.read_text().splitlines()]
    assert environments, "the helper never started a child"
    raw_root = (repository / RAW_ROOT).resolve()
    for environment in environments:
        for name in ("HOME", "XDG_DATA_HOME", "FERRET_DATA_HOME"):
            assert Path(environment[name]).resolve().is_relative_to(raw_root), name
        assert "FERRET_BIN" not in environment
    assert list(callers_home.iterdir()) == []


def test_capture_exit_contract(repository: Path, artifact: Path) -> None:
    assert run_case("capture", artifact) == 0

    lines = summary_lines(repository, "capture")
    assert failed_assertions(lines) == []
    assert exits(lines) == [0, 0, 0, 2, 0, 0]
    assert commands(lines) == [
        "init",
        "capture-stored",
        "capture-duplicate",
        "capture-conflict",
        "capture-hook",
        "status",
    ]


def test_query_exit_contract(repository: Path, artifact: Path) -> None:
    assert run_case("query", artifact) == 0

    lines = summary_lines(repository, "query")
    assert failed_assertions(lines) == []
    labels = commands(lines)
    codes = exits(lines)
    assert [label for label, code in zip(labels, codes, strict=True) if code != 0] == ["invalid-cursor"]
    assert codes.count(2) == 1
    assert {"events-list-page-1", "events-export", "usage-by-skill", "outcomes-by-tool", "status"} <= set(labels)


def test_install_ownership_contract(repository: Path, artifact: Path) -> None:
    assert run_case("install", artifact) == 0

    lines = summary_lines(repository, "install")
    assert failed_assertions(lines) == []
    assert exits(lines) == [0, 0, 0, 0, 0]
    assert commands(lines) == ["init", "install", "install-again", "uninstall-keep-data", "uninstall-purge-data"]
    assert "assertion=install-states installed already_installed kept purged: pass" in lines
    home = repository / RAW_ROOT / "install" / "home"
    assert (home / ".local" / "bin" / "unowned-tool").read_text() == "not installed by ferret\n"
    assert (home / ".local" / "share" / "other-tool" / "keep.txt").is_file()


def test_summary_contains_only_relative_hashes_and_exits(repository: Path, artifact: Path) -> None:
    assert run_case("capture", artifact) == 0

    text = (repository / "capture-summary.txt").read_text()
    lines = text.splitlines()
    assert lines
    assert all(SUMMARY_LINE.match(line) for line in lines)
    assert all(SHA256_LINE.match(line) for line in lines if line.startswith("sha256="))
    assert all(BYTES_LINE.match(line) for line in lines if line.startswith("bytes="))
    assert all(line.removeprefix("exit=").isdigit() for line in lines if line.startswith("exit="))
    for forbidden in (str(repository), str(Path.home()), "/Users/", "/home/", "raw_payload", "FERRET_DATA_HOME"):
        assert forbidden not in text, forbidden


def test_refuses_unowned_existing_root(repository: Path, artifact: Path) -> None:
    root = repository / RAW_ROOT
    root.mkdir(parents=True)
    (root / "keep.txt").write_text("not the helper's\n")

    assert run_case("capture", artifact) == 2

    assert (root / "keep.txt").read_text() == "not the helper's\n"
    assert sorted(path.name for path in root.iterdir()) == ["keep.txt"]
    assert not (repository / "capture-summary.txt").exists()


def test_refuses_a_root_that_another_run_owns(repository: Path, artifact: Path) -> None:
    assert run_case("capture", artifact, run_id="first-run", raw_root="local-tmp/ferret-plan01/first-run") == 0

    code = run_case("capture", artifact, run_id="second-run", raw_root="local-tmp/ferret-plan01/first-run")

    assert code == 2
    assert (
        repository / "local-tmp" / "ferret-plan01" / "first-run" / ".ferret-plan01-run"
    ).read_text() == "first-run\n"


@pytest.mark.parametrize(
    "raw_root",
    [
        "/tmp/ferret-plan01/unit-run",
        "../ferret-plan01/unit-run",
        "local-tmp/elsewhere/unit-run",
        "local-tmp/ferret-plan01",
    ],
)
def test_refuses_a_raw_root_that_is_not_the_run_directory(repository: Path, artifact: Path, raw_root: str) -> None:
    assert run_case("capture", artifact, raw_root=raw_root) == 2
    assert not (repository / "capture-summary.txt").exists()
