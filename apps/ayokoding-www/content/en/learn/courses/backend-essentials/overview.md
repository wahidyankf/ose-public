---
title: "Overview"
date: 2026-07-14T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Just Enough Python](../just-enough-python/learning/overview.md) and SQL Essentials -- the service this topic builds persists to a relational database, so both a working
  knowledge of Python functions/modules and a parameterized SQL query written from Python are assumed.
- **Tools & environment**: a macOS/Linux terminal; **Python 3.x** in a `venv`; a pinned CVE-clean web
  framework (FastAPI or Flask) plus `uvicorn`; **`curl`** to exercise endpoints; SQLite (from topic 10)
  or a local PostgreSQL for the persistence examples later in this topic.
- **Assumed knowledge**: reading and writing Python functions and modules; basic SQL queries and a
  parameterized query from Python. No prior web-framework experience is required -- this topic is
  where that experience starts.

## Why this exists -- the big idea

The problem before the solution: many clients need to share and change the same durable state over a
network -- that demands a server mediating access, not a local script that only one process can touch.
The one idea worth keeping if you forget everything else: **a backend is a stateless pipeline** --
receive, validate, persist, respond -- with all the real state pushed down into the database, not held
in the server process itself.

**Cross-cutting big ideas**: `taming-state` -- HTTP is deliberately stateless so the hard state lives in
exactly one place, the database, instead of scattered across server memory. `layering-and-leaks` -- the
request -> handler -> repository -> store chain is a layering this topic keeps clean throughout: a
handler that reaches past its repository straight into SQL is a leak, and this topic's later examples
verify that leak never happens.

**Scope note**: this topic covers the **usable slice** -- a real HTTP JSON service wired to a database,
run and tested from the CLI. Deeper scale, advanced auth, caching, and messaging are deliberately
deferred to a later, dedicated Backend at Scale topic; this topic's job is the everyday foundation those
build on. HTTP fundamentals (methods, status codes, statelessness) are introduced here because they
precede the Networking topic that follows in the spiral.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 80 runnable, heavily annotated Python examples across
  Beginner (Examples 1-28: a hand-written `http.server`/`wsgiref` raw server, then FastAPI basics --
  routing, path/query params, typed request/response bodies, status codes, headers, PUT/PATCH
  semantics, statelessness, and a first look at content negotiation -- plus one Flask comparison),
  Intermediate (Examples 29-56: request validation, structured error envelopes, a repository-style
  SQLite persistence layer, full CRUD, schema migrations, dependency-injected DB connections, and
  cross-cutting middleware), and Advanced (Examples 57-80: session- and token-based authentication,
  pagination, filtering and sorting, and a set of end-to-end verification examples) -- plus a capstone
  task/notes API tying CRUD, auth, and pagination together in one runnable service.

Every example is a complete, self-contained Python module colocated under `learning/code/`, served with
`uvicorn` (or the stdlib server for the earliest examples) and exercised with `curl` -- there is no
pseudocode anywhere in this topic.

**A note on versions**: this topic's examples were authored and verified against the syllabus's
web-verified pins -- **FastAPI 0.139.0**, **uvicorn 0.51.0**, **Flask 3.1.3** -- all confirmed
current/CVE-clean as of 2026-07-12 (Flask 3.1.3 specifically fixes
[CVE-2026-27205](https://nvd.nist.gov/vuln/detail/CVE-2026-27205)). The sandbox that produced every
captured "Output" block in this topic reports:

```text
$ python3 --version
Python 3.13.12
$ pip show fastapi uvicorn flask
Name: fastapi
Version: 0.139.0
Name: uvicorn
Version: 0.51.0
Name: Flask
Version: 3.1.3
```

All three pins installed exactly as specified -- no substitution was needed.

---

Next: [Learning Overview](./learning/overview.md) →
