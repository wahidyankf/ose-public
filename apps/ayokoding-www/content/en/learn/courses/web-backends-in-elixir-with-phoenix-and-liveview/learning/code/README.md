## Example code for web-backends-in-elixir-with-phoenix-and-liveview

One folder per worked example: `ex-NN-<slug>/` holds `mix.exs`, its `mix.lock`, `priv/main.exs`, its `run.yaml` (`toolchain: elixir` with the shared hash-locked `learning/code/mix.lock`), and the recorded output under `expected/`. The lesson embeds each program byte-identically with its output.

Every unit is deterministic: fixed values (never random), in-process execution only (no socket, no browser, no external service), and printed labels and values only — never timings, paths, or temp-dir names (standard error is ignored by the harness). Phoenix controllers answer through `Plug.Test` connections, LiveViews mount and handle events by direct callback, and channels, PubSub, and Presence run inside the script's own supervision tree.
