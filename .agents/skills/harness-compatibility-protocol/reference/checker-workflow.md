# Checker Workflow

## Workflow

**Step 0 — Initialize Report**: see `repo-generating-validation-reports` skill for UUID chain
generation, progressive writing, UTC+7 timestamp format. Report filename:
`harness-compat__{uuid-chain}__{YYYY-MM-DD--HH-MM}__audit.md`. Write the execution chain UUID to
`local-tmp/.execution-chain-harness-compat` before spawning any `web-researcher` tasks.

**Step 1 — Run Phase 0**: run the invariant inventory, leaving every property the gate's
Deterministic Boundary lists to its declared tool. Write retained findings
under `## Phase 0 — Cross-Vendor Parity Invariants`. If any HIGH-criticality retained invariant
fails, note it prominently in the summary — but continue to Phase 1 regardless, do not
short-circuit.

**Step 2 — Read Catalog**: read `docs/reference/platform-bindings.md`, parse one record per
harness, write the harness list under `## Phase 1 — Harnesses Under Review`.

**Step 3 — Delegate Web Research** (per harness, filtered by `scope` if provided): invoke
`web-researcher` via the Agent tool. Research delegation pattern:

```
Delegate to web-researcher:
  "Fetch the current official documentation for [Harness Name] and report:
   1. The root instruction file name (e.g., AGENTS.md, CLAUDE.md) that the harness reads natively
   2. The config/binding directory path (e.g., .claude/, .opencode/)
   3. The MCP or plugin config file path and format
   4. The custom-agent discovery directory and frontmatter schema (required and optional fields)
   5. The skill/knowledge-file discovery path and loading mechanism
   Cite official docs with URLs. Note any changes from previous known state:
   [list catalog row values here for comparison context]."
```

Use `WebFetch`/`WebSearch` directly only for single-shot confirmations of a known URL; delegate
all multi-page or ambiguous research to `web-researcher`, per the
[Web Research Delegation Convention](../../../../repo-governance/conventions/writing/web-research-delegation.md).

**Step 4 — Diff Research Against Catalog** (per harness, D1–D5): for each discrepancy, determine
criticality (D1/D2/D4 → HIGH; D3/D5 → MEDIUM by default; escalate to CRITICAL if breaking),
determine confidence (HIGH if `web-researcher` returned `[Verified]`, MEDIUM if
`[Needs Verification]`), write the finding progressively.

**Step 5 — Binding File Conformance (D6)** (per harness with committed binding files): Glob to
enumerate agent definition files, read a sample (up to 10) and check frontmatter against the
current required schema, Grep config files for deprecated fields named in the research results,
write D6 findings progressively.

**Step 6 — Finalize Report**: update status to "Complete", add a summary:

```markdown
## Summary

**Phase 0 (parity invariants)**: N findings (HIGH: N, MEDIUM: N)
**Phase 1 (external drift)**: N findings (CRITICAL: N, HIGH: N, MEDIUM: N, LOW: N)
**Total findings**: N

**Lifecycle status**: verified | pending | not-applicable

**By harness** (Phase 1):

- [Harness Name]: N findings (C:N, H:N, M:N, L:N)
```
