---
description: Worked derivation examples and forbidden-vs-correct anti-pattern pairs for the `{domain}:{work}` governance and validation Nx target naming scheme.
when_to_use: Use when deriving a new `{domain}:{work}` target name from a subject and operation, or checking a proposed name against known anti-patterns.
---

# Derivation Examples and Anti-Patterns for the `{domain}:{work}` Scheme

## Derivation Examples

| Subject scope        | Operation               | Derived target       |
| -------------------- | ----------------------- | -------------------- |
| `compat` (toolchain) | check minimum version   | `compat:min-version` |
| `deps` (packages)    | audit for vulnerability | `deps:audit`         |

## Anti-Patterns

| Forbidden          | Correct                                           | Reason                                                     |
| ------------------ | ------------------------------------------------- | ---------------------------------------------------------- |
| `validate:mermaid` | `./rhino md mermaid validate` (gate `md-mermaid`) | `validate:*` prefix abolished; repository-wide, not Nx     |
| `validate:links`   | `./rhino md internal-link validate`               | same                                                       |
| `validate:deps`    | `deps:audit`                                      | `validate:*` prefix abolished                              |
| `spec-coverage`    | `test:coverage:behaviour`                         | Hyphen dropped; domain clarified                           |
| `fmt:check`        | the `format-staged` registry gate (no Nx target)  | Formatting is a registry gate, not a per-project Nx target |
| `check:msrv`       | `compat:min-version`                              | Verb follows domain: `{domain}:{verb}`                     |
