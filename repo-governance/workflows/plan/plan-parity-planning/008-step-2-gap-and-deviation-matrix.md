---
description: Builds the deviation matrix by diffing per-repo inventories dimension-by-dimension, including the required meta-dimensions.
when_to_use: Use after the survey, to construct the matrix that Step 3's grill will resolve row by row.
---

# Step 2 — Gap and Deviation Matrix Construction

Diff the per-repo inventories dimension-by-dimension. Build the deviation matrix.

Each row represents one dimension where repos differ or where the objective forces a choice. Row
schema:

| Dimension | Current state per repo | Candidate resolutions                                 |
| --------- | ---------------------- | ----------------------------------------------------- |
| `<name>`  | `repo-A: X, repo-B: Y` | `align-to-X / align-to-Y / per-repo-deviation / drop` |

**Hard rule**: No dimension may be left out of the matrix because it seems obvious or minor.
Every cross-repo difference is a matrix row. Implicit alignment is a workflow failure.

Meta-dimensions to include alongside technical dimensions:

- **Rationale doc location**: where each repo's `docs/explanation/<objective-slug>-parity-decisions.md`
  (or closest equivalent) will be created (app-scoped `apps/<app>/docs/`, lib-scoped
  `libs/<lib>/docs/`, repo governance tree, etc.)
- **Repo-specific constraints**: any repo constraint (private visibility, self-hosted CI runner,
  dual-CLI parity guard, missing toolchain) that forces a per-repo deviation

**Output**: A complete deviation matrix. Every row has a dimension name, the current state per
repo, and candidate resolutions. No row is decided yet — decisions happen in Step 3.

**Success criteria**: Matrix covers every cross-repo difference and every meta-dimension above.

**On failure**: Return to Step 1 and extend the survey for the missing dimension.
