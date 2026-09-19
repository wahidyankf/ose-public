---
description: The tools and feeds that automate this policy, and the full set of related conventions, principles, and external references.
when_to_use: Use when looking up which tool enforces a specific part of this policy, or when tracing a related convention, principle, or external database.
---

# Tools, Automation, and References

## Tools and Automation

- **rules-checker** — validates that any plan introducing dependency bumps includes a Security Clearance Status section and applies the three-path decision tree
- `npm audit --audit-level=moderate` — mandatory post-update security scan for npm packages
- `govulncheck ./...` — mandatory post-update security scan for Go modules
- `grep -E '"\^|"~'` — pin verification after any `package.json` edit
- Renovate / Dependabot — if configured, surface bump PRs but require human application of the three-path classification before merge
- **CISA KEV JSON feed** — `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json` —
  daily-updated catalog of CVEs with confirmed active exploitation; cross-reference with
  `jq '.vulnerabilities[] | select(.cveID=="CVE-YYYY-NNNNN")'`
- **FIRST.org EPSS API** — `https://api.first.org/data/v1/epss?cve=CVE-YYYY-NNNNN` — daily ML
  exploitation-probability score (0–1) for any given CVE; supports comma-separated batch lookups

## References

**Related Development Practices:**

- [Reproducible Environments Convention](../reproducible-environments.md) — Runtime pinning and lockfile discipline that this policy extends
- [Trunk Based Development Convention](../trunk-based-development.md) — Bumps follow the same delivery-mode rules as any other change (`worktree-to-pr` by default)
- [Native-First Toolchain Management](../native-first-toolchain.md) — Toolchain version management via `./rhino toolchain validate`
- [CI Blocker Resolution Convention](../../quality/ci-blocker-resolution.md) — CVE-related CI failures are resolved per root-cause discipline, not suppressed

**Related Principles:**

- [Reproducibility First](../../../principles/software-engineering/reproducibility.md) — Foundational why for exact pinning
- [Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md) — Foundational why for written path classification and cutoff dates
- [Root Cause Orientation](../../../principles/general/root-cause-orientation.md) — Foundational why for CVE clearance rather than suppression

**External References:**

- [NVD](https://nvd.nist.gov) — National Vulnerability Database
- [GitHub Security Advisories](https://github.com/advisories) — GitHub advisory database
- [Snyk DB](https://security.snyk.io) — Snyk vulnerability database
- [govulncheck](https://pkg.go.dev/golang.org/x/vuln/cmd/govulncheck) — Go vulnerability scanner
- [npm audit](https://docs.npmjs.com/cli/v10/commands/npm-audit) — npm vulnerability scanner
- [CISA KEV catalog](https://www.cisa.gov/known-exploited-vulnerabilities) — Authoritative list of CVEs with confirmed active exploitation; JSON feed updated daily
- [CISA KEV JSON feed](https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json) — Machine-readable daily feed; use for automated cross-referencing
- [FIRST.org EPSS](https://www.first.org/epss) — Exploit Prediction Scoring System; ML-predicted exploitation probability within 30 days
- [EPSS API](https://api.first.org/data/v1/epss) — Programmatic EPSS score lookup by CVE ID

**Long-Lived Registers:**

- `docs/reference/security-waivers.md` — Waiver register (create if missing when the first Path C waiver is issued)
- Introducing plan's `tech-docs.md` — Security Clearance Status table for each bump
