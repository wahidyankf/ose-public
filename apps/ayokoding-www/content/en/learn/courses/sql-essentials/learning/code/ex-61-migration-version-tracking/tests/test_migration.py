"""Regression checks for the versioned migration's repeatability and atomicity."""

import sqlite3
import subprocess
from pathlib import Path


CODE_DIR = Path(__file__).resolve().parent.parent


def test_migration_rolls_back_schema_when_version_step_fails(tmp_path: Path) -> None:
    db = tmp_path / "app.db"
    subprocess.run(
        ["sqlite3", str(db)],
        input=(CODE_DIR / "schema.sql").read_text(),
        text=True,
        check=True,
    )
    migration = (CODE_DIR / "migration.sql").read_text()
    broken = migration.replace(
        "PRAGMA user_version = 1;", "SELECT missing_column FROM book;"
    )
    result = subprocess.run(
        ["sqlite3", "-bail", str(db)], input=broken, text=True, capture_output=True
    )
    assert result.returncode != 0
    with sqlite3.connect(db) as conn:
        assert conn.execute("PRAGMA user_version").fetchone() == (0,)
        assert "edition" not in [
            row[1] for row in conn.execute("PRAGMA table_info(book)")
        ]


def test_migration_runner_can_repeat_after_success(tmp_path: Path) -> None:
    db = tmp_path / "app.db"
    subprocess.run(
        ["sqlite3", str(db)],
        input=(CODE_DIR / "schema.sql").read_text(),
        text=True,
        check=True,
    )
    for expected in ("migrated to version 1", "already at version 1, skipping"):
        result = subprocess.run(
            ["bash", str(CODE_DIR / "migrate.sh")],
            cwd=tmp_path,
            text=True,
            capture_output=True,
            check=True,
        )
        assert expected in result.stdout
    with sqlite3.connect(db) as conn:
        assert conn.execute("PRAGMA user_version").fetchone() == (1,)
        assert "edition" in [row[1] for row in conn.execute("PRAGMA table_info(book)")]
