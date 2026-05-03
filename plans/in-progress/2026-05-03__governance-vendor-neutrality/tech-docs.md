# Technical Documentation — Governance Vendor-Neutrality

## Architecture

### Current State

`governance/` contains vendor-specific content in load-bearing prose:

| File | Issue | Target |
| ---- | ----- | ------ |
| `governance/development/agents/model-selection.md` | Concrete model names, benchmark citations | Rewrite using capability tiers; link to docs/reference/ |
| `governance/README.md` | Layer 4 references `.claude/agents/` | Replace with "platform binding agents" |
| `governance/repository-governance-architecture.md` | Skills delivery role clarification | Clarify Skills are delivery infra |
| `governance/principles/` | Any model-name citations | Rewrite using tier language |

### Target State

```
governance/                          # Vendor-neutral prose
├── conventions/structure/          # Contains vendor-independence convention
├── development/agents/              # Uses capability tiers (planning/execution/fast)
└── README.md                        # Layer 4 → "platform binding agents"

docs/reference/                      # Vendor-specific technical specs
└── ai-model-benchmarks.md          # Canonical benchmark source

docs/explanation/                    # Vendor-specific concepts (if needed)
```

### Migration Strategy

**Benchmark data** (model scores, pricing, capability summaries):

- **Current**: Scattered in governance files referencing model tiers
- **Target**: `docs/reference/ai-model-benchmarks.md` (already exists, expand)
- **Diátaxis category**: Reference — technical specs users look up

**Governance rewrites** per vocabulary map:

| Vendor-specific term | Neutral replacement |
| -------------------- | ------------------- |
| "Claude Code" | "the coding agent" |
| "Sonnet" / "Opus" / "Haiku" | capability tier (planning-grade, execution-grade, fast) |
| `.claude/agents/` | "the agent definition file" or platform-binding reference |
| "Anthropic" | drop or "model vendor" |

## File Impact

### Files to Modify

- `governance/development/agents/model-selection.md` — Remove benchmark prose, use capability tiers
- `governance/README.md` — Update Layer 4 description, replace vendor paths
- `governance/repository-governance-architecture.md` — Clarify Skills delivery role
- `governance/conventions/structure/governance-vendor-independence.md` — Verify migration completeness

### Files to Create/Expand

- `docs/reference/ai-model-benchmarks.md` — Ensure comprehensive benchmark coverage
- `governance/README.md` — Add vendor-specific content test to layer-test guidance

## Dependencies

- `rhino-cli governance vendor-audit` — Validation tool
- `docs/reference/ai-model-benchmarks.md` — Must be comprehensive before governance links to it

## Rollback

If issues arise:

1. Revert governance file changes (git revert)
2. Benchmark data remains in `docs/reference/` (safe, reference material)
3. Re-run audit to confirm governance is restored
