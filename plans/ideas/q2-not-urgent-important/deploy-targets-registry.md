# Declare deploy-target branches in a registry instead of deriving them from `git branch -r`

One-line summary: `AGENTS.md` states "`git branch -r` is authoritative" for environment branches, so
whether a deploy target exists is answered by whichever refs happen to be on `origin` today — which
let two phantom `stag-beaver-nest-*` branches sit on `origin` for a day while four separate committed
documents asserted they did not exist yet, and let no one notice the contradiction.

> Provenance: surfaced 2026-08-05 during a `repo-rules-maker` review of what governance should have
> prevented the beaver-nest ref-advance incident. The reviewing agent judged the phantom-refs failure
> itself **not** worth a new rule — nothing broke, no workflow or Vercel/k3s target ever consumed those
> refs — but flagged that `git branch -r` as source-of-truth is the exact derive-from-state pattern the
> maintainer has said elsewhere he dislikes in favor of explicit, declared configuration. This brief
> exists to record that fork as a deliberate design option, not to relitigate the phantom-refs finding.

## Problem / context

`AGENTS.md` §Git Workflow reads: "`git branch -r` is authoritative and includes lib/backend targets
(`prod-web-ui`, `stag-ose-be`) absent from the Web Sites table below." That sentence makes the truth
about which deploy targets exist **whatever remote branches currently happen to be pushed**, rather
than something declared anywhere a human or agent can read without querying git. Two consequences
follow from that design, independent of any single incident:

- **Nothing distinguishes "provisioned" from "leftover."** A ref that should not exist (created by a
  since-abandoned rebrand script, a defork, a manual experiment) reads identically to one that should.
  `git branch -r` cannot tell you which — it can only tell you what is there.
- **Docs and reality can silently diverge in either direction** with no mechanical check catching it.
  In the beaver-nest case, `stag-beaver-nest-be`/`-fe` existed on `origin` while
  `plans/ideas/beaver-nest-first-deploy.md`, `docs/reference/system-architecture/deployment.md` (which
  lists them as "Planned"), `apps/README.md`, and a done plan's `tech-docs.md` all asserted the
  opposite. Nothing was broken by this — no workflow, Vercel project, or k3s consumer ever read those
  refs — but the contradiction between four documents and live git state persisted undetected.

`repo-config.yml` already centralizes several other categories of cross-cutting truth as top-level
keys — `harness`, `coverage`, `specs`, `instruction-size`, `env-contract`, `env-injection` — each
validated by `rhino-cli repo-config validate` against a canonical schema. Deploy targets are the one
category in this list still governed by convention prose pointing at live git state instead of by a
declared, validated key.

## Why now

Nothing is on fire. This is a design-debt observation raised while investigating an unrelated
incident, not a response to active harm — the phantom refs caused zero downstream breakage in the
case that surfaced it. What makes it worth writing down now, while it is fresh, is that the pattern is
general: any of the four repos can accumulate a stale or premature environment-branch ref at any time,
and the current design has no mechanism — human or automated — to flag the mismatch between what
`git branch -r` shows and what the deployment docs claim.

## Prior art / precedents

- [`AGENTS.md` §Git Workflow](../../../AGENTS.md) — the current source of the "`git branch -r` is
  authoritative" sentence this brief proposes to change.
- [`repo-config.yml`](../../../repo-config.yml) — the existing pattern of top-level, schema-validated
  registry keys (`harness`, `coverage`, `specs`, `instruction-size`, `env-contract`,
  `env-injection`) that a `deploy-targets` key would extend, not invent.
- `apps/rhino-cli` `repo-config validate` (`cli.rs`) — already strict-deserializes `repo-config.yml`
  against a canonical schema; a `deploy-targets` key gains validation for free at the parse level, and
  a live-ref comparison would need one new leaf command.
- [`docs/reference/system-architecture/deployment.md`](../../../docs/reference/system-architecture/deployment.md)
  — the document that already distinguishes "Planned" from live targets in prose; a registry would
  make that distinction machine-checkable instead of only documented.
- [`beaver-nest-first-deploy`](https://github.com/wahidyankf/beaver-nest/blob/main/plans/ideas/beaver-nest-first-deploy.md)
  — the sibling repo's own two-pager that provisions the first real `prod-beaver-nest-fe`/
  `stag-beaver-nest-be` targets; whatever registry shape this brief settles on should be the one that
  plan declares into, not a second convention it must also satisfy.
- **Checkout ref drift** — a separately tracked sibling concern about a ref-advancing `fetch`
  desyncing a checkout; this brief retains the phantom-refs scope.

## Proposed direction (sketch)

- Add a `deploy-targets:` top-level key to `repo-config.yml`, one entry per declared environment
  branch, naming the app, the branch (`prod-*`/`stag-*`), and a status (`provisioned` |
  `planned` | `retired`).
- `rhino-cli repo-config validate` gains the key-set/schema check for free, matching every other
  category in the file.
- A new, narrower validator — a `repo-config` subcommand or a leaf under an existing domain — compares
  the registry against live `git branch -r` output and flags exactly two mismatch shapes: a ref marked
  `provisioned` that does not exist on `origin`, and a ref that exists on `origin` but is absent from
  the registry entirely (the phantom case this brief is named for).
- `git branch -r` stops being cited as authoritative in `AGENTS.md`; it becomes the thing validated
  **against** the registry, and the registry becomes what a human or agent reads first.
- Existing deployment docs (`deployment.md`, `apps/README.md`, per-app READMEs) keep their prose, but
  the registry becomes the single machine-checkable source those documents summarize, rather than each
  independently asserting existence/non-existence in text that can drift.

## Rough scope & non-goals

In scope: the `deploy-targets` schema key, its `repo-config validate` coverage, one new live-ref
comparison check, and the `AGENTS.md` wording change removing "`git branch -r` is authoritative."

Out of scope:

- Actually provisioning any new deploy target — that is `beaver-nest-first-deploy`'s job, not this
  brief's.
- Deleting, renaming, or otherwise mutating any existing branch — this is a declaration-and-validation
  change only.
- A general "docs must match live git state" convention — this brief is scoped to deploy-target
  branches specifically, the one category with a real (if harmless) incident behind it. Generalizing
  further is a separate decision if this pattern proves out.
- Changing how `prod-*`/`stag-*` branches are pushed to, or who is allowed to push them — purely a
  registry-and-validation addition.

## Risks & open questions

- **Is this over-engineering a problem that caused zero harm?** The reviewing agent's own verdict was
  "not worth a rule" for the phantom-refs finding in isolation. This brief exists because the
  _pattern_ (derivation over declaration) is the maintainer's stated general preference, not because
  the specific incident demands a fix. Worth re-confirming appetite before promoting. (open)
- **Three-repo scope.** `repo-config.yml` and `rhino-cli` both fall under the byte-identity boundary
  spanning ose-public and the private sibling with zero carve-outs; beaver-nest carries a fork of
  `rhino-cli` and would need its own deliberate porting decision, separate from the other two. (open)
- **Registry staleness is a new failure mode, not a solved one.** A declared registry can itself drift
  from reality (an entry never updated after a branch is actually retired) — the live-ref comparison
  check is what keeps that honest, so it is load-bearing, not optional polish. (open)
- **Where does the live-ref check run?** Locally on demand, in CI, in a scheduled job — unresolved,
  and affects how quickly a real drift would surface versus how much it costs to run. (open)

## What success looks like + promotion signal

Success is narrow: `repo-config.yml` names every `prod-*`/`stag-*` branch the four repos intend to
have, `rhino-cli repo-config validate` rejects a malformed entry the same way it does for every other
top-level key, and a single command reports any mismatch between the registry and live `git branch -r`
output — in either direction — rather than that mismatch being discoverable only by a human noticing a
contradiction across four unrelated documents, as happened here.

Promotion signal: the maintainer confirms the derive-vs-declare tradeoff is worth the four-repo
schema change, or a second phantom/missing-ref incident occurs and the manual-discovery cost repeats.
