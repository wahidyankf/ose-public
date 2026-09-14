---
description: "Table (part 2 of 2) mapping common change types to whether a spec update is required."
when_to_use: "Use when uncertain whether a Next.js/React/app-rename/library-level change requires a spec update."
---

# Decision Guide (continued)

Continued from [Decision Guide: Architecture Change vs. Minor Change](./decision-guide-architecture-change-vs-minor-change.md).

| Change Type                                                    | Spec Update Required?                                | Reasoning                                           |
| -------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------- |
| Replace one HTTP client library with another                   | No                                                   | Internal implementation detail, interface unchanged |
| Add a new Next.js page                                         | Yes — Gherkin scenario for user-facing behaviour     | New observable behaviour                            |
| Add a new internal React component                             | No                                                   | Internal implementation detail                      |
| Change a validation rule that clients can observe              | Yes — update Gherkin scenario                        | Contract change                                     |
| Change an internal validation rule that clients cannot observe | No                                                   | Internal implementation detail                      |
| Rename an app in `apps/`                                       | Yes — rename `specs/apps/` folder and update READMEs | Structural change                                   |
| Remove an app from `apps/`                                     | Yes — remove `specs/apps/` folder                    | Structural change                                   |
| Change Astro to Next.js for an existing site                   | Yes — C4 container diagram technology label          | Architectural change                                |
| Upgrade Next.js from v15 to v16                                | No                                                   | Internal dependency, interface unchanged            |
| Add a new Nx library in `libs/` that is a public API           | Yes — add `specs/libs/` folder with feature files    | New public surface                                  |
| Add an internal utility used only within one app               | No                                                   | Not a public surface                                |
