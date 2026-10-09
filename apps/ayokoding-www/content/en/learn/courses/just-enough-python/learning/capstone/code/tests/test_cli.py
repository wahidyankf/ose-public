"""CLI regression tests for invalid input files."""

import subprocess
import sys
from pathlib import Path


def test_malformed_json_reports_one_line_without_writing_output(tmp_path: Path) -> None:
    input_path = tmp_path / "bad.json"
    output_path = tmp_path / "out.json"
    input_path.write_text("{bad json", encoding="utf-8")

    result = subprocess.run(
        [sys.executable, "-m", "app", str(input_path), str(output_path)],
        cwd=Path(__file__).parents[1],
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode != 0
    assert "invalid JSON" in result.stderr
    assert "Traceback" not in result.stderr
    assert not output_path.exists()


def test_invalid_text_encoding_reports_error_without_writing_output(
    tmp_path: Path,
) -> None:
    input_path = tmp_path / "invalid-utf8.json"
    output_path = tmp_path / "out.json"
    input_path.write_bytes(b"\xff")

    result = subprocess.run(
        [sys.executable, "-m", "app", str(input_path), str(output_path)],
        cwd=Path(__file__).parents[1],
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode != 0
    assert "cannot decode input" in result.stderr
    assert "Traceback" not in result.stderr
    assert not output_path.exists()


def test_missing_input_reports_one_line_without_writing_output(tmp_path: Path) -> None:
    output_path = tmp_path / "out.json"

    result = subprocess.run(
        [sys.executable, "-m", "app", str(tmp_path / "missing.json"), str(output_path)],
        cwd=Path(__file__).parents[1],
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode != 0
    assert "cannot read input" in result.stderr
    assert "Traceback" not in result.stderr
    assert not output_path.exists()


def test_unwritable_output_reports_one_line(tmp_path: Path) -> None:
    input_path = Path(__file__).parents[1] / "in.json"

    result = subprocess.run(
        [sys.executable, "-m", "app", str(input_path), str(tmp_path)],
        cwd=Path(__file__).parents[1],
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode != 0
    assert "cannot write output" in result.stderr
    assert "Traceback" not in result.stderr


def test_overflowing_total_reports_error_without_writing_output(tmp_path: Path) -> None:
    input_path = tmp_path / "large.json"
    output_path = tmp_path / "out.json"
    input_path.write_text(
        '[{"name":"widget","quantity":2,"price":1e308}]', encoding="utf-8"
    )

    result = subprocess.run(
        [sys.executable, "-m", "app", str(input_path), str(output_path)],
        cwd=Path(__file__).parents[1],
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode != 0
    assert "finite total" in result.stderr
    assert "Traceback" not in result.stderr
    assert not output_path.exists()
