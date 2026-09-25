---
description: "Delegating to specialized agents; per-agent validation rituals."
when_to_use: "Use when deciding whether to delegate research."
---

# Specialized-Agent Delegation and Validation Rituals

## Specialized-Agent Delegation (Hallucination Reduction)

Domain-specialized agents hallucinate less than generic orchestration because they carry deeper context about their language, framework, and conventions. `plan-maker` SHOULD annotate each delivery checkbox with a suggested executor agent when a domain-specialized agent fits better than the default plan-execution Agent Selection rules.

**Annotation format** (added under the checkbox prose, before implementation notes):

```markdown
- [ ] Edit `apps/organiclever-be/src/Domain/User.fs`: add `email: string option` field with case-insensitive
      uniqueness constraint. Verify by running
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-be:test:unit`
      — new test `User_RejectsDuplicateEmailIgnoringCase` passes.
  - _Suggested executor: `swe-code-maker`_
```

**When to annotate**:

- The action changes application, library, or test code (`.ts`/`.tsx`, `.fs`/`.fsproj`, `.java`, and so on → `swe-code-maker`, which loads the project's stack packs).
- The action touches a specific app context (`apps/ose-www/...` → `apps-ose-www-content-maker` for content edits).
- The action is a content/documentation change (`docs-maker`, `readme-maker`).
- The action is repo-governance/repo-rules (`rules-maker`).
- The action is a content-platform skill domain (`apps-ayokoding-www-by-example-maker`, `apps-ayokoding-www-in-the-field-maker`).

**When to skip annotation** (default plan-execution Agent Selection suffices):

- Single-line edits to a governance doc (orchestrator can edit directly).
- Mechanical operations (`mv`, `git mv`, `npm install`).
- Shell commands without code edits.

`plan-checker` validates that any annotated executor agent name resolves to a real agent file via
`test -f .agents/agents/<name>.md` (flat canonical directory). Citing a non-existent agent is
treated as AP-7 (HIGH finding).

`plan-execution` Step 2 Agent Selection respects the annotation as the highest-priority match — the suggested executor wins over the heuristic match by file extension or content keyword.

## Validation Rituals (per plan agent)

Each plan agent applies this convention at a specific point in its workflow:

- **`plan-maker`** — before writing each non-trivial claim, run the verification recipe for the claim's category. If verification fails, refuse-on-uncertainty.
- **`plan-checker`** — Step 5f scans the entire plan for unverified claims (file paths, Nx targets, package versions, API signatures, agent names, KPIs) and flags violations against the Anti-Pattern catalog.
- **`plan-quality-gate`** — re-verifies each ledger row before repairing it. A repo-grounding failure during re-verification blocks the row for manual resolution rather than repairing it. Fabricated content is NEVER applied.
- **`plan-execution-checker`** — verifies that all delivery-checkbox claims still hold after execution: file paths exist (or were created), commands ran successfully, claimed test names appear in the test files, claimed Nx targets are present in `project.json`.
