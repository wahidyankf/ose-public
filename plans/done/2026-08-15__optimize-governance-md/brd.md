# Business Requirements Document: Optimize Governance Markdown

## Business Goal

Make this repository's governance instructions **actually reach the agents and humans that
depend on them** — by capping every governance Markdown file at a size a reader can hold,
guaranteeing every file is reachable from an index, and telling every reader when a file
applies.

## Business Impact

### Pain point 1 — Rules that exist but are never read

[Repo-grounded, measured 2026-08-13] The median governance file in `ose-public` is **1,451
words**; the largest is **14,720 words**
(`repo-governance/development/agents/ai-agents.md`). `AGENTS.md`, the canonical instruction
surface read natively by eight harnesses [Repo-grounded — all Tier-1 harnesses per
`docs/reference/platform-bindings.md`: Cursor, Windsurf, JetBrains Junie, GitHub Copilot, OpenAI
Codex CLI, Google Antigravity CLI, Pi, OpenCode], is **3,001 words**.

A rule buried at word 12,000 of a 14,720-word file is, for practical purposes, not a rule.
Agents and contributors skim; harnesses truncate. The repository is paying full maintenance
cost on governance content that does not change behaviour.

### Pain point 2 — Silent truncation, unquantified

[Repo-grounded] The existing
`repo-governance/conventions/structure/instruction-file-size-budget.md` documents the failure
mode precisely: Codex CLI truncates a resolved `AGENTS.md` tree at 32,768 bytes; some agents
warn at 40,000 characters; some editors hard-cap at 12,000 characters per file. Content past
the limit **vanishes without warning** — the agent behaves as though the rule was never
written.

The byte budget was the first response to this. It gates only the handful of surfaces a
harness auto-loads, in a unit (bytes) no author reasons in, and it has never constrained the
bulk of `repo-governance/`, which agents read on demand and which is where 188 of the 298
public violations live.

### Pain point 3 — Orphaned and untriggerable content

[Repo-grounded] **721** Markdown-bearing directories in `ose-public` have no `README.md`.
And **0 of 214** `repo-governance/` files declare when they apply — an agent deciding whether
to open `integration-diff-review.md` has `title`, `description`, `category`, `subcategory`,
`tags`, and `created` to work with, none of which answer "does this apply to what I am doing
right now?"

Splitting large files without fixing both gaps would make the problem worse: one unread file
becomes thirty unreachable ones.

## Expected Benefit

[Judgment call] Governance content that fits inside a reader's working attention, is reachable
by walking any index, and announces its own trigger condition should be applied more
consistently by both agents and contributors than content that is none of those things. This
plan asserts **no numeric behavioural improvement as measured fact** — the verifiable outcomes
are structural and are stated in `prd.md` §Acceptance Criteria:

- Zero files over 500 words across the covered surfaces in both repos
- Zero unreachable Markdown files in the covered trees
- `when_to_use` present on 100% of `repo-governance/**/*.md`
- One size gate instead of two, in a unit authors reason in

## Stakeholders

| Stakeholder               | Interest                                                                   |
| ------------------------- | -------------------------------------------------------------------------- |
| AI coding agents          | Primary consumer; the truncation and retrieval failures land here first    |
| Repository maintainers    | Own the ~1,400–2,200 new files this plan creates and their ongoing upkeep  |
| Contributors              | Gain navigable governance; pay a 500-word ceiling on everything they write |
| `ose-primer` (downstream) | Accrues rhino-cli and content-parity debt until a follow-up plan closes it |

## Success Metrics

| Metric                                                               | Baseline (2026-08-13) | Target        |
| -------------------------------------------------------------------- | --------------------- | ------------- |
| Governance `.md` over 500 words — `ose-public` (source-only)¹        | 298                   | **0**         |
| Governance `.md` over 500 words — the private sibling (source-only)¹ | 247                   | **0**         |
| `repo-governance/**/*.md` with `when_to_use`                         | 0 / 214               | **214 / 214** |
| `repo-governance/**/*.md` with `description`                         | 187 / 214             | **214 / 214** |
| Covered directories with a compliant sibling index                   | not measured          | **100%**      |
| Per-file size gates in `repo-config.yml`                             | 1 (bytes)             | 1 (words)     |
| Files exempted from the word budget                                  | —                     | **0**         |

Every metric is derived by running the gate itself, not by hand-counting.

¹ **298/247 are the narrower "source (non-generated)" figures** — `repo-governance/` + `.claude/`
only, per `README.md` §Context. The `governance-word-budget` gate's actual **covered surface**
(FR-1.3: also `.cursor/`, `.codex/`, `.opencode/`, `.pi/`, `.amazonq/`, root `AGENTS.md`, root
`CLAUDE.md` — generated mirrors are gated, not exempted, per FR-1.4) has a **larger** current
baseline: **464** for `ose-public` and **349** for the private sibling [Repo-grounded, re-derived
2026-08-13 via `tech-docs.md` §7's census script against the full FR-1.3 surface]. 298/247 remain
accurate and useful as the narrower "how much of this is our own authored content vs. derivative
mirror copies" narrative in `README.md` §Context and in this document's Business Impact section
above; they are not the number the `governance-word-budget:validation` gate run itself reports.
FR-1.9's "zero files" target is scoped to the full covered surface (464/349 today), and
`delivery.md`'s Phase 1/10 Gate acceptance criteria cite the full-surface figures accordingly.

## Out of Scope

- **`ose-primer`** — deliberate, user-approved deferral; requires a follow-up sync plan for
  both the rhino-cli boundary and `repo-governance/` content parity
- `apps/**` and `libs/**` — 658 of the 721 missing READMEs sit in course-content trees
  where a sibling index has no reader
- **Root `README.md`, `CONTRIBUTING.md`, `LICENSING-NOTICE.md`** — outward-facing documents
  with different length requirements
- `docs/**` word budget — `docs/` joins the README-index rule only; its tutorials and
  reference specs are legitimately long
- **`plans/`** — outside **both** gates by design. Plan documents (BRD, PRD, tech-docs,
  delivery) routinely and legitimately exceed 500 words, and `plans/done/**` is archival:
  retrofitting an index rule onto completed plans would edit history for no reader
- **Generated mirror trees** (`.opencode/`, `.cursor/`, `.amazonq/`) — excluded from the
  README-index rule only; they remain fully inside the word budget
- **Rewriting governance _content_** — this plan relocates and indexes existing rules. It does
  not change what any rule says. Any rule that must change gets its own plan.

## Constraints

- **No rule may be deleted to satisfy the budget.** Progressive disclosure is the sole
  sanctioned remediation, per
  [Progressive Disclosure](../../../repo-governance/principles/content/progressive-disclosure.md).
- **No exemption mechanism ships.** No allowlist, no waiver key, no per-file override for the
  word budget.
- **Generated mirrors are never hand-edited.** A mirror violation is fixed in `.claude/`
  source or in the binding generator.
- **`ose-public` completes before the private sibling begins** its content work.
- **Exactly one worktree named `optimize-governance-md` per repository**, matching the
  plan-folder identifier per the
  [Worktree Specification HARD RULE](../../../repo-governance/conventions/structure/plans/worktree-specification.md#worktree-specification)
  — no exception needed. (An earlier session instruction had provisioned the `ose-public`
  worktree under the shorter name `optimize-gov`; it was renamed via `git worktree move` +
  `git branch -m` to `worktrees/optimize-governance-md` on branch
  `worktree/optimize-governance-md` before any plan-quality-gate iteration closed, so the plan
  is fully compliant, not exception-carrying.)

- **Zero `[HUMAN]` steps.** The plan is fully AI-deliverable; see `delivery.md` §Fully
  AI-Deliverable for the per-category grounding.
