---
description: "Lists the nine validation categories the specs-checker enforces and which categories are offloaded to deterministic Rhino subcommands versus LLM reasoning."
when_to_use: "Use when checking exactly what a specs-quality-gate audit report is scoring, or which Rhino command backs a given category."
---

# Validation Dimensions

The checker validates nine categories across all spec areas:

| #   | Category                         | What It Checks                                                                        | Method                   |
| --- | -------------------------------- | ------------------------------------------------------------------------------------- | ------------------------ |
| 1   | Structural Completeness          | README content is meaningful; lifecycle gates own registered existence/index checks   | LLM + delegated gate     |
| 2   | Feature File Inventory           | Narrative/domain inventory is coherent; lifecycle gates own registered counts         | LLM + delegated gate     |
| 3   | Gherkin Format Compliance        | Feature headers, user stories, Background steps, naming; lifecycle owns cardinality   | LLM + delegated gate     |
| 4   | Cross-Spec Consistency           | Shared domains align between related specs (demo-be ↔ demo-fe)                        | LLM                      |
| 5   | C4 Diagram Consistency           | Accessible colors, actor consistency, file references                                 | LLM                      |
| 6   | Cross-Reference Integrity        | References are semantically appropriate; lifecycle gates own path/fragment resolution | LLM + delegated gate     |
| 7   | Spec-to-Implementation Alignment | Spec READMEs reference implementations that exist                                     | LLM                      |
| 8   | Spec Tree Shape                  | Logical-owner-corpus compliance per surface profile                                   | Delegated lifecycle gate |
| 9   | Adoption Gaps                    | BDD/Contracts adoption check per surface profile (full-stack, web-only, CLI)          | LLM with Rhino assist    |

## Deterministic Offload

Step 0 derives lifecycle ownership from the live registry projections at invocation time; this
workflow carries no copied gate-ID list. When an exact ID or declared `verifies` relationship is
delegated, agents neither run nor re-derive that predicate. Category 9 retains narrative
justification assessment.

Drift detection commands (`drift-routes`, `drift-endpoints`, `drift-contracts`) were removed in
the BDD+DDD tooling gap-fill plan (2026-05) because reservation-pattern stubs that print "Not yet
implemented" mislead callers into believing functionality exists. Reintroduction requires a
dedicated plan implementing real drift logic.

| Current command                           | Validates                                                                          |
| ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `the declared spec-structure check [app]` | Adoption, tree shape, and app-tree counts                                          |
| `the declared spec-count check`           | Counts for trees outside `specs/apps/`                                             |
| `./rhino md internal-link validate`       | Markdown path and fragment integrity                                               |
| `test:coverage:behaviour`                 | Canonical corpus structure, explicit When/Then, bindings, adapters, and exemptions |

Agents MUST NOT re-implement a delegated predicate with file globs or LLM inference. Outside a
quality-gate invocation, use the current commands above rather than removed `specs validate-*`
forms.
