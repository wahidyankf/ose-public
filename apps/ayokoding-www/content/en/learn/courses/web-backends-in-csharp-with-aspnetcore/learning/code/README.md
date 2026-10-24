## Example code for web-backends-in-csharp-with-aspnetcore

One folder per worked example: `ex-NN-<slug>/` holds the C# sources, its `run.yaml` (`toolchain: dotnet`, ASP.NET Core minimal APIs), and the recorded output under `expected/`. The lesson pages embed each program byte-identically.

Every unit is deterministic and in-process: `TestServer` serves each request in memory with no socket, so most examples need nothing beyond loopback memory. Units that teach listening or shutdown bind `127.0.0.1` on an ephemeral port chosen by the operating system (`:0`) and never print the port number. Fixed inputs keep every run byte-deterministic.

Each unit restores the same single locked package (`Microsoft.AspNetCore.TestHost`, the in-process test server) from the course-local feed, so the harness builds offline: the pinned `NuGet.Config` clears the default sources and the per-unit `packages.lock.json` pins the byte-identical closure. `builder.Logging.ClearProviders()` keeps stdout golden-clean.
