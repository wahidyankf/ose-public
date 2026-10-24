## Example code for database-migrations-with-python-and-alembic

One folder per worked example: `ex-NN-<slug>/` holds `main.py`, its `run.yaml` (`toolchain: python` with the `postgres` service and the shared hash-locked `learning/code/requirements.lock`), and the recorded output under `expected/`. The lesson embeds each program byte-identically with its output.

Every unit is deterministic: fixed revision ids (no random hex), per-example table names (`exNN_...`), leftover drops before running and cleanup after, ordered queries, and printed labels, counts, and row values only — never timings, paths, temp-dir names, or Alembic log lines (those go to standard error, which the harness ignores). Alembic revision files shown in a lesson are written by the program itself into a scratch script directory at runtime, together with a minimal online-only `env.py`, and executed for real with `alembic.command` against the service database.

Kata starters are intentionally imperfect — they exist to be fixed — and only the `after/` solutions run green in the harness.
