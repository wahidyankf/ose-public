# Step 7 (continued): Licensing, Dependency Bump Policy, Gherkin Journey Coherence, Report Format

1. **Licensing Compliance** (see [Per-Directory Licensing Convention](../../../../repo-governance/conventions/structure/licensing.md)):
   every product app dir, every `libs/*` dir, and `specs/` root need MIT LICENSE;
   LICENSING-NOTICE.md table must match actual LICENSE files on disk; CLAUDE.md/README.md/ose-web
   about.md license descriptions must agree with LICENSING-NOTICE.md. Missing LICENSE = CRITICAL;
   wrong license type = HIGH; cross-doc inconsistency = MEDIUM.
2. **Dependency Bump Policy Compliance** (see [Dependency Bump Stability & Safety Policy](../../../../repo-governance/development/workflow/dependency-bump-policy.md)):
   scan every plan (backlog/in-progress/done) that introduces or modifies dependency versions:
   - Three-path classification (LTS/60-day-soak/security-waiver) required in `tech-docs.md` —
     unclassified = HIGH.
   - Rule 5a/Recency: pinned version must be the most recent eligible for its path — HIGH if not.
   - Rule 5b/Functional Stability: clearance status must be `CLEAR`, `CLEAR (patch-of)`, `WAIVER`,
     or `FUNCTIONAL-HOLD` (any may carry `(KEV-listed)` when actively exploited at bump time);
     yanked/deprecated/blocked versions require `FUNCTIONAL-HOLD` with skipped version + fallback +
     reason. Missing/incorrect status = HIGH; `FUNCTIONAL-HOLD` without detail = MEDIUM.
   - Security Clearance Status table required in `tech-docs.md` — absence = HIGH.
   - Exact pinning only, no `^`/`~` (verify: `grep -E '"\^|"~' <file>`) — violation = CRITICAL.
   - Path C waivers must be registered in `docs/reference/security-waivers.md` — missing = HIGH.
   - `FUNCTIONAL-HOLD` statuses must be registered in the same file's FUNCTIONAL-HOLD table —
     missing = HIGH.
   - `(KEV-listed)` statuses need KEV `dateAdded`/`knownRansomwareCampaignUse` fields there —
     missing = HIGH.
   - CVSS ≥ 7.0 needs a recorded EPSS score/percentile — missing = MEDIUM; EPSS ≥ 0.5 requires Path
     C urgency — lower path without waiver justification = HIGH.
   - Scope note: for `plans/done/`, flag only CRITICAL/HIGH (historical accuracy); for
     `plans/in-progress/`/`plans/backlog/`, flag all severities.
3. **Gherkin Journey Coherence** (markdown fences — see the
   [Acceptance Criteria Convention](../../../../repo-governance/development/infra/acceptance-criteria/gherkin-format-and-step-keyword-cardinality.md)):
   scope is ` ```gherkin ` fences in `repo-governance/`, `docs/`, `.agents/skills/`, and active
   plans (`plans/done/` exempt). Project-local `test:coverage:behaviour` owns static corpus,
   adapter, exemption, and journey-shape checks for tracked `.feature` files. Require an explicit
   `When` and `Then`; repeated primary keywords are valid when they form one continuous journey.
   Flag a missing action/outcome or unrelated independently meaningful actions hidden in one
   scenario as HIGH.

**Report format**: `### Finding: [Contradiction/Inaccuracy/Inconsistency/Traceability
Violation/Layer Coherence]` with Category, Files Affected, Criticality, Issue, Evidence,
Recommendation — write all findings progressively during Step 7, using the same shape for each
sub-category above.
