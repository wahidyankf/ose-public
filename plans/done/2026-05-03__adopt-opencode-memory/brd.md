# Business Requirements Document (BRD)

## Why This Plan Exists

### Business Goal

Reduce token consumption in OpenCode agent sessions by ~75% through compression-based communication (caveman), and explore cross-agent memory persistence (cavemem) to eliminate redundant context-setting in multi-IDE workflows.

### Business Impact

| Aspect                  | Current State | Expected Outcome                              | Actual State (2026-05-03)                     |
| ----------------------- | ------------- | --------------------------------------------- | --------------------------------------------- |
| caveman installation    | Not started   | ~75% token reduction via compression          | NOT installed for OpenCode (only Claude Code) |
| cavemem installation    | Not started   | Cross-agent persistent memory                 | ✅ Installed as MCP server (v0.1.3)           |
| Cross-agent memory test | Not tested    | Shared SQLite store accessible from both IDEs | Partially complete (MCP wired, not tested)    |

**Rationale**: RTK already filters output tokens at the CLI layer. caveman compresses input/output at the agent communication layer (planned, NOT yet installed for OpenCode). The two stack additively — RTK (output) + caveman (input/output) = compounded savings. cavemem cross-agent memory (MCP server installed) eliminates repeated context-setting when switching between Claude Code and OpenCode on the same repo.

**Gut-based reasoning**: A typical agent session in this repo involves ~50–100 tool calls and ~15–30k output tokens. At 75% compression, that drops to ~4–8k tokens. Across 3–5 sessions per week per IDE (6–10 combined), the monthly token savings are substantial and measurable via `caveman-stats`.

### Affected Roles

- **Maintainer** (single hat): Wahidyan Kresna Fridayoka — wears all roles
- **Agents** that consume this document: `plan-checker`, `plan-execution-checker`
- **Agents** that consume the sibling `prd.md`: `plan-checker` for Gherkin validation

### Business-Level Success Metrics

| Metric                              | Measurement Method                                        | Notes                                                                                                         |
| ----------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Token reduction ≥75%                | `caveman-stats` before/after comparison                   | **Projected target** — upstream benchmarks show ~75% reduction (caveman repo, May 2026); verify post-adoption |
| caveman command functional          | `/caveman` returns help text in OpenCode session          |                                                                                                               |
| Cross-agent memory operational      | `cavemem search` returns context from Claude Code session |                                                                                                               |
| Zero technical accuracy degradation | Code/URLs/paths preserved byte-for-byte                   |                                                                                                               |

### Business-Scope Non-Goals

- Installing caveman/cavemem for **Claude Code** — separate concern (different IDE, separate config)
- Adopting AGPL-3.0 tools — `claude-mem` explicitly rejected due to license incompatibility
- Cloud memory services — `supermemory`, `mem0` rejected (Pro required or cloud-only)
- cavekit — spec-driven build tool, different purpose, out of scope

### Business Risks and Mitigations

| Risk                                                | Likelihood | Impact | Mitigation                                                             |
| --------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------- |
| cavemem too early-stage (v0.1.3) for production use | Medium     | Low    | Defer cavemem evaluation; focus on caveman first                       |
| caveman compression degrades technical accuracy     | Low        | High   | byte-for-byte preservation of code/URLs/paths verified via tests       |
| OpenCode agent incompatibility                      | Low        | High   | caveman explicitly lists OpenCode support; install script auto-detects |
| Token savings not measurable                        | Low        | Medium | Use `caveman-stats` for baseline and post-adoption comparison          |

### Constraints

- **MIT license** — all adopted tools must be MIT-licensed (hard constraint; AGPL-3.0 rejected)
- **Dual IDE setup** — Claude Code + OpenCode; cross-agent memory is valuable
- **Existing RTK adoption** — caveman is complementary, not redundant
- **`.claude/` source of truth** — `.opencode/` is auto-synced; rules go in `.claude/` and propagate
- **Pre-commit hooks** — handle agent file syncing between platforms
