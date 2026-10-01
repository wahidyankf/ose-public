# Pre-Write Verification — Recipes and Plain Citations (Anti-Hallucination — HARD)

Before writing any non-trivial factual claim into a plan, run the verification recipe for the claim's category. Hallucinated content (fabricated file paths, invented Nx targets, made-up versions, fictitious APIs, fabricated KPIs) turns a plan into broken work the moment execution begins. Verify at authoring time — it is the cheapest place to catch fabrication.

See [Plan Anti-Hallucination Convention](../../../../repo-governance/development/quality/plan-anti-hallucination.md) for the authoritative rules.

## Verification Recipes

| Claim Category    | Verification Command                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| File path         | `Bash test -f <path>` or `Glob`; if NEW, mark inline as `_New file_`                            |
| Directory path    | `Bash test -d <path>`                                                                           |
| Symbol / function | `Grep` against the codebase                                                                     |
| Nx target         | Read `apps/<project>/project.json` and confirm under `targets`                                  |
| Package version   | `jq` the relevant manifest (`package.json`, `go.mod`, `Cargo.toml`, etc.)                       |
| API signature     | Delegate to `web-researcher` with authoritative-doc URL                                         |
| Command flag      | `<cmd> --help` OR repo-doc reference                                                            |
| Test name         | `Grep` test files; if NEW, mark `_New test_`                                                    |
| Agent / skill     | `Bash test -f .agents/agents/<name>.md` (flat) or `Bash test -f .agents/skills/<name>/SKILL.md` |
| External standard | Delegate to `web-researcher`; cite URL + access date + excerpt                                  |
| Behaviour claim   | `web-researcher` with cited official-doc excerpt                                                |
| Cross-link target | `Bash test -f` on the resolved relative path                                                    |
| Numeric KPI       | Forbidden as bare fact; observable check / cited measurement / worded expectation only          |

## No Inline Confidence Labels

Write no inline confidence label — `[Repo-grounded]`, `[Web-cited]`, `[Judgment call]`, or
`[Unverified]` — on any plan claim:

- **Repo claims** — run the recipe above before writing; the verification is the evidence.
- **External claims** — a plain inline citation: URL + access date + excerpt.
- **Gut targets** — worded as an expectation ("we expect …; no baseline measured").
- **Unverifiable claims** — refused per the refuse-on-uncertainty rule.

`plan-checker` verifies every claim and never flags a missing label. See
[No Inline Confidence Labels](../../../../repo-governance/development/quality/plan-anti-hallucination/no-inline-confidence-labels.md).

See [refuse-uncertainty-and-anti-patterns.md](refuse-uncertainty-and-anti-patterns.md) for what to do when verification fails.
