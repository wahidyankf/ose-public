---
description: "Specifies width constraints for Mermaid flowcharts to keep them readable on narrow viewports."
when_to_use: "Use when a Mermaid flowchart risks becoming too wide to render legibly."
---

# Flowchart Width Constraints

Keep any single rank level to a maximum horizontal width of **4 nodes**. No gate checks this —
`./rhino md mermaid validate` does not measure rank width — so authors and reviewers count by hand.
"Horizontal" is direction-aware:

- **`graph LR` / `graph RL`**: horizontal = **depth** (number of rank columns, i.e., the longest chain)
- **`graph TD` / `graph TB` / `graph BT`**: horizontal = **span** (maximum nodes at any single rank level)

**Counting notes**: Pipe-labeled edges (`A -->|text| B`) are ordinary edges. A cycle ranks as its underlying chain rather than collapsing every node to one rank.

**Label length**: the binding limit is **20 characters per line** (each `<br/>`-separated segment measured individually) — see [Rule 3](./common-syntax-errors-label-constraints-rule-3-line-length.md). The `md-mermaid` gate enforces it through the 20-grapheme limit declared in `repo-config.yml` `policies.markdown.mermaid`.

**Automated check** (accessibility, palette, and the 20-grapheme label limit — not width):

```bash
./hippo run --class ephemeral --resource-tier standard --disk-path . -- \
  ./rhino md mermaid validate
```

Run without flags to scan the whole declared surface; the legacy corpus reports many findings
there. Pass `--file <path>` (repeatable) to check only the files you touched, which is what
the gate does.

**Gate location**: the declared `md-mermaid` registry gate runs at **pre-commit (staged `.md` files
only)** and on the pull-request surface in `pr-quality-gate.yml` (changed `.md` files), through
`scripts/validate-mermaid-files`. It does not run at pre-push and has no standalone CI workflow.
