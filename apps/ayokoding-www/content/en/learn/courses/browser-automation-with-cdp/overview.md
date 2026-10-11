---
title: "Overview"
date: 2026-08-14T00:00:00+07:00
draft: false
weight: 1
---

Chrome DevTools Protocol (CDP) is Chrome's JSON command-and-event interface. This course teaches the
protocol boundary beneath browser wrappers: targets, sessions, commands, events, navigation, DOM work,
network observation, safe request handling, and bounded concurrency.

## Prerequisites

- [Just Enough Python](../just-enough-python/learning/overview.md): functions, dictionaries,
  type annotations, and `asyncio` basics.
- [Networking Essentials](../networking-essentials/learning/overview.md): HTTP, WebSockets, and
  request/response terminology.

Use Python 3.13+ for the runnable simulations. A local Chrome or Chromium with a remote-debugging port
is optional for adapting a simulation into a real experiment; none of the lessons sends traffic to a
third-party website, collects credentials, or needs a package dependency. `remotebrowser` is mentioned
only as an illustrative browser-fleet shape, never as a dependency.

## Safety and ethical boundary

Use browser automation only on pages and accounts you are authorized to control. Prefer an official API
when one exists; honor terms, `robots.txt`, authentication boundaries, and rate limits. The local
simulations intentionally model CDP messages instead of driving a real browser so a reader can inspect
the concurrency and protocol rules safely and deterministically.

## Learning route

- [Beginner](./learning/beginner.md) establishes the command/event wire model and the common page
  actions.
- [Intermediate](./learning/intermediate.md) makes readiness, interception, storage, retries, and
  multi-target work explicit.
- [Advanced](./learning/advanced.md) applies bounded pools, observability, recovery, and service
  boundaries.
- [Capstone](./learning/capstone/overview.md) assembles a local, simulated browser-automation service.
- [Drilling](./drilling/overview.md) supplies recall, applied decisions, repair prompts, and reflection.
