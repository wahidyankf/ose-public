---
title: "Artifact: Trust-Calibration Diagram"
date: 2026-07-26T00:00:00+07:00
draft: false
weight: 6
---

> Worked Scenario 6 -- trust-calibration diagram -- exercises co-04.

Trust calibration plots actual reliability on one axis against observed user trust on the other.
The diagonal is the calibrated zone: trust tracking reliability. The two off-diagonal quadrants are
both design failures, and each is corrected by a different set of interface moves.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
%% Reliability (x-axis, conceptual) vs. user trust (y-axis, conceptual)
graph TD
    accTitle: graph diagram
    accDescr: Graph with 5 nodes and 4 connections. Nodes: Calibrated zone trust tracks reliability, Over-trust quadrant high trust, moderate risk co-04, co-05, co-08, Surface uncertainty (co-06) Show provenance (co-09) Confidence != correctness, Blanket-distrust quadrant low trust, high reliability Scenario 9, Case-by-case signals (co-06) Citations to check (co-09) Cheap verification (co-10). Connections: Over-trust quadrant high trust, moderate risk co-04, co-05, co-08 to Surface uncertainty (co-06) Show provenance (co-09) Confidence != correctness, Blanket-distrust quadrant low trust, high reliability Scenario 9 to Case-by-case signals (co-06) Citations to check (co-09) Cheap verification (co-10), Calibrated zone trust tracks reliability to Over-trust quadrant high trust, moderate risk co-04, co-05, co-08 (drift toward over-trust as reliability rises unchecked), Calibrated zone trust tracks reliability to Blanket-distrust quadrant low trust, high reliability Scenario 9 (drift toward distrust after an early, unsignalled miss).
    Cal["Calibrated zone<br/>trust tracks<br/>reliability"]:::teal

    OverTrust["Over-trust quadrant<br/>high trust, moderate<br/>risk<br/>co-04, co-05, co-08"]:::orange
    OverTrustFix["Surface uncertainty<br/>(co-06)<br/>Show provenance<br/>(co-09)<br/>Confidence !=<br/>correctness"]:::blue

    Distrust["Blanket-distrust<br/>quadrant<br/>low trust, high<br/>reliability<br/>Scenario 9"]:::purple
    DistrustFix["Case-by-case signals<br/>(co-06)<br/>Citations to check<br/>(co-09)<br/>Cheap verification<br/>(co-10)"]:::blue

    OverTrust --> OverTrustFix
    Distrust --> DistrustFix
    Cal -.->|drift toward<br/>over-trust as<br/>reliability rises<br/>unchecked| OverTrust
    Cal -.->|drift toward<br/>distrust after<br/>an early,<br/>unsignalled miss| Distrust

    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

_Figure: the calibrated zone sits between two named failure quadrants. A feature drifts toward
over-trust as its measured reliability rises without a matching uncertainty signal (Scenario 8), and
toward blanket distrust after an early miss with no case-by-case signal to fall back on (Scenario
9). Each quadrant's fix is a distinct set of interface moves, not a single universal remedy._

**Verify**: both off-diagonal quadrants are present, each is labelled with the specific scenario
that instantiates it (Scenario 8 for over-trust, Scenario 9 for distrust), and each has its own,
distinct fix list -- satisfying co-04's rule that trust calibration is a two-sided design problem.

**Key takeaway**: There is no single "add more trust signals" fix -- over-trust and blanket distrust
require opposite interventions, and a design that treats trust as one-dimensional will
under-correct one quadrant while over-correcting the other.

**Why It Matters**: This diagram is the map every later worked scenario about trust, uncertainty, or
provenance implicitly places itself on. Recognising which quadrant a given feature is drifting
toward -- before choosing a fix -- is what prevents a team from, for example, adding more caveats
(a distrust-quadrant fix) to a feature that is actually suffering from over-trust, which would make
the real problem worse rather than better.

---

← Back to [Theme A: The Wrong Answer Is Coming](../theme-a-the-wrong-answer-is-coming.md)
