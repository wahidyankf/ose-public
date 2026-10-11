---
title: "Overview"
date: 2026-07-29T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Backend Essentials](../backend-essentials/learning/overview.md) -- routing,
  request/response handling, and serving a CRUD JSON API, the mechanical layer this course assumes
  already works and builds the scale concerns on top of; [SQL Essentials](../sql-essentials/learning/overview.md)
  -- the database fluency the pagination (co-04/co-05), transaction (co-11), and N+1 (co-40) examples
  lean on; [Security Essentials](../security-essentials/learning/overview.md) -- tokens vs sessions,
  the foundation the OAuth2/OIDC (co-15) and JWT (co-14) examples deepen; and [Software Testing](../software-testing/learning/overview.md)
  -- the testing discipline the contract (co-35) and testcontainers (co-36) examples extend.
- **Tools & environment**: a macOS/Linux terminal; **Python 3.13+** with type hints and `pyright --strict`;
  `curl` for exercising ideas conceptually. Every worked example in this course is pure Python standard
  library -- no web framework, database driver, broker, or network connection is required to run a single
  one. Real-world mechanics (gRPC, GraphQL, WebSocket, SSE, OpenTelemetry, queues, brokers) are simulated
  in-process so every printed "Output" block is a real captured run, not a fabricated transcript.
- **Assumed knowledge**: building/serving a CRUD JSON API (topic 11); writing an integration test (topic 15);
  tokens vs sessions and basic HTTP status codes (topic 17).

## Why this exists -- the big idea

**The problem before the solution**: an endpoint that works for one user melts under real load, retries,
and partial failure -- correctness under concurrency and failure is a different problem than correctness
on the happy path. A POST that creates one order correctly will create a duplicate order the moment a
flaky network makes a client retry; a cache that makes reads fast will serve stale data the moment the
wrong TTL outlives the data's freshness; a queue that decouples a producer from a consumer will deliver
the same message twice the moment the consumer crashes before acking. **The one idea worth keeping if you
forget everything else**: at scale, design for the retry and the failure -- idempotency, backpressure, and
decoupling via queues are what let a service survive load instead of amplifying it.

**Cross-cutting big ideas, taught here and carried through every tier**: `consistency-latency-throughput`
-- caching, rate limiting, and pagination are all throughput-management decisions dressed up as features;
`taming-state` -- idempotency quarantines duplicate-effect state so a retried write applies once;
`coupling-vs-cohesion` -- async messaging and the outbox decouple a producer from a consumer so each can
fail and recover independently.

> **Scope guard -- this course vs. the backend it builds on vs. the architecture around it.**
> [Backend Essentials](../backend-essentials/learning/overview.md) owns the **serving mechanics**:
> routing, request parsing, and returning a JSON response from a running web framework. This course
> assumes that mechanical layer already works and owns a different, narrower question: how does a backend
> SURVIVE real load, retries, partial failure, and decoupled communication -- the deep pass over
> reliability (idempotency, caching, rate limiting, health, resilience), AuthN/Z (OAuth2/OIDC, JWT, RBAC,
> PKCE), persistence patterns (repository, unit-of-work, transactional outbox), and async/messaging
> (queues, at-least-once, idempotent consumers). [System Design](/en/learn/courses/system-design)
> would own SYSTEM-LEVEL scaling
> (sharding, replication topology, capacity planning, multi-region); this course stops at the patterns
> that make ONE backend service scale-ready, the building blocks a System Design course would compose
> into a topology. [Event-Driven Architecture](/en/learn/courses/event-driven-architecture) would own
> the deeper async/streaming story; this course covers the queue/outbox foundations it builds on.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 80 runnable, heavily annotated worked examples across
  Beginner (Examples 1-28: REST method semantics and status codes, API versioning, offset and cursor
  pagination, Idempotency-Key handling, the repository and unit-of-work patterns, ACID transactions,
  JWT, RBAC/ABAC, and structured logging with correlation ids), Intermediate (Examples 29-56: OAuth2
  and OIDC, PKCE, refresh-token rotation and reuse detection, the four rate-limit algorithms and 429,
  cache-aside/write-through/TTL/invalidation, HTTP caching with ETag and Cache-Control, OpenTelemetry
  spans and W3C traceparent, liveness vs readiness probes, GraphQL's field selection and N+1, gRPC unary
  and streaming, and a REST/GraphQL/gRPC contrast), and Advanced (Examples 57-80: at-least-once delivery,
  idempotent consumers, dead-letter queues, backpressure, the dual-write problem and the transactional
  outbox, HMAC webhooks, WebSocket vs SSE, a broker backplane, the circuit breaker, retry backoff with
  full jitter, timeouts and bulkheads, connection pooling, Pact contract testing, testcontainers, and a
  closing example assembling every prior idea into one scale-ready service) -- plus a four-step capstone
  that evolves a Backend-Essentials service into a versioned, paginated, idempotent, RBAC-authed, rate-
  limited, cached API with a background-job queue consumer behind an integration and contract suite.
- **Drilling** -- the spaced-repetition companion: recall Q&A across all 40 concepts, applied problems,
  self-contained code katas, a self-check checklist, and elaborative-interrogation prompts.

**A note on how this course verifies its own claims**: every worked example is GENUINELY EXECUTED Python
(`python3 example.py`), not hand-traced -- gRPC, GraphQL, WebSocket, SSE, OpenTelemetry, queues, and
brokers are simulated in-process in pure standard library rather than depending on a live `grpcio`,
`graphql-core`, `websockets`, `opentelemetry`, or `redis` installation, so every printed "Output" block on
this course's pages is a real captured run, never a fabricated transcript.

## References

- The authoritative OAuth security source is **RFC 9700**
  "Best Current Practice for OAuth 2.0 Security" (IETF, Jan 2025) -- deprecates the Implicit Grant and
  ROPC Grant, mandates PKCE for public clients. **OAuth 2.1 is still an IETF draft**
  (draft-ietf-oauth-v2-1-15, March 2026) -- NOT a finalized RFC as of July 2026. This course cites
  OAuth 2.0 + RFC 9700 as the settled standard and describes OAuth 2.1 as "in-progress consolidation,"
  not a finalized spec.
- HTTP method safety/idempotency and status codes follow **RFC 9110** (HTTP
  Semantics, STD 97, 2022). 422 is "Unprocessable Content" (RFC 9110 Sec 15.5.21, renamed from RFC
  4918's "Unprocessable Entity"); 429 is RFC 6585 Sec 4.
- The **Idempotency-Key** IETF draft (draft-ietf-httpapi-idempotency-key-header-07)
  is EXPIRED/archived (expired 2026-04-18), not an RFC. This course's examples (co-06) follow Stripe's
  own prior art instead and label the IETF draft "lapsed."
- Rate-limit algorithms -- token bucket (AWS API Gateway, allows bursts) and
  sliding window (Cloudflare production) are documented by those vendors; leaky-bucket and fixed-window
  exact attribution was not independently confirmed -- treat the two algorithm names as common usage
  rather than a documented canonical attribution. Caching cache-aside/write-through comes from the AWS
  Redis caching strategies whitepaper; the write-behind wording was not independently confirmed.
- Resilience patterns -- circuit breaker (closed/open/half-open, popularized by
  Nygard's _Release It!_; Fowler's CircuitBreaker bliki); **Full Jitter** `sleep = random(0, min(cap,
base*2^attempt))` from AWS "Exponential Backoff and Jitter" (Marc Brooker, 2015). Bulkhead attribution
  to Nygard _Release It!_ (2007). Connection-pooling concept was not independently confirmed against a
  single primary source.

---

Next: [Learning Overview](./learning/overview.md) →
