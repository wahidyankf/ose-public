---
description: "How the six layers translate to non-Rust languages."
when_to_use: "Use when implementing git-fixture isolation in a non-Rust language."
---

# Language-Agnostic Equivalents

This convention is deliberately language-agnostic: any language in this polyglot monorepo that
shells out to `git` in a test fixture must implement the same six layers using its own subprocess
API's environment-variable and working-directory controls.

| Language / stack  | Env-var injection API                                                  | Notes                                                                                                                   |
| ----------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Rust              | `std::process::Command::env(...)`                                      | Pattern used throughout this document; matches `Rhino`                                                                  |
| Go                | `exec.Cmd.Env` (append to `os.Environ()`, do not replace it wholesale) | Must append, not overwrite -- a fully replaced `Env` drops `PATH`, breaking `git` resolution                            |
| TypeScript / Node | `child_process.spawn(cmd, args, { env: { ...process.env, ... } })`     | Same append-not-replace rule as Go                                                                                      |
| Python            | `subprocess.run([...], env={**os.environ, ...})`                       | Same append-not-replace rule                                                                                            |
| F# / .NET         | `ProcessStartInfo.EnvironmentVariables[...]`                           | `ProcessStartInfo` inherits the parent environment by default; only add the isolation keys, do not clear the collection |

The pre-write escape guard (Standard 4) and the process rule (Standard 6) translate directly --
every language can shell out to `git rev-parse --show-toplevel` with the same isolation env vars
and canonicalize-and-compare the result before any write.
