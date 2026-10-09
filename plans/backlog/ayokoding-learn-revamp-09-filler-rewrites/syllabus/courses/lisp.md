# Lisp (By Example)

**Course ID**: `lisp` · **Format**: By Example.

**Scope note**: Teaches the Lisp idea that code is data, using Scheme and Racket for the core and for macros
(`syntax-rules`, hygiene, expansion, and a little `syntax-parse`), and Clojure for a short sidebar on persistent
collections, `defmacro`, `gensym`, sequences, and JVM interop. Common Lisp is covered in prose and one comparison
example marked as an illustration (it has no catalog toolchain,
[tech-docs/008 D6](../../tech-docs/008-decision-records.md#d6--clojure-joins-the-catalog-common-lisp-stays-prose)).
It leaves out Emacs Lisp, Common Lisp's object system and condition system beyond a comparison, Racket's `#lang`
design toolkit beyond one DSL example, and large Clojure topics such as concurrency and ClojureScript.

**Short summary**: In Lisp the program is a list the language can read, build, and rewrite. You learn that idea in
Scheme, use it to add new syntax with macros, and then see what changes in Clojure and Common Lisp.

## Why this exists · the big idea

- **The problem before the solution**: most languages treat code as text the compiler owns, so adding a control
  form means changing the language. Engineers who have never used a macro system do not know what is possible,
  or when a macro is the wrong tool.
- **Keep-this-if-you-forget-everything**: a Lisp program is nested lists (s-expressions); `quote` stops evaluation,
  `eval` starts it, and a macro is a function from code to code that runs before the program does. Hygiene decides
  whether the code a macro builds can clash with the code around it.

## Learning objectives

- Read and write s-expressions, and explain why `(+ 1 2)` is both code and a list.
- Use `quote`, `quasiquote`, `unquote`, and `eval` to build and run code from data.
- Write recursive, tail-recursive, and higher-order procedures, and closures that keep state.
- Write `syntax-rules` macros that add control forms and show their expansion.
- Show a capture bug in a non-hygienic macro and explain why the Scheme macro avoids it and Clojure needs
  `gensym`.
- Use `call/cc` for early exit and generators, and say when not to.
- Use Clojure's vectors, maps, sequences, `defmacro`, and Java interop at sidebar depth.
- Say what Scheme, Clojure, and Common Lisp each choose and give up.

## Prerequisites

- **Prior courses**: `functional-programming`, `programming-paradigms`.
- **Assumed knowledge**: functions, recursion, and higher-order functions in any language. No Lisp is assumed.

## Mode and targets

- **Mode**: By Example. **Reason**: every Lisp form is a REPL-sized program, and macros are learned by expanding
  them and reading the result. A reader sees the expansion, then the behavior.
- **Examples**: 78 (floor 75), 26 per level. **Words**: at least 28,000. **Diagrams**: 34 marked `[D]` (band 30–50).
  One example (ex-75) is marked `[I]`: it compares Common Lisp, which has no toolchain here, and says so.
- **Metadata**: `format: by-example`; `category: programming-languages`; `description` kept from plan 03 ("See how
  code can be data, with Scheme macros and a short look at Clojure."); `prerequisites` unchanged;
  `estimatedHours` from the drift test.

## Defects found 2026-10-09

- All 78 headings read `Example N: lisp-example-NN` over one repeated body (unique-body ratio 0.01).
- 79 `.rkt` files share one shape, and the Clojure sidebar is a single file `sidebar.clj` that nothing runs.
- No example shows a macro expansion, though expansion is the point of the concept list.
- The Clojure and Common Lisp claims in the text have no source and no run.

## Accuracy notes

- Racket 9.3 comes from plan 05's catalog on 2026-10-09. The maker checks (probe P6) that `#lang r5rs`,
  `racket/base`, `racket/match`, `syntax/parse`, and `rackunit` load, and uses `expand-once` for expansion output.
- Clojure 1.12.6 (released 2026-09-02, seen 2026-10-09), `spec.alpha` 0.5.238, and `core.specs.alpha` 0.4.74 are
  the jars of the new `clojure` toolchain ([tech-docs/004](../../tech-docs/004-code-harness-and-determinism.md#the-clojure-entry)).
  The maker re-checks the versions at execution.
- Scheme semantics (proper tail calls, `syntax-rules`, `call/cc`): R7RS-small (`small.r7rs.org`) is the reference,
  with R5RS as the language Racket ships (`#lang r5rs`); probe P6 checks whether an `r7rs` language is also in the
  image and the course says which one its units use.
- Hygiene: Dybvig's "Syntactic Abstraction in Scheme" and the R7RS-small macro section are cited with access dates.
  The claim that a Clojure macro needs `gensym` (or `name#` inside syntax quote) is demonstrated by a capture that
  prints a wrong result, not only stated.
- Common Lisp statements (`defmacro`, `gensym`, `loop`, the condition system, being a Lisp-2) come from the
  Common Lisp HyperSpec and the standard's history with access dates; the course says they were not run here.
- Lineage dates (McCarthy 1960, Scheme 1975, the Common Lisp standard 1994, Clojure 2007) are checked against
  primary or well-sourced histories, with access dates.

## Concepts

- **co-01 · s-expressions** — code and data share one nested-list form.
- **co-02 · homoiconicity** — programs are ordinary data a program can build and transform.
- **co-03 · reader** — the reader turns text into forms before evaluation.
- **co-04 · quote** — `quote` suppresses evaluation.
- **co-05 · eval** — `eval` runs a constructed form; a metacircular evaluator is a small `eval`.
- **co-06 · basic-data** — atoms, symbols, equality, association lists, and hash tables.
- **co-07 · cons-cells** — `cons` builds pairs; lists are chains of pairs.
- **co-08 · car-and-cdr** — `car` and `cdr` take a pair apart.
- **co-09 · define** — `define` binds values and procedures.
- **co-10 · lambda** — `lambda` makes an anonymous procedure.
- **co-11 · closures-and-scope** — procedures capture their lexical environment.
- **co-12 · recursion** — recursion over lists and numbers.
- **co-13 · tail-calls-and-loops** — proper tail calls make loops constant in space.
- **co-14 · higher-order-functions** — functions that take and return functions; delayed evaluation.
- **co-15 · conditionals-and-truthiness** — `if`, `cond`, and what counts as false.
- **co-16 · local-binding** — `let`, `let*`, `letrec`, and internal definitions.
- **co-17 · repl-and-testing** — the read-eval-print loop, errors, and small test helpers.
- **co-18 · quasiquote** — templates with unquote holes.
- **co-19 · syntax-rules** — pattern macros with ellipsis, literals, and recursion.
- **co-20 · macro-hygiene** — introduced names do not capture user names; hygiene can be broken on purpose.
- **co-21 · macros-as-new-forms** — macros add control forms and DSLs, and are the wrong tool for plain functions.
- **co-22 · macroexpansion** — expansion makes a macro inspectable.
- **co-23 · continuations** — `call/cc` reifies the rest of a computation.
- **co-24 · vectors-and-mutation** — indexed collections and in-place update.
- **co-25 · clojure-data-structures** — persistent vectors, maps, and sets.
- **co-26 · clojure-homoiconicity** — Clojure code is Clojure data.
- **co-27 · clojure-defmacro** — Clojure macros, syntax quote, and deliberate `gensym`.
- **co-28 · clojure-jvm-interop** — Clojure calls Java directly.
- **co-29 · clojure-seq-and-laziness** — the sequence abstraction and lazy sequences.
- **co-30 · lisp-lineage-and-comparison** — what Scheme, Clojure, and Common Lisp choose and give up.

## Worked examples

Examples 1–64 use Scheme or Racket; examples 65–74 and the Clojure half of 76 use Clojure; the language follows
from the file extension.

### Beginner (`learning/beginner.md`, Examples 1–26)

- **ex-01 · the-first-s-expression** — evaluate `(+ 1 2)` and `(* 2 (+ 3 4))` — verify the values. (co-01) [D]
- **ex-02 · code-is-a-list** — `(quote (+ 1 2))` has three elements; evaluate it after `eval` — verify both. (co-01,
  co-02) [D]
- **ex-03 · atoms-and-lists** — `pair?`, `null?`, `symbol?`, `number?` over several forms — verify a table. (co-06)
- **ex-04 · the-reader** — read a string into a form with `read` — verify the result is a list of symbols and
  numbers. (co-03) [D]
- **ex-05 · quote-and-its-shorthand** — `'x`, `(quote x)`, and what is not quoted — verify. (co-04)
- **ex-06 · eval** — build `(+ 1 2)` from pieces and `eval` it — verify. (co-05)
- **ex-07 · cons-cells** — build a list from `cons` and draw it as boxes — verify. (co-07) [D]
- **ex-08 · car-and-cdr** — `car`, `cdr`, and `cadr` on nested lists — verify. (co-08)
- **ex-09 · lists-and-dotted-pairs** — proper and improper lists — verify the printed forms. (co-07)
- **ex-10 · define-values** — `define` a value and use it — verify. (co-09)
- **ex-11 · define-procedures** — `define` a procedure with two parameters — verify. (co-09)
- **ex-12 · lambda** — an anonymous procedure and its equivalence to `define` — verify. (co-10)
- **ex-13 · if-and-cond** — branches with `if` and `cond` — verify. (co-15)
- **ex-14 · truthiness** — only `#f` is false; `0` and `'()` are true — verify. (co-15)
- **ex-15 · let-and-let-star** — parallel and sequential binding — verify the different results. (co-16) [D]
- **ex-16 · letrec-and-internal-define** — local recursive procedures — verify. (co-16)
- **ex-17 · recursion-on-lists** — `length`, `sum`, and `member` by hand — verify. (co-12) [D]
- **ex-18 · append-and-reverse** — implement both and compare their cost on a long list — verify equal results.
  (co-12)
- **ex-19 · accumulators** — pass state through arguments — verify. (co-12)
- **ex-20 · map** — apply a procedure to every element — verify. (co-14) [D]
- **ex-21 · filter-and-fold** — `filter` and `foldl` — verify. (co-14)
- **ex-22 · returning-procedures** — a procedure that makes procedures (`make-adder`) — verify. (co-14)
- **ex-23 · association-lists** — `assoc` and update by copying — verify. (co-06)
- **ex-24 · symbols-and-strings** — `symbol->string` and back — verify. (co-06)
- **ex-25 · eq-eqv-equal** — the three equality procedures on numbers, lists, and strings — verify a table.
  (co-06) [D]
- **ex-26 · the-repl-loop** — write a read-eval-print loop over a list of input strings — verify the transcript.
  (co-17, co-03, co-05) [D]

### Intermediate (`learning/intermediate.md`, Examples 27–52)

- **ex-27 · closures-capture** — a procedure keeps its defining variables alive — verify. (co-11) [D]
- **ex-28 · counters-with-closures** — two independent counters — verify. (co-11)
- **ex-29 · the-environment-model** — nested frames and variable lookup — verify with a hand-built environment.
  (co-11) [D]
- **ex-30 · lexical-vs-dynamic-scope** — compare lexical scope with a parameter object — verify the different
  results. (co-11)
- **ex-31 · tail-calls** — loop a million times in constant space — verify the result and that no deep stack is
  needed. (co-13) [D]
- **ex-32 · tail-vs-non-tail** — the same sum written both ways — verify equal results at a size both finish.
  (co-13)
- **ex-33 · named-let** — a loop as a named `let` — verify. (co-13)
- **ex-34 · do-loops** — `do` with a step and a test — verify. (co-13)
- **ex-35 · vectors** — `make-vector`, `vector-ref`, `vector-set!` — verify. (co-24)
- **ex-36 · in-place-algorithms** — reverse a vector in place — verify. (co-24) [D]
- **ex-37 · hash-tables** — a mutable table and counting words — verify the sorted counts. (co-06)
- **ex-38 · quasiquote-templates** — build a form with holes — verify. (co-18) [D]
- **ex-39 · unquote-splicing** — splice a list into a form — verify. (co-18)
- **ex-40 · building-code-as-data** — assemble a form and `eval` it — verify. (co-02, co-05) [D]
- **ex-41 · symbolic-differentiation** — differentiate and simplify expressions — verify five derivatives. (co-02)
  [D]
- **ex-42 · an-arithmetic-interpreter** — evaluate a tiny arithmetic language with `case` — verify. (co-02)
- **ex-43 · pattern-matching-with-match** — Racket `match` on forms — verify. (co-02)
- **ex-44 · environments-as-alists** — look up and extend — verify. (co-11)
- **ex-45 · a-metacircular-evaluator** — `eval` and `apply` over an environment — verify a factorial program.
  (co-05) [D]
- **ex-46 · delay-and-force** — thunks and promises — verify a computation happens once. (co-14)
- **ex-47 · errors-and-handlers** — raise an error and catch it — verify the message. (co-17)
- **ex-48 · escaping-with-call-cc** — early exit from a loop — verify. (co-23) [D]
- **ex-49 · generators-with-continuations** — a generator that yields three values — verify. (co-23) [D]
- **ex-50 · dynamic-wind** — cleanup around an escape — verify the order of effects. (co-23)
- **ex-51 · backtracking-with-amb** — a small search — verify the first solution. (co-23) [D]
- **ex-52 · a-test-helper** — a `check-equal` procedure and a failing case — verify the pass and fail lines. (co-17)

### Advanced (`learning/advanced.md`, Examples 53–78)

- **ex-53 · the-first-macro** — `my-unless` with `syntax-rules` — verify the behavior. (co-19) [D]
- **ex-54 · pattern-variables-and-ellipsis** — `my-and` over any number of forms — verify. (co-19)
- **ex-55 · a-new-control-form** — a `while` loop macro — verify. (co-21) [D]
- **ex-56 · macro-literals** — a `for` macro with an `in` keyword — verify. (co-19)
- **ex-57 · recursive-macros** — a two-case `my-or` — verify. (co-19) [D]
- **ex-58 · hygiene-avoids-capture** — `swap!` with an internal `tmp` — verify that a user variable `tmp` is
  unharmed. (co-20) [D]
- **ex-59 · breaking-hygiene-on-purpose** — an anaphoric `it` with `datum->syntax` — verify. (co-20) [D]
- **ex-60 · inspecting-expansion** — print the one-step expansion of a macro use — verify the expanded form.
  (co-22) [D]
- **ex-61 · macro-vs-function** — a `my-if` function evaluates both branches; the macro does not — verify the
  side effects. (co-21)
- **ex-62 · syntax-parse** — a macro with a clear syntax error message — verify the recorded error. (co-19)
- **ex-63 · compile-time-computation** — compute a table at expansion time — verify. (co-21) [D]
- **ex-64 · a-small-dsl** — a `state-machine` macro — verify the transitions. (co-21) [D]
- **ex-65 · clojure-first-forms** — evaluate forms in Clojure — verify. (co-25)
- **ex-66 · persistent-collections** — vectors, maps, and sets; the old value is unchanged — verify. (co-25) [D]
- **ex-67 · clojure-code-is-data** — quote a form, take it apart, and `eval` it — verify. (co-26) [D]
- **ex-68 · clojure-defmacro** — the same `unless` as a Clojure macro — verify. (co-27)
- **ex-69 · clojure-macroexpand** — `macroexpand-1` of a macro use — verify the form. (co-27) [D]
- **ex-70 · gensym-and-capture** — a macro that captures `tmp`, then the `gensym` fix — verify the wrong and the
  right result. (co-27, co-20) [D]
- **ex-71 · syntax-quote** — `` ` ``, `~`, `~@`, and qualified names — verify. (co-27)
- **ex-72 · the-seq-abstraction** — lazy sequences over `range` and `map` — verify only needed items are
  computed. (co-29) [D]
- **ex-73 · jvm-interop** — call `Math/abs` and `.toUpperCase` — verify. (co-28)
- **ex-74 · reading-a-macro-error** — a malformed macro use and its message — verify the recorded text. (co-27)
- **ex-75 · common-lisp-compared** `[I]` — `defmacro`, `gensym`, and `loop` in Common Lisp beside the Scheme and
  Clojure forms; shown, not run, because no Common Lisp toolchain is in the catalog — verify the comparison
  table. (co-30)
- **ex-76 · one-macro-two-lisps** — the same macro in Racket and Clojure with their outputs side by side — verify
  both. (co-30) [D]
- **ex-77 · when-not-to-write-a-macro** — rewrite a macro as a function and compare — verify equal results.
  (co-21)
- **ex-78 · capstone-preview** — run the capstone on a short program — verify. (co-01–co-30)

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-forgotten-quote`, `kata-02-eq-on-numbers-and-lists`, `kata-03-non-tail-accumulator-growth`,
  `kata-04-macro-evaluates-argument-twice`, `kata-05-macro-captures-variable`, `kata-06-unquote-where-splice-needed`,
  `kata-07-call-cc-reentry-surprise`, `kata-08-macro-where-function-would-do`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6 (for example, why Scheme chose
  hygiene while Common Lisp did not, and why Clojure restricts reader macros).

## Capstone spec

**A small Lisp in Lisp.** `mini-lisp` is a Racket program with a reader, an evaluator with closures and
environments, `quote` and `quasiquote`, and a `define-macro` form implemented as a plain (non-hygienic) expander.
It runs a program that defines a macro, shows its expansion, and then shows a variable-capture bug. A second unit
in Clojure writes the same macro with `gensym` and prints the fixed result. The expected outputs hold the
program's result, the expansions, and both capture demonstrations.

## Code and harness

- Two toolchains: `racket` (Scheme through `#lang r5rs`, Racket through `racket/base`) and `clojure` (new in this
  plan; no dependency beyond Clojure core, `spec.alpha`, and `core.specs.alpha`).
- Output is printed with fixed formats; no `random`, no clock, no `gensym` name in compared output (a
  `gensym`-generated name is replaced by a stable label before printing). Clojure start-up time is recorded by
  probe P10.
- The Common Lisp example is an illustration (`<!-- harness: illustration -->`) and says why it is not run.

## Lineage

- Replaces the templated course measured on 2026-10-09 (3,962 words, 81 code files). Topic lineage: the `lisp`
  brief of the 2026-07-19 fundamentally-strong plan.

## In which paths

- `careers/fundamentally-strong/software-engineer` only — extension phase `more-computer-science`. No manifest
  change.
