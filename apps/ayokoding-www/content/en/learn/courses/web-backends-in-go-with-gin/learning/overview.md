---
title: "Overview"
date: 2026-10-23T00:00:00+07:00
draft: false
weight: 1
---

Prerequisites for this course: [just-enough-go](/en/learn/courses/just-enough-go/learning/overview) for Go's basic syntax, which every example assumes you can already read; and [backend-essentials](/en/learn/courses/backend-essentials/learning/overview) for the shared HTTP vocabulary (methods, status codes, headers) this course uses without re-teaching. Assumed knowledge: basic HTTP concepts from backend-essentials.

## Why this exists -- the big idea

**The problem before the solution**: backend-essentials and backend-at-scale teach backends in Python with FastAPI, but nobody teaches Go developers Gin's own routing, middleware, and request-handling idioms at the depth working services need. Learners reach for `net/http` patterns or translate FastAPI habits instead of thinking in Gin. **Keep this if you forget everything else**: a route handler is a pure function from request to response until you deliberately reach for shared state.

## Tensions and trade-offs -- when NOT to reach for this

- **Framework versus standard library**: Gin buys concise routing, binding, validation, and middleware; it costs a dependency closure you must vendor and audit. Spend it when the service has enough routes, formats, and cross-cutting concerns that hand-rolled `net/http` becomes the bigger maintenance bill.
- **Magic versus explicit**: binding tags and `ShouldBind` compress parsing into declarations, which hides control flow a debugger cannot step through. Prefer explicit parsing where the rule is unusual, and tags where the rule is standard.
- **When NOT**: general backend architecture (layering, scaling, data modeling) lives in backend-essentials and backend-at-scale; this course stays on Gin's own API surface and compares against FastAPI only to sharpen the choice.

## Lineage -- where this sits

Go's `net/http` gives you a multiplexer and handlers; Gin layers expressive routing, declarative binding and validation, middleware chains, and content negotiation on top. just-enough-go teaches the syntax walking in; backend-essentials teaches the HTTP vocabulary in Python; this course teaches the Gin framework those two prepare you for.

## How this course is organized

[Beginner](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner) (Examples 1-25) covers routes and handlers, request parsing and validation, then response shaping and status codes. [Intermediate](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate) (Examples 26-53) covers middleware and error handling, dependency injection, and testing without a real network call. [Advanced](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced) (Examples 54-78) surveys concurrency under load, graceful shutdown, and a direct comparison of Gin's design choices against FastAPI's. The [capstone](/en/learn/courses/web-backends-in-go-with-gin/learning/capstone/overview) ships a small order-tracking HTTP service with validation, structured errors, a health check, and an in-process test suite, and [drilling](/en/learn/courses/web-backends-in-go-with-gin/drilling/overview) turns the sixteen concepts into recall, katas, and checklists.

## About the runtime

Every example is a Go module that vendors the same Gin v1.12.0 closure, exercised in-process with `httptest` (no socket, no network); the shutdown cluster binds the loopback interface on an operating-system-chosen ephemeral port and never prints it. Each unit builds with `go build` and runs its binary in the harness against the recorded output under its own `expected/` folder; testing-convention units additionally run `go test` with timing normalized away. No example needs the network, the clock, or random seeds. Every unit carries its own `go.mod`, `go.sum`, and a byte-identical `vendor/` tree so the offline harness builds without a module proxy.

## Examples by Level

### Beginner (Examples 1-25)

- [Example 1: Hello Route Returns JSON](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner#example-1-hello-route-returns-json)
- [Example 2: Path Parameter Names a Resource](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner#example-2-path-parameter-names-a-resource)
- [Example 3: Query String Filters a List](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner#example-3-query-string-filters-a-list)
- [Example 4: Method and Path Pick the Handler](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner#example-4-method-and-path-pick-the-handler)
- [Example 5: Route Groups Share a Prefix](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner#example-5-route-groups-share-a-prefix)
- [Example 6: Custom 404 for Unknown Routes](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner#example-6-custom-404-for-unknown-routes)
- [Example 7: Redirect Moves a Client](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner#example-7-redirect-moves-a-client)
- [Example 8: Handlers Are Small Functions](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner#example-8-handlers-are-small-functions)
- [Example 9: Bind JSON into a Typed Struct](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner#example-9-bind-json-into-a-typed-struct)
- [Example 10: Validation Rejects a Bad Body](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner#example-10-validation-rejects-a-bad-body)
- [Example 11: Custom Validator Names a Rule](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner#example-11-custom-validator-names-a-rule)
- [Example 12: Bind Query Params with Defaults](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner#example-12-bind-query-params-with-defaults)
- [Example 13: Bind URI Segments into a Struct](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner#example-13-bind-uri-segments-into-a-struct)
- [Example 14: Bind Headers into a Struct](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner#example-14-bind-headers-into-a-struct)
- [Example 15: Multipart Form Carries a File](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner#example-15-multipart-form-carries-a-file)
- [Example 16: Content Type Picks the Binder](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner#example-16-content-type-picks-the-binder)
- [Example 17: Query Array Collects Repeats](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner#example-17-query-array-collects-repeats)
- [Example 18: Status Code Says What Happened](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner#example-18-status-code-says-what-happened)
- [Example 19: JSON Keys Follow a Contract](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner#example-19-json-keys-follow-a-contract)
- [Example 20: XML and YAML Renders](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner#example-20-xml-and-yaml-renders)
- [Example 21: Headers Shape Caching](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner#example-21-headers-shape-caching)
- [Example 22: Cookies Carry a Session](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner#example-22-cookies-carry-a-session)
- [Example 23: File Download Names Itself](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner#example-23-file-download-names-itself)
- [Example 24: Error Envelope Stays Consistent](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner#example-24-error-envelope-stays-consistent)
- [Example 25: Health Check Reports Readiness](/en/learn/courses/web-backends-in-go-with-gin/learning/beginner#example-25-health-check-reports-readiness)

### Intermediate (Examples 26-53)

- [Example 26: Middleware Wraps Every Request](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-26-middleware-wraps-every-request)
- [Example 27: Abort Stops the Chain](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-27-abort-stops-the-chain)
- [Example 28: Middleware Order Is Outer to Inner](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-28-middleware-order-is-outer-to-inner)
- [Example 29: Recovery Turns Panics into 500](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-29-recovery-turns-panics-into-500)
- [Example 30: Rate Limit Guards a Route](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-30-rate-limit-guards-a-route)
- [Example 31: CORS Headers Unlock Browsers](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-31-cors-headers-unlock-browsers)
- [Example 32: Timeout Middleware Bounds a Handler](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-32-timeout-middleware-bounds-a-handler)
- [Example 33: Errors Carry Status Codes](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-33-errors-carry-status-codes)
- [Example 34: Problem Details for Clients](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-34-problem-details-for-clients)
- [Example 35: Handler Closure Captures a Store](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-35-handler-closure-captures-a-store)
- [Example 36: Interface Store Swaps Cleanly](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-36-interface-store-swaps-cleanly)
- [Example 37: Services Live on Context](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-37-services-live-on-context)
- [Example 38: Constructor Builds the Router](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-38-constructor-builds-the-router)
- [Example 39: Config Struct Tunes the Server](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-39-config-struct-tunes-the-server)
- [Example 40: Repository Pattern Hides Maps](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-40-repository-pattern-hides-maps)
- [Example 41: In-Memory Store Resets Between Tests](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-41-inmemory-store-resets-between-tests)
- [Example 42: Stub Store Fails on Purpose](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-42-stub-store-fails-on-purpose)
- [Example 43: Request Scoped Values Ride Context](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-43-request-scoped-values-ride-context)
- [Example 44: Graceful Wiring Scales Handlers](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-44-graceful-wiring-scales-handlers)
- [Example 45: First In-Process Test](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-45-first-inprocess-test)
- [Example 46: Table Tests Cover Routes](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-46-table-tests-cover-routes)
- [Example 47: Go Test Checks a Router](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-47-go-test-checks-a-router)
- [Example 48: Test Helpers Build Requests](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-48-test-helpers-build-requests)
- [Example 49: Golden Responses Freeze Contracts](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-49-golden-responses-freeze-contracts)
- [Example 50: Post and Put Round Trip](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-50-post-and-put-round-trip)
- [Example 51: Auth Middleware Tested Alone](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-51-auth-middleware-tested-alone)
- [Example 52: Not Found and Method Not Allowed](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-52-not-found-and-method-not-allowed)
- [Example 53: Measure with a Fixed Workload](/en/learn/courses/web-backends-in-go-with-gin/learning/intermediate#example-53-measure-with-a-fixed-workload)

### Advanced (Examples 54-78)

- [Example 54: Gin Serves Requests Concurrently](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced#example-54-gin-serves-requests-concurrently)
- [Example 55: Mutex Guards Shared State](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced#example-55-mutex-guards-shared-state)
- [Example 56: Channel Fans Work Out](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced#example-56-channel-fans-work-out)
- [Example 57: Context Cancels Slow Work](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced#example-57-context-cancels-slow-work)
- [Example 58: WaitGroup Waits for Fan Out](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced#example-58-waitgroup-waits-for-fan-out)
- [Example 59: Sync Map Counts Safely](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced#example-59-sync-map-counts-safely)
- [Example 60: Streaming Flushes Early Chunks](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced#example-60-streaming-flushes-early-chunks)
- [Example 61: Request Id Ties Logs Together](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced#example-61-request-id-ties-logs-together)
- [Example 62: Server Binds a Loopback Port](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced#example-62-server-binds-a-loopback-port)
- [Example 63: Shutdown Drains In-Flight Requests](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced#example-63-shutdown-drains-inflight-requests)
- [Example 64: Shutdown Has a Deadline](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced#example-64-shutdown-has-a-deadline)
- [Example 65: Signals Trigger Shutdown](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced#example-65-signals-trigger-shutdown)
- [Example 66: Health Gate Blocks Traffic](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced#example-66-health-gate-blocks-traffic)
- [Example 67: Connection Close Is Clean](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced#example-67-connection-close-is-clean)
- [Example 68: Timeouts Bound Slow Clients](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced#example-68-timeouts-bound-slow-clients)
- [Example 69: Pid File Marks the Process](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced#example-69-pid-file-marks-the-process)
- [Example 70: Zero Downtime Is a Handoff](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced#example-70-zero-downtime-is-a-handoff)
- [Example 71: Routing Table vs Decorators](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced#example-71-routing-table-vs-decorators)
- [Example 72: Validation Here vs Pydantic](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced#example-72-validation-here-vs-pydantic)
- [Example 73: Middleware Onion Both Sides](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced#example-73-middleware-onion-both-sides)
- [Example 74: Dependency Injection Styles](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced#example-74-dependency-injection-styles)
- [Example 75: Error Shape Parity](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced#example-75-error-shape-parity)
- [Example 76: OpenAPI from Code or Schema](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced#example-76-openapi-from-code-or-schema)
- [Example 77: Async Here vs Async There](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced#example-77-async-here-vs-async-there)
- [Example 78: Full Service Review](/en/learn/courses/web-backends-in-go-with-gin/learning/advanced#example-78-full-service-review)
