---
description: >-
  Fixes the Python baseline: every signature annotated and checked by Pyright in strict mode, formatter and linter
  gates, paths as pathlib values, validated boundaries, narrow exception handling, and branch coverage.
when_to_use: >-
  Use when creating, configuring, or reviewing a Python project, or when choosing its type checker settings, lint rules,
  boundary validation, failure style, or coverage measurement.
---

# Python Standards

This standard is canonical for Python. It holds the choices Python and its tools leave open, and a Python programming
skill defers here for each rule it applies.

It implements [Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md),
[Immutability](../../../principles/software-engineering/immutability.md), and
[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md). The interpreter version and lockfile follow
[Native-First Toolchain](../../workflow/native-first-toolchain.md) and
[Reproducibility](../../../principles/software-engineering/reproducibility.md).

## Gates

- **Type check:** Pyright in strict mode over every authored package, set in committed configuration with
  `reportUnnecessaryTypeIgnoreComment` enabled, so a stale waiver is itself a finding
  ([configuration](https://github.com/microsoft/pyright/blob/main/docs/configuration.md)). A path left outside strict
  mode is a waiver with its reason.
- **Format:** one formatter in check mode. Example: `ruff format --check`.
- **Lint:** a linter whose rule selection is committed, including import sorting where the formatter does not sort, and
  excluding rules its formatter documents as conflicting. Example: `ruff check` with the `I` rules
  ([formatter conflicts](https://docs.astral.sh/ruff/formatter/)).

Findings fail at the threshold [Lint Strictness](../cross-language-lint-strictness.md) sets.

## Type and Boundary Safety

Pyright is Python's checker under [Type and Boundary Safety](../code/type-and-boundary-safety.md). Python checks no
annotation at runtime, so an unannotated signature is a contract nothing verifies. In Python:

- Every parameter and every return is annotated.
- `Any` is never written. A value of unknown shape is `object`, narrowed before use, and a structural need is a
  `Protocol`.
- `cast()`, `# type: ignore`, and `# pyright: ignore` are waivers, each with its reason beside it.
- Annotations use `X | None` and built-in generics. Parameters accept abstract types, returns are concrete, and a
  function does not return a union its callers must untangle
  ([typing best practices](https://typing.python.org/en/latest/reference/best_practices.html)).
- A dependency without type information gets a stub rather than spreading unknown types inward.
- Annotating parsed input is not validating it. Data from outside becomes a typed value through a check where it
  arrives.
- A filesystem path is a `pathlib.Path` from the point it enters the program, never a string assembled by hand.

## Code Shape

- Comparisons to `None` use `is`, type checks use `isinstance`, a named function is a `def` rather than a bound lambda,
  and either every return in a function states a value or none does ([PEP 8](https://peps.python.org/pep-0008/)).
- A value object is a frozen dataclass. A list or dictionary default is built per instance through a factory, because a
  literal default is created once and shared.
- A handler catches the narrowest exception type. A bare `except:` is never written, since it also catches interrupts,
  and an exception deliberately ignored names its type and reason.

## Tests

Suites are separated by layer. A fixture that creates a temporary directory or sets an environment variable reaches a
boundary the unit layer excludes, so a test using one is integration, as
[Test Boundaries and Gates](../../behaviour-driven-development.md) classifies it. Example: pytest, whose `tmp_path`
and `monkeypatch.setenv` are integration tools in this sense.

Coverage is measured with branch measurement on, in the unit run. A partial branch that cannot be taken is excluded with
its reason, per [Meaningful Coverage](../testing/meaningful-coverage.md). Example: coverage.py with `branch = true` and
`fail_under` ([branch coverage](https://coverage.readthedocs.io/en/latest/branch.html)). Any floor is recorded under
[Layers and Adapters](../../behaviour-driven-development.md).

## Documentation

Public modules, classes, and functions carry docstrings that state behaviour, not the types the annotations already
give. A change to observable behaviour updates them per
[Specification Maintenance](../specs-application-sync.md) and
Public Contract.

## Adopter Decisions

| Decision            | Option                                  | Gains                                     | Costs                                        |
| ------------------- | --------------------------------------- | ----------------------------------------- | -------------------------------------------- |
| boundary validation | standard-library dataclasses and checks | no dependency                             | validation and serialization written by hand |
|                     | a library; example: Pydantic            | declared rules, parsing, serialization    | a dependency, per Dependency Selection       |
| expected failures   | exceptions                              | the idiom the standard library follows    | the signature does not show what can fail    |
|                     | returned result values                  | the checker forces every caller to handle | every raising library call needs wrapping    |

Record each choice in the repository adapter [Stack Packs](../../../conventions/structure/stack-packs.md) defines.

## Enforcement

Pyright, the formatter, the linter, and the coverage floor enforce the gates in the adopter's own hooks and pipeline.
Review applies boundary validation, code shape, and failure handling.
