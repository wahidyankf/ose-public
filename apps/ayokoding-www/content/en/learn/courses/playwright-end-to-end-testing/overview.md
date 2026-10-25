---
title: "Overview"
date: 2026-10-20T00:00:00+07:00
draft: false
weight: 1
---

Playwright drives a real browser through your app the way a user would: open a page, find a
button, fill a form, and assert what a user would see. This course teaches that tool as its own
subject, from a first script against a local page to a sharded, traced, CI-ready suite.

## Why this exists -- the big idea

**The problem before the solution**: `software-testing` teaches testing strategy broadly and
mentions Playwright only in passing; no course teaches Playwright's own API, waiting model, and
failure modes in depth. Engineers copy `page.waitForTimeout(2000)` from strangers, and their
suites turn flaky exactly when they start trusting them. **Keep this if you forget everything
else**: wait for a condition, never for a fixed time.

## What you will be able to do

After this course you can write Playwright tests that select elements robustly and wait for real
conditions instead of fixed delays; keep a growing suite maintainable with fixtures, page objects,
and hooks; intercept and mock network requests so a page can be tested without its real backend;
run visual and accessibility checks inside a Playwright suite; and run that suite in CI with
traces, videos, and retries configured for debugging, not for hiding flakiness.

## How this course is organized

[Learning](/en/learn/courses/playwright-end-to-end-testing/learning/overview) holds 78 worked
examples in three levels: Beginner (Examples 1-25) covers locators, waiting, and fixtures;
Intermediate (Examples 26-53) covers network interception, page objects, and authentication state;
Advanced (Examples 54-78) covers visual and accessibility checks, tracing and flakiness
diagnosis, and CI sharding and reporting. The
[capstone](/en/learn/courses/playwright-end-to-end-testing/learning/capstone/overview) runs one
realistic suite against a local fixture app end to end, and
[drilling](/en/learn/courses/playwright-end-to-end-testing/drilling/overview) turns the sixteen
concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: just-enough-typescript, because every example is TypeScript driving the Playwright
Node API; software-testing, for the shared testing vocabulary this course builds on. Assumed
knowledge: basic DOM and HTTP ideas from frontend-essentials.

## How the runnable examples work

Every example is a small, self-contained TypeScript program under `learning/code/ex-NN-*/` with
its own `run.yaml`. Each one serves its committed fixture page on a loopback-only address
(`127.0.0.1`, an ephemeral port the output never prints), drives it through a deterministic
model of the Playwright API, and prints a short transcript the harness checks byte for byte. No
example opens a real external site, downloads anything, or needs anything beyond the pinned
Node.js toolchain: the network stays off by construction.

A deliberate simplification, stated once and true everywhere: the harness has no real browser, so
the runnable scripts model Playwright's behavior (locator resolution, auto-waiting, route
interception, traces) instead of launching Chromium. Each example's prose names the exact real
Playwright call it stands in for, verified against Playwright 1.60.0's own documentation
(accessed 2026-10-20; see `## References` in the learning overview). The behavior described is
the real behavior; only the execution is modeled. When you sit in front of a machine with
browsers installed, paste the named call into a real spec and it does what the model shows.
