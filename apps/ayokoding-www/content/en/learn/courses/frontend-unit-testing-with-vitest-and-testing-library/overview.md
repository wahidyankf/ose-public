---
title: "Overview"
date: 2026-10-20T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior courses**: [Just Enough TypeScript](../just-enough-typescript/learning/overview.md) --
  every example is TypeScript; [Frontend Essentials](../frontend-essentials/learning/overview.md) --
  every component example assumes basic React or component-model concepts.
- **Tools**: **Node.js 24** with **Vitest 4.1.0**, **Testing Library 16**, **jsdom 29**, and
  **React 19**. No example performs a real network call.
- **Assumed knowledge**: running a program and a test suite from the CLI. No prior testing
  background is required.

## Why this exists -- the big idea

**The problem before the solution**: `software-testing` and `frontend-essentials` use both tools
incidentally but never teach Vitest's own mocking and coverage model or Testing Library's query
priorities as a dedicated subject. **Keep-this-if-you-forget-everything**: query the way a user
would find the element, not by its implementation detail.

Vitest runs the tests fast; Testing Library keeps them honest about what a user actually sees and
does. It excludes end-to-end browser testing -- that is `playwright-end-to-end-testing`.

## How this course is organized

- **[Learning](./learning/overview.md)** -- 78 runnable, heavily annotated examples across
  Beginner (Examples 1-25: Vitest basics, queries, user-event), Intermediate (Examples 26-53:
  mocking, fake timers, snapshots), and Advanced (Examples 54-78: coverage, custom render,
  flaky-test diagnosis) -- plus a capstone that assembles a tested form, list, and async widget
  into one coverage-gated suite.

Every example is a complete, self-contained runnable file colocated under `learning/code/`,
actually executed to capture its documented output -- there is no fabricated output anywhere in
this course.

---

Next: [Learning Overview](./learning/overview.md) →
