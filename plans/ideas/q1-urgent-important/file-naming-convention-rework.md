# Make the two filename conventions state what the gate actually enforces

One-line summary: `file-naming.md` documents two of the eleven exemptions `md naming validate`
actually applies, states a scope clause ("and similar locations") that cannot be evaluated, and lists
six governed extensions of which the validator checks one — while `ordinal-filename-prefixes.md`
contradicts its own worked example and has no verdict for the collision case that already made one
sweep produce two different answers in two repos.

> Provenance: demoted from the full `backlog/` plan `file-naming-convention-rework/` to a two-pager
> on 2026-08-21. Declared as WS-B but deliberately left unspecified by
> [`repo-rules-sweep`](../../done/2026-08-18__repo-rules-sweep/README.md), then specified from
> entries 6-8 of that plan's `learnings.md`.

## Problem / context

Executing a 2000-file rename sweep across two repos exposed that both governing conventions misstate
what is enforced:

- **Eleven exemptions, two documented.** `md naming validate` hard-codes nine exempt basenames
  (`README.md`, `SKILL.md`, `AGENTS.md`, `CLAUDE.md`, `_index.md`, `CONTRIBUTING.md`,
  `LICENSING-NOTICE.md`, `ROADMAP.md`, `SECURITY.md`) and `repo-config.yml` adds two more globs. The
  convention names `README.md` and `SKILL.md`. `AGENTS.md` and `CLAUDE.md` are among the most-edited
  files in the repo and appear in no exception clause.
- **One exemption contradicts the rule in writing.** The rule says "no underscores in the basename";
  `_index.md` — the structurally-required Hugo section file every `apps/*-www` app uses — begins with
  one. It is exempt because Hugo mandates it, and no document says so. A reader auditing the content
  trees against the convention concludes the repo is in wholesale violation, and is wrong.
- **The scope clause is unfalsifiable, and the code leans on it.** The convention governs
  "`docs/`, `repo-governance/`, and similar locations". Nothing is checkable against "similar" — and
  `naming.rs`'s own doc comment quotes that phrase back as justification for its exemptions. The code
  cites the convention, the convention cannot be evaluated, and the loop closes with nobody able to
  say what the rule covers. The gate's real scope is every tracked `.md` minus the exempt list.
- **Four of six governed extensions are unenforced.** The rule lists `.md`, `.png`, `.svg`, `.mmd`,
  `.excalidraw`, `.drawio`; the validator's first act is to skip anything not ending in `.md`.
- **The ordinal convention contradicts its own worked example.** It states an ordinal is kept only
  when it is "that step's own number", then its table keeps the ordinal on
  `02-step-1-and-2-maker-and-checker.md` while that row's own verdict says the two numbering systems
  disagree. The reconciling range clause sits _below_ the table and is never applied to the row.
- **No verdict exists for name collisions.** The private sibling holds 18 groups (40 files) whose basenames
  were truncated to a fixed width by an earlier word-budget split, leaving pairs differing **only** by
  ordinal. They are not steps, so the keep-clause does not apply; stripping collides, so the
  strip-clause cannot be applied either. Those 40 kept their ordinals as the sole documented
  deviation between the two repos' sweeps — 8 numbered paths left in `ose-public`, 46 in the private sibling.

## Why now

The drift is already producing divergent outcomes: one rule, two repos, two answers, and the
divergence stands until the collision case is ruled on. Meanwhile every contributor naming a
governance file pays a tax the repo never intended to charge, and the exemptions are discoverable only
by reading Rust — which most contributors will not do. A convention is worth exactly its enforcement;
when the published rule is both stricter and looser than the gate in the same document, it is worth
less than that.

## Prior art / precedents

- [`repo-rules-sweep`](../../done/2026-08-18__repo-rules-sweep/README.md) — the sweep that exposed
  every item above; entries 6-8 of its `learnings.md` are the specification source.
- [Iron Rule 3](../../../repo-governance/workflows/plan/plan-execution/iron-rules-1-5.md) — fix the
  class, not the sites a finding names; the propagation discipline any prose change here inherits.
- [rhino-governance-tooling-defects](./rhino-governance-tooling-defects.md) — the sibling
  family, where the tool under-reports rather than the document.
- **Rule reach** — the same underlying question one level up: which paths a governance rule actually
  reaches.
- **Hugo's `_index.md` contract** — the external mandate behind the exemption nobody documented; the
  worked precedent for stating _why_ a fixed filename is exempt rather than just listing it.

## Proposed direction (sketch)

- **Reconcile the convention against the enforcing code, in that direction.** Derive the exemption
  list, the scope, and the enforced-extension set from `naming.rs` and the gate registry before
  writing prose — the same method that produced the defect list. State the admission _criterion_ (an
  externally-mandated fixed filename), not just the list, so a twelfth exemption gets judged rather
  than appended.
- **Repair the ordinal convention's self-contradiction** by moving the reconciling range clause above
  the table it governs, and re-evaluating every worked row against the rule as stated.
- **Rule on truncated-stem collisions, then stop the emitter creating them.** The verdict comes first;
  the word-budget split tool then refuses to emit two names differing only by ordinal, failing with
  both candidate names so the author can supply distinct stems immediately.

## Rough scope & non-goals

In scope: both conventions under `repo-governance/conventions/structure/` in both repos, plus any
child shard the word budget forces; every rules-machinery surface restating either rule
(`rules-checker`/`rules-maker`, the `rules-validating-governance` skill, and the
`rules-quality-gate` and `rules-propagation` workflow shards — the fixer agent and its skill were
retired when the gate became read-only); the `md-naming` gate registry entry; and the
split emitter's collision refusal — the only code change.

Out of scope (for now):

- Renaming any existing file, including the 40 collision files. That needs the verdict this work
  produces and is its own delivery unit.
- Widening `md naming validate` to the non-`.md` extensions. This makes the convention **honest**
  about what is enforced; widening enforcement is a separate decision with its own cost.
- Restoring either withdrawn naming rule — the agent role-suffix and workflow type-suffix rules stay
  withdrawn.
- Changing the kebab-case charset. The rule is right; its statement is incomplete.

## Risks & open questions

- **Both conventions already consume much of the instruction-file budget.** Adding the missing content may
  certainly overflows, so the shard boundary has to be chosen up front rather than discovered
  mid-edit. Where that boundary falls is unresolved. (open)
- **What is the collision verdict?** Keep the ordinal as a disambiguator, re-stem the files, or widen
  the truncation width — each implies a different corrective sweep afterwards, and none has been
  argued. This is the blocking unknown. (open)
- **Does fixing the ordinal table's row change what a future sweep would rename?** Any changed verdict
  must be evaluated against the current tree with the affected file count stated before landing. (open)
- Documenting eleven exemptions can read as blessing sprawl and invite a twelfth — which is exactly
  why the criterion matters more than the list.
- The two repos' conventions drift again unless both are changed in one delivery unit with
  per-repo facts re-derived by command rather than copied.

## What success looks like + promotion signal

Success: every basename the gate exempts is named in a convention and vice versa — checkable by
comparing two lists; the scope is a path expression evaluable against the tree with no open-ended
qualifier; the worked-cases table contains no row whose verdict contradicts the rule above it; a
word-budget split cannot emit two names differing only by ordinal; and both repos' copies state the
same rule with per-repo facts derived separately.

Promotion signal: the collision verdict is decided. It is a single judgement call that determines
whether this is a prose-only change or a prose change plus a 40-file corrective sweep in the private sibling
— two very different plans. Everything else here is mechanical reconciliation that can be specified
once that call is made.
