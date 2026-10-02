---
description: Delegates per-ecosystem version/CVE/KEV/EPSS research to web-researcher and classifies each dependency's policy path.
when_to_use: Use when determining, per package, the policy path (A/B/C), proposed version, and clearance-relevant security data.
---

# Phase 2: Candidate Discovery & Classification (Parallel, delegated)

For each dependency/runtime, determine its policy path and the version to propose. Delegate the
external research to `web-researcher` — the [default primitive for public-web information
gathering](../../../conventions/writing/web-research-delegation.md). **Group research by ecosystem**
(one agent per ecosystem batch) rather than one agent per package, and fan out under the **N+1
model** — `1 main thread + N background agents = N+1 total`, default **N=3** — per the
[Subagent Orchestration Convention](../../../development/agents/subagent-orchestration.md). Ecosystem
batches are independent DAG nodes (no batch reads what another writes), so the number of batches is
the actual fan-out and N only caps it.

Each research batch must return, per package:

- Latest version and its release date; whether an LTS line exists (→ **Path A**) and the latest
  LTS patch.
- For non-LTS packages, the latest version released on or before the **cutoff** (→ **Path B**).
- CVE status across all five policy sources (NVD, GitHub Security Advisories, Snyk DB, vendor
  security page, **CISA KEV**). If no version satisfies both the 60-day rule and CVE-cleanness →
  **Path C**.
- **CISA KEV check**: cross-reference every CVE against the [CISA KEV JSON feed](https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json).
  If any unpatched CVE affecting the current pin is KEV-listed, **KEV Fast-Track** applies —
  escalate immediately to Path C regardless of soak eligibility. Record `dateAdded` and
  `knownRansomwareCampaignUse` for each match.
- **EPSS score**: for any CVE with CVSS ≥ 7.0, query `https://api.first.org/data/v1/epss?cve=CVE-YYYY-NNNNN`
  and record the score (0–1) and percentile. If score ≥ 0.5, flag for expedited scheduling
  (EPSS Escalation rule).
- **Rule 5a (recency)**: the most recent eligible version for the chosen path.
- **Rule 5b (functional stability)**: whether the chosen version is yanked/deprecated, carries an
  open release-blocker, or has a widely-reported fatal functional bug — and if so, the most recent
  eligible version that passes.

**Agent**: `web-researcher` (one invocation per ecosystem batch).

**Output**: Per-package classification: path (A/B/C), proposed target version, CVE status, Rule 5b
status.
