---
title: "Overview"
date: 2026-10-24T00:00:00+07:00
draft: false
weight: 1
---

## How this course is organized

Three levels carry 78 worked examples. Beginner (Examples 1–25) builds the route table, reads requests, and shapes responses; Intermediate (Examples 26–53) wraps behavior in middleware, feeds handlers from services, and checks everything in-process; Advanced (Examples 54–78) loads handlers concurrently, shuts the host down gracefully, and compares each design choice honestly against FastAPI. Every example is a complete runnable program: code blocks are byte-identical with the files under `learning/code/`, and outputs match their golden transcripts.

## Concept map

| Concept | Meaning                                                         |
| ------- | --------------------------------------------------------------- |
| co-01   | Routing — one method plus one path picks one handler            |
| co-02   | Middleware and function composition wrap the pipeline           |
| co-03   | Request parsing — paths, queries, headers, bodies arrive typed  |
| co-04   | Response shaping — statuses, headers, and bodies carry outcomes |
| co-05   | Error handling — designed misses, envelopes, and recovery       |
| co-06   | Dependency injection — services live in the container           |
| co-07   | Concurrency and parallelism under load                          |
| co-08   | Graceful shutdown and the host lifecycle                        |
| co-09   | Testing without a real network call                             |
| co-10   | Validation at the boundary                                      |
| co-11   | Route groups share a prefix                                     |
| co-12   | Content negotiation from the Accept header                      |
| co-13   | Logging and observability                                       |
| co-14   | Health checks and readiness                                     |
| co-15   | Records and serialization at the boundary                       |
| co-16   | Comparing design choices against FastAPI                        |

## About the runtime

Every unit is a .NET 10 F# console project pinned through its own `packages.lock.json`: Giraffe 8.3.0 for routing plus `Microsoft.AspNetCore.TestHost` 10.0.13 for the in-memory server, with `FSharp.Core` pinned explicitly because the SDK-implicit line floats between images. Restores are locked and fully offline (`NUGET_CERT_REVOCATION_MODE=offline` plus telemetry opt-outs), builds silence the compiler log, and the compiled assembly runs its checks against the loopback `TestClient` — no socket opens, no port is chosen, and the only stdout is the transcript the golden file holds.

## Examples by Level

### Beginner (Examples 1–25)

- [Example 1: Hello Route Returns JSON](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/beginner#example-1-hello-route-returns-json)

- [Example 2: Path Parameter Names a Resource](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/beginner#example-2-path-parameter-names-a-resource)

- [Example 3: Query String Filters a List](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/beginner#example-3-query-string-filters-a-list)

- [Example 4: Method and Path Pick the Handler](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/beginner#example-4-method-and-path-pick-the-handler)

- [Example 5: Route Groups Share a Prefix](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/beginner#example-5-route-groups-share-a-prefix)

- [Example 6: Custom 404 for Unknown Routes](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/beginner#example-6-custom-404-for-unknown-routes)

- [Example 7: Redirect Moves a Client](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/beginner#example-7-redirect-moves-a-client)

- [Example 8: Handlers Are Small Functions](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/beginner#example-8-handlers-are-small-functions)

- [Example 9: Bind JSON into a Typed Record](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/beginner#example-9-bind-json-into-a-typed-record)

- [Example 10: Validation Rejects a Bad Body](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/beginner#example-10-validation-rejects-a-bad-body)

- [Example 11: Path and Query Combine](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/beginner#example-11-path-and-query-combine)

- [Example 12: Headers Carry Metadata](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/beginner#example-12-headers-carry-metadata)

- [Example 13: Forms Carry Key-Value Pairs](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/beginner#example-13-forms-carry-key-value-pairs)

- [Example 14: Content Type Picks the Reader](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/beginner#example-14-content-type-picks-the-reader)

- [Example 15: Repeated Query Keys Collect a List](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/beginner#example-15-repeated-query-keys-collect-a-list)

- [Example 16: Missing Field Means 400](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/beginner#example-16-missing-field-means-400)

- [Example 17: Numbers Parse or Fail Cleanly](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/beginner#example-17-numbers-parse-or-fail-cleanly)

- [Example 18: Status Code Says What Happened](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/beginner#example-18-status-code-says-what-happened)

- [Example 19: JSON Keys Follow a Contract](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/beginner#example-19-json-keys-follow-a-contract)

- [Example 20: Problem Envelope Stays Consistent](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/beginner#example-20-problem-envelope-stays-consistent)

- [Example 21: Headers Shape Caching](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/beginner#example-21-headers-shape-caching)

- [Example 22: Cookies Carry a Session](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/beginner#example-22-cookies-carry-a-session)

- [Example 23: File Download Names Itself](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/beginner#example-23-file-download-names-itself)

- [Example 24: Created Points at the New Resource](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/beginner#example-24-created-points-at-the-new-resource)

- [Example 25: Beginner Review: Orders Mini Service](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/beginner#example-25-beginner-review-orders-mini-service)

### Intermediate (Examples 26–53)

- [Example 26: Middleware Wraps Every Request](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-26-middleware-wraps-every-request)

- [Example 27: Short-Circuit Stops the Chain](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-27-short-circuit-stops-the-chain)

- [Example 28: Middleware Order Is Outer to Inner](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-28-middleware-order-is-outer-to-inner)

- [Example 29: Exception Handler Turns Throws into 500](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-29-exception-handler-turns-throws-into-500)

- [Example 30: Status Code Pages Fill Empty Bodies](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-30-status-code-pages-fill-empty-bodies)

- [Example 31: Request Logging Sees Every Call](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-31-request-logging-sees-every-call)

- [Example 32: Timing Wrapper Measures the Pipeline](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-32-timing-wrapper-measures-the-pipeline)

- [Example 33: Auth Middleware Guards a Route](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-33-auth-middleware-guards-a-route)

- [Example 34: Recovery Keeps the Service Up](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-34-recovery-keeps-the-service-up)

- [Example 35: Services Live in the Container](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-35-services-live-in-the-container)

- [Example 36: Handler Reads Its Service](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-36-handler-reads-its-service)

- [Example 37: Singleton Store Keeps State](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-37-singleton-store-keeps-state)

- [Example 38: Scoped Per-Request Isolation](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-38-scoped-per-request-isolation)

- [Example 39: Options Pattern Carries Settings](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-39-options-pattern-carries-settings)

- [Example 40: Clock Abstraction Keeps Time Testable](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-40-clock-abstraction-keeps-time-testable)

- [Example 41: Repository Hides the Dictionary](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-41-repository-hides-the-dictionary)

- [Example 42: Multiple Handlers Share One Service](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-42-multiple-handlers-share-one-service)

- [Example 43: Missing Service Fails at Startup](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-43-missing-service-fails-at-startup)

- [Example 44: Intermediate Review: DI and Middleware](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-44-intermediate-review-di-and-middleware)

- [Example 45: TestServer Needs No Socket](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-45-testserver-needs-no-socket)

- [Example 46: One Client Drives Many Cases](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-46-one-client-drives-many-cases)

- [Example 47: Assert Status Then Shape](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-47-assert-status-then-shape)

- [Example 48: POST Then GET Roundtrip](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-48-post-then-get-roundtrip)

- [Example 49: Error Paths Get Tests Too](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-49-error-paths-get-tests-too)

- [Example 50: Test Each Route in a Table](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-50-test-each-route-in-a-table)

- [Example 51: Fake Service Isolates the Handler](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-51-fake-service-isolates-the-handler)

- [Example 52: Logs Stay Out of Test Output](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-52-logs-stay-out-of-test-output)

- [Example 53: Intermediate Review: Testing Habits](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/intermediate#example-53-intermediate-review-testing-habits)

### Advanced (Examples 54–78)

- [Example 54: Async Handlers Free the Thread](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/advanced#example-54-async-handlers-free-the-thread)

- [Example 55: Interlocked Counts Shared Hits](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/advanced#example-55-interlocked-counts-shared-hits)

- [Example 56: Semaphore Caps Concurrent Work](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/advanced#example-56-semaphore-caps-concurrent-work)

- [Example 57: Concurrent Dictionary Caches Safely](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/advanced#example-57-concurrent-dictionary-caches-safely)

- [Example 58: Cancellation Abandons Slow Work](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/advanced#example-58-cancellation-abandons-slow-work)

- [Example 59: Parallel Fan-Out Then Join](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/advanced#example-59-parallel-fan-out-then-join)

- [Example 60: Rate Limiter Sheds Excess Load](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/advanced#example-60-rate-limiter-sheds-excess-load)

- [Example 61: Mailbox Serializes Writes](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/advanced#example-61-mailbox-serializes-writes)

- [Example 62: Stop Waits for the App](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/advanced#example-62-stop-waits-for-the-app)

- [Example 63: In-Flight Request Finishes First](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/advanced#example-63-in-flight-request-finishes-first)

- [Example 64: Health Check Reports Readiness](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/advanced#example-64-health-check-reports-readiness)

- [Example 65: Readiness Flips Before Shutdown](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/advanced#example-65-readiness-flips-before-shutdown)

- [Example 66: Structured Logs Mark Lifecycle](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/advanced#example-66-structured-logs-mark-lifecycle)

- [Example 67: Slow Handler Meets a Deadline](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/advanced#example-67-slow-handler-meets-a-deadline)

- [Example 68: Second Stop Is Safe](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/advanced#example-68-second-stop-is-safe)

- [Example 69: Startup Checks Dependencies First](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/advanced#example-69-startup-checks-dependencies-first)

- [Example 70: Advanced Review: Concurrency and Shutdown](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/advanced#example-70-advanced-review-concurrency-and-shutdown)

- [Example 71: Routes as Values Not Decorators](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/advanced#example-71-routes-as-values-not-decorators)

- [Example 72: Composition Replaces Nesting](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/advanced#example-72-composition-replaces-nesting)

- [Example 73: Explicit Services vs Injection Magic](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/advanced#example-73-explicit-services-vs-injection-magic)

- [Example 74: Validation Without Decorators](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/advanced#example-74-validation-without-decorators)

- [Example 75: Errors as Values Not Exceptions](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/advanced#example-75-errors-as-values-not-exceptions)

- [Example 76: Tests Without a Live Server](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/advanced#example-76-tests-without-a-live-server)

- [Example 77: Typing at the Boundary Both Worlds](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/advanced#example-77-typing-at-the-boundary-both-worlds)

- [Example 78: Capstone Preview: Full Service Tour](/en/learn/courses/web-backends-in-fsharp-with-giraffe/learning/advanced#example-78-capstone-preview-full-service-tour)
