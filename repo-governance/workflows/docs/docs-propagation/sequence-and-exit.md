---
description: "The ten steps one docs-propagation run takes, from freezing its inputs to committing with the change, plus the partial outcome and the rerun guarantee."
when_to_use: "Use while carrying a change into the documents it affects."
---

# Sequence and Exit

## Sequence

1. **Freeze the inputs:** the change, any ledger, the revision, and uncommitted paths. A material
   change ends the run as `input-changed`, never restarting it.
2. **Find what went stale.** Search the whole document set for every name, path, command, flag,
   version, and interface the change removed, renamed, or redefined. Each ledger row is an item too.
3. **Remove what is obsolete.** A document describing something the repository no longer has is
   deleted, with every link and index entry pointing at it. Unique meaning that is still true moves
   to its canonical home first.
4. **Keep each fact in its one home.** The root README orients; a project README follows
   [App README vs Specs](../../../conventions/structure/app-readme-vs-specs.md); an index lists and
   annotates its children per
   [Governance README Completeness](../../../conventions/structure/governance-readme-completeness.md);
   a page serves one mode per [Diátaxis](../../../conventions/structure/diataxis-framework.md). A
   summary links one level down to its detail, per
   [Progressive Disclosure](../../../principles/content/progressive-disclosure.md), and a fact with a
   canonical home is linked, never copied.
5. **Write for a newcomer.** Each affected document tells a reader new to the repository what it is
   and why it matters from the opening, shows the next step without assuming the layout, and leaves
   no undefined term or skipped prerequisite, per
   [README Quality](../../../conventions/writing/readme-quality.md) and
   [Content Quality](../../../conventions/writing/quality.md), never a readability score. A sparing
   marker per [Emoji Usage](../../../conventions/formatting/emoji.md) may aid scanning; decoration
   never does.
6. **Run what is safe to run.** Execute every command and example an affected document shows
   through the repository's declared entry point, so a document shows only what was run. Never run
   one that touches a production or shared system, publishes, spends, needs a secret, or cannot be
   undone; the document says plainly that it was not exercised.
7. **Treat specifications as canonical.** Refresh their readability, navigation, and links; when one
   disagrees with the implementation, the partial outcome applies, per
   [Specs-Application Sync](../../../development/quality/specs-application-sync.md).
8. **Change only what is stale, missing, or obsolete.** Never rewrite accurate prose, invent
   behaviour, or fold in unrelated work.
9. **Verify once.** Run the repository's existing checks. Repair only failures this run caused, and
   only while their count strictly decreases; stop and report when it does not.
10. **Commit with the change it explains,** per
    [Commit Messages](../../../development/workflow/commit-messages.md). A handed-over ledger's
    repairs land as their own commit.

## Exit

Partial outcome: when the code, a specification, or the audience is ambiguous or they disagree,
that document stays unchanged and the owner is asked through
[Grill Me](../../../../.agents/skills/grill-me/SKILL.md); the rest lands. A rerun on unchanged inputs
changes nothing.

## Related Documents

- [Docs Propagation](../docs-propagation.md) — the workflow's entry, document set, and contract.
