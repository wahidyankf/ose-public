---
title: "Artifact: Opportunity-Solution Tree — Kestrel No-Show Reduction"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 59
---

> An opportunity-solution tree for reducing no-show shift incidents -- exercises co-05. Kestrel is
> a fictional product; every quoted number, question, or finding here is an illustrative,
> constructed example, not real data or a real transcript.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph TD
    accTitle: graph diagram
    accDescr: Graph with 10 nodes and 9 connections. Nodes: Outcome: Reduce no-show shift incidents by 30, Opportunity: Employees forget upcoming shifts, Opportunity: Shift swaps get approved too late, Opportunity: New hires dont understand the scheduling app, Solution: SMS/push reminders 24h and 2h before shift, Solution: faster swap-approval workflow + manager push, Solution: in-app onboarding checklist for new employees, Test: reminder pilot, measure no-show delta, Test: A/B approval-time vs no-show rate, Test: checklist completion vs no-show correlation. Connections: Outcome: Reduce no-show shift incidents by 30 to Opportunity: Employees forget upcoming shifts, Opportunity: Employees forget upcoming shifts to Solution: SMS/push reminders 24h and 2h before shift, Solution: SMS/push reminders 24h and 2h before shift to Test: reminder pilot, measure no-show delta, Outcome: Reduce no-show shift incidents by 30 to Opportunity: Shift swaps get approved too late, Opportunity: Shift swaps get approved too late to Solution: faster swap-approval workflow + manager push, Solution: faster swap-approval workflow + manager push to Test: A/B approval-time vs no-show rate, Outcome: Reduce no-show shift incidents by 30 to Opportunity: New hires dont understand the scheduling app, Opportunity: New hires dont understand the scheduling app to Solution: in-app onboarding checklist for new employees, Solution: in-app onboarding checklist for new employees to Test: checklist completion vs no-show correlation.
    O["Outcome:<br/>Reduce no-show shift<br/>incidents by 30%"]:::blue
    OP1["Opportunity:<br/>Employees forget<br/>upcoming shifts"]:::orange
    OP2["Opportunity:<br/>Shift swaps get<br/>approved too late"]:::orange
    OP3["Opportunity:<br/>New hires don't<br/>understand<br/>the scheduling app"]:::orange
    S1["Solution:<br/>SMS#47;push<br/>reminders<br/>24h and 2h before<br/>shift"]:::teal
    S2["Solution: faster<br/>swap-approval<br/>workflow + manager<br/>push"]:::teal
    S3["Solution: in-app<br/>onboarding<br/>checklist for new<br/>employees"]:::teal
    T1["Test: reminder<br/>pilot,<br/>measure no-show<br/>delta"]:::purple
    T2["Test: A#47;B<br/>approval-time<br/>vs no-show rate"]:::purple
    T3["Test: checklist<br/>completion<br/>vs no-show<br/>correlation"]:::purple

    O --> OP1 --> S1 --> T1
    O --> OP2 --> S2 --> T2
    O --> OP3 --> S3 --> T3

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

_Diagram: one outcome, three opportunities, one solution and one assumption test per opportunity --
every solution traces upward to exactly one opportunity, and every opportunity traces upward to
the stated outcome._
