---
description: "Why all six layers are required, not just one assertion."
when_to_use: "Use when tempted to implement only one of the six layers."
---

# Why Defense-in-Depth (Not a Single Assertion)

Each layer closes a distinct escape mechanism. No single layer covers all of them, which is why
all six are mandatory rather than any one being sufficient on its own -- and why the rule does not
wait on confirming any single mechanism as _the_ cause before applying. The first three rows map
directly onto the three still-unconfirmed hypotheses from
[The Motivating Incident](./the-motivating-incident-repository-corruption.md); the point of defense-in-depth is that a
fixture built to this convention is protected under **any** of them, not just whichever one a
future investigation confirms.

| Escape mechanism                                                                                                                                                               | Layer(s) that catch it                                                               | Why exit-status checking alone misses it                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| A subtler CWD- or temp-dir-resolution dependency inside the fixture itself, including a process-global CWD raced by a concurrent thread/scenario (`set_current_dir` collision) | Standard 2 (explicit `GIT_DIR`) + Standard 4 (guard)                                 | The command still exits `0` -- it ran successfully, just against the real repository                       |
| `TMPDIR` resolves under the real repository (misconfigured env, CI runner quirk)                                                                                               | Standard 1 (`GIT_CEILING_DIRECTORIES`) + Standard 4 (guard)                          | Discovery finds the real `.git` above the fixture path; the command exits `0`                              |
| Cross-process interaction under parallel `nx affected`/`nx run-many` project fanout (multiple test invocations touching the same working tree concurrently)                    | Standard 1 + Standard 2 + Standard 4 (guard)                                         | Each individual process's commands can exit `0` even while colliding with another concurrently running one |
| Fixture omits `git init`, or runs it against the wrong directory, so ambient discovery walks up to the real repo                                                               | Standard 2 + Standard 4                                                              | Same as above -- success against the wrong repository, exit code `0`                                       |
| Fixture's `git config user.name`/`user.email` write escapes to the developer's real identity or the real repo's local config                                                   | Standard 2 (local writes stay inside `GIT_DIR`) + Standard 3 (global/system blanked) | The config write succeeds; nothing about exit status reveals which file it targeted                        |
| `git` binary missing, malformed arguments, or the fixture's temp directory was never created                                                                                   | Standard 5 (exit-status check)                                                       | This is the one class Standard 5 alone genuinely catches -- it remains necessary                           |
| A future code review misses a partially-applied isolation fix in a fixture under active debugging                                                                              | Standard 6 (process rule: throwaway clone only)                                      | None of the code-level layers protect the primary worktree while a fix is incomplete                       |
