---
description: "The three-step cross-discipline tie-breaker."
when_to_use: "Use for an ambiguous-ownership finding."
---

# The Boundary Tie-Breaker Rule

When a finding does not obviously belong to one of the nine disciplines above, resolve it with
this **tie-breaker**, in order:

1. **Documented + mechanically-checkable rule → governance.** If a `repo-governance/` convention
   already states the rule and a mechanical check (grep, linter, structural check) could in
   principle confirm the violation, the finding is governance's.
2. **New tradeoff judgment → architecture** (resolve by making the call, then writing the rule for
   next time). If answering the finding requires a genuinely new structural or quality-attribute
   decision that no existing rule covers, it is architecture's — and the resolution should be
   written down as a new rule so the next occurrence falls under bullet 1 instead.
3. **"Does it satisfy domain intent?" → correctness.** If neither of the above applies, and the
   question is whether the change actually does what the domain requires, it is correctness's
   (owned by `pr-review-logic-maker`).

The **architecture↔correctness boundary is the highest-risk of the three** — a new structural
decision and a domain-behaviour question can look identical in a raw finding. The coordinator
(`pr-review-synthesis-maker`) **owns re-categorizing a misfiled finding across this specific
boundary** as part of its re-categorize function; no specialist self-adjudicates its own
tie-breaker verdict once the coordinator has reviewed it. This is the same tie-breaker every
grey-zone ruling below applies — the seven rulings are this rule pre-resolved for seven recurring
cases so the coordinator does not have to re-derive the tie-breaker from scratch every cycle.

```mermaid
%% Color palette: Blue #0173B2 (governance), Orange #DE8F05 (architecture), Teal #029E73 (correctness), Purple #CC78BC (coordinator re-categorization)
%% Direction TD (not LR): the longest decision chain is five nodes, which LR would push past the 4-node width budget.
flowchart TD
  accTitle: The Boundary Tie-Breaker Rule
  accDescr: Finding under review leads to Is there a documented, mechanically- checkable rule for this?; Is there a documented, mechanically- checkable rule for this? leads to Governance via Yes; and 5 more links.
  Q["Finding under review"] --> R{"Is there a<br/>documented,<br/>mechanically-<br/>checkable<br/>rule for this?"}
  R -->|Yes| GOV["Governance"]:::blue
  R -->|No| N{"Does it need a NEW<br/>tradeoff judgment<br/>(structure/<br/>boundary)?"}
  N -->|Yes| ARCH["Architecture<br/>(decide, then WRITE<br/>the rule for next<br/>time)"]:::orange
  N -->|No| CORR["Correctness<br/>(satisfies domain<br/>intent?)"]:::teal
  ARCH -.->|"looks misfiled?"| SYN["pr-review-synthesis-<br/>maker<br/>owns<br/>arch↔correctness<br/>re-categorization"]:::purple
  CORR -.->|"looks misfiled?"| SYN

  classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
  classDef orange fill:#DE8F05,stroke:#000000,color:#000000
  classDef teal fill:#029E73,stroke:#000000,color:#000000
  classDef purple fill:#CC78BC,stroke:#000000,color:#000000
```
