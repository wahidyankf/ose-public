# Business Requirements — Legacy Removal

## Problem

AyoKoding (`apps/ayokoding-www`) carries two parallel learning surfaces. One is the course library that plans
01 to 13 of this series build and audit (229 courses once plan 10 merges). The other is
`content/en/learn/legacy/`, 1,150 Markdown files left over from the site's pre-revamp structure. The legacy
tree's own `_index.md` and `overview.md` say it is "kept for reference while the course library fills". By the
time this plan runs, the library is full, so the reason to keep the tree is gone, and keeping it costs the site
in six ways:

- **Two answers to the same question.** A reader who searches for Rust, Docker, or accounting can land on a
  legacy page (served with a `noindex` tag) or on a current course. Nothing tells them which to trust.
- **The series cannot call itself done.** Series decision 40 says the series ends with "real content" only.
  A 1,150-page tree that the site itself calls temporary is the largest piece of content that no plan has
  rewritten, audited, or word-counted.
- **Old links would break if the tree were simply deleted.** Search results, bookmarks, old blog posts, and
  the site's own convention documents link to legacy addresses and to the older `/en/learn/<domain>/...`
  addresses that already redirect into the tree. Deleting without redirects turns every one into a 404.
- **94 repository documents link into the tree.** Mostly `docs/explanation/software-engineering/**`
  "learning path" prerequisite links that the software-engineering separation convention requires. The link
  validator fails the pull request if any target disappears.
- **Tests and rules lean on the tree.** 16 test-side files and 4 features name the bucket directly, and two
  further censuses found 6 more test-side files and 2 more features that read legacy content without naming
  it. Six normative texts describe a tree that will no longer exist. A test that reads a deleted page fails, and
  a rule that names it misleads the next maker.
- **Cost of keeping it.** About 6.65 million words of content (plan 10's measurement) ride through every
  content-index build, search index, and sitemap for pages that the site itself marks as temporary.

Plan 10 already recorded, for every one of the 1,150 files, which course replaces its topic, so the decision of
_what_ the replacement is has been made and evidenced. What remains is to remove the tree safely, keep every
old address working, repoint the documents, update the tests and rules, and prove that the series as a whole
reached its end state.

## Who This Is For

- **A reader with an old link (Dewi).** She follows a bookmark, a search result, or a link on another site to
  an old AyoKoding learn address. She needs the old address to work: to land, in one step, on the course that now
  teaches the topic, or on the course catalog when no course matches.
- **A web crawler.** It needs a permanent redirect (HTTP 308) with a `Location` it can follow, and a
  `robots.txt` that lets it read the redirect, so it can move the old addresses to the new ones.
- **A docs contributor (Bayu).** He edits the style guides under `docs/explanation/software-engineering/` and
  follows the prerequisite links. He needs every link to open a real page, and the sentence around it to stay
  true.
- **A content owner (Rina).** She maintains the course library and its tests. She needs no test, spec, or rule to
  depend on pages that are gone, and she needs the renderer's end-to-end coverage (highlighting, callouts, tabs,
  steps, math, diagrams) to survive.
- **The series owner (the user).** Decided that the legacy course is removed ("jangan lupa nanti legacy course
  diilangin aja") and that the end result must contain real content ("yang penting nanti hasil akhirnya harus ada
  isinya"). They need one gate that proves the end state of all 14 plans, a plan that deletes nothing until
  that is proven, and a clean closure.
- **The release engineer and PR reviewer.** They need a change that can be reviewed commit by commit despite
  1,161 deleted files, checked on production after the deploy, and reverted completely with one revert.

## User-Stated Requirements (verbatim intent)

- "jangan lupa nanti legacy course diilangin aja" (don't forget the legacy course gets removed eventually) —
  the reason this plan exists.
- "jangan kerjain/implement plan ini sebelum gw kasih perintah buat eksekusi ya" (do not implement this plan
  until the user gives the command to execute): this plan changes nothing until that command.
- "semua jadi 2 aja" (2026-10-09): every quality gate and every maker-checker loop stops after 2 cycles.
- "plans quality gate gak usah kita lakuin sekarang. nanti aja pas eksekusi" (2026-10-09): the plan quality
  gate is not run while the plan is written; it runs at the start of execution.
- "semua plan tadi bakal kita lakuin sekuensial ya" (2026-10-09): all the series plans run one after another.
- "yang penting nanti hasil akhirnya harus ada isinya" (2026-10-09): what matters is that the end result has
  real content. This plan carries the terminal gate that measures it.
- "kalo butuh tooling deterministic … bisa bikin/ditaroh di apps/ayokoding-cli/" (2026-10-09): deterministic
  tooling lives in `apps/ayokoding-cli`, not in an ad-hoc script.
- "Delivery checklists: detailed, split by phase, with an explicit completion gate per phase or section."

## Resolved Series Decisions This Plan Relies On

The user resolved these decisions on 2026-10-09. They are copied here so this plan stands alone. Numbering
follows the series decision list.

| No.   | Decision                                                                                                                                                                                                                                                                                          | How this plan applies it                                                                                                                                                                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 26    | Every course ends complete, pedagogically sound, and with solid code.                                                                                                                                                                                                                             | This plan writes no course. Its terminal gate re-measures completeness over the whole library (SC-01 to SC-07).                                                                                                                                                            |
| 27    | Course definition of done: the course meets the tutorial convention for its mode plus drilling; it passes its mode quality gate and the Content Quality Gate with no blocking finding; and every code example is green in the harness.                                                            | The gate reruns each content plan's completion suite once on the final tree (SC-07) and runs every example (SC-05).                                                                                                                                                        |
| 29    | Per course: maker, mode quality gate, Content Quality Gate, harness green. A course still blocked at the cap is marked BLOCKED in the execution ledger, reported to the user, and the batch moves on. Parallelism: N=3 background agents. Every cap is 2 cycles (2026-10-09, "semua jadi 2 aja"). | Every gate and loop here runs at most 2 cycles; the docs repoint uses 3 agents on file-disjoint batches; a gate check owned by an earlier plan is recorded BLOCKED in the ledger and reported ([tech-docs/006](./tech-docs/006-series-completion-gate.md#failure-policy)). |
| 30-33 | Code contract (`run.yaml` per example), determinism, runtime (container or `mode: static`), and CI (affected on each PR, full monthly and on toolchain bumps).                                                                                                                                    | This plan changes no harness code. SC-04 requires harness coverage of every applicable course and SC-05 requires every example green, using plan 05's commands.                                                                                                            |
| 34    | Legacy: migrate every legacy topic without a course equivalent into new course(s) under the same DoD before deletion; then delete `learn/legacy`, 308-redirect its URLs to equivalents (fallback: catalog), and repoint the 94 `docs/` files.                                                     | This plan's entire reason for existing: plan 10 did the migration half; this plan does the deletion, redirect, and repoint half, and only after proving every mapping row is resolved and every destination course exists.                                                 |
| 35    | Courses are English only; `content/id/**` stays untouched.                                                                                                                                                                                                                                        | No `/id/**` redirect is added and nothing under `content/id/` changes; every phase ends with an empty diff for it (SC-15).                                                                                                                                                 |
| 37    | Deterministic tooling lives in `apps/ayokoding-cli`; no ad-hoc scripts.                                                                                                                                                                                                                           | Counts and checks come from the repository's own commands and from permanent or temporary vitest tests. No new CLI subcommand is needed; the inventory is produced by a snapshot test, not a script.                                                                       |
| 39    | Skills paths vs outline courses: no "Preview" status, no unpublishing; the skills paths restructure in the PR that fills their courses (accounting in plan 06, ERP in plan 07).                                                                                                                   | This plan does not touch path manifests. The gate checks that no path lists an outline course and that every path has phases (SC-02, SC-08, SC-09).                                                                                                                        |
| 40    | Series end state: zero outline, skeleton, or filler courses; every path has phases with filled courses only; no "Outline" badge renders anywhere. Plan 14 carries the terminal gate; each content plan measures its share.                                                                        | The terminal gate is Phase 10 of this plan: 17 checks, no waiver, and it blocks archival on failure ([tech-docs/006](./tech-docs/006-series-completion-gate.md)).                                                                                                          |
| 41    | The plan quality gate is not run while authoring; it runs at the start of execution, with `max-cycles` 2. Plans never claim a verdict they did not get.                                                                                                                                           | The first checkbox of Phase 0; the README and the delivery header say no verdict exists yet.                                                                                                                                                                               |
| 42    | The 14 plans run strictly one after another; the next plan starts only after the previous one is merged, deployed, verified, and cleaned up. Parallel agents inside a plan stay (N=3).                                                                                                            | Plans 01 to 13 are merged and archived when this plan starts. Phase 0 stops early if any is missing. No concurrent-plan conflict exists.                                                                                                                                   |

## Evidence (measured 2026-10-09 to 2026-10-10 at `origin/main` `bb7f90137`)

Phase 0 re-measures every row, because plans 01 to 13 change `main` before this plan runs. Detail and commands
are in [tech-docs/001](./tech-docs/001-current-state-and-evidence.md).

| Fact                                                                                                                                                                                                                                                      | How it was measured                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `learn/legacy/` holds 1,150 Markdown files: 1,148 under six domains (AI 55, business 4, information security 51, IT governance 9, personal development 50, software engineering 979) plus two files directly under `legacy/` (`_index.md`, `overview.md`) | `find apps/ayokoding-www/content/en/learn/legacy -type f \| wc -l`, then a count per domain                                          |
| Plan 10's mapping has 105 rows: 104 path rows (98 directories, 6 files) and one row for 65 navigation files; `Covered` 43 rows and 394 files, `New course` 58 rows and 643 files, `Obsolete` 4 rows and 113 files                                         | read from the mapping file and re-counted against the real tree                                                                      |
| The inventory resolves to 113 catalog destinations and 1,037 course destinations; 74 distinct course slugs, so 75 distinct destinations with the catalog                                                                                                  | derived from the mapping by the first-listed-slug rule                                                                               |
| The redirect design adds 418 rules and removes 12; the final array has about 493 rules against the platform's limit of 1,024                                                                                                                              | formula in [tech-docs/002](./tech-docs/002-redirect-mechanism-and-url-inventory.md#rule-count); limit from the Next.js guide         |
| 94 `docs/` files hold 158 lines and 170 Markdown links into the tree, in 16 groups and 12 destination courses; 11 links in 6 groups differ from their group's destination; 11 links carry a fragment                                                      | `rtk git grep -l "learn/legacy" -- docs`, counted by a longest-prefix lookup against the mapping                                     |
| 6 application-source files name the bucket (1 deleted, 2 code edits, 3 comment-only), plus the Learn-home Legacy line that plan 04 leaves for this plan                                                                                                   | `rtk git grep` over `apps/ayokoding-www` ([tech-docs/001](./tech-docs/001-current-state-and-evidence.md))                            |
| 26 existing test-side files change or go (19 edited, 7 deleted), including 6 files and 2 features found only by two censuses of URL and text literals; 11 permanent and 3 temporary new test files are added                                              | the two censuses of [tech-docs/004](./tech-docs/004-code-spec-and-test-migration.md#the-two-censuses-that-found-hidden-dependencies) |
| The callout, steps, and tabs shortcodes appear in 60 legacy files and in no file outside the tree                                                                                                                                                         | `rtk git grep` over `apps/ayokoding-www/content`                                                                                     |
| Six rule-bearing texts describe the tree (RC1 to RC6); about 13 further files and 60 lines show older pre-IA example paths and are reported, not edited                                                                                                   | sweep of `repo-governance/`, `.agents/`, and `AGENTS.md`                                                                             |
| `content/id/belajar/` has 125 files and no `learn` section; it stays untouched                                                                                                                                                                            | `ls`, and series decision 35                                                                                                         |
| The net diff of this plan: 16 new, 137 edited, 1,161 deleted, and 3 or more regenerated files                                                                                                                                                             | [tech-docs/009](./tech-docs/009-file-impact.md)                                                                                      |

## Business Goals and Success Measures

| Goal                                           | Measure at merge                                                                                                                                                                                                                                         |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No old address becomes a dead link             | The frozen inventory of 1,150 legacy URLs and their 1,148 pre-IA twins all answer HTTP 308 with the destination the mapping requires; each of the 75 distinct destinations answers 200. Proved by the unit test, the build manifest check, and the crawl |
| The tree is removed safely                     | `apps/ayokoding-www/content/en/learn/legacy/` is gone only after every mapping row is resolved and every destination course exists on `origin/main`; Learn has exactly two structural buckets, `courses` and `paths`                                     |
| The site stops advertising the removed section | The Learn home, sidebar, path rail, browse index, breadcrumb, sitemap, feed, and search data hold no legacy entry; `robots.txt` still allows `/`                                                                                                         |
| Repository documents point at real pages       | `rtk git grep -n "learn/legacy" -- docs` prints nothing; the link validator exits 0; the 12 destination courses are linked by the expected number of files                                                                                               |
| No test depends on a page that is gone         | `QUICK`, `INTEGRATION`, `E2E`, and `BE-E2E` exit 0 after the deletion; renderer coverage is kept on one draft fixture page                                                                                                                               |
| The rules describe the repository as it is     | RC1 to RC6 land through the rules-propagation route and the Rules Quality Gate passes in at most 2 cycles; no new rule is created                                                                                                                        |
| The series reaches its end state, proven       | The series-completion gate passes all 17 checks (229 courses, zero outline, zero filler, harness coverage 100%, every example green, 111 audited courses, path integrity, no Outline badge, and the redirect and docs checks)                            |
| Nothing is left behind                         | After the merge, deploy, and live check: plans 01 to 14 are in `plans/done/` with README entries, and the ledger, worktrees, and branches are cleaned                                                                                                    |
| The change can be undone                       | One revert restores the 1,150 pages and removes the redirects; the proof table of [tech-docs/010](./tech-docs/010-pr-size-rollback-and-series-closure.md#rollback) passes on the revert branch                                                           |
| The Indonesian site is untouched               | `rtk git diff --stat origin/main...HEAD -- apps/ayokoding-www/content/id` is empty                                                                                                                                                                       |

## Business Risks

| Risk                                                                                                         | Mitigation                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One of 104 table rows has a wrong destination                                                                | The table is proven against the mapping and the real tree by a temporary parity test, then guarded forever by the frozen inventory, which is derived independently of the table (two derivations must agree)         |
| A redirect rule shadows a live page, or two rules loop                                                       | Tests assert that no source captures `courses`, `paths`, `fundamentally-strong`, `/en/learn`, `/en/learn/overview`, or `/id`, and that every destination is terminal; the order puts the new rules last              |
| Deleting 1,150 pages breaks a test or rule that the grep did not find                                        | Two censuses (URL and text literals) found six more files and two more features than the bucket grep; Phase 0 repeats them, and the full suites run once after the deletion with at most 2 fix cycles                |
| The `docs/` repoint changes a sentence so it makes a false claim about a course                              | Facts about a course are checked against the as-merged course before they are written; a claim the course does not support is dropped; two docs quality gates run at `max-cycles` 2                                  |
| The separation gate fails on every table row after the repoint                                               | RC6 retargets its fourth question to the as-merged course shape, in one place (the content skill), after Batch C                                                                                                     |
| Plans 11 to 13 were not fully authored when this plan was written, so a name or hook it relies on may differ | Phase 0 reads and records every as-merged name; a renamed file changes a command, never a threshold; a readiness probe runs the fast gate checks first and stops early if the series is incomplete                   |
| The terminal gate fails late (the full example run takes hours)                                              | The expensive check starts first, in the background; the readiness probe moves likely failures to Phase 0; on failure there is no archival, the plan reports the owner, and the user decides                         |
| Search engines treat many redirects to one catalog page as soft 404s                                         | Accepted and flagged ([tech-docs/007 D4](./tech-docs/007-decision-records.md#d4-the-fallback-is-the-catalog-with-a-308-for-obsolete-navigation-and-unmatched-urls)); only 113 of 1,150 URLs fall back to the catalog |
| A 308 is cached by browsers, so a rollback does not fully undo it                                            | Stated plainly in the rollback section; the plan prefers a forward fix for a single wrong destination, and rolls back only for broad harm                                                                            |
| 1,161 deleted files make the pull request hard to review                                                     | Ordered single-purpose commits, one deletion commit that is counted rather than read, checkpoint pushes, and a review recipe with two commands                                                                       |
| The plan quality gate has not run, so the plan may carry defects the gate would find                         | It is the first step of Phase 0, with 2 cycles; a `BLOCKED` verdict stops execution and is reported to the user                                                                                                      |
