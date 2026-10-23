## Example code for database-migrations-with-fsharp-and-dbup

One folder per worked example: `ex-NN-<slug>/` holds `Program.fs`, its `run.yaml` (`toolchain: dotnet` with the `postgres` service, locked `packages.lock.json` restored offline from the recipe-staged nupkgs: DbUp 7.0.1 with PostgreSQL support plus Npgsql), and the recorded output under `expected/`. The lesson embeds each program byte-identically with its output.

Every unit is deterministic: fixed script names (never generated stamps), per-example tables (`dNN_...`), leftover drops before running and cleanup after, ordered queries, and printed labels, counts, and row values only — never timings, paths, temp-dir names, or wire-protocol noise. DbUp journals each applied script in `schemaversions` and skips journaled names on rerun; units reset only their own prefixed rows so reruns and shared databases stay byte-stable. DbUp has no down step, so rollbacks are compensating forward migrations by design, and the course states that plainly instead of pretending otherwise.

Kata starters are intentionally imperfect — they exist to be fixed — and only the `after/` solutions run green in the harness.
