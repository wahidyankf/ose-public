---
description: "Why exit-status checking alone cannot catch this defect class."
when_to_use: "Use when evaluating whether an exit-status check alone is sufficient isolation."
---

# The Motivating Incident (part 3)

That is also why exit-status checking, as a first response to a fixture-escape symptom, is
structurally insufficient on its own: whichever of the above mechanisms is eventually confirmed,
the `git` commands involved still exit `0`. They do not fail -- they simply run against the wrong
repository. **A command that succeeds against the wrong target is indistinguishable, by exit code
alone, from a command that succeeds against the right one.** Any fix that stops at "assert the
subprocess exited zero" cannot, even in principle, catch this class of defect; it must be paired
with the other five layers below, each of which closes a specific _targeting_ mechanism rather
than a _failure_ mode.

This hazard class was already partially recognized in this codebase before the incident:
The retired in-tree fixture suite documented a `CwdLock` mutex because process working-directory
state is global and child `git` processes inherit it. `CwdLock` serializes cwd-sensitive tests
**within one process** so they cannot race on `set_current_dir` -- but the fixture at the center of
this incident did not call `set_current_dir` or use `CwdLock`. It is evidence the general hazard
class was visible, not evidence that this incident was closed; by itself it supplies none of the
six layers below (explicit `GIT_DIR` targeting, capped discovery, blanked identity/config, or a
pre-write escape guard).
