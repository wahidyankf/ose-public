---
title: "Related Repositories"
description: "How the Open Sharia Enterprise repositories differ and where to begin."
category: reference
subcategory: ecosystem
tags:
  - reference
  - ecosystem
created: 2026-04-18
---

# Related Repositories

The **OSE Code Repositories** (`ose-projects`) are exactly the seven repositories Open Sharia
Enterprise is built and maintained in: `ose-public`, the private sibling, RHINO, HIPPO, BeaverNest,
ose-rules, and py-typekit. The name labels that set so a reader can find every part of the project
from any one of them. It is navigation only: not a GitHub organization, not a parent or container
repository, not a parity group, and not a shared release train — each of the seven versions, gates,
and releases on its own schedule.

All seven are independent repositories: two supply OSE itself, three supply upstream tools, one is a
separate product, and one is a shared rules catalog. Each has a different job, so choose the
repository that matches what you are trying to understand rather than treating them as
interchangeable copies.

This page is the descriptive catalogue. The canonical independence and consumer-boundary rules are
governed by the
[Related Repositories Convention](../../repo-governance/conventions/structure/related-repositories.md).

| Repository                                               | Visibility  | Role                                                             | Start there when…                                                  |
| -------------------------------------------------------- | ----------- | ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| [`ose-public`](https://github.com/wahidyankf/ose-public) | Public, MIT | The OSE product platform and its public research                 | You want to understand or run OSE itself.                          |
| The private sibling                                      | Private     | Authorized product operations and infrastructure work            | You are an authorized maintainer following its private onboarding. |
| [RHINO](https://github.com/wahidyankf/rhino)             | Public, MIT | Upstream repository-hygiene validation, specifications, releases | You are changing RHINO behavior rather than OSE integration.       |
| [HIPPO](https://github.com/wahidyankf/hippo)             | Public, MIT | Upstream resource coordination, specifications, releases         | You are changing HIPPO behavior rather than OSE integration.       |
| [BeaverNest](https://github.com/wahidyankf/beaver-nest)  | Public, MIT | Independent family product and applied learning lab              | You are changing the BeaverNest product.                           |
| [py-typekit](https://github.com/wahidyankf/py-typekit)   | Public, MIT | Upstream typed-result library `ferret-cli` bundles               | You are changing py-typekit rather than FERRET's use of it.        |
| [ose-rules](https://github.com/wahidyankf/ose-rules)     | Public, MIT | Shared rules catalog, adopted here only by explicit copy         | You want to propose a rule that holds beyond this repository.      |

## The reader path that matters most

Choose **OSE Public** when the question is about the OSE product, its public website, research, or
product engineering. Start with [Getting started with OSE Public](../tutorials/getting-started-with-ose-public.md).

The private sibling is not a public setup target. Its documentation and local sandbox instructions are
available only to authorized maintainers; public documentation intentionally does not describe its
internal implementation, access model, or operational layout.

## Upstream and product repositories

Some public repositories support or inform OSE. **They carry no sync obligation in either
direction**, sit outside OSE's local source boundaries, and are not propagation targets for
governance, agent, skill, or workflow changes. No gate, agent, or workflow here may treat one as a
peer to keep in step.

### RHINO stays upstream

[RHINO](https://github.com/wahidyankf/rhino) is a Rust CLI that checks what a repository's
documentation must get right: word budgets on governed instructions, directory maps that match the
tree, internal Markdown links that resolve, Mermaid diagrams that stay legible, and one canonical
instruction body kept in parity across every declared coding harness. It holds no policy of its
own — every value it enforces arrives from the inspected repository's own `repo-config.yml` — so it
is usable far outside OSE and carries no OSE-specific defaults.

RHINO is consumed only as a checksum-pinned release, pinned by this repository's own `rhino.lock`.
Naming it here creates navigation only, and no manifest, gate, or propagation workflow may widen to
include it. RHINO source,
behavior specifications, release automation, and generic tests stay upstream and are never copied,
vendored, or forked into an OSE repository.

### HIPPO stays upstream

[HIPPO](https://github.com/wahidyankf/hippo) coordinates resource-sensitive development work across
repository checkouts. OSE consumes its published executable through the root `./hippo` bootstrap,
which verifies the version, source commit, platform archive checksum, and embedded identity before
placing the executable in an external user cache.

Only OSE-specific integration belongs here: the checksum lock, bootstrap, local-policy example,
worker-variable mappings, entrypoint declarations, and consumer tests. HIPPO implementation,
behavior specifications, release automation, and generic conformance tests remain upstream. Never
copy or fork that source into OSE.

### BeaverNest moved out

[`beaver-nest`](https://github.com/wahidyankf/beaver-nest) is where the BeaverNest product now
lives. It used to be developed here as `apps/beavernest-app` (Flutter Web) and `apps/beavernest-be`
(F#/Giraffe), with a matching `specs/apps/beavernest/` spec tree, an `infra/dev/beavernest-app/`
Compose stack, and two deployer agents. **All of that was removed from `ose-public`**; the product
was rebuilt on Phoenix LiveView and Elixir in its own repository.

BeaverNest is a continuously used, family-only production product. Its scope ends at the family
boundary: "production" means real ongoing family use, not public or general-purpose availability.
It targets one continuously available family environment rather than separate staged environments;
Phoenix LiveView is the current fit for that operating model.
It also serves as an applied lab for learning how AI-assisted coding can support everyday family
activities and development with a
[dynamically typed language such as Elixir](https://hexdocs.pm/elixir/typespecs.html). Useful
learnings can flow back selectively into `ose-public` and other OSE products; this knowledge
transfer creates no sync or automatic propagation obligation.

It carries no OSE-local Rhino source, so there is no source-boundary relationship to cover.

If you are looking for BeaverNest code, issues, or plans, go to that repository. Anything still
naming BeaverNest here is a historical record — an archived plan under [`plans/done/`](../../plans/done/README.md)
or a published update post — not live work.

This routing is **unenforced by decision**: determining whether proposed work belongs to the
family product requires human product judgment.

## Independent evolution

`ose-public` and its private sibling are independent. Neither is the source of the other's
governance, agents, skills, workflows, harness bindings, CI conventions, or RHINO pin, and each may
add, change, or remove any of them without consulting, mirroring, or notifying the other. No change
in one creates a sibling obligation, plan, identity record, divergence record, or byte comparison in
the other. The canonical statement is the
[Related Repositories Convention](../../repo-governance/conventions/structure/related-repositories.md#independent-repositories).

### What is deliberately not shared

`package.json` script names, toolchain pins, CI runners, and gate composition are each repository's
own. Resolve every command against the repository you are standing in rather than assuming a name
or version carries over. Read a doctor warning about a toolchain version as a statement about this
repository's pin, not about the host.

### Adopting a change from another repository

A change from the private sibling, or from a shared catalog such as
[ose-rules](https://github.com/wahidyankf/ose-rules), is adopted only by an explicit, one-off request
delivered through this repository's own route. After adoption this repository owns its copy; no
sync cadence, recorded obligation, or later comparison follows.

## Contribution and access boundaries

External contribution intake is closed across this coordinated delivery. Public readers can explore,
fork, and learn from the MIT repositories, but should not expect an external pull-request intake or
access to private systems.
