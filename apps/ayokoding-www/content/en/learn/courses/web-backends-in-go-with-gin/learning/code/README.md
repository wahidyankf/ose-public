## Example code for web-backends-in-go-with-gin

One folder per worked example: `ex-NN-<slug>/` holds the Go sources, its `run.yaml` (`toolchain: go`, Gin framework), and the recorded output under `expected/`. The lesson pages embed each program byte-identically; `go.mod` files appear as text blocks beside their units.

Every unit is deterministic and in-process: `httptest.NewRecorder` serves each request without a socket, so no example needs the network. Units that teach listening or shutdown bind `127.0.0.1` on an ephemeral port chosen by the operating system (`:0` or `httptest.NewServer`) and never print the port number. Fixed inputs keep every run byte-deterministic.

Each unit vendors the same Gin dependency closure (`vendor/`, pruned to the packages a default Linux build compiles) so the harness builds offline: Gin has no toolchain install recipe, and runs use `--network none`. The vendor tree is byte-identical in every unit. `gin.SetMode(gin.TestMode)` plus `gin.New()` (never the timestamped default logger) keeps stdout golden-clean.
