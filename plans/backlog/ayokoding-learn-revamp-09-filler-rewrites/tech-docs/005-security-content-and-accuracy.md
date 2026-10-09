# 005 — Security Content and Accuracy

Two kinds of rule sit on this page. The first set applies to the two security courses
(`defensive-security` and `vulnerability-management-and-assessment`): what the lab may contain, and the one
rule (SEC1) a test enforces. The second set applies to all eight: how a fact is stated, sourced, and
re-checked, because six of the eight teach tools whose versions and defaults change. The page ends with the
duty this plan has towards plan 08's capstones, and a register of the sources the briefs rely on.

## Safe-Lab Rules for the Two Security Courses

The two courses already open every level page with a boundary banner ("Every command reads this course's
synthetic files only"). The rewrite keeps the promise and makes it stronger. These rules are content
requirements judged by the Content Quality Gate; the harness enforces the network part at run time (a unit
has no network), and SEC1 is checked by a test.

| #   | Rule                                                                                                                                                                                                                                                                                                                                                                                                         | Enforced by                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| S1  | **Synthetic data only.** Every log line, finding, host, user, hash, and token in a unit or lesson is invented for the course. Real data appears only as a named, cited example in prose (for example, one well-known CVE or a published ATT&CK technique), and no computation depends on it                                                                                                                  | Content Quality Gate                                                                           |
| S2  | **No target.** No unit takes a host, URL, address, or file path of a system as an argument or reads one from the environment. Units read only files in their own folder or in the shared code root                                                                                                                                                                                                           | Content Quality Gate; the harness (no network, read-only root)                                 |
| S3  | **No attack code.** The defensive course shows detections, response steps, and hardening. The vulnerability course shows identification, scoring, and remediation. Neither shows a working exploit, payload, evasion technique, or credential-guessing tool. Attack behaviour is described as telemetry the defender sees                                                                                    | Content Quality Gate                                                                           |
| S4  | **One banner per level page.** The safe-lab boundary appears once at the top of each level page, not under every example. A banner repeated in 26 bodies is the boilerplate that FG6 measures; it also teaches nothing                                                                                                                                                                                       | Filler guard FG6                                                                               |
| S5  | **Reserved addresses and names only (SEC1).** Every IPv4 literal is in `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, or an RFC 5737 documentation range (`192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`); every IPv6 literal is in `2001:db8::/32` or is `::1`. Hostnames use the `example.com`, `example.org`, `example.net`, `.test`, `.example`, `.invalid`, or `.localhost` names | The completion test ([007](./007-testing-strategy.md)); the Content Quality Gate for hostnames |
| S6  | **Fictional identifiers.** Fixture CVE identifiers use the year 2099 (`CVE-2099-0001`), so no fixture can be mistaken for a real record. Package names are invented (`acme-parser`). Real, widely known identifiers appear only in prose, with a source and an access date                                                                                                                                   | Content Quality Gate                                                                           |
| S7  | **ATT&CK as a vocabulary.** Technique IDs map detections to coverage; they are never instructions. Use the tactic set in force on the execution date and state the ATT&CK version                                                                                                                                                                                                                            | Content Quality Gate                                                                           |

### SEC1 in Detail

SEC1 is the repository's existing security by-example rule (`repo-governance/conventions/tutorials/security-by-example/`:
"fictional IP ranges used (10.x, 192.168.x, RFC 5737)"). That convention governs the legacy
`information-security` tracks by name, so nothing has enforced it for the two security courses. This plan
applies it to them and makes it a test.

- **Range list:** the convention names `10.x`, `192.168.x`, and RFC 5737; this plan writes the list out in full
  (it adds `172.16.0.0/12`, loopback, and the IPv6 documentation prefix of RFC 3849) so a test can check it.
- **What the test reads:** every `.md` page and every code or fixture file of the two courses, expected files
  included.
- **What it flags:** a dotted quad `a.b.c.d` whose four parts are 0 to 255 and whose address is outside the
  allowed ranges above; and an IPv6 literal outside `2001:db8::/32` and `::1`.
- **False positives:** a four-part version string such as `1.2.3.4` looks like an address. The rule for authors
  is to write versions with at most three parts in these two courses; the unit test for SEC1 keeps a fixture
  that proves a version-like quad is flagged, so the behaviour is documented rather than hidden. A real
  address range cited as the subject of a lesson (for example, "RFC 1918") is written as a range name or in
  CIDR form with an allowed prefix, never as a made-up public address.
- **What it does not flag:** URLs with hostnames (the sources sections link to real sites). Hostnames in
  units and fixtures are judged by the Content Quality Gate.

## What Each Security Course Teaches, and Where It Stops

The briefs state this in full; the table is the boundary for review.

| Course                                    | In scope                                                                                                                                                                                                                                                   | Out of scope (and where it lives)                                                                                                                                                                                                                         |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defensive-security`                      | Log sources, normalization, central collection, detection rules (Sigma shape), alert severity, tuning with a false-positive count, hunting, indicators, incident response lifecycle, containment and recovery, zero trust, hardening, coverage with ATT&CK | Wazuh decoders, correlation-rule authoring, dashboard operations, and specialist tuning (`detection-engineering-and-siem-operations`, which follows this course); offensive technique (`offensive-security`); policy and compliance (`it-governance-grc`) |
| `vulnerability-management-and-assessment` | Identity (CVE, CWE, CPE, purl), severity (CVSS v4.0 groups), likelihood (EPSS), exploitation evidence (KEV), SBOM, scanner modalities, normalization, deduplication, VEX, reachability, prioritization, SLAs, reporting, verification                      | Running a scanner against a system; exploit development and pentest practice (`offensive-security`); incident response (`defensive-security`); policy and compliance (`it-governance-grc`)                                                                |

## Accuracy Rules for All Eight Courses

| #   | Rule                                                                                                                                                                                                                                                                                                                    |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | **Date every changeable fact.** A version, default, count, score, or policy status is written with "as of <month year>" in the lesson and carries a source with an access date in the References section                                                                                                                |
| A2  | **Primary source first.** The standard body, the project's own release page or documentation, or the vendor's reference. A blog or news article may support a story, never a number                                                                                                                                     |
| A3  | **Re-verify at execution.** Every fact in a brief's accuracy notes is a probe, not a given. The maker fetches the source, records the value and date in the ledger, and corrects the course if the world differs from the brief. The brief is then corrected too (plans are history, but a wrong claim must not travel) |
| A4  | **Pin what you print.** A unit that prints a version-specific text (a compiler diagnostic, a warning, a banner) is correct only for the catalog version; the lesson names that version. A catalog bump re-records the expected file                                                                                     |
| A5  | **Show both answers when the world has two.** Where a default is changing (Git's hash, ATT&CK's tactic set, CVSS 3.1 versus 4.0 in old records), the lesson shows the current default, states the date, and shows how to see the other                                                                                  |
| A6  | **No "latest".** The word "latest" and phrases such as "the current release" are not allowed without a date and a source beside them                                                                                                                                                                                    |
| A7  | **Own words and own examples.** All examples are original; external text is cited, not copied. Licences are checked for anything quoted                                                                                                                                                                                 |

## Capstone Handoff

Plan 08 (capstone courses, merged before this plan) writes three capstones that list the two security courses
as prerequisites. Plan 08's rules for those capstones (restated here so this plan stands alone):

| Rule | Meaning                                                                                                                                                                |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CL1  | A capstone links to a prerequisite only by its course URL, never to a lesson, heading, or code file                                                                    |
| CL2  | Where a capstone first uses a prerequisite's concept, it restates the concept in a sentence or two (a definition, not a lesson)                                        |
| CL3  | A capstone's code imports nothing from a prerequisite's code folders                                                                                                   |
| CL4  | `learning/overview.md` of the capstone has `## What this course relies on`: for each prerequisite, the concept names it uses (names only) and where it first uses each |

Plan 08 built the `relies-on` rows for the two security courses from the concepts the old, templated
courses showed at definition level: **a detection rule, a log source, a severity rating, and a finding**.
Its handoff table gives this plan one duty:

> Before merge, search `apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md` for the
> course slug; for each hit, read the `relies-on` row and confirm the new course still teaches the named
> concepts. If not, edit the row and the capstone paragraph that restates it, in the same PR.

How this plan carries the duty out:

1. **The rewritten courses keep teaching the four concepts at definition level**, under names the briefs fix:
   - _detection rule_: `defensive-security`, examples 14 to 17 (a rule as code; a Sigma rule's `logsource`,
     `detection`, `condition`);
   - _log source_: `defensive-security`, examples 2, 3, and 8 (what a source is, why it is chosen, how two
     shapes normalize);
   - _severity rating_: `defensive-security` (alert severity levels, example 29) and
     `vulnerability-management-and-assessment` (CVSS v4.0 base severity bands, examples 10 to 15);
   - _finding_: `vulnerability-management-and-assessment`, examples 50 to 52 and 57 (the common finding
     schema and its deduplication).
     The example numbers are the briefs' numbers; if a maker moves an example, the brief and this list change
     together.
2. **CP-7 in [006](./006-execution-model.md#checkpoints-per-course)** is the re-read: for the two security
   courses, after the course is DONE, the coordinator searches the capstones and compares each row with the
   finished course.
3. **Dependents found on 2026-10-09:** `capstone-secure-service` (detections), `capstone-real-world-delivery`
   (defensive security), and `capstone-build-your-own-pentest-engine` (both courses). Phase 0 repeats the
   search, because a plan before this one may add or rename a row.
4. **If a row names a concept the finished course no longer teaches**, the coordinator edits the row and the
   capstone paragraph that restates it in the same PR, runs the capstone's content-shape test and the
   capstone's own `examples check`, and records the edit in the ledger. A concept the finished course teaches
   under a new name is a row edit only.
5. **Legacy relation.** Both security overviews end with a `## Legacy relation` section ("Superseded by: ...").
   It is plan 10's input; the rewrite keeps the section unchanged.

## Source Register

Sources the briefs rely on. "Fetched" means the author read the page on 2026-10-09; "search" means the claim
was seen in search results and the maker must fetch it. In both cases the maker re-reads the source at execution
(rule A3) and records a fresh access date.

| Subject                         | Source                                                                                                                                                                                 | What it supports                                                                                                                                                                                                                                                               | Status on 2026-10-09       |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| NVD enrichment policy           | [NIST: "NIST Updates NVD Operations to Address Record CVE Growth", 15 April 2026](https://www.nist.gov/news-events/news/2026/04/nist-updates-nvd-operations-address-record-cve-growth) | From 15 April 2026 NVD prioritizes CVEs in CISA KEV (goal: one business day), CVEs for software used in the US federal government, and critical software under Executive Order 14028; others are added but labelled "Lowest Priority - not scheduled for immediate enrichment" | Fetched                    |
| CVSS version                    | [FIRST CVSS](https://www.first.org/cvss/)                                                                                                                                              | "CVSS is currently at version 4.0" (specification released November 2023)                                                                                                                                                                                                      | Fetched                    |
| EPSS meaning and version        | [FIRST EPSS](https://www.first.org/epss/)                                                                                                                                              | EPSS "estimates the probability that a published CVE will be exploited in the wild in the next 30 days". The page names no model version; a vendor reports EPSS v5 in mid-2026                                                                                                 | Fetched; version to verify |
| ATT&CK Enterprise tactics       | [MITRE ATT&CK Enterprise tactics](https://attack.mitre.org/tactics/enterprise/)                                                                                                        | 15 tactics at content version v19.2, including TA0005 Stealth and TA0112 Defense Impairment                                                                                                                                                                                    | Fetched                    |
| Sigma specification             | [Sigma specification](https://sigmahq.io/sigma-specification/)                                                                                                                         | Rules, correlation, filters, modifiers, tags, and taxonomy are separate documents; the page links upgrade notes up to 2.1.0 (version number to verify)                                                                                                                         | Fetched; version to verify |
| Incident response guidance      | [NIST SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final), April 2025                                                                                                     | Supersedes Rev. 2 and frames incident response through CSF 2.0. The older prepare / detect / contain / eradicate / recover sequence is a teaching model, not the NIST model                                                                                                    | Search                     |
| Zero trust                      | NIST SP 800-207; CISA Zero Trust Maturity Model                                                                                                                                        | Tenets, policy decision point and policy enforcement point                                                                                                                                                                                                                     | To fetch                   |
| Known exploited vulnerabilities | [CISA KEV catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)                                                                                                       | Catalog fields and the meaning of an entry                                                                                                                                                                                                                                     | To fetch                   |
| CWE                             | [MITRE CWE](https://cwe.mitre.org/)                                                                                                                                                    | Latest release (4.20 on 2026-04-30 per MITRE's news page, to verify); the 2025 Top 25                                                                                                                                                                                          | Search                     |
| SBOM formats                    | [CycloneDX](https://cyclonedx.org/), [SPDX](https://spdx.dev/)                                                                                                                         | CycloneDX 1.7 is also Ecma-424 (edition to verify); SPDX 3.0 is an ISO draft and SPDX 3.1 had a release candidate in January 2026; ISO/IEC 5962:2021 is SPDX 2.2.1                                                                                                             | Search                     |
| Git object format               | [Git documentation](https://git-scm.com/docs), including `gitformat-pack`, `hash-function-transition`, and `BreakingChanges`                                                           | Object format, pack format, SHA-256 repositories (`--object-format=sha256`), and the planned change of the default hash in Git 3.0, which had not shipped by October 2026                                                                                                      | Search                     |
| Spring Boot                     | [Spring Boot reference](https://docs.spring.io/spring-boot/) and the release page                                                                                                      | 4.1.1 is current; Spring Framework 7; Jackson 3; starters were reorganized in Boot 4                                                                                                                                                                                           | Search                     |
| Clojure                         | [Clojure releases](https://clojure.org/releases/downloads)                                                                                                                             | 1.12.6 released 2026-09-02; Java 25 recommended; dependency versions (`spec.alpha` 0.5.238, `core.specs.alpha` 0.4.74) from its POM                                                                                                                                            | Search                     |
| F# and .NET                     | [F# language reference](https://learn.microsoft.com/en-us/dotnet/fsharp/), [F# Interactive](https://learn.microsoft.com/en-us/dotnet/fsharp/tools/fsharp-interactive/)                 | Language features, `dotnet fsi`, warning FS0025 text                                                                                                                                                                                                                           | To fetch                   |
| OCaml, Racket, Rust, TypeScript | Each project's own documentation                                                                                                                                                       | Language features and diagnostic text for the pinned catalog versions                                                                                                                                                                                                          | To fetch                   |
| R7RS-small                      | [R7RS-small](https://small.r7rs.org/)                                                                                                                                                  | Scheme semantics: proper tail calls, `syntax-rules`, `call/cc`                                                                                                                                                                                                                 | To fetch                   |

## What the Briefs Add

Each course brief has an **Accuracy notes** section listing, for that course, the sources above that apply,
the facts the maker must verify (as probes), and the traps the old text fell into. The traps found on
2026-10-09 are in [001](./001-current-state.md#what-a-reader-finds); the largest are the NUL bug in the Git
course and the "same report for every example" script in the vulnerability course.
