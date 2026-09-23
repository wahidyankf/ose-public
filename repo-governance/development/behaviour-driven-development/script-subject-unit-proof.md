---
description: "What Unit proof means when a scenario's production subject is itself a shell script or a harness plugin file run by its host runtime"
when_to_use: "Use when binding or reviewing a Unit adapter whose subject is a shell script or plugin file that the owner's Unit runner cannot load in process."
---

# Script-Subject Unit Proof

This document extends the Test Boundaries of the canonical
[BDD standard](../behaviour-driven-development.md). It defines what Unit means for one kind of
subject. It is not an exemption: Unit proof stays mandatory for every active scenario.

## Script Subject

A **script subject** is a production artifact that runs as its own process-boundary program — a
shell script, or a harness plugin file its host runtime loads — written in a language or for a host
that the owner's Unit runner cannot load in process. The scenario's When must invoke that artifact
itself. Code the Unit runner can load stays under the in-process Unit rule, and a test may never
wrap such code in a script to qualify.

## The Rule

A Unit adapter binding a script subject may execute that artifact directly, together with the
interpreter or host runtime that runs it, as a child process. Every started process must meet all
five conditions:

1. **Every collaborator is faked.** Each program, file, or service the subject calls is a
   test-authored fake reached through the subject's own injection point, such as an environment
   variable naming the executable, an argument, or the search path. No real collaborator is
   reachable: the inherited search path holds only a private directory of fakes and the system
   utilities the subject or its fakes need, never a directory where an installed collaborator could
   resolve.
2. **Nothing real is stored.** `HOME`, every data home the subject can resolve, and the working
   directory lie inside a private owner-only temporary directory the test creates. Setup, subject,
   and fakes write only there; no real store, database, or user data home is opened.
3. **No network.** Neither the subject, its host runtime, nor any fake opens a socket or contacts a
   service.
4. **Time is bounded.** Each started process runs under a test-owned deadline that kills it and
   fails the test.
5. **The assertion observes the subject's own contract** — its exit status, the bytes it writes or
   forwards, the arguments it passes, and the timing and signals it applies — never a
   collaborator's behaviour. A timing assertion keeps every ordering the contract promises and
   states the tolerance it allows.

Under these conditions the subject's own process does not raise the test's classification. A
binding that runs the artifact against a real collaborator, a real store, or a shared home is
Integration or E2E, classified by the strongest boundary it touches.

The owner's cached `test:unit` target lists every script subject it executes among its inputs. The
native line-coverage floor still applies to every source the Unit runner loads.

## Pass and Violation

- **Followed**: every Unit binding that starts a process names a qualifying script subject, meets
  all five conditions, and that subject is a `test:unit` input.
- **Violated**: such a binding resolves or starts a real collaborator, writes outside its private
  directory, reaches a network, runs without a deadline, or asserts a collaborator's behaviour; or a
  Unit test starts a process for a subject its runner can load in process.

**Unenforced by decision:** qualification and fake completeness are semantic judgements. The
[Gherkin implementation review](../../workflows/gherkin-implementation-review.md) applies this
definition to every Unit row whose subject is a script.

**Why**: a shell script or a plugin for another runtime has no in-process seam. Without this
definition its own contract would have no Unit proof, and Unit proof cannot be exempted.
