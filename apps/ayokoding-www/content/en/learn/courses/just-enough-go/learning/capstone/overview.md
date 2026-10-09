---
title: "Capstone: Status Check with a Goroutine"
date: 2026-08-03T00:00:00+07:00
draft: false
weight: 1
---

Build a small status checker that accepts a name and returns `ok:<name>`. Use the supplied
[`code/main.go`](./code/main.go) and [`code/main_test.go`](./code/main_test.go) as a completed model
only after you have tried the task.

## Your task

1. Define a `Checker` interface with `Check(context.Context, string) (string, error)` and a
   `LocalChecker` implementation. A blank name returns `name is required`.
2. Write `run(ctx, checker, name)` so one goroutine performs the check and a typed channel returns
   its value and error. If the context is canceled first, return its error. Buffer the result
   channel so a worker completing just after cancellation can send without blocking.
3. Write a test for the successful name and tests for blank input and an already canceled context.
   Keep the test independent of goroutine scheduling: assert the error category and value, not
   which of two simultaneously ready `select` cases wins.
4. In `main`, call `run` and print either its result or an error. The model prints `ok:ship`.

From `learning/capstone/code/`, run `go test main.go main_test.go` and `go run main.go`. Compare your
implementation with the model, then explain why `run` returns an error instead of calling
`os.Exit`, and why the channel needs a buffer of one. This is a one-worker hand-off exercise;
worker pools and pipeline cancellation belong to the later concurrency course.
