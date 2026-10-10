---
title: "Overview"
date: 2026-07-29T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Backend Essentials](../backend-essentials/learning/overview.md) -- HTTP
  verbs, status codes, routing, and JSON request/response handling, the direct foundation every
  example in this course's Beginner tier builds on; `backend-at-scale` --
  `[Unverified]` not yet present in the AyoKoding course library on disk, so no link is given here --
  would otherwise supply idempotency, auth, and rate limiting as production concerns, which this
  course instead teaches from first principles in its Intermediate tier (Examples 37-48) rather than
  assuming prior exposure.
- **Tools & environment**: a macOS/Linux terminal; **Python** at a recent stable release with type
  hints and `pyright`; `curl` or another HTTP client for exercising the ideas conceptually. Every
  worked example in this course is pure Python standard library -- no web framework, database, or
  network connection is required to run a single one.
- **Assumed knowledge**: serving a CRUD JSON API (topic 11); reading and writing typed request/
  response models in Python; basic familiarity with HTTP status codes.

## Why this exists -- the big idea

**The problem before the solution**: an endpoint that works is not an API -- the moment a second
team, a mobile app, or a paying customer depends on it, every field name, status code, and
pagination quirk becomes a promise that cannot be quietly broken. An API built ad hoc, one endpoint
at a time, turns every later change into a coordinated migration and every outage into a guessing
game about what the response was even supposed to look like. **The one idea worth keeping if you
forget everything else**: design the contract first, and design for the caller you will never meet
-- a stable, versioned, self-describing contract with predictable errors and idempotent writes is
what lets clients evolve independently of the server, rather than in lockstep with it.

**Cross-cutting big ideas, taught here and reused throughout this course**:
`coupling-vs-cohesion` -- a good contract decouples client from server so each can change on its own
schedule; a leaky one couples every consumer to the server's own internals; `consistency-latency-
throughput` -- pagination strategy, rate limiting, and the REST/GraphQL/gRPC choice are all
throughput-and-latency decisions dressed up as an API-style preference.

> **Scope guard -- API design vs. the backend that serves it vs. the architecture around it.**
> [Backend Essentials](../backend-essentials/learning/overview.md) owns the **serving
> mechanics**: routing, request parsing, and returning a JSON response from a running web framework.
> This course assumes that mechanical layer already works and owns a different, narrower question:
> what SHAPE should the contract itself take, and what PROMISES does that shape make to a caller who
> will never see the server's own source code. `backend-at-scale` -- `[Unverified]` not yet present
> in the AyoKoding course library on disk, so no link is given here -- would own operating a backend
> under real production load (scaling, observability, incident response); this course instead treats
> idempotency and rate limiting purely as CONTRACT-level concerns -- what a caller can rely on, not
> how the server internally survives a traffic spike. `software-architecture` -- `[Unverified]` not
> yet present in the AyoKoding course library on disk, so no link is given here -- would own how
> services are decomposed and how they communicate with EACH OTHER at a system level; this course
> stops at the shape of ONE API's own contract, the stable interface a `software-architecture`
> course would build service boundaries on top of.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 80 runnable, heavily annotated worked examples across
  Beginner (Examples 1-28: resource-noun URIs, HTTP method semantics, status-code design, the
  `problem+json` error envelope, a hand-built OpenAPI 3.1 document with request/response validation,
  offset and cursor pagination, and content negotiation), Intermediate (Examples 29-56: the three
  versioning strategies, backward-compatible evolution and the tolerant-reader rule, deprecation and
  sunset headers, idempotency-key handling, rate limiting with structured headers, HTTP caching and
  optimistic concurrency, bearer/API-key auth with scope checks, partial responses, batch/bulk
  endpoints, webhooks with HMAC signing, and HAL hypermedia), and Advanced (Examples 57-80: GraphQL's
  schema, resolvers, the N+1 problem and DataLoader batching, three of gRPC's four RPC kinds over
  Protobuf (client-streaming covered conceptually in the drilling track),
  REST/GraphQL/gRPC contrasted on caching and evolution, contract-first design driving a live
  implementation, versioned migration with a deprecation window, idempotency combined with rate
  limiting, and a closing example assembling every prior idea into one versioned API) -- plus a
  four-step capstone that designs a contract-first, versioned, paginated, idempotent REST API and
  adds a GraphQL facade over the identical data.
- **Drilling** -- the spaced-repetition companion: recall Q&A across all 34 concepts, applied
  problems, self-contained code katas, a self-check checklist, and elaborative-interrogation
  prompts.

**A note on how this course verifies its own claims**: every worked example in this course is
GENUINELY EXECUTED Python (`python3 example.py`), not hand-traced -- gRPC's and GraphQL's real-world
mechanics are simulated in-process, in pure standard library, rather than depending on a live
`grpcio` or `graphql-core` installation, so every printed "Output" block on this course's pages is a
real captured run, not a fabricated transcript.

## Accuracy notes

> Verified in the pre-authoring `web-researcher` sweep (DD-28). Dated per this topic's own
> accuracy-note discipline: every volatile, version-pinned, or calendar-dependent fact below is
> flagged or dated here rather than stated unqualified in the stable spine above.

- 2026-07-12 -- verified: OpenAPI remains the dominant REST contract format, and Protocol Buffers/
  gRPC and the GraphQL specification remain the standard non-REST contrasts. RFC 9110's HTTP
  semantics (methods, status codes), which REST builds on, is current -- this course targets **RFC
  9110**, not the obsoleted RFC 7231, throughout.
- 2026-07-12 -- **pinned at drafting (GAP flagged by the research sweep)**: this course targets
  **OpenAPI 3.1.0**, whose schema keywords align with **JSON Schema Draft 2020-12** (co-10). The
  error envelope is **RFC 9457** `application/problem+json` (co-08) -- the research sweep flagged
  this as a defensible-but-optional choice rather than a single mandated standard; see Drilling's
  elaborative-interrogation prompt E4 for the reasoning behind picking this one specific standard.
- 2026-07-12 -- **Idempotency-Key (correction)**: the IETF draft
  `draft-ietf-httpapi-idempotency-key-header-07` is **EXPIRED** (2026-04-18), not an RFC. This
  course's Idempotency-Key examples (co-18) follow Stripe's own prior art instead, and label the
  IETF draft "lapsed" wherever it comes up.
- 2026-07-12 -- **Rate-limit headers (status split)**: `429 Too Many Requests` is standardized (RFC
  6585, co-19); the structured `RateLimit`/`RateLimit-Policy` header fields (co-20) are an **active**
  IETF draft (`draft-ietf-httpapi-ratelimit-headers-11`, expires 2026-11-24) -- active, unlike the
  lapsed Idempotency-Key draft above.
- 2026-07-12 -- **Deprecation/Sunset (precise RFCs)**: the `Deprecation` response header is **RFC
  9745** (2025, Standards Track); the `Sunset` header is **RFC 8594** (2019, Informational) -- two
  different statuses, both notification-only (co-15).
- 2026-07-22 -- **GraphQL's primary sources were fetch-blocked (403)** at verification time
  (graphql.org, spec.graphql.org, and graphql.org/learn all returned 403 on re-check). This course's
  GraphQL claims (co-24, co-25) are corroborated by well-established secondary sources and taught as
  the widely-documented GraphQL value proposition, not quoted directly from the blocked primary spec.
- 2026-07-22 -- **the REST-vs-GraphQL-vs-gRPC three-way comparison (co-27) is synthesized guidance**,
  not a single-source citation -- no one primary source states the three-way trade-off; each leg
  traces back to its own project's stated design goals (REST's cacheability via RFC 9111, GraphQL's
  client-shaped queries, gRPC's typed streaming), cited independently rather than as one unified
  claim.

---

Next: [Learning Overview](./learning/overview.md) →
