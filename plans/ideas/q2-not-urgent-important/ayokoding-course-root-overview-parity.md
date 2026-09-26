# Give Every AyoKoding Course a Root Overview Page

One-line summary: 23 of AyoKoding's 181 English courses have no course-root `overview.md`, so
sibling courses that link a peer's overview must guess between two layouts — one of those guesses
was already wrong.

> Idea, added 2026-08-18, filed from the `repo-clean-up` plan's Product Scope § Out of scope. That
> plan armed `md-links` on `apps/ayokoding-www/content` and fixed the single link the arming broke;
> the underlying layout inconsistency was left here deliberately.

## Problem / context

Courses under `apps/ayokoding-www/content/en/learn/courses/` come in two shapes. 158 carry a
course-root `overview.md` alongside their `learning/` and `drilling/` subtrees; 23 carry only the
subtree overviews. Every course in both groups has `_index.md`, `learning/overview.md`, and
`drilling/overview.md` — the root page is the sole difference.

The cost is not theoretical. `chart-of-accounts-and-data-modeling/overview.md` linked
`../sql-essentials/overview.md`, which does not exist, while 47 other files referencing the same
course correctly used `../sql-essentials/learning/overview.md`. Until `repo-clean-up` armed the
gate, nothing caught it. The 23 courses without a root page are:
`advanced-algorithms`, `advanced-sql-and-query-performance`, `build-your-own-orm-and-query-builder`,
`build-your-own-reactive-ui`, `concurrency-and-parallelism`, `data-access-orms-and-query-builders`,
`engineering-management`, `extending-neovim`, `frontend-essentials`, `functional-programming`,
`just-enough-bash`, `just-enough-lua`, `just-enough-nvim`, `just-enough-python`,
`just-enough-typescript`, `object-oriented-design-and-patterns`,
`object-oriented-programming-essentials`, `programming-paradigms`, `project-management`,
`software-product-engineering`, `sql-essentials`, `technical-communication`,
`version-control-and-git`.

## Why now

Not blocking, but the window is favourable: `md-links` now runs over this content tree with no
exclusion, so any future author who links a missing root overview fails CI immediately rather than
silently. That turns a latent inconsistency into a recurring, visible papercut — worth resolving
before the next content push adds more cross-course links.

## Prior art / precedents

- The 158 conforming courses are their own precedent; `accounting-foundations` is the canonical
  shape (`overview.md` + `_index.md` + `learning/` + `drilling/`).
- [`repo-clean-up`](../../done/2026-08-18__repo-clean-up/README.md) armed the gate and documented the
  single broken link as measured cost, deferring the rest here.
- [`ayokoding-learning-path-01-url-restructure`](../../done/2026-07-23__ayokoding-learning-path-01-url-restructure/README.md)
  is the precedent for a bulk, mechanical content-layout change across this tree.
- The `apps-ayokoding-www-general-maker` / `-checker` / `-fixer` triad is the existing mechanism for
  authoring and validating non-tutorial course pages at scale.

## Proposed direction (sketch)

Decide one layout, then converge. Either every course gains a root `overview.md` that orients the
reader and routes to `learning/` and `drilling/`, or the root overview is retired everywhere and all
links point at `learning/overview.md`. Adding is the lower-risk direction: it changes 23 courses
instead of 158 and breaks no existing link. Whichever direction wins, the rule belongs in the
ayokoding content conventions so the checker can enforce it rather than leaving it to reviewer
memory.

## Rough scope & non-goals

In scope: a ratified decision on which layout is canonical; bringing the 23 outliers into line;
recording the rule where the content checker can enforce it.

Out of scope: rewriting any course's actual teaching content; the Indonesian (`id/`) tree, which
needs its own count before it can be scoped; any change to `learning/` or `drilling/` internals.

## Risks & open questions

- Is the root `overview.md` genuinely useful to readers, or is it a duplicate of `_index.md`? If the
  latter, the converge-by-deletion direction is correct and this brief has its premise backwards.
  (open — needs a look at what the 158 root pages actually say)
- Does the `id/` tree share the same split, and at what ratio? (open)
- Does the site's navigation render a course root at all, or only `_index.md`? A root page nothing
  links to would be dead weight. (open)
- Rabbit hole: authoring 23 substantive overview pages is a content task, not a mechanical one, and
  could quietly grow large if each page is written from scratch.

## What success looks like + promotion signal

Success: one documented layout, all 181 courses conforming, and a checker rule that fails a new
course missing the canonical shape. Ready to promote once the three open questions above are
answered — particularly whether the root page earns its place — since the answer decides whether
this is a 23-file addition or a 158-file deletion.
