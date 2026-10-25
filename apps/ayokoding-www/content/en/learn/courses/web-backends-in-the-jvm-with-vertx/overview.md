---
title: Overview
date: 2026-10-24T00:00:00+07:00
draft: false
weight: 1
---

Vert.x gives the JVM an event-driven HTTP toolkit without a framework container: routes, middleware, and handlers are plain objects you wire yourself, and the event loop carries every request. This course teaches that toolkit end to end in Java. Across seventy-eight small, independently runnable programs you will define routes and middleware for a small HTTP service, parse and validate request bodies, shape typed JSON responses, run the service's own concurrency model correctly under concurrent load, shut it down without dropping in-flight requests, and test every handler in-process against a loopback port the program itself chooses.

## Why this exists -- the big idea

**The problem before the solution**: `backend-essentials` and `backend-at-scale` teach HTTP backends in Python with FastAPI, where parsing, validation, and dependency injection arrive as framework magic. Nobody teaches the JVM developer Vert.x's own idioms at the same depth: routes registered on a Router, a BodyHandler you add on purpose, handlers that receive a RoutingContext, and Futures you compose instead of awaiting. Copying FastAPI habits into Vert.x produces blocking handlers on an event loop and validation scattered across route functions.

**Keep this if you forget everything else**: A route handler is a pure function from request to response until you deliberately reach for shared state.

## What you will be able to do

After this course you can define routes, handlers, and middleware in Vert.x for a small HTTP service; parse and validate a request body and return a typed, well-formed response; use Vert.x's own concurrency model correctly under concurrent requests; write automated tests against the running service without a real network call; and compare Vert.x's design choices in routing, middleware, and error handling against the FastAPI backend course's choices.

## How this course is organized

[Learning](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/overview) holds seventy-eight worked examples in three levels: Beginner (Examples 1–25) covers routes and handlers, request parsing and validation, and response shaping with status codes; Intermediate (Examples 26–53) covers middleware and error handling, dependency injection without a container, and testing without a real network call; Advanced (Examples 54–78) covers concurrency under load, graceful shutdown, and comparing Vert.x design choices against FastAPI. The [capstone](/en/learn/courses/web-backends-in-the-jvm-with-vertx/learning/capstone/overview) builds a small order-tracking HTTP service with five routes, request validation, structured error responses, a health-check endpoint, and an in-process test suite, and [drilling](/en/learn/courses/web-backends-in-the-jvm-with-vertx/drilling/overview) turns the sixteen concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: [just-enough-java](/en/learn/courses/just-enough-java/learning/overview) for the Java fundamentals every example assumes, and [backend-essentials](/en/learn/courses/backend-essentials/learning/overview) for basic HTTP concepts (methods, status codes, headers) that this course reuses for comparison. Assumed knowledge: comfort reading Java and calling HTTP endpoints. Every example here is written in the JVM using Vert.x, so both primers earn their place from the first page.

## About the examples

Every example is a real Java program executed by the course harness against the pinned Java toolchain with the pinned Vert.x 5.2.1 jars; no example is mocked. Each example ships its own folder with the program, a run specification, and the recorded golden output; the lesson embeds the program byte-identically. Every test exercises the service in-process: the program starts its own server on a loopback port the operating system assigns at bind time (port zero, never a fixed port), drives it with the Vert.x web client from the same process, prints one golden line per request (`METHOD path -> status body`), and shuts down cleanly. Standard output is the asserted transcript: no port numbers, no timings, no thread names, and no framework logging reach it, because ports, clocks, and thread pools differ between runs and the harness executes every unit twice.

## References

- Vert.x Core manual, Vert.x Web documentation, and Vert.x Web Client guide, read and dated at writing time (2026-10-24), for routing, handler, and client API shape.
- The pinned Java toolchain version and the pinned Vert.x 5.2.1 jars are the source of truth for any version-specific syntax.
