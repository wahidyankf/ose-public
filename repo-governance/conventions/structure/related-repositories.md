---
description: Declares ose-public and its private sibling independent repositories, names the five OSE Code Repositories, independent upstream/product boundaries, and required awareness surfaces.
when_to_use: Use when adding or changing a cross-repository reference, consumer integration, or independent-repository boundary, or when a change here seems to need action in the private sibling.
---

# Related Repositories Convention

Repository awareness helps contributors route work without turning every named repository into a
sync target. The descriptive catalogue is
[Related Repositories](../../../docs/reference/related-repositories.md).

## The OSE Code Repositories

**OSE Code Repositories** names the five repositories this project is built and maintained in:
`ose-public`, the private sibling, [RHINO](https://github.com/wahidyankf/rhino),
[HIPPO](https://github.com/wahidyankf/hippo), and
[BeaverNest](https://github.com/wahidyankf/beaver-nest). The name labels that set for routing and
nothing else: not a GitHub organization, parent repository, synchronized group, or shared release.
Membership obligates each repository to name the other four so a contributor can find them, and
obligates nothing further.

## Independent repositories

`ose-public` and its private sibling are independent repositories. Neither is the source of the
other's governance, agents, skills, workflows, harness bindings, CI conventions, or RHINO adoption
or pin. Each may add, change, or remove any rule, agent, skill, workflow, convention, or RHINO pin
without consulting, mirroring, or notifying the other. No change made in one creates a sibling
obligation, parity plan, parity identity record, deviation or divergence record, or byte comparison
in the other. A change from the other repository is adopted only by an explicit, one-off request
delivered through the adopting repository's own route, after which the adopting repository owns its
copy. A shared catalog such as [ose-rules](https://github.com/wahidyankf/ose-rules) is adopted the
same way.

Followed when no normative surface here asks that a change be checked against, proposed to,
recorded for, or compared with the private sibling. Violated when a normative surface states or
implies a parity pair or set, that this repository is the canonical source the private sibling
receives changes from, that a change here records a sibling obligation, or that RHINO changes or
pins must be shared or compared across the two.

## Upstream and product repositories

[RHINO](https://github.com/wahidyankf/rhino) is an independent MIT-licensed repository-hygiene
validator that holds no OSE-specific values: every budget, tree, palette, and harness roster it
enforces is declared by the repository under inspection. This repository consumes it only through
its own checksum-pinned `rhino.lock`.

[HIPPO](https://github.com/wahidyankf/hippo) is an independent MIT-licensed upstream tool. OSE may
consume a checksum-pinned HIPPO release and maintain consumer-specific configuration, mappings, and
tests. HIPPO source, behavior specifications, generic tests, and release automation remain upstream;
they must not be copied, vendored, or forked into an OSE repository.

[BeaverNest](https://github.com/wahidyankf/beaver-nest) is an independent MIT-licensed product.
Useful learnings may inform OSE, but neither repository automatically receives the other's product,
governance, agent, skill, workflow, or tool changes.

Naming a repository creates navigation only: no sync target, comparison, gate, propagation
workflow, or byte-identity manifest follows from it.

## Required awareness surfaces

- `AGENTS.md` names the OSE Code Repositories contributors must know before routing work.
- `README.md` gives readers a short relationship summary and links to the descriptive catalogue.
- `docs/reference/related-repositories.md` records each named repository's visibility, license,
  role, ownership boundary, and correct starting point.
- This convention owns the normative independence and consumer-boundary rules; descriptive
  documents link here instead of creating another canonical rule.

Catalogue only relationships OSE contributors need for durable routing. A one-off compatibility
test or shared tool invocation does not, by itself, create a repository relationship.

## Change and validation procedure

1. Classify the relationship as independence, upstream consumption, knowledge sharing, or none.
2. Update this convention before its instruction and descriptive touchpoints.
3. Record no obligation for any other repository.
4. Validate instruction budgets, annotated indexes, Markdown links, and governance consistency.
5. For Rhino changes, validate this repository's `rhino.lock` and `repo-config.yml` only.

Structural placement is covered by repository-rules, index, and link checks. Routing a novel work
item, and the independence statement, remain **unenforced by decision** because they need human
product and ownership judgment; the catalogue supplies the evidence.

## Principles Implemented/Respected

- [Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md) —
  independence and upstream boundaries are stated directly.
- [Documentation First](../../principles/content/documentation-first.md) — relationships are
  discoverable from committed entry points.
- [Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md) — one
  canonical convention owns the rules while one catalogue serves readers.
