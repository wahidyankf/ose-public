---
description: Traces this workflow's design back to the Workflow Naming, Plans Organization, Web Research Delegation, Subagent Orchestration, and Linking conventions.
when_to_use: Use when auditing this workflow for traceability back to other repo-governance conventions.
---

# Conventions Implemented/Respected

- **[Plans Organization Convention](../../../conventions/structure/plans.md)**: The backlog plan uses the `<identifier>/` folder form (no date prefix).
- **[Web Research Delegation Convention](../../../conventions/writing/web-research-delegation.md)**: Version/CVE/yank research delegated to `web-researcher`.
- **[Subagent Orchestration Convention](../../../development/agents/subagent-orchestration.md)**: Research agents fan out under the N+1 model — `1 main thread + N background agents = N+1 total`, default N=3 — with the main thread kept vacant as orchestrator and N never self-promoted beyond the declared value.
- **[Linking Convention](../../../conventions/formatting/linking.md)**: Cross-references use GitHub-compatible markdown with `.md` extensions.
