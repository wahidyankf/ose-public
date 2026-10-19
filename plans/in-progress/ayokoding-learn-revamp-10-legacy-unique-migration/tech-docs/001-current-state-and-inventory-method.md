# 001 — Current State and Inventory Method

## The two trees, measured 2026-10-09

| Tree                                           | Files                                                                          | Words                    | Status                                                                                                                                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/ayokoding-www/content/en/learn/courses/` | 182 course directories (181 real courses plus the directory's own `_index.md`) | —                        | The series's intended single source of truth, built by plans 01 to 09                                                                                                                        |
| `apps/ayokoding-www/content/en/learn/legacy/`  | 1,150 Markdown files                                                           | about 6.65 million words | Self-described in its own `_index.md`/`overview.md` as "kept for reference while the course library fills"; redirected to from `/en/learn/<domain>` by `src/redirects/learn-three-bucket.ts` |

Legacy domain breakdown (files / words), from a recursive walk:

| Domain                                                                            | Files | Words     |
| --------------------------------------------------------------------------------- | ----- | --------- |
| `software-engineering`                                                            | 979   | 6,115,533 |
| `artificial-intelligence`                                                         | 55    | 230,137   |
| `information-security`                                                            | 51    | 217,276   |
| `it-governance`                                                                   | 9     | 63,982    |
| `personal-development`                                                            | 50    | 14,163    |
| `business`                                                                        | 4     | 12,290    |
| legacy-root nav pages (`_index.md`, `overview.md` directly under `learn/legacy/`) | 2     | 213       |

## Inventory method

1. **Enumerate topics.** Every directory under `learn/legacy/` that directly holds one or more Markdown
   files was treated as a topic (matching how the legacy tree itself organizes a subject: an
   `overview.md` plus a `by-example/`, `in-the-field/`, or similarly named track). A recursive
   file-system walk produced the files and word count per topic directory (frontmatter excluded from the
   word count, matching the measurement convention plans 06 to 09 already use).
2. **Compare against the course library.** For each topic, three kinds of evidence were gathered, in
   order of strength:
   - **A named, dedicated existing course on the same subject.** Where plan 03's course catalog already
     has a course whose title or description names the same tool, language, or subject, that course's own
     description and its measured scope (word count, example count, whether it is `status: outline` or
     filled) were read directly.
   - **A mention-count scan.** For a legacy topic naming a specific tool or library (for example,
     Terraform, Playwright, Zod), every existing course's Markdown was searched for that tool's name, and
     the top courses by mention count were read to judge whether the tool is the course's actual subject
     or only an incidental choice inside a different subject.
   - **A title/example-overlap comparison.** For legacy topics with a By Example structure (a numbered
     `### Example N: Title` heading per worked example), every existing course's own example titles were
     extracted the same way, and a normalized word-overlap (Jaccard similarity on each title's non-stopword
     tokens) scored how many legacy example titles have a close match in an existing course's own example
     list. A high overlap count supports `covered`; a low one supports `new`.
3. **Classify with a stated rule, applied consistently.** The rule that decided every row (stated once
   here, not re-derived per row): _a legacy topic is `covered` only if an existing, filled course already
   teaches the same subject at a comparable or superseding depth — not merely mentions the same tool or
   library while teaching a different subject._ A `just-enough-X` primer is explicitly a shallow primer
   (1 to 15 estimated hours by plan 03's own target); it does not, by itself, make a materially deeper
   legacy corpus on the same language `covered`. This rule was applied the same way across every one of
   the 12 per-language and 8 per-framework legacy corpora, so no language or framework was exempted by a
   special-cased judgement call; see
   [tech-docs/009](./009-decision-records.md#decision-d2-one-consistent-rule-for-every-per-language-legacy-corpus).
4. **Merge only where a topic alone is below its mode's floor.** A legacy topic below the Annotated-Concept
   floor (45 worked examples) on its own was merged with a closely related topic (for example, awk + sed +
   jq; or Zod + Effect + tRPC + XState) rather than becoming an undersized course. A topic already at or
   above a mode's floor on its own (for example, each of the four AI coding-agent tools, each already
   about 80 to 90 example headings) was kept as its own course, even where a thematically similar topic
   existed, because merging would have pushed the result over the mode's ceiling.
5. **Obsolete requires a stated reason, not a default.** Three individual pages and one 65-file bucket of
   pure Hugo navigation shells are `obsolete`; every other legacy file resolved to `covered` or `new`.
   Nothing was classified `obsolete` for being merely small, old, or low-traffic.

The full, row-by-row result is [syllabus/legacy-to-course-mapping.md](../syllabus/legacy-to-course-mapping.md).

## Granularity and completeness

The mapping table's 105 rows account for all 1,150 real files, verified by re-running the same recursive
walk against the finished table (a file not matched by any row, or matched by more than one, is a defect
this plan's own completion gate catches; see [prd.md](../prd.md#new-backendcontentlegacy-mapping-completenessfeature)).
Three individual pages (`artificial-intelligence/chat-with-pdf.md`,
`software-engineering/compilers-and-interpreters/terminology.md`,
`software-engineering/networking/introduction.md`) sit outside any topic's own `by-example`/`in-the-field`
subdirectory and were found only by this completeness check, not by the initial topic-directory walk; they
are recorded as their own rows, folded into the same disposition as their neighbouring topic.
