---
description: "Table (part 1 of 2) mapping common change types to whether a spec update is required."
when_to_use: "Use when uncertain whether a REST/tRPC/data-store/app-level change requires a spec update."
---

# Decision Guide: Architecture Change vs. Minor Change

Use this table when uncertain whether a change requires a spec update. Continued in [Decision Guide (continued)](./decision-guide-change-types-table.md).

| Change Type                                             | Spec Update Required?                                | Reasoning                              |
| ------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------- |
| Add a new REST endpoint                                 | Yes — Gherkin + possibly C4 component                | New observable behaviour               |
| Remove a REST endpoint                                  | Yes — remove Gherkin scenarios                       | Observable behaviour removed           |
| Rename an endpoint path                                 | Yes — update Gherkin scenarios                       | Contract change                        |
| Change request/response shape                           | Yes — update Gherkin scenarios                       | Contract change                        |
| Add optional query parameter with no behavioural change | No                                                   | Internal implementation detail         |
| Fix a bug where behaviour now matches the existing spec | No                                                   | Spec was already correct               |
| Fix a bug by changing behaviour (spec was wrong)        | Yes — update spec to match corrected behaviour       | Spec was inaccurate                    |
| Add a new tRPC router and procedures                    | Yes — Gherkin + C4 component diagram                 | New observable behaviour and component |
| Rename a tRPC procedure without changing its behaviour  | Yes — update Gherkin tags/descriptions               | Name is part of the contract           |
| Add a new database table or collection                  | Yes — C4 container diagram if it is a new data store | Architectural change                   |
| Add an index to an existing table                       | No                                                   | Internal implementation detail         |
| Add a new third-party API integration                   | Yes — C4 context and container diagrams              | New external dependency                |
