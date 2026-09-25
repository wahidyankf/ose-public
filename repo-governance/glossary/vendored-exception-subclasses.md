---
description: The two structurally different shapes a registry-declared class vendored path can take, and why confusing one for the other misfires in opposite directions.
when_to_use: Use before hand-editing a path the harness registry declares class vendored, or before writing a sentence that states the class vendored rule.
---

# The `class: vendored` Exception Has Two Subclasses

A path the `harness:` registry's `ownership:` list declares `class: vendored` is exempt from
[Governance Surfaces](./governance-surfaces.md)'s "never hand-edited" rule for generated mirrors,
but the exemption is not uniform — it covers two structurally different shapes, both real, and
confusing one for the other misfires in opposite directions.

| Subclass             | Registry signal                                                                                                                       | What is actually true                                                                                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Delimited-region** | `reason:` names an emitter that owns a marked region (no path here has this shape today)                                              | **Partially generated.** Content _inside_ the marked region (`>>> ... generated ... <<<`) is emitted from `.claude/` and silently reverted on the next `generate:bindings`; content _outside_ the markers is genuinely hand-authored. |
| **Wholly external**  | `reason:` states there is no in-repo source (e.g. `.codex/config.toml`, `.codex/ci-monitor-subagent.toml`, `.opencode/opencode.json`) | **Fully hand-maintained.** There is no delimited region and nothing to regenerate; the whole path is authored by hand.                                                                                                                |

Any surface stating the `class: vendored` rule states one of these two shapes, or links here rather
than restating either. A claim that "a vendored path has no `.claude/` source to regenerate from"
is true for the wholly-external subclass and **false** for the delimited-region subclass, whose
region is regenerated from `.claude/` on every `generate:bindings` run.

**Failure mode this entry exists to prevent**: an agent reads a too-broad statement of the rule,
concludes a whole delimited-region file is hand-editable, edits inside the delimited region, and
the next regeneration silently reverts it — the exact "Hand-Editing a Generated
Mirror" anti-pattern, with no gate failure, because auto-regeneration self-heals before any diff is
inspected.

## Related Documents

- [Governance Surfaces](./governance-surfaces.md) — the parent term cluster (surface, binding,
  mirror, autoloaded) this entry splits off from under the word budget.
- [File-Touch Discipline § Hand-Editing a Generated
  Mirror](../development/practice/file-touch-discipline/anti-patterns-commit-hygiene.md) — the
  commit-hygiene anti-pattern this distinction guards against.
