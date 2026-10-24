---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

Prerequisites for this course: [just-enough-go](/en/learn/courses/just-enough-go/learning/overview) for Go's basic syntax, which every example here assumes you can already read; and [csp-style-concurrency](/en/learn/courses/csp-style-concurrency/learning/overview) for the specialized concurrency angle this course deliberately surveys instead of repeating. Assumed knowledge: comfort with Go's basic syntax from just-enough-go.

## Why this exists -- the big idea

**The problem before the solution**: just-enough-go gets you reading and writing Go, but nobody teaches the idioms, standard library, error handling, and tooling at the depth working developers use daily. Learners translate their first language into Go instead of writing Go. **Keep this if you forget everything else**: write Go the way its own standard library and idiomatic style guide do, not the way your first language would.

## Tensions and trade-offs -- when NOT to reach for this

- **Idiom versus intuition**: idiomatic Go often looks plainer than the clever version, and choosing plain costs a small thrill while buying readability for every future reader.
- **Standard library versus dependency**: the standard library covers text, time, sorting, JSON, and HTTP, so reaching outward spends supply-chain budget; spend it only when the stdlib shape genuinely cannot express the need.
- **When NOT**: specialized concurrent system design lives in csp-style-concurrency, and web frameworks live in their own courses; this course stays on general-purpose fluency and surveys those angles only so you can recognize them.

## Lineage -- where this sits

Go grew out of systems work at Google: fast builds, a small specification, and tooling with opinions. just-enough-go teaches the syntax walking in; this course teaches the idioms professionals write with, and csp-style-concurrency takes the concurrency half of those idioms to full depth. The standard library is the textbook throughout.

## How this course is organized

[Beginner](/en/learn/courses/golang-in-depth/learning/beginner) (Examples 1-25) covers control flow, collections, error handling, and standard-library text, file, and time work. [Intermediate](/en/learn/courses/golang-in-depth/learning/intermediate) (Examples 26-53) covers modules and packages, the testing convention, and generics with value semantics. [Advanced](/en/learn/courses/golang-in-depth/learning/advanced) (Examples 54-78) surveys concurrency deterministically, then tooling, style, and interop, and finishes by reading idiomatic code. The [capstone](/en/learn/courses/golang-in-depth/learning/capstone/overview) ships a small dues-ledger CLI with tests and a golden transcript, and [drilling](/en/learn/courses/golang-in-depth/drilling/overview) turns the sixteen concepts into recall, katas, and checklists.

## About the runtime

Every example is a Go module using the standard library only, with no require lines: there is no supply chain to audit or break. Each unit builds with `go build` and runs its binary in the harness against the recorded output under its own `expected/` folder; test-convention units additionally run `go test` with timing normalized away, and the toolchain chapter runs `go vet`, `go list`, and `go doc` where the lesson is about the tool itself. No example needs the network, the clock, or random seeds: fixed inputs keep every run deterministic. Module examples carry their own `go.mod` so multi-file packages build as one unit.

## Examples by Level

### Beginner (Examples 1-25)

- [Example 1: Hello with an Early Return](/en/learn/courses/golang-in-depth/learning/beginner#example-1-hello-with-an-early-return)
- [Example 2: For Is the Only Loop](/en/learn/courses/golang-in-depth/learning/beginner#example-2-for-is-the-only-loop)
- [Example 3: Switch Without a Tag](/en/learn/courses/golang-in-depth/learning/beginner#example-3-switch-without-a-tag)
- [Example 4: Slices Grow on Append](/en/learn/courses/golang-in-depth/learning/beginner#example-4-slices-grow-on-append)
- [Example 5: Maps Return Two Values](/en/learn/courses/golang-in-depth/learning/beginner#example-5-maps-return-two-values)
- [Example 6: Range Gives Index and Copy](/en/learn/courses/golang-in-depth/learning/beginner#example-6-range-gives-index-and-copy)
- [Example 7: Sort with sort.Slice](/en/learn/courses/golang-in-depth/learning/beginner#example-7-sort-with-sortslice)
- [Example 8: Defer Runs Last In, First Out](/en/learn/courses/golang-in-depth/learning/beginner#example-8-defer-runs-last-in-first-out)
- [Example 9: Return the Error, Not the Exception](/en/learn/courses/golang-in-depth/learning/beginner#example-9-return-the-error-not-the-exception)
- [Example 10: Sentinel Errors with errors.New](/en/learn/courses/golang-in-depth/learning/beginner#example-10-sentinel-errors-with-errorsnew)
- [Example 11: Wrap with Percent-W for Context](/en/learn/courses/golang-in-depth/learning/beginner#example-11-wrap-with-percent-w-for-context)
- [Example 12: Match Wrapped Errors with errors.Is](/en/learn/courses/golang-in-depth/learning/beginner#example-12-match-wrapped-errors-with-errorsis)
- [Example 13: Extract Details with errors.As](/en/learn/courses/golang-in-depth/learning/beginner#example-13-extract-details-with-errorsas)
- [Example 14: Custom Error Types Carry Fields](/en/learn/courses/golang-in-depth/learning/beginner#example-14-custom-error-types-carry-fields)
- [Example 15: Join Independent Failures](/en/learn/courses/golang-in-depth/learning/beginner#example-15-join-independent-failures)
- [Example 16: Panic Stays at the Boundary](/en/learn/courses/golang-in-depth/learning/beginner#example-16-panic-stays-at-the-boundary)
- [Example 17: Handle Errors Inside Defer](/en/learn/courses/golang-in-depth/learning/beginner#example-17-handle-errors-inside-defer)
- [Example 18: Build Strings with strings.Builder](/en/learn/courses/golang-in-depth/learning/beginner#example-18-build-strings-with-stringsbuilder)
- [Example 19: Parse Numbers with strconv](/en/learn/courses/golang-in-depth/learning/beginner#example-19-parse-numbers-with-strconv)
- [Example 20: Format Output with fmt Verbs](/en/learn/courses/golang-in-depth/learning/beginner#example-20-format-output-with-fmt-verbs)
- [Example 21: Match Text with regexp](/en/learn/courses/golang-in-depth/learning/beginner#example-21-match-text-with-regexp)
- [Example 22: Encode Structs to JSON](/en/learn/courses/golang-in-depth/learning/beginner#example-22-encode-structs-to-json)
- [Example 23: Read and Write Files with os](/en/learn/courses/golang-in-depth/learning/beginner#example-23-read-and-write-files-with-os)
- [Example 24: Parse and Format Time](/en/learn/courses/golang-in-depth/learning/beginner#example-24-parse-and-format-time)
- [Example 25: Add and Compare Durations](/en/learn/courses/golang-in-depth/learning/beginner#example-25-add-and-compare-durations)

### Intermediate (Examples 26-53)

- [Example 26: Name Your Module Path](/en/learn/courses/golang-in-depth/learning/intermediate#example-26-name-your-module-path)
- [Example 27: One Package, Many Files](/en/learn/courses/golang-in-depth/learning/intermediate#example-27-one-package-many-files)
- [Example 28: Exported Names Start Uppercase](/en/learn/courses/golang-in-depth/learning/intermediate#example-28-exported-names-start-uppercase)
- [Example 29: Internal Packages Stay Private](/en/learn/courses/golang-in-depth/learning/intermediate#example-29-internal-packages-stay-private)
- [Example 30: Pin the Toolchain in go.mod](/en/learn/courses/golang-in-depth/learning/intermediate#example-30-pin-the-toolchain-in-gomod)
- [Example 31: Require Nothing: Stdlib Only](/en/learn/courses/golang-in-depth/learning/intermediate#example-31-require-nothing-stdlib-only)
- [Example 32: Replace with a Local Path](/en/learn/courses/golang-in-depth/learning/intermediate#example-32-replace-with-a-local-path)
- [Example 33: Document with go doc](/en/learn/courses/golang-in-depth/learning/intermediate#example-33-document-with-go-doc)
- [Example 34: Init Runs Before Main](/en/learn/courses/golang-in-depth/learning/intermediate#example-34-init-runs-before-main)
- [Example 35: Table Tests List Cases as Data](/en/learn/courses/golang-in-depth/learning/intermediate#example-35-table-tests-list-cases-as-data)
- [Example 36: Failing First Proves the Test](/en/learn/courses/golang-in-depth/learning/intermediate#example-36-failing-first-proves-the-test)
- [Example 37: Subtests Name Each Case](/en/learn/courses/golang-in-depth/learning/intermediate#example-37-subtests-name-each-case)
- [Example 38: Helpers Mark Themselves with t.Helper](/en/learn/courses/golang-in-depth/learning/intermediate#example-38-helpers-mark-themselves-with-thelper)
- [Example 39: Doc Examples Are Tests Too](/en/learn/courses/golang-in-depth/learning/intermediate#example-39-doc-examples-are-tests-too)
- [Example 40: Benchmarks Measure, Tests Assert](/en/learn/courses/golang-in-depth/learning/intermediate#example-40-benchmarks-measure-tests-assert)
- [Example 41: Fuzz Seeds Become Regression Tests](/en/learn/courses/golang-in-depth/learning/intermediate#example-41-fuzz-seeds-become-regression-tests)
- [Example 42: Skip Slow Paths with testing.Short](/en/learn/courses/golang-in-depth/learning/intermediate#example-42-skip-slow-paths-with-testingshort)
- [Example 43: Clean Up with t.Cleanup](/en/learn/courses/golang-in-depth/learning/intermediate#example-43-clean-up-with-tcleanup)
- [Example 44: Vet Before You Test](/en/learn/courses/golang-in-depth/learning/intermediate#example-44-vet-before-you-test)
- [Example 45: Type Parameters Remove Duplicates](/en/learn/courses/golang-in-depth/learning/intermediate#example-45-type-parameters-remove-duplicates)
- [Example 46: Constraints Name What Operations Need](/en/learn/courses/golang-in-depth/learning/intermediate#example-46-constraints-name-what-operations-need)
- [Example 47: Generic Containers Hold Anything](/en/learn/courses/golang-in-depth/learning/intermediate#example-47-generic-containers-hold-anything)
- [Example 48: Type Inference Keeps Calls Clean](/en/learn/courses/golang-in-depth/learning/intermediate#example-48-type-inference-keeps-calls-clean)
- [Example 49: Values Copy, Pointers Share](/en/learn/courses/golang-in-depth/learning/intermediate#example-49-values-copy-pointers-share)
- [Example 50: Copy Slices Before You Keep Them](/en/learn/courses/golang-in-depth/learning/intermediate#example-50-copy-slices-before-you-keep-them)
- [Example 51: Compare Honestly with cmp](/en/learn/courses/golang-in-depth/learning/intermediate#example-51-compare-honestly-with-cmp)
- [Example 52: Yield Sequences with iter](/en/learn/courses/golang-in-depth/learning/intermediate#example-52-yield-sequences-with-iter)
- [Example 53: Maps Are References Too](/en/learn/courses/golang-in-depth/learning/intermediate#example-53-maps-are-references-too)

### Advanced (Examples 54-78)

- [Example 54: Goroutines Run Beside You](/en/learn/courses/golang-in-depth/learning/advanced#example-54-goroutines-run-beside-you)
- [Example 55: Channels Carry Values Between Goroutines](/en/learn/courses/golang-in-depth/learning/advanced#example-55-channels-carry-values-between-goroutines)
- [Example 56: Select Waits on Many Channels](/en/learn/courses/golang-in-depth/learning/advanced#example-56-select-waits-on-many-channels)
- [Example 57: WaitGroup Waits for the Whole Crew](/en/learn/courses/golang-in-depth/learning/advanced#example-57-waitgroup-waits-for-the-whole-crew)
- [Example 58: Mutex Guards Shared State](/en/learn/courses/golang-in-depth/learning/advanced#example-58-mutex-guards-shared-state)
- [Example 59: Context Cancels Work](/en/learn/courses/golang-in-depth/learning/advanced#example-59-context-cancels-work)
- [Example 60: Worker Pool Bounds Concurrency](/en/learn/courses/golang-in-depth/learning/advanced#example-60-worker-pool-bounds-concurrency)
- [Example 61: Once Runs Setup Exactly Once](/en/learn/courses/golang-in-depth/learning/advanced#example-61-once-runs-setup-exactly-once)
- [Example 62: gofmt Decides the Layout](/en/learn/courses/golang-in-depth/learning/advanced#example-62-gofmt-decides-the-layout)
- [Example 63: Vet Your Verbs Before You Ship](/en/learn/courses/golang-in-depth/learning/advanced#example-63-vet-your-verbs-before-you-ship)
- [Example 64: Name Packages Short and Lowercase](/en/learn/courses/golang-in-depth/learning/advanced#example-64-name-packages-short-and-lowercase)
- [Example 65: Handle Every Error or Say Why Not](/en/learn/courses/golang-in-depth/learning/advanced#example-65-handle-every-error-or-say-why-not)
- [Example 66: Comment the Why, Not the What](/en/learn/courses/golang-in-depth/learning/advanced#example-66-comment-the-why-not-the-what)
- [Example 67: Split Functions Until Each Does One Thing](/en/learn/courses/golang-in-depth/learning/advanced#example-67-split-functions-until-each-does-one-thing)
- [Example 68: Flat Beats Nested](/en/learn/courses/golang-in-depth/learning/advanced#example-68-flat-beats-nested)
- [Example 69: Cross the Boundary with encoding/binary](/en/learn/courses/golang-in-depth/learning/advanced#example-69-cross-the-boundary-with-encodingbinary)
- [Example 70: Meet the Process at getenv](/en/learn/courses/golang-in-depth/learning/advanced#example-70-meet-the-process-at-getenv)
- [Example 71: Read a Handler by Its Signature](/en/learn/courses/golang-in-depth/learning/advanced#example-71-read-a-handler-by-its-signature)
- [Example 72: Read a Pipeline by Its Stages](/en/learn/courses/golang-in-depth/learning/advanced#example-72-read-a-pipeline-by-its-stages)
- [Example 73: Read an Interface by Its Callers](/en/learn/courses/golang-in-depth/learning/advanced#example-73-read-an-interface-by-its-callers)
- [Example 74: Read a Test by Its Table](/en/learn/courses/golang-in-depth/learning/advanced#example-74-read-a-test-by-its-table)
- [Example 75: Read a CLI by Its Flags](/en/learn/courses/golang-in-depth/learning/advanced#example-75-read-a-cli-by-its-flags)
- [Example 76: Read JSON Tags Like a Contract](/en/learn/courses/golang-in-depth/learning/advanced#example-76-read-json-tags-like-a-contract)
- [Example 77: Read Defer Chains Inside Out](/en/learn/courses/golang-in-depth/learning/advanced#example-77-read-defer-chains-inside-out)
- [Example 78: Read a Whole Program Top Down](/en/learn/courses/golang-in-depth/learning/advanced#example-78-read-a-whole-program-top-down)
