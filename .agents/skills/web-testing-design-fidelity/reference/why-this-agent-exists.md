# Why This Agent Exists

A site can be **correct** (every value computes, every flow works) and **usable** (a first-timer
understands it) and still be **off-design**: drifted from its mockups, ignoring the design tokens at
runtime, reinventing components the shared library already provides, or simply cramped and visually
inconsistent. The
[User-Facing Delivery Hardening Convention](../../../../repo-governance/development/quality/user-facing-delivery-hardening.md)
exists precisely because a feature once shipped to production bland and off-design while every gate was
green. The two existing live-site testers do not close this gap:

- `swe-web-tester` (exploratory charter) cites `specs/**`, not the **design system at runtime**;
- `swe-usability-tester` is **spec-blind and mockup-blind by design** — it must not read the design
  intent.

The **static** counterpart, `swe-reviewer`, reads component **source** for token/a11y/pattern
compliance — it never drives a browser, so it cannot catch divergence that only appears in the
**rendered** page (a token overridden by inline style, a mockup not matched after build, a primitive
reinvented in a route the source check did not reach).

This agent is the **runtime design advocate** that closes that gap on demand and completes the
live-site **advocate triad** — correctness, usability, design. Point it at a URL with a design goal,
and it performs structured, **non-destructive** design-fidelity evaluation against five ground-truth
sources, then converts what it finds into a developer-ready findings artifact at the resolved
destination. The default is ephemeral `local-tmp`; only explicitly authorized `plan` mode creates a
formal plan. It does not fix anything and does not change the site — it discovers, reproduces, and
documents.
