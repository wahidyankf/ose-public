---
title: "Hardening and secure delivery"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 30
---

## Make controls part of delivery

The final cluster connects browser protections, secret lifecycle, dependency review, and privacy to
the same evidence-driven loop. Controls are useful only when the team knows where they run, who
responds to a failure, and how they are tested again after change.

### Worked Example 39: Encode by context

**Context**: A receipt title is rendered in an HTML text node, not concatenated into an event handler.

| Output location | Correct defense                     |
| --------------- | ----------------------------------- |
| HTML text       | framework HTML escaping             |
| URL parameter   | URL encoding plus allow-list        |
| JavaScript data | avoid inline code; serialize safely |

**Key takeaway**: Output encoding is specific to the parser that will consume the data.

**Why It Matters**: One generic escaping function does not make every context safe. Prefer templating
or DOM APIs that keep data separate from executable syntax, then add CSP as a containment layer.
(co-13)

### Worked Example 40: Constrain scripts with CSP

**Context**: A server sends a restrictive starting policy.

`Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'`

**Key takeaway**: CSP tells the browser which sources may execute or load active content.

**Why It Matters**: CSP reduces the impact of some injection mistakes but does not validate input or
make inline scripts safe. Start in report-only mode where appropriate, inventory real requirements,
then enforce a policy that avoids broad wildcards and unsafe-inline exceptions. (co-13, co-27)

### Worked Example 41: Use a synchronizer token

**Context**: A form-changing request includes a server-generated value tied to the user's session.

| Request property       | Expected value                    |
| ---------------------- | --------------------------------- |
| Authenticated session  | valid cookie                      |
| Form token             | unpredictable session-bound token |
| Cross-site forged form | missing or invalid token → reject |

**Key takeaway**: A CSRF token proves the request came through a page that could read session state.

**Why It Matters**: Browsers attach cookies automatically, which is precisely why an attacker can
trigger a state-changing request from another site. Validate the token server-side for unsafe methods
and keep it independent of the session identifier itself. (co-14)

### Worked Example 42: Add SameSite defense in depth

**Context**: An ordinary login session uses `SameSite=Lax` while high-risk actions also require CSRF tokens.

| Cookie setting | Cross-site behavior                                |
| -------------- | -------------------------------------------------- |
| `Strict`       | strongest restriction; can affect valid navigation |
| `Lax`          | limits most cross-site unsafe requests             |
| `None; Secure` | permits cross-site use when product requires it    |

**Key takeaway**: SameSite reduces ambient cookie sending but is not the only CSRF control.

**Why It Matters**: Product flows such as third-party sign-in can require cross-site cookies, making
one setting insufficient for all routes. Pair the chosen policy with tokens, origin checks, and safe
HTTP method design. (co-14, co-25)

### Worked Example 43: Protect data at rest

**Context**: A backup bucket contains receipt attachments and database snapshots.

| State          | Required protection                          |
| -------------- | -------------------------------------------- |
| In transit     | TLS with certificate validation              |
| At rest        | managed encryption and controlled key access |
| Backup restore | authorization and audit trail                |

**Key takeaway**: Encryption at rest is a system property involving storage, keys, and recovery paths.

**Why It Matters**: Encrypting a primary database while leaving plaintext exports, logs, or backups
available preserves the same disclosure path. Document every data copy and limit who can decrypt it.
(co-10)

### Worked Example 44: Set baseline headers

**Context**: A public HTTPS service sets browser-enforced defenses.

| Header                            | Effect                                  |
| --------------------------------- | --------------------------------------- |
| `Strict-Transport-Security`       | requests HTTPS after a trusted response |
| `X-Content-Type-Options: nosniff` | avoids MIME-type guessing               |
| `X-Frame-Options: DENY`           | blocks framing where appropriate        |

**Key takeaway**: Security headers provide narrow, browser-side protections with explicit scope.

**Why It Matters**: HSTS should be deployed only after HTTPS is complete for the intended scope; a
misapplied header can break a legitimate subdomain. Prefer CSP `frame-ancestors` for modern framing
policy while preserving compatibility where needed. (co-27)

### Worked Example 45: Remove a hardcoded secret

**Context**: A signing key moves from source code into a secret manager or deployment-injected environment.

| Before                                | After                               |
| ------------------------------------- | ----------------------------------- |
| source literal, copied by every clone | reference injected at runtime       |
| broad repository visibility           | restricted workload identity access |

**Key takeaway**: Source code is not a secret store, even when a repository is private.

**Why It Matters**: A committed secret persists in history, build logs, forks, and developer devices.
Use a deliberately scoped secret system, prevent accidental commits, and rotate immediately if a
value is exposed rather than merely deleting the line. (co-26)

### Worked Example 46: Rotate a secret

**Context**: An API supports two key versions during a controlled rollover.

`issue with v2 → verify v1 and v2 briefly → migrate consumers → revoke v1`

**Key takeaway**: Rotation is a lifecycle with a measured overlap, not a one-time replacement.

**Why It Matters**: Immediate revocation can cause an outage; indefinite overlap leaves a leaked key
valid forever. Record consumers, expiration, rollout success, and a tested emergency-revocation path
before declaring rotation complete. (co-26)

### Worked Example 47: Triage an SCA finding

**Context**: A dependency scanner finds a CVE in a transitive package.

| Question                          | Evidence                             |
| --------------------------------- | ------------------------------------ |
| Is the package present?           | lockfile/SBOM                        |
| Is the vulnerable path reachable? | application usage and advisory       |
| What changes it?                  | fixed version and compatibility test |

**Key takeaway**: A scanner finding starts analysis; it is not automatically an exploit or a dismissal.

**Why It Matters**: Supply-chain risk includes compromised packages, malicious updates, and stale
dependencies as well as known CVEs. Preserve provenance, pin reviewed versions, and give every finding
an owner and documented disposition. (co-12)

### Worked Example 48: Place secure-SDLC gates

**Context**: A delivery pipeline makes controls early, repeatable feedback.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
flowchart LR
    accTitle: Worked Example 48: Place secure-SDLC gates
    accDescr: Flowchart with 4 nodes and 3 connections. Nodes: Change, Secret and dependency checks, Tests and SAST, Deploy review. Connections: Change to Secret and dependency checks, Secret and dependency checks to Tests and SAST, Tests and SAST to Deploy review.
    A["Change"]:::blue --> B["Secret and<br/>dependency checks"]:::orange --> C["Tests and SAST"]:::teal --> D["Deploy review"]:::purple
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key takeaway**: SAST, DAST, dependency checks, and review have different signals and complementary places.

**Why It Matters**: NIST SSDF groups work as Prepare the Organization, Protect the Software,
Produce Well-Secured Software, and Respond to Vulnerabilities. A failing gate needs a response path,
otherwise it becomes background noise. (co-28)

### Worked Example 49: Read a CVE record

**Context**: An advisory names a library, affected version range, and references.

| Field              | Review use                            |
| ------------------ | ------------------------------------- |
| Affected component | compare to lockfile                   |
| Description        | understand weakness and preconditions |
| References         | find vendor remediation               |

**Key takeaway**: A CVE identifies a public vulnerability record; it does not itself prove deployment impact.

**Why It Matters**: NVD enrichment and vendor advisories help an engineer decide urgency, reachability,
and remediation. Record the version evidence and decision so a later reviewer can revisit it when
new exploit information appears. (co-29)

### Worked Example 50: Interpret CVSS carefully

**Context**: An advisory has a high CVSS base score but requires a disabled feature in this deployment.

| Signal                | Meaning                         |
| --------------------- | ------------------------------- |
| CVSS base score       | standardized technical severity |
| Asset value           | local business harm             |
| Exposure and controls | local exploitability            |

**Key takeaway**: CVSS prioritizes technical characteristics; local risk needs more context.

**Why It Matters**: Treating a score as the whole decision can miss a low-score internet-facing issue
or overreact to an unreachable package. Combine score, asset sensitivity, reachability, and compensating
controls in a time-bounded remediation record. (co-29)

### Worked Example 51: Classify personal data

**Context**: An expense receipt includes a name, email, and reimbursement history.

| Data                    | Can identify a person in context? | Treat as personal data? |
| ----------------------- | --------------------------------- | ----------------------- |
| employee email          | yes                               | yes                     |
| reimbursement history   | yes when linked                   | yes                     |
| aggregate monthly total | not by itself                     | assess context          |

**Key takeaway**: GDPR personal data is information relating to an identified or identifiable person.

**Why It Matters**: Privacy requirements shape collection, retention, access, and incident response
before a breach occurs. Minimize collection and retain data only with a stated purpose and owner.
(co-30)

### Worked Example 52: Assemble a security assessment

**Context**: The capstone joins modeling, preventive mechanisms, and delivery evidence for the fictional app.

| Artifact        | Evidence of completion                       |
| --------------- | -------------------------------------------- |
| STRIDE model    | every entry point has threat and mitigation  |
| OWASP mapping   | A01–A10 addressed or justified N/A           |
| Mechanism tests | valid accepted; tampered or invalid rejected |
| SSDF checklist  | dependency, secrets, headers have status     |

**Key takeaway**: A security assessment is a connected argument from assets to controls to evidence.

**Why It Matters**: A checklist alone cannot show why a control exists, and a threat model alone
cannot show it was implemented. Joining both lets a reviewer locate residual risk and decide the next
most valuable improvement. (co-01, co-04, co-07, co-18, co-24, co-28)

## Sources

- [MDN CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP),
  [HSTS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security), and
  [X-Content-Type-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Content-Type-Options)
  describe the browser-header semantics used above.
- [NIST SP 800-218 SSDF](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-218.pdf)
  defines the four secure-development practice groups.
- [NVD's CVE process](https://nvd.nist.gov/general/cve-process), [FIRST CVSS](https://www.first.org/cvss/), and
  [GDPR Article 4](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02016R0679-20160504)
  are the primary references for the final examples.
