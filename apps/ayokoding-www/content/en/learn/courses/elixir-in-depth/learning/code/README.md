## Example code for elixir-in-depth

One folder per worked example: `ex-NN-<slug>/` holds `main.exs`, its `run.yaml` (`toolchain: elixir`, pinned Elixir 1.20.4 on OTP 29.1.2, no network), any fixture files the script reads, and the recorded output under `expected/`. Every unit is standard library only, so no lockfile exists and no `dependencies.lockfile` entry appears in any `run.yaml`.

Every unit is deterministic: fixtures are committed beside the script, no clock is ever read, seeded generators pin their streams, concurrency demos rendezvous on monitored processes with sorted transcripts, process identifiers are never printed, and printed values are constructed by the script rather than quoted from library prose. Scratch writes go to fixed paths under /tmp with fixed content.
