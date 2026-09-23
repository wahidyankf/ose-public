---
description: "Hexagonal architecture specialization for CLI apps — commands as inbound adapters, layer responsibilities, and forbidden imports"
when_to_use: "Read this index to find the right Hexagonal Architecture — CLI Apps child document."
---

# Hexagonal Architecture — CLI Apps

- [Overview and Directory Layout](./overview-and-directory-layout.md) — How CLI argument parsing maps to the inbound adapter, plus the canonical directory layout, with crane-cli as the in-tree example. Use when scaffolding a new CLI app or command and need the canonical directory layout.
- [Forbidden Imports, Examples, and Related](./forbidden-imports-examples-and-related.md) — The forbidden-imports table, a worked Rust example of a command delegating to the application layer, and related pattern documentation. Use when checking whether a CLI layer imports something forbidden, or want a worked example of the commands/ to application/ handoff.
