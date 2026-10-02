---
description: The requirement that *-checker agents write reports to their per-family local-tmp/ directory with required tools.
when_to_use: Use when building or reviewing a *-checker agent.
---

# Mandatory Report Generation for Checker Agents

**CRITICAL REQUIREMENT**: All \*-checker agents MUST write their validation/audit reports to
`local-tmp/<agent-family>/`. This is a hard requirement for consistency and traceability across all
checker agent families.

**This supersedes the previous requirement to write to `generated-reports/`.** A checker's audit
report is read by a fixer, not by a human who asked for it by name, so it fails the second question
of [The Rule](./overview-and-the-rule.md)'s test. What did **not** change: the `Write` + `Bash` tool
requirement below, the report filename pattern, UUID chains, timestamps, and the
[progressive-writing requirement](./generated-reports-and-progressive-writing.md). Only the parent
directory moved.

## Checker Agents That Must Generate Reports

All checker agents in the following families MUST write audit reports to `local-tmp/<agent-family>/`, using the family token each declares in its own body:

1. **rules-checker** - Repository consistency validation
2. **content-checker** - General content validation (ayokoding-www)
3. **tutorial-by-example-checker** - By-example tutorial validation (ayokoding-www)
4. **content-checker** - Educational content factual accuracy validation
5. **apps-ayokoding-www-link-checker** - Link validation (ayokoding-www)
6. **content-checker** - Content validation (ose-www, Next.js)
7. **docs-checker** - Documentation factual accuracy validation
8. **docs-link-checker** - External and internal link validation
9. **docs-tutorial-checker** - Tutorial quality validation
10. **readme-checker** - README quality validation
11. **plan-checker** - Plan readiness validation
12. **plan-execution-checker** - Implementation validation
13. **tutorial-in-the-field-checker** - In-the-field content validation (ayokoding-www)
14. **docs-software-engineering-separation-checker** - Software engineering docs separation validation
15. **repo-workflow-checker** - Workflow documentation quality validation
16. **specs-checker** - Gherkin/BDD specs directory structural and content validation
17. **swe-code-checker** - Software code quality validation

**NO EXCEPTIONS**: Checker agents MUST NOT output results in conversation only. All validation findings MUST be written to audit report files.

## Required Tool Permissions

All checker agents MUST have both `Write` and `Bash` tools in their frontmatter:

- **Write tool** - Required for creating report files in `local-tmp/<agent-family>/`
- **Bash tool** - Required for generating UTC+7 timestamps using `TZ='Asia/Jakarta' date +"%Y-%m-%d--%H-%M"`

**Example frontmatter**:

```yaml
---
name: example-checker
description: Validates example content against conventions
tools: Read, Glob, Grep, Write, Bash
model: inherit
color: green
---
```

## Report File Naming Pattern

The pattern is unchanged; only its parent directory is now `local-tmp/<agent-family>/`. Agents run
`mkdir -p local-tmp/<agent-family>/` before the first write — the tracked `.gitkeep` guarantees only
that `local-tmp/` itself exists.

All checker agents MUST follow the universal naming pattern:

```
{agent-family}__{uuid-chain}__{YYYY-MM-DD--HH-MM}__{type}.md
```

**Components** (4 parts separated by `__`):

- `{agent-family}`: the token the agent **declares** in its own body (e.g., `repo-rules`, `ayokoding-web`, `docs`, `plan`). It is never derived from the filename, the folder, or the agent's own name; where a historical filename prefix disagrees with the declaration, the declaration wins
- `{uuid-chain}`: Execution hierarchy as underscore-separated 6-char UUIDs (e.g., `a1b2c3`, `a1b2c3_d4e5f6`)
- `{YYYY-MM-DD--HH-MM}`: Timestamp in UTC+7 (double dash between date and time)
- `{type}`: Report type suffix (`audit`, `validation`, `fix`)
