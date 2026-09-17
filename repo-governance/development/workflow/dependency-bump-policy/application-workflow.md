---
description: The twelve-step ordered procedure for proposing or executing a dependency bump, from classification through quality gates.
when_to_use: Use as the step-by-step checklist when proposing or executing any dependency bump.
---

# Application Workflow

When proposing or executing a dependency bump, follow these steps in order:

1. List every package, runtime, and base image to be bumped
2. For each item: classify as Path A, B, or C
3. For Path A: identify the latest LTS patch and verify CVE clearance
4. For Path B: identify the latest version released on or before the cutoff and verify CVE clearance
5. For Path C: document the waiver per the
   [Path C template](./three-path-decision-tree.md#path-c--security-override-waiver)
6. Apply Rule 5a (recency): confirm the chosen version is the most recent eligible one for its path
7. Apply Rule 5b (functional stability): confirm the chosen version is not yanked/deprecated and has no open release-blocker for its primary function — if it fails, fall back to the most recent eligible version that passes and record a `FUNCTIONAL-HOLD`
8. Convert all version specs to exact pins (remove carets and tildes)
9. Run each authorized lockfile update through a transactional boundary:
   `./hippo run --class transactional --resource-tier standard --disk-path . -- npm install`,
   `./hippo run --class transactional --resource-tier standard --disk-path . -- go mod tidy`, or
   `./hippo run --class transactional --resource-tier standard --disk-path . -- mvn versions:resolve-ranges`.
10. Run each security re-audit through an ephemeral boundary:
    `./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm audit --audit-level=moderate`,
    `./hippo run --class ephemeral --resource-tier standard --disk-path . -- govulncheck ./...`, or optionally
    `./hippo run --class ephemeral --resource-tier standard --disk-path . -- mvn org.owasp:dependency-check-maven:check`.
    10a. Cross-reference every CVE from steps 3–5 against the CISA KEV feed:
    `curl -s https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json | jq '.vulnerabilities[] | select(.cveID=="CVE-YYYY-NNNNN")'`.
    Record `dateAdded` and `knownRansomwareCampaignUse` for any matches; append `(KEV-listed)` to
    the clearance status in the plan's `tech-docs.md`.
    10b. Query EPSS for any CVE with CVSS ≥ 7.0:
    `curl -s "https://api.first.org/data/v1/epss?cve=CVE-YYYY-NNNNN"`.
    Record the score and percentile in the clearance table. If score ≥ 0.5, flag for expedited
    scheduling ([EPSS Escalation](./kev-fast-track-and-epss-escalation.md#epss-escalation--soft-urgency-signal) applies).
11. Document the audit results and any waivers in the plan's `tech-docs.md`
12. Run quality gates for affected projects: typecheck, lint, and `test:quick` (which includes Unit
    runtime and every applicable static `test:coverage:*` validator)
