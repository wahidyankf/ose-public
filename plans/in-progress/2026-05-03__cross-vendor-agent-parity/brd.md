# Business Requirements Document — Cross-Vendor Agent Parity

## Business Rationale

### Why This Work Matters

`governance/` must be readable and actionable by any contributor — human or agent — regardless of which AI coding platform they use. **Prose neutrality in `governance/` is necessary but not sufficient.** AGENTS.md is the canonical root instruction file read natively by OpenCode, OpenAI Codex CLI, and Aider per [`docs/reference/platform-bindings.md`](../../../docs/reference/platform-bindings.md); CLAUDE.md is a thin shim that imports AGENTS.md. Vendor terms in AGENTS.md propagate to every non-Claude agent at session boot, and behavioral parity additionally depends on:

- Binding sync (`.claude/agents/*.md` ↔ `.opencode/agents/*.md`) being current
- Color-translation map covering every named color used in agent frontmatter
- Capability-tier map covering every model tier referenced in agent frontmatter

**Current problem**: Governance prose contains vendor-specific terms (model names, benchmark scores, vendor paths). Additionally, AGENTS.md and CLAUDE.md are currently out of scope for the vendor-independence convention even though AGENTS.md is the highest-leverage cross-vendor instruction surface. The binding-sync layer also has no automated parity check, so silent drift between `.claude/` and `.opencode/` is currently invisible.

**Impact of not fixing**:

- Governance becomes tied to one vendor, violating the accessibility-first principle
- Contributors on OpenCode / Codex CLI / Aider receive vendor-coupled instructions at session boot via AGENTS.md
- Silent drift between `.claude/` and `.opencode/` causes non-Claude contributors to invoke a different (or non-existent) agent than Claude-Code contributors

### Affected Roles

The maintainer wears the following hats while executing this plan:

- **Governance author** — writes and updates governance prose; produces vendor-neutral output by default
- **Convention amender** — modifies `governance-vendor-independence.md` to bring AGENTS.md / CLAUDE.md in scope (load-bearing convention change; cascades to every future audit)
- **AGENTS.md / CLAUDE.md author** — applies vocabulary map to the canonical root instruction file
- **Binding-parity verifier** — runs sync, compares counts, validates color map and capability-tier map coverage

The agents that consume the artifacts:

- `repo-rules-checker` — audits governance and (after amendment) AGENTS.md / CLAUDE.md
- `plan-executor` — relies on rules being toolchain-agnostic
- Any AI coding agent that reads AGENTS.md natively (OpenCode, Codex CLI, Aider) — receives vendor-neutral instructions after this plan
- Future platform adopters — onboard via AGENTS.md without vendor-coupled assumptions

### Success Metrics

- `rhino-cli governance vendor-audit governance/` returns 0 violations (Phase 0 may already show this — judgment call: re-baseline before assuming remediation work remains)
- `rhino-cli governance vendor-audit AGENTS.md CLAUDE.md` (or equivalent invocation against those two files after convention amendment) returns 0 violations outside `binding-example` fences and "Platform Binding Examples" sections
- `npm run sync:claude-to-opencode` is a no-op on a freshly-synced tree
- `.claude/agents/*.md` count matches `.opencode/agents/*.md` count (currently 70 vs 71 — `.opencode` has one orphan `ci-monitor-subagent.md` that `.claude` does not have; this plan will investigate and resolve)
- Every named color used in `.claude/agents/*.md` frontmatter has a corresponding entry in the color-translation map in `governance/development/agents/ai-agents.md`
- Every model tier referenced in `.claude/` and `.opencode/` agent frontmatter has a corresponding entry in `governance/development/agents/model-selection.md`
- Governance layer-test guidance includes a vendor-specific content decision
- `repo-parity-checker` (green) and `repo-parity-fixer` (yellow) agents exist in `.claude/agents/` and are mirrored to `.opencode/agents/` by `npm run sync:claude-to-opencode`
- `nx run rhino-cli:validate:cross-vendor-parity` exits 0 on a green tree (all five invariants pass) and is wired into `.husky/pre-push`
- `governance/workflows/repo/repo-cross-vendor-parity-quality-gate.md` workflow exists, follows the same iterative check-fix-verify pattern as `plan-quality-gate.md`, and terminates on double-zero on a green tree

> Reasoning basis: The 70 vs 71 count was verified via `find .claude/agents -name "*.md" ! -name "README.md" | wc -l` (70) and `find .opencode/agents -name "*.md" ! -name "README.md" | wc -l` (71) on 2026-05-03; `.opencode` has one extra file (`ci-monitor-subagent.md`) not present in `.claude`. This is an observable fact, not a fabricated metric. All other success metrics are check-or-fail invariants (binary: passes or fails the named command), not estimated targets.

### Business Scope — In

- Governance files in `governance/` directory (including `ai-agents.md` explicitly)
- Benchmark data in `docs/reference/`
- Layer-test documentation updates
- Convention amendment of `governance-vendor-independence.md` (Scope section + Exceptions list)
- AGENTS.md and CLAUDE.md at repo root (newly in scope after convention amendment)
- Behavioral-parity verification of `.claude/` ↔ `.opencode/` binding sync (count parity, color map, tier map)
- New `repo-parity-checker` + `repo-parity-fixer` agents, `repo-cross-vendor-parity-quality-gate` workflow, and `validate:cross-vendor-parity` Nx target wired into pre-push hook (Phase 6 — operationalizes Phase 5's manual checks so they cannot decay over time)

### Business Scope — Out

- Platform binding directories `.claude/` and `.opencode/` content itself (only their cross-counts and synced state are checked, not their internal correctness)
- Parent repo `ose-projects/` `AGENTS.md` and `CLAUDE.md` — different repository; gitlink boundary forbids cross-edits in this plan
- `plans/` directory (intentionally remains out of scope per convention)
- ~~`docs/reference/platform-bindings.md` catalog~~ — Aider entry is in scope for factual-accuracy correction (web research 2026-05-03 found Aider's own docs only document `CONVENTIONS.md`, not AGENTS.md); rest of catalog continues to reference vendors by design

### Business Risks

1. **Incomplete migration in governance prose**
   - Mitigation: Run `rhino-cli governance vendor-audit` and require 0 violations before push
2. **Convention-amendment cascade** — bringing AGENTS.md / CLAUDE.md into scope retroactively flags content that was previously legal. New violations surface immediately.
   - Mitigation: Convention amendment phase runs BEFORE the AGENTS.md / CLAUDE.md audit phase; remediation is scheduled in the same plan
3. **Binding-sync drift hidden by no-automated-check** — pre-existing 70 vs 71 count delta; `.opencode` has one orphan `ci-monitor-subagent.md` not present in `.claude`, suggesting a `.claude` agent was deleted after the last sync
   - Mitigation: Phase 5 surfaces drift via explicit count check; investigate the orphan before re-running `npm run sync:claude-to-opencode` (sync may delete the orphan); commit resolution after investigation
4. **Color-translation gap** — a `.claude/agents/` file uses a named color (e.g., `blue`, `purple`) that has no entry in the translation map → current OpenCode may reject the synced file (docs enumerate only hex and theme tokens as valid; named-color rejection behavior is observed but not explicitly stated in public docs)
   - Mitigation: Phase 5 cross-checks every named color in agent frontmatter against the map; missing entries become findings to fix in this plan
5. **Capability-tier gap** — a `.claude/` or `.opencode/` agent file references a model tier with no map entry → tier-to-model resolution fails for one or more agents
   - Mitigation: Phase 5 cross-checks every tier reference against the map
6. **Broken benchmark references** — Governance links to `docs/reference/` but content incomplete
   - Mitigation: Verify `docs/reference/ai-model-benchmarks.md` is comprehensive before pushing

### Non-Goals

- Rewriting `.claude/` or `.opencode/` agent definition file bodies (only their counts and synced state matter for this plan)
- Creating new platform bindings for additional vendors
- Touching parent-repo `AGENTS.md` / `CLAUDE.md` (different repo)
- Removing the `plans/` exclusion from the convention (plans intentionally permit vendor-specific implementation discussion)
