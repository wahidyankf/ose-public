---
title: "Overview"
date: 2026-07-14T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: Just Enough Nvim -- you should be comfortable opening, editing, and saving
  files before writing and running TypeScript; prior programming maturity from Just Enough Python helps but is not required.
- **Tools & environment**: a macOS/Linux terminal; **Node.js** installed (`node --version`) with
  **npm**; the **`tsc`** compiler, the **`tsx`** runner, and the **`eslint`**/**`prettier`** CLIs, all
  installable via `npm`. TypeScript, Node.js, `tsx`, `eslint`, and `prettier` are all Tier-1 OSS
  licenses (Apache-2.0, MIT, MIT, MIT, and MIT respectively) -- free to teach and free to use.
- **Assumed knowledge**: basic programming concepts (variables, functions, control flow) from any
  prior language; basic terminal use.

## Why this exists -- the big idea

JavaScript runs the web but has no types, so whole classes of bugs only surface at runtime, in front
of a user -- TypeScript moves those failures to compile time instead. The one idea worth keeping if
you forget everything else: **a type is a compile-time proof about a runtime shape, checked
structurally (by shape, not by name)** -- you pay in annotations and buy caught errors.

**Cross-cutting big idea**: `correctness-vs-pragmatism` -- TypeScript is deliberately _gradual_.
`any`, `unknown`, and `never` (Examples 46-48) let you dial rigor up where correctness genuinely
matters and stay loose where speed matters more. Nothing in this primer forces "provably right"
before anything runs; the compiler is a tool you reach for, not a gate you cannot bypass.

## Install and run your first script

Install Node.js for your platform (macOS: `brew install node`; Debian/Ubuntu: your distribution's
current `nodejs` package, or download from [nodejs.org](https://nodejs.org/)), then confirm the
version:

```text
$ node --version
v24.16.0
```

**A note on versions**: this primer's examples were authored and verified against the exact toolchain
installed in the sandbox that produced every captured "Output" block on this site: **TypeScript
5.8.3** (`tsc --version`) and **`tsx` 4.21.0** (`tsx --version`). The current published-latest
upstream at authoring time is TypeScript **7.0.2** (a native-Go compiler rewrite, GA 2026-07-08) and
`tsx` **4.23.1** -- noticeably ahead of this repository's pinned versions. Every example here uses
only syntax and `tsconfig.json` options that are valid on **both** 5.8.3 and forward-compatible with
7.0 (no option TypeScript 7.0 removed or hardened into an error is used anywhere in this primer).
`eslint` **9.39.4** and `prettier` **3.8.1** are the exact versions Examples 77-78 (and the capstone)
were run against.

Every example in this primer is a complete, self-contained `.ts` file (or small file set) colocated
under `learning/code/`. The command you will run for almost every one of them is one of these two:

```text
tsx example.ts
tsc --noEmit example.ts
```

**Exceptions, all deliberate**: Examples 2-3 demonstrate the `tsc` compile-and-emit workflow and a
`tsconfig.json` directly, rather than a single `tsx` run; Examples 61-64, 77-82, and the capstone name
their files differently (`main.ts`, a multi-file layout, `eslint.config.mjs`, and so on) because the
file layout itself is part of what the example teaches -- each one states its exact run command in
its own **Run** line.

## How this primer is organized

- **Beginner** (Examples 1-28) -- running and compiling TypeScript, a minimal `tsconfig.json`,
  the primitive types, type inference, arrays and tuples, object types, `type` versus `interface`,
  union and literal types, and function typing (parameters, return types, optional/default/rest
  params, arrow functions, and inferred callback parameters).
- **Intermediate** (Examples 29-60) -- narrowing (`typeof`, truthiness, `in`, `instanceof`,
  equality), user-defined type guards and assertion functions, discriminated unions and
  exhaustiveness checking, generics (identity functions, constraints, defaults, generic interfaces),
  `unknown`/`any`/`never`, structural typing and excess-property checks, intersection types, type
  assertions (`as`, `!`, `as const`), enums and their modern `as const` alternative, and `keyof` plus
  index signatures.
- **Advanced** (Examples 61-82) -- ESM modules (named/default exports, type-only imports, barrel
  re-exports), typed Promises and `async`/`await`, utility types (`Partial`, `Pick`, `Omit`,
  `Record`, `Readonly`, `Required`, `ReturnType`), mapped types, `eslint`/`prettier` from the CLI, and
  a `tsc --noEmit` error-then-fix workflow, closing with an end-to-end typed fetch and a full module
  that combines every mechanism above.

Every example cites the concept (`co-NN`) it exercises, and every claim about TypeScript's version,
license, and tooling traces to `typescriptlang.org`, `devblogs.microsoft.com/typescript`, `nodejs.org`,
and `npmjs.com`, web-verified 2026-07-12 and re-confirmed 2026-07-14.

## Scope: just enough, not comprehensive

This is a **Primer**, not a comprehensive TypeScript reference: it covers exactly the language
surface later topics in this journey depend on -- `14-frontend-essentials`, `47-advanced-frontend`,
and the TypeScript side of `15-software-testing` -- and deliberately excludes `satisfies` (TS 4.9 --
a natural companion to `as const`, out of scope here on purpose, not by oversight), decorators,
advanced conditional and template-literal types, and the broader `typing` metaprogramming surface. If
a TypeScript feature is not exercised by a later topic in this journey, it is out of scope here on
purpose.

---

Next: [Beginner Examples](./beginner.md) →
