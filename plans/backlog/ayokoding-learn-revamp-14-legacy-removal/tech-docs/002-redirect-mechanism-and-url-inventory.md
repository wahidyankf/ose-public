# 002 — Redirect Mechanism and URL Inventory

This page designs how every legacy URL reaches its replacement: the rule shapes, the module that builds
them, how many there are, in what order, how many hops each URL takes, how inbound links, the sitemap,
and search engines behave, and how a frozen inventory of all 1,150 URLs keeps the guarantee testable
after the tree it came from is deleted. Terms are defined in
[001](./001-current-state-and-evidence.md#how-redirects-work-here).

## The contract

1. Every URL that answered 200 under `/en/learn/legacy/` answers **HTTP 308** with a `Location` header
   that points at its replacement, and the replacement answers **200**.
2. The same holds for the same page's older, pre-IA address `/en/learn/<domain>/...` (the address
   `learn-three-bucket.ts` redirects to the legacy bucket today) for the six domains.
3. The replacement is the course that plan 10's mapping names for the topic, at the course root
   `/en/learn/courses/<slug>`. Where the mapping names no course (obsolete topics, navigation pages),
   or for any legacy URL the mapping does not mention, the replacement is the catalog
   `/en/learn/courses`.
4. A legacy or pre-IA URL takes **one hop** to its replacement. URLs that first pass through another
   redirect module (a `/c/` bookmark, a historical rename, a mixed-case locale, a trailing slash) take
   one extra hop per such module, never more than two in total.
5. Nothing under `/id/**` changes, and no rule shadows `/en/learn/courses/**`, `/en/learn/paths/**`, or
   `/en/learn/fundamentally-strong/**`.

## Inputs and derivation

The input is the mapping's rows. For each row:

| Field       | Meaning                                                                                       |
| ----------- | --------------------------------------------------------------------------------------------- |
| `path`      | relative to the former `learn/legacy/` folder; ends in `.md` for one file, otherwise a folder |
| `course`    | the first-listed target slug of a `Covered` or `New course` row; none for `Obsolete`          |
| destination | `/en/learn/courses/<course>` when a course exists, otherwise `/en/learn/courses`              |

The first-listed slug rule is the one plan 10 stated. A `Covered` row can name several courses
(for example `offensive-security`, `defensive-security`, `it-governance-grc`); a redirect has one
destination, so it uses the first and the `docs/` repoint may mention the others in prose.

For each of the two address prefixes, `/en/learn/legacy/` and `/en/learn/`:

```text
for each row, in path order:
  file row   (path ends ".md"):   one rule     { source: PREFIX + path-without-".md",          destination }
  folder row:                     two rules    { source: PREFIX + path,                         destination }
                                               { source: PREFIX + path + "/:path*",             destination }
then the fallback rules of that prefix (always last in the group):
  legacy prefix:  { source: "/en/learn/legacy",               destination: CATALOG }
                  { source: "/en/learn/legacy/:path*",        destination: CATALOG }
  pre-IA prefix:  for each of the six domains d:
                  { source: "/en/learn/" + d,                 destination: CATALOG }
                  { source: "/en/learn/" + d + "/:path*",     destination: CATALOG }
```

All rules carry `permanent: true`. A wildcard rule's destination has **no** `:path*`: every page below a
topic goes to the same course root. The mapping works at topic granularity, so a deep link such as
`.../golang/by-example/advanced` has no finer equivalent, and a wrong deep link is worse than a correct
course root (decision [D3](./007-decision-records.md#d3-every-sub-page-redirects-to-the-course-root)).

Why a folder row gets both an exact rule and a wildcard rule. The destination has no parameter, so a
single wildcard would match the bare folder URL too (the Next.js docs say `/blog/:slug*` matches
`/blog`). The repository nevertheless writes both, in the order exact then wildcard, for the reason the
current module's header records (finding EWT-001): a bare request must redirect in one hop whatever a
router does with a zero-segment wildcard, and the exact rule makes that independent of the router. It
costs 98 extra rules per prefix, well inside the platform limit.

## Tolerating the known mapping defects

The parser (inside the temporary parity test) reads the as-merged mapping and follows these rules.

| Defect                                                  | Rule                                                                                                                                                          | Stops execution when                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Header promises 7 columns; table has 6                  | Read columns by position (path, files, words, disposition, target, evidence). If a seventh column exists, it must equal the computed destination of its row   | a seventh column exists and disagrees with the computed destination                   |
| Disposition spelled `Covered`, `New course`, `Obsolete` | Lower-case it and map `covered`, `new course` or `new`, `obsolete` to three values                                                                            | any other word appears                                                                |
| "308 redirects" read as a count                         | Ignore; the count is derived by the formula below                                                                                                             | never                                                                                 |
| Navigation bucket row has no path                       | It is the one row whose first cell has no backtick-quoted path. Its files are the complement of all folder and file rows. It produces only the fallback rules | more than one row has no path, or the complement is not exactly its stated file count |

The parser stops reading rows at the heading that starts the `docs/` repoint table. Everything else in the
file is prose.

## The module

New file `apps/ayokoding-www/src/redirects/legacy-removal.ts`. It replaces `learn-three-bucket.ts`, so
the "three-bucket" name and its stale header comment leave the codebase. Shape (a sketch; the delivery
checklist writes the real file test-first):

```ts
export const CATALOG_PATH = "/en/learn/courses";

/** The six top-level domains that used to sit directly under /en/learn/ (the pre-IA addresses). */
export const RELOCATED_DOMAINS = [
  "software-engineering",
  "artificial-intelligence",
  "information-security",
  "personal-development",
  "it-governance",
  "business",
] as const;

export interface LegacyRoute {
  /** Relative to the former learn/legacy folder. Ends in ".md" for one file, otherwise a folder. */
  readonly path: string;
  /** First-listed course slug; null for an obsolete topic. */
  readonly course: string | null;
}

export interface RedirectRule {
  readonly source: string;
  readonly destination: string;
  readonly permanent: true;
}

/** One entry per mapping row that has a path (104 at authoring), sorted by path. */
export const LEGACY_ROUTES: readonly LegacyRoute[] = [
  // { path: "artificial-intelligence/tools/claude-code", course: "claude-code-for-engineers" },
  // { path: "business/accounting.md", course: "accounting-foundations" },
  // { path: "business/overview.md", course: null },
  // ... all rows, transcribed from the mapping and checked by the parity test
];

export function buildLegacyRemovalRedirects(routes: readonly LegacyRoute[]): RedirectRule[];

export const legacyRemovalRedirects: readonly RedirectRule[] = buildLegacyRemovalRedirects(LEGACY_ROUTES);
```

The rows are **data**, not generated at build time from the mapping, because the mapping lives in a plan
folder that is archived and is not part of the application. A typed table is reviewable line by line, is
covered by the unit test, and needs no runtime file read. The temporary parity test (below) is what proves
the table equals the mapping.

A second new file, `src/redirects/index.ts`, exports the full ordered array and is the only thing
`next.config.ts` spreads:

```ts
export const redirectRules = [
  ...localeEntryRedirects,
  ...contentNamespaceRedirects,
  ...learnReorgRedirects,
  ...courseRehomeRedirects,
  ...learnHomeRedirects, // plan 04
  ...legacyRemovalRedirects,
];
```

Today `next.config.ts` and the step file `learn-three-bucket.steps.tsx` each list the modules, so the
test's list can drift from the config's. One exported array removes that risk (a small refactor with its
own checkbox). The position of `legacyRemovalRedirects` stays **last**, as the old module's was: the more
specific `courseRehomeRedirects` and `learnHomeRedirects` rules must win first. If plan 04 landed with a
different arrangement, Phase 0 records the as-merged order and the new module keeps the last position.

## Rule count

| Group                                       | Formula                                 | Count   |
| ------------------------------------------- | --------------------------------------- | ------- |
| Legacy prefix, row rules                    | 6 file rows x 1 + 98 folder rows x 2    | 202     |
| Legacy prefix, fallback                     | 1 exact + 1 wildcard                    | 2       |
| Pre-IA prefix, row rules                    | the same 202                            | 202     |
| Pre-IA prefix, fallback                     | 6 domains x (1 exact + 1 wildcard)      | 12      |
| **New rules**                               |                                         | **418** |
| Removed (`learn-three-bucket.ts`)           | 6 domains x 2                           | 12      |
| Kept from other modules                     | 13 + 5 + 16 + 40 = 74, plus plan 04's 1 | 75      |
| **Total in `redirects()` after this plan**  | 75 + 418                                | **493** |
| Platform limit (Vercel, `next.config` form) | per the Next.js redirecting guide       | 1,024   |

The unit test computes the expected count from the table with the formula
`2 x (files + 2 x folders) + 2 + 2 x |RELOCATED_DOMAINS|`, not from the literal 418, so a corrected
mapping changes the number without breaking the test. The literal 418 is recorded in the Phase 1 evidence
for the reviewer. Phase 0 stops if the total would exceed 800.

## Rule order and loop safety

1. All legacy-prefix row rules, then the legacy-prefix fallback pair.
2. All pre-IA row rules, then the six pre-IA fallback pairs.

Row paths are segment-prefix-free (checked), so the order among row rules never changes a result; only
"fallback after rows" matters, because a fallback wildcard matches everything below its base.

Loop safety is a stated property with a test: **every rule's destination is terminal**, meaning
`followRedirects(destination)` takes zero hops. Destinations are only `/en/learn/courses` and
`/en/learn/courses/<slug>`, and the only other rules that could match those are the re-home rules for the
`fundamentally-strong` prefix, which do not. The same test also checks that no source or destination
contains the `/c/` segment (the invariant `content-namespace.ts` documents), and that no source equals
`/en/learn/:path*`, `/en/learn/courses...`, `/en/learn/paths...` or `/en/learn/fundamentally-strong...`.

## Hop budget

| Request                                                                                       | Hops | Ends at                    | Why                                                                    |
| --------------------------------------------------------------------------------------------- | ---- | -------------------------- | ---------------------------------------------------------------------- |
| `/en/learn/legacy/<row path>[/...]`                                                           | 1    | `/en/learn/courses/<slug>` | the row rule                                                           |
| `/en/learn/<domain>/<row path>[/...]` (pre-IA)                                                | 1    | `/en/learn/courses/<slug>` | the pre-IA row rule                                                    |
| `/en/learn/legacy` or any legacy URL that no row matches                                      | 1    | `/en/learn/courses`        | the legacy fallback pair                                               |
| `/en/learn/<domain>` or a pre-IA URL that no row matches                                      | 1    | `/en/learn/courses`        | the pre-IA fallback pair                                               |
| `/en/c/learn/legacy/...` or `/en/c/learn/<domain>/...`                                        | 2    | as above                   | `content-namespace` strips `/c/`, then the row rule                    |
| `/en/learn/human/...`, `/en/learn/software-engineering/platform-web/...` (historical renames) | 2    | as above                   | `learn-reorg` renames, then the pre-IA rule                            |
| `/EN/learn/legacy/...` (mixed-case locale)                                                    | 2    | as above                   | `locale-entry` lower-cases, then the rule                              |
| `/en/learn/legacy/<row path>/` (trailing slash)                                               | 2    | as above                   | the framework strips the slash (`trailingSlash: false`), then the rule |
| `/id/learn/...`                                                                               | 0    | 404, as today              | the `id` locale has no `learn` section and gets no rule                |

The unit simulator models every row except the trailing-slash one (it does not model the framework's
own normalization); the real-server checks below cover that row.

## Inbound links, the sitemap, feeds, search data, and crawlers

| Surface                                   | Behaviour after this plan                                                                                                                                                                                                                                    | Proof                                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| External links, bookmarks, old blog posts | The old address answers 308 to the course or catalog. A 308 keeps the request method and is cached by clients, so a returning visitor lands on the new page without delay                                                                                    | the crawl in this page                                                                         |
| `sitemap.xml`                             | Built from the content index (`src/app/sitemap.ts`). With the tree gone it lists no `/learn/legacy` URL. Legacy URLs are deliberately **not** listed anywhere, so crawlers find the new URLs and re-crawl the old ones only when they follow an inbound link | unit `sitemap.unit.test.ts` extended; running server `curl` (see below)                        |
| `feed.xml`                                | Same content-driven source; lists no legacy URL                                                                                                                                                                                                              | unit `feed.xml/route.unit.test.ts` extended                                                    |
| Search data                               | `generated/search-data.json` is rebuilt from content by `generate-search-data`, so no entry has a `learn/legacy` slug                                                                                                                                        | `rtk git grep` cannot see it (the folder is gitignored), so the check reads the generated file |
| `robots.txt`                              | Keeps `Allow: /` with no `Disallow`. A blocked URL cannot be crawled, so crawlers could never see its 308                                                                                                                                                    | new unit assertion that no rule disallows `/en/learn`                                          |
| In-site links                             | None remain: the generated `_index.md` is regenerated, and the 2023 rant is unlinked                                                                                                                                                                         | `rtk git grep` (zero hits outside the redirect machinery)                                      |
| `noindex` on legacy pages                 | The `isLegacySlug` branch is removed; there are no legacy pages to mark. The 308 itself tells crawlers to transfer the old URL                                                                                                                               | `page.unit.test.ts` loses the legacy test                                                      |
| `/id/**`                                  | Unchanged, no rule                                                                                                                                                                                                                                           | `rtk git diff --stat origin/main -- apps/ayokoding-www/content/id` prints nothing              |

## The frozen URL inventory

**Problem.** The best test of "every legacy URL redirects correctly" is to walk the legacy tree and check
each page. The tree is deleted in this same PR, so a test that needs the tree cannot stay. Without a
frozen copy of the list, the guarantee would be tested once and then lost.

**Design.** A committed text file records every legacy URL and the destination it must reach:

`apps/ayokoding-www/tests/unit/redirects/fixtures/legacy-url-inventory.tsv`

- One line per legacy file, 1,150 lines, sorted bytewise by the first column, `\n` line ends, no header.
- Three tab-separated columns: the legacy URL (`/en/learn/legacy/...`), the destination the mapping
  requires (`/en/learn/courses/<slug>` or `/en/learn/courses`), and the row key (the row's path, or
  `(navigation)` for the 65 navigation files). Example lines (shown here with spaces; the file uses tabs):

```text
/en/learn/legacy /en/learn/courses (navigation)
/en/learn/legacy/artificial-intelligence/tools/claude-code /en/learn/courses/claude-code-for-engineers artificial-intelligence/tools/claude-code
/en/learn/legacy/business/overview /en/learn/courses business/overview.md
```

**How it is made, with no ad-hoc script.** The temporary parity test builds the expected inventory from
two independent sources, the real file tree and the parsed mapping (not from `LEGACY_ROUTES`), and calls
`expect(text).toMatchFileSnapshot("./fixtures/legacy-url-inventory.tsv")`. Vitest writes the file the
first time it runs with `-u` and compares byte for byte afterwards. A person reads the written file once:
1,150 lines, 113 destinations equal to the catalog, 1,037 equal to a course, 74 distinct course
destinations. Because the inventory is computed from the tree and the mapping, and the redirect table is
computed from neither, the permanent test below compares two independent derivations rather than a table
with itself.

**How it is used, permanently.** `tests/unit/redirects/legacy-removal.unit.test.ts` reads the fixture and,
for every line:

1. follows the legacy URL through `redirectRules` with the shared `followRedirects` helper and expects
   exactly one hop that ends at the stated destination;
2. does the same for the pre-IA twin, the same URL with `/legacy` removed, for the 1,148 lines whose first
   path segment is one of the six domains, and expects the same destination in one hop. The other two lines
   are the two files directly under `legacy/` (its `_index.md` and `overview.md`). Their would-be twins,
   `/en/learn` and `/en/learn/overview`, are the Learn home and a page that plan 04 redirects to it, so the
   test asserts the opposite for them: `legacyRemovalRedirects` does not capture either address;
3. expects the destination to be terminal and, for a course destination, to be an existing course
   directory.

That is 2,298 redirect assertions (1,150 legacy addresses plus 1,148 pre-IA twins) and 2 non-capture
assertions over 1,150 lines, run in the unit suite on every pull request. The be-e2e crawl below repeats
both halves against the real server.

**What dies with the tree.** The parity test is deleted in the deletion commit, because it needs the tree
and the mapping file. The fixture, the table, and the permanent test stay. If a later plan wants to change a
destination, it edits the table and the fixture line together.

## HTTP checks on a real server

The unit simulator proves the rule list; the real server proves the framework applies it. Two levels:

**Sample, by hand with `curl`** (Phase 1 on the dev server, Phase 6 and Phase 8 on the production build,
and the same list on the live site after deploy). Each URL is requested twice, once without following
redirects and once at the `Location` it returned:

```text
rtk curl -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3101/<url>
```

Expected results; the first column names the case, the last two columns are the first and the second
request:

| Case | URL                                                                                                | First request                                                                                            | Second request (the Location) |
| ---- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------- |
| E1   | `/en/learn/legacy/artificial-intelligence/tools/claude-code`                                       | `308` to `/en/learn/courses/claude-code-for-engineers`                                                   | `200`                         |
| E2   | `/en/learn/legacy/software-engineering/programming-languages/rust/by-example/beginner` (deep page) | `308` to the course named by the `software-engineering/programming-languages/rust` row (`rust-in-depth`) | `200`                         |
| E3   | `/en/learn/legacy/business/accounting` (a single-file row)                                         | `308` to `/en/learn/courses/accounting-foundations`                                                      | `200`                         |
| E4   | `/en/learn/legacy/business/overview` (an obsolete single file)                                     | `308` to `/en/learn/courses`                                                                             | `200`                         |
| E5   | `/en/learn/legacy/personal-development/tools/cliftonstrengths/overview` (an obsolete folder)       | `308` to `/en/learn/courses`                                                                             | `200`                         |
| E6   | `/en/learn/legacy` (the bucket root)                                                               | `308` to `/en/learn/courses`                                                                             | `200`                         |
| E7   | `/en/learn/legacy/software-engineering/overview` (a navigation file)                               | `308` to `/en/learn/courses`                                                                             | `200`                         |
| E8   | `/en/learn/software-engineering/programming-languages/rust/by-example/beginner` (pre-IA address)   | `308` to the same course as E2                                                                           | `200`                         |
| E9   | `/en/c/learn/legacy/software-engineering/programming-languages/rust`                               | `308` to `/en/learn/legacy/software-engineering/programming-languages/rust`, then `308` to the course    | `200` at the end of the chain |
| E10  | `/en/learn/human/overview` (historical rename)                                                     | `308` to `/en/learn/personal-development/overview`, then `308` to `/en/learn/courses`                    | `200` at the end              |
| E11  | `/en/learn/legacy/business/accounting/` (trailing slash)                                           | `308` to the slash-free address, then `308` to the course                                                | `200` at the end              |
| E12  | `/EN/learn/legacy/business/accounting`                                                             | `308` to `/en/learn/legacy/business/accounting`, then `308` to the course                                | `200` at the end              |
| E13  | `/en/learn/courses/sql-essentials`                                                                 | `200`, no redirect                                                                                       | not requested                 |
| E14  | `/id/learn/legacy/business/accounting`                                                             | `404`, no redirect                                                                                       | not requested                 |

Plus the **every-hundredth rule**: also request lines 1, 101, 201, and so on of the inventory (12 lines),
so the sample is not only the author's choices. The numbers 1,150 and 12 lines come from the file, and the
check lists the line numbers it used.

**Full list, in the be-e2e project** (permanent, automated). A new step in
`apps/ayokoding-www-be-e2e` reads the same fixture and, for every line, requests the legacy URL with
`maxRedirects: 0`, expects status `308` (not 301, 302, or 307) and a `Location` equal to the destination.
It does the same for the 1,148 pre-IA twins, so that is 2,298 redirect requests. Each distinct destination (75: the
74 courses and the catalog) is then requested once and must answer `200`.
It runs against the local production build in Phase 6 and against production after deploy by setting
`BASE_URL` (the project's config already reads it). The server is the project's `webServer`, so no extra
setup is needed locally.

## What `next.config.ts` looks like afterwards

```ts
import { redirectRules } from "./src/redirects";
// ...
async redirects() {
  // Order is load-bearing: see src/redirects/index.ts. The legacy-removal rules are last on purpose,
  // so every more specific module (course re-homes, the Learn home) answers first.
  return [...redirectRules];
},
```

The old five-line import block, the `learnThreeBucketRedirects` spread, and the comment that mentions the
"six-domain legacy-bucket module" are removed.

## Rollback of the redirect behaviour

Reverting the PR restores `learn-three-bucket.ts`, removes `legacy-removal.ts` and the aggregator, and
brings the 1,150 pages back, so the old addresses answer 200 again. A client that already followed a 308
may keep redirecting from its own cache until the cache is cleared, because a 308 tells clients to cache
"forever". The full rollback packet is in [010](./010-pr-size-rollback-and-series-closure.md#rollback).
