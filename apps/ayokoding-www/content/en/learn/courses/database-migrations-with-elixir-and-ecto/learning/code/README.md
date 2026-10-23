## Example code for database-migrations-with-elixir-and-ecto

One folder per worked example: `ex-NN-<slug>/` holds `mix.exs`, its `mix.lock`, `priv/main.exs`, its `run.yaml` (`toolchain: elixir` with the `postgres` service and the shared hash-locked `learning/code/mix.lock`), and the recorded output under `expected/`. The lesson embeds each program byte-identically with its output.

Every unit is deterministic: fixed numeric versions (never random), per-example table names (`exNN_...`) plus a per-example history table, leftover drops before running and cleanup after, ordered queries, and printed labels, counts, and row values only — never timings, paths, temp-dir names, or migration log lines (those are silenced, and the harness ignores standard error). Migration files shown in a lesson are written by the program itself into a scratch script directory at runtime and executed for real with `Ecto.Migrator` against the service database.

Kata starters are intentionally imperfect — they exist to be fixed — and only the `after/` solutions run green in the harness.
