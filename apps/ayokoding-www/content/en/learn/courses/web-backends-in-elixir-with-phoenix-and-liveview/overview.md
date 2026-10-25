---
title: "Overview"
date: 2026-10-24T00:00:00+07:00
draft: false
weight: 1
---

Phoenix handles the request; LiveView keeps a live process per connected user. Across seventy-eight small, independently runnable programs you will learn both as one coherent way to build a web app in Elixir: routing requests through controllers and plugs, validating every input with changesets, mounting LiveViews that render their first HTML, handling events with diffed updates, talking over channels and PubSub, tracking presence, supervising live state, handling forms end to end, and testing it all without a browser.

## Why this exists -- the big idea

**The problem before the solution**: No course teaches Phoenix or LiveView; `backend-essentials` is Python and FastAPI specific, and `actor-model-concurrency` teaches OTP generically without the web-framework layer on top of it.

**Keep this if you forget everything else**: A LiveView is a supervised process with state, not a page that re-renders from scratch.

## What you will be able to do

After this course you can define Phoenix routes, controllers, and plugs for a conventional HTTP request; build a LiveView that holds state in its process and re-renders only the changed part of the page; handle real-time events with Phoenix channels and PubSub; validate input with Ecto changesets at the web boundary; and test Phoenix controllers and LiveViews without a real browser.

## How this course is organized

[Learning](/en/learn/courses/web-backends-in-elixir-with-phoenix-and-liveview/learning/overview) holds seventy-eight worked examples in three levels: Beginner (Examples 1–25) routes, validates, and mounts; Intermediate (Examples 26–53) updates live, broadcasts, and tracks presence; Advanced (Examples 54–78) supervises state, handles forms, and tests without a browser. The [capstone](/en/learn/courses/web-backends-in-elixir-with-phoenix-and-liveview/learning/capstone/overview) builds a live order-tracking dashboard with a JSON API, a PubSub-driven board, and an in-process suite, and [drilling](/en/learn/courses/web-backends-in-elixir-with-phoenix-and-liveview/drilling/overview) turns the sixteen concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: [just-enough-elixir](/en/learn/courses/just-enough-elixir/learning/overview) for basic syntax, functions, and modules, [actor-model-concurrency](/en/learn/courses/actor-model-concurrency/learning/overview) for processes and supervisors, and [backend-essentials](/en/learn/courses/backend-essentials/learning/overview) for shared HTTP vocabulary. Assumed knowledge: basic OTP concepts (process, supervisor). Every example is Elixir using Phoenix and LiveView, so the primers earn their place from the first page.

## About the examples

Every example is a real Elixir program executed by the course harness in the pinned container — never a mock, never a browser. Controllers answer through test connections, LiveViews mount and handle events by direct callback, and channels, PubSub, and Presence run inside the script's own supervision tree. Programs print labels, counts, and rendered values — never timings, paths, or process names — so reruns match byte for byte.

## References

- Phoenix documentation (routing, controllers, channels, presence). Accessed 2026-10-24. [Phoenix docs](https://hexdocs.pm/phoenix/)
- Phoenix LiveView documentation (mount, render, events, streams). Accessed 2026-10-24. [LiveView docs](https://hexdocs.pm/phoenix_live_view/)
- Ecto documentation (schemas, changesets). Accessed 2026-10-24. [Ecto docs](https://hexdocs.pm/ecto/)
- The pinned Elixir, Phoenix, and LiveView toolchain versions in `apps/ayokoding-cli` are the source of truth for any version-specific behavior.
