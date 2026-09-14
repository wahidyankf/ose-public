---
description: Documents the manual decision point where a human reads the audit report, counts findings by strictness mode, assesses overall status, and decides whether to proceed to the fixer or return to the maker.
when_to_use: Use when reviewing an Annotated-concept audit report and deciding the next action.
---

# 3. User Review (Manual Decision Point)

**Objective**: Human decision on validation findings

**User actions**:

**1. Read audit report** from local-tmp/ayokoding-web-annotated-concept/

**2. Count findings based on mode level** (default: `{input.mode}` or `normal`):

**Strictness-based counting**:

- **lax**: Count CRITICAL only
- **normal**: Count CRITICAL + HIGH
- **strict**: Count CRITICAL + HIGH + MEDIUM
- **ocd**: Count all levels (CRITICAL, HIGH, MEDIUM, LOW)

**Below-threshold findings**: Reported but don't block success

**3. Assess overall status**:

- PASS: **EXCELLENT**: Zero threshold-level findings, proceed to fixer for below-threshold issues
  (optional)
- **NEEDS IMPROVEMENT**: Some threshold-level findings, proceed to fixer for mechanical fixes
- FAIL: **FAILING**: Major structural issues (e.g., wrong mode entirely, count far below floor),
  return to maker for rework

**4. Review confidence levels**:

- **HIGH confidence**: Trust findings, approve auto-fix
- **MEDIUM confidence**: Review specific worked examples/scenarios, approve if valid
- **FALSE POSITIVE risk**: Decide whether to keep current design or fix

**5. Make decision**:

```mermaid
graph TD
    accTitle: 3. User Review (Manual Decision Point)
    accDescr: Overall Status? leads to Proceed to Fixer via EXCELLENT or NEEDS IMPROVEMENT; Overall Status? leads to Return to Maker via FAILING; Proceed to Fixer leads to Auto-fix safe?; and 2 more links.
    A{Overall Status?}
    A -->|EXCELLENT or NEEDS IMPROVEMENT| B[Proceed to Fixer]
    A -->|FAILING| C[Return to Maker]

    B --> D{Auto-fix safe?}
    D -->|HIGH confidence only| E[Run Fixer with HIGH<br/>only]
    D -->|HIGH + MEDIUM| F[Run Fixer with both]

    classDef orange fill:#DE8F05,stroke:#000000,color:#000000
    classDef teal fill:#029E73,stroke:#000000,color:#000000
    classDef brown fill:#CA9161,stroke:#000000,color:#000000
    class A orange
    class B teal
    class C brown
```

**Decision matrix**:

| Status            | HIGH Conf Issues | MEDIUM Conf Issues | Action                                 |
| ----------------- | ---------------- | ------------------ | -------------------------------------- |
| EXCELLENT         | 0-5              | 0-10               | Run fixer (all)                        |
| NEEDS IMPROVEMENT | 5-15             | 10-30              | Run fixer (HIGH only or review MEDIUM) |
| FAILING           | 15+              | 30+ or Major gaps  | Return to maker                        |

**Depends on**: Step 2 completion

**Next step**:

- If approved → Proceed to step 4
- If failing → Return to step 1
