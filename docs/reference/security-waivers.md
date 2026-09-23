---
title: "Security Waivers and Functional Holds"
description: Persistent register of Path C (security-override) dependency waivers and FUNCTIONAL-HOLD (Rule 5b functional-defect skips) granted across the workspace
category: reference
tags:
  - reference
  - security
  - dependency
  - waiver
  - cve
  - functional-hold
created: 2026-05-16
---

# Security Waivers and Functional Holds

Persistent register of two clearance exceptions granted under the [Dependency Bump Stability & Safety Policy](../../repo-governance/development/workflow/dependency-bump-policy.md):

- **Path C waivers** — applies when no CVE-clean version exists outside the policy's 60-day soak window; the team waives the soak requirement to pull in the security patch.
- **FUNCTIONAL-HOLD entries** — applies when the newest eligible version is skipped due to a known fatal functional defect (Rule 5b: yanked/deprecated, open release-blocker, or widely-reported broken-build/data-loss/crash bug); the team pins to the most recent eligible version that passes instead.

> **Append, do not redefine.** Future plans must append entries to this register rather than
> re-declaring them in their own `tech-docs.md`. Each entry records the plan that introduced (or
> last revalidated) it, the package, the pinned version, the reason, the citation, and the
> sign-off.
>
> **KEV-listed entries** (marked `Y` in the KEV column) were actively exploited per the
> [CISA KEV catalog](https://www.cisa.gov/known-exploited-vulnerabilities) at the time the waiver
> was granted. These are highest-urgency for resolution tracking — expedite retirement when a
> normally-eligible patched version becomes available. Existing entries pre-dating 2026-06-04
> are marked `—` (KEV check not yet performed; verify on next bump cycle).

## Active Waivers

| Package                                                            | Pinned Version | Release Date | CVE(s)                                                                                                                                                                                                                                                                                              | Severity          | KEV | EPSS    | Citation                                                                                                                                      | Introduced By                                                                      | Sign-off                               |
| ------------------------------------------------------------------ | -------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | --- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------- |
| `next`                                                             | **16.2.6**     | 2026-05-08   | CVE-2026-29057 (HTTP smuggling), CVE-2026-27979 (DoS), CVE-2026-44578 (SSRF), and 10 other May 2026 advisories                                                                                                                                                                                      | High              | —   | —       | [Vercel May 2026 release](https://vercel.com/changelog/next-js-may-2026-security-release)                                                     | `stack-update` (2026-05-15)                                                        | plan-author + plan-quality-gate review |
| `react`                                                            | **19.2.6**     | ~2026-05-06  | CVE-2025-55182 (Critical RSC RCE), CVE-2026-23864 (High DoS), CVE-2026-23870                                                                                                                                                                                                                        | Critical → High   | —   | —       | [react.dev advisory](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components)                            | `stack-update` (2026-05-15)                                                        | plan-author + plan-quality-gate        |
| `react-dom`                                                        | **19.2.6**     | ~2026-05-06  | Same as `react`                                                                                                                                                                                                                                                                                     | Critical → High   | —   | —       | Same as `react`                                                                                                                               | `stack-update` (2026-05-15)                                                        | plan-author                            |
| `effect`                                                           | **3.21.2**     | ~2026-04     | CVE-2026-32887 (AsyncLocalStorage context leak) — patched at 3.20.0. Latest 3.x pre-cutoff is 3.19.19 (2026-02-21, vulnerable).                                                                                                                                                                     | High (CVSS 7.4)   | —   | —       | [GHSA-38f7-945m-qr2g](https://github.com/advisories/GHSA-38f7-945m-qr2g)                                                                      | `stack-update` (2026-05-15)                                                        | plan-author                            |
| `golang.org/x/image` (indirect via `narqo/go-badge`)               | **v0.39.0**    | 2026-04-09   | CVE-2026-33809 (TIFF OOM, patched at v0.38.0); CVE-2026-33812 (font OOM, patched at v0.39.0). Both versions post-cutoff.                                                                                                                                                                            | Medium            | —   | —       | [GO-2026-4815](https://pkg.go.dev/vuln/GO-2026-4815), [GO-2026-4962](https://pkg.go.dev/vuln/GO-2026-4962)                                    | `stack-update` (2026-05-15)                                                        | plan-author                            |
| `postcss` (transitive)                                             | **8.5.10+**    | 2026-04-15   | CVE-2026-41305 (XSS via unescaped `</style>`). No pre-cutoff version is CVE-clean.                                                                                                                                                                                                                  | Medium 6.1        | —   | —       | [SNYK-JS-POSTCSS-16189065](https://security.snyk.io/vuln/SNYK-JS-POSTCSS-16189065)                                                            | `stack-update` (2026-05-15)                                                        | plan-author                            |
| `eclipse-temurin:25.0.3+9-jdk` (Ubuntu base; replaces alpine base) | image swap     | 2026-04-22   | Avoid 2 unfixed High binutils CVEs (CVE-2025-69649, CVE-2025-69650; CVSS 7.5) in the Alpine layer. Ubuntu base has 0 High/Critical.                                                                                                                                                                 | High              | —   | —       | [sliplane.io eclipse-temurin alpine CVE](https://sliplane.io/tools/cve/library/eclipse-temurin:25-alpine)                                     | `stack-update` (2026-05-15)                                                        | plan-author                            |
| `mermaid`                                                          | **11.15.0**    | 2026-05-11   | CVE-2026-41148/41150/41159 (CSS injection High 7.1; Gantt DoS) plus 3 other CVEs; all 6 unpatched in any pre-cutoff version.                                                                                                                                                                        | High → Medium     | —   | —       | [mermaid GHSA](https://github.com/advisories?query=type%3Areviewed+ecosystem%3Anpm+mermaid)                                                   | `stack-update` (2026-05-15)                                                        | plan-author                            |
| `zod`                                                              | **4.3.6**      | 2026-01-22   | CVE-2026-6991 — SQL injection in CUID handler (`packages/zod/src/v4/core/regexes.ts`). Fix in 4.4.0 (released 2026-04-29, 18 days post-cutoff). Not Path C: EPSS 0.00008 (0.008%), CVSS 6.3 Medium, not in CISA KEV. Upgrade to ≥ 4.4.0 when its 60-day soak window opens (on or after 2026-06-29). | Medium (CVSS 6.3) | N   | 0.00008 | [CVE-2026-6991 NVD](https://nvd.nist.gov/vuln/detail/CVE-2026-6991), [GHSA-hprg-jrj6-qhrw](https://github.com/advisories/GHSA-hprg-jrj6-qhrw) | `standardize-secrets-and-env`                                                      | plan-author                            |
| `tofu` (OpenTofu)                                                  | **1.12.3**     | 2026-06-18   | Low GHSA-22w5-2fxg-vrwx: upstream Go CVEs CVE-2026-42504 and CVE-2026-27145. Separate High GHSA-q7j3-v8qv-22vq: arbitrary file read during git operations; no CVE mapping. No CVE-clean version meets the 2026-06-06 Path B cutoff.                                                                 | High + Low        | N   | < 0.5   | [OpenTofu 1.12.3 release](https://github.com/opentofu/opentofu/releases/tag/v1.12.3), both GHSAs                                              | [gate registry plan](../../plans/done/2026-08-07__sdlc-gate-registry-enforcement/) | Codex (AI)                             |

## Process — Path C Waivers

1. **Trigger** — A dependency bump's CVE clearance step finds no pre-cutoff CVE-clean version.
2. **Justify** — The introducing plan's `tech-docs.md` documents the waiver with the CVE list, severity, and citation.
3. **Sign-off** — `plan-author` records the waiver here; `plan-quality-gate` reviews during the quality-gate workflow for Critical/High waivers.
4. **Append** — When the waiver is introduced (or revalidated by a later plan), add or update the entry in the Active Waivers table with the introducing plan's link.
5. **Retire** — When a normally-eligible (Path A or Path B) version supersedes the waivered pin, move the entry to the "Retired Waivers" section with the retirement date and the plan that retired it.

## Active FUNCTIONAL-HOLD Entries

_None yet._

FUNCTIONAL-HOLD entries track cases where the most recent eligible version was skipped because it had a known fatal functional defect (Rule 5b), and the team pinned to an older eligible version that passed instead.

| Package | Skipped Version | Reason | Pinned Version | Source | Introduced By | Sign-off |
| ------- | --------------- | ------ | -------------- | ------ | ------------- | -------- |

## Process — FUNCTIONAL-HOLD Entries

1. **Trigger** — Rule 5b check finds the newest eligible version is yanked/deprecated, carries an open release-blocker, or has a widely-reported broken-build/data-loss/crash bug.
2. **Justify** — The introducing plan's `tech-docs.md` documents the skipped version, the defect evidence (registry deprecation flag, upstream GitHub issue, changelog known-issues callout), and the chosen fallback version.
3. **Sign-off** — `plan-author` records the entry here.
4. **Append** — Add the entry to the Active FUNCTIONAL-HOLD Entries table with the introducing plan's link.
5. **Retire** — When the defect is resolved and a passing version supersedes the pinned version, move the entry to "Retired FUNCTIONAL-HOLD Entries" with the resolution date and the plan that retired it.

## Retired Waivers

_None yet._

## Retired FUNCTIONAL-HOLD Entries

_None yet._

## See Also

- [Dependency Bump Stability & Safety Policy](../../repo-governance/development/workflow/dependency-bump-policy.md) — the three-path decision tree (A/B/C) governing every dependency bump, plus Rule 5a (recency) and Rule 5b (functional stability / FUNCTIONAL-HOLD).
- `stack-update` plan (2026-05-15) — first plan to populate this register; introduced all 8 active Path C waivers above.
