---
title: "Overview"
date: 2026-10-24T00:00:00+07:00
draft: false
weight: 1
---

This course teaches backend web development in Clojure through Pedestal 0.8,
the data-first HTTP library where routes are values and cross-cutting
behaviour rides interceptors. Seventy-eight heavily annotated examples carry
the course: twenty-five beginner programs cover routing, requests, and
responses; twenty-eight intermediate programs add middleware, dependency
injection, and in-process testing; twenty-five advanced programs run
concurrent loopback servers, shut them down gracefully, and compare every
idiom against FastAPI. A capstone order-tracking service and eight drilling
katas close the loop between reading and doing.

## What You Build

Every example is a runnable program with a recorded transcript: the code in
`learning/code/ex-NN-<slug>/main.clj` runs under the course harness and its
standard output is the asserted golden file. Beginner examples greet users,
parse query strings and EDN bodies, validate fields, and shape status codes.
Intermediate examples bracket handlers with interceptors, inject stores and
clocks through the request, and test everything with `response-for` and no
socket. Advanced examples serve concurrent Jetty traffic on ephemeral
loopback ports, drain and restart cleanly, and hold each Pedestal choice up
against its FastAPI counterpart.

## How This Course Is Organized

Beginner examples (Examples 1–25) build the vocabulary: routes and handlers,
request parsing and validation, response shaping and status codes. Read them
in order the first time; each cluster assumes the previous one.
Intermediate examples (Examples 26–53) add the machinery around handlers:
middleware and error handling, dependency injection, testing without a real
network call. They stay in-process throughout, so the suite stays fast.
Advanced examples (Examples 54–78) run real servers: concurrency under load,
graceful shutdown, and FastAPI comparisons. The capstone then combines
routing, validation, error envelopes, and health checks into one order
service with its own in-process suite, and the drilling katas turn each
cluster's core move into a before/after exercise.

## How to Read the Examples

Each example opens with a one-paragraph framing and its concept references,
then a mermaid diagram where the relationships need a picture, then the full
program, its recorded output, a key takeaway, and a why-it-matters note.
Comments in the code (`;; =>`) annotate nearly every line; read them as the
primary text and the prose as the map. Run any unit yourself with the harness
`run --unit` command and compare your output byte-for-byte with the golden
file: matching transcripts mean matching understanding.

## About the Runtime

The runtime under test is Pedestal 0.8.2 with Jetty 12, resolved from Maven
Central and Clojars and hash-locked in `learning/code/jars.lock`. Every
example runs as `clojure main.clj` with logging silenced to error level and
deprecation warnings suppressed, so transcripts hold only program output.
Beginner and intermediate units never open a socket: `response-for` drives
the full interceptor chain in-process. Advanced concurrency and shutdown
units bind an OS-chosen ephemeral loopback port through `ServerSocket(0)`
and drive it with the Java HTTP client; no example uses a fixed port and no
request leaves the machine.

## References

- [Pedestal Guides](https://pedestal.io/guides): routing, interceptors, and testing references.
- [Pedestal API Docs](https://pedestal.io/api): connector, test, route, and Jetty namespaces.
- [Clojure EDN Format](https://github.com/edn-format/edn): the data notation examples read and write.
- [Ring Spec](https://github.com/ring-clojure/ring/blob/master/SPEC.md): the request and response maps underneath.
