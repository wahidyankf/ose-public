# Rule 11: Execution-Grade Clarity Validation (Step 5e — MANDATORY HARD RULE)

After Step 5d, audit every delivery outcome section and action checkbox. A junior engineer fresh
from bootcamp with no professional work experience and no repository or stack context must be able
to execute it; authoring-grade hand-waving is a HARD RULE violation.

**What to validate**: every outcome section supplies Input, Outcome, Proof, and canonical ACs; every
checkbox satisfies all that apply:

1. **Explicit file path(s)** for file-touching actions. When unknowable at authoring time, give the
   maximum-detail target (parent directory, naming pattern, sibling reference). Bare "the auth file",
   "the relevant config", "wherever needed": **HIGH**.
2. **Explicit shell command(s)** for command actions (e.g.
   `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ose-web:test:quick`). Bare
   "run the lint", "run tests", "validate": **HIGH**.
3. **Concrete acceptance criterion** stating the observable proof of done (e.g. "the guarded
   `ose-web:typecheck` command exits 0"). Bare "implement X", "set up Y", "configure Z", "add caching", "fix
   the bug": **HIGH**.
4. **One independently verifiable action** per checkbox, including prerequisites, expected
   observation, failure handling, and evidence destination. An omnibus checkbox hiding distinct
   actions: **HIGH**. A useful high checkbox count is not a finding.
5. **Separate TDD actions**: every code behaviour slice has ordered RED, GREEN, and REFACTOR
   checkboxes with exact test/source path or bounded discovery, symbol, command, and expected state.
   Combined/missing cycle actions: **HIGH**.

**Controlled runbook-reference exception**: A finite cross-repository lifecycle checkbox may bind
to one same-document, uniquely named runbook packet instead of repeating one maintained procedure
or private paths only when the packet is explicitly bound to the checkbox's ID or unit/phase and
states why the packet is needed. It must state the exact record fields and their sources, copyable commands, exact admitted public paths or a maximum-detail
private-safe target, observable pass/fail result, record location, and finite applicability. The
packet must be in the same `delivery.md`; “see template”, an external document, or an execution-time
invented record is still **HIGH**. The exception preserves one independently completable checkbox and
never changes an existing merge gate, a scope boundary, or an acceptance criterion.

**How to audit**: for each `- [ ]` line, identify whether it edits a file, runs a command, verifies an
outcome, then check the corresponding element is present. **Exempt the final PR-merge step** from (b)
and (c) — a governance gate whose acceptance criterion is the PR Merge Protocol's five preconditions,
not a scripted command; this exemption does not extend to (a), nor to phase-gate/verification
checkboxes merely mentioning merging. Treat each missing element as a separate **HIGH** finding (one
per element per checkbox — the gate's repair pass batch-resolves).

**Finding severity**: bare action verbs without path/command/criterion outside a valid controlled
runbook-reference exception: **HIGH** per checkbox. Path
placeholder without resolution: **HIGH**. Command placeholder without verbatim invocation: **HIGH**.
Missing acceptance criterion where the action could partially complete without external proof:
**HIGH**. Multiple missing elements on one checkbox: still ONE finding. Final PR-merge step missing
(b)/(c): not a finding.
