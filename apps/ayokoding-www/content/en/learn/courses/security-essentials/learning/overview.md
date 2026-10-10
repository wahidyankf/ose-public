---
title: "Overview"
date: 2026-07-15T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Just Enough Python](../../just-enough-python/learning/overview.md) -- every
  script in this topic is fully type-annotated Python, and you should already be comfortable reading
  functions, classes, exceptions, and `list`/`dict` literals the way that primer taught them; [SQL Essentials](../../sql-essentials/learning/overview.md) -- this topic assumes you already know what a
  parameterized query looks like and why string-formatting SQL is dangerous, because the SQL-injection
  examples here go one step further and actually exploit the naive version before fixing it; [Backend Essentials](../../backend-essentials/learning/overview.md) -- the small HTTP JSON service you
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
into the network layer the operator never meant to expose. `mechanism-vs-policy` -- authentication is
the mechanism (proving who you are); authorization is the policy laid over it (deciding what that
identity may do). Every authentication bug in this topic (session fixation, a forged JWT) is a broken
mechanism; every authorization bug (IDOR, missing function-level access control) is a broken or missing
policy on top of a mechanism that may be working perfectly.

## Install and run your first example

Confirm the core toolchain this topic's Beginner tier uses is installed:

```text
$ python3 --version
Python 3.13.12
$ curl --version | head -1
curl 8.7.1 (x86_64-apple-darwin24.0) libcurl/8.7.1 ...
$ python3 -c "import sqlite3, hmac, hashlib; print('stdlib security primitives OK')"
stdlib security primitives OK
```

Install the packages every tier needs with one `pip` command (ideally into a virtual environment):

```text
pip install flask==3.1.3 argon2-cffi==25.1.0 "bcrypt==5.0.0" "PyJWT>=2.12.0,==2.13.0" \
  pydantic==2.13.4 pip-audit==2.10.1 detect-secrets==1.5.0 cyclonedx-bom==7.3.0 \
  flask-limiter==4.1.1 fakeredis==2.36.2 requests==2.34.2 cryptography==49.0.0 pytest==9.1.1
```

**A note on versions**: this topic's examples were authored and verified against these exact package
versions, in this sandbox, on 2026-07-15. `PyJWT` is pinned to `>=2.12.0` deliberately -- versions up
to and including 2.11.0 carry CVE-2026-32597 (a `crit`-header validation gap; see ex-38 to ex-40 and
the topic overview's Tools & environment note).

Every example is a complete, self-contained runnable file colocated under `learning/code/`, actually
executed to capture its documented output. Where an example demonstrates an attack, the attack is run
for real against a small, throwaway, local Flask + SQLite app first and shown succeeding, before the
fix is applied and the exact same attack is re-run and shown failing -- never a fabricated transcript
standing in for either half.

## How this topic's examples are organized

- **[Beginner](./beginner.md)** (Examples 1-27) -- trust boundaries and the OWASP Top 10:2025 risk map,
  SQL injection (live exploit through parameterized fix through UNION exfiltration), command injection,
  path traversal, reflected and stored XSS, output encoding by context, allow-list validation, the
  password-storage evolution from plaintext through MD5 to argon2id and bcrypt, salting, timing-safe
  comparison, secure cookie flags, secrets in env vars, security headers, a first `pip-audit` run and
  remediation, safe error messages, and second-order/ORM-fragment SQL injection.
- **[Intermediate](./intermediate.md)** (Examples 28-49) -- blind boolean SQL injection, argument
  injection beyond the shell, DOM-based XSS, CSP blocking inline scripts, mass-assignment privilege
  escalation, IDOR, missing function-level authorization, the authn/authz separation, session fixation,
  session-vs-token trade-offs, every major JWT pitfall (`alg:none`, algorithm confusion, expiry/claims),
  a live CSRF exploit and its `SameSite`/token fixes, CORS misconfiguration and correct preflight
  handling, open redirect, rate limiting and account-lockout trade-offs, constant-time login responses,
  and security-misconfiguration debug mode.
- **[Advanced](./advanced.md)** (Examples 50-80) -- directory listing and default credentials, TLS
  verification, HSTS, secret scanning and rotation, dependency pinning and typosquat detection,
  structured security logging and brute-force alerting, insecure design vs. implementation bugs, threat
  modeling a feature, an end-to-end injection audit, SSTI, argon2 parameter tuning, password-hash
  upgrade-on-login, token revocation, RBAC/ABAC authorization, least-privilege DB accounts, defense in
  depth for XSS, CSRF for JSON/SPA clients, clickjacking, secure file upload, SSRF-safe outbound
  fetches, distributed rate limiting, audit-log integrity, dependency CVE triage, SBOM generation,
  secrets-manager integration, and a full-app before/after hardening transcript with a red-to-green
  security regression test suite.
- **[Capstone](./capstone/overview.md)** -- the Backend-Essentials service hardened end to end: an
  injectable query fixed, argon2/bcrypt-backed auth added, allow-list validation and output encoding
  applied, secrets moved to env vars, security headers added, and a clean `pip-audit` run -- with a
  documented before/after attack transcript.

## The 28 concepts this topic covers

- **co-01 · Trust boundaries -- never trust input** -- every place untrusted data crosses into your
  code (query, form, header, cookie, upstream response) is a boundary where it must be validated; the
  default posture is distrust. Examples 1, 3, 6-8, 12, 61, 72, 78.
- **co-02 · The OWASP Top 10 as a risk map** -- the OWASP Top 10:2025 is a shared risk vocabulary that
  maps a concrete bug to a named category, prioritizing what to defend first. Examples 2, 60, 78-79.
- **co-03 · SQL injection and parameterized queries** -- concatenating untrusted input into SQL lets an
  attacker rewrite the query; bound parameters send data and code separately so input can never become
  SQL. Examples 3-5, 26-28, 61, 67.
- **co-04 · Command injection** -- passing untrusted input to a shell (`os.system`, `shell=True`) lets
  it inject commands; `subprocess.run([...], shell=False)` with an argv list removes the shell.
  Examples 6, 29, 61.
- **co-05 · Path traversal** -- `../` sequences in a filename escape the intended directory;
  canonicalizing (`realpath`) and enforcing a root prefix contains it. Examples 7, 71.
- **co-06 · XSS and output encoding** -- untrusted data rendered into a page executes as script unless
  encoded for its exact output context (HTML body, attribute, JS string, URL). Examples 8-10, 30-31,
  62, 68.
- **co-07 · Allow-list vs. deny-list validation** -- validating against a list of known-good values is
  robust; blocklists of known-bad inputs always miss the case you didn't foresee. Examples 11-12, 29,
  32, 68, 71.
- **co-08 · Mass assignment and over-posting** -- binding a whole request body onto a model
  (`Model(**json)`) lets a client set fields it shouldn't (e.g. `is_admin`); an explicit field
  allow-list stops it. Example 32.
- **co-09 · Password hashing -- argon2id and bcrypt** -- store passwords only as slow, salted one-way
  hashes (argon2id or bcrypt) -- never plaintext, MD5, or SHA-1. Examples 13-16, 63-64.
- **co-10 · Salting and why** -- a unique per-hash salt makes identical passwords hash differently and
  defeats precomputed (rainbow-table) attacks; modern hashers salt automatically. Examples 14, 17, 64.
- **co-11 · Timing-safe comparison** -- comparing secrets with `==` leaks length/prefix via timing;
  `hmac.compare_digest` compares in constant time. Examples 18, 48.
- **co-12 · Session vs. token auth** -- server-side sessions (revocable, stateful) versus stateless
  tokens (scalable, hard to revoke) are a deliberate trade-off, not interchangeable defaults. Examples
  36-37, 65.
- **co-13 · Secure cookie flags** -- `Secure`, `HttpOnly`, and `SameSite` on session cookies stop
  transport leakage, JS theft, and cross-site sending respectively. Examples 19, 42, 68.
- **co-14 · JWT-specific pitfalls** -- JWTs fail open on `alg:none`, algorithm confusion (HS256/RS256),
  and unvalidated `exp`/`aud`/`iss`; pin the algorithm and validate every claim. Examples 37-40, 65.
- **co-15 · Authentication vs. authorization** -- authentication proves _who_ you are; authorization
  decides _what_ you may do -- separate checks, both required. Examples 33-35, 66.
- **co-16 · Least-privilege access control** -- every user, process, and DB account gets only the
  access it needs, so a compromise's blast radius is bounded. Examples 33-34, 66-67.
- **co-17 · Secret hygiene** -- secrets live in the environment or a manager, never in code or git
  history; leaked secrets are rotated, `.env` is gitignored. Examples 20-21, 53-54, 77.
- **co-18 · HTTPS/TLS in practice** -- TLS protects data in transit only when certificates are actually
  verified; disabling verification reopens MITM. Examples 51-52.
- **co-19 · Security headers** -- `Content-Security-Policy`, `Strict-Transport-Security`,
  `X-Content-Type-Options`, and `X-Frame-Options`/`frame-ancestors` are cheap, high-leverage
  browser-enforced defenses. Examples 22, 31, 52, 68, 70.
- **co-20 · CORS configuration** -- CORS relaxes the same-origin policy; reflecting the request Origin
  with credentials lets any site read responses -- allow-list origins instead. Examples 43-44, 69.
- **co-21 · Dependency safety and supply chain** -- third-party code is attack surface; pin exact
  versions, audit with `pip-audit`, watch for typosquats, keep the tree CVE-clean. Examples 23-24, 27,
  53, 55-56, 75-76.
- **co-22 · Security logging and alerting** -- log authn/authz decisions (who, what, outcome -- never
  secrets) and alert on anomalies like brute-force bursts. Examples 25, 57-58, 74, 80.
- **co-23 · Safe error handling** -- error responses reveal nothing internal; the detail goes to a
  server-side log, the client gets a generic message. Examples 25, 79-80.
- **co-24 · Security misconfiguration** -- insecure defaults (debug mode, directory listing, default
  creds, verbose errors) are vulnerabilities; hardening the configuration closes them. Examples 49-50,
  71, 78.
- **co-25 · Insecure design** -- some flaws are in the design, not the code: a correctly-implemented
  flow can still be exploitable -- threat-model the feature. Examples 56, 59-60, 62, 70, 72, 75.
- **co-26 · CSRF protection** -- a state-changing request riding the victim's ambient cookie is
  forgeable cross-site; anti-CSRF tokens and `SameSite` cookies bind the request to your site. Examples
  41-42, 69.
- **co-27 · Rate limiting and brute-force protection** -- throttling and backoff on auth endpoints
  defeat credential-stuffing/brute-force, weighed against lockout-as-DoS. Examples 46-48, 58, 73.
- **co-28 · Open redirect** -- following a user-supplied `next=`/redirect target blindly sends victims
  to attacker sites; validate against an allow-list or accept relative paths only. Example 45.

## Examples by level

### Beginner (Examples 1-27)

- [Example 1: Trust-Boundary Map -- Tainted Input](/en/c/learn/courses/security-essentials/learning/beginner#example-1-trust-boundary-map----tainted-input)
- [Example 2: OWASP Top 10 Mapping Exercise](/en/c/learn/courses/security-essentials/learning/beginner#example-2-owasp-top-10-mapping-exercise)
- [Example 3: SQL Injection -- Live Exploit](/en/c/learn/courses/security-essentials/learning/beginner#example-3-sql-injection----live-exploit)
- [Example 4: SQL Injection -- Parameterized Fix](/en/c/learn/courses/security-essentials/learning/beginner#example-4-sql-injection----parameterized-fix)
- [Example 5: SQL Injection -- UNION Data Exfiltration](/en/c/learn/courses/security-essentials/learning/beginner#example-5-sql-injection----union-data-exfiltration)
- [Example 6: Command Injection -- Live](/en/c/learn/courses/security-essentials/learning/beginner#example-6-command-injection----live)
- [Example 7: Path Traversal -- File Read](/en/c/learn/courses/security-essentials/learning/beginner#example-7-path-traversal----file-read)
- [Example 8: Reflected XSS -- Live](/en/c/learn/courses/security-essentials/learning/beginner#example-8-reflected-xss----live)
- [Example 9: Stored XSS -- Live](/en/c/learn/courses/security-essentials/learning/beginner#example-9-stored-xss----live)
- [Example 10: Output Encoding by Context](/en/c/learn/courses/security-essentials/learning/beginner#example-10-output-encoding-by-context)
- [Example 11: Allow-List vs. Deny-List](/en/c/learn/courses/security-essentials/learning/beginner#example-11-allow-list-vs-deny-list)
- [Example 12: Input Validation at the Boundary](/en/c/learn/courses/security-essentials/learning/beginner#example-12-input-validation-at-the-boundary)
- [Example 13: Plaintext Password Store Is Broken](/en/c/learn/courses/security-essentials/learning/beginner#example-13-plaintext-password-store-is-broken)
- [Example 14: MD5 Password Store Is Broken](/en/c/learn/courses/security-essentials/learning/beginner#example-14-md5-password-store-is-broken)
- [Example 15: argon2id Hash and Verify](/en/c/learn/courses/security-essentials/learning/beginner#example-15-argon2id-hash-and-verify)
- [Example 16: bcrypt Hash and Verify](/en/c/learn/courses/security-essentials/learning/beginner#example-16-bcrypt-hash-and-verify)
- [Example 17: Salt Makes Identical Passwords Differ](/en/c/learn/courses/security-essentials/learning/beginner#example-17-salt-makes-identical-passwords-differ)
- [Example 18: Timing-Safe Token Compare](/en/c/learn/courses/security-essentials/learning/beginner#example-18-timing-safe-token-compare)
- [Example 19: Secure Cookie Flags](/en/c/learn/courses/security-essentials/learning/beginner#example-19-secure-cookie-flags)
- [Example 20: Secret in Env, Not Code](/en/c/learn/courses/security-essentials/learning/beginner#example-20-secret-in-env-not-code)
- [Example 21: .gitignore and .env.example](/en/c/learn/courses/security-essentials/learning/beginner#example-21-gitignore-and-envexample)
- [Example 22: Security Headers Baseline](/en/c/learn/courses/security-essentials/learning/beginner#example-22-security-headers-baseline)
- [Example 23: pip-audit First Run](/en/c/learn/courses/security-essentials/learning/beginner#example-23-pip-audit-first-run)
- [Example 24: Pin and Remediate a CVE](/en/c/learn/courses/security-essentials/learning/beginner#example-24-pin-and-remediate-a-cve)
- [Example 25: Safe Error Message](/en/c/learn/courses/security-essentials/learning/beginner#example-25-safe-error-message)
- [Example 26: Second-Order SQL Injection](/en/c/learn/courses/security-essentials/learning/beginner#example-26-second-order-sql-injection)
- [Example 27: ORM Raw-Fragment Injection](/en/c/learn/courses/security-essentials/learning/beginner#example-27-orm-raw-fragment-injection)

### Intermediate (Examples 28-49)

- [Example 28: Blind Boolean SQL Injection](/en/c/learn/courses/security-essentials/learning/intermediate#example-28-blind-boolean-sql-injection)
- [Example 29: Argument Injection -- Not Just Shell Injection](/en/c/learn/courses/security-essentials/learning/intermediate#example-29-argument-injection----not-just-shell-injection)
- [Example 30: DOM-Based XSS](/en/c/learn/courses/security-essentials/learning/intermediate#example-30-dom-based-xss)
- [Example 31: CSP Blocks an Inline Script Without a Nonce](/en/c/learn/courses/security-essentials/learning/intermediate#example-31-csp-blocks-an-inline-script-without-a-nonce)
- [Example 32: Mass Assignment Privilege Escalation](/en/c/learn/courses/security-essentials/learning/intermediate#example-32-mass-assignment-privilege-escalation)
- [Example 33: IDOR -- Broken Object-Level Access Control](/en/c/learn/courses/security-essentials/learning/intermediate#example-33-idor----broken-object-level-access-control)
- [Example 34: Missing Function-Level Authorization](/en/c/learn/courses/security-essentials/learning/intermediate#example-34-missing-function-level-authorization)
- [Example 35: Authentication vs. Authorization -- Kept as Two Separate Checks](/en/c/learn/courses/security-essentials/learning/intermediate#example-35-authentication-vs-authorization----kept-as-two-separate-checks)
- [Example 36: Session Fixation](/en/c/learn/courses/security-essentials/learning/intermediate#example-36-session-fixation)
- [Example 37: Session vs. Token -- the Revocation/Scale Tradeoff](/en/c/learn/courses/security-essentials/learning/intermediate#example-37-session-vs-token----the-revocationscale-tradeoff)
- [Example 38: JWT `alg:none` Attack](/en/c/learn/courses/security-essentials/learning/intermediate#example-38-jwt-algnone-attack)
- [Example 39: JWT HS256/RS256 Algorithm Confusion](/en/c/learn/courses/security-essentials/learning/intermediate#example-39-jwt-hs256rs256-algorithm-confusion)
- [Example 40: JWT Expiry and Claims Validation](/en/c/learn/courses/security-essentials/learning/intermediate#example-40-jwt-expiry-and-claims-validation)
- [Example 41: CSRF Live Exploit](/en/c/learn/courses/security-essentials/learning/intermediate#example-41-csrf-live-exploit)
- [Example 42: SameSite Cookie Mitigates CSRF](/en/c/learn/courses/security-essentials/learning/intermediate#example-42-samesite-cookie-mitigates-csrf)
- [Example 43: CORS Misconfiguration Reflects Origin](/en/c/learn/courses/security-essentials/learning/intermediate#example-43-cors-misconfiguration-reflects-origin)
- [Example 44: CORS Preflight Correctness](/en/c/learn/courses/security-essentials/learning/intermediate#example-44-cors-preflight-correctness)
- [Example 45: Open Redirect](/en/c/learn/courses/security-essentials/learning/intermediate#example-45-open-redirect)
- [Example 46: Rate Limiting Login](/en/c/learn/courses/security-essentials/learning/intermediate#example-46-rate-limiting-login)
- [Example 47: Account Lockout vs. Throttle](/en/c/learn/courses/security-essentials/learning/intermediate#example-47-account-lockout-vs-throttle)
- [Example 48: Constant-Time Login Response](/en/c/learn/courses/security-essentials/learning/intermediate#example-48-constant-time-login-response)
- [Example 49: Security Misconfiguration -- Debug Mode](/en/c/learn/courses/security-essentials/learning/intermediate#example-49-security-misconfiguration----debug-mode)

### Advanced (Examples 50-80)

- [Example 50: Directory Listing and Default Credentials](/en/c/learn/courses/security-essentials/learning/advanced#example-50-directory-listing-and-default-credentials)
- [Example 51: TLS Verification Must Not Be Disabled](/en/c/learn/courses/security-essentials/learning/advanced#example-51-tls-verification-must-not-be-disabled)
- [Example 52: HSTS and the HTTP → HTTPS Redirect](/en/c/learn/courses/security-essentials/learning/advanced#example-52-hsts-and-the-http--https-redirect)
- [Example 53: Secret Scanning as a Pre-Commit Hook](/en/c/learn/courses/security-essentials/learning/advanced#example-53-secret-scanning-as-a-pre-commit-hook)
- [Example 54: A Secret Rotation Drill](/en/c/learn/courses/security-essentials/learning/advanced#example-54-a-secret-rotation-drill)
- [Example 55: Dependency Pinning and a Reproducible Lockfile](/en/c/learn/courses/security-essentials/learning/advanced#example-55-dependency-pinning-and-a-reproducible-lockfile)
- [Example 56: Detecting a Supply-Chain Typosquat](/en/c/learn/courses/security-essentials/learning/advanced#example-56-detecting-a-supply-chain-typosquat)
- [Example 57: Structured Security Logging](/en/c/learn/courses/security-essentials/learning/advanced#example-57-structured-security-logging)
- [Example 58: Alerting on a Brute-Force Pattern](/en/c/learn/courses/security-essentials/learning/advanced#example-58-alerting-on-a-brute-force-pattern)
- [Example 59: Insecure Design vs. a Bug](/en/c/learn/courses/security-essentials/learning/advanced#example-59-insecure-design-vs-a-bug)
- [Example 60: Threat-Modeling a Feature with STRIDE](/en/c/learn/courses/security-essentials/learning/advanced#example-60-threat-modeling-a-feature-with-stride)
- [Example 61: An End-to-End Injection Audit](/en/c/learn/courses/security-essentials/learning/advanced#example-61-an-end-to-end-injection-audit)
- [Example 62: Server-Side Template Injection (SSTI)](/en/c/learn/courses/security-essentials/learning/advanced#example-62-server-side-template-injection-ssti)
- [Example 63: Tuning Argon2 Parameters for This Machine](/en/c/learn/courses/security-essentials/learning/advanced#example-63-tuning-argon2-parameters-for-this-machine)
- [Example 64: Upgrading a Password Hash on Login](/en/c/learn/courses/security-essentials/learning/advanced#example-64-upgrading-a-password-hash-on-login)
- [Example 65: A Token Revocation Strategy](/en/c/learn/courses/security-essentials/learning/advanced#example-65-a-token-revocation-strategy)
- [Example 66: RBAC vs. ABAC Authorization](/en/c/learn/courses/security-essentials/learning/advanced#example-66-rbac-vs-abac-authorization)
- [Example 67: A Least-Privilege Database Account](/en/c/learn/courses/security-essentials/learning/advanced#example-67-a-least-privilege-database-account)
- [Example 68: Defense in Depth Against XSS](/en/c/learn/courses/security-essentials/learning/advanced#example-68-defense-in-depth-against-xss)
- [Example 69: CSRF Protection for JSON APIs and SPAs](/en/c/learn/courses/security-essentials/learning/advanced#example-69-csrf-protection-for-json-apis-and-spas)
- [Example 70: Clickjacking and Frame Protection](/en/c/learn/courses/security-essentials/learning/advanced#example-70-clickjacking-and-frame-protection)
- [Example 71: Secure File Upload](/en/c/learn/courses/security-essentials/learning/advanced#example-71-secure-file-upload)
- [Example 72: An SSRF-Safe Outbound Fetch](/en/c/learn/courses/security-essentials/learning/advanced#example-72-an-ssrf-safe-outbound-fetch)
- [Example 73: Distributed Rate Limiting](/en/c/learn/courses/security-essentials/learning/advanced#example-73-distributed-rate-limiting)
- [Example 74: Audit Log Integrity via Hash Chaining](/en/c/learn/courses/security-essentials/learning/advanced#example-74-audit-log-integrity-via-hash-chaining)
- [Example 75: A Dependency CVE Triage Workflow](/en/c/learn/courses/security-essentials/learning/advanced#example-75-a-dependency-cve-triage-workflow)
- [Example 76: Generating an SBOM and Cross-Checking It](/en/c/learn/courses/security-essentials/learning/advanced#example-76-generating-an-sbom-and-cross-checking-it)
- [Example 77: Runtime Secrets-Manager Integration and Rotation](/en/c/learn/courses/security-essentials/learning/advanced#example-77-runtime-secrets-manager-integration-and-rotation)
- [Example 78: Hardening the Full App -- a Before/After Transcript](/en/c/learn/courses/security-essentials/learning/advanced#example-78-hardening-the-full-app----a-beforeafter-transcript)
- [Example 79: A Security Regression Test Suite (Red/Green)](/en/c/learn/courses/security-essentials/learning/advanced#example-79-a-security-regression-test-suite-redgreen)
- [Example 80: A Safe Error and Logging Review Under Fuzzing](/en/c/learn/courses/security-essentials/learning/advanced#example-80-a-safe-error-and-logging-review-under-fuzzing)

---

← Previous: [Overview](../overview.md) · Next: [Beginner Examples](./beginner.md) →
