---
description: "Quantitative line-count and diagram benchmarks plus qualitative requirements that all programming language content must meet."
when_to_use: "Use when measuring a piece of programming language content against its minimum/target/exceptional length benchmarks or checking qualitative compliance."
---

# Quality Metrics

## Quantitative Benchmarks

Based on Golang, Python, and Java implementations:

| Metric                    | Minimum     | Target      | Exceptional |
| ------------------------- | ----------- | ----------- | ----------- |
| **Tutorials**             |
| Initial Setup             | 300 lines   | 400 lines   | 500 lines   |
| Quick Start               | 600 lines   | 750 lines   | 900 lines   |
| Beginner                  | 1,200 lines | 1,700 lines | 2,300 lines |
| Intermediate              | 1,000 lines | 1,350 lines | 1,700 lines |
| Advanced                  | 1,000 lines | 1,250 lines | 1,500 lines |
| **By Example**            |
| Beginner examples         | 1,000 lines | 1,200 lines | 1,400 lines |
| Intermediate examples     | 1,400 lines | 1,600 lines | 1,800 lines |
| Advanced examples         | 1,100 lines | 1,400 lines | 1,700 lines |
| Total examples            | 60          | 65          | 70+         |
| Mermaid diagrams          | 3           | 5           | 8+          |
| **How-To Guides**         |
| Total count               | 12          | 15          | 18+         |
| Per guide                 | 200 lines   | 350 lines   | 500 lines   |
| Cookbook                  | 4,000 lines | 4,700 lines | 5,500 lines |
| **Explanation**           |
| Best practices            | 500 lines   | 650 lines   | 750 lines   |
| Anti-patterns             | 500 lines   | 650 lines   | 750 lines   |
| **Quality**               |
| Mermaid diagrams/tutorial | 3 minimum   | 5+          | 8+          |
| Cross-references/tutorial | 10          | 15          | 20+         |
| Code examples/tutorial    | 15          | 25          | 35+         |

## Qualitative Requirements

All content MUST meet:

- PASS: **Color-blind friendly**: Only use approved palette (#0173B2, #DE8F05, #029E73, #CC78BC, #CA9161)
- PASS: **Factually accurate**: All commands, syntax, versions verified
- PASS: **Runnable code**: Examples work as-is (copy-paste ready)
- PASS: **Progressive disclosure**: Simple → complex ordering
- PASS: **Active voice**: Direct, engaging writing
- PASS: **Single H1**: Only one top-level heading per file
- PASS: **Proper heading nesting**: No skipped levels (H2 → H4)
- PASS: **Cross-platform**: Consider Windows, macOS, Linux where relevant
