---
description: Links to the dependency bump policy, plan-planning, plan-execution, the web-researcher agent, the security-waivers register, and the CISA KEV/EPSS feeds.
when_to_use: Use when navigating from this workflow to the policy it operationalizes or the workflows/agents it invokes.
---

# Related Documents

- [Dependency Bump Stability & Safety Policy](../../../development/workflow/dependency-bump-policy.md) — the authority this workflow operationalizes (three-path tree, Rule 5a/5b, KEV Fast-Track, EPSS Escalation, clearance statuses).
- [plan-planning workflow](../../plan/plan-planning.md) — invoked in Phase 5 with `target-stage=backlog`.
- [Plan Execution workflow](../../plan/plan-execution.md) — runs the plan later, after promotion to `in-progress/`.
- [web-researcher Agent](../../../../.agents/agents/web-researcher.md) — Phase 2 version/CVE/KEV/EPSS research.
- [security-waivers register](../../../../docs/reference/security-waivers.md) — destination for WAIVER / FUNCTIONAL-HOLD / KEV-listed entries.
- [CISA KEV JSON feed](https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json) — daily feed of CVEs with confirmed active exploitation.
- [FIRST.org EPSS API](https://api.first.org/data/v1/epss) — ML exploitation-probability scores by CVE ID.
