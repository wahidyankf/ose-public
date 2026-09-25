---
description: >-
  Fixes the TypeScript baseline: a declared compiler floor, strict compiler options, no any and no unchecked assertions,
  expected failures returned as Result values, and type check, lint, and format gates.
when_to_use: >-
  Use when configuring, writing, or reviewing TypeScript, or when a change relaxes a compiler option, introduces an any
  or an assertion, or throws for a failure callers should expect.
---

# TypeScript Standards

This standard is canonical for TypeScript and owns strict typing. It holds only the choices the language leaves open,
and a TypeScript programming skill defers here for every rule it applies.

The compiler proves only what its configuration asks: a permissive option, an `any`, or an assertion in place of a check
lets a program type-check and still fail at runtime.

It implements [Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md),
[Immutability](../../../principles/software-engineering/immutability.md), [Reproducibility](../../../principles/software-engineering/reproducibility.md), and
[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md). React code also follows
[React Standards](react-standards.md), and Next.js code [Next.js Standards](nextjs-standards.md).

## Compiler Version

Each project declares a minimum compiler version, and its lockfile pins the exact compiler every contributor and
pipeline runs. A new project starts on the current stable release line. Raising the floor is a deliberate change,
because checking behaviour differs between releases. Declaring and pinning follow
[Native-First Toolchain](../../workflow/native-first-toolchain.md).

## Strict Compiler Options

Every project enables:

- `strict`, for null checks, implicit-`any` errors, and the rest of the strict set;
- `noUncheckedIndexedAccess`, so an indexed read's type admits `undefined`;
- `noImplicitReturns` and `noFallthroughCasesInSwitch`, so no path returns or falls through by omission; and
- `noUnusedLocals` and `noUnusedParameters`, so dead code is a finding.

An option is never relaxed to make a change compile; the code is fixed instead.

## Typing Rules

- **No `any`.** A value of unknown shape is `unknown` and is narrowed before use. Unsafe use of an `any` a library
  returns is a finding too.
- **Validate, never assert.** Data crossing a boundary, such as a request body, parsed text, storage, or the
  environment, passes a type guard or a schema before the program relies on its type. An assertion states a belief the
  compiler cannot check, so neither a double assertion nor a non-null assertion silences a type error.
- **Exclusive states are discriminated unions.** Each state carries a literal tag and only its own fields, so an
  impossible combination does not compile, as it would with boolean flags. Handling a union covers every tag.
- **Readonly by default.** A property or collection callers must not change is `readonly`, and a literal lookup table is
  a constant assertion.
- **Distinct primitives get branded types.** An identifier or quantity that must not be confused with another of the
  same primitive is branded and created only by a validating factory.

Code is organised by feature; no technical layer spans features. Business logic is functions over readonly data,
structured as [Functional Core, Imperative Shell](../../pattern/functional-core-imperative-shell-web.md) or, where ports
exist, [Hexagonal Architecture](../../pattern/hexagonal-architecture.md).

## Expected Failures Are Returned

A failure that belongs to normal operation, such as invalid input, an unmet rule, or a missing record, is returned as a
Result: a discriminated union of a success holding the value and a failure holding a typed error. The caller cannot
reach the value without checking which it holds. Exceptions are for programmer errors and broken invariants.

No error is swallowed: a caught error is handled, wrapped with context, or propagated. Every promise is awaited,
returned, or given a rejection handler, because a floating promise's rejection escapes every handler.

## Gates

- **Type check:** the compiler over the whole project, emitting nothing.
- **Lint:** a type-aware linter's recommended type-checked rules, the typing and promise rules above, explicit return
  types on functions, and `PascalCase` names for interfaces and type aliases.
- **Format:** one formatter, with overlapping lint rules disabled so the two never disagree.

Findings fail at the threshold [Lint Strictness](../cross-language-lint-strictness.md) sets, and each gate is a named target as
[Test Boundaries and Gates](../../behaviour-driven-development.md) requires. Behaviour is built test-first per
[Test-Driven Development](../../workflow/test-driven-development.md). A test that intercepts network requests in process is
a unit test, never integration evidence. Whether coverage has a floor is recorded under
[Layers and Adapters](../../behaviour-driven-development.md).

## Illustrative Example

As an illustration only: `typescript-eslint`'s type-checked configuration enforces `no-explicit-any`, the `no-unsafe-*`
rules, `no-non-null-assertion`, and `no-floating-promises`; Prettier formats, with `eslint-config-prettier` disabling
overlapping rules; and `tsc --noEmit` is the type check.

## Enforcement

An adopter enforces the compiler options in its committed configuration and the typing rules in its own lint gate.
Review applies what no linter sees, such as whether a failure is expected or exceptional.
