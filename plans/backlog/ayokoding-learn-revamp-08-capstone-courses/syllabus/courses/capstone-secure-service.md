# Capstone · Secure Service (Capstone, Annotated-Concept)

**Course ID**: `capstone-secure-service` · **Format**: Capstone (`format: capstone`); teaching mode:
Annotated-Concept, standard sub-mode.

**Scope note**: Takes one small Python HTTP service, "Pocket Ledger", through the whole security loop:
inventory and threat-model it, reproduce six planted weaknesses, fix them, prove each fix with a
negative test, and detect each attempted abuse in logs. It integrates the security, backend, and
offensive and defensive courses and adds no new attack technique. It excludes live penetration
testing, network scanning, and anything that touches a system you do not own.

**Short summary**: You start from a service that has six known weaknesses, written as failing
tests. You fix identity, access, input, errors, and configuration; you add security events and
detections; and you finish with a posture record that links every weakness to a fix, a failed attack,
and a detection.

## Why this exists · the big idea

- **The problem before the solution**: security courses teach attacks and defences separately.
  Teams fail at the join: a fix with no test that proves it, a test with no regression, an attack
  that leaves no trace. The loop is the skill, not any single technique.
- **Keep-this-if-you-forget-everything**: for every weakness keep four things: the mitigation, a test
  that tried the abuse and failed, the log line the attempt leaves, and the detection that notices it.
  Authentication proves who you are; authorization decides what you may touch, and both need tests.

## Safety boundary (non-negotiable)

- The service is **self-owned and in-process**: tests call the WSGI application as a function, and no
  example opens a socket, starts a server, or contacts another machine. The harness runs the unit with
  networking off.
- Validation uses only harmless, well-known test strings and requests against that in-process service
  (for example an apostrophe in a search box). No payload lists, no credential lists, no scanning, and
  no bypass of a real product's protection appear anywhere.
- Logs used for detection are synthetic. The only credential in the course is a planted fake secret,
  used to prove that secrets stay out of source and logs.
- A reviewer checks every page and code file against this section before the course passes the
  Content Quality Gate ([tech-docs/004](../../tech-docs/004-code-harness-and-determinism-design.md#safety-checks-for-security-courses)).

## Learning objectives

- Inventory endpoints, data classes, and trust boundaries, and write abuse cases mapped to the OWASP
  Top 10:2025 categories.
- Reproduce each weakness as a failing test before changing code.
- Fix authentication (hashing, throttling, signed expiring tokens) and authorization (object-level and
  function-level checks, tenant isolation, mass-assignment guards), and test both.
- Fix injection, output, and error handling, so failures are closed, short, and traceable.
- Validate configuration at start, keep secrets out of source and logs, and check that dependencies are
  pinned.
- Emit security events, write detections (mapped to ATT&CK where a technique fits), test them on
  labelled synthetic logs, and publish a posture record.

## Prerequisites

- **Prior courses (`prerequisites` after the rubric re-run)**: `just-enough-python`,
  `security-essentials`, `backend-at-scale`, `it-and-application-security`, `offensive-security`,
  `defensive-security`.
- **Edge changes against plan 02's graph**: add `just-enough-python` (rule L1: Python is the only
  code medium). Every other edge is kept because the written course uses it: identity and access
  basics from `security-essentials`, service patterns from `backend-at-scale`, the OWASP loop from
  `it-and-application-security`, abuse cases from `offensive-security`, and detections from
  `defensive-security`. SQL is reached through `backend-at-scale`. No edge is removed.
- **Assumed knowledge**: reading Python and SQL; what an HTTP request, a session, and a role are;
  the OWASP Top 10 as a list.
- **Not required**: a running server, a browser, a proxy tool, a cloud account, or a network.
- **Later-rewrite note**: `defensive-security` is a templated filler course today, and plan 09 rewrites
  it after this plan merges. This course follows the course-level coupling rule: it links to that
  course by its course URL only, restates each detection concept it uses, and imports nothing from that
  course's code ([tech-docs/003](../../tech-docs/003-prerequisites-readiness-and-ordering.md#course-level-coupling)).

## Mode and targets

- **Mode**: Annotated-Concept, standard sub-mode. **Reason**: each worked example takes one weakness
  or control and gives one verifiable claim (a forged token is rejected, a foreign invoice is not
  returned, an error body has no path in it). That is the mode's shape. By Example would re-teach
  Python and SQL; In the Field has no cross-example project.
- **Worked examples**: floor 45, band 45–60, five themes of nine. All 45 carry runnable Python.
- **Words**: at least 23,000. **Diagrams**: at least one per theme (a trust-boundary diagram, the
  token life cycle, an access-decision flow, an error path, and the weakness-to-detection loop among
  them).
- **Layout**: standard; theme pages `learning/theme-a-inventory-and-threat-model.md` to
  `learning/theme-e-configuration-detection-and-posture.md`.
- **Metadata**: `category: security`; `format: capstone`; `description` kept from plan 03 ("Take an
  HTTP service through a full security review, fix, and detection loop."); `estimatedHours` from the
  drift test (expected 6–10); no `status`.

## Project brief

**You own Pocket Ledger**, a small invoicing API for freelancers: sign in, create and read your own
invoices, search them, and (for admins) list users. The starting code works but has six planted
weaknesses, each already written as a failing test in `before/`:

| ID  | Weakness                                                   | OWASP Top 10:2025 category                 |
| --- | ---------------------------------------------------------- | ------------------------------------------ |
| W1  | Any signed-in user can read any invoice by changing the ID | A01 Broken Access Control                  |
| W2  | The search box builds its SQL by joining strings           | A05 Injection                              |
| W3  | Login tokens never expire and are not signed with a key    | A07 Authentication Failures                |
| W4  | An unhandled error returns a stack trace and the SQL       | A10 Mishandling of Exceptional Conditions  |
| W5  | A signing secret is written in the source file             | A02 Security Misconfiguration              |
| W6  | Failed logins leave no event, so guessing is invisible     | A09 Security Logging and Alerting Failures |

The course also touches A03 (a pinned, hash-checked dependency lock), A04 (password hashing and key
handling), A06 (a threat model before the fixes), and A08 (a signed token cannot be altered). You
produce, in order: an inventory and threat model; reproductions; fixes; negative tests; security
events and detections; and `posture.md`.

## Milestones

| #   | Milestone                              | Theme | Checkpoint (capstone run)             |
| --- | -------------------------------------- | ----- | ------------------------------------- |
| M1  | Inventory, threat model, reproductions | A     | `stage-1-reproduce`                   |
| M2  | Identity that holds up                 | B     | `stage-2-authn`                       |
| M3  | Access control that is tested          | C     | `stage-3-authz`                       |
| M4  | Input, output, and failures handled    | D     | `stage-4-input-output-errors`         |
| M5  | Configured, detected, and recorded     | E     | `stage-5-detect-and-posture`, `tests` |

## Acceptance criteria

| ID    | Criterion                                                                                                                        | Proof run                     |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| AC-1  | The inventory lists every route with a data class and trust boundary, and each abuse case maps to an OWASP 2025 category         | `stage-1-reproduce`           |
| AC-2  | Each of W1–W6 is reproduced by a test that fails on the starting code, with the failure printed                                  | `stage-1-reproduce`           |
| AC-3  | Wrong password and unknown user give the same response; the sixth failure within the window is throttled                         | `stage-2-authn`               |
| AC-4  | A token past its expiry, a tampered token, and a revoked token are each rejected                                                 | `stage-2-authn`               |
| AC-5  | Every cell of the role-by-endpoint-by-ownership matrix matches the policy, and a foreign invoice looks the same as a missing one | `stage-3-authz`               |
| AC-6  | The injection test strings return no data and a 400; the server's queries take parameters                                        | `stage-4-input-output-errors` |
| AC-7  | A forced exception returns a short generic body with a correlation ID and no stack, SQL, or path                                 | `stage-4-input-output-errors` |
| AC-8  | Every response carries the stated security headers                                                                               | `stage-4-input-output-errors` |
| AC-9  | A missing or short signing secret stops start-up with a named error; the planted fake secret appears in no source, log, or body  | `stage-5-detect-and-posture`  |
| AC-10 | Each detection fires on its labelled malicious logs and on none of the benign ones                                               | `stage-5-detect-and-posture`  |
| AC-11 | `posture.md` is generated with all four columns filled for W1–W6, and each row names a passing test                              | `stage-5-detect-and-posture`  |
| AC-12 | The unit tests pass                                                                                                              | `tests`                       |

## Rubric

Levels: 0 not yet, 1 partial, 2 meets, 3 strong. A pass needs every criterion at 2 or higher and all
twelve acceptance criteria green.

| Criterion        | 2 — meets                                                          | 3 — strong                                                                       |
| ---------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Threat model     | Boundaries, assets, and abuse cases are written and categorised    | A design change that removes a whole class of abuse is proposed and costed       |
| Reproduce first  | Each weakness has a failing test before its fix                    | The test is minimal and names the category in its title                          |
| Identity         | Hashing, throttling, signed expiring tokens, same-response login   | Token revocation and rotation are shown, and the trade-offs are written          |
| Access control   | Object-level and function-level checks, tested as a matrix         | The matrix is generated from the policy and fails when a route is added unlisted |
| Failure handling | Errors are closed, short, and correlated                           | Retries and timeouts are bounded, and the leak-on-error path is tested           |
| Detection        | Each attempt leaves an event; each rule is tested on labelled logs | A false-positive trade-off is written for each rule                              |
| Honest posture   | The posture record lists residual risk                             | Each residual risk has an owner, a trigger to revisit, and a test idea           |

**Evidence to keep**: the failing reproductions, the passing negative tests, the access matrix result,
the rule evaluation table, the generated `posture.md`, and the dependency lock check. Keep no real
secrets.

**Extensions** (not graded, not run): put the service behind a real identity provider in your own
environment; add rate limiting at a gateway; run a dependency audit tool on your own copy.

## Concepts

- **co-01 · trust-boundary-and-asset** — where data and authority change hands, and what is worth protecting.
- **co-02 · abuse-case** — a misuse written as a test, mapped to a category.
- **co-03 · authn-vs-authz** — proving who you are is not deciding what you may do.
- **co-04 · password-storage-and-throttling** — slow salted hashes, constant-time comparison, attempt limits.
- **co-05 · signed-expiring-token** — an integrity-protected token with a lifetime and a way to revoke it.
- **co-06 · object-and-function-level-access** — check the object and the function on every request.
- **co-07 · injection-and-parameterisation** — data is never joined into code; parameters travel apart.
- **co-08 · fail-closed-errors** — an error denies, says little to the caller, and says enough to the log.
- **co-09 · secure-configuration** — validated at start, secrets from the environment, safe defaults.
- **co-10 · supply-chain-hygiene** — pinned, hash-checked dependencies.
- **co-11 · security-events** — structured records of security-relevant actions.
- **co-12 · detection-rule** — a testable rule over events, mapped to a technique when one fits.
- **co-13 · posture-record** — weakness, mitigation, failed attempt, detection, residual risk.

## Worked examples

All examples are Python with the standard library only. The service is called in-process; time is a
fake clock; salts and keys are injected for tests (production would use random salts and managed
keys, and the lessons say so).

### Theme A — Inventory and threat model (`learning/theme-a-inventory-and-threat-model.md`)

- **ex-01 · route-inventory** — list every route, method, and handler — verify the table is complete
  and sorted. (co-01)
- **ex-02 · data-classification** — tag each field public, internal, or sensitive — verify no
  sensitive field is in a list response. (co-01)
- **ex-03 · trust-boundaries** — mark where requests, the database, and logs meet — verify the
  boundary table. (co-01)
- **ex-04 · abuse-case-table** — twelve abuse cases mapped to OWASP 2025 category IDs — verify every
  ID is in the ten-item list. (co-02)
- **ex-05 · in-process-test-client** — call the WSGI app as a function — verify a request and a
  response with no socket. (co-02)
- **ex-06 · reproduce-w1-foreign-invoice** — a failing test for the first weakness — verify the
  failure message is the expected one. (co-02)
- **ex-07 · reproduce-w2-w3** — failing tests for the injection and token weaknesses — verify both
  fail as expected. (co-02)
- **ex-08 · reproduce-w4-w6** — failing tests for the error leak, the source secret, and the missing
  event — verify the three. (co-02)
- **ex-09 · risk-rating** — likelihood by impact for W1–W6 — verify the ordering used to plan the
  fixes. (co-02)

### Theme B — Authentication (`learning/theme-b-authentication.md`)

- **ex-10 · hash-with-scrypt** — `hashlib.scrypt` with an injected salt and stated parameters — verify
  a fixed hash. (co-04)
- **ex-11 · constant-time-compare** — `hmac.compare_digest` — verify equal and unequal inputs. (co-04)
- **ex-12 · same-response-for-bad-login** — unknown user and wrong password look the same — verify
  body and status. (co-04)
- **ex-13 · throttle-failed-logins** — five failures per user per window on a fake clock — verify the
  sixth is throttled and the window resets. (co-04)
- **ex-14 · signed-token** — an HMAC-signed token with subject and expiry (the lesson says to use a
  vetted library in production) — verify issue and check. (co-05)
- **ex-15 · expiry-on-a-fake-clock** — an expired token — verify rejection at the stated instant.
  (co-05)
- **ex-16 · tamper-detection** — change one character — verify rejection. (co-05)
- **ex-17 · revocation-list** — log out and revoke — verify the token fails afterwards. (co-05)
- **ex-18 · safe-cookie-attributes** — `HttpOnly`, `Secure`, `SameSite` — verify the header text.
  (co-05)

### Theme C — Authorization (`learning/theme-c-authorization.md`)

- **ex-19 · authn-is-not-authz** — a valid token for the wrong owner — verify access is refused.
  (co-03, co-06)
- **ex-20 · object-level-check** — compare the owner before returning an invoice — verify W1 is fixed.
  (co-06)
- **ex-21 · owner-in-the-query** — put the owner in the `WHERE` clause — verify a foreign ID returns
  nothing. (co-06)
- **ex-22 · function-level-check** — admin-only routes — verify a user is refused. (co-06)
- **ex-23 · deny-by-default** — routes without a declared policy are refused — verify the failure on a
  new route. (co-06)
- **ex-24 · same-response-not-found** — a foreign invoice looks like a missing one — verify identical
  bodies. (co-06)
- **ex-25 · mass-assignment-guard** — an allowlist of writable fields — verify `role` cannot be set by
  a request. (co-06)
- **ex-26 · outbound-url-allowlist** — a strict URL parse against an allowlist, without fetching —
  verify an internal-looking address is refused. (co-06)
- **ex-27 · access-matrix-test** — role by endpoint by ownership, generated from the policy — verify
  all cells. (co-06)

### Theme D — Input, output, and failures (`learning/theme-d-input-output-and-failures.md`)

- **ex-28 · parameterised-queries** — replace string joins with placeholders — verify W2 is fixed.
  (co-07)
- **ex-29 · injection-strings-are-data** — an apostrophe, a comment marker, and a semicolon — verify
  each returns no data and a 400. (co-07)
- **ex-30 · validate-by-allowlist** — types, lengths, and character classes — verify rejects with a
  stable message. (co-07)
- **ex-31 · output-encoding** — escape text placed into HTML — verify a tag is shown as text. (co-07)
- **ex-32 · security-headers** — the stated set on every response — verify the header table. (co-09)
- **ex-33 · generic-error-with-correlation-id** — W4 fixed — verify no stack, SQL, or path in the
  body, and the id appears in the log. (co-08)
- **ex-34 · bounded-retries-and-timeouts** — a retried call with a cap and a fake clock — verify the
  stop. (co-08)
- **ex-35 · request-size-limit** — refuse oversized bodies before parsing — verify the status. (co-08)
- **ex-36 · safe-file-names** — resolve a requested name inside a directory — verify `..` is refused.
  (co-07)

### Theme E — Configuration, detection, and posture (`learning/theme-e-configuration-detection-and-posture.md`)

- **ex-37 · validated-configuration** — read and check environment settings at start — verify a
  missing and a short secret each stop start-up with a named error. (co-09)
- **ex-38 · no-secrets-in-source** — a scan test over the source for the planted pattern — verify W5 is
  fixed and the test fails on a planted copy. (co-09)
- **ex-39 · pinned-and-hashed-lock** — check that every dependency line has a version and a hash —
  verify a loose line is flagged. (co-10)
- **ex-40 · security-event-schema** — event type, subject, outcome, correlation ID — verify the exact
  JSON line. (co-11)
- **ex-41 · log-without-secrets** — redact tokens and passwords — verify the fake secret never appears.
  (co-11)
- **ex-42 · brute-force-rule** — failures per subject in a window, mapped to the ATT&CK technique
  Brute Force — verify firing on a labelled log. (co-12)
- **ex-43 · enumeration-rule** — many denied lookups of consecutive IDs by one subject, with a note
  that no single technique fits cleanly — verify firing and silence on benign logs. (co-12)
- **ex-44 · rule-precision-check** — true and false positives on labelled logs — verify the table.
  (co-12)
- **ex-45 · generate-posture-md** — build the four-column table and residual risks — verify the exact
  text. (co-13)

## Drilling

All drill sections are in `drilling/overview.md`; floors come from
[tech-docs/002](../../tech-docs/002-capstone-course-contract-and-modes.md#drilling-targets).

- **Katas** (each has `before/` and `after/`; the `before` run expects a non-zero exit):
  `kata-01-idor-fix`, `kata-02-sql-injection-fix`, `kata-03-token-without-expiry`,
  `kata-04-verbose-error-leak`, `kata-05-noisy-detection`.
- Recall, applied problems, checklist, and why-prompts follow the counts in tech-docs/002.

## Code and harness

- **Toolchain**: `python`, standard library only (`sqlite3`, `hashlib`, `hmac`, `wsgiref`,
  `unittest`). No lockfile is needed; the dependency-lock check in ex-39 runs on a sample lock file
  that ships with the example.
- **Units**: 45 example units, 5 kata units, 1 capstone unit holding the `before/` service, the
  reference `after/` service, the access matrix, the detections, the labelled logs, and the generator
  for `posture.md`.
- **Capstone runs**: `stage-1-reproduce` (expects the six failures and prints them), `stage-2-authn`,
  `stage-3-authz`, `stage-4-input-output-errors`, `stage-5-detect-and-posture`, and `tests`
  (`python3 -m unittest`, output ignored).
- **Determinism**: injected clock, salts, and keys; fixed correlation IDs from a counter; sorted
  output; in-memory SQLite; no network.
- **Run-time budget**: pure Python and fast; the executor still records it
  ([tech-docs/004](../../tech-docs/004-code-harness-and-determinism-design.md#run-time-budget)).

## Accuracy notes

- The category list is OWASP Top 10:2025: A01 Broken Access Control, A02 Security Misconfiguration,
  A03 Software Supply Chain Failures, A04 Cryptographic Failures, A05 Injection, A06 Insecure Design,
  A07 Authentication Failures, A08 Software or Data Integrity Failures, A09 Security Logging and
  Alerting Failures, A10 Mishandling of Exceptional Conditions. Source: `https://owasp.org/Top10/2025/`
  (introduction page confirmed by search on 2026-10-09; the page is re-read in Phase 0 and any
  difference corrects every table in this course). Secondary sources report that SSRF is folded into
  A01; Phase 0 confirms that from the official page before ex-26 says so.
- ATT&CK technique names and IDs come from the Enterprise matrix at the version pinned in Phase 0
  (v19.2, August 2026, at authoring): `https://attack.mitre.org/`. The course page carries the
  notice "© 2026 The MITRE Corporation. This work is reproduced and distributed with the permission of
  The MITRE Corporation." and "MITRE ATT&CK and ATT&CK are registered trademarks of The MITRE
  Corporation."
- `hashlib.scrypt`, `hmac.compare_digest`, and `wsgiref` behaviour are stated for the catalog's Python
  version and checked by running the examples. Scrypt parameters in the lessons are teaching values,
  and the lesson points to the current OWASP Password Storage Cheat Sheet for production values.
- The signed token in ex-14 teaches the shape of a token; the lesson states that production code uses
  a vetted library rather than hand-written token code.

## Read more

- **OWASP Top 10:2025** — OWASP. The category list this course maps to.
- **OWASP Cheat Sheet Series: Authorization, Password Storage, and Error Handling** — OWASP. Concrete
  practice for themes B to D.
- **MITRE ATT&CK** — The MITRE Corporation. The technique catalogue used for rule mapping.

## Lineage

This course replaces a 2-file outline whose code was a two-line `authorize(subject, owner)` function.
That function is kept as ex-20 and then extended by ex-21 to ex-27. The outline's five steps became
the five milestones, and its `posture.md` idea became AC-11.

## In which paths

- `careers/interview-ready/software-engineer` — extension, "Security".
- `careers/immediately-effective/software-engineer` — extension, "Security".
- `careers/fundamentally-strong/software-engineer` — extension, "Security".
