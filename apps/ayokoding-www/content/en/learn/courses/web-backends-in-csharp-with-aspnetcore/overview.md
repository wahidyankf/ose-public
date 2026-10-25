---
title: "Overview"
date: 2026-10-24T00:00:00+07:00
draft: false
weight: 1
---

Every Python shop eventually meets a team that serves HTTP from C#: same verbs, same status codes, same JSON over the wire, but a different framework with its own opinions about routing, middleware, and concurrency. Across seventy-eight small, independently runnable programs you will learn the framework those teams reach for — ASP.NET Core minimal APIs in C# — the way `backend-essentials` teaches HTTP in Python: mapping methods and paths to small handler functions, parsing and validating request bodies into typed records, shaping consistent JSON responses and error envelopes, layering middleware, injecting dependencies, testing everything in-process without a socket, and shutting down gracefully under load.

## Why this exists -- the big idea

**The problem before the solution**: `backend-essentials` and `backend-at-scale` teach backend thinking in Python and FastAPI; a C# developer reading them learns the HTTP vocabulary but not a single ASP.NET Core idiom — where the route table lives, how middleware ordering works, what a scoped service means, or how to test a handler without starting a server. Teams in that gap cargo-cult FastAPI shapes into C# and fight the framework on every request.

**Keep this if you forget everything else**: A route handler is a pure function from request to response until you deliberately reach for shared state.

## What you will be able to do

After this course you can define routes, handlers, and middleware in ASP.NET Core for a small HTTP service; parse and validate a request body and return a typed, well-formed response; use ASP.NET Core's own concurrency model correctly under concurrent requests; write automated tests against the running service without a real network call; and compare ASP.NET Core's design choices in routing, middleware, and error handling against the FastAPI backend course's choices.

## How this course is organized

[Learning](/en/learn/courses/web-backends-in-csharp-with-aspnetcore/learning/overview) holds seventy-eight worked examples in three levels: Beginner (Examples 1–25) maps routes to handlers, parses requests, and shapes responses; Intermediate (Examples 26–53) layers middleware, injects dependencies, and tests everything in-process; Advanced (Examples 54–78) loads the service concurrently, shuts it down gracefully, and compares each design choice against FastAPI. The [capstone](/en/learn/courses/web-backends-in-csharp-with-aspnetcore/learning/capstone/overview) builds an order-tracking HTTP service with five routes, request validation, structured error responses, a health-check endpoint, and an in-process test suite, and [drilling](/en/learn/courses/web-backends-in-csharp-with-aspnetcore/drilling/overview) turns the sixteen concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: [just-enough-csharp](/en/learn/courses/just-enough-csharp/learning/overview) for C# syntax, projects, and tooling, and [backend-essentials](/en/learn/courses/backend-essentials/learning/overview) for HTTP methods, status codes, headers, and JSON request/response vocabulary. Assumed knowledge: basic HTTP concepts from backend-essentials. Every example is C# driving ASP.NET Core minimal APIs, so the primer earns its place from the first page and the HTTP course earns its place wherever a method, status, or header meaning matters.

## About the examples

Every example is a real C# program executed by the course harness in the pinned .NET container — never a mock. Most examples serve requests in-process through `TestServer`: the full routing, middleware, and handler pipeline runs inside the test process with no socket and no port. The examples that teach listening and shutdown bind `127.0.0.1` on an OS-chosen ephemeral port and never print the port number. The harness network is closed; every unit restores its one locked package (`Microsoft.AspNetCore.TestHost`) from the course-local feed, so each build resolves byte-identical dependencies recorded in its own `packages.lock.json`. Programs print labels, statuses, and body bytes — never timings, ports, paths, or revision noise — so reruns match byte for byte. Standard output is the asserted golden transcript; standard error is ignored.

## References

- ASP.NET Core documentation (minimal APIs, middleware, dependency injection, testing). Accessed 2026-10-24. [ASP.NET Core docs](https://learn.microsoft.com/en-us/aspnet/core/)
- Testing ASP.NET Core minimal APIs with TestServer and TestHost. Accessed 2026-10-24. [Test in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/test/)
- FastAPI documentation (routing, dependencies, testing) for the comparison cluster. Accessed 2026-10-24. [FastAPI docs](https://fastapi.tiangolo.com/)
- The pinned .NET version in `apps/ayokoding-cli` is the source of truth for any version-specific behavior.
