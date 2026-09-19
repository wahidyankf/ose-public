---
description: The syllabus/README.md, syllabus/courses/, and syllabus/paths/ structure every learning-bearing plan must carry, and which per-subfolder READMEs are grandfathered versus required.
when_to_use: Read this when scaffolding a new corpus's syllabus folder or checking an existing one for a missing required file.
---

# Required Folder Layout

Part of the [Learning-Plan `syllabus/` Folder Convention](../learning-plan-syllabus.md).

A learning-bearing plan's corpus lives under its own plan folder in the following shape:

```
plans/<stage>/<plan-id>/
└── syllabus/
    ├── README.md              # REQUIRED — corpus overview + the Custodian line
    ├── courses/
    │   ├── README.md          # REQUIRED for new corpora; grandfathered for existing corpora
    │   └── <course-id>.md     # one file per course (see the copy-paste template)
    └── paths/
        ├── README.md          # REQUIRED for new corpora; grandfathered for existing corpora
        └── manifest-<path-id>.md
```

Both `syllabus/courses/` and `syllabus/paths/` are REQUIRED subfolders — every existing corpus
already uses that split. `syllabus/README.md` is REQUIRED without exception (all three existing
corpora carry one). The per-subfolder READMEs (`courses/README.md`, `paths/README.md`) are REQUIRED
for a **new** corpus created after this convention lands; the two existing corpora that predate it
and lack these files are **grandfathered** — see the
[Grandfathered Format Cohort](./grandfathered-format-cohort.md) child for why retrofitting them
is out of scope. A corpus without a `courses/README.md` is on borrowed time
regardless: `./rhino governance directory-map validate` flags an unindexed sibling as an orphan the
moment any other file in the same directory changes, so adding the README is a low-cost task a new
corpus should not defer.
