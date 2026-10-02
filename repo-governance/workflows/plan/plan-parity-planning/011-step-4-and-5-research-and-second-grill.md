---
description: The conditional web-research delegation and the post-research grill that validates direction before plan authoring.
when_to_use: Use when the research-needed flag is set, or when validating decisions against research findings before Step 6.
---

# Step 4 — Web Research (Sequential, Conditional)

Delegate external research to `web-researcher` to verify claims and gather authoritative
sources before plan authoring begins.

**Skip condition**: Skip if ALL hold:

1. The objective is a purely internal governance or structural change with no external claims
2. No harness/vendor conventions, library versions, tool behaviour, or cross-repo prior art need
   verification
3. The invoker confirmed in Step 3 that no research is needed (research-needed flag = no)

If skipping: emit `Step 4 skipped — no external research needed (confirmed in Step 3).`

**If NOT skipping**:

Invoke `web-researcher` via the Agent tool. Provide a focused research prompt covering:

- Vendor or harness conventions the objective touches (e.g., CI runner behaviour, tool API
  contracts, platform-specific constraints)
- Prior art: has anyone formalized this cross-repo alignment pattern? Known failure modes?
- Library or tool behaviour referenced in the objective (versions, API signatures, caveats)
- Risks or caveats not surfaced in the Step 1 inventories

**Agent**: `web-researcher`

**Output**: Cited, structured research findings. Passed to Step 5 grill and included in the
`plan-maker` handoffs in Step 6. If skipped, the skip line is included in Step 6 handoffs
in place of research findings.

## Step 5 — Second Grill (Post-Research, Sequential)

Present research findings and grill again to validate direction and close any new decision
branches opened by the research.

**Orchestrator action**:

1. Summarize research findings from Step 4 (or confirm skipped)
2. Invoke the grilling protocol. Every question MUST follow the
   [Grilling-With-Options Convention](../../../development/workflow/grilling-with-options.md):
   2-4 concrete options, explicit trade-offs, exactly one Recommended, native interactive tool
   when available. Cover:
   - Do the research findings change any decision from Step 3? (options: yes — which decision /
     no — proceed as agreed / partial — one or more decisions need refinement)
   - Are there new constraints or trade-offs surfaced by the research that apply to one or more
     repos differently?
   - Does the proposed cross-repo alignment approach still hold after checking authoritative
     sources?
   - Are there risks the invoker wants to explicitly accept or mitigate in the plans?
3. Matrix rows may be added or updated based on findings — every new or changed row requires a
   recorded decision before proceeding
4. Confirm the updated direction before proceeding to Step 6

**Do NOT proceed to Step 6** until all branches from this grill are resolved and mutual
understanding is confirmed incorporating research.

**Notes**:

- If research was skipped in Step 4, this is a brief confirmation pass, not a full grill session
- All new branches must be resolved before invoking `plan-maker`

**Output**: Final direction confirmed. Research findings integrated into the deviation matrix.
Every matrix row (original and new) carries a recorded decision.
