# Type Systems (By Example)

**Course ID**: `type-systems` · **Format**: By Example.

**Scope note**: Teaches the type ideas that make wrong states hard to write, with code in three languages: OCaml
(inference, modules, functors, signatures, GADTs), TypeScript (structural types, narrowing, variance, branded
types, type-level computation), and Rust (traits, ownership as types, phantom types, `Option` and `Result`). It
ends with a small Hindley-Milner inference engine. It leaves out dependent types, proof assistants, and the
formal semantics of any one language beyond a progress-and-preservation sketch, and it does not teach any one
language (`just-enough-typescript` and `just-enough-rust` do; OCaml syntax is explained where it first appears).
F# appears in prose only, and Haskell appears in two comparison snippets marked as illustrations
([tech-docs/008 D4](../../tech-docs/008-decision-records.md#d4--type-systems-uses-typescript-ocaml-and-rust-not-haskell)).

**Short summary**: A type system is a small, fast proof checker that runs before your program does. You learn what
it can prove, what it cannot, and how to shape your types so the compiler rejects the bugs you would otherwise
find in production.

## Why this exists · the big idea

- **The problem before the solution**: most bugs that reach production are states the program should never have
  been able to reach (a null, a missing case, a mixed-up id, a payment both paid and refunded). Teams add tests and
  comments where a type would have closed the door.
- **Keep-this-if-you-forget-everything**: a type is a set of allowed values. Sum types say "one of these", product
  types say "all of these", and a well-chosen combination leaves no room for an invalid value. Then let the
  compiler check every case.

## Learning objectives

- Model a domain with sum and product types so invalid states have no representation.
- Use exhaustive pattern matching and read the compiler's diagnostic when a case is missing.
- Use `Option` and `Result` instead of null and exceptions, in three languages.
- Explain generic functions, parametricity, and Hindley-Milner inference, and run unification by hand and in code.
- Choose between structural and nominal typing, and state variance for covariant, contravariant, and invariant
  positions.
- Use traits, module signatures, and functors to abstract over behavior, and say what higher-kinded types add.
- Use newtypes, branded types, phantom types, and typestate so the type carries information with no runtime cost.
- State what soundness means, where each language gives it up, and how a runtime check restores it at the edge.

## Prerequisites

- **Prior courses**: `functional-programming`, `programming-paradigms`, `just-enough-typescript`, and (added by this
  plan, [tech-docs/001](../../tech-docs/001-current-state.md#prerequisite-changes)) `just-enough-rust`.
- **Assumed knowledge**: functions, records, higher-order functions, and basic TypeScript and Rust syntax. No OCaml
  is assumed.

## Mode and targets

- **Mode**: By Example. **Reason**: every type feature is a program the compiler accepts next to a near-twin it
  rejects, and the rejection is a recorded diagnostic. A reader learns a rule by seeing exactly what the checker
  says.
- **Examples**: 78 (floor 75), 26 per level. **Words**: at least 28,000. **Diagrams**: 36 marked `[D]` (band 30–50).
- **Metadata**: `format: by-example`; `category: computer-science`; `description` kept from plan 03 ("Use algebraic
  data types and type inference to make wrong states hard to write."); `prerequisites` gain `just-enough-rust`;
  `estimatedHours` from the drift test.

## Defects found 2026-10-09

- All 78 headings read `Example N: type-systems-NN` over one repeated body (unique-body ratio 0.01).
- The code folders hold 78 near-identical sources, and the capstone is mirrored in OCaml, F#, and Haskell "to
  compare syntax"; Haskell cannot run under the harness (no toolchain).
- The overview said the course "deliberately does not require Just Enough F#" yet the concept list is F#-centred;
  `intuition.md` is a side page with no examples.
- No example prints output or a compiler diagnostic; no expected files, no `run.yaml`.

## Accuracy notes

- Compiler versions come from plan 05's catalog on 2026-10-09: TypeScript 7.0.2 on Node 24, OCaml 5.5.1, Rust
  1.99.0 (edition 2024). The maker records every diagnostic from the pinned compiler; none is typed from memory,
  because messages, codes, and wording change between releases. Rust diagnostics use `--error-format=short` and
  `--color never` so the text is stable.
- TypeScript 7 is the native port of the compiler; the maker reads its release notes and checks that
  `erasableSyntaxOnly`, `strict`, and `strictFunctionTypes` behave as the course says
  ([tech-docs/004](../../tech-docs/004-code-harness-and-determinism.md#run-specs-by-language)).
- Hindley-Milner: R. Milner (1978) and L. Damas and R. Milner (1982) are cited with access dates; the maker also
  checks the let-polymorphism and value-restriction text against the OCaml manual for 5.5.
- Variance claims: TypeScript array covariance is unsound by design (the Handbook says so); `ReadonlyArray` and
  `strictFunctionTypes` behaviors are checked by a recorded diagnostic.
- Rust: ownership, borrowing, lifetimes, and trait coherence follow the Rust Reference and The Book; the error codes
  (such as E0004, E0308, E0382, E0117) are read from the recorded output.
- Haskell and F# statements (typeclasses, computation expressions) come from their language documentation with
  access dates; they are prose and comparison tables only.

## Concepts

- **co-01 · types-as-sets** — a type is the set of values it allows; counting values counts possibilities.
- **co-02 · static-vs-dynamic** — static checks reject shape errors before the program runs.
- **co-03 · product-types** — records and tuples hold all of several fields.
- **co-04 · sum-types** — unions and variants hold exactly one of several cases.
- **co-05 · illegal-states-unrepresentable** — choose types so invalid combinations cannot be built.
- **co-06 · pattern-matching-and-exhaustiveness** — matching deconstructs variants, and the checker lists missing cases.
- **co-07 · option-instead-of-null** — absence is a value of a type, not a hole in every type.
- **co-08 · result-and-errors-as-values** — failure is part of the signature.
- **co-09 · parametric-polymorphism** — generic code works the same for every type; parametricity limits what it can do.
- **co-10 · type-inference** — the compiler infers types from use.
- **co-11 · hindley-milner** — constraints, unification, the occurs check, let-polymorphism, and the value restriction.
- **co-12 · structural-vs-nominal** — whether types are equal by shape or by name.
- **co-13 · variance** — whether a container of a subtype is a subtype, by position.
- **co-14 · narrowing-and-guards** — control flow refines a type.
- **co-15 · newtypes-and-branded-types** — a wrapper gives the same representation a distinct meaning.
- **co-16 · phantom-types-and-typestate** — a type parameter carries only compile-time information.
- **co-17 · traits-and-typeclasses** — ad hoc polymorphism with bounds, associated types, and coherence.
- **co-18 · dispatch** — static dispatch (monomorphization) against dynamic dispatch (trait objects).
- **co-19 · modules-and-signatures** — module types define interfaces and can hide representation.
- **co-20 · functors-as-modules** — modules parameterized by modules.
- **co-21 · higher-kinded-types** — abstraction over type constructors, and what is missing in TypeScript and Rust.
- **co-22 · functor-applicative-monad-laws** — `map`, `apply`, and `bind` as signatures with laws.
- **co-23 · recursive-types** — a type may refer to itself; boxes and fixed points.
- **co-24 · gadts** — a type index lets the checker prove an evaluator needs no runtime tag checks.
- **co-25 · soundness-and-escape-hatches** — what soundness promises, and where `any`, casts, and `unsafe` break it.
- **co-26 · effects-in-types** — errors, absence, and fallibility visible in signatures.
- **co-27 · ownership-as-types** — moves and borrows are checked by the type system.
- **co-28 · lifetimes** — a reference type records how long it is valid.
- **co-29 · type-level-computation** — mapped, conditional, and template-literal types compute types.
- **co-30 · types-meet-runtime** — data from outside is untyped until validated at the boundary.

## Worked examples

Each entry names the language in parentheses; the harness toolchain follows from it.

### Beginner (`learning/beginner.md`, Examples 1–26)

- **ex-01 · types-as-sets-of-values** (TS) — list every value of `boolean` and of a union of two literals — verify
  the counts. (co-01) [D]
- **ex-02 · static-vs-dynamic** (TS) — one function fails when run and is refused by `tsc` — verify the recorded
  diagnostic and the runtime error. (co-02)
- **ex-03 · first-diagnostic** (TS) — assign a string to a number and read the full `tsc` message — verify the
  recorded text. (co-02)
- **ex-04 · inferred-types** (OCaml) — print inferred signatures with `ocamlc -i` — verify `int`, `string`, and
  function types. (co-10)
- **ex-05 · tuples-and-records** (OCaml) — build a record and a tuple — verify the printed fields. (co-03)
- **ex-06 · structs-and-tuples** (Rust) — build a struct and a tuple struct — verify. (co-03)
- **ex-07 · counting-product-types** (TS) — enumerate `boolean × boolean` and a three-case tag times two — verify
  the product of the counts. (co-01, co-03) [D]
- **ex-08 · discriminated-union** (TS) — a `Shape` union with a `kind` tag and an `area` function — verify areas.
  (co-04) [D]
- **ex-09 · variant-types** (OCaml) — a `shape` variant and a function over it — verify. (co-04)
- **ex-10 · enums-with-data** (Rust) — an enum whose variants hold data — verify. (co-04)
- **ex-11 · counting-sum-types** (TS) — count the values of a union and compare with the product — verify the sum
  of the counts. (co-01, co-04) [D]
- **ex-12 · match-in-ocaml** (OCaml) — `match` with guards — verify the results. (co-06)
- **ex-13 · match-in-rust** (Rust) — `match` with a binding and a wildcard — verify. (co-06)
- **ex-14 · exhaustive-switch** (TS) — add a case and let `never` make `tsc` object — verify the recorded
  diagnostic. (co-06) [D]
- **ex-15 · missing-case-ocaml** (OCaml) — compile a partial match and read warning 8 — verify the recorded
  warning. (co-06)
- **ex-16 · missing-case-rust** (Rust) — compile a partial match and read the error — verify the recorded
  diagnostic. (co-06)
- **ex-17 · null-in-typescript** (TS) — turn on strict null checks and read the diagnostic for a possibly-absent
  value — verify. (co-07)
- **ex-18 · option-in-ocaml** (OCaml) — `option` with `Option.map` and `Option.value` — verify. (co-07)
- **ex-19 · option-in-rust** (Rust) — `Option` with `map`, `and_then`, and `unwrap_or` — verify. (co-07) [D]
- **ex-20 · result-in-rust** (Rust) — a parse function returning `Result` — verify both outcomes. (co-08)
- **ex-21 · result-in-ocaml** (OCaml) — `result` with `Result.bind` — verify a two-step chain. (co-08)
- **ex-22 · result-in-typescript** (TS) — a `Result` union with `ok` and `err` helpers — verify. (co-08)
- **ex-23 · modeling-payment-states** (TS) — a payment as a union of `Pending`, `Paid`, and `Refunded` with data
  per case — verify a transition function. (co-05) [D]
- **ex-24 · illegal-states-unrepresentable** (TS) — a record with two booleans against a union; count each — verify
  the invalid combinations vanish. (co-05) [D]
- **ex-25 · aliases-are-not-new-types** (Rust) — a `type` alias accepts the wrong id; verify no error is raised.
  (co-15)
- **ex-26 · reading-a-signature** (OCaml, TS, Rust) — read `map` in three signatures and label the type variables
  — verify with `ocamlc -i`, `tsc`, and `rustc` output. (co-09) [D]

### Intermediate (`learning/intermediate.md`, Examples 27–52)

- **ex-27 · generic-functions** (TS) — a generic `first` and a constrained `longest` — verify. (co-09)
- **ex-28 · polymorphic-types** (OCaml) — `'a -> 'a` and `'a list -> int` from `ocamlc -i` — verify. (co-09) [D]
- **ex-29 · generics-in-rust** (Rust) — a generic `largest` with a bound — verify. (co-09)
- **ex-30 · parametricity** (OCaml) — a function of type `'a -> 'a` can only return its argument; try writing
  another and record the error — verify. (co-09)
- **ex-31 · generic-containers** (Rust, TS) — a `Stack<T>` in each language — verify the same behavior. (co-09)
- **ex-32 · local-inference** (TS) — where inference works and where an annotation is required — verify the
  recorded diagnostic. (co-10)
- **ex-33 · unification-by-hand** (OCaml) — implement `unify` on a tiny type language — verify four cases. (co-11)
  [D]
- **ex-34 · constraint-generation** (OCaml) — turn `fun x -> x + 1` into equations and solve them — verify the
  resulting type. (co-11) [D]
- **ex-35 · the-occurs-check** (OCaml) — show why `fun x -> x x` has no type; record the compiler message — verify.
  (co-11)
- **ex-36 · let-polymorphism** (OCaml) — a `let`-bound function used at two types against a lambda-bound one —
  verify the recorded error. (co-11) [D]
- **ex-37 · value-restriction** (OCaml) — a weak type variable in `ocamlc -i` output and how to remove it — verify.
  (co-11)
- **ex-38 · structural-vs-nominal** (TS, Rust) — two same-shaped types pass in TypeScript and fail in Rust —
  verify the recorded diagnostic. (co-12) [D]
- **ex-39 · subtyping-and-widening** (TS) — assign a narrower object to a wider type — verify. (co-12)
- **ex-40 · excess-property-checks** (TS) — a fresh object literal rejected where a variable passes — verify the
  recorded diagnostic. (co-12)
- **ex-41 · covariant-reads** (TS) — a `ReadonlyArray<Cat>` is a `ReadonlyArray<Animal>` — verify. (co-13) [D]
- **ex-42 · unsound-array-covariance** (TS) — a `Cat[]` seen as `Animal[]` accepts a dog; the runtime breaks —
  verify the printed failure. (co-13, co-25) [D]
- **ex-43 · contravariant-parameters** (TS) — `strictFunctionTypes` rejects a narrower callback — verify the
  recorded diagnostic. (co-13) [D]
- **ex-44 · variance-annotations** (OCaml) — `+'a` accepted on an immutable box, rejected on a mutable one —
  verify the recorded error. (co-13)
- **ex-45 · narrowing-by-typeof** (TS) — `typeof`, `in`, and equality narrowing — verify the narrowed types in
  `tsc` output. (co-14) [D]
- **ex-46 · user-defined-guards** (TS) — a type predicate and its risk when it lies — verify. (co-14)
- **ex-47 · narrowing-by-discriminant** (TS) — switch on `kind` — verify. (co-14)
- **ex-48 · defining-a-trait** (Rust) — a `Shape` trait with two impls — verify. (co-17)
- **ex-49 · trait-bounds** (Rust) — `where` clauses and the error for a missing bound — verify the recorded
  diagnostic. (co-17) [D]
- **ex-50 · associated-types** (Rust) — a trait with an associated type — verify. (co-17)
- **ex-51 · static-vs-dynamic-dispatch** (Rust) — generics against `dyn Trait` — verify equal output and explain
  the cost. (co-18) [D]
- **ex-52 · coherence-and-the-orphan-rule** (Rust) — implementing a foreign trait for a foreign type is refused —
  verify the recorded diagnostic. (co-17)

### Advanced (`learning/advanced.md`, Examples 53–78)

- **ex-53 · module-signatures** (OCaml) — a `module type` and a conforming module — verify. (co-19) [D]
- **ex-54 · abstract-types** (OCaml) — hide a representation behind a signature and record the error when code
  reaches in — verify. (co-19) [D]
- **ex-55 · functors** (OCaml) — `Set.Make` with a custom ordering — verify. (co-20) [D]
- **ex-56 · writing-a-functor** (OCaml) — a `Counter` functor over a key module — verify. (co-20)
- **ex-57 · functor-and-monad-signatures** (OCaml) — `Functor` and `Monad` as module types, instantiated for
  `option` (Haskell's `class Functor` shown as an illustration) — verify. (co-22) [D]
- **ex-58 · functor-laws-tested** (OCaml) — check identity and composition with a seeded generator — verify zero
  failures. (co-22)
- **ex-59 · monad-laws** (OCaml, Rust) — check left identity, right identity, and associativity for `option` and
  `Result` — verify. (co-22)
- **ex-60 · the-higher-kinded-gap** (TS) — try to write `Functor<F>` and record the error; show the interface-map
  encoding (Haskell shown as an illustration) — verify. (co-21) [D]
- **ex-61 · generic-associated-types** (Rust) — a lending-iterator-style trait with a GAT — verify. (co-21)
- **ex-62 · recursive-types** (OCaml, Rust) — a tree in OCaml and in Rust with `Box` — verify. (co-23) [D]
- **ex-63 · gadts** (OCaml) — a typed expression language where `Add` cannot take a bool — verify the recorded
  error for the ill-typed term. (co-24) [D]
- **ex-64 · gadt-evaluator** (OCaml) — an `eval` with no tag checks — verify. (co-24)
- **ex-65 · phantom-types** (OCaml) — a validated-string type that only `validate` can produce — verify. (co-16) [D]
- **ex-66 · phantom-data** (Rust) — `PhantomData` for units of measure — verify the recorded mismatch error.
  (co-16)
- **ex-67 · branded-types** (TS) — a brand makes two ids distinct — verify the recorded diagnostic. (co-15) [D]
- **ex-68 · newtypes** (Rust) — `UserId` and `OrderId` — verify the recorded mix-up error. (co-15)
- **ex-69 · typestate-builder** (Rust) — a connection that cannot send before it is opened — verify the recorded
  error. (co-16) [D]
- **ex-70 · ownership-as-types** (Rust) — a use after a move is refused — verify the recorded diagnostic. (co-27)
  [D]
- **ex-71 · borrowing-and-lifetimes** (Rust) — a reference that outlives its owner is refused — verify. (co-27,
  co-28) [D]
- **ex-72 · mapped-and-conditional-types** (TS) — `Readonly`-style mapping and an `Awaited`-style conditional type
  — verify the resulting types in `tsc` output. (co-29) [D]
- **ex-73 · template-literal-types** (TS) — a typed route builder — verify an invalid route is refused. (co-29)
- **ex-74 · escape-hatches** (TS, Rust, OCaml) — `as`, `unsafe`, and `Obj.magic` skip the checker; show the
  runtime result — verify. (co-25) [D]
- **ex-75 · progress-and-preservation** (OCaml) — a stepper on a typed tiny language; every step keeps the
  type — verify over a seeded set of terms. (co-25)
- **ex-76 · types-at-the-boundary** (TS) — validate unknown data into a typed value before use — verify the
  accepted and rejected inputs. (co-30) [D]
- **ex-77 · errors-in-signatures** (Rust, TS) — a signature that shows what can fail, against one that hides it —
  verify the callers must handle each case. (co-26) [D]
- **ex-78 · capstone-preview** (OCaml) — run the capstone inference on three programs — verify the three types and
  one rejected program. (co-10, co-11)

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-null-slips-through`, `kata-02-missing-union-case`, `kata-03-array-covariance-unsound`,
  `kata-04-unit-mixup`, `kata-05-stringly-typed-state`, `kata-06-any-hides-error`, `kata-07-unchecked-cast`,
  `kata-08-weak-type-escapes`. Each `before` compiles but prints `FAIL: <reason>`; each `after` reshapes the types
  so the checker enforces the rule.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6 (for example, why not make every
  string a branded type, and why TypeScript keeps array covariance).

## Capstone spec

**A small type inferencer.** `minityper` is an OCaml program that infers types for a lambda calculus with `let`,
integers, booleans, and `if`: it builds type variables, collects constraints, unifies with an occurs check,
generalizes at `let`, and prints each program's type or the reason it has none. A test script runs a table of
accepted and rejected programs. The expected output holds the inferred types and the recorded error messages.

## Code and harness

- Three toolchains (`typescript`, `ocaml`, `rust`); no package beyond each compiler and its standard library.
  The compile-failure examples are separate runs of kind `check` with expected exit and diagnostic files
  ([tech-docs/004](../../tech-docs/004-code-harness-and-determinism.md#run-specs-by-language)). A shared
  `tsconfig.base.json` sets `strict` and `erasableSyntaxOnly`.
- Seeds are fixed in the unit; generators are written in the example, not taken from a library.
- Haskell and F# snippets appear only in marked illustrations; they are not run and no example depends on them.

## Lineage

- Replaces the templated course measured on 2026-10-09 (2,781 words, 83 code files). Topic lineage: the
  `type-systems` brief of the 2026-07-19 fundamentally-strong plan, which put OCaml, Haskell, and F# side by side.

## In which paths

- `careers/fundamentally-strong/software-engineer`, `careers/immediately-effective/software-engineer`, and
  `careers/interview-ready/software-engineer` — extension phase `more-computer-science`. No manifest change.
