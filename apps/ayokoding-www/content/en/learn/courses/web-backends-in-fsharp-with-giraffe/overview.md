---
title: "Overview"
date: 2026-10-24T00:00:00+07:00
draft: false
weight: 1
---

## Why this exists -- the big idea

HTTP backends are request functions with discipline: routes name addresses, handlers answer with shaped data, middleware wraps cross-cutting behavior, services carry state, and tests drive the whole pipeline without a network. F# expresses that discipline as values — route tables are lists, middleware is function composition, errors are data — and Giraffe is the library that turns those values into a working ASP.NET Core service. This course teaches the full stack through 78 runnable examples, each one a complete service you can run, read, and break.

## What you will be able to do

You will build JSON HTTP backends in F# with Giraffe: routing with typed captures, request parsing from paths through bodies, response shaping with statuses and headers, middleware for logging and guarding, dependency injection for state, in-process test suites, async handlers under load, graceful shutdown, and honest design comparisons against FastAPI. Every skill ships with a transcript proving it works.

## How this course is organized

Three levels carry 78 examples: Beginner (Examples 1–25) builds routes, request parsing, and responses; Intermediate (Examples 26–53) adds middleware, services, and testing; Advanced (Examples 54–78) covers concurrency, shutdown, and the FastAPI comparison. Drilling follows with recall questions, applied problems, eight katas, and a self-check; the capstone composes everything into an order-tracking service with validation, an error envelope, health checks, and its own in-process suite.

## Prerequisites

This course assumes [just-enough-fsharp](/en/learn/courses/just-enough-fsharp) and [backend-essentials](/en/learn/courses/backend-essentials). The first supplies the F# you will read — records, options, task expressions, and the pipe operators the handlers compose with. The second supplies the backend mental model — routes, statuses, JSON contracts, and why in-process checks beat deployed ones. No ASP.NET Core experience is assumed; every host concept is built from a commented line upward.

## About the examples

Every example is a complete F# program under `learning/code/`, runnable in-process through `Microsoft.AspNetCore.TestHost` — no sockets, no ports, no network. Code blocks are copied byte-for-byte from those files, outputs from their golden transcripts, and each example names the concepts it exercises. Review examples close each cluster by composing its skills into one service.

## References

- [Giraffe documentation](https://github.com/giraffe-fsharp/Giraffe) — routing, handlers, and middleware reference for the library this course teaches. Accessed 2026-10-24.
- [ASP.NET Core integration tests with TestServer](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests) — the in-process hosting pattern every example's checks rely on. Accessed 2026-10-24.
- [FastAPI testing and TestClient](https://fastapi.tiangolo.com/tutorial/testing/) — the honest comparison point for the advanced level's testing claims. Accessed 2026-10-24.
- [F# asynchronous programming with task expressions](https://learn.microsoft.com/en-us/dotnet/fsharp/language-reference/task-expressions/) — the `task` workflows the concurrency level builds on. Accessed 2026-10-24.
- [just-enough-fsharp](/en/learn/courses/just-enough-fsharp) — the F# foundation this course assumes. Accessed 2026-10-24.
- [backend-essentials](/en/learn/courses/backend-essentials) — the backend mental model this course assumes, and the FastAPI comparison baseline. Accessed 2026-10-24.
