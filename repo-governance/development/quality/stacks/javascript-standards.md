---
description: >-
  Fixes the JavaScript baseline: files type-checked through JSDoc under strict compiler options, runtime validation at
  external input, modern language defaults, handled promises, and separate type check, lint, and format gates.
when_to_use: >-
  Use when creating, configuring, or reviewing authored JavaScript, or when a change adds untyped input, turns off
  checking for a file, or chooses its test runner or coverage instrument.
---

# JavaScript Standards

This standard is canonical for authored JavaScript: scripts, tools, and modules written as `.js`, `.mjs`, or `.cjs`,
including those inside a TypeScript project. It holds the choices the language leaves open, and a JavaScript programming
skill defers here for each rule it applies. Code written in TypeScript follows
[TypeScript Standards](typescript-standards.md) instead.

It implements [Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md),
Fail Closed, and
[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md). The runtime version, lockfile, and every tool
below follow [Native-First Toolchain](../../workflow/native-first-toolchain.md) and
[Reproducibility](../../../principles/software-engineering/reproducibility.md).

## Gates

- **Type check:** the TypeScript compiler checks JavaScript, emitting nothing: project-wide through `allowJs` and
  `checkJs`, or per file through `// @ts-check`
  ([JS projects](https://www.typescriptlang.org/docs/handbook/intro-to-js-ts.html)). The configuration enables `strict`
  and `noUncheckedIndexedAccess`.
- **Lint:** a linter over a committed flat configuration. Where it runs type-aware rules, the lockfile pins a compiler
  inside the range that linter supports. Example: ESLint with typescript-eslint.
- **Format:** one formatter, with overlapping lint rules disabled by a shared configuration rather than running the
  formatter as a lint rule. Example: Prettier with `eslint-config-prettier`
  ([integrating with linters](https://prettier.io/docs/integrating-with-linters)).

Findings fail at the threshold [Lint Strictness](../cross-language-lint-strictness.md) sets.

## Type and Boundary Safety

JSDoc annotations are JavaScript's static types under [Type and Boundary Safety](../code/type-and-boundary-safety.md).
In JavaScript:

- Every exported function declares its parameter and return types in JSDoc, and a shared shape is a `@typedef`.
- A file excluded from checking is a waiver with its reason, never a default.
- An error the checker must accept is silenced with `// @ts-expect-error` and its reason, which fails once the error is
  gone; `// @ts-ignore` is never used.
- An `any` in JSDoc is never written; unknown data is typed `unknown` and narrowed.
- A JSDoc annotation on parsed data is a claim, not a check. Input from a request, a file, `JSON.parse`, the command
  line, or the environment passes a runtime guard or schema before the program relies on its shape, because nothing
  checks JavaScript types at runtime.

## Language Defaults

- Code is written as ES modules, which run in strict mode.
- Bindings are `const`, or `let` when reassigned, never `var`. Equality is `===`. Strings built from values are template
  literals, and iteration over values uses `for...of`
  ([MDN code style](https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Code_style_guide/JavaScript)).
- Asynchronous code uses `async` and `await`. Every promise is awaited, returned, or given a rejection handler, because
  a floating promise's rejection escapes every handler.
- A caught error is handled, wrapped with context through `cause`, or rethrown, never swallowed. Only `Error` objects
  are thrown.

## Tests

Tests follow [Test Boundaries and Gates](../../behaviour-driven-development.md): a test that intercepts network
requests in process is a unit test, never integration evidence. A gate relies only on a coverage instrument its runtime
or runner marks stable, and measures branches where the instrument can, per
[Meaningful Coverage](../testing/meaningful-coverage.md). Example: Vitest with V8 coverage
([coverage](https://vitest.dev/guide/coverage)). Any floor is recorded under
[Layers and Adapters](../../behaviour-driven-development.md).

## Documentation

The JSDoc on an exported function is both its type and its reference documentation, so it states behaviour and thrown
errors as well as types. A change to observable behaviour updates it per
[Specification Maintenance](../specs-application-sync.md) and
Public Contract.

## Adopter Decisions

| Decision    | Option                            | Gains                                 | Costs                                          |
| ----------- | --------------------------------- | ------------------------------------- | ---------------------------------------------- |
| check scope | project-wide `checkJs`            | no file escapes by omission           | an existing backlog is cleaned before the gate |
|             | per-file `// @ts-check`           | adoption file by file                 | an unmarked file is unchecked, silently        |
| test runner | the runtime's built-in runner     | no dependency                         | coverage may still be marked experimental      |
|             | a runner package; example: Vitest | stable branch coverage and watch mode | a dependency to pin and upgrade                |

Record each choice in the repository adapter [Stack Packs](../../../conventions/structure/stack-packs.md) defines. A
per-file choice records how an unmarked file is found.

## Enforcement

The compiler, linter, and formatter enforce the gates in the adopter's own hooks and pipeline. Review applies boundary
validation and the promise and error rules no linter fully sees.
