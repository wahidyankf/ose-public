---
description: "The full machine-readable parameter contract for target-urls, testing-goal, plan-mode, plan-identifier, target-plan-path, breakpoints, and locales."
when_to_use: "Use when you need the exact type/required/default contract for one of these seven inputs, rather than the prose summary in Inputs at a Glance."
---

# Inputs Reference — Part 1

This child holds the full parameter contract for the workflow's first seven inputs (the
remaining `mode`, `max-concurrency`, `push-target` inputs plus all outputs are in
[Inputs Reference — Part 2](./inputs-reference-part-2-and-outputs.md)). See
[Inputs at a Glance and Grilling](./inputs-at-a-glance-and-grilling.md) for the readable
quick-reference table covering every input.

## Inputs

- **`target-urls`** (string, required) — One or more live URLs to test (comma-separated). The same set is handed to all three testers so the exploratory, usability, and design passes judge identical surfaces. The running dev/preview server must already be reachable (HTTP 200) before the workflow starts.
- **`testing-goal`** (string, required) — The shared charter/goal forwarded verbatim to all three testers (e.g. "thoroughly test the cost-of-living calculator tool page"). Each tester interprets it through its own lens — exploratory hunts correctness/spec defects, usability judges first-time-user friction, design judges live mockup/token/design-system fidelity and design practice.
- **`plan-mode`** (enum: new, merge, optional, default `new`) — Whether to create a brand-new plan (default) or merge the combined findings into an existing plan folder. "merge" requires target-plan-path.
- **`plan-identifier`** (string, optional) — Slug for the new plan folder under plans/in-progress/ (no date prefix per Plans convention). Default is derived from the target (e.g. "<app>-<feature>-test-fixing"). Ignored when plan-mode=merge.
- **`target-plan-path`** (string, optional) — When plan-mode=merge, the existing plan folder under plans/in-progress/ to merge the combined findings into. Required when plan-mode=merge; ignored otherwise.
- **`breakpoints`** (string, optional) — Optional comma-separated viewport widths (px) to exercise responsive behaviour. Forwarded to all three testers. Default is the testers' own standard set (e.g. 320, 375, 768, 1024, 1280, 1440).
- **`locales`** (string, optional) — Optional comma-separated locale path segments to cover (e.g. "en, id"). Forwarded to all three testers. Default and minimum is ALL locales the target supports (discovered from the app's i18n config or the locale-prefixed routes) — not just the default locale. Testing only one locale on a multi-locale app is incomplete.
