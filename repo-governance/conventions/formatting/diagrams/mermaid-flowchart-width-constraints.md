---
description: "Specifies width constraints for Mermaid flowcharts to keep them readable on narrow viewports."
when_to_use: "Use when a Mermaid flowchart risks becoming too wide to render legibly."
---

# Flowchart Width Constraints

The `./rhino md mermaid validate` command enforces a maximum horizontal width of **4 nodes** on any single rank level. "Horizontal" is direction-aware:

- **`graph LR` / `graph RL`**: horizontal = **depth** (number of rank columns, i.e., the longest chain)
- **`graph TD` / `graph TB` / `graph BT`**: horizontal = **span** (maximum nodes at any single rank level)

**Parser notes**: Pipe-labeled edges (`A -->|text| B`) parse correctly as edges. Cyclic diagrams are ranked via DFS back-edge removal before longest-path ranking — a cycle ranks as its underlying chain rather than collapsing every node to rank 0.

**Label length**: the binding limit is **20 characters per line** (each `<br/>`-separated segment measured individually) — see [Rule 3](./common-syntax-errors-label-constraints-rule-3-line-length.md). Two registry gates enforce it together, because the validator's own default is looser than the rule:

| Gate                | Threshold | Scope                                              |
| ------------------- | --------- | -------------------------------------------------- |
| `md-mermaid`        | 30        | every `.md` file in CI — the repo-wide backstop    |
| `md-mermaid-strict` | 20        | changed `.md` files only — the binding Rule-3 gate |

The strict gate is scoped to changed files on purpose: the legacy corpus carries violations at 20 that a repo-wide failing gate would surface all at once. New and edited diagrams meet Rule 3; untouched ones ratchet in when someone next edits them.

**Automated enforcement**:

```bash
./hippo run --class ephemeral --resource-tier standard --disk-path . -- \
  ./rhino md mermaid validate
```

Run without flags to perform a repo-wide scan (the Nx target excludes `plans/done` and
`apps/ayokoding-www/content` plus the standardized noise-skip set) using defaults (MaxWidth=4,
unlimited depth). Pass additional `--exclude <prefix>` flags to suppress noise in project-specific runs.

**Gate location**: Both gates run at **pre-commit (staged `.md` files only)** via lint-staged, and in
CI via `pr-quality-gate.yml`. Neither runs at pre-push, and neither has a standalone CI workflow.
