---
description: Describes the sequential, exploration-only first step that builds a context summary of the repo before any user interaction begins.
when_to_use: Use when starting plan-establishment and needing to understand what already exists in the repo before grilling the user.
---

# Step 0. Prompt Parsing and Repo Exploration (Sequential)

Before any user interaction, understand the current repo state relative to the prompt.

## Plan-Artifact Authorization Gate

Before exploration can lead to a tracked write, verify that the user literally requested a plan
artifact or invoked this plan-authoring workflow. Plan Mode, a task list, discovery, or an omitted
tester output mode is insufficient. If authorization is absent, keep the work in the harness task
list or `local-tmp/` and do not continue to plan creation.

**Orchestrator action**:

1. Parse the prompt: extract the desired behaviour, likely affected areas (governance files,
   agents, workflows, apps, libs), and any explicit constraints
2. Explore the repo:
   - Read relevant `repo-governance/` files (conventions, workflows, development practices that
     overlap with the prompt)
   - Search `plans/in-progress/`, `plans/backlog/`, `plans/done/` for related prior plans
   - `Grep` for existing conventions or code that may already address or conflict with the prompt
   - Read `AGENTS.md` for relevant agent and workflow references
3. Search repository history and applicable external prior art for the material decisions the plan
   will make.
4. Build a context summary: what already exists, what gaps remain, what conflicts with the prompt,
   and which viable solution options evidence supports.

**Output**: Repo context loaded. Related prior work and conflicts identified.

**Notes**:

- Purely exploratory — no user interaction in this step
- Thorough exploration reduces grill time in Step 1 (pre-read the repo so you can answer "does X
  already exist?" without asking the user)
