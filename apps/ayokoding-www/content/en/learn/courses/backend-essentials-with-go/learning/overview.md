---
title: "Overview"
date: 2026-10-13T00:00:00+07:00
draft: false
weight: 1
---

## By Example

This learning track mirrors [Backend Essentials](../../backend-essentials/learning/overview.md) in three tiers, rebuilt with stdlib-only Go:

1. **Beginner**: a hand-written `net/http` server first (status lines, headers, routing by hand, 404, 405), then `net/http` routing basics -- `ServeMux`, typed path and query parameters, JSON request and response bodies, status codes (201/204), reading and setting headers, PUT/PATCH semantics, a statelessness demonstration, and content negotiation with `Accept` and `Content-Type`.
2. **Intermediate**: request validation failures and structured error envelopes, a repository-style SQLite persistence layer with parameterized queries, full CRUD wired through that repository, additive schema migrations, explicit dependency passing for database handles, and cross-cutting middleware (request IDs, logging, timing, CORS).
3. **Advanced**: bearer-token authentication, token-check middleware protecting writes, pagination with `limit`/`offset` and response metadata, filtering and sorting composed together, and end-to-end verification (a documented `curl` script, a `go test` suite, and a two-process statelessness check) -- plus a capstone task and notes API tying CRUD, auth, and pagination into one runnable service.

Every example is a complete, self-contained Go module under `learning/code/`, run with `go run .` from inside its own directory and exercised with `curl` from a second terminal. The track holds 80 worked examples plus a capstone: Beginner (Examples 1-28), Intermediate (Examples 29-56), Advanced (Examples 57-80).

## References

- `net/http` server behavior follows the Go standard library documentation; HTTP semantics follow RFC 9110.
