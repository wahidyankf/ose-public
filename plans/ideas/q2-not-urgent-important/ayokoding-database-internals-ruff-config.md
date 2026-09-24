# The database-internals course is the odd one out with no scoped Ruff config

One-line summary: 22 ayokoding course trees carry a course-scoped `ruff.toml` to stop the pre-commit
`ruff format` hook from wrapping annotated example lines, but
`database-internals-and-storage-engines` has none — yet a measured `ruff format --check` over its 184
Python files reports them all already formatted, so the gap is a latent consistency hole rather than
an active breakage.

> Demoted 2026-08-05 from a full `backlog/` plan to a two-pager. The full plan carried the standard
> five documents — `README.md`, `brd.md`, `prd.md`, `tech-docs.md`, and a `delivery.md` with five
> phases (0 baseline, 1 configuration PR, 2 Knowledge Capture, 3 archival PR, 4 cleanup) split into
> two `worktree-to-pr` delivery units at N=3, plus Gherkin acceptance criteria, a file-impact table,
> personas, and user stories. Everything below the two-pager line was cut; the measurement that
> triggered the demotion is recorded in "Problem / context".

## Problem / context

The course at `apps/ayokoding-www/content/en/learn/courses/database-internals-and-storage-engines`
holds 184 runnable Python files — 168 under `learning/` (lessons plus the capstone) and 16 under
`drilling/`. Those examples are annotation-dense by design: explanatory `# => ...` trailing comments
ride on the code lines they explain, and the content checkers score annotation density against a
1.0-2.25 band. 152 lines in the corpus exceed 88 characters, 125 of them carrying a `#`, and the
longest runs 170 characters — for example, in `learning/capstone/code/wal.py`:

```python
        for record in self.log:  # => co-19: O(n) -- scans the WHOLE log for this txn's records (never truncated here); a real WAL indexes open txns instead of rescanning
```

The repo's pre-commit hook formats staged Python in place — the `format-staged` registry gate's
`scripts/format-staged` runs `ruff format --no-cache` on `*.py` — and there is no repo-root Ruff config, so Ruff falls back to its default
line length of 88. When a long annotated line is _splittable_, that default rewrites it. Reproduced
in a scratch directory with the installed Ruff 0.15.9, a single 149-character annotated assignment
became three physical lines with the annotation stranded on the closing-paren line, adding two
unannotated physical lines and diluting density without changing any logic.

The catch, and the reason this brief is not a plan: running the non-mutating
`ruff format --check` over the whole course on 2026-08-05 with Ruff 0.15.9 and no config printed
`184 files already formatted` and exited 0. The course's long lines happen to be unsplittable
constructs — bare `for` statements and closing parens with trailing annotations — which Ruff leaves
alone because it never reflows comments. So the corpus is stable _today_; the exposure is that the
next authoring pass could introduce a splittable annotated call and silently lose density on commit.

## Why now

Not urgent, and that is the finding. The original plan assumed an active breakage and scheduled two
PRs, three review cycles each, to fix it; the measurement above shows nothing is currently being
rewritten. What remains is a real consistency gap — 22 sibling courses were given this exact guard
and this one was skipped — plus a standing trap for the next author who touches these files. The
window that makes it worth keeping on the list is course-authoring activity: the moment
`database-internals-and-storage-engines` is edited again, the guard should already be in place,
because the damage lands quietly inside a pre-commit hook rather than at a failing gate.

## Prior art / precedents

- **`programming-paradigms/ruff.toml`** — the closest precedent, and the most fully reasoned. It
  documents the whole failure mode in a header comment (default 88 wraps annotated statements across
  2-5 physical lines and adds a magic trailing comma that makes the multi-line form sticky even at a
  wider width) and sets `line-length = 220`, chosen generously above the longest measured annotated
  line so the formatter stays a verified no-op.
  [programming-paradigms/ruff.toml](../../../apps/ayokoding-www/content/en/learn/courses/programming-paradigms/ruff.toml)
- **The other 21 tracked course-scoped `ruff.toml` files** — the same guard applied across courses
  including `backend-essentials`, `object-oriented-design-and-patterns`, `data-engineering`, and
  `concurrency-and-parallelism`. Most sit at the course root; `async-python-and-fastapi-services` and
  `backend-at-scale` instead scope theirs to `learning/code` and `drilling/code`, so the placement
  question already has two answered precedents.
- **Course-scoped `pyrightconfig.json`** — 18 courses, this one included, already carry a per-course
  tool config at the course root (`typeCheckingMode: strict`, `pythonVersion: 3.13`, scoped to
  `learning/code`, `learning/capstone/code`, `drilling/code`). Precedent that per-course tool config
  at this exact path is normal and resolves correctly.
  [database-internals pyrightconfig.json](../../../apps/ayokoding-www/content/en/learn/courses/database-internals-and-storage-engines/pyrightconfig.json)
- **The staged-formatter table** — the governance record of `ruff format` as the repo's Python
  formatter hook, alongside every other language's in-place formatter.
  [Formatting and File-Type Linting](../../../repo-governance/development/infra/nx-targets/formatting-and-file-type-linting.md),
  [format-staged](../../../scripts/format-staged)
- **`ayokoding-learning-path-04-course-authoring`** — the completed authoring plan this work was
  filed alongside and then explicitly decoupled from, as a code-adjacent configuration repair rather
  than a content change.
  [2026-08-02\_\_ayokoding-learning-path-04-course-authoring](../../done/2026-08-02__ayokoding-learning-path-04-course-authoring/README.md)

## Proposed direction (sketch)

Add one course-scoped `ruff.toml` at the course root, mirroring the established precedent rather than
inventing a new approach. Ruff resolves configuration by walking from each formatted file toward its
ancestors, so a file at the course root covers the `learning/` and `drilling/` subtrees without
touching another course or introducing a repo-level default. Pick the line length from the measured
corpus maximum (170 today) with headroom, and carry a header comment explaining why the file exists —
the precedent's 220 already clears the measurement with room to spare and would keep the courses
consistent. Verify with the non-mutating `ruff format --check` over the course tree, and confirm the
diff touches nothing else. Given how small this is, it is a single-PR change, not the two-delivery-unit
structure the original plan specified.

## Rough scope & non-goals

In scope: one course-root `ruff.toml` with its rationale comment; a deterministic non-mutating
verification command for the course's Python corpus; a decision on course-root versus
`learning/code` + `drilling/code` placement, since both precedents exist.

Explicitly out of scope, carried forward from the original plan:

- Reformatting any existing Python file in the course.
- Changing instructional prose, course lessons, drill content, capstone behaviour, Python logic, or
  test expectations.
- Any file under `apps/ayokoding-www/src/features/course-paths/manifests/`, and any route change.
- Establishing a repository-wide or repo-root Ruff policy, or editing shared lint configuration.
- Formatting or configuration work on any unrelated course.
- Any new learner-visible capability or UI change.

## Risks & open questions

- **Whether this is worth doing at all given the measured no-op.** `ruff format --check` passes clean
  today, so the change buys consistency and future-proofing, not a fix. It may be better folded into
  the next authoring pass on this course than delivered as standalone work. (open)
- **Which line length to choose.** The corpus maximum is 170; the precedent uses 220. Matching 220
  buys cross-course consistency, while a measured-fit value is narrower — and the original plan's
  stated worry that a too-small value still wraps annotated examples applies to any choice below the
  true maximum. (open)
- **Where to place the file.** Course root matches the majority and the `pyrightconfig.json`
  precedent; the `learning/code` + `drilling/code` split matches two other courses. The PRD's
  original risk — that the chosen directory fails to cover every target Python file — bites only if
  the narrower placement is picked. (open)
- A value beyond Ruff's supported configuration range would be rejected by the parser; verify any
  chosen value against the installed Ruff (0.15.9) before committing. Low risk, since 220 is already
  accepted in-tree.
- A misplaced config could affect a neighbouring course. Bounded by placing it only at the target
  course root and inspecting the final diff — the same mitigation the original plan named.

## What success looks like + promotion signal

Success: the database-internals course carries a course-scoped `ruff.toml` consistent with its 22
siblings, `ruff format --check` over the course tree exits 0 without rewriting a file, and the diff
contains nothing but that configuration file. Annotation density in the course is then structurally
protected from the pre-commit formatter rather than protected by the accident that its long lines
happen to be unsplittable.

Promotion signal: re-promote when either (a) `ruff format --check` over the course stops exiting
clean — meaning an authoring pass introduced a splittable annotated line and the exposure went live —
or (b) a course-authoring plan queues substantive edits to this course's Python corpus, at which
point the guard should land inside that plan's first PR rather than as separate work. Absent either,
this stays an idea; the consistency gap alone does not justify a dedicated plan.
