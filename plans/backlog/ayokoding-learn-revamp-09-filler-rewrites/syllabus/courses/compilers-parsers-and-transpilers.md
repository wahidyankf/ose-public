# Compilers, Parsers, and Transpilers (By Example)

**Course ID**: `compilers-parsers-and-transpilers` · **Format**: By Example.

**Scope note**: Builds a compact language-processing pipeline in F# for a small language called Tiny
(arithmetic, comparisons, `let`, `if`, functions, closures): a lexer, three parsers (recursive descent, Pratt,
and hand-written combinators), an AST, name resolution, a type check, a tree-walking interpreter, a stack
machine, a small intermediate representation with optimizations, a JavaScript text emitter, and source maps.
It leaves out register allocation, garbage collection, LLVM, incremental parsing, macro systems, and full type
inference (`type-systems` teaches the typing ideas), and it does not teach F# (`just-enough-fsharp` does).

**Short summary**: Every program you run first goes through a compiler or an interpreter. You build a small one,
stage by stage, and watch each stage's output on the same few programs.

## Why this exists · the big idea

- **The problem before the solution**: language tools (linters, formatters, query languages, config formats,
  code generators) are compilers in disguise. An engineer who has never built one treats parsing as magic and
  writes fragile regular expressions instead.
- **Keep-this-if-you-forget-everything**: a language processor is a pipeline of small, testable functions, each
  turning one explicit data type into the next (characters, tokens, tree, checked tree, output); keep the types
  explicit and every stage is easy to test.

## Learning objectives

- Write a lexer that tracks positions and reports bad input.
- Parse expressions with recursive descent, Pratt parsing, and parser combinators, and explain how each handles
  precedence and associativity.
- Resolve names and scopes, check types, and report errors that name the cause.
- Evaluate a tree, compile to a stack machine, and show the two agree.
- Lower to a small IR, apply two optimizations, and show they preserve meaning.
- Emit JavaScript text and a source map, and test the whole pipeline with a golden corpus.

## Prerequisites

- **Prior courses**: `just-enough-fsharp`, `type-systems`, `computer-science-foundations`.
- **Assumed knowledge**: F# records, unions, pattern matching, `Option`, `Result`, and pipelines; the idea of an
  algebraic data type; stacks, maps, and recursion.

## Mode and targets

- **Mode**: By Example. **Reason**: each stage is a function from one input type to one output type, so a reader
  learns it by running it on one program and reading the result before moving on.
- **Examples**: 78 (floor 75), 26 per level. **Words**: at least 28,000. **Diagrams**: 32 marked `[D]` (band 30–50).
- **Metadata**: `format: by-example`; `category: computer-science`; `description` kept from plan 03 ("Build a
  lexer, parser, and code generator for a small language."); `prerequisites` unchanged; `estimatedHours` from
  the drift test.

## Defects found 2026-10-09

- All 78 headings read `Example N: compiler-stage-NN` over one repeated body; the 78 `.fsx` files share one shape.
- The concept list names FParsec, a NuGet package that the offline harness cannot restore, and the lessons show
  nothing from it.
- The capstone lexes numbers and `+` only, so it is a calculator, not a pipeline.
- No example prints output; no expected files, no `run.yaml`, no diagrams.

## Accuracy notes

- F# language and `dotnet fsi`: `learn.microsoft.com/en-us/dotnet/fsharp/`; the catalog's SDK is 10.0.401 (F# 10),
  read in plan 05's catalog on 2026-10-09. The maker re-reads the language reference for every feature used.
- Pratt parsing: V. Pratt, "Top Down Operator Precedence" (1973); the maker cites it and one modern explanation
  with access dates.
- FParsec is described in prose only (`quanttec.com/fparsec`, to be opened and cited). The course builds its own
  small combinator library ([tech-docs/008 D10](../../tech-docs/008-decision-records.md#d10--hand-written-parser-combinators-instead-of-fparsec)).
- Source maps: the maker identifies the current specification (the TC39 source map work and the older Revision 3
  proposal), cites it with an access date, and checks the VLQ example string against a second source.
- Warning FS0025 (incomplete matches) text: recorded from the pinned SDK in ex-58, not typed from memory.
- Crafting Interpreters (`craftinginterpreters.com`) is cited as a reference; no text is copied.

## Concepts

- **co-01 · compiler-pipeline** — source becomes tokens, a tree, a checked tree, and output.
- **co-02 · lexer** — a lexer turns characters into tokens.
- **co-03 · token-union** — tokens are explicit variants.
- **co-04 · trivia** — whitespace and comments are skipped on purpose.
- **co-05 · positions-and-lexer-errors** — tokens carry spans; bad input becomes a diagnostic.
- **co-06 · grammar** — a grammar defines the valid programs.
- **co-07 · recursive-descent** — one function per grammar rule.
- **co-08 · ast-union** — AST variants model the syntax shapes.
- **co-09 · operator-precedence** — precedence decides the tree shape.
- **co-10 · pratt-parsing** — binding power drives expression parsing.
- **co-11 · associativity** — equal-precedence operators group left or right.
- **co-12 · parser-combinators** — parsers are values that compose.
- **co-13 · sequence-and-choice** — sequencing, repetition, and choice combinators.
- **co-14 · backtracking** — when a failed alternative may be retried and when it must not.
- **co-15 · parser-equivalence** — different parsers must produce the same tree.
- **co-16 · parse-errors** — errors state position and expectation; recovery continues after an error.
- **co-17 · tree-walking-interpreter** — recursive evaluation over the AST.
- **co-18 · exhaustive-eval** — every AST variant has an evaluation case.
- **co-19 · environments** — environments hold bindings.
- **co-20 · lexical-scope** — inner bindings shadow outer ones.
- **co-21 · closures** — functions capture their defining environment.
- **co-22 · name-resolution** — names resolve to binding sites before running.
- **co-23 · type-checking** — operand and argument types are checked after parsing.
- **co-24 · ir** — an intermediate representation separates front end from back end.
- **co-25 · code-generation** — a back end produces target text; transpilation targets another language.
- **co-26 · stack-machine** — instructions, a VM loop, jumps, and call frames.
- **co-27 · source-maps** — mappings keep the origin of generated code.
- **co-28 · optimization** — transformations that preserve meaning.
- **co-29 · test-corpus** — golden outputs and generated programs make behavior executable.
- **co-30 · diagnostic-quality** — helpful errors are a language feature.

## Worked examples

### Beginner (`learning/beginner.md`, Examples 1–26)

- **ex-01 · pipeline-stages** — declare the four stage types and run `1 + 2` through stub stages — verify each
  stage prints its own output. (co-01) [D]
- **ex-02 · token-union** — model tokens as a union — verify the token list for `3 * (4 + 5)`. (co-03) [D]
- **ex-03 · char-scanner** — walk a string with `peek` and `advance` — verify the characters visited. (co-02)
- **ex-04 · lex-numbers** — scan integer and decimal literals — verify `12`, `3.5`, and a rejected `3.`. (co-02)
- **ex-05 · lex-operators** — scan one- and two-character operators — verify that `<=` beats `<` then `=`. (co-02)
- **ex-06 · lex-identifiers-keywords** — scan names and map keywords — verify `let` is a keyword and `lets` is a
  name. (co-02, co-03)
- **ex-07 · skip-whitespace** — skip spaces, tabs, and newlines — verify positions still advance. (co-04)
- **ex-08 · line-comments** — skip `//` comments — verify the tokens around them. (co-04)
- **ex-09 · block-comments** — skip nested `/* */` comments — verify nesting depth and the unterminated-comment
  error. (co-04)
- **ex-10 · token-positions** — attach line and column to each token — verify spans on a two-line input. (co-05)
  [D]
- **ex-11 · lexer-errors** — report an unexpected character with its position — verify the message. (co-05)
- **ex-12 · string-literals** — scan strings with `\n` and `\"` escapes — verify the decoded value and the
  unterminated error. (co-02, co-05)
- **ex-13 · lazy-lexer** — expose the lexer as a lazy sequence — verify the first three tokens are produced
  without scanning the rest. (co-02)
- **ex-14 · token-cursor** — wrap tokens in a cursor with `peek`, `next`, and `expect` — verify. (co-07)
- **ex-15 · grammar-ebnf** — write the expression grammar as EBNF and check three strings with a recognizer —
  verify accept and reject. (co-06) [D]
- **ex-16 · ast-union** — model `Expr` as a union — verify a hand-built tree. (co-08) [D]
- **ex-17 · pretty-print-ast** — print an AST back as source with minimal parentheses — verify a round trip for
  five expressions. (co-08)
- **ex-18 · parse-primary** — parse numbers and parenthesized expressions by recursive descent — verify. (co-07)
- **ex-19 · no-precedence-parse** — parse all operators at one level — verify `1 + 2 * 3` gives the wrong
  grouping, as the lesson predicts. (co-09)
- **ex-20 · layered-precedence** — one function per level (term, factor) — verify the shape of `1 + 2 * 3`.
  (co-09) [D]
- **ex-21 · left-associativity** — loop instead of recursing on the right — verify `8 - 3 - 2` equals 3. (co-11)
  [D]
- **ex-22 · unary-minus** — parse `-x` and `- -x` — verify the binding against `*`. (co-09)
- **ex-23 · parse-errors-with-position** — report the expected token and where — verify. (co-16)
- **ex-24 · trailing-tokens** — reject input left after a full parse — verify the error for `1 2`. (co-16)
- **ex-25 · evaluate-expression** — evaluate the AST with a `match` — verify results for six inputs. (co-17)
  [D]
- **ex-26 · errors-as-values** — turn division by zero into a `Result` error, not an exception — verify both
  outcomes. (co-17, co-30)

### Intermediate (`learning/intermediate.md`, Examples 27–52)

- **ex-27 · binding-power-table** — write the binding-power table for the operators — verify it as a table.
  (co-10) [D]
- **ex-28 · pratt-loop** — implement `parseExpr minBp` — verify the same trees as recursive descent. (co-10) [D]
- **ex-29 · pratt-right-associative** — make `^` right-associative with binding powers — verify `2 ^ 3 ^ 2`
  equals 512. (co-10, co-11)
- **ex-30 · pratt-postfix-call** — parse a postfix call `f(x)` — verify the tree. (co-10)
- **ex-31 · comparison-and-logic** — add `<`, `==`, `&&`, `||` with their precedence — verify a truth table.
  (co-09)
- **ex-32 · if-expression** — parse and evaluate `if c then a else b` — verify both branches. (co-08)
- **ex-33 · let-binding** — parse and evaluate `let x = e in body` — verify a nested example. (co-19) [D]
- **ex-34 · parser-type** — define a parser as a function from input to a result of value and rest — verify a
  one-character parser. (co-12) [D]
- **ex-35 · map-and-bind** — write `map`, `bind`, and `return` — verify a chain of three parsers. (co-12)
- **ex-36 · sequence-and-choice** — write `andThen` and `orElse` — verify a choice between two keywords. (co-13,
  co-14) [D]
- **ex-37 · many-and-sepby** — write `many` and `sepBy` — verify `1,2,3`. (co-13)
- **ex-38 · number-combinator** — build the number parser from combinators — verify. (co-12)
- **ex-39 · expression-combinators** — build the expression grammar with `chainl1` — verify the same AST as the
  Pratt parser. (co-12, co-15) [D]
- **ex-40 · backtracking-attempt** — compare `attempt` with committed choice — verify the different error
  positions. (co-14)
- **ex-41 · labelled-errors** — label a parser so failure says "expected number" — verify the message. (co-16)
- **ex-42 · parser-equivalence-property** — over 200 seeded random expressions, three parsers give equal ASTs —
  verify zero mismatches. (co-15)
- **ex-43 · error-recovery** — recover at `;` and keep parsing — verify two errors from one run. (co-16)
- **ex-44 · statements-and-blocks** — parse `{ … }` blocks and `;` — verify. (co-08)
- **ex-45 · function-definitions** — parse `fn f(a, b) = e` — verify the AST. (co-08)
- **ex-46 · environment-map** — use an immutable map as an environment — verify extension does not change the
  old one. (co-19)
- **ex-47 · shadowing** — nested `let` shadows an outer name — verify the inner and outer values. (co-20) [D]
- **ex-48 · closures** — return a function that captures a variable — verify two counters stay independent.
  (co-21) [D]
- **ex-49 · recursion** — define a recursive function — verify factorial of 6. (co-19)
- **ex-50 · name-resolution-pass** — resolve names to binding sites and report unbound names — verify. (co-22) [D]
- **ex-51 · duplicate-definitions** — report a duplicate in one scope — verify. (co-22)
- **ex-52 · type-check-basic** — check Int, Bool, and function types on operators and `if` — verify the error for
  `1 + true`. (co-23) [D]

### Advanced (`learning/advanced.md`, Examples 53–78)

- **ex-53 · type-check-calls** — check call arity and argument types — verify. (co-23)
- **ex-54 · type-error-messages** — print expected and found with a span — verify the text. (co-30)
- **ex-55 · inference-sketch** — infer a let-bound function's type by unification on a tiny subset — verify
  `let f x = x + 1` is Int to Int. (co-23) [D]
- **ex-56 · typed-ast** — return a typed tree from the checker — verify the annotations. (co-23)
- **ex-57 · interpreter-end-to-end** — run source text through the whole front end and evaluate — verify a
  program's output. (co-17) [D]
- **ex-58 · exhaustiveness-warning** — add an AST case and read the compiler's incomplete-match warning — verify
  the recorded warning text. (co-18)
- **ex-59 · stack-instructions** — define the instruction union and the VM loop — verify `1 + 2 * 3`. (co-26) [D]
- **ex-60 · compile-to-stack** — compile the AST to instructions — verify the listing. (co-26) [D]
- **ex-61 · locals-and-slots** — compile `let` to local slots — verify. (co-26)
- **ex-62 · jumps-and-labels** — compile `if` with jumps and back-patching — verify the listing. (co-26) [D]
- **ex-63 · call-frames** — compile calls with frames — verify factorial 5 and the frame depth. (co-26) [D]
- **ex-64 · vm-matches-interpreter** — over 100 seeded programs, the VM and the interpreter agree — verify zero
  mismatches. (co-17, co-26, co-29)
- **ex-65 · three-address-code** — lower to a small IR — verify the listing. (co-24) [D]
- **ex-66 · constant-folding** — fold constant subtrees — verify before and after. (co-28) [D]
- **ex-67 · dead-branch-elimination** — remove a branch whose condition is constant — verify. (co-28)
- **ex-68 · common-subexpressions** — reuse a repeated subexpression in the IR — verify the instruction count
  drops. (co-28)
- **ex-69 · optimizer-preserves-meaning** — over seeded programs, optimized and unoptimized results are equal —
  verify. (co-28, co-29) [D]
- **ex-70 · javascript-expressions** — emit JavaScript text for expressions — verify the text. (co-25)
- **ex-71 · javascript-functions** — emit functions and closures — verify the text. (co-25) [D]
- **ex-72 · reserved-word-mangling** — rename identifiers that clash with JavaScript reserved words — verify
  the mapping. (co-25)
- **ex-73 · transpile-pipeline** — turn source into JavaScript text end to end — verify against the expected
  file. (co-25) [D]
- **ex-74 · source-map-mappings** — record generated-to-source positions — verify the mapping table. (co-27) [D]
- **ex-75 · source-map-vlq** — encode mappings as base64 variable-length quantities — verify a known string.
  (co-27)
- **ex-76 · golden-corpus** — run a corpus of programs against golden outputs — verify all pass and one
  deliberate change fails. (co-29) [D]
- **ex-77 · diagnostic-rendering** — render an error with the source line and a caret — verify the output. (co-30)
  [D]
- **ex-78 · capstone-preview** — run the capstone on a program — verify the output and the JavaScript text.
  (co-01–co-30)

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-right-recursion-left-assoc`, `kata-02-keyword-prefix-identifier`,
  `kata-03-unterminated-comment-loop`, `kata-04-precedence-off-by-one`, `kata-05-closure-captures-mutable`,
  `kata-06-unbound-name-at-runtime`, `kata-07-jump-target-not-patched`, `kata-08-optimizer-changes-meaning`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6 (for example, why a Pratt parser
  and not a parser generator here, and why keep the type checker a separate pass).

## Capstone spec

**Tiny, end to end.** A program `tiny.fsx` that reads Tiny source from a string, lexes, parses (Pratt),
resolves names, type-checks, and then runs it two ways (interpreter and stack machine), optimizes, and emits
JavaScript text with a source map. A second run executes the capstone's own test script. The expected output
holds the result, the instruction listing, the JavaScript text, and the mapping table.

## Code and harness

- F# on the `dotnet` toolchain (SDK 10.0.401): each unit is a `dotnet fsi --exec` script; no NuGet package.
  Probes P1 and P2 ([tech-docs/004](../../tech-docs/004-code-harness-and-determinism.md#phase-2-probes)) decide
  the environment variables and whether the capstone may be a project.
- Seeds are fixed; a small generator is written in the example because `System.Random` output may change between
  .NET versions. No `DateTime.Now`, no `Environment.ProcessorCount` in compared output.
- The emitted JavaScript is compared as text; it is never run (no second toolchain in one unit).

## Lineage

- Replaces the templated course measured on 2026-10-09 (2,700 words, 80 F# files). Topic lineage: the
  `compilers-parsers-and-transpilers` brief of the 2026-07-19 fundamentally-strong plan and cohort 2 of the
  2026-08-15 jvm-and-build-your-own plan.

## In which paths

- `careers/fundamentally-strong/software-engineer`, `careers/immediately-effective/software-engineer`, and
  `careers/interview-ready/software-engineer` — extension phase `more-computer-science`. No manifest change.
