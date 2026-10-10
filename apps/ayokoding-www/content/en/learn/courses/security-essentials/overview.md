---
title: "Overview"
date: 2026-07-15T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Just Enough Python](../just-enough-python/learning/overview.md) -- every
  script in this topic is fully type-annotated Python, and you should already be comfortable reading
  functions, classes, exceptions, and `list`/`dict` literals the way that primer taught them; [SQL Essentials](../sql-essentials/learning/overview.md) -- this topic assumes you already know what a
  parameterized query looks like and why string-formatting SQL is dangerous, because the SQL-injection
  examples here go one step further and actually exploit the naive version before fixing it; [Backend Essentials](../backend-essentials/learning/overview.md) -- the small HTTP JSON service you
  built there (routes, request parsing, a SQLite-backed repository, sessions/tokens) is exactly the
  shape of application every attack and every fix in this topic targets, and the capstone below hardens
  that same shape of service end to end.
- **Tools & environment**: a macOS/Linux terminal; **Python 3.13.12**; **`curl` 8.7.1+** to send
  malicious/edge requests and inspect response headers; **Flask 3.1.3** (bundling Jinja2 3.1.6, Werkzeug
  3.1.8, MarkupSafe 3.0.3, itsdangerous 2.2.0) as the small self-contained app framework every example
  runs against; stdlib `sqlite3`, `hmac`, `hashlib`, `subprocess`, `os`; **argon2-cffi 25.1.0** and
  **bcrypt 5.0.0** for password hashing; **PyJWT 2.13.0** (pin `>=2.12.0` -- versions up to 2.11.0 carry
  **CVE-2026-32597**, a `crit`-header validation gap fixed in 2.12.0) for tokens; **pydantic 2.13.4** for
  boundary validation; **`pip-audit` 2.10.1** and **`detect-secrets` 1.5.0** (no new PyPI release since
  2024-05-06 -- maintained-but-slow upstream, not abandoned) for dependency/secret scanning;
  **`cyclonedx-bom` 7.3.0** (installs the `cyclonedx-py` CLI) for SBOM generation; **flask-limiter 4.1.1**
  plus **fakeredis 2.36.2** (an in-memory Redis stand-in, so the distributed-rate-limit example needs no
  real Redis server) for throttling; **`git` 2.39.5+** for the secret-scanning pre-commit hook example;
  **cryptography 49.0.0** (the `pyca/cryptography` library) for real RSA key-pair generation and X.509
  certificate/PEM handling in the JWT RS256 and TLS self-signed-certificate examples (ex-39, ex-51), and
  transitively required by Werkzeug's `ssl_context="adhoc"` ad-hoc HTTPS certificate generation (ex-52);
  **`requests` 2.34.2** -- the real HTTP client every `exploit_and_fix.py` / `hammer.py` / attack script
  uses to drive the live Flask server.
  Every package above is pinned to the exact version this topic's examples were authored and run
  against, on 2026-07-15 -- see the [Install and run your first example](./learning/overview.md#install-and-run-your-first-example)
  section for the one-line install command.
- **Assumed knowledge**: reading and writing typed Python functions and classes; issuing HTTP requests
  with `curl` (method, headers, body, `-I` for headers-only); a basic SQL `SELECT`/`INSERT` and what a
  parameterized query placeholder (`?`/`%s`) does instead of string-formatting (topic 10); how an HTTP
  request reaches a handler function and what a request/response cycle looks like (topic 11). No prior
  security background is required -- this topic is where that background starts.

## Why this exists -- the big idea

**The problem before the solution**: the service you just learned to build (topic 11) trusts its
inputs by default -- every query parameter, form field, header, cookie, and JSON body arrives exactly
as an attacker chooses to send it, and code that treats that data as safe is itself the vulnerability.
**The one idea worth keeping if you forget everything else**: validate at the boundary and grant least
privilege -- treat every input as hostile until proven safe, and give every component (a user, a
process, a database account) only the access it actually needs, so a single mistake has a bounded
blast radius instead of an unbounded one.

**Cross-cutting big ideas, taught here and then reused for the rest of this topic**: `layering-and-leaks`
-- a vulnerability is a trust boundary that leaked: SQL injection is the data layer bleeding into the
code layer, XSS is untrusted data bleeding into the rendering layer, SSRF is application logic bleeding
into the network layer the operator never meant to expose. Seeing the leak at its exact layer, rather
than patching the symptom, is what makes a fix actually close the hole instead of just hiding it.
`mechanism-vs-policy` -- authentication is the mechanism (proving who you are: a password check, a
token signature); authorization is the policy laid over it (deciding what that identity may do). Every
authentication bug in this topic (session fixation, a forged JWT) is a broken mechanism; every
authorization bug (IDOR, missing function-level access control) is a broken or missing policy on top of
a mechanism that may be working perfectly.

This topic teaches the **usable slice** of security every developer applies to the software they just
learned to build: the OWASP Top 10:2025-style risk map, safe input handling (injection, XSS, path
traversal), authentication and authorization done right (password hashing, sessions vs. tokens, JWTs,
least privilege), secret hygiene, dependency supply-chain safety, and the cheap, high-leverage defenses
(security headers, CORS, rate limiting) that close most of what is actually exploited in practice.
Threat modeling depth, cryptographic internals, and org-scale controls are out of scope -- they belong
to later, dedicated security topics. Every attack below is demonstrated **live** against a small,
local, self-contained Flask + SQLite app -- run for real, shown succeeding, and then closed with a real
fix that is re-verified to actually block the same attack. Nothing here ever targets a real third-party
system.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 80 runnable, heavily annotated examples across Beginner
  (Examples 1-27: trust boundaries, the OWASP Top 10:2025 risk map, SQL/command injection, path
  traversal, reflected and stored XSS, allow-list input validation, the plaintext-to-argon2id password
  evolution, salting, timing-safe comparison, secure cookies, secrets in env vars, security headers,
  `pip-audit`, safe error messages, and second-order/ORM injection variants), Intermediate (Examples
  28-49: blind SQL injection, argument injection, DOM-based XSS, CSP, mass assignment, IDOR, missing
  function-level authorization, session fixation, session-vs-token trade-offs, every major JWT pitfall,
  CSRF, CORS misconfiguration, open redirect, rate limiting, and security misconfiguration), and
  Advanced (Examples 50-80: TLS verification, HSTS, secret scanning and rotation, dependency pinning and
  typosquat detection, structured security logging and alerting, insecure design vs. implementation
  bugs, threat modeling, SSTI, argon2 parameter tuning, password hash upgrades, token revocation,
  RBAC/ABAC, least-privilege DB accounts, defense in depth, clickjacking, secure file upload, SSRF,
  distributed rate limiting, audit-log integrity, SBOMs, secrets-manager integration, and a full-app
  before/after hardening transcript with a red-to-green regression test suite) -- plus a capstone that
  hardens the Backend-Essentials service end to end.

Every example is a complete, self-contained runnable file colocated under `learning/code/`, actually
executed to capture its documented output -- where an example demonstrates an attack, the attack is run
for real against a local, throwaway Flask + SQLite app first (and shown succeeding) before the fix is
applied and the same attack is re-run and shown failing.

---

Next: [Learning Overview](./learning/overview.md) →
