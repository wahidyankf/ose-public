---
title: "Overview"
date: 2026-07-29T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [4 · Just Enough Python](../just-enough-python/learning/overview.md) (functions, modules,
  typed collections), [11 · Backend Essentials](../backend-essentials/learning/overview.md) (HTTP, routing,
  persistence, a first FastAPI route), and **SQL Essentials** for the async data layer -- this topic assumes
  you can already write a parameterized SQL query from Python and serve a one-route FastAPI app under `uvicorn`.
- **Tools & environment**: a macOS/Linux terminal; **Python 3.13**; **`uv`** for environments and installs;
  **`ruff`** for lint/format; **`pyright`** for type checking; **FastAPI**, **Pydantic v2**, **`pydantic-settings`**,
  an ASGI server (`uvicorn`), **`aiosqlite`** for async database access, and **`httpx`** + **`pytest`** for testing.
- **Assumed knowledge**: writing `async def` is taught here from zero, but you should already be comfortable
  with Python functions/classes, HTTP request/response basics, and running a local server and hitting it with
  `curl` (from Backend Essentials).

## Why this exists -- the big idea

The problem before the solution: a synchronous service blocks a whole worker on every slow I/O call (a
database query, an upstream HTTP call, a remote-browser command), capping throughput; and untyped,
unvalidated request handling turns every endpoint into a runtime-error surface. The one idea worth keeping if
you forget everything else: **`async` lets one process interleave thousands of I/O-bound waits without
threads, and FastAPI + Pydantic turn your type hints into the request/response contract, the validation, and
the docs -- so the types you write are the API you ship.**

**Cross-cutting big ideas**: `determinism-vs-emergence` -- concurrency without shared mutable state stays
reasoned about; the event loop is cooperative, not preemptive, so correctness depends on every coroutine
yielding promptly. `abstraction-and-its-cost` -- `async` buys I/O throughput but **colours your whole call
graph**: once a function is `async`, every caller is `async` too, which is a real cost, not a free speed-up.

## Scope note -- this topic is deliberately framework-concrete

This course teaches the **modern async-Python service stack as you actually ship it**: `async`/`await` and the
event loop in service code, **FastAPI** routing + dependency injection, **Pydantic v2** models/validation, and
the current tooling (`uv`, `ruff`, `pyright`). Two neighboring courses own the depth this one deliberately
_defers_:

- **Async concepts are deferred to [`concurrency-and-parallelism`](../concurrency-and-parallelism/learning/overview.md).**
  That course owns the _theory_ of concurrency and parallelism -- threads vs. processes vs. the event loop,
  the GIL, locks, deadlocks, the free-threaded build, and a deep treatment of cooperative multitasking's
  hazards. This course uses `async`/`await` and `gather` _practically_ to build a service and links out to
  `concurrency-and-parallelism` whenever the underlying concept deserves a full treatment; it does not
  re-teach that theory.
- **Framework internals are deferred to `build-your-own-web-framework`.** That course owns _how_ a framework
  like FastAPI is built -- the ASGI callable, hand-written routing, a from-scratch request/response pipeline,
  and a Pydantic-like validation engine. This course _uses_ FastAPI/Pydantic as a productive author and links
  out to `build-your-own-web-framework` whenever a mechanism would benefit from being built by hand; it does
  not re-derive the framework.

In short: this is the **usable, production-shaped slice** -- enough `async`, FastAPI, and Pydantic to build and
ship a real I/O-bound service, with the conceptual theory and the from-scratch framework both one click away.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 78 runnable, heavily annotated Python examples across Beginner
  (Examples 1-18: `async`/`await`, the event loop, `gather`/`create_task`, `async with`/`async for`, the
  blocking-call hazard, and the `uv`/`ruff`/`pyright` tooling, then FastAPI basics -- routing, typed path/query
  params, Pydantic body models, validation 422s, `response_model`, and OpenAPI docs), Intermediate (Examples
  19-38: `Depends` dependency injection, async database access with `aiosqlite`, CRUD, `HTTPException`, custom
  exception handlers, lifespan-managed pools, middleware, background tasks, concurrent upstream fan-out, Pydantic
  validators, nested models, `pydantic-settings`, structured logging, async testing with `httpx`, dependency
  overrides, streaming/SSE, and concurrency-safe shared state), and Advanced (Examples 39-78: a full typed async
  CRUD service, pagination/filtering, auth, rate limiting, async HTTP clients, timeout/retry, background workers,
  WebSockets, CPU offloading, OpenAPI-driven clients, integration tests, the `ruff`/`pyright` gate, graceful
  shutdown, observability, a `remotebrowser`-shaped fan-out, the capstone, plus Pydantic v2 deep features,
  `APIRouter` modularity, middleware ordering, CORS/GZip, OAuth2, forms/uploads, backpressure, broadcast rooms,
  circuit breaking, idempotency, ETags, and `uv`/Docker deployment) -- plus a capstone production-shaped async
  FastAPI service.

Every example is a complete, self-contained Python module colocated under `learning/code/`, run under `uv`,
served with `uvicorn`, and exercised with `httpx`/`curl` -- there is no pseudocode anywhere in this topic.

### Accuracy notes

> This stack ships on a weekly cadence -- every version pin below is a reference point, not a permanent fact.
> The **stable spine** of this topic (`async`/`await`, the `asyncio` event loop, and ASGI) is taught inline; the
> **version-volatile** details (FastAPI, Pydantic v2, `uvicorn`, `uv`, `ruff`, `pyright`, `httpx`, `aiosqlite`)
> live in this dated sidebar so a version bump touches one place, not seventy-eight examples.

- **2026-07-29 -- `[Reference pin]`** (version-volatile, re-verify at authoring/refresh): the examples in this
  topic target **FastAPI 0.139.0**, **Pydantic 2.11.x** (the v2 production line), **pydantic-settings 2.x**,
  **uvicorn 0.51.0**, **httpx 0.28.x**, **aiosqlite 0.20.x**, **uv ~0.11.x**, **ruff ~0.15.x**, and **pyright**
  current, on **Python 3.13**. (source: FastAPI -- https://pypi.org/project/fastapi/ ; Pydantic --
  https://pypi.org/project/pydantic/ ; uv -- https://github.com/astral-sh/uv/releases ; ruff --
  https://github.com/astral-sh/ruff/releases ; accessed 2026-07-22). All are pre-1.0 except FastAPI/Pydantic and
  change frequently -- treat the pins above as a snapshot, not a guarantee.
- **2026-07-29 -- `[Stable]`**: `async`/`await`, the `asyncio` event loop, and the ASGI callable protocol are
  stable Python-language and ecosystem concepts; the conceptual treatment lives in
  [`concurrency-and-parallelism`](../concurrency-and-parallelism/learning/overview.md), and the from-scratch ASGI
  framework treatment lives in `build-your-own-web-framework`.

---

Next: [Learning Overview](./learning/overview.md) →
