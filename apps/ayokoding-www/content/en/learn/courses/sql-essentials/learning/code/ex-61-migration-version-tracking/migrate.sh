#!/usr/bin/env bash
# Example 61: a minimal migration RUNNER -- reads PRAGMA user_version first (co-24),
# and only applies migration.sql if the database hasn't already been migrated.
set -euo pipefail # => fail fast on any error, unset variable, or pipe failure

DB="app.db" # => the single database file this runner targets
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# => resolve the migration beside this script, regardless of the caller's working directory
CURRENT=$(sqlite3 "$DB" "PRAGMA user_version;")
# => reads the CURRENT version straight out of the file header

if [ "$CURRENT" -lt 1 ]; then # => version 0 (or lower) means migration.sql has NOT run yet
	sqlite3 -bail "$DB" <"$SCRIPT_DIR/migration.sql"
	# => stop on SQL errors; an unfinished transaction rolls back on connection close
	NEW=$(sqlite3 "$DB" "PRAGMA user_version;")
	# => re-reads the version -- confirms the bump actually landed
	echo "migrated to version $NEW"
	# => the FIRST-run message -- printed exactly once, ever
else
	# => version is ALREADY >= 1 -- re-running would fail with "duplicate column name"
	echo "already at version $CURRENT, skipping"
	# => the IDEMPOTENT path -- safe to call this script repeatedly
fi
