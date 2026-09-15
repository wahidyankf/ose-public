---
description: "Where captured evidence lives within a plan folder."
when_to_use: "Use when deciding where to save a screenshot or API wire result during plan execution."
---

# Evidence Folder Location

Every plan folder MAY contain an `evidence/` subfolder:

```
plans/
├── in-progress/
│   └── my-feature/
│       ├── README.md
│       ├── brd.md
│       ├── prd.md
│       ├── tech-docs.md
│       ├── delivery.md
│       └── evidence/              ← evidence goes here
│           ├── phase-1-homepage-en.png
│           ├── phase-1-homepage-id.png
│           ├── phase-2-api-health.txt
│           └── phase-3-mobile-375px.png
└── done/
    └── 2026-06-20__my-feature/
        ├── delivery.md
        └── evidence/              ← moves with the plan on archival
```

The `evidence/` folder is committed to git and moves with the plan folder when it is archived to
`done/`. It is part of the permanent historical record.
