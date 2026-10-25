---
title: "Web Backends in Clojure with Pedestal"
date: 2026-10-24T00:00:00+07:00
draft: false
weight: 1
---

Pedestal treats HTTP as data: routes are sets, interceptors are records, and
requests are maps. This By Example course builds backend instincts in
Clojure through seventy-eight annotated programs, from first routes to
graceful shutdowns, every one runnable with a recorded transcript.

## What This Course Covers

Routing and handlers map verbs and paths to functions; request parsing turns
query strings, forms, and EDN bodies into data; validation answers 400 and
422 with reasons; responses name formats and carry metadata in headers.
Interceptors bracket handlers for auth, logging, CORS, and hardening; errors
become shaped envelopes through `:error` stages. Dependency injection rides
the request map: stores, config, clocks, and clients arrive as keys. Tests
drive the connector with `response-for` and no socket. Real Jetty servers on
ephemeral loopback ports carry concurrent load, drain, stop, and restart.
The closing cluster compares each choice against FastAPI so the trade-offs
stay explicit.

## How This Course Is Organized

Beginner examples (Examples 1–25) teach routing, requests, and responses.
Intermediate examples (Examples 26–53) teach middleware, injection, and
testing. Advanced examples (Examples 54–78) teach concurrency, shutdown, and
framework comparison. A capstone order-tracking service combines the whole
path, and eight drilling katas turn each core move into practice. See the
[Learning Overview](/en/learn/courses/web-backends-in-clojure-with-pedestal/learning/overview)
for the reading order and runtime notes.

## References

- [Pedestal Guides](https://pedestal.io/guides): routing, interceptors, and testing references.
- [Pedestal API Docs](https://pedestal.io/api): connector, test, route, and Jetty namespaces.
- [Clojure EDN Format](https://github.com/edn-format/edn): the data notation examples read and write.
- [Ring Spec](https://github.com/ring-clojure/ring/blob/master/SPEC.md): the request and response maps underneath.
