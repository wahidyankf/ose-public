## Example code for database-migrations-with-golang-and-goose

One folder per worked example: `ex-NN-<slug>/` holds `main.go`, its `run.yaml` (`toolchain: go` with the `postgres` service, standard library only — the Go toolchain carries no install recipe), and the recorded output under `expected/`. The lesson embeds each program byte-identically with its output.

Every unit is deterministic: fixed version numbers (no generated stamps), per-example table names (`exNN_...`), leftover drops before running and cleanup after, ordered queries, and printed labels, counts, and row values only — never timings, paths, temp-dir names, or wire-protocol noise. The driver applies the same goose SQL files `goose up` would apply, one transaction per file, against the service database; goose files shown in a lesson are written by the program itself into a scratch migrations directory at runtime and executed for real.

Kata starters are intentionally imperfect — they exist to be fixed — and only the `after/` solutions run green in the harness.
