# Knowledge Capture Routing Verification (Step 5h continued): Repo-Relevance, Audit Procedure, Severity

1. **Repo-relevance gate satisfied** — confirm no infra-private content (Terraform, k3s, Proxmox,
   `coralpolyp`, real hostnames/inventories) was routed into this repo's public surfaces (`docs/`,
   `repo-governance/`, `.claude/`) when this repo is `ose-public`. Any cross-routed
   infra-private content: **CRITICAL** finding — archival is BLOCKED.
2. **Mandatory phase presence carried through to archival** — if `plan-checker`'s silent-absence
   MEDIUM finding for the Knowledge Capture phase was never resolved before this archival check runs,
   treat as unresolved: **HIGH** finding, escalated to a blocking condition until either a phase or an
   explicit "none" record exists.
3. **No duplicate two-pager created in `plans/ideas/`** — for any entry routed to `plans/ideas/`,
   confirm the routing note evidences the overlap scan required by
   [Integrate Before You Add](../../../../repo-governance/conventions/structure/plans/ideas-folder-overview-rationale-and-file-layout.md#integrate-before-you-add-no-duplicate-two-pagers):
   either it names the pre-existing brief the learning was folded into, or it states the scan of
   `plans/ideas/README.md` found no overlapping brief before a new file was created. A new
   `plans/ideas/<slug>.md` created in this plan's diff without that evidence, or one that duplicates
   an existing brief's topic: **HIGH** finding.

### How to Audit

1. Read `learnings.md` in full (or confirm its absence plus the explicit "none" record elsewhere).
2. For each entry, resolve its recorded routing destination and verify it against the repo:
   `rtk ls plans/ideas/<quadrant>/<slug>.md` for authorized `plans/ideas/` two-pagers, handoff
   evidence for reported entries, and `rtk git log`/`rtk git diff` for inline commits.
3. Run `Grep` for secret-shaped patterns across `learnings.md`.
4. Run `Grep` for infra-private terms (Terraform, k3s, Proxmox, `coralpolyp`, real hostnames) across
   any non-private-sibling routed destination named in the entries.
5. For any entry routed to `plans/ideas/`, `Bash git diff` this plan's commits for new files under
   `plans/ideas/`, then read `plans/ideas/README.md` as it stood before this plan's changes to check
   whether an existing brief already covered the same topic.
6. File findings per the severity table below; a single unresolved entry is sufficient to BLOCK
   archival regardless of how many other entries passed.

### Finding Severity

- Any `learnings.md` entry not in a terminal state at archival time: **CRITICAL** (BLOCKS archival)
- Code-homed learning landed inline instead of being filed with authorization or reported: **CRITICAL** (BLOCKS
  archival)
- Unsanitized secret in `learnings.md`: **CRITICAL** (BLOCKS archival)
- Infra-private content cross-routed into a public repo: **CRITICAL** (BLOCKS archival)
- Knowledge Capture phase entirely absent with no explicit "none" record carried through to archival
  time: **HIGH** (escalated from `plan-checker`'s authoring-time MEDIUM if left unresolved)
- New `plans/ideas/` two-pager created without evidence of the overlap scan, or one that duplicates an
  existing brief's topic: **HIGH**
