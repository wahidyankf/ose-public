# Business Rationale

## Problem Statement

The repository advertises **dual-mode AI agent and skill compatibility** (Claude
Code + OpenCode) as a core architectural property. CLAUDE.md states:

> Repo maintains dual compatibility with Claude Code and OpenCode:
> - `.claude/`: Source of truth (PRIMARY) — All updates happen here first
> - `.opencode/`: Auto-generated (SECONDARY) — Synced from `.claude/`

This promise depends on `npm run sync:claude-to-opencode` producing files
OpenCode actually loads, and on `npm run validate:sync` correctly reflecting
sync health. Neither holds today:

- `rhino-cli agents sync` writes agent markdown to `.opencode/agent/`
  (singular). Per the [OpenCode Agents docs](https://opencode.ai/docs/agents/)
  (verified 2026-05-02), OpenCode searches `.opencode/agents/` (plural) only.
  Result: **70+ synced agents are likely invisible to every OpenCode session**.
- The matching skill output `.opencode/skill/` is also non-canonical
  (docs say `.opencode/skills/`), and is also redundant because
  [OpenCode Skills docs](https://opencode.ai/docs/skills/) confirm OpenCode
  reads `.claude/skills/` natively.
- `npm run validate:sync` passes today because it validates `.opencode/agent/`
  against itself, not against what OpenCode actually consumes. Green
  validation, broken behavior — the worst kind of false positive.

## Why It Matters Now

The plan [`2026-04-30__adopt-opencode-go/`](../2026-04-30__adopt-opencode-go/README.md)
proposes switching the model-mapping from `zai-coding-plan/glm-5.1` to
`opencode-go/minimax-m2.7`. Its delivery checklist includes
`npm run validate:config` (sync + validation green) as a quality gate. That
gate passes today against broken paths. If we ship opencode-go on top of the
broken sync, every developer would:

1. Pay $5–$10/month for OpenCode Go.
2. Open OpenCode and find a near-empty agent roster (only the 1 Nx-generated
   subagent in the plural path).
3. Lose every Maker / Checker / Fixer / SWE-* agent the repo defines.
4. Have no validator complaint to debug from — `validate:sync` would still be
   green.

Fixing the sync foundation first is cheaper than fielding that incident,
debugging it cold, and re-running the migration. It also unblocks any future
plan that wants to expand sync capability (per-agent `permission:` blocks,
agent-level overrides in `opencode.json`, hook propagation).

## Cost of Doing Nothing

| Risk | Likelihood | Impact |
| ---- | ---------- | ------ |
| OpenCode Go migration ships against broken paths; agents invisible | High | Developers cannot use OSE Platform's specialized agents in OpenCode at all; key advertised capability silently absent |
| Future Claude Code spec additions (new field, new color, new model) hard-fail `validate:claude` | High (3+ field additions in last 12 months) | Pre-push hook blocks commits; one-line fixes blocked by sync tooling |
| Two parallel directory layouts (`.opencode/agent/` vs `.opencode/agents/`) drift further | High | Confusion compounds; new agents land in wrong dir; diff noise grows |
| `tools:` deprecated map continues; OpenCode removes support in a future release | Medium | All synced agents lose tool gating overnight; emergency triage |
| Skill validator silently strips Claude Code-only fields (`disable-model-invocation`, etc.) without warning | Medium | Skills with `disable-model-invocation: true` may auto-invoke unexpectedly in Claude Code if validator drops the field during reformat |

## Affected Roles

- **Developer hat (OpenCode user)**: The maintainer working through OpenCode
  sessions relies on all `.claude/agents/` entries being visible in OpenCode.
  Today this hat cannot rely on agent availability.
- **Developer hat (rhino-cli contributor)**: The maintainer adding or modifying
  agents needs a stable validator/sync contract to test against.
- **`repo-ose-primer-propagation-maker` agent**: Propagates `.claude/` and
  `.opencode/` artifacts to the ose-primer template. Broken paths replicate
  the bug downstream if propagated before this fix.
- **`plan-execution-checker` agent**: Verifies this plan's delivery outcomes
  against acceptance criteria on completion.

## Decision Drivers

1. **Spec fidelity over backward compatibility**: OpenCode docs are the
   contract. If our sync writes elsewhere, we're wrong, not them. Even if
   OpenCode currently silently tolerates the singular path (unverified;
   docs do not list it), depending on undocumented behavior is fragile.
2. **Source of truth invariance**: This plan does **not** modify `.claude/`
   content. The fix is on the sync output side and on the validator side.
3. **Test-first**: Every fix lands with a failing test that turns green.
   Spec-fidelity tests are the deliverable that prevents regression after the
   next Claude Code or OpenCode spec drift.
4. **Decision-not-deferral**: The plan **decides** policy on all 14 audit
   findings (including `tools:` vs `permission:` and skill-copy redundancy).
   Implementation of large-surface-area changes (e.g., full migration to
   `permission:` block) may be deferred to a follow-up plan, but the
   decision is recorded here so the next plan inherits a clear handoff.

## Success Definition

1. **OpenCode loads every synced agent**: opening OpenCode in this repo, the
   agent roster contains all entries from `.claude/agents/` (verified by
   spot-check via `/agents` in the OpenCode TUI, AND by automated test that
   checks `.opencode/agents/<name>.md` exists for every `.claude/agents/<name>.md`).
2. **`validate:sync` reflects truth**: a deliberate corruption (e.g., delete
   one synced agent file or modify a model field) makes the validator fail.
   Today's validator does not fail when the singular-vs-plural path changes,
   because both are inputs to the same equality check.
3. **No false-positive validator failures on spec-valid input**: an agent
   declaring `color: red` or `model: claude-opus-4-7` does not cause
   `validate:claude` to fail.
4. **Single canonical output dir per artifact**: only one of
   `.opencode/agent/` or `.opencode/agents/` is tracked in git, populated by
   sync, and referenced in CLAUDE.md / README files. Same for skills.
5. **Pre-push hook continues to enforce sync correctness** without manual
   intervention; `lint-staged` and `validate:config` both green on a fresh
   clone after `npm install`.

## Out of Scope (Decisions, not Implementation)

- **Stronger `permission:` block emission** (per-agent `permission:` from
  Claude `tools` list): policy decided here, implementation deferred to a
  follow-up plan if/when OpenCode removes the deprecated `tools:` boolean
  map. Justification: cost-benefit not yet positive while `tools:` still works.
- **Full Claude Code field passthrough** (`memory`, `effort`, `isolation`,
  `background`, `initialPrompt`, `disallowedTools`, `permissionMode`,
  `maxTurns`, `mcpServers`, `hooks`): policy decided here (validator must not
  reject; converter may pass-through or warn), partial implementation in this
  plan (validator relaxation), full pass-through deferred per-field as
  consumers emerge.
- **`.opencode/opencode.json` content** (model, MCPs): owned by opencode-go
  plan; this plan only audits its **shape** against current schema and adds
  a contract test.
