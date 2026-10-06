# Grill Me — Mechanism and Staged Native Rendering

## Mechanism — use the native interactive tool

Grilling in an interactive root thread MUST use the harness's native interactive
multiple-choice tool when available, not free-text prose questions. It renders options as
selectable choices and returns a structured answer, eliminating parse ambiguity. The root
orchestrator owns every grill and passes resolved answers to a delegated `plan-maker` or
`plan-checker`; it MUST NOT delegate the user interaction itself.

Use the harness-specific invocation contract in
[Platform Binding Examples](./platform-binding-examples.md#platform-binding-examples). In all bindings, put the Recommended
option first and append `(Recommended)` to its label, place the rationale in its description,
keep **"Let's chat about this"** as the final explicit option, and rely on the client-provided
free-text **"Other"** entry for the blank-state type.

**Delegated-agent handoff**: a subagent MUST NOT render markdown as if it were asking the user.
It returns `## User Decisions Required` using the
[canonical envelope schema](../../../../repo-governance/development/workflow/grilling-with-options/user-decisions-required-envelope.md)
and stops before work that depends on those answers. Every `options` array exhaustively lists all
substantive leaves; the root adds the standing chat option and relies on the client's implicit
custom answer. The root invokes this skill through its native UI when available, then resumes or
reinvokes the specialist with the canonical [Resolved User Decisions Envelope](../../../../repo-governance/development/workflow/grilling-with-options/resolved-user-decisions-envelope.md).
It builds that payload from the original IDs only after rendering and passes it verbatim; the
specialist validates it before dependent work. Direct custom-agent callers receive the same
envelope.

## Staged native rendering

When a native tool permits only 2–3 substantive options but the envelope has 3–4 leaves, preserve
the whole envelope and use the [canonical staged procedure](../../../../repo-governance/development/workflow/grilling-with-options/staged-native-rendering.md).
The root first presents two named branch groups that enumerate their contained leaves, plus chat and
the client-provided type-your-own entry. A selected singleton group is terminal: record its original
leaf ID immediately in the Resolved User Decisions Envelope. Render a follow-up only for a selected
multi-leaf group. Do not omit, collapse, auto-select, or reinterpret a leaf. Chat and the blank-state
type path remain available at every rendered stage, and only the final original leaf is recorded as
the answer.

**Fallback only for a genuinely non-interactive root or harness without a native tool**: emit
inline markdown options to the caller, still satisfying Rules 2–5:

> **[Question]**
>
> - **Option A**: [description] — [trade-off] **(Recommended — [rationale])**
> - **Option B**: [description] — [trade-off]
> - **Other — type your own answer**: free-form write-in; the answer is whatever you type (blank
>   state). Always present.
> - **Chat about this**: talk the decision through before deciding. Always present.

No bare "What do you think about X?" questions. No yes/no questions without an options list.
Present the choices; let the user pick or override. Never silently select the Recommended option
or infer an answer because interactive input is unavailable.
