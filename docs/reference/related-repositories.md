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

The **OSE Code Repositories** are the five repositories Open Sharia Enterprise is built and
maintained in: `ose-public`, the private sibling, RHINO, HIPPO, and BeaverNest. The name labels that set
so a reader can find every part of the project from any one of them. It is not a GitHub
organization, not a parent or container repository, and not a shared release train — each of the
five versions, gates, and releases on its own schedule.

Within the set there is one two-repository parity pair plus independent public repositories that
supply tools or product learnings. Each has a different job, so choose the repository that matches
what you are trying to understand rather than treating them as interchangeable copies.

This page is the descriptive catalogue. The canonical relationship, parity, propagation, and
consumer-boundary rules are governed by the
[Related Repositories Convention](../../repo-governance/conventions/structure/related-repositories.md).

| Repository                                               | Visibility  | Role                                                             | Start there when…                                                  |
| -------------------------------------------------------- | ----------- | ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| [`ose-public`](https://github.com/wahidyankf/ose-public) | Public, MIT | The OSE product platform and its public research                 | You want to understand or run OSE itself.                          |
| The private sibling                                      | Private     | Authorized product operations and infrastructure work            | You are an authorized maintainer following its private onboarding. |
| [RHINO](https://github.com/wahidyankf/rhino)             | Public, MIT | Upstream repository-hygiene validation, specifications, releases | You are changing RHINO behavior rather than OSE integration.       |
| [HIPPO](https://github.com/wahidyankf/hippo)             | Public, MIT | Upstream resource coordination, specifications, releases         | You are changing HIPPO behavior rather than OSE integration.       |
| [BeaverNest](https://github.com/wahidyankf/beaver-nest)  | Public, MIT | Independent family product and applied learning lab              | You are changing the BeaverNest product.                           |

## The reader path that matters most

Choose **OSE Public** when the question is about the OSE product, its public website, research, or
product engineering. Start with [Getting started with OSE Public](../tutorials/getting-started-with-ose-public.md).

The private sibling is not a public setup target. Its documentation and local sandbox instructions are
available only to authorized maintainers; public documentation intentionally does not describe its
internal implementation, access model, or operational layout.

## Repositories outside the parity set

Some public repositories support or inform OSE without sharing parity obligations. **They carry no
sync obligation in either direction**, sit outside the `rhino-cli` byte-identity boundary, and are
not propagation targets for governance, agent, skill, or workflow changes. No gate, agent, or
workflow here may treat one as a parity peer.

### RHINO stays upstream

[RHINO](https://github.com/wahidyankf/rhino) is a Rust CLI that checks what a repository's
documentation must get right: word budgets on governed instructions, directory maps that match the
tree, internal Markdown links that resolve, Mermaid diagrams that stay legible, and one canonical
instruction body kept in parity across every declared coding harness. It holds no policy of its
own — every value it enforces arrives from the inspected repository's own `repo-config.yml` — so it
is usable far outside OSE and carries no OSE-specific defaults.

**RHINO the repository is not `apps/rhino-cli`.** This repository runs its own in-tree F#
`apps/rhino-cli`, and that implementation is what the byte-identity boundary covers. The upstream
RHINO repository sits outside that boundary entirely: naming it here creates navigation, not a
parity peer, and no manifest, gate, or propagation workflow may widen to include it. RHINO source,
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
transfer creates no parity or automatic propagation obligation.

It carries no `rhino-cli` at all, so there is nothing for the byte-identity boundary to cover, and
`rhino-cli`'s parity gate asserts that the boundary never names it — see
`apps/rhino-cli/src/RhinoCli.Application/src/Parity.fs` and its tests in
`apps/rhino-cli/tests/unit/Steps/ParityManifestSteps.fs`.

If you are looking for BeaverNest code, issues, or plans, go to that repository. Anything still
naming BeaverNest here is a historical record — an archived plan under [`plans/done/`](../../plans/done/README.md)
or a published update post — not live work.

This routing is **unenforced by decision**: determining whether proposed work belongs to the
family product requires human product judgment.

## Shared boundaries

The `apps/rhino-cli` source must stay byte-identical across `ose-public` and the private sibling — the
parity pair this page describes. See the
[SDLC gate standard](./sdlc-gate-standard.md#rhino-cli-byte-identity-boundary) for the policy.

`parity manifest validate` compares a repo's own committed manifest against that same repo's
tracked boundary only — it never fetches or compares against the sibling repo. Rolling a `rhino-cli`
change out to one repo while deferring it in the other therefore produces **silent drift**, not a red
gate in either repo; each repo's manifest stays internally consistent even while the two diverge
from each other. Verify parity across the pair by diffing the boundary directly, not by trusting
a green `parity manifest validate` in either repo.

### What is deliberately not identical

The byte-identity boundary covers `apps/rhino-cli` and the shared Gherkin tree, and nothing else.
`package.json` script names in particular have diverged: the harness-bindings validator is
`harness:bindings-validation` in `ose-public` and `validate:harness-bindings` in the private sibling,
running the same underlying command. Resolve every command a cross-repo plan invokes against each
repository's own `package.json` rather than assuming the name carries over.

The `volta` toolchain pins in `package.json` have diverged the same way: `ose-public` pins
`npm` to `11.11.0` and the private sibling to `11.16.0`. Nothing compares them, so on one host with one
installed npm, `rhino-cli doctor` reports a version warning in `ose-public` and a clean
16/16 in the private sibling — two verdicts from the same machine. Read a doctor warning about a
toolchain version as a statement about that repo's pin, not about the host.

## Sync cadence

Content parity and the `rhino-cli` byte-identity boundary above answer **what** stays identical;
this answers **how often** the private sibling is brought current with `ose-public`.

**The private sibling is kept current through recorded sibling obligations.** `rhino-cli` and shared
`repo-governance/` content (conventions, workflows, agent definitions) propagate from `ose-public`
through a separate one-repository run, not an unrecorded batch. The repositories need not merge at
the same time: each ready PR lands when its own hardened prerequisites and merge opportunity permit,
and the unfinished counterpart remains an explicit sibling obligation until convergence. That repo
backs live authorized-maintainer and infrastructure operations, so the gap should remain short and
visible rather than silent.

For portable governance, agent, and skill changes, public is the source and the private sibling is the
only propagation target. Verify the portable manifest byte-for-byte at convergence; list
private-only operational exceptions explicitly.

### Private-only operational exceptions

- **Elixir/Erlang CI toolchain provisioning.** `ose-public`'s `rust` job in `pr-quality-gate.yml`
  installs Erlang/Elixir via `erlef/setup-beam` and sets `RHINO_REQUIRE_ELIXIR=1`, so the two
  Elixir formatter-wrapper scenarios bound in
  `apps/rhino-cli/tests/unit/Steps/GateExecutionSteps.fs` run for real on every push. The private sibling
  carries no Elixir source and provisions no such toolchain, so those same byte-identical tests
  self-skip there instead — a deliberate, not accidental, divergence: nothing in the private sibling
  needs the coverage the toolchain would exercise.

## Contribution and access boundaries

External contribution intake is closed across this coordinated delivery. Public readers can explore,
fork, and learn from the MIT repositories, but should not expect an external pull-request intake or
access to private systems.
