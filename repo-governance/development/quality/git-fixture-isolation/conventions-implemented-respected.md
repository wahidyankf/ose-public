---
description: "Conventions this convention implements."
when_to_use: "Use to trace this convention's cross-references."
---

# Conventions Implemented/Respected

This convention implements/respects the following conventions:

- **[Regression Test Mandate](.././regression-test-mandate.md)**: Adding an exit-status assertion in
  response to a single observed fixture-escape symptom is exactly the kind of narrowly-scoped fix
  that mandate's spirit calls for -- but on its own it is a check for command _failure_, not for
  command _success against the wrong repository_, which is the actual defect class the motivating
  incident revealed. This convention supplies the durable, defense-in-depth rule that a narrow
  exit-status check is missing. Standard 5 below (exit-status checking) is explicitly retained as
  one of the six required layers, not replaced.

- **[Behaviour-Driven Development](../../behaviour-driven-development.md)**: CLI apps in this monorepo
  (`Rhino`, `crane-cli`) run integration tests against real `/tmp` filesystem
  fixtures per that standard's "CLI App Implementation Pattern." Any such fixture that also shells
  out to `git` (to build a throwaway repository as test data) is squarely inside this convention's
  scope -- the isolation boundary the Three-Level Testing Standard draws around the filesystem must
  extend to the git repository state living inside that filesystem, not stop at the directory
  boundary alone. Public CLI process invocation belongs to E2E, while the local fixture setup and
  direct adapter proof belong to Integration.

- **[Reproducible Environments Convention (Git Identity Guardrail)](../../workflow/reproducible-environments.md)**:
  That convention's Git Identity Guardrail prohibits any agent from writing a `[user]` override
  into a repository's `.git/config` at any scope. This convention addresses the same class of
  corruption reached through a different door: an automated fixture, not a human edit or an agent
  command, writing `user.name`/`user.email` into the real repository's local config. Standard 3
  (identity/config hygiene) is this convention's analogue of that guardrail, scoped to fixtures
  rather than to commits or agent actions.
