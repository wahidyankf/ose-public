---
description: Documents the manual decision point where a human reads the audit report, counts findings by strictness mode, assesses overall status, and decides whether to proceed to the fixer or return to the maker.
when_to_use: Use when reviewing an in-the-field audit report and deciding the next action.
---

# 3. User Review (Manual Decision Point)

**Objective**: Human decision on validation findings

**User actions**:

**1. Read audit report** from local-tmp/ayokoding-web-in-the-field/

**2. Count findings based on mode level** (default: `{input.mode}` or `normal`):

**Strictness-based counting**:

- **lax**: Count CRITICAL only
- **normal**: Count CRITICAL + HIGH
- **strict**: Count CRITICAL + HIGH + MEDIUM
- **ocd**: Count all levels (CRITICAL, HIGH, MEDIUM, LOW)

**3. Assess overall status**:

- PASS: **EXCELLENT**: Zero threshold-level findings
- **NEEDS IMPROVEMENT**: Some threshold-level findings, proceed to fixer
- FAIL: **FAILING**: Major structural issues, return to maker

**4. Review confidence levels**:

- **HIGH confidence**: Trust findings, approve auto-fix
- **MEDIUM confidence**: Review specific guides, approve if valid
- **FALSE POSITIVE risk**: Decide whether to keep current design or fix

**5. Make decision**:

```mermaid
graph TD
    accTitle: 3. User Review — Manual Decision Point
    accDescr: Overall Status? leads to Proceed to Fixer via EXCELLENT or NEEDS IMPROVEMENT; Overall Status? leads to Return to Maker via FAILING; Proceed to Fixer leads to Auto-fix safe?; and 2 more links.
    A{Overall Status?}
    A -->|EXCELLENT or<br/>NEEDS IMPROVEMENT| B[Proceed to Fixer]
    A -->|FAILING| C[Return to Maker]

    B --> D{Auto-fix safe?}
    D -->|HIGH confidence only| E[Run Fixer, HIGH only]
    D -->|HIGH + MEDIUM| F[Run Fixer with both]

    classDef orange fill:#DE8F05,stroke:#000000,color:#000000
    classDef teal fill:#029E73,stroke:#000000,color:#000000
    classDef brown fill:#CA9161,stroke:#000000,color:#000000
    class A orange
    class B teal
    class C brown
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

When the status is FAILING, the return-to-maker rework path is:

```mermaid
graph TD
    accTitle: 3. User Review — Manual Decision Point (2)
    accDescr: Return to Maker leads to Major rework needed; Major rework needed leads to Add missing coverage; Major rework needed leads to Fix stdlib ordering; Major rework needed leads to Add code quality.
    C[Return to Maker] --> G[Major rework needed]
    G --> H[Add missing coverage]
    G --> I[Fix stdlib ordering]
    G --> J[Add code quality]

    classDef brown fill:#CA9161,stroke:#000000,color:#000000
    class C brown
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

**Depends on**: Step 2 completion

**Next step**:

- If approved → Proceed to step 4
- If failing → Return to step 1
