# Technical Documentation — Cross-Vendor Agent Parity

## Architecture

### Current State

`governance/` may contain vendor-specific content in load-bearing prose. AGENTS.md and CLAUDE.md are currently excluded from the vendor-independence convention even though AGENTS.md is the highest-leverage cross-vendor instruction surface (read natively by OpenCode, Codex CLI, Aider). The binding-sync layer has no automated count-parity / color-map / tier-map check — `.claude/agents/*.md` and `.opencode/agents/*.md` already differ (73 vs 71 as of 2026-05-03 ~3:48pm GMT+7).

| File / Surface                                                                  | Issue                                                                                                                                      | Target                                                                                                                                                                              |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `governance/development/agents/model-selection.md`                              | Concrete model names, benchmark citations                                                                                                  | Rewrite using capability tiers; link to docs/reference/                                                                                                                             |
| `governance/development/agents/ai-agents.md`                                    | Vendor-specific examples (color translation map, OpenCode 1.14.31+ note, etc.) likely in load-bearing prose                                | Wrap vendor specifics in `binding-example` fences; neutralize surrounding prose                                                                                                     |
| `governance/README.md`                                                          | Layer 4 references `.claude/agents/`; missing vendor-specific content test                                                                 | Replace with "platform binding agents"; add layer-test entry                                                                                                                        |
| `governance/repository-governance-architecture.md`                              | Skills delivery role clarification                                                                                                         | Clarify Skills are delivery infra                                                                                                                                                   |
| `governance/principles/`                                                        | Any model-name citations                                                                                                                   | Rewrite using tier language                                                                                                                                                         |
| `governance/conventions/structure/governance-vendor-independence.md`            | Currently excludes AGENTS.md / CLAUDE.md from scope                                                                                        | Amend Scope section + Exceptions list to include both; preserve `plans/` exclusion                                                                                                  |
| `AGENTS.md` (repo root)                                                         | Currently out of scope; contains vendor-specific terms (`.claude/`, "Claude Code", model IDs)                                              | Apply vocabulary map; wrap vendor specifics in `binding-example` fences                                                                                                             |
| `CLAUDE.md` (repo root)                                                         | Currently out of scope; should remain a thin shim importing AGENTS.md                                                                      | Verify it remains a shim; if it duplicates load-bearing AGENTS.md content, consolidate; allow Claude-specific content under "Platform Binding Examples" or `binding-example` fences |
| `.claude/agents/*.md` ↔ `.opencode/agents/*.md` count drift (73 vs 71 observed) | No automated parity check                                                                                                                  | Run `npm run sync:claude-to-opencode` and verify counts equalize                                                                                                                    |
| Color-translation map in `ai-agents.md`                                         | No automated coverage check vs `.claude/agents/*.md` frontmatter colors                                                                    | Cross-check; missing entries become findings                                                                                                                                        |
| Capability-tier map in `model-selection.md`                                     | No automated coverage check vs `.claude/` and `.opencode/` agent frontmatter tiers                                                         | Cross-check; missing entries become findings                                                                                                                                        |
| `docs/reference/platform-bindings.md` (Aider entry)                             | Lists Aider as native AGENTS.md reader; Aider's own docs (<https://aider.chat/docs/usage/conventions.html>) only document `CONVENTIONS.md` | Correct Aider entry to reflect CONVENTIONS.md as documented file; AGENTS.md support is claimed by agents.md standard site but not by Aider                                          |

### Target State

```
governance/                          # Vendor-neutral prose
├── conventions/structure/
│   └── governance-vendor-independence.md   # Amended: AGENTS.md + CLAUDE.md now in-scope
├── development/agents/
│   ├── model-selection.md                  # Capability tiers; tier map covers every used tier
│   ├── ai-agents.md                        # binding-example fences for color map + version notes
│   └── ...
└── README.md                                # Layer 4 → "platform binding agents"; layer-test includes vendor-specific content test

docs/reference/                      # Vendor-specific technical specs
└── ai-model-benchmarks.md          # Canonical benchmark source

AGENTS.md                            # Vendor-neutral prose; vendor specifics inside fences
CLAUDE.md                            # Thin Claude-Code shim; @AGENTS.md import preserved
                                     # (Claude-specific content allowed under fences/headings since CLAUDE.md is itself a binding shim)

.claude/agents/*.md == .opencode/agents/*.md  (count parity)
```

### Migration Strategy

**Benchmark data** (model scores, pricing, capability summaries):

- **Current**: Scattered in governance files referencing model tiers
- **Target**: `docs/reference/ai-model-benchmarks.md` (already exists, expand)
- **Diátaxis category**: Reference — technical specs users look up

**Governance / AGENTS.md / CLAUDE.md rewrites** per vocabulary map:

| Vendor-specific term        | Neutral replacement                                                                |
| --------------------------- | ---------------------------------------------------------------------------------- |
| "Claude Code"               | "the coding agent" (load-bearing prose); preserved inside `binding-example` fences |
| "Sonnet" / "Opus" / "Haiku" | capability tier (planning-grade, execution-grade, fast)                            |
| `.claude/agents/`           | "the agent definition file" or `<platform-binding>/agents/`                        |
| "Anthropic"                 | drop or "model vendor"                                                             |

(Full map lives in `governance/conventions/structure/governance-vendor-independence.md` Vocabulary Map table; this plan executes against that map.)

**CLAUDE.md special-case treatment**: CLAUDE.md is a Claude-Code-specific shim by design. It MAY contain vendor terms but only inside `binding-example` fences or under a "Platform Binding Examples" heading after the convention amendment. The single `@AGENTS.md` import line counts as an inline binding directive and is allowed.

## File Impact

### Files to Modify

**Phase 1-3 (governance prose, conditional on Phase 0 baseline)**:

- `governance/development/agents/model-selection.md` — Remove benchmark prose, use capability tiers; ensure tier map covers every tier used in `.claude/` and `.opencode/` agent frontmatter
- `governance/development/agents/ai-agents.md` — Explicit modify target; wrap vendor-specific examples (color translation map entries, OpenCode 1.14.31+ note) in `binding-example` fences; neutralize surrounding prose; ensure color-translation map covers every named color used in `.claude/agents/*.md` frontmatter
- `governance/README.md` — Update Layer 4 description, replace vendor paths, add vendor-specific content test to layer-test guidance
- `governance/repository-governance-architecture.md` — Clarify Skills delivery role
- `governance/principles/**/*.md` — Audit and rewrite any model-name citations

**Phase X (convention amendment, blocking for Phase 4)**:

- `governance/conventions/structure/governance-vendor-independence.md` — Amend Scope section to include AGENTS.md and CLAUDE.md; remove them from the Exceptions list; preserve `plans/` exclusion; add a note explaining that CLAUDE.md is a Claude-Code-specific shim where vendor terms are allowed inside fences and Platform Binding Examples sections

**Phase 4 (newly in scope)**:

- `AGENTS.md` (repo root) — Apply vocabulary map; wrap any remaining vendor-specific examples in `binding-example` fences
- `CLAUDE.md` (repo root) — Verify single-line `@AGENTS.md` import is preserved; consolidate any duplicated load-bearing content; ensure all Claude-Code-specific content sits inside fences or under "Platform Binding Examples" headings

**Phase 5 (behavioral-parity invariants — verification, not modification)**:

- `.claude/agents/*.md` and `.opencode/agents/*.md` — read-only inspection of frontmatter for color and tier values; count comparison; sync drift fix only (re-run `npm run sync:claude-to-opencode` + commit if drift exists)

### Files to Create/Expand

- `docs/reference/ai-model-benchmarks.md` — Ensure comprehensive benchmark coverage for every model referenced in `governance/`, AGENTS.md, and CLAUDE.md
- `governance/README.md` — Add vendor-specific content test to layer-test guidance

## Behavioral-Parity Verification Commands

These commands implement Phase 5 invariants. They are inspection-only (no writes besides `sync:claude-to-opencode` if drift is found).

```bash
# 1. Sync layer must be a no-op on a freshly-synced tree
npm run sync:claude-to-opencode
git status                                                   # Must show no modified files; if any, commit drift then re-run

# 2. Agent count parity (currently 73 vs 71 — drift exists)
ls .claude/agents/*.md | wc -l
ls .opencode/agents/*.md | wc -l                             # Counts must match

# 3. Diff which agents are missing on either side (helps debug count drift)
diff <(ls .claude/agents/ | sort) <(ls .opencode/agents/ | sort)

# 4. Extract every named color used in .claude/agents/*.md frontmatter
grep -h "^color:" .claude/agents/*.md | sort -u

# 5. Extract every model tier used in agent frontmatter (both bindings)
grep -h "^model:" .claude/agents/*.md .opencode/agents/*.md | sort -u

# 6. Cross-check #4 against the color-translation map in ai-agents.md
grep -A2 "Dual-Mode Color Translation" governance/development/agents/ai-agents.md

# 7. Cross-check #5 against the capability-tier map in model-selection.md
grep -A2 "capability tier" governance/development/agents/model-selection.md

# 8. Final audit (after all remediation)
go run apps/rhino-cli/main.go governance vendor-audit governance/
go run apps/rhino-cli/main.go governance vendor-audit AGENTS.md CLAUDE.md   # After convention amendment
```

If `rhino-cli governance vendor-audit` does not yet accept arbitrary file targets (only `governance/` directory by default), Phase 4 prep includes either extending the CLI to accept file paths OR running an equivalent grep against AGENTS.md / CLAUDE.md using the combined audit regex from the convention.

## External Standards Verification (web research 2026-05-03)

Verified via `web-research-maker` against current public docs. Findings inform plan scope and surface a factual-accuracy correction for `docs/reference/platform-bindings.md`.

| Claim                                                                                        | Status           | Source                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AGENTS.md is a Linux Foundation / Agentic AI Foundation standard                             | Verified         | <https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation> (announced 2025-12-09)                                    |
| OpenCode reads AGENTS.md natively                                                            | Verified         | <https://opencode.ai/docs/rules/>                                                                                                                                       |
| OpenCode reads `.claude/skills/<name>/SKILL.md` natively (one of multiple paths)             | Verified         | <https://opencode.ai/docs/skills/> (also reads `.opencode/skills/`, `.agents/skills/`)                                                                                  |
| OpenAI Codex CLI reads AGENTS.md natively                                                    | Verified         | <https://developers.openai.com/codex/guides/agents-md>                                                                                                                  |
| Aider reads AGENTS.md natively                                                               | **Error**        | Aider's own docs (<https://aider.chat/docs/usage/conventions.html>) only document `CONVENTIONS.md`. agents.md self-reported list claims Aider; Aider's own docs do not. |
| OpenCode rejects named CSS colors; only hex or theme tokens valid                            | Verified         | <https://opencode.ai/docs/agents/> (`primary`, `secondary`, `accent`, `success`, `warning`, `error`, `info`)                                                            |
| OpenCode 1.14.31 specifically introduced color rejection                                     | Unverifiable     | No public changelog entry pinning the cutoff to 1.14.31. Plan substitutes "current OpenCode".                                                                           |
| "planning-grade / execution-grade / fast" is community-recognized capability-tier vocabulary | Internal coinage | No external usage found. Plan adds a one-line note to `model-selection.md` clarifying this is repo-internal vocabulary.                                                 |

**Plan adjustments driven by these findings**:

- Aider entry in `docs/reference/platform-bindings.md` and `AGENTS.md` (Platform Bindings section) now in scope (Phase 4 sub-task) — fix the documented-file claim
- "OpenCode 1.14.31+" wording in `governance/development/agents/ai-agents.md` to be replaced with "current OpenCode"
- Capability-tier internal-coinage note added to `governance/development/agents/model-selection.md`

## Dependencies

- `rhino-cli governance vendor-audit` — Validation tool for governance/, AGENTS.md, CLAUDE.md (post-amendment)
- `npm run sync:claude-to-opencode` — Binding-sync command
- `docs/reference/ai-model-benchmarks.md` — Must be comprehensive before governance / AGENTS.md links to it
- `governance/conventions/structure/governance-vendor-independence.md` — Amended in Phase X; blocks Phase 4

## Rollback

If issues arise:

1. **Governance prose** — `git revert` the governance file changes; benchmark data remains in `docs/reference/` (safe, reference material)
2. **Convention amendment** — `git revert` the convention amendment; AGENTS.md / CLAUDE.md fall back to out-of-scope
3. **AGENTS.md / CLAUDE.md** — `git revert`; agents at session boot re-read previous content
4. **Binding-sync drift fix** — `npm run sync:claude-to-opencode` is idempotent; re-running re-stabilizes the tree
5. Re-run audit to confirm restoration
