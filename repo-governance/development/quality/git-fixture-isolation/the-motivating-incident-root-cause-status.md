---
description: "Root-cause investigation status and open hypotheses."
when_to_use: "Use for the incident's root-cause status."
---

# The Motivating Incident (part 2)

**Root-cause confirmation for this specific fixture is the explicit subject of a dedicated plan**,
in progress at `plans/in-progress/rhino-cli-git-root-test-fixture-race/` at the time of this
writing (search the `plans/` tree by that slug if this convention is read after the plan archives
to `plans/done/` -- not hyperlinked directly here because that path moves on archival). As of this
convention's authoring, direct code inspection already rules out the
simplest hypothesis: the fixture already constructs both repositories as `tempfile::TempDir`
instances and passes an explicit `.current_dir(...)` to every `git` invocation -- it does not call
`std::env::set_current_dir` at all. The remaining, still-unconfirmed hypotheses on record are (a) a
subtler CWD- or temp-dir-resolution dependency inside the fixture itself, (b) the OS temp
directory (`TMPDIR`) resolving to a path under the real repository in some environment, or (c) a
cross-process interaction under `nx affected`'s parallel project fanout rather than a
single-process thread race. **This convention does not resolve which hypothesis is correct** --
that is the companion plan's job, scoped to this one fixture. What this convention establishes is
the general rule those findings only confirm the need for: **a fixture's isolation must not depend
on correctly guessing which of several plausible escape mechanisms applies.** Defense-in-depth
closes all of them at once, regardless of which one turns out to be the confirmed cause here.
