# Just Enough F# (Primer)

**Course ID**: `just-enough-fsharp` · **Format**: Primer.

**Scope note (the text the course `overview.md` must state in its own words)**: this primer is just enough F# to
build a small compiler pipeline. It covers what the dependent topic
[`compilers-parsers-and-transpilers`](../../tech-docs/002-course-modes-and-definition-of-done.md#primer-scope) uses:
bindings, functions and currying, tuples, lists, records, unions, pattern matching and active patterns, `Option`
and `Result`, pipelines and composition, recursion, immutable maps, strings and characters, a little mutable state
and arrays for a stack machine, modules and `#load`, the small slice of .NET a lexer touches, assertion-style
tests, and the project loop. It deliberately stops before classes and objects, interfaces, async and tasks, type
providers, computation expressions, units of measure, and the wider .NET libraries. The reader needs a terminal
and the .NET SDK. Prior learning: `functional-programming` and `object-oriented-programming-essentials`.

**Short summary**: F# is a functional-first language on .NET whose unions and pattern matching make it a natural
fit for writing compilers. You learn the parts of it that a compiler needs, each by running a short program.

## Why this exists · the big idea

- **The problem before the solution**: the compilers course should spend its pages on compilers, not on F# syntax.
  A reader who meets `|>`, active patterns, and `Result.bind` for the first time in a parser stops learning
  parsing.
- **Keep-this-if-you-forget-everything**: model data as records and unions, write functions that match on them,
  and let the compiler tell you which cases you forgot. Everything else is convenience around that loop.

## Learning objectives

- Run F# as a script with `dotnet fsi` and as a small project with `dotnet run`.
- Write bindings, functions, and curried and partially applied functions, and read inferred types.
- Model data with records and discriminated unions, and take them apart with pattern matching.
- Read the incomplete-match warning (FS0025) and fix it by handling the case.
- Write active patterns for reusable tests such as "is a digit".
- Represent absence with `Option` and failure with `Result`, and chain them.
- Build pipelines with `|>` and `>>`, and use `map`, `filter`, and `fold`.
- Write recursive functions and recursive unions, including tail-recursive loops.
- Use immutable `Map` and `Set`, strings and characters, and a little mutable state.
- Organize code in modules, load one script from another, and test with assertions.

## Prerequisites

- **Prior courses**: `functional-programming`, `object-oriented-programming-essentials`.
- **Assumed knowledge**: functions, lists, and a typed language such as C# or Java. No F# is assumed.

## Mode and targets

- **Mode**: Primer. **Reason**: this is a language primer scoped to one dependent topic; the convention asks for
  By Example pace and parts, so each feature is a short program a reader runs. The scope statement above and a
  light capstone are what separate it from a By Example course.
- **Examples**: 78 (floor 75), 26 per level. **Words**: at least 28,000. **Diagrams**: 32 marked `[D]` (band 30–50).
- **Metadata**: `format: primer`; `category: programming-languages`; `description` kept from plan 03 ("Learn F#
  records, unions, and pattern matching for functional-first code."); `prerequisites` unchanged;
  `estimatedHours` from the drift test.
- **Scope check**: an example that serves the stated scope but that the compilers course does not use is allowed;
  an example that drifts toward the whole language (classes, async, computation expressions, type providers,
  units of measure) is scope creep and fails the Primer Quality Gate.

## Defects found 2026-10-09

- All 78 headings read `Example N: fsharp-example-NN` over one repeated body; the 78 `.fsx` files have one shape.
- The overview does not say what "just enough" means or which course needs it; there is no scope statement.
- The capstone is a `Program.fs` project that needs the SDK's package restore, and no check runs it. The overview
  refuses to name an SDK version. The folder also holds an untracked `obj/` build directory from an earlier build
  (not part of the course and never committed).
- No example prints output; no expected files, no `run.yaml`.

## Accuracy notes

- F# 10 and the SDK (10.0.401) come from plan 05's catalog on 2026-10-09; the maker reads the F# language
  reference (`learn.microsoft.com/en-us/dotnet/fsharp/`) for every feature and records every compiler message
  (FS0025, FS0001, FS0058) from the pinned SDK, not from memory.
- Output of floats, culture, and sorting is made deterministic: `CultureInfo.InvariantCulture`, the
  `DOTNET_SYSTEM_GLOBALIZATION_INVARIANT` setting, and no output that depends on the CPU count
  ([tech-docs/004](../../tech-docs/004-code-harness-and-determinism.md#determinism-rules-this-plan-adds)).
- `dotnet new console -lang F#` and `dotnet run` need the SDK's template and `FSharp.Core` library pack offline;
  probe P2 decides. If P2 fails, examples 70–72 become `dotnet fsi` scripts with the project shown as a marked
  illustration, and nothing else changes.
- The primer repeats nothing the compilers course teaches; it ends where the compilers course begins.

## Concepts

- **co-01 · fsi-and-scripts** — `dotnet fsi --exec` runs a script and prints what the script prints.
- **co-02 · let-and-shadowing** — `let` binds immutably; a repeated name shadows.
- **co-03 · primitive-types-and-conversion** — `int`, `float`, `bool`, `char`, `string`; conversions are explicit.
- **co-04 · functions-and-expressions** — functions are curried; `if` and `match` are expressions; `unit`.
- **co-05 · significant-whitespace** — indentation defines blocks.
- **co-06 · inference-and-generics** — types are inferred; `'a` is a type variable.
- **co-07 · tuples** — tuples group and destructure values.
- **co-08 · lists** — immutable lists with literals, cons, ranges, and comprehensions.
- **co-09 · sequences-and-laziness** — `seq` computes on demand.
- **co-10 · records** — named fields, copy-and-update, structural equality.
- **co-11 · discriminated-unions** — unions model one of several cases, with data.
- **co-12 · pattern-matching** — `match` deconstructs unions, records, tuples, and lists.
- **co-13 · exhaustiveness-and-warnings** — FS0025 reports missing cases; warnings can fail a build.
- **co-14 · active-patterns** — single-case, partial, and multi-case active patterns.
- **co-15 · option** — `Option` models expected absence.
- **co-16 · result** — `Result` models expected failure; `bind` chains steps; exceptions for the rest.
- **co-17 · pipelines** — `|>` makes data flow left to right.
- **co-18 · composition-and-operators** — `>>`, custom operators, and combinator style.
- **co-19 · higher-order-list-functions** — `map`, `filter`, `fold`, `collect`, and friends.
- **co-20 · recursion** — `let rec`, mutual recursion, and tail-recursive accumulators.
- **co-21 · recursive-unions** — expression trees as recursive unions.
- **co-22 · maps-and-sets** — immutable `Map` and `Set` as environments and symbol tables.
- **co-23 · strings-and-chars** — slicing, splitting, and the character tests a lexer needs.
- **co-24 · mutability-and-arrays** — `mutable`, `ref`, arrays, `ResizeArray`, and loops.
- **co-25 · modules-and-loading** — modules, namespaces, access, and `#load`.
- **co-26 · formatted-output** — `printfn`, `sprintf`, and `%A`.
- **co-27 · dotnet-interop** — calling .NET types for characters, strings, parsing, and files.
- **co-28 · equality-and-comparison** — structural equality and ordering for records and unions.
- **co-29 · testing-by-assertion** — small assertion helpers and seeded checks.
- **co-30 · project-mode** — `dotnet new`, `dotnet run`, `dotnet build`, compile order in the project file.

## Worked examples

### Beginner (`learning/beginner.md`, Examples 1–26)

- **ex-01 · first-fsi-script** — print a line from a script run by `dotnet fsi` — verify the output and the exit
  code. (co-01) [D]
- **ex-02 · values-with-let** — bind a value and use it — verify. (co-02)
- **ex-03 · shadowing-is-not-mutation** — shadow a name and show the old value is unchanged — verify. (co-02) [D]
- **ex-04 · primitive-types** — `int`, `float`, `bool`, `char`, `string`; an implicit conversion is refused —
  verify the recorded diagnostic. (co-03)
- **ex-05 · defining-functions** — a function with two arguments — verify. (co-04)
- **ex-06 · currying-and-partial-application** — apply one argument and keep a function — verify. (co-04) [D]
- **ex-07 · significant-whitespace** — a misindented block is refused — verify the recorded diagnostic. (co-05)
- **ex-08 · reading-inferred-types** — print the type name of several values — verify. (co-06)
- **ex-09 · annotations-when-needed** — an annotation resolves an ambiguous overload — verify. (co-06)
- **ex-10 · tuples** — build a tuple and return two values — verify. (co-07) [D]
- **ex-11 · tuple-destructuring** — destructure in a `let` and in a parameter — verify. (co-07)
- **ex-12 · list-literals-and-cons** — `[1; 2; 3]`, `::`, and `@` — verify. (co-08) [D]
- **ex-13 · ranges-and-comprehensions** — `[1 .. 5]` and `[for x in 1 .. 5 -> x * x]` — verify. (co-08)
- **ex-14 · list-patterns** — match `[]` and `head :: tail` — verify a sum function. (co-08, co-12)
- **ex-15 · records** — define and build a record — verify the printed fields. (co-10) [D]
- **ex-16 · copy-and-update** — `{ r with Field = v }` — verify the original is unchanged. (co-10)
- **ex-17 · discriminated-unions** — a `Shape` union — verify. (co-11) [D]
- **ex-18 · unions-with-data** — cases that carry different data — verify. (co-11)
- **ex-19 · matching-basics** — constants, wildcards, and guards — verify. (co-12) [D]
- **ex-20 · matching-records-and-tuples** — patterns inside patterns — verify. (co-12)
- **ex-21 · incomplete-matches** — compile a partial match and read warning FS0025 — verify the recorded
  warning. (co-13) [D]
- **ex-22 · option** — `Some` and `None` — verify. (co-15) [D]
- **ex-23 · option-functions** — `Option.map`, `Option.bind`, and `Option.defaultValue` — verify. (co-15)
- **ex-24 · everything-is-an-expression** — `if`, `match`, and `unit` — verify. (co-04)
- **ex-25 · printf-formatting** — `printfn`, `sprintf`, and `%A` — verify. (co-26)
- **ex-26 · string-basics** — slicing, `String.concat`, and `Split` — verify. (co-23)

### Intermediate (`learning/intermediate.md`, Examples 27–52)

- **ex-27 · result** — `Ok` and `Error` — verify. (co-16) [D]
- **ex-28 · result-map-and-bind** — chain two fallible steps — verify the first error wins. (co-16)
- **ex-29 · the-pipeline-operator** — rewrite nested calls as a pipeline — verify equal results. (co-17) [D]
- **ex-30 · function-composition** — `>>` builds a function from two — verify. (co-18)
- **ex-31 · map-and-filter** — `List.map`, `List.filter` — verify. (co-19)
- **ex-32 · fold** — `List.fold` as a loop with an accumulator — verify. (co-19) [D]
- **ex-33 · the-list-module** — `zip`, `partition`, `collect`, `sortBy` — verify. (co-19)
- **ex-34 · recursion** — `let rec` factorial and length — verify. (co-20)
- **ex-35 · tail-recursion** — an accumulator version against the plain one — verify equal results on 10,000
  elements. (co-20) [D]
- **ex-36 · mutual-recursion** — `let rec … and …` for even and odd — verify. (co-20)
- **ex-37 · recursive-unions** — an arithmetic expression union — verify a hand-built tree. (co-21) [D]
- **ex-38 · evaluating-a-tree** — evaluate the union — verify. (co-21)
- **ex-39 · maps** — `Map.add`, `Map.tryFind` — verify immutability. (co-22) [D]
- **ex-40 · sets** — membership and set operations — verify. (co-22)
- **ex-41 · sequences-and-laziness** — `Seq.unfold` and `Seq.take` — verify only needed items are computed.
  (co-09) [D]
- **ex-42 · arrays-and-resizearray** — a mutable array and a growable list used as a stack — verify. (co-24)
- **ex-43 · mutable-and-ref** — `mutable` locals and `ref` cells, and why a closure cannot capture a `mutable`
  local — verify the recorded diagnostic. (co-24) [D]
- **ex-44 · loops** — `for` and `while` — verify. (co-24)
- **ex-45 · single-case-active-patterns** — an active pattern that parses a value — verify. (co-14) [D]
- **ex-46 · partial-active-patterns** — `(|Digit|_|)` for characters — verify. (co-14) [D]
- **ex-47 · multi-case-active-patterns** — classify a character as digit, letter, or other — verify. (co-14)
- **ex-48 · custom-operators** — define `>>=` and `<|>` for `Option` — verify. (co-18) [D]
- **ex-49 · generic-functions** — `'a` in a user function — verify. (co-06)
- **ex-50 · equality-and-comparison** — structural equality for records and unions — verify. (co-28) [D]
- **ex-51 · exceptions-vs-results** — `try … with` for the unexpected, `Result` for the expected — verify. (co-16)
- **ex-52 · converting-option-and-result** — a helper from `Option` to `Result` — verify. (co-16)

### Advanced (`learning/advanced.md`, Examples 53–78)

- **ex-53 · modules** — group functions in a module — verify. (co-25) [D]
- **ex-54 · private-and-nested-modules** — `private` and nested modules — verify the recorded diagnostic for
  private access. (co-25)
- **ex-55 · namespaces-and-open** — `open` and name clashes — verify. (co-25)
- **ex-56 · loading-scripts** — `#load` a second script — verify. (co-25) [D]
- **ex-57 · char-and-string-api** — `Char.IsDigit`, `Char.IsLetter`, and `String` methods — verify. (co-23, co-27)
- **ex-58 · stringbuilder** — build text efficiently — verify. (co-27)
- **ex-59 · parsing-numbers** — `Int32.TryParse` and `Double.TryParse` with the invariant culture — verify. (co-27)
  [D]
- **ex-60 · reading-a-file** — read a sample file next to the unit — verify. (co-27)
- **ex-61 · dotnet-collections** — a .NET `Dictionary` beside `Map` — verify. (co-27)
- **ex-62 · a-lexer-by-patterns** — tokenize `12 + 3` with list patterns and active patterns — verify the token
  list. (co-12, co-14) [D]
- **ex-63 · a-parser-by-recursion** — parse `1 + 2 * 3` into a union — verify the tree. (co-21) [D]
- **ex-64 · evaluating-with-result** — evaluate with division by zero as an `Error` — verify. (co-16)
- **ex-65 · environments-with-maps** — variables in a `Map` — verify. (co-22)
- **ex-66 · pipelines-of-results** — chain lex, parse, and evaluate with `Result.bind` — verify. (co-16) [D]
- **ex-67 · a-stack-with-lists** — push and pop with a list — verify. (co-08)
- **ex-68 · assertion-helpers** — a tiny `check` helper — verify the pass and the failure lines. (co-29) [D]
- **ex-69 · seeded-checks** — a linear-congruential generator and 100 seeded checks — verify zero failures. (co-29)
- **ex-70 · project-mode** — `dotnet new console -lang F#` and `dotnet run`, offline (probe P2) — verify the
  output. (co-30) [D]
- **ex-71 · project-files-and-compile-order** — `Compile Include` order and the error when it is wrong — verify
  the recorded diagnostic. (co-30) [D]
- **ex-72 · build-diagnostics** — a type error through `dotnet build` — verify the recorded text. (co-30)
- **ex-73 · warnings-as-errors** — FS0025 fails a build when warnings are errors — verify the recorded failure.
  (co-13)
- **ex-74 · memoization** — a closure over a `Dictionary` — verify the call count. (co-24)
- **ex-75 · sequence-expressions** — `seq { yield … }` — verify. (co-09)
- **ex-76 · formatted-tables** — padded columns with `%-10s` and `%6.2f` — verify. (co-26)
- **ex-77 · rendering-diagnostics** — a `Diagnostic` record with a span and a caret rendering — verify. (co-10)
  [D]
- **ex-78 · capstone-preview** — run the capstone on three lines — verify the output. (co-01–co-30)

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-shadowed-value-not-updated`, `kata-02-incomplete-match-silent-failure`,
  `kata-03-int-division-truncates`, `kata-04-option-unwrapped-too-early`, `kata-05-fold-wrong-accumulator-order`,
  `kata-06-nan-breaks-equality`, `kata-07-culture-dependent-parse`, `kata-08-active-pattern-order`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6 (for example, why F# makes you
  write `mutable`, and when an exception is still the right tool).

## Capstone spec

**A reverse Polish calculator** (light consolidation, about 80 lines). `rpn.fsx` tokenizes a line, evaluates it
with a list used as a stack, keeps variables in a `Map`, and reports an unknown word or a stack underflow as a
`Result` error. It is run on a fixed script of lines; the expected output is the table of results and errors. It
touches records, unions, matching, an active pattern, `Option`, `Result`, a pipeline, and a module. It does not
touch a parser or a type checker, which belong to the dependent course.

## Code and harness

- One toolchain: `dotnet` (`dotnet fsi --exec`; a `dotnet run` project only if probe P2 passes). No NuGet package.
- Seeds are fixed; floats print with an invariant culture; no `DateTime.Now`.
- Compiler diagnostics shown in a lesson are the output of an expected-fail `check` run with the message recorded
  in an expected stdout or stderr file.

## Lineage

- Replaces the templated course measured on 2026-10-09 (2,952 words, 81 code files). Topic lineage: the
  `just-enough-fsharp` brief of the 2026-07-19 fundamentally-strong plan.

## In which paths

- `careers/fundamentally-strong/software-engineer`, `careers/immediately-effective/software-engineer`, and
  `careers/interview-ready/software-engineer` — extension phase `more-computer-science`. No manifest change.
