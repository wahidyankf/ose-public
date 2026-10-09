# 005 — Sharia Policy and Source Register

Series decision 19 sets the rules for Sharia content. Plan 06 turned them into eight durable rules (SC1 to
SC8) in a reference module of the AyoKoding content skill, and into a gated content-shape test for the
accounting courses. The three Sharia ERP courses follow the same rules. This file restates the rules so the plan
reads alone, adds what is specific to these courses (four per-course checks, the ERP gate scenarios, the AAOIFI
URL register, the seed list of facts and differences), and says what to do when plan 06's merged text differs.

All facts in this file were researched on 2026-10-09. Phase 1 re-verifies every row that a course uses, and the
register below is updated in place. A fact that a course uses and Phase 1 could not verify is cited by body and
title only, with no number, date, or link.

**Which text wins.** Phase 0 reads plan 06's merged module
(`.agents/skills/apps-ayokoding-www-developing-content/reference/sharia-content.md`), its merged
`accounting-course-completion.feature`, and its merged AAOIFI URL register, and records any difference from this
page in `<plan>/evidence/phase-0-contracts.md`. The merged text wins. If plan 06 shipped without the module (it is
a hard dependency, so this is not expected), the executor stops at a `[HUMAN]` checkpoint instead of writing a
second copy of the rules.

## Scope

- **Sharia-only courses (3):** `sharia-compliant-erp-design`, `islamic-contract-based-transaction-flows`,
  and `zakat-and-sharia-compliance-modules`. They sit at positions 28 to 30 of the Sharia ERP path.
- **Other ERP courses:** none of the 27 conventional courses makes a Sharia claim. If a conventional course
  mentions Islamic finance in passing, it links to the Sharia course and states nothing of its own.
- **Accounting courses of plan 06** (`islamic-contract-modeling-for-systems`,
  `sharia-accounting-and-aaoifi-standards`) are assumed by the Sharia ERP path. This plan neither edits nor
  repeats them; the three ERP courses link to them for the accounting treatment.

## The Rules

| Id  | Rule (plan 06's text, restated)                                                                                                                                                                                                                                                       | How this plan checks it                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| SC1 | **Attribute every position.** Each Sharia position names the body or scholar, the document (standard, fatwa, or policy number), and its date, and links or cites a source with an access date.                                                                                        | Check SH3; the Content Quality Gate                              |
| SC2 | **Show differences.** Where recognized bodies, schools, or jurisdictions differ, present each position, attributed, side by side (a table where there are more than two). Never present one as the only valid view.                                                                   | Check SH4; the Content Quality Gate                              |
| SC3 | **Issue no rulings.** Course text never gives its own Sharia verdict. Words that carry a verdict (permissible, impermissible, valid, invalid, compliant, non-compliant, halal, haram) appear only attributed to a named source.                                                       | Check SH2; the Content Quality Gate                              |
| SC4 | **Flag board decisions.** Every point where an institution must choose between positions, or where the answer depends on facts a course cannot know, uses the board-decision callout below. A Sharia course has at least four.                                                        | Check SH1; the ERP gate scenario                                 |
| SC5 | **State the limit once per course.** Each Sharia course's root `overview.md` contains the disclaimer sentence below, word for word.                                                                                                                                                   | Check SH1; the ERP gate scenario                                 |
| SC6 | **Teach the standard in force, with dates.** Cite the standard in force on the access date; name a superseded standard only as history; teach a standard that is issued but not yet effective with its effective date, side by side with the one it replaces.                         | Check SH3; the ERP gate scenario                                 |
| SC7 | **Verify AAOIFI links by hand.** Link an `aaoifi.com` page only after a person has opened it in a browser and confirmed it is AAOIFI's page. This plan applies the rule to `cis.aaoifi.com` links too (decision 19: every AAOIFI URL has a human-verification checkbox before merge). | Check SH3; the register ticks; the ERP gate scenario             |
| SC8 | **Make jurisdiction values configuration.** Zakah rates, nisab, calendar, method, and authority-specific thresholds are configuration with a source and a date, never constants in code.                                                                                              | The Content Quality Gate; the course-specific checks in the Loop |

Plan 06 records SC1 to SC3 and SC8 as judged by the Content Quality Gate (they need reading), and SC4 to SC7 as
gated by tests. This plan keeps the same split and adds the same four gated checks for the three ERP courses (see
[the ERP gate scenarios](#erp-gate-scenarios)).

### The Board-Decision Callout

Exactly this shape (plan 06's), so readers learn to recognize it and the content-shape test can find it:

```markdown
{{< callout type="warning" >}}
**Sharia board decision needed.** Whether the promise to buy is binding on the customer before the sale is
concluded. IIFA and AAOIFI documents address this; the DSN-MUI murabahah fatwa addresses it for Indonesia.
This course does not choose; your institution's Sharia board does.
{{< /callout >}}
```

- The body starts with the bold label `**Sharia board decision needed.**`, then one sentence naming the
  decision, then the attributed positions, then the closing sentence "This course does not choose; your
  institution's Sharia board does."
- After the callout, the lesson shows the system as configurable at that point (a policy value such as
  `promise_binding`), never hard-coded. The callout never says which choice is correct.
- The `warning` type renders the site's warning alert. Every callout in a Sharia course uses it.

### The Disclaimer Sentence

> This course explains standards and design choices; it does not issue Sharia rulings.

It appears once, in the course's root `overview.md`, in the first section, followed by the sentence "Where a
choice needs a ruling, the course marks it as a decision for your institution's Sharia board."

## What This Plan Adds for the ERP Courses

| Addition                          | Detail                                                                                                                                                                           |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Four per-course checks SH1 to SH4 | Run after the harness pre-check and before the mode gate, so the gates judge text that already meets the rules ([Course Checks](#course-checks))                                 |
| Decision points per course        | Each Sharia course spec lists the points it must flag ([Decision Points Per Course](#decision-points-per-course)); each gets a callout where it first matters                    |
| Differences table                 | At least one per course, with sourced rows only; a row whose sources conflict or are secondary is omitted, not summarized                                                        |
| Sixth drilling section            | "Sharia board decision spotting": at least 6 scenarios where the reader names the decision a Sharia board must make (the other five sections are the standard drilling sections) |
| ERP gate scenarios                | Four scenarios in `erp-course-completion.feature` that apply SC4 to SC7 to the three courses ([ERP Gate Scenarios](#erp-gate-scenarios))                                         |
| Register of AAOIFI URLs           | Held in this file, extended in place, and ticked by a person in Phase 7 ([AAOIFI URL Register](#aaoifi-url-register))                                                            |

## Source Register

States: **Verified** means a page was opened and read in this plan and the stated fact matched. **Researched**
means a search result or a secondary summary showed it, and nobody has opened the primary document yet. **To
verify** means the plan names the topic only. Phase 1 turns every row a course uses into Verified or removes it.
The rows below agree with the register in plan 06's
[Sharia content policy](../../ayokoding-learn-revamp-06-accounting-courses/tech-docs/004-sharia-content-policy-and-sources.md#source-register)
(accessed 2026-10-09); where the two differ after Phase 0, plan 06's merged register wins and this one is
corrected.

### AAOIFI Financial Accounting Standards

| Standard                                                  | What the plan expects                                                                                                          | State                                                                            |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| FAS 1 (revised), general presentation and disclosures     | Effective 1 January 2024 (AAOIFI deferred it from 2023); the cis page still shows 2023, so teach 2024 and note the stale field | Researched; the two dates conflict, verify                                       |
| FAS 28, Murabaha and other deferred payment sales         | Effective 1 January 2019; supersedes FAS 2 and FAS 20                                                                          | Researched                                                                       |
| FAS 30, Impairment, Credit Losses and Onerous Commitments | Effective 1 January 2021; replaces FAS 11 (with FAS 35); used for the credit-loss note in the murabaha flow                    | Researched                                                                       |
| FAS 32, Ijarah                                            | Effective 1 January 2021; supersedes FAS 8                                                                                     | Researched                                                                       |
| FAS 39, Financial Reporting for Zakah                     | Effective 1 January 2023; supersedes FAS 9                                                                                     | Researched                                                                       |
| FAS 45, Quasi-Equity (including Investment Accounts)      | Effective 1 January 2026                                                                                                       | Researched                                                                       |
| FAS 46 and FAS 47                                         | Effective 1 January 2026; confirm the titles                                                                                   | Researched; confirm the titles                                                   |
| FAS 3 and FAS 4, then FAS 51 Participatory Ventures       | FAS 3 and FAS 4 stay in force until FAS 51 (issued 10 November 2025) takes effect on 1 January 2027                            | Researched; confirm both dates                                                   |
| FAS 7 and FAS 10, then FAS 52 Deferred Delivery Sales     | FAS 7 and FAS 10 stay in force until FAS 52 (issued 31 December 2025) takes effect on 1 January 2027                           | Researched; confirm both dates                                                   |
| FAS 53, Istisna-Based Development Contracts               | Issued 2026; effective date and what it replaces were not found in a public source                                             | To verify; teach only as "issued; check its effective date before relying on it" |

FAS 51 and FAS 52 are not yet in force on 2026-10-09. A course that cites them says "issued ... and effective
1 January 2027", keeps the in-force standard in the worked example unless the lesson is about the transition, and
names the standards they replace as history. FAS 3, 4, 7, and 10 are therefore not "superseded" today (plan 06's
superseded list does not contain them); a course must not call them superseded before 1 January 2027.

### AAOIFI Sharia Standards

SS 8 Murabahah, SS 9 Ijarah and Ijarah Muntahia Bittamleek, SS 10 Salam, SS 11 Istisna'a, SS 12 Sharikah, SS 13
Mudarabah, SS 17 Investment Sukuk, SS 30 Monetization (Tawarruq), SS 35 Zakah, SS 46 Al-Wakalah Bi
Al-Istithmar, SS 59 Sale of Debt, and SS 60 Waqf. State: **Researched**; Phase 1 confirms the title of every
standard a course cites. The draft SS 62 (Sukuk) is not a final standard; no ERP course cites it as one.

### Other Bodies

| Body and document                                                                                                                                                                                      | Used for                                                               | State                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| IIFA Resolutions 40 and 41, <https://iifa-aifi.org/en/32332.html>                                                                                                                                      | The promise (wa'd) and the purchase-orderer sale                       | Page verified 2026-10-09 to be an IIFA page; text read in Phase 1                                             |
| IIFA Resolution 179, <https://iifa-aifi.org/en/32987.html>                                                                                                                                             | Tawarruq, classical and organized                                      | Page verified 2026-10-09 to be an IIFA page; text read in Phase 1                                             |
| DSN-MUI fatwas on murabahah, ijarah, mudharabah, musyarakah, wakalah, salam, and istishna'                                                                                                             | The Indonesian positions on the same contracts                         | To verify: number, year, and title each (only 41/2004 is confirmed on OJK); until then cite by body and title |
| MUI Fatwa 3 of 2003, zakat on income                                                                                                                                                                   | Zakat on earned income                                                 | Researched                                                                                                    |
| PMA 52 of 2014 (Articles 11 to 13) and PMA 31 of 2019                                                                                                                                                  | Business zakat base and income zakat; payment through an official amil | Researched; read the articles in Phase 1                                                                      |
| BAZNAS guidance: 85 g of gold, rate 2.5% by Hijri year or 2.575% by Gregorian year; SK 15 of 2026, income nisab Rp 91,681,728 per year at 14-carat gold                                                | Rate and nisab inputs for the zakat module                             | Researched; the corporate page says "emas murni", the SK says 14-carat: present both                          |
| Indonesian Sharia accounting standards (PSAK Syariah) renumbered 401 to 412 and 459 from 1 January 2024; the old zakat standard PSAK 109 is now PSAK 409 and the new PSAK 109 is the IFRS 9 equivalent | Mapping the AAOIFI treatment to Indonesian reporting                   | Researched                                                                                                    |
| Bank Negara Malaysia Sharia policy documents (murabahah 2013, ijarah 2016, musyarakah and mudarabah 2015, wakalah 2016, tawarruq 2018, istisna' 2016, wa'd 2017)                                       | The Malaysian positions where the courses compare jurisdictions        | Researched                                                                                                    |

The Gregorian-year rate is 2.5% scaled by the ratio of the solar to the lunar year: 2.5 × 365 / 354 = 2.5777%,
and BAZNAS publishes 2.575%. The zakat course shows the arithmetic and treats the rate as configuration (SC8);
where the published figure differs from the arithmetic, the course reports both with their sources.

## Difference Rows (Seed List)

These are the topics where sources are known to differ. They are seeds: Phase 1 and the maker open the primary
documents, and a row enters a course table only when every cell names a source (SC1, SC2). The "system
implication" column is what the course shows as configurable, never a conclusion about which position is right.

| Topic                                  | Documents to compare                                                                                                                   | System implication (shown as configuration)                                         | Seed state                                           |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Binding promise (wa'd) before the sale | IIFA Resolutions 40 and 41; AAOIFI SS 8; the DSN-MUI murabahah fatwa                                                                   | A `promise_binding` policy value and the point at which the sale may be concluded   | Documents to open                                    |
| Organized tawarruq                     | IIFA Resolution 179; AAOIFI SS 30                                                                                                      | A product flag that a board may disable, with the audit trail of each tawarruq step | Documents to open                                    |
| Deduction of debt in the zakat base    | AAOIFI SS 35 and FAS 39, and the Indonesian regulations                                                                                | A per-profile switch for debt deduction                                             | **Omitted:** the sources conflict; no per-school row |
| Zakat rate by calendar                 | BAZNAS guidance (2.5% Hijri, 2.575% Gregorian) and the arithmetic above                                                                | A `year_basis` policy value (Hijri or Gregorian) that selects the rate              | Documents to open                                    |
| Nisab pricing basis                    | BAZNAS SK 15 of 2026 (14-carat) against the BAZNAS corporate page (pure gold)                                                          | A `nisab_basis` value that names purity and price source                            | Documents to open                                    |
| Payment route for the amil share       | PMA 52 of 2014 and PMA 31 of 2019; AAOIFI SS 35                                                                                        | A payee type per profile (authority, licensed institution, direct)                  | Documents to open                                    |
| Zakat base                             | AAOIFI FAS 39 (net assets or net invested funds, to verify) and PMA 52 of 2014 Article 12 (current assets less short-term liabilities) | A `zakat_base` value with both calculations implemented                             | Documents to open                                    |

The table the reader sees in a course has three columns at most: topic, "what each named document states" with
its identifier, and "where it shows up in the system". It never has a "correct position" column.

## AAOIFI URL Register

Rule SC7, applied to every AAOIFI URL: a person opens each URL in a normal browser, confirms that it shows an
AAOIFI standard and not unrelated content (`aaoifi.com` returned an unrelated gambling page to a web fetch on
2026-10-09, for every URL tried; `cis.aaoifi.com` returned genuine AAOIFI pages; the cause was not found), and
ticks the box. Until a box is ticked, the course names the standard by number and title and does not link it. The
`/ar/` path on `cis.aaoifi.com` may serve the Arabic site; when ticking, pick the English page for the same
standard (plan 06's register uses `/ru/` paths for some) and replace the candidate URL with the page that was
actually opened. Phase 7 holds the `[HUMAN]` step; the PR is not marked ready while any box that a course links is
unticked, and a candidate that no course links needs no tick.

- [ ] `https://cis.aaoifi.com/ar/?p=381` (candidate; the master listing; purpose to confirm when opened)
- [ ] `https://cis.aaoifi.com/ar/?p=1633` (FAS 28, Murabaha and other deferred payment sales)
- [ ] `https://cis.aaoifi.com/ar/?p=1636` (FAS 32, Ijarah)
- [ ] `https://cis.aaoifi.com/ar/?p=1655` (FAS 51, participatory ventures)
- [ ] `https://cis.aaoifi.com/standards/fas-52-deferred-delivery-sales/` (FAS 52, deferred delivery sales)
- [ ] `https://cis.aaoifi.com/ar/?p=1643` (FAS 39, financial reporting for Zakah)
- [ ] `https://cis.aaoifi.com/ar/?p=1649` (FAS 45, quasi-equity)
- [ ] `https://cis.aaoifi.com/ar/?p=1624` (FAS 1, general presentation)
- [ ] `https://cis.aaoifi.com/ar/?p=1634` (FAS 30, impairment and credit losses)

During execution, add one line per extra AAOIFI URL a course links, in the same form, before the course's Sharia
checks pass. Check SH3 compares this register with the course text. After the human ticks, the executor adds
each ticked URL to the list of checked links that the gated scenario reads (the shared Sharia test list plan 06
created; Phase 0 records its path), so the gate and the register stay equal.

## Course Checks

Each Sharia course runs these four checks after the harness pre-check and before the mode gate, so the gates
judge text that already meets the rules. A failed check is fixed by the maker inside the same cycle; it does not
consume a gate cycle.

| #   | Check                  | What to do                                                                                                                                                                        | Pass condition                                                                                                                                                                                                                      |
| --- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SH1 | Callouts and the limit | Count the board-decision callouts with command 1 and the disclaimer with command 2; compare the callouts with the table below                                                     | At least one callout per decision point in the table below and at least four in all, each in the lesson where it first matters; every callout is `type="warning"`; the disclaimer appears once in the root `overview.md`            |
| SH2 | No ruling language     | Run command 3; read the surrounding sentence of every hit; also read for the same meaning in other words ("allowed", "not allowed", "Sharia-compliant" in the course's own voice) | No hit remains, or every hit is an attributed statement that names the document and states what it says                                                                                                                             |
| SH3 | Sources and currency   | List every standard, resolution, fatwa, and regulation the course names; compare each with the register; run commands 4 and 5                                                     | Every named item is in the register with its state; every AAOIFI URL is in the URL register; superseded standards appear only in "replaced" or "superseded" sentences; FAS 51 and FAS 52 appear as issued with their effective date |
| SH4 | Difference rows        | For each table headed "differences", open each cited document and read the cited passage                                                                                          | Every cell names a document and states what it says; no row mixes in a conclusion; a conflicting row is absent; the course has at least one such table                                                                              |

Commands, run from the execution worktree root with `<dir>` the course folder:

```bash
# 1. Board-decision callouts (count per file)
grep -rc "Sharia board decision needed" <dir>

# 2. The disclaimer sentence (exactly one hit in the root overview.md)
grep -rn "does not issue Sharia rulings" <dir>

# 3. Ruling-language assist (a starting point, not a complete scan)
grep -rn -i -E "(is|are) (permissible|impermissible|prohibited|forbidden|halal|haram|lawful|unlawful|valid|invalid)" <dir>

# 4. Every AAOIFI URL the course links (each must be in the register)
grep -rn "aaoifi.com" <dir>

# 5. Standards that plan 06's list treats as superseded on 2026-10-09 (each hit must sit in a "replaced" or "superseded"
#    sentence). Phase 0 replaces the numbers with the list that plan 06 merged in its step file.
grep -rn -E "FAS (2|8|9|11|16|18|20|22|25|27)\b" <dir>
```

### Decision Points Per Course

The specification of each course lists the points below. The course flags every one.

| Course                                     | Decision points the course must flag                                                                                                                                                                                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sharia-compliant-erp-design`              | whether a given contract structure is permissible at all; which standards set and which edition applies to a product in a jurisdiction; treatment of late-payment charges and income the board considers non-permissible; any change to a policy profile after go-live                                        |
| `islamic-contract-based-transaction-flows` | how binding a promise (wa'd) may be and when the sale may be concluded; whether a tawarruq structure, classical or organized, is acceptable to the board; ownership-transfer variants in a lease; parallel Salam or Istisna' contracts and guarantee terms; any late-payment charge and where the proceeds go |
| `zakat-and-sharia-compliance-modules`      | the choice of zakat base method (net assets or net invested funds); the nisab pricing basis (which gold purity and which price source); whether a given income is zakatable and how non-permissible income is handled; which authority or amil receives payment in the jurisdiction                           |

## ERP Gate Scenarios

`erp-course-completion.feature` (see [the Gherkin in the PRD](../prd.md#part-a-specs-bound-gherkin)) repeats
plan 06's content-shape checks for the 30 ERP courses. Its Sharia scenarios apply SC4 to SC7 to the three Sharia
ERP courses, with the same shared lists:

| Scenario                                                                       | What it reads                                                                                                   | Rule     |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | -------- |
| Every Sharia ERP course states its limit and flags board decisions in one form | The root `overview.md` sentence; at least four callouts; each callout is the warning type; the drilling section | SC4, SC5 |
| Sharia ERP courses name superseded AAOIFI standards only as history            | Each paragraph that names a standard on plan 06's superseded list also says it was replaced or superseded       | SC6      |
| Every AAOIFI link in a Sharia ERP course was checked by a person               | Each link whose host is `aaoifi.com` or ends in `.aaoifi.com` appears in the checked-links list                 | SC7      |

## Fatwa and Standard Citations in Text

A citation in a lesson has three parts: the body, the document identifier, and a short statement of what the
document says, in the course's plain words. The `## References` section lists the full title, issuer,
identifier, and (when verified) the link, with the access date. Examples of acceptable and unacceptable wording:

| Acceptable                                                                                                 | Not acceptable                                       |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| "AAOIFI FAS 28 specifies how a Murabaha asset is recognized and measured."                                 | "Murabaha is Sharia-compliant if you follow FAS 28." |
| "IIFA Resolution 179 addresses organized tawarruq; the lesson shows where a product flag would sit."       | "Organized tawarruq is not allowed."                 |
| "The board decides whether the late-payment charge is accepted; the system routes the proceeds by policy." | "Late-payment charges must be given to charity."     |
