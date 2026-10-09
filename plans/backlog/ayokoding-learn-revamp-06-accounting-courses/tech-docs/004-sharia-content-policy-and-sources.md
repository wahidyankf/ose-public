# 004 — Sharia Content Policy and Sources

Five courses (positions 20–24) teach accounting for Islamic finance. A reader may use them to build
systems that real institutions rely on, and Islamic finance has real differences of opinion between
scholars, schools of law (madhhab), and national authorities. This page sets the rules those courses
follow, the sources they may cite, and the checks a human must do before merge.

## The Decision Behind the Rules

Series decision 19 (user, restated here on 2026-10-09): Sharia sources cite AAOIFI and recognised
fatwa bodies such as DSN-MUI, show madhhab and jurisdiction differences, never issue rulings, and flag
the points that need a Sharia board decision.

## The Rules

The rules get a durable home in this PR (see [010](./010-rule-and-docs-impact.md)), so plan 07's
Sharia ERP courses and any later Sharia content follow the same text.

| Id  | Rule                                                                                                                                                                                                                                                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SC1 | **Attribute every position.** Each Sharia position names the body or scholar, the document (standard, fatwa, or policy number), and its date, and links or cites a source with an access date.                                                                                               |
| SC2 | **Show differences.** Where recognised bodies, schools, or jurisdictions differ, present each position, attributed, side by side (a table where there are more than two). Never present one as the only valid view.                                                                          |
| SC3 | **Issue no rulings.** Course text never gives its own Sharia verdict. Words that carry a verdict (permissible, impermissible, valid, invalid, compliant, non-compliant, halal, haram) appear only attributed to a named source ("AAOIFI SS 8 requires …", "DSN-MUI fatwa 04/2000 states …"). |
| SC4 | **Flag board decisions.** Every point where an institution must choose between positions, or where the answer depends on facts a course cannot know, uses the board-decision callout below. The callout is used for nothing else, and two never sit next to each other.                      |
| SC5 | **State the limit once per course.** Each Sharia course's `overview.md` contains the disclaimer sentence below, word for word.                                                                                                                                                               |
| SC6 | **Teach the standard in force, with dates.** Cite the standard in force on the access date; name a superseded standard only as history; teach a standard that is issued but not yet effective with its effective date, side by side with the one it replaces.                                |
| SC7 | **Verify AAOIFI links by hand.** Link an `aaoifi.com` page only after a human has opened it in a browser and confirmed it is the AAOIFI page; otherwise cite the `cis.aaoifi.com` equivalent, or name the standard without a link.                                                           |
| SC8 | **Make jurisdiction values configuration.** Zakah rates, nisab, calendar, method, and authority-specific thresholds are configuration with a source and a date, never constants in code.                                                                                                     |

### The Board-Decision Callout

Exactly this shape, so readers learn to recognise it and the content-shape test can find it:

```markdown
{{< callout type="warning" >}}
**Sharia board decision needed.** Whether zakah is computed over a Hijri year or a Gregorian year.
BAZNAS gives a rate of 2.5% for a Hijri year or 2.575% for a Gregorian year; Indonesia's PMA 52/2014
states 2.5%. This course does not choose; your institution's Sharia board does.
{{< /callout >}}
```

- The body starts with the bold label `**Sharia board decision needed.**`.
- Then one sentence naming the decision, then the attributed positions, then the closing sentence
  "This course does not choose; your institution's Sharia board does."
- The `warning` type renders the site's warning alert (honey colours, a warning icon). Why this form
  was chosen over two alternatives is in [../prd.md](../prd.md#ui-design-funnel).
- The facts in the example come from the [Source Register](#source-register) (BAZNAS corporate zakat
  page and PMA 52/2014 Pasal 11). Each fact in a real callout follows SC1, and the maker verifies each
  fatwa number and date before use (see [Facts the Maker Must Verify](#facts-the-maker-must-verify)).

### The Disclaimer Sentence

> This course explains standards and design choices; it does not issue Sharia rulings.

It appears once, in the course's `overview.md`, in the first section, followed by one sentence naming
who decides in practice: "Where a choice needs a ruling, the course marks it as a decision for your
institution's Sharia board."

## Source Hierarchy

| Tier | Kind                                                            | Examples                                                                                                                                                      | Use                                                                                    |
| ---- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1    | The standard setter's or authority's own publication            | AAOIFI (through `cis.aaoifi.com`, or `aaoifi.com` after a human check), IAI's SAK documents, Bank Negara Malaysia, DSN-MUI and OJK, `peraturan.go.id`, BAZNAS | Any fact: numbers, titles, dates, rates                                                |
| 2    | Another regulator's or standard setter's summary                | IFRS Foundation staff papers that discuss AAOIFI standards                                                                                                    | Context and comparisons                                                                |
| 3    | Professional firms and peer-reviewed or university publications | Big-4 publications, university journals                                                                                                                       | Context; a number or date only when tier 1 is unavailable, and then stated as reported |
| 4    | News, community mirrors, and blogs                              | A fatwa list on a community site                                                                                                                              | Only to find a tier 1 source; never the only source for a number, title, or date       |

AAOIFI standard texts are for members only. The courses therefore cite standard numbers, titles,
effective dates, and what each replaces, all from public AAOIFI pages, and explain the accounting
idea in their own words. They never quote paragraphs they could not read.

## Source Register

Accessed 2026-10-09 during planning. The maker re-checks each entry when it writes the lesson that
uses it, records the new access date in the course's References section, and treats any change as a
content fact to correct, never as something to hide.

### AAOIFI Financial Accounting Standards

Master listing: <https://cis.aaoifi.com/ar/?p=381> (shows the month and year per standard and a
"Superseded" flag; the listing date is not always the effective date).

| Topic                         | Standard in force on 2026-10-09                                                  | Effective                      | Replaces                     | Source (excerpt or fact)                                                                                                                    |
| ----------------------------- | -------------------------------------------------------------------------------- | ------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Presentation                  | FAS 1 (revised) General Presentation and Disclosures                             | 1 January 2024                 | FAS 1 (2008), FAS 16, FAS 22 | <https://cis.aaoifi.com/ru/?p=1624>; AAOIFI deferred it from 2023 to 2024; the cis page still shows 2023 (teach 2024, note the stale field) |
| Murabaha                      | FAS 28 Murabaha and Other Deferred Payment Sales                                 | 1 January 2019                 | FAS 2, FAS 20                | <https://cis.aaoifi.com/ru/?p=1633>                                                                                                         |
| Impairment                    | FAS 30 Impairment, Credit Losses and Onerous Commitments                         | 1 January 2021                 | FAS 11 (with FAS 35)         | <https://cis.aaoifi.com/?p=1634>                                                                                                            |
| Investment agency             | FAS 31 Investment Agency (Al-Wakala Bi Al-Istithmar)                             | listed January 2021            | —                            | Master listing                                                                                                                              |
| Ijarah                        | FAS 32 Ijarah                                                                    | 1 January 2021                 | FAS 8                        | <https://cis.aaoifi.com/ar/?p=1636>                                                                                                         |
| Sukuk and shares (investor)   | FAS 33 Investments in Sukuk, Shares and Similar Instruments                      | 1 January 2021                 | FAS 25                       | <https://cis.aaoifi.com/ar/standards/fas-33-investments-in-sukuk-shares-and-similar-instruments/>                                           |
| Sukuk holders                 | FAS 34 Financial Reporting for Sukuk-holders                                     | listed January 2021            | —                            | Master listing                                                                                                                              |
| Risk reserves                 | FAS 35 Risk Reserves                                                             | 1 January 2021                 | FAS 11 (with FAS 30)         | Master listing                                                                                                                              |
| Wa'd, khiyar, tahawwut        | FAS 38                                                                           | 1 January 2022                 | —                            | Master listing                                                                                                                              |
| Zakah                         | FAS 39 Financial Reporting for Zakah                                             | 1 January 2023                 | FAS 9                        | <https://cis.aaoifi.com/ru/?p=1643>                                                                                                         |
| Islamic finance windows       | FAS 40                                                                           | 1 January 2024                 | FAS 18                       | Master listing                                                                                                                              |
| Quasi-equity                  | FAS 45 Quasi-Equity (including Investment Accounts); FAS 46, FAS 47              | 1 January 2026                 | FAS 27 (per AAOIFI notice)   | <https://cis.aaoifi.com/ru/?p=1649>                                                                                                         |
| Mudaraba and musharaka        | FAS 3 and FAS 4 now; **FAS 51 Participatory Ventures** issued 10 November 2025   | FAS 51 from **1 January 2027** | FAS 3, FAS 4                 | <https://cis.aaoifi.com/ar/?p=1655>; AAOIFI press release (aaoifi.com, needs the human check)                                               |
| Salam and istisna             | FAS 7 and FAS 10 now; **FAS 52 Deferred Delivery Sales** issued 31 December 2025 | FAS 52 from **1 January 2027** | FAS 7, FAS 10                | <https://cis.aaoifi.com/standards/fas-52-deferred-delivery-sales/>                                                                          |
| Istisna development contracts | FAS 53 Istisna-Based Development Contracts (issued 2026)                         | not found in a public source   | not confirmed                | Taught only as "issued; check its effective date before relying on it"                                                                      |

### AAOIFI Sharia Standards

From the master listing; no listed Sharia Standard is flagged superseded. SS 8 Murabahah (May 2000),
SS 9 Ijarah and Ijarah Muntahia Bittamleek (May 2000), SS 10 Salam (May 2001), SS 11 Istisna'a (May
2001), SS 12 Sharikah (May 2002), SS 13 Mudarabah (May 2002), SS 17 Investment Sukuk (May 2003), SS 30
Monetization (Tawarruq) (November 2006), SS 35 Zakah (November 2008), SS 46 Al-Wakalah Bi Al-Istithmar
(May 2011), SS 59 Sale of Debt (December 2018), SS 60 Waqf (March 2019). **Draft SS 62 (Sukuk) is not
final**: AAOIFI said in April 2025 it was still a draft, and later reports describe it as on hold. The
sukuk course teaches it only as a pending draft.

### Indonesia

| Item                      | Fact                                                                                                                                                                                                                                                                                                      | Source                                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| PSAK renumbering          | From 1 January 2024 the Sharia PSAK are 401–412 and 459 (401 presentation, 402 murabahah, 403 salam, 404 istishna', 405 mudharabah, 406 musyarakah, 407 ijarah, 408 asuransi syariah, 409 zakat and infak/sedekah, 410 sukuk, 411 wa'd, 412 wakaf, 459 perbankan syariah); numbers changed, not substance | <https://web.iaiglobal.or.id/assets/files/file_publikasi/Perubahan_Penomoran_PSAK_ISAK_dalam_SAK_Indonesia.pdf>      |
| Number collision          | The old Sharia "PSAK 109" (zakat) is now PSAK 409; the new PSAK 109 is the IFRS 9 equivalent                                                                                                                                                                                                              | Same                                                                                                                 |
| New PSAK 401              | Penyajian dan Pengungkapan dalam Laporan Keuangan Syariah, approved 21 October 2025, effective 1 January 2027                                                                                                                                                                                             | <https://web.iaiglobal.or.id/assets/files/file_sak/DSAS%20Terkini%20XXI%20Des%202025.pdf>                            |
| PSAK 413                  | Impairment of Sharia financial assets, effective 1 January 2027 (secondary source; the maker confirms on SAK Online or an IAI page before use)                                                                                                                                                            | <https://news.ddtc.co.id/berita/nasional/1805778/berlaku-efektif-2027-psak-413-atur-penurunan-aset-keuangan-syariah> |
| Business zakat base       | PMA 52/2014 Pasal 12: "Aktiva Lancar dikurangi Kewajiban Jangka Pendek" at the haul date; Pasal 11: nisab 85 g gold, rate 2.5%; Pasal 13: paid through an official amil                                                                                                                                   | <https://peraturan.go.id/files/bn1830-2014.pdf>                                                                      |
| Income zakat nisab        | PMA 31/2019 sets income and services nisab at 85 g gold, rate 2.5%, citing MUI fatwa 3/2003                                                                                                                                                                                                               | <https://peraturan.go.id/files/bn1503-2019.pdf>                                                                      |
| BAZNAS corporate guidance | "85 gram emas murni"; "2,5% berdasarkan penanggalan hijriah atau 2,575% berdasarkan penanggalan masehi"                                                                                                                                                                                                   | <https://baznas.go.id/zakatperusahaan>                                                                               |
| BAZNAS 2026 income nisab  | SK Ketua BAZNAS 15/2026: Rp 91,681,728 per year, priced at 14-carat gold (differs from the corporate page's "emas murni"; present both)                                                                                                                                                                   | <https://baznas.go.id/index.php/zakatpenghasilan>                                                                    |
| DSN-MUI fatwas            | Numbers such as 04/2000 (murabahah), 07/2000 (mudharabah), 08/2000 (musyarakah), 09/2000 (ijarah), 111–115/2017; only 41/2004 confirmed on OJK                                                                                                                                                            | <https://ojk.go.id/id/kanal/syariah/regulasi/fatwa-dsn-mui/Pages/fatwa-nomor-41-dsn-mui-iii-2004.aspx>               |

### Malaysia

Bank Negara Malaysia Sharia policy documents, from <https://www.bnm.gov.my/banking-islamic-banking>:
Murabahah (23 December 2013), Ijarah (19 August 2016), Musyarakah and Mudarabah (20 April 2015),
Wakalah (27 June 2016), Tawarruq (28 December 2018), Istisna' (7 January 2016), Wa'd (2 February 2017),
Islamic Banking Window (11 November 2024), Shariah Governance (20 September 2019). Sukuk in Malaysia
is a Securities Commission matter, not a BNM policy document.

### Zakah Rate Arithmetic

The solar-year rate scales 2.5% by the ratio of the solar to the lunar year. With 365 and 354 days it is
2.5 × 365 / 354 = 2.5777%; with 365.2422 and 354.3671 it is 2.5767%. Published figures of 2.575%
(BAZNAS), about 2.577%, and 2.5775% are roundings of the same idea. The zakah course shows the
arithmetic and treats the rate as configuration (SC8).

## Facts the Maker Must Verify

These were found only in secondary sources or not found at all on 2026-10-09. The maker checks each
before writing it; if the check fails, the lesson states the uncertainty or leaves the fact out.

1. Every DSN-MUI fatwa number and date except 41/2004, against the DSN-MUI or OJK PDF. For ijarah,
   use 09/DSN-MUI/IV/2000 unless the primary PDF shows otherwise.
2. FAS 53's effective date and what it replaces.
3. FAS 31 and FAS 34 effective dates (only listing months were found).
4. Whether FAS 39 keeps both the net-assets and net-invested-funds methods.
5. Any AAOIFI nisab statement (none found).
6. PSAK 408's final status and PSAK 413's details on an IAI page.
7. Whether an IDX taxonomy newer than IDX Taxonomy 2020 exists.

## AAOIFI URL Register

A web fetch of `aaoifi.com` on 2026-10-09 returned an unrelated gambling page instead of AAOIFI's site,
for every URL tried; `cis.aaoifi.com` returned genuine AAOIFI pages. The cause was not found. Because
a reader could land on a harmful page, every AAOIFI URL in the shipped courses needs a human check.

- During the batches, makers cite `cis.aaoifi.com` pages, or name the standard without a link. A maker
  that needs an `aaoifi.com` page (for example, the FAS 51 press release) adds the URL to the register
  as "proposed" and does not link it yet.
- The executor writes `evidence/aaoifi-url-register.md` in this plan folder: one row per distinct
  AAOIFI URL (any host ending in `aaoifi.com`, `cis.aaoifi.com` included) used or proposed in any of
  the 24 courses, with the course and file, and a `[HUMAN]` checkbox per row.
- At the human stop after the batches, a person opens each URL in a normal browser and ticks its row
  only when the page is AAOIFI's and says what the course claims. The one `[HUMAN]` item in
  [../delivery.md](../delivery.md) is ticked only when every row is ticked or resolved.
- A URL that fails is replaced by its `cis.aaoifi.com` equivalent (which then needs its own check), or
  the link is removed and the standard is named without a link, in the same PR. The register records
  the outcome.
- The checked URLs go into the content-shape test's verified list, so a later unchecked AAOIFI link
  fails the test ([010](./010-rule-and-docs-impact.md#how-the-gated-rules-are-checked)).

## Where the Rules Apply in Each Course

Each Sharia course brief in [../syllabus/courses/](../syllabus/courses/README.md) lists its own
board-decision points and the differences it must show. The minimum per course is four
board-decision callouts and one differences table, and its drilling page has a "Sharia board decision
spotting" section with at least six scenarios.
