---
description: Hexagonal architecture specialization for CLI apps — commands as inbound adapters, layer responsibilities, and forbidden imports
when_to_use: "Use when structuring a CLI app's commands/, domain/, application/, or infrastructure/ layer."
---

# Hexagonal Architecture — CLI Apps

CLI apps apply hexagonal architecture with the `commands/` directory acting as the inbound adapter. CLI
argument parsing libraries (Clap, Cobra) belong exclusively in that adapter layer; the domain and
application layers know nothing about flags, subcommands, or exit codes.

## Contents

- [Overview and Directory Layout](./hexagonal-architecture-cli/overview-and-directory-layout.md) — How CLI argument parsing maps to the inbound adapter, plus the canonical directory layout, with crane-cli as the in-tree example. Use when scaffolding a new CLI app or command and need the canonical directory layout.
- [Forbidden Imports, Examples, and Related](./hexagonal-architecture-cli/forbidden-imports-examples-and-related.md) — The forbidden-imports table, a worked Rust example of a command delegating to the application layer, and related pattern documentation. Use when checking whether a CLI layer imports something forbidden, or want a worked example of the commands/ to application/ handoff.

## Principles and Conventions

### Principles Implemented/Respected

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Command handlers
  receive parsed, typed arguments. The application layer is invoked with named domain concepts, not raw `&[String]`
  slices or `os.Args`.

- **[Pure Functions Over Side Effects](../../principles/software-engineering/pure-functions.md)**: Domain logic runs as
  pure functions. File I/O, HTTP requests, and standard-output writes are outbound adapter concerns confined to
  `infrastructure/`.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Separating argument
  parsing from business logic keeps each layer testable in isolation. Domain tests need no CLI harness.

### Conventions Implemented/Respected

- **[Functional Programming Practices](./functional-programming.md)**: Domain functions are pure and stateless.

## Layer Responsibilities

### commands/ — Inbound Adapter

- Parse CLI arguments using Clap (`#[derive(Parser)]`) or Cobra
- Validate argument types and required/optional constraints
- Map parsed arguments to application-layer input types
- Translate application errors to human-readable messages and non-zero exit codes
- Print progress or results to stdout/stderr

### domain/ — Domain Layer

- Business entities and value objects relevant to the CLI's domain
- Pure validation and transformation functions
- Domain error types (no exit codes, no `fmt.Println`)

### application/ — Application Layer

- Use-case functions that orchestrate domain objects and call outbound ports
- Outbound port definitions (repository traits in Rust, interfaces in Go)
- Application-level error types

### infrastructure/ — Outbound Adapters

- File system access (reading input files, writing output files)
- HTTP client calls to external services
- Concrete port implementations
