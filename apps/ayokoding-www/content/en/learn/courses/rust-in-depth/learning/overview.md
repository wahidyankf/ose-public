---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

Prerequisites for this course: [just-enough-rust](/en/learn/courses/just-enough-rust/learning/overview) for Rust's basic syntax, which every example here assumes you can already read. Assumed knowledge: comfort with Rust's basic syntax from just-enough-rust.

## Why this exists -- the big idea

**The problem before the solution**: just-enough-rust gets you reading and writing Rust, but nobody teaches the idioms, standard library, error handling, and tooling at the depth working developers use daily. Learners translate their first language into Rust instead of writing Rust. **Keep this if you forget everything else**: write Rust the way its own standard library and idiomatic style guide do, not the way your first language would.

## Tensions and trade-offs -- when NOT to reach for this

- **Idiom versus intuition**: idiomatic Rust often looks stricter than the clever version, and choosing the borrow checker costs a small struggle while buying memory safety for every future reader.
- **Standard library versus dependency**: the standard library covers text, time, collections, and threads, so reaching outward spends supply-chain budget; spend it only when the stdlib shape genuinely cannot express the need.
- **When NOT**: specialized concurrency system design lives in its own course, and web frameworks live in theirs; this course stays on general-purpose fluency and surveys those angles only so you can recognize them.

## Lineage -- where this sits

Rust grew out of systems work at Mozilla: memory safety without a garbage collector, fearless concurrency, and tooling with strong opinions. just-enough-rust teaches the syntax walking in; this course teaches the idioms professionals write with, and the standard library is the textbook throughout.

## How this course is organized

[Beginner](/en/learn/courses/rust-in-depth/learning/beginner) (Examples 1-25) covers control flow, collections, error handling, and standard-library text, file, and time work. [Intermediate](/en/learn/courses/rust-in-depth/learning/intermediate) (Examples 26-53) covers modules and packages, the testing convention, and generics with value semantics. [Advanced](/en/learn/courses/rust-in-depth/learning/advanced) (Examples 54-78) surveys concurrency deterministically, then tooling, style, and interop, and finishes by reading idiomatic code. The [capstone](/en/learn/courses/rust-in-depth/learning/capstone/overview) ships a tested zakat-ledger CLI with a golden transcript, and [drilling](/en/learn/courses/rust-in-depth/drilling/overview) turns the sixteen concepts into recall, katas, and checklists.

## About the runtime

Every example is a single-file Rust program using the standard library only, with no dependencies: there is no supply chain to audit or break. Each unit compiles with `rustc` and runs its binary in the harness against the recorded output under its own `expected/` folder; test-convention units additionally compile with `rustc --test` with timing normalized away, and the tooling chapter runs `rustfmt --check`, `option_env!` probes, and illustration-fenced linter transcripts where the lesson is about the tool itself. No example needs the network, the clock, or random seeds: fixed inputs keep every run byte-deterministic. Concurrency demos join in order or collect-then-sort with fixed thread counts, and never print thread identifiers; the seeded generator pins its stream; dates are constructed fixed values, so outputs are recorded golden files and the lesson embeds every file byte-identically. Standard output is the asserted golden transcript; standard error is ignored, which matters for the poison-recovery example that logs its panic there by design.

## Examples by Level

### Beginner (Examples 1-25)

- [Example 1: If Let Replaces a Nested Match](/en/learn/courses/rust-in-depth/learning/beginner#example-1-if-let-replaces-a-nested-match)
- [Example 2: Loop Returns Its Value](/en/learn/courses/rust-in-depth/learning/beginner#example-2-loop-returns-its-value)
- [Example 3: While Let Drains a Stack](/en/learn/courses/rust-in-depth/learning/beginner#example-3-while-let-drains-a-stack)
- [Example 4: For with Enumerate and Take](/en/learn/courses/rust-in-depth/learning/beginner#example-4-for-with-enumerate-and-take)
- [Example 5: Match Guards Order the Cases](/en/learn/courses/rust-in-depth/learning/beginner#example-5-match-guards-order-the-cases)
- [Example 6: Vec Capacity Doubling](/en/learn/courses/rust-in-depth/learning/beginner#example-6-vec-capacity-doubling)
- [Example 7: HashMap Entry or Insert](/en/learn/courses/rust-in-depth/learning/beginner#example-7-hashmap-entry-or-insert)
- [Example 8: Iterator Adapters Beat Indexing](/en/learn/courses/rust-in-depth/learning/beginner#example-8-iterator-adapters-beat-indexing)
- [Example 9: Result Instead of Exceptions](/en/learn/courses/rust-in-depth/learning/beginner#example-9-result-instead-of-exceptions)
- [Example 10: Question Mark Propagates](/en/learn/courses/rust-in-depth/learning/beginner#example-10-question-mark-propagates)
- [Example 11: Unwrap Or Defaults](/en/learn/courses/rust-in-depth/learning/beginner#example-11-unwrap-or-defaults)
- [Example 12: Map Err Adds Context](/en/learn/courses/rust-in-depth/learning/beginner#example-12-map-err-adds-context)
- [Example 13: Custom Error Enum](/en/learn/courses/rust-in-depth/learning/beginner#example-13-custom-error-enum)
- [Example 14: Option Combinators](/en/learn/courses/rust-in-depth/learning/beginner#example-14-option-combinators)
- [Example 15: Boxed Errors Across Functions](/en/learn/courses/rust-in-depth/learning/beginner#example-15-boxed-errors-across-functions)
- [Example 16: Assert Documents Invariants](/en/learn/courses/rust-in-depth/learning/beginner#example-16-assert-documents-invariants)
- [Example 17: Collect Short-Circuits on First Err](/en/learn/courses/rust-in-depth/learning/beginner#example-17-collect-short-circuits-on-first-err)
- [Example 18: Build Strings with Push and Join](/en/learn/courses/rust-in-depth/learning/beginner#example-18-build-strings-with-push-and-join)
- [Example 19: Split, Trim, Parse Pipeline](/en/learn/courses/rust-in-depth/learning/beginner#example-19-split-trim-parse-pipeline)
- [Example 20: Format with Width and Precision](/en/learn/courses/rust-in-depth/learning/beginner#example-20-format-with-width-and-precision)
- [Example 21: Read and Write Temp Files](/en/learn/courses/rust-in-depth/learning/beginner#example-21-read-and-write-temp-files)
- [Example 22: Buffered Lines with Results](/en/learn/courses/rust-in-depth/learning/beginner#example-22-buffered-lines-with-results)
- [Example 23: PathBuf Builds Portable Paths](/en/learn/courses/rust-in-depth/learning/beginner#example-23-pathbuf-builds-portable-paths)
- [Example 24: SystemTime and Duration Arithmetic](/en/learn/courses/rust-in-depth/learning/beginner#example-24-systemtime-and-duration-arithmetic)
- [Example 25: Human Duration Formatting](/en/learn/courses/rust-in-depth/learning/beginner#example-25-human-duration-formatting)

### Intermediate (Examples 26-53)

- [Example 26: Inline Modules Organize Code](/en/learn/courses/rust-in-depth/learning/intermediate#example-26-inline-modules-organize-code)
- [Example 27: Use Brings Names Close, Pub Use Re-Exports](/en/learn/courses/rust-in-depth/learning/intermediate#example-27-use-brings-names-close-pub-use-re-exports)
- [Example 28: Crate Tree in One File](/en/learn/courses/rust-in-depth/learning/intermediate#example-28-crate-tree-in-one-file)
- [Example 29: Pub Crate Marks the Team Boundary](/en/learn/courses/rust-in-depth/learning/intermediate#example-29-pub-crate-marks-the-team-boundary)
- [Example 30: Cargo Manifest as Data](/en/learn/courses/rust-in-depth/learning/intermediate#example-30-cargo-manifest-as-data)
- [Example 31: Version Requirements Match](/en/learn/courses/rust-in-depth/learning/intermediate#example-31-version-requirements-match)
- [Example 32: Lockfile Pins Exact Versions](/en/learn/courses/rust-in-depth/learning/intermediate#example-32-lockfile-pins-exact-versions)
- [Example 33: Dependency Graph in BFS Order](/en/learn/courses/rust-in-depth/learning/intermediate#example-33-dependency-graph-in-bfs-order)
- [Example 34: Cfg Selects the Build Shape](/en/learn/courses/rust-in-depth/learning/intermediate#example-34-cfg-selects-the-build-shape)
- [Example 35: First Unit Test Passes](/en/learn/courses/rust-in-depth/learning/intermediate#example-35-first-unit-test-passes)
- [Example 36: Failing First Proves the Test](/en/learn/courses/rust-in-depth/learning/intermediate#example-36-failing-first-proves-the-test)
- [Example 37: Table Tests List Cases](/en/learn/courses/rust-in-depth/learning/intermediate#example-37-table-tests-list-cases)
- [Example 38: Test Helpers Share Fixtures](/en/learn/courses/rust-in-depth/learning/intermediate#example-38-test-helpers-share-fixtures)
- [Example 39: Assertion Messages Name Context](/en/learn/courses/rust-in-depth/learning/intermediate#example-39-assertion-messages-name-context)
- [Example 40: Count Work, Not Wall Time](/en/learn/courses/rust-in-depth/learning/intermediate#example-40-count-work-not-wall-time)
- [Example 41: Seeded Generator Pins Cases](/en/learn/courses/rust-in-depth/learning/intermediate#example-41-seeded-generator-pins-cases)
- [Example 42: Ignore Marks the Slow Tests](/en/learn/courses/rust-in-depth/learning/intermediate#example-42-ignore-marks-the-slow-tests)
- [Example 43: Should Panic Documents the Contract](/en/learn/courses/rust-in-depth/learning/intermediate#example-43-should-panic-documents-the-contract)
- [Example 44: Filter Runs One Test](/en/learn/courses/rust-in-depth/learning/intermediate#example-44-filter-runs-one-test)
- [Example 45: Generic Max over PartialOrd](/en/learn/courses/rust-in-depth/learning/intermediate#example-45-generic-max-over-partialord)
- [Example 46: Trait Defines Shared Behavior](/en/learn/courses/rust-in-depth/learning/intermediate#example-46-trait-defines-shared-behavior)
- [Example 47: Derive Clone, Debug, PartialEq](/en/learn/courses/rust-in-depth/learning/intermediate#example-47-derive-clone-debug-partialeq)
- [Example 48: Copy Versus Clone Counter](/en/learn/courses/rust-in-depth/learning/intermediate#example-48-copy-versus-clone-counter)
- [Example 49: Borrowing Rules That Compile](/en/learn/courses/rust-in-depth/learning/intermediate#example-49-borrowing-rules-that-compile)
- [Example 50: Lifetimes Pick the Longest](/en/learn/courses/rust-in-depth/learning/intermediate#example-50-lifetimes-pick-the-longest)
- [Example 51: Cow Avoids Clone Until Write](/en/learn/courses/rust-in-depth/learning/intermediate#example-51-cow-avoids-clone-until-write)
- [Example 52: Rc and RefCell Share Ownership](/en/learn/courses/rust-in-depth/learning/intermediate#example-52-rc-and-refcell-share-ownership)
- [Example 53: From and Into Conversions](/en/learn/courses/rust-in-depth/learning/intermediate#example-53-from-and-into-conversions)

### Advanced (Examples 54-78)

- [Example 54: Spawn and Join Returns a Value](/en/learn/courses/rust-in-depth/learning/advanced#example-54-spawn-and-join-returns-a-value)
- [Example 55: Channel Collects, Sort Pins Order](/en/learn/courses/rust-in-depth/learning/advanced#example-55-channel-collects-sort-pins-order)
- [Example 56: Scoped Threads Borrow Locals](/en/learn/courses/rust-in-depth/learning/advanced#example-56-scoped-threads-borrow-locals)
- [Example 57: Mutex Guards the Shared Counter](/en/learn/courses/rust-in-depth/learning/advanced#example-57-mutex-guards-the-shared-counter)
- [Example 58: RwLock Serves Many Readers](/en/learn/courses/rust-in-depth/learning/advanced#example-58-rwlock-serves-many-readers)
- [Example 59: Atomics Count Without a Lock](/en/learn/courses/rust-in-depth/learning/advanced#example-59-atomics-count-without-a-lock)
- [Example 60: Recover a Poisoned Lock](/en/learn/courses/rust-in-depth/learning/advanced#example-60-recover-a-poisoned-lock)
- [Example 61: Send and Sync Bound the Spawn](/en/learn/courses/rust-in-depth/learning/advanced#example-61-send-and-sync-bound-the-spawn)
- [Example 62: Rustfmt Owns the Shape](/en/learn/courses/rust-in-depth/learning/advanced#example-62-rustfmt-owns-the-shape)
- [Example 63: Clippy Flags the Range Loop](/en/learn/courses/rust-in-depth/learning/advanced#example-63-clippy-flags-the-range-loop)
- [Example 64: Option Env Proves the Cargo Context](/en/learn/courses/rust-in-depth/learning/advanced#example-64-option-env-proves-the-cargo-context)
- [Example 65: Doc Comments Are the Help Text](/en/learn/courses/rust-in-depth/learning/advanced#example-65-doc-comments-are-the-help-text)
- [Example 66: Names Follow Community Style](/en/learn/courses/rust-in-depth/learning/advanced#example-66-names-follow-community-style)
- [Example 67: Read the Compiler Error](/en/learn/courses/rust-in-depth/learning/advanced#example-67-read-the-compiler-error)
- [Example 68: Eprintln Marks the Loud Boundary](/en/learn/courses/rust-in-depth/learning/advanced#example-68-eprintln-marks-the-loud-boundary)
- [Example 69: Examples Double as Tests](/en/learn/courses/rust-in-depth/learning/advanced#example-69-examples-double-as-tests)
- [Example 70: Project Map: Where Everything Lives](/en/learn/courses/rust-in-depth/learning/advanced#example-70-project-map-where-everything-lives)
- [Example 71: Read a Fold Pipeline in Layers](/en/learn/courses/rust-in-depth/learning/advanced#example-71-read-a-fold-pipeline-in-layers)
- [Example 72: Read a Trait-Object Dispatcher](/en/learn/courses/rust-in-depth/learning/advanced#example-72-read-a-trait-object-dispatcher)
- [Example 73: Read Closure Captures](/en/learn/courses/rust-in-depth/learning/advanced#example-73-read-closure-captures)
- [Example 74: Read the Process Boundary](/en/learn/courses/rust-in-depth/learning/advanced#example-74-read-the-process-boundary)
- [Example 75: Read a Builder Chain](/en/learn/courses/rust-in-depth/learning/advanced#example-75-read-a-builder-chain)
- [Example 76: Read a Recursive Box List](/en/learn/courses/rust-in-depth/learning/advanced#example-76-read-a-recursive-box-list)
- [Example 77: Extern C Calls into C](/en/learn/courses/rust-in-depth/learning/advanced#example-77-extern-c-calls-into-c)
- [Example 78: Read a Module Tree Whole](/en/learn/courses/rust-in-depth/learning/advanced#example-78-read-a-module-tree-whole)
