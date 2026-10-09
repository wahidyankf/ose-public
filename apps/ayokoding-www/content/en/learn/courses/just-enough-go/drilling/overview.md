---
title: "Overview"
date: 2026-08-03T00:00:00+07:00
draft: false
weight: 1
---

Use these drills after the [learning examples](../learning/overview.md). Predict each answer before
opening it, then change and run the linked example to check it. Revisit missed questions later.

## Recall Q&A

**Q1 (co-01, co-03).** Which file does `go mod init example/hello` create? What artifact does
`go build -o hello main.go` leave that `go run main.go` does not?

<details>
<summary>Answer</summary>

`go mod init` creates `go.mod`. `go build -o hello main.go` leaves a named executable; `go run`
compiles and runs without leaving that binary in the directory. Compare
[Examples 2–4](../learning/beginner.md).

</details>

**Q2 (co-02).** Why does a runnable command need `package main` and `func main()`? Does importing
`fmt` call `fmt.Println`?

<details>
<summary>Answer</summary>

They provide the command's entry point. Importing `fmt` makes its exported names available; a
call performs the printing. See [Examples 1 and 5](../learning/beginner.md).

</details>

**Q3 (co-04, co-05).** What are the zero values of `int`, `bool`, and `*int`? What values do three
consecutive `iota` constants get in one group?

<details>
<summary>Answer</summary>

They are `0`, `false`, and `nil`; the `iota` constants start at `0`, then `1` and `2`. See
[Examples 8 and 10](../learning/beginner.md).

</details>

**Q4 (co-06).** Why does `float64(n) * f` compile for an `int` named `n` and `float64` named `f`,
while `n * f` does not?

<details>
<summary>Answer</summary>

The explicit conversion gives the operands compatible types. It does not validate whether the
number suits the calculation or preserve every large integer exactly. See
[Examples 11–13](../learning/beginner.md).

</details>

**Q5 (co-07).** For a function returning `(int, error)`, what should a caller do before using the
integer? What type does a variadic `...int` parameter act like inside its function?

<details>
<summary>Answer</summary>

Check and handle the error first. The variadic parameter acts as a `[]int`; pass an existing slice
with `values...`. See [Examples 16 and 18](../learning/beginner.md).

</details>

**Q6 (co-08).** In `if name, err := lookup(true); err != nil { ... } else { ... }`, where are
`name` and `err` in scope? Does a matching `switch` case fall through automatically?

<details>
<summary>Answer</summary>

The names exist in the condition and both branches, then leave scope after the `if`. A matching
switch case stops unless `fallthrough` is explicit. See [Examples 19 and 23](../learning/beginner.md).

</details>

**Q7 (co-09).** If three deferred calls are registered in order A, B, C, which runs first when
the function returns?

<details>
<summary>Answer</summary>

C runs first, then B, then A. Deferred calls run in last-in, first-out order. See
[Example 26](../learning/beginner.md).

</details>

**Q8 (co-10).** Why keep the result of `append`? If `view := values[:2]`, what can `view[0] = 9`
change?

<details>
<summary>Answer</summary>

`append` returns the resulting slice, possibly with a new backing array. A subslice initially
shares its backing array, so changing `view[0]` also changes `values[0]` here. See
[Examples 28 and 31](../learning/intermediate.md).

</details>

**Q9 (co-11).** A map stores `"ok": 0`. How can you tell that key from an absent key whose lookup
also gives zero? Is map iteration order guaranteed?

<details>
<summary>Answer</summary>

Use `value, present := counts[key]`; `present` distinguishes them. Map iteration order is not
guaranteed. See [Examples 33–34](../learning/intermediate.md).

</details>

**Q10 (co-12, co-13).** What do `&value` and `*pointer` mean? Why can `release.Owner` select a
field of embedded `Metadata`?

<details>
<summary>Answer</summary>

`&value` takes its address; `*pointer` reads the addressed value when the pointer is valid.
Embedding promotes `Metadata.Owner` for selection through `Release`. See
[Examples 35–40](../learning/intermediate.md).

</details>

**Q11 (co-14, co-15).** Which receiver can change the caller's value: `Counter` or `*Counter`?
What declaration makes a type implement an interface?

<details>
<summary>Answer</summary>

The pointer receiver can update the addressed value. There is no `implements` declaration: the
type's method set must contain the interface's required methods. See
[Examples 41–44](../learning/intermediate.md).

</details>

**Q12 (co-16, co-17).** What does `%w` preserve when wrapping an error? Which functions test a
known error identity and extract a wrapped concrete error type?

<details>
<summary>Answer</summary>

`%w` keeps the cause in the error chain. Use `errors.Is` for identity and `errors.As` to find a
matching type. See [Examples 49–53](../learning/intermediate.md).

</details>

**Q13 (co-18).** What do `json:"name"`, `json:"-"`, and `json:"name,omitempty"` do to exported
fields?

<details>
<summary>Answer</summary>

They name a JSON key, omit a field, and omit that field when empty, respectively. Check errors
from JSON encoding and decoding. See [Examples 54–56](../learning/intermediate.md).

</details>

**Q14 (co-19).** In `Map[T, U any]`, can `T` and `U` differ? Why does a function using `==` need
a `comparable` constraint?

<details>
<summary>Answer</summary>

Yes: the example maps integers to strings. `comparable` rejects types such as slices that cannot
be compared with `==`. See [Examples 57–59](../learning/advanced.md).

</details>

**Q15 (co-20, co-21).** Does starting a goroutine make `main` wait for it? What allows an
unbuffered channel send to complete?

<details>
<summary>Answer</summary>

No; `main` can exit before a worker finishes. An unbuffered send needs a matching receive. See
[Examples 60 and 62](../learning/advanced.md).

</details>

**Q16 (co-22).** If two `select` receive cases are ready, which wins? What does `default` do when
neither case is ready?

<details>
<summary>Answer</summary>

Go chooses one ready case without priority. `default` runs immediately when no communication
case can proceed. See [Examples 67–68](../learning/advanced.md).

</details>

**Q17 (co-23).** A `WaitGroup` waits for two workers. Does it also protect their shared `count++`
from a data race?

<details>
<summary>Answer</summary>

No. The group coordinates completion; the example uses a mutex to protect the shared
read-modify-write operation. See [Examples 70–71](../learning/advanced.md).

</details>

**Q18 (co-24, co-25, co-26).** Which command runs tests? What does `gofmt -d` show? How can a
caller distinguish context cancellation from a deadline?

<details>
<summary>Answer</summary>

Use `go test`. `gofmt -d` shows the proposed formatting diff without writing the source. Receive
from `ctx.Done()`, then compare `ctx.Err()` with `context.Canceled` or
`context.DeadlineExceeded`. See [Examples 72–78](../learning/advanced.md).

</details>

## Applied problems

**AP1.** A slice starts with length 0 and capacity 2. You append three values. What length is
guaranteed afterward? May you promise the exact capacity?

<details>
<summary>Answer</summary>

Length is 3. Capacity is at least 3, but its exact growth is an implementation detail. Compare
[Example 29](../learning/intermediate.md).

</details>

**AP2.** A function returns `"", err` on failure. The caller prints the string before checking
`err`. What should move?

<details>
<summary>Answer</summary>

Check and handle the error first. Use the string only on success. Compare
[Example 16](../learning/beginner.md) and [Example 49](../learning/intermediate.md).

</details>

**AP3.** A program writes to a nil map. Can it continue after a nil check without allocating?

<details>
<summary>Answer</summary>

No. Allocate with `make(map[string]int)` before assignment. A nil map can be read but not written. See
[Example 32](../learning/intermediate.md).

</details>

**AP4.** A worker sends on an unbuffered channel. `main` also sends on that channel before it
tries to receive. Why does `main` stop before the receive?

<details>
<summary>Answer</summary>

Its first send waits for a receiver, so execution never reaches the later receive. Arrange a
concurrent receiver or use a deliberately sized buffer. See [Example 62](../learning/advanced.md).

</details>

**AP5.** A test expects the left branch to win every time when both `select` cases are ready. Is
the test valid?

<details>
<summary>Answer</summary>

No. Either case may be selected. Accept both outcomes or redesign to enforce ordering. See
[Example 67](../learning/advanced.md).

</details>

**AP6.** A canceled context's `Done` channel is ready. Does that alone stop a worker blocked on an
unrelated channel send?

<details>
<summary>Answer</summary>

No. The worker must participate in cancellation, such as by selecting between its send and
`ctx.Done()`. The context examples introduce the signal; pipeline policy belongs to the next
course. See [Examples 77–78](../learning/advanced.md).

</details>

## Code katas

Use a scratch copy of each linked example, predict the changed result, then run its command.

1. In [Example 16](../learning/beginner.md), call `divide(8, 0)` and verify that the caller
   reports the error without printing the placeholder quotient.
2. In [Example 31](../learning/intermediate.md), change `view[0] = 9` to `view[1] = 9`. Predict
   both printed slices before running.
3. In [Example 53](../learning/intermediate.md), replace one `%w` with `%v`. Predict which
   `errors.Is` or `errors.As` check changes.
4. In [Example 68](../learning/advanced.md), change the channel to capacity 1 and send before
   `select`. Verify that the receive case runs instead of `default`.
5. In [Example 71](../learning/advanced.md), increase the worker count, run
   `go run -race main.go`, then remove the lock in the scratch copy and inspect the detector's
   report. Explain why waiting for workers does not protect `count++`.

## Self-check checklist

- [ ] I can create a module, run, build, format, and test a Go package.
- [ ] I can predict slice and map behavior, and choose value versus pointer receivers.
- [ ] I can wrap and inspect errors without string matching.
- [ ] I can use slices, maps, JSON tags, and generic constraints deliberately.
- [ ] I can distinguish a worker's completion signal from protection of shared state.
- [ ] I know when to continue into CSP-style concurrency for pipelines and cancellation policy.

## Elaborative interrogation and self-explanation

**Why does Go insist on explicit error values?**

<details>
<summary>Answer</summary>

The failure path appears in the function signature and at the call site. A caller can handle it,
add context, or return it; the compiler does not automatically handle an ignored error, so inspect
both return values before proceeding. See [Example 16](../learning/beginner.md).

</details>

**Why is a goroutine preview not enough to design a concurrent system?**

<details>
<summary>Answer</summary>

Starting work does not say who waits, how a blocked send stops, or how errors reach the caller.
The preview shows individual mechanisms. A production pipeline also needs ownership, cancellation,
backpressure, and memory-safety reasoning.

</details>
