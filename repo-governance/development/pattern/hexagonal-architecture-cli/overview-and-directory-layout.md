---
description: "How CLI argument parsing maps to the inbound adapter, plus the canonical directory layout, with crane-cli as the in-tree example."
when_to_use: "Use when scaffolding a new CLI app or command and need the canonical directory layout."
---

# Overview and Directory Layout

## Overview

CLI apps are driven by command-line arguments, which are the inbound signal — the equivalent of an HTTP request in a
web service. `commands/` parses those arguments using the CLI framework (Clap for Rust, Cobra for Go) and delegates to
the application layer. The application layer orchestrates domain logic and calls outbound ports. Infrastructure
implementations satisfy those ports.

## Directory Layout

The table below maps each layer to the in-tree F# CLI: `crane-cli` holds the inbound adapter and entry point, and
its shared `fsharp-crane-core` library holds the rest. RHINO, the repository's validator, is a pinned external
executable released from its own repository, so it has no in-tree layout.

| Layer              | Path                                       |
| ------------------ | ------------------------------------------ |
| Inbound adapter    | `apps/crane-cli/src/Adapters/In/`          |
| Application        | `libs/fsharp-crane-core/src/Core/Logic/`   |
| Domain             | `libs/fsharp-crane-core/src/Core/Domain/`  |
| Outbound adapters  | `libs/fsharp-crane-core/src/Adapters/Out/` |
| I/O port contracts | `libs/fsharp-crane-core/src/Core/Ports.fs` |
| Binary entry point | `apps/crane-cli/src/Program.fs`            |

**F# layout note**: the crane layout departs from the flat `src/commands/` layout because F#
compile order is explicit — all files must be declared in the `.fsproj` in dependency order. Grouped subdirectories
(`src/Core/Domain/`, `src/Core/Logic/`, `src/Adapters/`) make compile-order intent visible. An additional
`src/Core/Ports.fs` module in the library declares the I/O boundaries as port interfaces (`IPdfPort`, `IOcrPort`) and
function type aliases (e.g., `type ReadFile = string -> Result<string, exn>`), keeping the Impureim Sandwich pattern
explicit: adapters in `src/Adapters/Out/` satisfy these ports; `crane-cli`'s `src/Program.fs` is the composition root
that wires everything together.
