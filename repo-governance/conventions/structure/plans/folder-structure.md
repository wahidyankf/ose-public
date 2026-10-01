---
description: Describes the four top-level plans/ subfolders (ideas/, backlog/, in-progress/, done/) and the purpose of each.
when_to_use: Use when deciding which top-level plans/ subfolder a document belongs in.
---

# Folder Structure

The `plans/` folder is organized into four main components:

```
plans/
├── ideas/           # Two-pager idea briefs not yet formalized into full plans
├── backlog/         # Planned projects for future implementation
├── in-progress/     # Active plans currently being worked on
└── done/            # Completed and archived plans
```

## Subfolder Purposes

**ideas/** - Idea Briefs (Two-Pagers)

- Contains **two-pagers**: shortened, promotable idea briefs — richer than a one-line todo, but NOT mature-core formal plans
- Each idea is one `<slug>.md` file; the folder has a `README.md` index
- The first lifecycle stage: ripe two-pagers are promoted to `backlog/` as full plans (see [Ideas Folder (Two-Pagers)](./ideas-folder-overview-rationale-and-file-layout.md#ideas-folder-two-pagers) below)

**backlog/** - Planning Queue

- Contains plans that are ready for implementation but not yet started
- Plans are fully structured with requirements, tech docs, and delivery sections
- Each subfolder has a `README.md` listing all plans in backlog

**in-progress/** - Active Work

- Contains plans currently being executed
- A [Bug-Fix Plan](./bug-fix-plan.md) starts here, with no idea or backlog stage
- Plans being actively worked on by the team
- Limited to a small number of concurrent plans (prevents context switching)
- Each subfolder has a `README.md` listing all active plans

**done/** - Completed Work

- Contains completed and archived plans
- Plans are moved here when implementation is finished
- Serves as historical record of project evolution
- Each subfolder has a `README.md` listing all completed plans
