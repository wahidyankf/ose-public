# Steps 1-2: Core Repository Validation and Agent-to-Agent Duplication

## Step 1: Core Repository Validation

**Deterministic-gate annotation**: file naming, frontmatter shape (No-Last-Updated convention),
and emoji codepoints are enforced by the deterministic `./rhino md`/`convention` gates at
pre-commit and markdown CI — not in the `repo-governance audit` preflight envelope. Do not
AI-re-derive them; re-evaluate only linking correctness and semantic convention compliance not
caught mechanically.

**Path scope**: `repo-governance/**/*.md`, `.claude/agents/**/*.md`, `.agents/skills/**/*.md`,
`docs/**/*.md`, root instruction surfaces (`AGENTS.md`, `CLAUDE.md`, `README.md`), active plans
(`plans/in-progress/**/*.md`, `plans/backlog/**/*.md`). **Exempt**: website content
(`apps/ayokoding-www/`, `apps/ose-www/`, `apps/organiclever-www/`, `apps/wahidyankf-www/`),
`plans/done/` (immutable archive), registry-declared generated binding paths and regions,
`generated-reports/`, `local-tmp/`, `worktrees/`. Mixed-ownership binding roots are not exempt as
a whole; source and vendored paths remain in scope when another scope rule includes them.

Validates: file naming (**including ordinal prefixes** — AI-only; no gate decides whether an `NN-`
prefix marks a real step, per
[Ordinal Prefixes](../../../../repo-governance/conventions/structure/ordinal-filename-prefixes.md)),
linking, emoji usage, convention compliance, registry-gate consistency
(live hook/CI docs delegate command discovery to `gate list`, verified by `gate validate` — flag
embedded gate inventories or retired live-CI references), and the No-Last-Updated Convention (flag
`updated:` frontmatter or `**Last Updated**` footers in non-website files — HIGH — per
[No Manual Date Metadata Convention](../../../../repo-governance/conventions/structure/no-date-metadata.md);
date fields must not exist at all, not merely be correct).

## Convergence Mechanics (applies to every step below)

**Known False Positive Skip List**: before validation, load
`local-tmp/.known-false-positives.md` if it exists; before reporting any finding, check it
against the stable key `[category] | [file] | [brief-description]` — if matched, log as
`[PREVIOUSLY ACCEPTED FALSE_POSITIVE — skipped]` (informational, not counted).

**Re-validation Mode (Scoped Scan)**: when a multi-part UUID chain exists (e.g. `abc123_def456`),
check the latest fix report for a `## Changed Files (for Scoped Re-validation)` section — if
found, run Steps 1-7 normally on all files but run Step 8 (~265 software-doc files) only on
changed files; if not found, run a full scan.

## Step 2: Agent-to-Agent Duplication Detection

**Deterministic-gate annotation**: verbatim agent/skill duplication is caught by the `Rhino
harness` gate — do not AI-re-derive the verbatim-match portion; re-evaluate only paraphrased/
non-verbatim duplication.

Extract content blocks (>20 lines) from all `.claude/agents/` files, compare pairwise (N×(N-1)/2
pairs), and classify: **Verbatim** (CRITICAL, exact matches ≥30 lines), **Paraphrased** (HIGH,
same knowledge different wording, ≥20 lines), **Conceptual** (MEDIUM, same concepts different
structure, ≥15 lines).

**Duplication categories**: Methodology (same validation/fixing methodology, e.g. UUID
generation/report templates — 3+ agents, 50+ lines → extract to Skill, should reference
`repo-generating-validation-reports`); Domain Knowledge (same content conventions/organization
systems — 2+ agents, 30+ lines → extract or consolidate); Tool Usage Pattern (same tool
instructions — 3+ agents, 20+ lines → extract or reference AI Agents Convention);
Criticality/Confidence (any agent defining CRITICAL/HIGH/MEDIUM/LOW inline instead of referencing
`repo-assessing-criticality-confidence` — must reference the Skill).

**Consolidation vs extraction**: prefer **Extract to Skill** when content is reusable, appears in
3+ agents, and no Skill exists yet. **Consolidate Agents** only when agents serve nearly identical
purpose, combined size <1000 lines, no loss of focus. **Keep as Duplication** only when content is
agent-specific, context genuinely requires different wording, or duplication is <10 lines.

**Criticality**: CRITICAL (50+ lines across 5+ agents), HIGH (30-49 lines across 3-4 agents),
MEDIUM (20-29 lines across 2 agents), LOW (10-19 lines, acceptable).
