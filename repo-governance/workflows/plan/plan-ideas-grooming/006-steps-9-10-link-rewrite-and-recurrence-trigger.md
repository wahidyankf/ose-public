---
description: The unified move/rename link-rewrite mechanism and rename criteria, plus the workflow's own two-condition re-run trigger.
when_to_use: Use when fixing inbound/outbound links after a move or rename, or confirming whether a repo is due for another sweep.
---

# Steps 9-10 — Link Rewrite, and Recurrence Trigger

## 9. Link rewrite (covers move, rename, and move-plus-rename)

This step covers every filename-changing outcome the earlier steps produce — an intra-repo move
into a quadrant folder, a rename, or both together — as one mechanism, never as separate move and
rename procedures:

- **Intra-repo** (a file moving into a quadrant folder and/or being renamed within the same repo):
  rewrite the file's own relative links first, then grep the whole repo for any inbound relative
  link pointing at the file's old path or filename and update each to the new path/filename.
- **Cross-repo** (Step 5's relocation): convert every `./`-relative link inside the moved file to an
  absolute `https://github.com/<org>/<repo>/blob/main/...` URL (the same pattern already used in
  [`deploy-targets-registry.md`](../../../../plans/ideas/q2-not-urgent-important/deploy-targets-registry.md)), and check the
  source repo for (though do not expect to find) any inbound link into the file being relocated.

**Rename criteria**: apply a rename whenever Step 2 (merge/split), Step 4 (residency-driven
relocation revealing the name was scoped to the wrong context), or Step 6 (reshape) leaves a
filename that no longer matches its content, or whenever the current filename never followed
kebab-case (`[a-z0-9-]+\.md`, per the
[File Naming Convention](../../../conventions/structure/file-naming.md)). Compute the new filename
from the file's current title. If the computed filename already exists in the destination
directory — a **collision** — defer the rename, log it as an unresolved follow-up in that repo's
grooming log, and leave the file under its current name until a future run resolves the collision;
never overwrite the existing file at the computed name.

## 10. Recurrence trigger

State this workflow's own re-run condition here, in its own "When to use" section above, so the
condition is discoverable without reading design documentation external to this file: run this
workflow against a given repo when either that repo's flat `plans/ideas/` file count (summed
across its quadrant folders, excluding `README.md`) exceeds **60**, or **90 days** have elapsed
since this workflow's last recorded run against that repo — whichever occurs first. Track the
last-run date via a `> Last groomed: YYYY-MM-DD` line this workflow appends to (or updates on) that
repo's own `plans/ideas/README.md` at the end of every run.
