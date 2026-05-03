# Business Requirements Document — Governance Vendor-Neutrality

## Business Rationale

### Why This Work Matters

`governance/` must be readable and actionable by any contributor—human or agent—regardless of which AI coding platform they use. Vendor-specific implementation details belong in platform-binding directories and `docs/` following Diátaxis framework.

**Current problem**: Governance prose contains vendor-specific terms (model names, benchmark scores, vendor paths) that:

- Exclude contributors using other AI coding agents (Cursor, Codex CLI, Aider, etc.)
- Couple governance correctness to a specific vendor's product lifecycle
- Create maintenance debt when vendor names or APIs change

**Impact of not fixing**: Governance becomes tied to one vendor, violating the accessibility-first principle and creating friction for the broader contributor community.

### Affected Roles

- **All contributors** using any AI coding agent
- **AI agents** executing governance rules
- **Future platform adopters** (new vendor bindings)

### Success Metrics

- Zero vendor-specific terms in `governance/` prose (outside allowlisted regions)
- All benchmark data accessible via `docs/reference/`
- Governance layer-test guidance includes vendor-specific content decision

### Business Scope — In

- Governance files in `governance/` directory
- Benchmark data in `docs/reference/`
- Layer-test documentation updates

### Business Scope — Out

- Platform binding directories (`.claude/`, `.opencode/`) — already correct
- `AGENTS.md`, `CLAUDE.md` at repo root — explicitly out of scope
- `plans/` — explicitly out of scope
- `docs/reference/platform-bindings.md` catalog — by definition references vendors

### Business Risks

1. **Incomplete migration** — Some vendor-specific content remains in governance prose
   - **Mitigation**: Run `rhino-cli governance vendor-audit` to validate zero violations
2. **Broken benchmark references** — Governance links to `docs/reference/` but content incomplete
   - **Mitigation**: Verify `docs/reference/ai-model-benchmarks.md` is comprehensive before pushing

### Non-Goals

- Rewriting `.claude/` or `.opencode/` agent definition files
- Creating new platform bindings for other vendors
- Changing `AGENTS.md` root instruction file
