---
title: Overview
date: 2026-10-24T00:00:00+07:00
draft: false
weight: 1
---

Seventy-eight worked examples in three levels, each a complete Rust program against an in-process Axum service. Beginner builds the request path: routes, parsing, responses. Intermediate runs the service like production: middleware, shared state, socketless tests. Advanced survives reality: concurrency, shutdown, and an honest comparison with FastAPI.

## How to read these pages

Each entry follows one shape: a brief, a short explanation, the concept refs, an optional diagram, the complete unit files as anchored fences, the golden output, a takeaway, and a why-it-matters note. Run any example with the command in its `run.yaml`; the harness compares stdout to the golden file.

## Course map

- Beginner (Examples 1–25): routes and handlers that map verbs plus paths (1–8), request parsing and validation at the boundary (9–17), response shaping and status codes (18–25).
- Intermediate (Examples 26–53): middleware and error handling around every call (26–34), dependency injection through shared state (35–44), testing without a real network call (45–53).
- Advanced (Examples 54–78): concurrency under load with shared ownership (54–61), graceful shutdown that drains before exiting (62–70), design choices compared against FastAPI (71–78).

## Examples by Level

### Beginner (Examples 1–25)

- [Example 1: Hello Route Returns JSON](/en/learn/courses/web-backends-in-rust-with-axum/learning/beginner#example-1-hello-route-returns-json)
- [Example 2: Path Parameter Names a Resource](/en/learn/courses/web-backends-in-rust-with-axum/learning/beginner#example-2-path-parameter-names-a-resource)
- [Example 3: Method and Path Pick the Handler](/en/learn/courses/web-backends-in-rust-with-axum/learning/beginner#example-3-method-and-path-pick-the-handler)
- [Example 4: Unknown Path Falls Back to 404](/en/learn/courses/web-backends-in-rust-with-axum/learning/beginner#example-4-unknown-path-falls-back-to-404)
- [Example 5: Nest Routes Under One Prefix](/en/learn/courses/web-backends-in-rust-with-axum/learning/beginner#example-5-nest-routes-under-one-prefix)
- [Example 6: Group Related Routes Together](/en/learn/courses/web-backends-in-rust-with-axum/learning/beginner#example-6-group-related-routes-together)
- [Example 7: Health Check Reports Readiness](/en/learn/courses/web-backends-in-rust-with-axum/learning/beginner#example-7-health-check-reports-readiness)
- [Example 8: Handler Returns HTML Page](/en/learn/courses/web-backends-in-rust-with-axum/learning/beginner#example-8-handler-returns-html-page)
- [Example 9: Query String Filters a List](/en/learn/courses/web-backends-in-rust-with-axum/learning/beginner#example-9-query-string-filters-a-list)
- [Example 10: JSON Body Becomes a Struct](/en/learn/courses/web-backends-in-rust-with-axum/learning/beginner#example-10-json-body-becomes-a-struct)
- [Example 11: Missing Field Rejects with 422](/en/learn/courses/web-backends-in-rust-with-axum/learning/beginner#example-11-missing-field-rejects-with-422)
- [Example 12: Custom Rule Rejects a Bad Order](/en/learn/courses/web-backends-in-rust-with-axum/learning/beginner#example-12-custom-rule-rejects-a-bad-order)
- [Example 13: Headers Carry Request Metadata](/en/learn/courses/web-backends-in-rust-with-axum/learning/beginner#example-13-headers-carry-request-metadata)
- [Example 14: Form Body Parses Pairs](/en/learn/courses/web-backends-in-rust-with-axum/learning/beginner#example-14-form-body-parses-pairs)
- [Example 15: Typed Path Rejects a Bad Id](/en/learn/courses/web-backends-in-rust-with-axum/learning/beginner#example-15-typed-path-rejects-a-bad-id)
- [Example 16: Optional Query Keeps Defaults](/en/learn/courses/web-backends-in-rust-with-axum/learning/beginner#example-16-optional-query-keeps-defaults)
- [Example 17: Validation Lives Before Logic](/en/learn/courses/web-backends-in-rust-with-axum/learning/beginner#example-17-validation-lives-before-logic)
- [Example 18: Status Code Says What Happened](/en/learn/courses/web-backends-in-rust-with-axum/learning/beginner#example-18-status-code-says-what-happened)
- [Example 19: Created Returns 201 and Location](/en/learn/courses/web-backends-in-rust-with-axum/learning/beginner#example-19-created-returns-201-and-location)
- [Example 20: Error Envelope Stays Consistent](/en/learn/courses/web-backends-in-rust-with-axum/learning/beginner#example-20-error-envelope-stays-consistent)
- [Example 21: Headers Shape the Response](/en/learn/courses/web-backends-in-rust-with-axum/learning/beginner#example-21-headers-shape-the-response)
- [Example 22: Content Negotiation Picks a Format](/en/learn/courses/web-backends-in-rust-with-axum/learning/beginner#example-22-content-negotiation-picks-a-format)
- [Example 23: Empty Body Answers 204](/en/learn/courses/web-backends-in-rust-with-axum/learning/beginner#example-23-empty-body-answers-204)
- [Example 24: Redirect Points at the New Path](/en/learn/courses/web-backends-in-rust-with-axum/learning/beginner#example-24-redirect-points-at-the-new-path)
- [Example 25: Beginner Review Routes to Responses](/en/learn/courses/web-backends-in-rust-with-axum/learning/beginner#example-25-beginner-review-routes-to-responses)

### Intermediate (Examples 26–53)

- [Example 26: Middleware Logs Every Request](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-26-middleware-logs-every-request)
- [Example 27: Auth Layer Rejects Anonymous Calls](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-27-auth-layer-rejects-anonymous-calls)
- [Example 28: Order in the Stack Matters](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-28-order-in-the-stack-matters)
- [Example 29: Request Id Travels End to End](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-29-request-id-travels-end-to-end)
- [Example 30: Timeout Bounds a Slow Handler](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-30-timeout-bounds-a-slow-handler)
- [Example 31: Body Limit Stops a Giant Upload](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-31-body-limit-stops-a-giant-upload)
- [Example 32: Errors Become JSON with One Type](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-32-errors-become-json-with-one-type)
- [Example 33: Fallback Handles Unknown Routes](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-33-fallback-handles-unknown-routes)
- [Example 34: CORS Layer Answers Preflight](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-34-cors-layer-answers-preflight)
- [Example 35: State Shares One Store](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-35-state-shares-one-store)
- [Example 36: State Stays Cloneable and Cheap](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-36-state-stays-cloneable-and-cheap)
- [Example 37: Constructor Keeps Wiring in One Place](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-37-constructor-keeps-wiring-in-one-place)
- [Example 38: Handler Takes Only What It Needs](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-38-handler-takes-only-what-it-needs)
- [Example 39: Extension Carries Request-Scoped Data](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-39-extension-carries-request-scoped-data)
- [Example 40: Config Arrives as Typed State](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-40-config-arrives-as-typed-state)
- [Example 41: Store Trait Keeps Handlers Testable](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-41-store-trait-keeps-handlers-testable)
- [Example 42: In-Memory Store Stands In for Postgres](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-42-in-memory-store-stands-in-for-postgres)
- [Example 43: Two States Serve Two Concerns](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-43-two-states-serve-two-concerns)
- [Example 44: Missing State Fails the Build](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-44-missing-state-fails-the-build)
- [Example 45: Oneshot Replaces the Socket](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-45-oneshot-replaces-the-socket)
- [Example 46: Test Posts JSON Without a Port](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-46-test-posts-json-without-a-port)
- [Example 47: Test Asserts Status and Body](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-47-test-asserts-status-and-body)
- [Example 48: Test Drives the Error Paths](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-48-test-drives-the-error-paths)
- [Example 49: Test Builds Requests with Headers](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-49-test-builds-requests-with-headers)
- [Example 50: Test Covers Middleware In-Process](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-50-test-covers-middleware-in-process)
- [Example 51: Test Seeds State Per Case](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-51-test-seeds-state-per-case)
- [Example 52: Test Reads the Golden Contract](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-52-test-reads-the-golden-contract)
- [Example 53: Test Suite Runs the Whole Service](/en/learn/courses/web-backends-in-rust-with-axum/learning/intermediate#example-53-test-suite-runs-the-whole-service)

### Advanced (Examples 54–78)

- [Example 54: Handlers Run on the Shared Runtime](/en/learn/courses/web-backends-in-rust-with-axum/learning/advanced#example-54-handlers-run-on-the-shared-runtime)
- [Example 55: Atomic Counter Survives Ten Clients](/en/learn/courses/web-backends-in-rust-with-axum/learning/advanced#example-55-atomic-counter-survives-ten-clients)
- [Example 56: Mutex Guards the Shared Order Book](/en/learn/courses/web-backends-in-rust-with-axum/learning/advanced#example-56-mutex-guards-the-shared-order-book)
- [Example 57: RwLock Separates Reads from Writes](/en/learn/courses/web-backends-in-rust-with-axum/learning/advanced#example-57-rwlock-separates-reads-from-writes)
- [Example 58: Clone State Not Data](/en/learn/courses/web-backends-in-rust-with-axum/learning/advanced#example-58-clone-state-not-data)
- [Example 59: Backpressure Bounds the Queue](/en/learn/courses/web-backends-in-rust-with-axum/learning/advanced#example-59-backpressure-bounds-the-queue)
- [Example 60: Blocking Work Moves to spawn_blocking](/en/learn/courses/web-backends-in-rust-with-axum/learning/advanced#example-60-blocking-work-moves-to-spawn_blocking)
- [Example 61: Load Check Prints a Stable Summary](/en/learn/courses/web-backends-in-rust-with-axum/learning/advanced#example-61-load-check-prints-a-stable-summary)
- [Example 62: Shutdown Starts with a Signal](/en/learn/courses/web-backends-in-rust-with-axum/learning/advanced#example-62-shutdown-starts-with-a-signal)
- [Example 63: In-Flight Requests Drain First](/en/learn/courses/web-backends-in-rust-with-axum/learning/advanced#example-63-in-flight-requests-drain-first)
- [Example 64: New Requests Stop at the Gate](/en/learn/courses/web-backends-in-rust-with-axum/learning/advanced#example-64-new-requests-stop-at-the-gate)
- [Example 65: Shutdown Has a Deadline](/en/learn/courses/web-backends-in-rust-with-axum/learning/advanced#example-65-shutdown-has-a-deadline)
- [Example 66: Health Goes Unready Before Stopping](/en/learn/courses/web-backends-in-rust-with-axum/learning/advanced#example-66-health-goes-unready-before-stopping)
- [Example 67: State Flushes Before Exit](/en/learn/courses/web-backends-in-rust-with-axum/learning/advanced#example-67-state-flushes-before-exit)
- [Example 68: Shutdown Token Fans Out to Tasks](/en/learn/courses/web-backends-in-rust-with-axum/learning/advanced#example-68-shutdown-token-fans-out-to-tasks)
- [Example 69: Double Signal Forces the Exit](/en/learn/courses/web-backends-in-rust-with-axum/learning/advanced#example-69-double-signal-forces-the-exit)
- [Example 70: Shutdown Checklist in One Service](/en/learn/courses/web-backends-in-rust-with-axum/learning/advanced#example-70-shutdown-checklist-in-one-service)
- [Example 71: Routing Axum Macros Versus Decorators](/en/learn/courses/web-backends-in-rust-with-axum/learning/advanced#example-71-routing-axum-macros-versus-decorators)
- [Example 72: Extractors Versus Injected Parameters](/en/learn/courses/web-backends-in-rust-with-axum/learning/advanced#example-72-extractors-versus-injected-parameters)
- [Example 73: Middleware Tower Layers Versus ASGI Stack](/en/learn/courses/web-backends-in-rust-with-axum/learning/advanced#example-73-middleware-tower-layers-versus-asgi-stack)
- [Example 74: Errors IntoResponse Versus Exception Handlers](/en/learn/courses/web-backends-in-rust-with-axum/learning/advanced#example-74-errors-intoresponse-versus-exception-handlers)
- [Example 75: State Versus Dependency Overrides](/en/learn/courses/web-backends-in-rust-with-axum/learning/advanced#example-75-state-versus-dependency-overrides)
- [Example 76: Testing Oneshot Versus TestClient](/en/learn/courses/web-backends-in-rust-with-axum/learning/advanced#example-76-testing-oneshot-versus-testclient)
- [Example 77: Static Types at the Boundary](/en/learn/courses/web-backends-in-rust-with-axum/learning/advanced#example-77-static-types-at-the-boundary)
- [Example 78: Structured Logs a Machine Can Parse](/en/learn/courses/web-backends-in-rust-with-axum/learning/advanced#example-78-structured-logs-a-machine-can-parse)
