# The Fundamentally Strong Software Engineer

> **Status: CLOSED — delivered-as-descoped (2026-07-19).** Passes 0–2 (Phases 0–37, topics 1–33 +
> capstones) delivered, live, and **deployed to production**. Passes 3–5 (topics 34–94) **transferred**
> to the successor plan
> [`shared-course-library-and-learning-paths`](../2026-07-21__shared-course-library-and-learning-paths/README.md)
> (shared course library + two path manifests: `interview-ready` / `immediately-effective`). Not
> abandoned. See [delivery.md §Terminal Status](./delivery.md#terminal-status--closed-delivered-as-descoped-2026-07-19).

A cross-cutting **relearn-and-drill** tutorial section on ayokoding-www that lets a working
software engineer re-ground themselves across the breadth of the discipline — computer science
through IT security — via two parallel tracks: **learning** (by-example-depth per topic) and
**drilling** (active-recall practice). Breadth across the field, **by-example pace within each
topic**.

## Context

Working engineers routinely need to _re-load_ a topic they once knew but haven't touched in a
while — before an interview, before joining a new team, before a design review, or just to close a
nagging knowledge gap. The existing `learn/software-engineering/` tree on ayokoding-www is
excellent for _first-time deep learning_ (Diátaxis tutorials, by-example, in-the-field), but it is
optimized for depth, not for a fast, breadth-first refresh. There is no single place a practitioner
can go to _quickly_ re-ground themselves across the whole field and then _test_ that the knowledge
actually stuck.

This matters most **in the age of AI and LLMs**: when assistants generate more and more of the code,
the engineer's durable edge is a solid grasp of the fundamentals needed to judge, review, and
correct that output. This section is the human-in-the-loop's reference for staying fundamentally strong
across the field rather than deferring blindly to generated answers.

This plan adds **"The Fundamentally Strong Software Engineer"** — a new top-level collection at
`learn/fundamentally-strong/` — that is deliberately breadth-first, self-contained, and split into a
learning track and a drilling track covering the same topics in the same order.

## Scope

**In scope** (all under `apps/ayokoding-www/content/en/learn/fundamentally-strong/software-engineer/`):

- A section landing (`_index.md`) + `overview.md`.
- A **learning** track: a by-example-depth learning subtree per topic (**hybrid format** — code-centric
  topics use the ayokoding **By Example** format; concept-centric topics use an equal-density
  **annotated-concept** format with worked examples + accessible Mermaid diagrams). See
  [prd.md](./prd.md) for the per-topic format assignment and volume targets.
- A **drilling** track: one active-recall page per topic (same topics, same order) with four drill
  forms (recall Q&A, applied scenarios, code katas, self-check checklist).
- **94 topics** (topic set is **frozen** — see [prd.md](./prd.md) for the canonical, locked table),
  identical ordering across both tracks, sequenced as a **Pass 0 setup prologue followed by a
  five-pass spiral** under an **immediately-effective** principle: after the reader sets up their
  editor (Pass 0), the earliest learning topics get them building, storing, testing, and securing a
  small end-to-end system fast, then each later pass revisits the same concern areas at greater depth
  and breadth. The passes are **descriptive arcs, not gates**; big subjects are split into an
  Essentials topic early and an Advanced topic later, interleaved across passes (DD-11). See
  [prd.md](./prd.md) for the canonical 94-topic table (per-topic pass, slug, format, primary language,
  weights, editor-readiness) and the [syllabus/ folder](./syllabus/README.md) for every item and
  worked example inside each topic. The prologue and five passes:
  1. **Pass 0 · Editor Foundations** (topics 1–3) — Just Enough Nvim, Just Enough Lua, Extending
     Neovim. Outcome: fluent in the editor + terminal workflow every later topic assumes.
  2. **Pass 1 · Core Foundations** (topics 4–18) — Python, Bash, Version Control & Git, DS&A/OOP
     Essentials, Project Management (▲), SQL/Backend/Networking Essentials, TypeScript, Frontend
     Essentials, Software Testing, Debugging & Profiling, Security Essentials, Technical Communication.
     Outcome: build + store + test + secure + debug a small full-stack app, driven from the shell.
  3. **Pass 2 · Depth, Design & Craft** (topics 19–33) — CS foundations, computer architecture, OO
     design & patterns, paradigms, functional programming, concurrency & parallelism, advanced
     algorithms/SQL, data access (ORMs + build-your-own), advanced networking, engineering practices,
     agentic coding, and the start-early Product & Delivery track (▲: Software Product Engineering,
     Engineering Management).
  4. **Pass 3 · Build for the Real World** (topics 34–63) — NoSQL, graph databases, DB internals, data
     engineering, search & IR, backend at scale, build-your-own web framework, API design,
     architecture, DDD, system design, event-driven architecture, distributed systems, advanced
     frontend, build-your-own reactive UI, information architecture & SEO, containers, cloud/IaC,
     bare-metal virtualization, self-managed Kubernetes & on-prem GitOps, build automation & task
     runners, CI/CD & release engineering, AI-powered apps, agentic AI, the IT-security +
     red/blue-team split, vulnerability management & assessment, IT governance & GRC, and analytics &
     experimentation.
  5. **Pass 4 · Concurrency & Systems** (topics 64–89) — CSP (Go) and actor (Elixir) concurrency, the
     ◆ app domains (Android/iOS/Hybrid/Windows/Linux) with their language primers, building production
     CLI tools, C + OS internals (Linux/Windows), systems programming, Rust + modern systems
     programming, Java + the enterprise JVM, Lisp, F#, type systems, and compilers/transpilers.
  6. **Pass 5 · Internals & Lead at Altitude** (topics 90–94) — Build Your Own Git, Build Your Own
     Database, Build Your Own Raft, Platform Engineering & Developer Experience, and Site Reliability
     Engineering (‡ senior leadership depth woven through the platform/SRE finale).
     Two **parallel tracks** run alongside the spiral as a reading-path affordance: the ◆ app-domain
     topics (pick the domain(s) matching your path) and the ▲ Product & Delivery track (readable from
     Pass 1 onward).
- Wiring the new collection into `learn/_index.md` and a new `learn/fundamentally-strong/_index.md`
  collection landing.
- English only.

**Out of scope**:

- Indonesian (`content/id/...`) mirror — deferred; may follow later.
- Any change to the existing `learn/software-engineering/` deep-content subtrees (system-design,
  algorithms-and-data-structures, etc.). This section is **self-contained** — it does NOT link into
  or restructure existing content.
- Any application/component/code change under `apps/ayokoding-www/src/` — this is a **content-only**
  plan (markdown under `content/`).
- Interactive/JS-driven flashcards — drilling uses static markdown with `<details>` collapsibles
  (already supported in existing content).

## Approach Summary

**Topic-first** (DD-26): one folder per topic in journey order; each topic holds both its learning
and drilling material side by side — there are no two top-level tracks.

```
learn/fundamentally-strong/software-engineer/
  _index.md               # section landing (nav list)
  overview.md             # what this is, how to use the journey
  <NN-topic-slug>/        # one folder per topic (journey order; folder weight 100 + 10×index)
    learning/             # by-example depth (learning/_index.md = "Learn wt" 101..194)
      capstone/           # intra-topic capstone (_index.md weight 900)
      code/               # runnable sources
    drilling/             # active-recall practice (drilling/_index.md = "Drill wt" 201..294)
  <inter-topic-capstone>/ # pass-boundary + cross-cutting junction folders
```

Each learning topic is authored at **by-example pace** (annotation density 1.0–2.25 comments/line,
incremental, five-part examples for code topics; equal-density annotated worked examples + diagrams
for concept topics). Each **drilling** page follows one fixed anatomy combining all four drill forms
(recall Q&A / applied scenarios / code katas / self-check checklist).

**Concrete, single-primary-language rule**: any topic whose content uses code uses a **real
programming language** (never pseudocode), and one **primary language** is used across as many topics
as possible for consistency. A topic deviates only where the platform mandates it (e.g. Swift for iOS,
Kotlin for Android, C for low-level system programming, a JS/TS-family language for frontend). The
primary language is fixed in [tech-docs.md](./tech-docs.md) (DD-7). See [prd.md](./prd.md) for the
per-topic language column.

Content authored via `apps-ayokoding-www-by-example-maker` (code topics) and
`apps-ayokoding-www-general-maker` (concept topics + scaffolding); validated via the matching
checker plus `apps-ayokoding-www-facts-checker` + `apps-ayokoding-www-link-checker`. Delivery mode is
mixed: Phases 0–3 (closed, historical) used `main-to-origin-main`; Phases 4–109 (active) use
`worktree-to-pr` with a per-phase PR, so several phases can be in review concurrently — see Delivery
Mode below.

## Navigation

- [Business Requirements (brd.md)](./brd.md) — WHY this section exists, who it serves, success signals.
- [Product Requirements (prd.md)](./prd.md) — WHAT the pages contain, personas, user stories, Gherkin
  acceptance criteria, page anatomies.
- [Syllabus (syllabus/)](./syllabus/README.md) — every item and worked example inside each of the 94 topics.
- [Technical Docs (tech-docs.md)](./tech-docs.md) — HOW: content-tree layout, weights, frontmatter,
  drilling markup, file-impact, diagrams.
- [Delivery Checklist (delivery.md)](./delivery.md) — DO: phased, executable checklist.
- [Learnings (learnings.md)](./learnings.md) — Knowledge-capture running log.

## Delivery Mode

Mixed. **Phases 0–3 (closed, historical)**: `main-to-origin-main` — primary checkout (no worktree),
direct `[AI]` push to `origin main`, no PR, no human-merge gate; already executed. **Phases 4–109
(active)**: `worktree-to-pr` — one shared worktree, a separate branch and draft PR per phase, the
PR-Review Maker→Fixer Cycle (3 cycles), then `[AI]` merges once all quality gates are green, and
deploys ayokoding-www to prod immediately after — several phases' PRs may be open and in review
concurrently. **Note**: the repo's
[PR Merge Protocol](../../../repo-governance/development/workflow/pr-merge-protocol.md) normally requires
`[HUMAN]` approval on every merge with no exceptions; this plan's AI-auto-merge is an explicit,
plan-scoped deviation the user authorized in-session (2026-07-14) — it does not amend the protocol
itself or apply to any other plan. See [delivery.md](./delivery.md) for the full `## Worktree`,
`## Parallelization Model`, and `## Delivery Mode` declarations.

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
