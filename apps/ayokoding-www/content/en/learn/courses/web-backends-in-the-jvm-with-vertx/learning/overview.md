---
title: Overview
date: 2026-10-24T00:00:00+07:00
draft: false
weight: 1
---

Prerequisites for this course: [just-enough-java](/en/learn/courses/just-enough-java/learning/overview) for the Java fundamentals every example here assumes you can already read; and [backend-essentials](/en/learn/courses/backend-essentials/learning/overview) for basic HTTP concepts (methods, status codes, headers) that this course reuses for comparison. Assumed knowledge: comfort reading Java and calling HTTP endpoints.

## Why this exists -- the big idea

**The problem before the solution**: `backend-essentials` and `backend-at-scale` teach HTTP backends in Python with FastAPI, where parsing, validation, and dependency injection arrive as framework magic. Nobody teaches the JVM developer Vert.x's own idioms at the same depth: routes registered on a Router, a BodyHandler added on purpose, handlers that receive a RoutingContext, and Futures composed instead of awaited. Copying FastAPI habits into Vert.x produces blocking handlers on an event loop and validation scattered across route functions.

**Keep this if you forget everything else**: A route handler is a pure function from request to response until you deliberately reach for shared state.

## How this course is organized

Beginner (Examples 1–25) defines routes and handlers, parses and validates request bodies, and shapes typed JSON responses with status codes. Intermediate (Examples 26–53) runs middleware and error handling, wires dependencies without a container, and tests every handler in-process without a real network call. Advanced (Examples 54–78) uses Vert.x's own concurrency model correctly under load, shuts down gracefully without dropping in-flight requests, and compares Vert.x's design choices in routing, middleware, and error handling against the FastAPI backend course's choices. Every example runs for real: Java driving Vert.x against its own loopback server on a system-assigned port, with the golden output recorded beside the program.

## The sixteen concepts

- co-01 route-definition: registering a Vert.x route that maps one HTTP method plus one path to one handler.
- co-02 middleware: a handler registered without a path that runs before route handlers in registration order.
- co-03 request-parsing: reading parameters, headers, query values, and bodies off the routing context.
- co-04 response-shaping: rendering a typed body with the headers and status code the contract promises.
- co-05 error-handling: catching throws, fails, and misses in failure handlers that answer the error contract.
- co-06 dependency-injection: handing services, state, and config to route builders as parameters.
- co-07 concurrency-model: serving overlapping requests on event loops with workers and atomics where blocking or sharing demands it.
- co-08 graceful-shutdown: draining in-flight requests, then closing server and runtime in reverse startup order.
- co-09 testing-without-network: driving the loopback server with the web client from the same process.
- co-10 validation: rejecting malformed and out-of-bounds bodies with 422 before logic runs.
- co-11 routing-group: mounting a sub-router under one shared prefix.
- co-12 content-negotiation: answering JSON or text from one route based on the Accept header.
- co-13 structured-logging: emitting one machine-parseable JSON line per request with facts only.
- co-14 health-check-endpoint: answering readiness on a dedicated route that never exercises business logic.
- co-15 static-typing-at-the-boundary: building records and typed getters from bodies at the edge.
- co-16 framework-trade-off: comparing a Vert.x idiom against its FastAPI counterpart and naming what each costs.

## Examples by Level

### Beginner (Examples 1–25)

- [Example 1: Hello Route Returns JSON](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/beginner#example-1-hello-route-returns-json)
- [Example 2: Path Parameter Names a Resource](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/beginner#example-2-path-parameter-names-a-resource)
- [Example 3: Query String Filters a List](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/beginner#example-3-query-string-filters-a-list)
- [Example 4: Method and Path Pick the Handler](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/beginner#example-4-method-and-path-pick-the-handler)
- [Example 5: Route Groups Share a Prefix](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/beginner#example-5-route-groups-share-a-prefix)
- [Example 6: Custom 404 for Unknown Routes](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/beginner#example-6-custom-404-for-unknown-routes)
- [Example 7: Redirect Moves a Client](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/beginner#example-7-redirect-moves-a-client)
- [Example 8: Handlers Are Small Functions](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/beginner#example-8-handlers-are-small-functions)
- [Example 9: Read Query Parameters Typed](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/beginner#example-9-read-query-parameters-typed)
- [Example 10: Read Request Headers](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/beginner#example-10-read-request-headers)
- [Example 11: Parse JSON Body into Typed Values](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/beginner#example-11-parse-json-body-into-typed-values)
- [Example 12: Form Body Carries Fields](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/beginner#example-12-form-body-carries-fields)
- [Example 13: Reject Malformed JSON with 400](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/beginner#example-13-reject-malformed-json-with-400)
- [Example 14: Require Fields Before Logic](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/beginner#example-14-require-fields-before-logic)
- [Example 15: Validate Numbers Inside Bounds](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/beginner#example-15-validate-numbers-inside-bounds)
- [Example 16: Content Type Selects the Parser](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/beginner#example-16-content-type-selects-the-parser)
- [Example 17: Query Defaults Keep Handlers Total](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/beginner#example-17-query-defaults-keep-handlers-total)
- [Example 18: Status Codes Say What Happened](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/beginner#example-18-status-codes-say-what-happened)
- [Example 19: JSON Envelope Shapes Every Reply](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/beginner#example-19-json-envelope-shapes-every-reply)
- [Example 20: Headers Carry Metadata](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/beginner#example-20-headers-carry-metadata)
- [Example 21: Empty Body Means No Content](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/beginner#example-21-empty-body-means-no-content)
- [Example 22: Error Envelope Carries Code and Detail](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/beginner#example-22-error-envelope-carries-code-and-detail)
- [Example 23: Content Negotiation Picks JSON or Text](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/beginner#example-23-content-negotiation-picks-json-or-text)
- [Example 24: Cookies Remember the Client](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/beginner#example-24-cookies-remember-the-client)
- [Example 25: HTML Page Renders for Browsers](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/beginner#example-25-html-page-renders-for-browsers)

### Intermediate (Examples 26–53)

- [Example 26: Middleware Runs Before Handlers](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-26-middleware-runs-before-handlers)
- [Example 27: Middleware Order Is the Contract](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-27-middleware-order-is-the-contract)
- [Example 28: Body Handler Unlocks JSON Parsing](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-28-body-handler-unlocks-json-parsing)
- [Example 29: Auth Middleware Gates Routes](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-29-auth-middleware-gates-routes)
- [Example 30: Error Handler Turns Throws into JSON](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-30-error-handler-turns-throws-into-json)
- [Example 31: Route Failure Handler Is Local](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-31-route-failure-handler-is-local)
- [Example 32: Error Handler by Status Code](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-32-error-handler-by-status-code)
- [Example 33: Request Logger Emits JSON Lines](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-33-request-logger-emits-json-lines)
- [Example 34: CORS Headers Open the API](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-34-cors-headers-open-the-api)
- [Example 35: Constructor Wires a Service](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-35-constructor-wires-a-service)
- [Example 36: Service Holds the State](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-36-service-holds-the-state)
- [Example 37: One Router, Many Services](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-37-one-router-many-services)
- [Example 38: Fake Service Makes Handlers Testable](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-38-fake-service-makes-handlers-testable)
- [Example 39: Config Object Carries Limits](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-39-config-object-carries-limits)
- [Example 40: Repository Hides the Map](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-40-repository-hides-the-map)
- [Example 41: Clock Injection Freezes Time](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-41-clock-injection-freezes-time)
- [Example 42: ID Generator Orders Creations](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-42-id-generator-orders-creations)
- [Example 43: Service Errors Become 404s](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-43-service-errors-become-404s)
- [Example 44: Wiring Lives in One Builder](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-44-wiring-lives-in-one-builder)
- [Example 45: Check Helper Drives One Request](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-45-check-helper-drives-one-request)
- [Example 46: Table-Driven Paths in One Loop](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-46-table-driven-paths-in-one-loop)
- [Example 47: Assert Status Then Body](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-47-assert-status-then-body)
- [Example 48: Test the 404 Too](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-48-test-the-404-too)
- [Example 49: Post Then Get Proves State](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-49-post-then-get-proves-state)
- [Example 50: Validation Cases Share One Table](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-50-validation-cases-share-one-table)
- [Example 51: Headers Asserted Like Bodies](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-51-headers-asserted-like-bodies)
- [Example 52: One Router, Two Passes](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-52-one-router-two-passes)
- [Example 53: Failing Check Prints the Diff](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/intermediate#example-53-failing-check-prints-the-diff)

### Advanced (Examples 54–78)

- [Example 54: Event Loop Never Blocks](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/advanced#example-54-event-loop-never-blocks)
- [Example 55: Execute Blocking Holds Slow Work](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/advanced#example-55-execute-blocking-holds-slow-work)
- [Example 56: Worker Verticle Offloads CPU](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/advanced#example-56-worker-verticle-offloads-cpu)
- [Example 57: Concurrent Posts Keep Every Write](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/advanced#example-57-concurrent-posts-keep-every-write)
- [Example 58: Shared Data Needs the Event Loop](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/advanced#example-58-shared-data-needs-the-event-loop)
- [Example 59: Body Limits Bound the Queue](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/advanced#example-59-body-limits-bound-the-queue)
- [Example 60: Context Data Follows the Request](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/advanced#example-60-context-data-follows-the-request)
- [Example 61: Load Summary Replaces Timings](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/advanced#example-61-load-summary-replaces-timings)
- [Example 62: Close Drains In-Flight First](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/advanced#example-62-close-drains-in-flight-first)
- [Example 63: Health Check Reports Readiness](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/advanced#example-63-health-check-reports-readiness)
- [Example 64: Health Check Fails When Not Ready](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/advanced#example-64-health-check-fails-when-not-ready)
- [Example 65: Startup Order Is Explicit](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/advanced#example-65-startup-order-is-explicit)
- [Example 66: Shutdown Order Is Reverse](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/advanced#example-66-shutdown-order-is-reverse)
- [Example 67: Verticle Start Promises Routes](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/advanced#example-67-verticle-start-promises-routes)
- [Example 68: Undeploy Removes Routes](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/advanced#example-68-undeploy-removes-routes)
- [Example 69: Two Servers Share One Vert.x](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/advanced#example-69-two-servers-share-one-vertx)
- [Example 70: Closing Twice Is Safe](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/advanced#example-70-closing-twice-is-safe)
- [Example 71: Explicit Body Handler vs Automatic Parsing](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/advanced#example-71-explicit-body-handler-vs-automatic-parsing)
- [Example 72: Router Tables vs Decorators](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/advanced#example-72-router-tables-vs-decorators)
- [Example 73: Futures vs Async Await](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/advanced#example-73-futures-vs-async-await)
- [Example 74: JSON Object vs Records](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/advanced#example-74-json-object-vs-records)
- [Example 75: Middleware Chains in Both Worlds](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/advanced#example-75-middleware-chains-in-both-worlds)
- [Example 76: Validation Here vs There](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/advanced#example-76-validation-here-vs-there)
- [Example 77: Test Client vs Web Client](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/advanced#example-77-test-client-vs-web-client)
- [Example 78: Framework Trade-Offs Named](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/advanced#example-78-framework-trade-offs-named)
