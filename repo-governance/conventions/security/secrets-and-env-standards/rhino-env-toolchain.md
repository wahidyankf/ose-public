---
description: The ./rhino env command family (backup, restore, init, validate), the backup-scope registry, and the env-contract section that drives drift validation.
when_to_use: Use when running or configuring ./rhino env backup/restore/init/validate, or when adding a new surface to the env-contract registry.
---

# `./rhino env` Toolchain

The full `./rhino env` family manages the local secrets lifecycle:

| Command                                            | What it does                                                                                  |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `./rhino env backup --dir <path> --apply`          | Copies only declared local environment targets to an explicit repository-relative destination |
| `./rhino env restore --dir <path> --apply --force` | Restores a declared target from that explicit backup after reviewed replacement authority     |
| `./rhino env init --apply`                         | Initializes only declared absent environment targets                                          |
| `./rhino env validate`                             | Checks declared examples, contracts, and detectors without reporting values                   |

## Declared policy and drift validation

The `environment` group in `repo-config.yml` owns examples, staged-file policy, public contracts,
and source detectors. Backup and restore never choose a default destination: review the declared
targets, then pass an explicit repository-relative `--dir` and `--apply`.

`./rhino env validate` checks only declared public examples, contract keys, and detectors; it does
not report environment values.

## Keeping a read visible to the scanner

`env validate` is a **static** scanner: it finds a key by matching the key literal beside the
reader it is passed to. Injecting the reader is good design — it is what lets a resolver be
unit-tested without touching the OS — so the rule is not "call the reader directly" but **keep the
key literal at the composition root, beside the reader**. `ose-be`'s `Program.fs` passes
`readEnvironment "OSE_BE_PORT"`; `roots-be`'s `main.go` passes
`os.LookupEnv, "ROOTS_BE_PORT"`. Move the key into a constant the resolver dereferences and the
scanner sees no read at all, reporting a key that is genuinely read as `declared-but-unread`.

`allowlist:` is for keys that are legitimately not read. Using it to silence a key the scanner
merely cannot see turns a correctness gate into decoration — fix the call site instead.
