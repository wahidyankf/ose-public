# Knowledge Capture Phase Template

**Knowledge Capture phase template** (insert as the last substantive phase, immediately before
Plan Archival — see [plan-archival.md](plan-archival.md)):

```markdown
## Phase N: Knowledge Capture

- [ ] [AI] Apply the litmus test to every `learnings.md` entry — keep only entries where a durable
      surface would catch this automatically next time; discard the rest with a one-line reason.
- [ ] [AI] Apply the **secret/sensitivity gate** to every surviving entry — sanitize to
      `<placeholder>` tokens or discard if the entry cannot be sanitized without losing its meaning.
- [ ] [AI] Apply the **repo-relevance gate** to every surviving entry — infra-private content stays
      in `private-sibling` only; public-governance content may route to `ose-public`; never
      cross-route private content into a public repo.
- [ ] [AI] Route each surviving entry to exactly one durable home. The rubric is open-ended —
      route to whichever surface owns that kind of knowledge (`repo-governance/`, `docs/`,
      `.claude/agents/`, `.agents/skills/`, a post-mortem, or any other durable home), landing a
      small non-code edit inline. Create or update a `plans/ideas/<slug>.md` two-pager only when the
      user has literally authorized that plan artifact; otherwise report the follow-up and record
      `Reported without plan authorization` with handoff evidence.
- [ ] [AI] For any entry routed to `plans/ideas/`, scan `plans/ideas/README.md` and the existing
      two-pagers FIRST after the user literally authorizes an idea artifact. Fold the learning into
      an authorized overlapping brief instead of creating a new file; only create a new authorized
      `plans/ideas/<slug>.md` when the scan confirms no existing brief overlaps (see
      [Integrate Before You Add](../../../../repo-governance/conventions/structure/plans/ideas-folder-overview-rationale-and-file-layout.md#integrate-before-you-add-no-duplicate-two-pagers)).
- [ ] [AI] **Code-routing rule**: if a learning's home is `apps/`, `libs/`, or tests, NEVER land it
      inline in this plan's commits/PR. File a separate `plans/ideas/` two-pager only with literal
      plan-artifact authorization; never create, move, or write under `plans/backlog/` because the
      promotion ripeness gate owns that transition. Otherwise use the reported terminal state. The
      sole carve-out is a
      bug/lint/test failure that blocks THIS plan's own scope — that is fixed inline as ordinary
      Root Cause Orientation work, not routed as a deferred learning.
- [ ] [AI] Record the terminal state of every entry (routed inline / explicitly authorized two-pager
      at `<path>` / reported without plan authorization with handoff evidence / discarded with
      reason) directly in `learnings.md`.
- [ ] [AI] If execution genuinely surfaced no generalizable learning, record the explicit escape
      `No generalizable learnings — <one-line reason>` instead of individual entries.

### Phase N Gate

> All checks below must pass before starting Plan Archival.

- [ ] [AI] Verify every `learnings.md` entry has reached a terminal state (routed / authorized and
      filed / reported without plan authorization / discarded) or the explicit "none" escape is
      present — no entry left open.
- [ ] [AI] Verify no code-homed learning landed inline — every code-routed learning has a
      corresponding explicitly authorized `plans/ideas/` two-pager or a report with handoff evidence.

> **Pause Safety**: all learnings are routed, authorized and filed, reported without plan
> authorization, or explicitly discarded; nothing is left dangling in `learnings.md`. Safe to
> stop. To resume: re-check `learnings.md` for any entry without a terminal-state marker.
```

**Exemptions**: pure-docs and trivial plans (a one-line rename, a single broken-link fix) MAY skip a
populated `learnings.md` — the explicit "none" escape (or an equivalent note in `delivery.md`)
satisfies the requirement without inventing insight from a change that had none to offer.
