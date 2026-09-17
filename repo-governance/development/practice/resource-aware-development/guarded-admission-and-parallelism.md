---
description: One outer HIPPO boundary per compute-bearing DAG node, which reservations each class makes, and the only two worker variables OSE maps.
when_to_use: Use when wiring a build, test, generator, or gate command, or when deciding whether two nodes must be serialized.
---

# Guarded Admission and Parallelism

Run each independent compute-bearing DAG node through one outer HIPPO boundary. Nodes may enter
concurrently; HIPPO atomically admits CPU-and-memory vectors only when shared capacity and host
pressure allow. A build, validation, toolchain, or worktree command is not itself a serial edge.

Serialize only for dependency, shared-output, ordered Rhino byte identity, transaction, or a
documented runtime race. The N=3 agent budget limits agent work streams; it is separate from
HIPPO's child allocation and cannot override admission.

All `service`, `ephemeral`, and `transactional` owners reserve capacity. Automatic `balanced`,
`constrained`, and `minimal` requests use four, two, and one safe-capacity shares. Explicit requests
may be smaller but not below one CPU or 256 MiB. Admission reserves both dimensions under strict
FIFO; pressure may defer a request even when its vector fits.

Schema 3 chooses capacity through a separate tier: `light` for narrow static checks, `standard` for
ordinary checks and writers, and `heavy` for full builds, full suites, browser suites, and complete
gates. One FIFO waiter persists until admission or its tier deadline; the payload launches at most
once and receives the largest safe vector within the tier.

OSE maps fixed CPU allocation only to `NX_PARALLEL` and `DOTNET_PROCESSOR_COUNT`: missing values
receive it, lower positive values survive, and higher values are clamped. Inner commands inherit
the session; never add another outer guard or an unowned ecosystem mapping.

Every compute-bearing `package.json` script here already carries its own guard, either invoking
`./hippo run` directly or delegating to one that does. `npm run <script>` is therefore already
admitted, and wrapping one in an outer `./hippo run` makes each inner call wait on a lease its own
ancestor holds. The run then stalls near zero CPU while `./hippo status` still reports `normal`, so
it reads as a slow build rather than as self-contention. `npm install` and `npm exec` are not
scripts and do take the outer boundary — that is what the `AGENTS.md` and `README.md` examples show.

## The boundary is not paperwork on a command that would have been fine

Two properties make a single Nx invocation far larger than it reads. A target whose command is
itself a chain of nested `npm exec -- nx run` calls multiplies under `run-many`: one fan-out over
four projects and three targets expands into dozens of concurrent Node processes, which surfaces
only as a raised listener warning. And a target can transitively start a server — an E2E project
whose Playwright `webServer` runs a dev server pulls a bundler and a browser in behind it.

So for a fan-out or a transitively server-starting target, the boundary is the only thing bounding
concurrent process count. It is also where the worker mapping above is applied: `NX_PARALLEL` and
`DOTNET_PROCESSOR_COUNT`, and the MSBuild node-reuse and compiler-server settings that stop a .NET
run leaving workers resident, are exported by `./hippo run` and by nothing else. Running the same
command directly does not merely skip admission — it discards the clamp the repository already
configured, and the tool falls back to host parallelism.

Prefer one outer boundary per compute-bearing node, and prefer sequential per-project runs over a
`run-many` fan-out whenever each target is itself a nested chain.
