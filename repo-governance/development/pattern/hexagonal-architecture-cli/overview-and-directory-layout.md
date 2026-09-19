---
description: "How CLI argument parsing maps to the inbound adapter, plus the canonical directory layout across all four CLI apps."
when_to_use: "Use when scaffolding a new CLI app or command and need the canonical directory layout."
---

# Overview and Directory Layout

## Overview

CLI apps are driven by command-line arguments, which are the inbound signal — the equivalent of an HTTP request in a
web service. `commands/` parses those arguments using the CLI framework (Clap for Rust, Cobra for Go) and delegates to
the application layer. The application layer orchestrates domain logic and calls outbound ports. Infrastructure
implementations satisfy those ports.

## Directory Layout

The table below shows the canonical layout for both CLI apps.

| Layer              | Rhino (Rust)          | crane-cli (F#)      |
| ------------------ | --------------------- | ------------------- |
| Inbound adapter    | `src/commands/`       | `src/Adapters/In/`  |
| Application        | `src/application/`    | `src/Core/Logic/`   |
| Domain             | `src/domain/`         | `src/Core/Domain/`  |
| Outbound adapters  | `src/infrastructure/` | `src/Adapters/Out/` |
| I/O port contracts | —                     | `src/Core/Ports.fs` |
| Binary entry point | `src/main.rs`         | `src/Program.fs`    |

**`src/internal/` backward-compatibility shim**: `Rhino` retains a `src/internal/` directory containing
thin re-export modules (e.g., `pub use crate::application::agents::*;`). These exist solely for callers that
were written before the hexagonal migration (P7, 2026-05-23). No new code should import from `src/internal/`;
import from `src/domain/`, `src/application/`, or `src/infrastructure/` directly.

**crane-cli F# layout note**: crane-cli's F# implementation departs from the flat `src/commands/` layout because F#
compile order is explicit — all files must be declared in the `.fsproj` in dependency order. Grouped subdirectories
(`src/Core/Domain/`, `src/Core/Logic/`, `src/Adapters/`) make compile-order intent visible. An additional
`src/Core/Ports.fs` module declares all I/O boundaries as function type aliases (e.g.,
`type ReadPdf = string -> Result<PdfContent, PdfError>`), keeping the Impureim Sandwich pattern explicit: adapters
in `src/Adapters/Out/` satisfy these aliases; `src/Program.fs` is the composition root that wires everything
together.
