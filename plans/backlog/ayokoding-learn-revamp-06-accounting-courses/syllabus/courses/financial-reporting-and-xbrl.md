# Financial Reporting and XBRL (Annotated-Concept)

**Course ID**: `financial-reporting-and-xbrl` · **Format**: Annotated-Concept.

**Scope note**: Teaches how financial statements become machine-readable: XBRL instances, taxonomies,
contexts, units, linkbases, dimensions, extensions, Inline XBRL, validation, and the pipeline from a
ledger to a tagged filing. It uses a small teaching taxonomy and the Python standard library, so no
real filing tool or real taxonomy package is needed. It excludes the filing rules of any one regulator
in depth and the standards themselves (`financial-reporting-standards-ifrs-vs-gaap`).

**Short summary**: A regulator cannot read a PDF at scale; it reads tagged facts. You learn what an XBRL
fact is, how a taxonomy gives it meaning, and how to build a pipeline that tags statements from the
ledger and checks them before anyone files them.

## Why this exists · the big idea

- **The problem before the solution**: hand-tagging a report after the numbers are final is slow and
  error-prone, and a wrong tag misreports a number to every machine that reads the filing.
- **Keep-this-if-you-forget-everything**: an XBRL fact is a value plus a concept, a period, an entity,
  and a unit; generate facts from the ledger through a reviewed mapping and validate them before filing.

## Learning objectives

- Read and write an XBRL instance: facts, contexts, units, and decimals.
- Explain taxonomies, schemas, and the presentation, calculation, label, and definition linkbases.
- Use dimensions for breakdowns and decide when an extension concept is justified.
- Build a ledger-to-filing pipeline with a reviewed account-to-concept mapping.
- Validate calculations and consistency, and explain which taxonomy version applies to a filing.

## Prerequisites

- **Prior courses**: `financial-statements-and-close-cycle` (the statements being tagged),
  `financial-reporting-standards-ifrs-vs-gaap` (frameworks and IFRS 18 presentation), `just-enough-python`.
- **Assumed knowledge**: reading XML.

## Mode and targets

- **Mode**: Annotated-Concept, standard. **Reason**: XBRL is a specification with many moving parts;
  annotated fragments of instances and linkbases explain them best, and Python builds and checks them.
  By Example was rejected because roughly half the material is explaining specification structures,
  not running behaviour.
- **Worked examples**: floor 45 in five themes; at least 27 code-bearing. **Words**: at least 22,000.
  **Diagrams**: at least 10.
- **Metadata**: `format: annotated-concept`; `description` kept from plan 03 ("Tag financial report facts
  with XBRL so machines can read them correctly."); `estimatedHours` from the drift test.

## Accuracy notes

- XBRL International describes XBRL as "the open international standard for digital business
  reporting" (`https://www.xbrl.org/the-standard/what/`, accessed 2026-10-09). Specification names and
  status come from `https://specifications.xbrl.org/specifications.html`; the maker cites that page with
  its access date before naming XBRL 2.1, Dimensions 1.0, or Inline XBRL 1.1.
- Taxonomy versions on 2026-10-09: the IFRS Accounting Taxonomy 2025 stays current for 2026 reporting,
  with the next update due in the first quarter of 2027 (secondary sources: BDO, 27 February 2026;
  XBRL International news on ESMA, 26 April 2026). The US GAAP Financial Reporting Taxonomy 2026 was
  released on 15 December 2025 (`https://www.xbrl.org/news/fasb-releases-2026-taxonomies-for-digital-reporting/`)
  and accepted by EDGAR Release 26.1 from 16 March 2026 (`https://www.sec.gov/newsroom/whats-new/edgar-release-261`).
  The latest Indonesian Stock Exchange taxonomy found was IDX Taxonomy 2020; a newer version could not be
  confirmed (the IDX page returned HTTP 403). The course states versions only with an "as of" date and
  tells readers to check the current version.
- The teaching taxonomy is fictional and says so; no real taxonomy file is copied into the course.

## Concepts

- **co-01 · why-structured-reporting** — machines, regulators, and analysts read tagged facts.
- **co-02 · fact** — a value with a concept, a context, a unit, and a precision.
- **co-03 · context** — entity, period (instant or duration), and optional dimensions.
- **co-04 · unit** — currency, shares, or ratios.
- **co-05 · taxonomy-schema** — concept definitions with data type, period type, and balance.
- **co-06 · linkbases** — presentation, calculation, label, definition, and reference relationships.
- **co-07 · dimensions** — axes and members for breakdowns such as segments.
- **co-08 · extensions** — company-specific concepts and why regulators discourage unnecessary ones.
- **co-09 · inline-xbrl** — tags embedded in a human-readable HTML report.
- **co-10 · mapping** — ledger accounts and report lines mapped to concepts.
- **co-11 · validation** — schema, calculation, and consistency checks.
- **co-12 · taxonomy-versions** — annual taxonomy releases and which one a filing must use.
- **co-13 · filing-pipeline** — from closed ledger to validated instance with review steps.
- **co-14 · consuming-xbrl** — reading facts back for analysis.

## Worked examples

### Theme A — Why machine-readable (`learning/theme-a-why-machine-readable.md`)

- **ex-01 · pdf-vs-facts** — compare reading a number from a PDF with reading a tagged fact — verify the
  fact carries its meaning. (co-01)
- **ex-02 · who-uses-xbrl** — map regulators, investors, and data vendors to their uses — verify the
  table cites sources. (co-01)
- **ex-03 · fact-anatomy** — annotate one fact element — verify each attribute's role. (co-02)
- **ex-04 · reporting-chain-diagram** — draw ledger to report to filing to consumer (Mermaid) — verify.
  (co-01, co-13)
- **ex-05 · tagging-errors** — show how a sign or scale error misleads a machine reader — verify the
  wrong total. (co-02)
- **ex-06 · decimals-attribute** — show how `decimals` states precision — verify rounding. (co-02)
- **ex-07 · first-fact-in-python** — create one fact with `xml.etree` — verify the XML. (co-02)
- **ex-08 · versions-as-of-date** — state taxonomy versions with an "as of" date — verify the wording
  rule. (co-12)
- **ex-09 · structured-reporting-glossary** — build a glossary as data — verify every term is used
  later. (co-01)

### Theme B — Anatomy of an instance (`learning/theme-b-instance-anatomy.md`)

- **ex-10 · instance-skeleton** — write a minimal instance — verify it parses. (co-02)
- **ex-11 · duration-context** — add a duration context — verify. (co-03)
- **ex-12 · instant-context** — add an instant context for a balance — verify. (co-03)
- **ex-13 · period-type-mismatch** — tag a balance with a duration — verify the check catches it.
  (co-03, co-05)
- **ex-14 · units** — declare currency and share units — verify. (co-04)
- **ex-15 · balance-attribute** — show debit and credit balance types and sign conventions — verify.
  (co-05)
- **ex-16 · footnotes** — attach a footnote to a fact — verify. (co-02)
- **ex-17 · instance-builder** — build an instance from a dictionary of facts — verify. (co-02)
- **ex-18 · instance-reader** — read facts back into Python — verify a round trip. (co-14)

### Theme C — Taxonomies and linkbases (`learning/theme-c-taxonomies-and-linkbases.md`)

- **ex-19 · teaching-taxonomy** — define ten concepts in a small schema — verify. (co-05)
- **ex-20 · label-linkbase** — add standard and terse labels — verify lookups. (co-06)
- **ex-21 · presentation-linkbase** — order concepts into a statement tree — verify the rendering.
  (co-06)
- **ex-22 · calculation-linkbase** — define summation relationships with weights — verify. (co-06)
- **ex-23 · definition-linkbase-preview** — show dimensional relationships — verify. (co-06, co-07)
- **ex-24 · reference-linkbase** — link a concept to a standard paragraph reference — verify. (co-06)
- **ex-25 · taxonomy-diagram** — draw schema and linkbases (Mermaid) — verify. (co-05, co-06)
- **ex-26 · concept-search** — find concepts by label — verify. (co-06)
- **ex-27 · ifrs18-in-taxonomy** — show how a taxonomy can carry IAS 1 and IFRS 18 presentation
  entry points — verify the choice is per filing. (co-12)

### Theme D — Dimensions and extensions (`learning/theme-d-dimensions-and-extensions.md`)

- **ex-28 · segment-axis** — tag revenue by segment — verify. (co-07)
- **ex-29 · default-member** — explain the default member — verify the total. (co-07)
- **ex-30 · dimension-validation** — reject a member not allowed on an axis — verify. (co-07)
- **ex-31 · equity-statement-dimensions** — tag an equity statement with two axes — verify. (co-07)
- **ex-32 · extension-decision** — decide between an existing concept and an extension — verify the
  rule. (co-08)
- **ex-33 · anchoring-extensions** — anchor an extension to a nearby standard concept — verify. (co-08)
- **ex-34 · extension-count-check** — count and justify extensions — verify the report. (co-08)
- **ex-35 · inline-xbrl** — embed tags in an HTML statement — verify facts extract correctly. (co-09)
- **ex-36 · inline-scale-and-sign** — apply scale and sign in Inline XBRL — verify values. (co-09)

### Theme E — From ledger to filing (`learning/theme-e-ledger-to-filing.md`)

- **ex-37 · account-to-concept-mapping** — map ledger accounts to concepts — verify every reported
  account maps. (co-10)
- **ex-38 · mapping-review** — review mapping changes with approval — verify. (co-10)
- **ex-39 · generate-instance** — generate an instance from a closed trial balance — verify. (co-13)
- **ex-40 · calculation-check** — check calculation relationships — verify a broken total fails.
  (co-11)
- **ex-41 · consistency-checks** — check balance sheet equality and cash flow ties — verify. (co-11)
- **ex-42 · prior-period-consistency** — compare with last year's filing — verify. (co-11)
- **ex-43 · version-pinning** — pin the taxonomy version per filing — verify a wrong version fails.
  (co-12)
- **ex-44 · filing-pipeline** — run the pipeline with review gates (Mermaid plus code) — verify the
  log. (co-13)
- **ex-45 · analyst-consumer** — read the filing back and compute ratios — verify. (co-14)

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-instant-vs-duration`, `kata-02-scale-error`, `kata-03-calculation-weight-sign`,
  `kata-04-unmapped-account`, `kata-05-dimension-member-not-allowed`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6.

## Capstone spec

**A ledger-to-XBRL pipeline.** A teaching taxonomy with label, presentation, and calculation
linkbases; a reviewed account-to-concept mapping; an instance and an Inline XBRL statement generated
from a closed trial balance; and validation that catches calculation, period-type, dimension, and
version errors. The `run.yaml` generates the filing for a fixture year and compares the instance and
the validation report.

## Code and harness

- Python standard library only (`xml.etree.ElementTree`, `html.parser`, `decimal`). Arelle and other
  filing tools are rejected for the harness (third-party dependency and network taxonomy downloads);
  the course names them as what production teams use.

## Read more

- **XBRL specifications** — XBRL International, `https://specifications.xbrl.org/specifications.html`.
- **What is XBRL?** — XBRL International, `https://www.xbrl.org/the-standard/what/`.

## Lineage

- Replaces the 204-word outline measured on 2026-10-09.

## In which paths

- `skills/conventional-accounting` — Phase 6 (Reporting and ledger systems), position 18.
- `skills/sharia-accounting` — Phase 6 (Reporting and ledger systems), position 18.
