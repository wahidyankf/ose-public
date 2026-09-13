# Cognitive Walkthrough Transcripts

**Evaluation date**: 2026-06-19
**Evaluator stance**: spec-blind first-timer
**Plan**: `plans/in-progress/ayokoding-www-calc-usability-findings/`
**Method**: Nielsen-Norman Group Cognitive Walkthrough (four questions per step)

The four questions asked at every step:

- **Q1** Will the user try to achieve the right result? (Do they understand what to do?)
- **Q2** Will the user notice the correct action is available? (Is it visible/findable?)
- **Q3** Will the user associate the correct action with the desired result? (Do labels/affordances read correctly?)
- **Q4** After acting, will the user see that progress was made toward the goal?

Verdict: **Pass** | **Friction → [finding ID]** | **Fail**

---

## Task 1 — Orient to the page: understand what this tool does

**Persona**: First-time English visitor (desktop 1280 px)
**Goal**: Understand the tool's purpose and tab structure in under 10 seconds

### Step 1.1 — Land on the URL `/en/tools/cost-of-living-calculator`

| Q   | Answer                                                                                                                                                                                                    | Verdict            |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Q1  | User clicked a link / typed the URL expecting a cost-of-living tool.                                                                                                                                      | Pass               |
| Q2  | The page loads at a cost-of-living topic — tab label says "Cost of living" (active).                                                                                                                      | Pass               |
| Q3  | The URL slug says "cost-of-living-calculator" but the H1 says "Salary Savings Calculator". The browser tab says "AyoKoding" (no tool name). The user cannot immediately confirm they have the right page. | Friction → UWT-002 |
| Q4  | No confirmation: the page title does not include the tool name; the H1 contradicts the URL.                                                                                                               | Friction → UWT-002 |

### Step 1.2 — Scan the three tabs

| Q   | Answer                                                                                                                                                                                                                           | Verdict            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Q1  | User wants to understand what each tab offers.                                                                                                                                                                                   | Pass               |
| Q2  | Three tabs are visible immediately: "Cost of living", "Savings", "Minimum role".                                                                                                                                                 | Pass               |
| Q3  | "Cost of living" — self-evident. "Savings" — ambiguous at this point (savings compared to what?). "Minimum role" — opaque; "minimum role" for what purpose? A user unfamiliar with the domain cannot predict this tab's content. | Friction → UWT-007 |
| Q4  | Clicking the active tab ("Cost of living") does nothing (already selected). Clicking "Savings" or "Minimum role" — no preview, no tooltip, no description. User must click to discover content.                                  | Friction → UWT-007 |

### Step 1.3 — Read the summary card and table

| Q   | Answer                                                                                                                                                                                                      | Verdict            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Q1  | User scans the data to understand what a "cost of living" estimate looks like.                                                                                                                              | Pass               |
| Q2  | Singapore summary card is immediately visible. "Total SGD 4,328" is readable.                                                                                                                               | Pass               |
| Q3  | The summary card says "Total SGD 4,328". The table below shows "Essentials: 4,328" and "Total: 4,578" for Singapore. These two different numbers both called "Total" for the same city confuse orientation. | Friction → UWT-004 |
| Q4  | User cannot tell which "Total" to use for planning purposes. Trust is undermined.                                                                                                                           | Friction → UWT-004 |

**Task 1 outcome**: Partial pass. The page is broadly understood as a cost-of-living tool within
a few seconds, but the H1/URL mismatch and the "Total" discrepancy prevent confident orientation.

---

## Task 2 — Filter by region/country/city and read the cost estimate

**Persona**: First-time English visitor (desktop 1280 px)
**Goal**: Find the cost of living in Berlin, Germany

### Step 2.1 — Select Region "Europe"

| Q   | Answer                                                                                              | Verdict |
| --- | --------------------------------------------------------------------------------------------------- | ------- |
| Q1  | User recognises "Region" filter as the way to narrow by geography.                                  | Pass    |
| Q2  | "Region" label and select dropdown are visible above the table.                                     | Pass    |
| Q3  | Selecting "Europe" from the dropdown — clear and expected pattern.                                  | Pass    |
| Q4  | Country dropdown immediately narrows to European countries. Filter cascade works and is observable. | Pass    |

### Step 2.2 — Select Country "Germany"

| Q   | Answer                                                                                              | Verdict |
| --- | --------------------------------------------------------------------------------------------------- | ------- |
| Q1  | User finds "Germany" in the Country list.                                                           | Pass    |
| Q2  | Country dropdown is visible and Germany appears after Europe is selected.                           | Pass    |
| Q3  | "Germany" is a plain country name — no label confusion.                                             | Pass    |
| Q4  | City dropdown narrows to "Berlin" (the only German city). Summary card updates to show Berlin data. | Pass    |

### Step 2.3 — Read the cost estimate for Berlin

| Q   | Answer                                                                                                                                                     | Verdict            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Q1  | User wants to read Berlin's costs.                                                                                                                         | Pass               |
| Q2  | Summary card updates visibly. Table row for Berlin is visible.                                                                                             | Pass               |
| Q3  | Summary card shows "Housing €1,500, Food €400…" (currency shown). Table shows "1,500, 400, 86…" (no currency). Is the table in euros? The user must infer. | Friction → UWT-005 |
| Q4  | User sees numbers but cannot confirm they are in euros without external knowledge.                                                                         | Friction → UWT-005 |

### Step 2.4 — Toggle to "Rural" area

| Q   | Answer                                                                                                                                                                | Verdict            |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Q1  | User notices "City center / Rural" toggle and wants to compare.                                                                                                       | Pass               |
| Q2  | Buttons are visible, labelled.                                                                                                                                        | Pass               |
| Q3  | Clicking "Rural" — the button gains a background colour. "City center" does not visually change to "inactive" style. No `aria-pressed` attribute.                     | Friction → UWT-010 |
| Q4  | Summary card updates housing values (confirmed Rural effect). But the toggle selected-state feedback is weak — the user is not confidently told which mode is active. | Friction → UWT-010 |

### Step 2.5 — Copy the URL to share the Berlin view

| Q   | Answer                                                                                                | Verdict            |
| --- | ----------------------------------------------------------------------------------------------------- | ------------------ |
| Q1  | User copies the URL in the address bar to share Berlin / Europe filter state.                         | Pass               |
| Q2  | The URL updates to `?tab=cost&country=de` when a country link is clicked.                             | Pass               |
| Q3  | User expects the URL state to restore the filter on next visit.                                       | Pass               |
| Q4  | Opening the URL in a new tab — Country dropdown shows "All countries", not Germany. User is confused. | Friction → UWT-003 |

**Task 2 outcome**: Partial pass. The filter cascade works well. Friction at: table number currency (UWT-005), area toggle state feedback (UWT-010), and URL state non-restoration (UWT-003).

---

## Task 3 — Enter a salary in the Savings tab and interpret the comparison

**Persona**: First-time English visitor (desktop 1280 px)
**Goal**: See which city offers the best savings on a $5,000/month gross salary

### Step 3.1 — Find the Savings tab

| Q   | Answer                                                                         | Verdict |
| --- | ------------------------------------------------------------------------------ | ------- |
| Q1  | User wants to input a salary. They look for an input area.                     | Pass    |
| Q2  | "Savings" tab is visible in the tablist.                                       | Pass    |
| Q3  | Tab label "Savings" is reasonably clear for this goal.                         | Pass    |
| Q4  | Clicking "Savings" reveals a salary input immediately at the top of the panel. | Pass    |

### Step 3.2 — Enter salary

| Q   | Answer                                                                                                                      | Verdict |
| --- | --------------------------------------------------------------------------------------------------------------------------- | ------- |
| Q1  | User wants to type their gross monthly salary.                                                                              | Pass    |
| Q2  | Label "Gross monthly salary (before tax) USD" is visible above the input. The currency hint "USD" is embedded in the label. | Pass    |
| Q3  | Label is specific and unambiguous — "before tax", "USD", "monthly". The input is a number field.                            | Pass    |
| Q4  | As user types, "Annual gross: X USD" updates immediately — good real-time feedback.                                         | Pass    |

### Step 3.3 — Interpret the comparison table

| Q   | Answer                                                                                                                                                                                                                                                                     | Verdict                     |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Q1  | User wants to read which cities offer the most savings.                                                                                                                                                                                                                    | Pass                        |
| Q2  | Table appears with columns: Country, City, Net (monthly), Essentials, Savings after essentials, Savings after lifestyle, Typical non-salary comp, Total comp.                                                                                                              | Pass                        |
| Q3  | "Net (monthly)" — what is net of? Not stated. "Savings after lifestyle" — what is "lifestyle"? No definition. The rank direction (`↕` on "Savings after essentials") suggests sortability, but the user cannot tell if the `↕` means sorted, sortable, or two-directional. | Friction → UWT-008, UWT-012 |
| Q4  | Values update after salary entry. No loading indicator, but response is fast (<400 ms).                                                                                                                                                                                    | Pass                        |

### Step 3.4 — Find "Savings after lifestyle"

| Q   | Answer                                                                                                                                                                                                                           | Verdict            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Q1  | User notices "Savings after lifestyle" is smaller than "Savings after essentials" and wants to know the difference.                                                                                                              | Pass               |
| Q2  | Column is visible and the values differ clearly.                                                                                                                                                                                 | Pass               |
| Q3  | "Lifestyle spending" is mentioned in the ranking key note, described as "personal preference variable", but no amount or percentage is given. User cannot determine if the lifestyle deduction is $0, $100, or $1,000 per month. | Friction → UWT-008 |
| Q4  | No feedback. The column value exists but its basis is opaque.                                                                                                                                                                    | Friction → UWT-008 |

**Task 3 outcome**: Partial pass. Salary entry is clear and feedback is good. Friction at: "Net (monthly)" and "Savings after lifestyle" column definitions (UWT-008, UWT-012).

---

## Task 4 — Use the Minimum Role tab to find the minimum role in Singapore

**Persona**: First-time English visitor (desktop 1280 px)
**Goal**: Find the minimum job title needed to save $2,000/month in Singapore

### Step 4.1 — Navigate to the Minimum Role tab

| Q   | Answer                                                                                                                                                                                   | Verdict            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Q1  | User wants to find minimum role requirements. The tab is labelled "Minimum role".                                                                                                        | Pass               |
| Q2  | Tab is visible in tablist.                                                                                                                                                               | Pass               |
| Q3  | "Minimum role" — what is minimum for? Users unfamiliar with this framing may not connect it to "minimum seniority". The tab name does not contain "seniority" or "level" — common terms. | Friction → UWT-007 |
| Q4  | Clicking the tab reveals a table of roles and salary data. User can infer the purpose once they see the table content.                                                                   | Pass               |

### Step 4.2 — Set Baseline Source

| Q   | Answer                                                                                                                                                                                                                                                                        | Verdict            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Q1  | User wants to enter a $2,000/month savings target.                                                                                                                                                                                                                            | Pass               |
| Q2  | "Baseline source" dropdown is the first visible control.                                                                                                                                                                                                                      | Pass               |
| Q3  | "Baseline source" does not tell the user what it controls. The three options ("Monthly savings target", "Reference role", "My salary") are named but not explained. A user who wants to enter a target must guess that "Monthly savings target" is the right baseline source. | Friction → UWT-007 |
| Q4  | After selecting "Monthly savings target", a number input appears. This is correct but the user had to make an uncertain guess to get there.                                                                                                                                   | Friction → UWT-007 |

### Step 4.3 — Enter savings target

| Q   | Answer                                                                           | Verdict |
| --- | -------------------------------------------------------------------------------- | ------- |
| Q1  | User wants to type 2000 in the savings target input.                             | Pass    |
| Q2  | Input is visible after choosing the correct baseline source.                     | Pass    |
| Q3  | Label "Monthly savings target" on the input is clear once it appears.            | Pass    |
| Q4  | Table updates with ranked roles. Rankings appear in descending order of savings. | Pass    |

### Step 4.4 — Find the minimum viable role for Singapore

| Q   | Answer                                                                                                                                            | Verdict                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Q1  | User scans the table for Singapore.                                                                                                               | Pass                                                                                                                  |
| Q2  | "Best city" column shows city names. User can find Singapore rows.                                                                                | Pass                                                                                                                  |
| Q3  | The "P25 / Median / P75" columns are salary percentiles — abbreviation requires prior knowledge. No tooltip defines P25.                          | Friction — minor (not filed as a separate finding; P25/P75 is a standard statistics term but benefits from a tooltip) |
| Q4  | User can read which roles show positive "Essential savings" for Singapore. The ranking key note (bottom of panel) confirms the ranking criterion. | Pass                                                                                                                  |

**Task 4 outcome**: Partial pass. Primary friction at "Baseline source" control label (UWT-007). Once past that blocker, the table is readable.

---

## Task 5 — Switch to Indonesian locale and confirm equivalence

**Persona**: Bahasa Indonesia reader (desktop 1280 px)
**Goal**: Use the calculator in Bahasa Indonesia

### Step 5.1 — Find and use the language switcher

| Q   | Answer                                                                                                                                  | Verdict |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| Q1  | User wants to switch to Indonesian.                                                                                                     | Pass    |
| Q2  | Language switcher button "English" is visible in the top-right header.                                                                  | Pass    |
| Q3  | Clicking "English" reveals a dropdown: "English", "Bahasa Indonesia". Convention-consistent.                                            | Pass    |
| Q4  | After clicking "Bahasa Indonesia", the page reloads at `/id/tools/cost-of-living-calculator` — all visible text is in Bahasa Indonesia. | Pass    |

### Step 5.2 — Verify the page language for assistive technology

| Q   | Answer                                                                                                                                          | Verdict            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Q1  | A screen-reader user expects the page to be announced in Indonesian.                                                                            | Pass               |
| Q2  | Not applicable (non-visual).                                                                                                                    | N/A                |
| Q3  | The `html[lang]` attribute remains `en`. A screen reader will announce the page as English and pronounce Indonesian text with English phonemes. | Friction → UWT-001 |
| Q4  | Screen-reader users receive no feedback that the language changed at the machine level.                                                         | Friction → UWT-001 |

### Step 5.3 — Use the "Biaya hidup" (Cost of Living) tab in Indonesian

| Q   | Answer                                                                                                                                                             | Verdict                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Q1  | User clicks "Biaya hidup" tab.                                                                                                                                     | Pass                                                         |
| Q2  | Tab is clearly labelled in Bahasa Indonesia.                                                                                                                       | Pass                                                         |
| Q3  | Labels in Indonesian match the English pattern. "OOP" remains as the acronym — partially transliterated ("Kesehatan (OOP)") but the abbreviation is still English. | Minor — acceptable for an international medical abbreviation |
| Q4  | Page content is in Indonesian. Filter controls, table, and summary card are all translated.                                                                        | Pass                                                         |

**Task 5 outcome**: Pass for visual users. Fail for screen-reader / AT users — `html[lang]` mismatch (UWT-001).

---

## Task 6 — Mobile task: Filter the calculator on a phone

**Persona**: Mobile user, 375 px, English
**Goal**: Select region "Americas", country "United States", city "New York" and read costs

### Step 6.1 — Land on the page at 375 px

| Q   | Answer                                                                                                                                 | Verdict            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Q1  | User wants to use the calculator on their phone.                                                                                       | Pass               |
| Q2  | H1 and tabs are visible immediately. All three tabs fit in the tablist without overflow (tablist 287 px wide, all three tabs visible). | Pass               |
| Q3  | Same H1/URL mismatch as desktop.                                                                                                       | Friction → UWT-002 |
| Q4  | Visible filter controls below the tabs.                                                                                                | Pass               |

### Step 6.2 — Open the Region dropdown

| Q   | Answer                                                                                               | Verdict            |
| --- | ---------------------------------------------------------------------------------------------------- | ------------------ |
| Q1  | User taps the Region dropdown.                                                                       | Pass               |
| Q2  | Dropdown is visible.                                                                                 | Pass               |
| Q3  | The dropdown is 29 px tall — below the recommended 44 px touch target. User may miss-tap on a phone. | Friction → UWT-006 |
| Q4  | Dropdown opens; options are readable.                                                                | Pass               |

### Step 6.3 — Select Americas → United States → New York

| Q   | Answer                                                                                                           | Verdict |
| --- | ---------------------------------------------------------------------------------------------------------------- | ------- |
| Q1  | User works through the cascade: Americas → US → New York.                                                        | Pass    |
| Q2  | Each subsequent dropdown narrows correctly.                                                                      | Pass    |
| Q3  | The filter cascade behaves correctly. Country narrows to US after Americas. City narrows to available US cities. | Pass    |
| Q4  | Summary card updates to New York data.                                                                           | Pass    |

### Step 6.4 — Read the cost table on mobile

| Q   | Answer                                                                                                                                                                                                                                                                                                                                            | Verdict                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Q1  | User wants to read the comparison table.                                                                                                                                                                                                                                                                                                          | Pass                         |
| Q2  | The cost table is visible (table element, 1 table on mobile).                                                                                                                                                                                                                                                                                     | Pass                         |
| Q3  | Table shows numbers without currency. On mobile at 375 px, the "Healthcare scheme" column provides country context but not currency. "3,500" for Singapore could mislead a user who does not know SGD.                                                                                                                                            | Friction → UWT-005           |
| Q4  | Horizontal scroll is absent (`hasHScroll: false`), suggesting the table fits or is contained. The table has `overflow: auto` on its parent, but at 375 px the container has 0 width — suggesting the table may be hidden inside a card layout or hidden entirely. The cost-tab content on mobile shows the full table text in a collapsed layout. | Pass (functional, but dense) |

**Task 6 outcome**: Partial pass. Friction at: filter touch target size (UWT-006), table currency missing (UWT-005).

---

## Coverage Notes

| Dimension                | Covered in walkthrough | Notes                                                        |
| ------------------------ | ---------------------- | ------------------------------------------------------------ |
| Task 1: Orientation      | Yes — Tasks 1          | H1/URL mismatch, Total discrepancy                           |
| Task 2: Filter + cost    | Yes — Task 2           | Cascade, currency, area toggle, URL sharing                  |
| Task 3: Savings tab      | Yes — Task 3           | Salary entry, column definitions                             |
| Task 4: Minimum role     | Yes — Task 4           | Baseline source jargon                                       |
| Task 5: ID locale        | Yes — Task 5           | `html[lang]` failure, translation coverage                   |
| Task 6: Mobile filter    | Yes — Task 6           | Touch targets, currency context                              |
| First-click fidelity     | Verified               | Tabs and filters are the correct first clicks                |
| Perceived latency        | Measured               | Salary-to-table update < 400 ms — no Doherty-threshold issue |
| Error states             | Not fully exercised    | No invalid number inputs triggered explicit error messages   |
| Keyboard-only navigation | Not exercised          | Deferred to `swe-ui-checker`                                 |

## Method Transparency Note

All findings cite a named principle. No finding is asserted without a deterministic step to
reproduce. The "expected" behaviour in each finding is grounded solely in the named principle
or web convention, not in any spec, source file, or mockup the evaluator read. `spec-gaps.md`
is intentionally absent from this plan (spec-blind methodology; see `README.md`).

```

---

**Summary to orchestrator:**

**Evaluation complete.** 14 findings filed across the five plan documents for `plans/in-progress/ayokoding-www-calc-usability-findings/`.

**Counts by severity:**

| Severity | Count | Finding IDs |
| --- | --- | --- |
| 4 — Usability catastrophe | 1 | UWT-001 |
| 3 — Major usability problem | 6 | UWT-002, UWT-003, UWT-004, UWT-005, UWT-006, UWT-007 |
| 2 — Minor usability problem | 6 | UWT-008, UWT-009, UWT-010, UWT-011, UWT-012, UWT-013 |
| 1 — Cosmetic | 1 | UWT-014 |

**Top friction (most critical):**

1. **UWT-001 (Sev 4 / Critical)** — `html[lang]="en"` on the Indonesian locale page — a WCAG 3.1.1 Level AA failure that breaks screen readers and browser auto-translate for all Bahasa Indonesia readers.
2. **UWT-002 (Sev 3 / High)** — H1 says "Salary Savings Calculator"; URL slug says "cost-of-living-calculator"; browser tab says "AyoKoding" — three-way scent mismatch blocks confident orientation.
3. **UWT-004 (Sev 3 / High)** — Two elements labelled "Total" on the same screen show different values for the same city (SGD 4,328 in summary card vs. 4,578 in comparison table) with no explanation — erodes data trust.
4. **UWT-005 (Sev 3 / High)** — Comparison table rows show bare numbers with no currency unit — 31 cities across 24 currencies are ambiguous without external knowledge.
5. **UWT-006 (Sev 3 / High)** — Primary filter controls are 28–29 px tall on mobile, below the recommended 44 px touch target.
6. **UWT-007 (Sev 3 / High)** — "Minimum role" tab and "Baseline source" control are opaque jargon with no visible explanation.

**Plan path**: `plans/in-progress/ayokoding-www-calc-usability-findings/`

**Not covered**: Full POUR accessibility audit (contrast, keyboard traps, complete ARIA wiring) — deferred to `swe-ui-checker`. Form error states (no text fields with validation errors were reachable without destructive submission). Keyboard-only navigation flow.

**Screenshots evidence trail**: 36 screenshots captured to `~/ose-projects/ose-public/local-temp/uwt-*.png`.
```
