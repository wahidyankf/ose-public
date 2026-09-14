# rhino — cli/behaviours/convention

Gherkin scenarios for rhino-cli repository-convention audit commands.

Features in this domain:

- `repo-governance-license-audit.feature` — license audit (`convention license validate`)

> Feature file names still say `repo-governance-*` for historical reasons — this file was
> split out of `gherkin/repo-governance/` (its content actually covers the `convention` command
> group, not `repo-governance`) during the Phase 1 rename/split step of the
> `enforce-identical-rhino-cli-gherkin` plan. Renaming the files themselves is a separate,
> later concern.

Emoji rules belong to the pinned RHINO's `convention-emoji` section;
[`gate/rust-delegation.feature`](../gate/rust-delegation.feature) covers `convention emoji validate`'s delegation.

See [Specs Directory Structure Convention](../../../../../../repo-governance/conventions/structure/specs-directory-structure.md)
for the canonical purpose of this folder.
