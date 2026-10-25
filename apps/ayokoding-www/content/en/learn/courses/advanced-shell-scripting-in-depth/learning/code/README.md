## Example code for advanced-shell-scripting-in-depth

One folder per worked example: `ex-NN-<slug>/` holds `example.sh`, its `run.yaml` (`toolchain: shell`, Debian bash with coreutils, no network), any fixture files the script reads, and the recorded output under `expected/`. Every unit is deterministic: fixtures are committed beside the script, demo argv is installed with `set --`, no PIDs, paths, versions, dates, or usernames ever print, and temporary files live under /tmp behind EXIT traps.

Signal handling is demonstrated with deterministic self-signals (`kill -TERM $$`); background jobs write per-job files under scratch and are joined with `wait` before ordered reads. Standard error carries traces and usage by design and is ignored per unit where the lesson says so; standard output is the asserted transcript.
