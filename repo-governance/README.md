---
description: How open-sharia-enterprise turns its mission and values into consistent ways of working
when_to_use: "Read this index to find the right repository-governance layer or document."
---

# Repository Governance

Governance helps open-sharia-enterprise make consistent, purposeful decisions as the repository grows. It connects the project's mission to the principles, standards, development practices, automated agents, and workflows that put that mission into practice.

This directory is a map, not a replacement for the documents it links to. Start with the layer closest to the question you have, then follow its links for the full rule or procedure.

## Start Here

- To understand how the six layers connect, read the [Repository Governance Architecture](./repository-governance-architecture.md) — a six-layer governance hierarchy defining how rules, conventions, and practices are organized.
- To learn why the project exists, begin with the [Vision](./vision/README.md) — the foundational purpose and change we seek through Open Sharia Enterprise.
- To find a rule for writing or organizing documentation, use [Conventions](./conventions/README.md) — documentation conventions and standards.
- To find a software practice, quality gate, or engineering workflow, use [Development](./development/README.md) — internal development guidance for delivery work.
- To execute a defined process end-to-end, use [Workflows](./workflows/README.md) — orchestrated processes that compose agents and procedures toward a goal.

## Navigate the Layers

The governance model has six layers. Each answers a different question and gives the layers below it a clear foundation.

| Layer          | Question it answers                               | Where to go                                                                                                            |
| -------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 0. Vision      | Why does the project exist?                       | [Vision](./vision/README.md) — the foundational purpose and change we seek                                             |
| 1. Principles  | Why do we value this approach?                    | [Principles](./principles/README.md) — foundational principles that guide all conventions and practices                |
| 2. Conventions | What rules shape our documentation?               | [Conventions](./conventions/README.md) — documentation conventions and standards                                       |
| 3. Development | How do we build and maintain software?            | [Development](./development/README.md) — internal development guidance for delivery work                               |
| 4. AI Agents   | Who carries out defined checks and tasks?         | [Agent catalog](../.agents/agents/README.md) — catalog of automated agent roles and the governance checks they enforce |
| 5. Workflows   | When do we use a coordinated, multi-step process? | [Workflows](./workflows/README.md) — composes agents and procedures toward a goal                                      |

The layers flow from enduring intent to day-to-day execution:

```text
Vision → Principles → Conventions and Development → AI Agents → Workflows
```

The [Repository Governance Architecture](./repository-governance-architecture.md) — a six-layer governance hierarchy defining how rules, conventions, and practices are organized — explains how each layer traces to the ones below it.

## Choose the Right Home

Use the question below to decide where a new governance document belongs.

| If the document answers…                          | Put it in…                                                                                                 |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Why does the project exist?                       | [`vision/`](./vision/README.md) — the foundational purpose and change we seek                              |
| Why do we value an approach?                      | [`principles/`](./principles/README.md) — foundational principles that guide all conventions and practices |
| What documentation rule should we follow?         | [`conventions/`](./conventions/README.md) — documentation conventions and standards                        |
| How should we develop, test, or operate software? | [`development/`](./development/README.md) — internal development guidance for delivery work                |
| When should a multi-step process run?             | [`workflows/`](./workflows/README.md) — composes agents and procedures toward a goal                       |
| What does a disputed term actually cover?         | [`glossary.md`](./glossary.md) — shared vocabulary for terms whose scope crosses directories               |

Keep governance prose vendor-neutral. Details that apply only to a particular tool or platform belong in its platform-binding documentation, as described by the [Governance Vendor-Independence Convention](./conventions/structure/governance-vendor-independence.md).

## Follow the Trace

When a rule feels arbitrary, trace it upward. A development practice should be grounded in relevant principles; a convention should support the project's purpose. When a higher layer changes, review the lower layers that depend on it.

For example, the [Accessibility First principle](./principles/content/accessibility-first.md) informs documentation conventions, development practices, agent checks, and workflows that verify accessible outcomes. This traceability keeps local decisions aligned with the project's broader purpose.

## Read by Situation

- **New to the repository:** read the [Vision](./vision/README.md) — the foundational purpose and change we seek, then the [Principles](./principles/README.md) — foundational principles that guide all conventions and practices, followed by the [Repository Governance Architecture](./repository-governance-architecture.md) — a six-layer governance hierarchy defining how rules, conventions, and practices are organized.
- **Writing documentation:** start with [Conventions](./conventions/README.md) — documentation conventions and standards, especially its formatting, linking, and writing guidance.
- **Changing code or delivery practices:** start with [Development](./development/README.md) — internal development guidance for delivery work, then use the relevant [Workflows](./workflows/README.md) — composes agents and procedures toward a goal.
- **Working with automated agents:** use the [Agent catalog](../.agents/agents/README.md) to understand available roles and the governance documents they enforce.

This structure keeps the repository's decisions discoverable: begin with the question at hand, use the matching layer, and follow links only as far as the work requires.
