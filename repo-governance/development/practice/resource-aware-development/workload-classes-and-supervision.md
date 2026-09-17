---
description: Which workload class a command takes, and what HIPPO sheds first when the host is under critical pressure.
when_to_use: Use when choosing between the ephemeral, service, and transactional classes, or when a run was shed.
---

# Workload Classes and Supervision

Use `ephemeral` for restartable builds, tests, and reads; `service` for restartable long-running
development; and `transactional` for authorized indivisible mutations such as destructive resets,
tool installation, binding generation, or tracked-output writes. Never change class to gain entry.

Under ordinary critical pressure HIPPO sheds the newest eligible ephemeral, then the newest
service. A transaction becomes eligible last only at the configured emergency memory floor. HIPPO
signals and reaps only that child group before release. Interactive children temporarily own the
foreground terminal; pipes and non-controlling input remain unchanged.

A guarded command returns only once its whole process group has retired, so a payload that leaves
a persistent daemon behind keeps the guard waiting long after the work itself finished. The `run`
branch of the consumer therefore defaults .NET's two daemon sources off —
`MSBUILDDISABLENODEREUSE=1` and `DOTNET_CLI_USE_MSBUILD_SERVER=0` — while an explicit caller value
still wins, and the consumer contract test asserts both defaults. Any other toolchain that detaches
a daemon takes the same treatment at the wrapper; never kill the guard.
