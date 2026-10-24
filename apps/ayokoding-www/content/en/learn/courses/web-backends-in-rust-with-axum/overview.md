## Why this exists

Most Axum tutorials stop at `GET /hello`: one route, one handler, no state, no tests. Production backends need more — validated input, shared stores, middleware chains, socketless tests, concurrent safety, graceful shutdown — and the gap between the hello-world tutorial and the production service is where teams stall. This course fills that gap with seventy-eight complete, runnable Rust programs that build the request path from nothing and retire it gracefully: routing and parsing in Beginner, middleware and shared state plus socketless testing in Intermediate, concurrency and shutdown plus an honest FastAPI comparison in Advanced.

## What you will be able to do

- Define routes with method routing so each verb plus path maps to its own handler (`co-01`).
- Wrap routes in middleware layers for logging, auth, timeouts, limits, and CORS (`co-02`).
- Parse requests with typed extractors for paths, queries, JSON, forms, and headers (`co-03`).
- Shape responses with status codes, headers, content negotiation, and redirects (`co-04`).
- Report failures through one error type with a shared JSON envelope (`co-05`).
- Share dependencies through typed state, constructors, traits, and extensions (`co-06`).
- Serve concurrent load safely with atomics, mutexes, semaphores, and the blocking pool (`co-07`).
- Retire services gracefully with signals, gates, drains, deadlines, and flushes (`co-08`).
- Test every leg in-process with `oneshot`: no socket, no port, no flake (`co-09`).
- Validate input at the boundary with extractor types plus business rule functions (`co-10`).
- Organize services by nesting versioned routers and merging grouped routers (`co-11`).
- Negotiate response formats from the `Accept` header with a JSON default (`co-12`).
- Emit logs that machines parse: one JSON line per request (`co-13`).
- Serve liveness and readiness probes beside business routes (`co-14`).
- Keep static types at the boundary so malformed input never reaches logic (`co-15`).
- Compare Axum design choices against FastAPI honestly, spelling for spelling (`co-16`).

## How this course is organized

Beginner (Examples 1–25) builds the request path: routes and handlers (1–8), request parsing and validation (9–17), response shaping and status codes (18–25). Intermediate (Examples 26–53) runs the service like production: middleware and error handling (26–34), dependency injection through shared state (35–44), testing without a real network call (45–53). Advanced (Examples 54–78) survives reality: concurrency under load (54–61), graceful shutdown (62–70), design choices compared against FastAPI (71–78). Each example is a complete Rust program under `learning/code/` with its own `run.yaml`; the drilling module adds eight katas with before/after pairs, and the capstone builds an order-tracking service through nine lifecycle legs.

## Prerequisites

- Rust fundamentals: ownership, `Result`, traits, and `async`/`await` (the `rust-in-depth` course covers these).
- A Rust toolchain matching the course pin (Rust 1.99.1; each unit builds offline from the shared `Cargo.lock`).
- Familiarity with HTTP verbs, status codes, and headers at the level of the `backend-essentials` course, which also supplies the FastAPI baseline for Examples 71–78.
- Helpful but not required: experience with any async runtime, and a checkout of the sibling `database-migrations-with-rust-and-sqlx` course for the store seam Examples 41–42 anticipate.

## About the examples

Every example drives its service in-process through `tower::ServiceExt::oneshot`: no socket is bound, no port is chosen, no network packet moves. Outputs are deterministic — fixed seeds, sorted listings, no clocks, no timings — so each golden file pins the behavior byte for byte. Compiler output stays silent under `--quiet`, so goldens hold only program lines. The shared `Cargo.lock` pins axum 0.8.9, tokio 1.54.1, tower 0.5.3, serde 1.0.229, serde_json 1.0.154, and tower-http 0.6.11; accuracy notes name these versions because the framework's exact messages (rejections, limits, CORS headers) are part of several goldens.

## Who this course is for

- Rust developers who finished the fundamentals and want to serve HTTP with the ecosystem's most-composed framework.
- Backend engineers coming from FastAPI, Express, or Gin who want an honest, spelling-for-spelling comparison before committing to Axum.
- Teams standardizing on Axum who need the production shapes — state, middleware, shutdown — in testable, copyable units.

## What is not covered

- WebSockets and SSE streaming: the course stays on request/response services with finite bodies.
- Database drivers and SQLx pools: stores are in-memory behind a trait seam that a Postgres backend can fill.
- Deployment, TLS termination, and container orchestration: probes and shutdown behavior are covered, platforms are not.
- Template rendering and asset pipelines: one `Html` responder shows the shape, full pages belong elsewhere.
- Authentication protocols (OAuth, JWT verification): the auth layer shows the gate shape with a bearer constant, not a protocol.

## References

- Axum 0.8.9 documentation, read 2026-10-24. Route, extractor, middleware, and state semantics verified against this source.
- tower-http 0.6.11 CORS layer documentation, read 2026-10-24. Preflight declaration semantics (the server declares, the browser enforces) verified against this source.
- Tokio 1.54.1 and serde 1.0.229 with serde_json 1.0.154, versions recorded in the shared `Cargo.lock`; runtime, synchronization, and serialization behavior verified by compiling and running all seventy-eight examples plus the capstone with the pinned toolchain.
- The `backend-essentials` course in this repository, the FastAPI baseline for the comparison cluster: decorator routing, Pydantic validation with 422 answers, `Depends` generator dependencies, `TestClient` tests, exception handlers, middleware, and uvicorn serving.
