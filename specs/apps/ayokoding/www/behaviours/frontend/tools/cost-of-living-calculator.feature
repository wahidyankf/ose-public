Feature: Salary savings calculator

  # Behaviour: AYW-060
  Scenario: Cost-of-living breakdown lists category expenses per city
    Given I am on "/en/tools/cost-of-living-calculator"
    And the "Cost of living" tab is active
    When the page finishes loading
    Then I see a table of tech-hub cities
    And each row shows a Country column immediately to the left of the City column
    And each row shows monthly housing, food, transport, utilities, healthcare, childcare, school, and lifestyle expenses
    And each row shows an essentials subtotal and a total
    And each row shows a separate one-time relocation sunk-cost total
    And each row shows a separately labelled liquidity reserve

  # Behaviour: AYW-060
  Scenario: cascading geographic filters
    Given I am on "/en/tools/cost-of-living-calculator"
    And the "Cost of living" tab is active
    When I select the region "ASEAN" then the country "Indonesia" in the cascading filters
    Then the Country filter lists only ASEAN countries
    And the City filter lists only Indonesian cities
    And only cities in Indonesia are shown in the table
    Given I am on the calculator with no region or country selected
    When I select the country "Indonesia" in the country filter without first selecting a region
    Then the city dropdown lists only cities in Indonesia

  # Behaviour: AYW-060
  Scenario: country shown beside city
    Given I am on "/en/tools/cost-of-living-calculator"
    When I view any tab's results table
    Then every row shows a Country column immediately to the left of the City column
    Given I am on the "Minimum role" tab with a baseline set
    When I read a qualifying (city, role) row
    Then the row shows the city and its country
    Given I am viewing the "Cost of living" tab on a viewport narrower than 768 px
    When the mobile city cards render
    Then each card header shows both the city name and its country name

  # Behaviour: AYW-060
  Scenario Outline: Clicking a city name opens its single-city cost-of-living detail
    Given I am on "/en/tools/cost-of-living-calculator"
    When I <how>
    Then I am taken to that city's single-city Cost-of-living detail at "?city=<id>"
    And the City filter is pre-selected to that city
    And the detail is identical to the one shown when clicking the city name in the table

    Examples:
      | how                                         |
      | click a city name in any table              |
      | select a city from the City dropdown filter |

  # Behaviour: AYW-060
  Scenario: The single-city detail shows the breakdown, scheme badge, and split relocation in local currency and USD
    Given I am on "/en/tools/cost-of-living-calculator"
    When I click a city name in any table
    Then the detail shows the full per-category breakdown, essentials subtotal, total, healthcare scheme badge, and split relocation in both local currency and USD

  # Behaviour: AYW-060
  Scenario: Clicking a country opens Cost-of-living filtered to that country
    Given I am on "/en/tools/cost-of-living-calculator"
    When I click a country name in any table
    Then I am taken to the Cost-of-living tab filtered to that country at "?country=<id>"
    And the Country filter is pre-selected to that country with its Region set
    And the table shows that country's cities as a filtered list rather than a single-city detail

  # Behaviour: AYW-060
  Scenario: city wins in deep links
    Given I am on the calculator with both a country and a city query param set
    When the page resolves the deep link at "?tab=cost&country=<id>&city=<id>"
    Then the single-city Cost-of-living detail for the city is shown because a city implies its country
    Given a deep link with query string "region=europe&city=singapore"
    When the page resolves the deep link
    Then the single-city detail for Singapore is shown
    And the URL is rewritten to canonical form with "city=singapore" and "region" backfilled to "asean"

  # Behaviour: AYW-057
  Scenario: Healthcare funding scheme is always shown
    Given I am on "/en/tools/cost-of-living-calculator"
    When I select any city on any tab
    Then a healthcare funding-scheme badge is shown for that city's country
    And the badge reads "tax-funded", "mandatory payroll insurance", or "out-of-pocket"

  # Behaviour: AYW-057
  Scenario: The OOP abbreviation is explained on screen
    Given I am on a tab that shows the "Healthcare (OOP)" column
    When I read the legend near the table
    Then an on-screen explanation states that "OOP = out-of-pocket"
    And the explanation says it is the healthcare you pay yourself on top of any tax-funded or insurance coverage
    And every "OOP" acronym is wrapped in an abbr element titled "out-of-pocket"

  # Behaviour: AYW-057
  Scenario: Relocation reserve is shown separately from sunk costs
    Given I am on the "Cost of living" tab
    When I read a city row
    Then the one-time relocation sunk-cost total is shown distinct from the monthly total
    And the liquidity-reserve cash cushion is shown in its own labelled figure, not folded into the sunk-cost total

  # Behaviour: AYW-058
  Scenario: Savings tab converts gross salary to net before subtracting expenses
    Given I am on "/en/tools/cost-of-living-calculator"
    And I switch to the "Savings" tab
    When I enter a gross monthly salary of "8000" USD
    Then each city row shows a net take-home after the country's federal and sub-national effective tax
    And each row shows the essentials, the savings after essentials, and the savings after lifestyle with percentages
    And the table can be sorted by savings

  # Behaviour: AYW-058
  Scenario: Savings tab honours the active geographic filter
    Given I am on "/en/tools/cost-of-living-calculator"
    And I switch to the "Savings" tab
    And I enter a gross monthly salary of "5000" USD
    When the Country filter is set to "Indonesia"
    Then the savings table lists only Indonesian cities
    And cities outside the selected scope are not shown

  # Behaviour: AYW-058
  Scenario Outline: Gross salary entered monthly shows the derived annual figure
    Given I am on the "Savings" tab
    When I enter a gross monthly salary of "<monthly>" USD
    Then the annual gross is shown as "<annual>" USD
    And the annual figure equals twelve times the monthly figure

    Examples:
      | monthly | annual |
      | 8000    | 96000  |
      | 8000.5  | 96,006 |

  # Behaviour: AYW-058
  Scenario: Non-salary and total compensation are shown as context only
    Given I am on the "Savings" tab with a gross salary entered
    When I read a city row
    Then a typical non-salary compensation (RSU/equity + bonus) figure is shown as a separate informational column
    And a total compensation figure equal to the base annual gross plus the typical non-salary comp is shown as informational context
    But neither figure is added into the net, the essential savings, or the after-lifestyle savings

  # Behaviour: AYW-058
  Scenario: Sub-national tax lowers net only in federal countries
    Given I am on the "Savings" tab with a gross salary entered
    When I compare a US, Canadian, or Swiss city against a unitary-country city
    Then the federal-country city applies its city sub-national rate on top of the federal rate
    But the unitary-country city applies the federal rate alone

  # Behaviour: AYW-058
  Scenario: Net take-home is lower than the entered gross
    Given I am on the "Savings" tab
    When I enter a gross monthly salary above a city's tax band threshold
    Then the net take-home shown for that city is lower than the entered gross

  # Behaviour: AYW-058
  Scenario: Essentials above net show a deficit
    Given I am on the "Savings" tab for a high-cost city
    When I enter a gross salary whose net is lower than that city's modeled essentials
    Then the savings-after-essentials amount and percentage are shown as negative

  # Behaviour: AYW-061
  # Behaviour: AYW-059
  Scenario: calculator in Indonesian
    Given I am on "/id/tools/cost-of-living-calculator"
    When the page finishes loading
    Then all labels, category names, tax wording, healthcare-scheme labels, relocation labels, and the disclaimer are in Indonesian
    And the cost-of-living table's Country and City columns show Indonesian names where translations exist
    And the City column of the minimum-role ladder shows Indonesian city and country names where translations exist

  # Behaviour: AYW-057
  # Behaviour: AYW-059
  Scenario: No Israeli city is listed in the dataset, any table, or role candidates
    Given I am on the calculator in either locale
    When the page finishes loading
    Then no Israeli city appears in the dataset or any table
    And no Israeli city appears as a candidate city for any role

  # Behaviour: AYW-057
  Scenario: Data snapshot date is clearly shown
    Given I am on the calculator
    When the page finishes loading
    Then I see a prominent "Data last updated" label with the dataset snapshot date
    And I see an "estimates only" disclaimer

  # Behaviour: AYW-060
  Scenario: Adding adults and children changes the modeled expenses
    Given I am on the "Cost of living" tab
    When I change the household from "single" to married with 2 school-age children
    Then the modeled housing and utilities increase sub-linearly
    And the modeled food and healthcare increase near per-capita
    And schooling is added for the two school-age children

  # Behaviour: AYW-060
  Scenario: Pre-school children incur childcare, not schooling
    Given I am on the "Cost of living" tab
    When I set the household to 1 pre-school child and 0 school-age children
    Then the childcare expense is added for the one pre-school child
    But no schooling cost is added

  # Behaviour: AYW-060
  Scenario: school type toggle availability
    Given I am on "/en/tools/cost-of-living-calculator"
    When the household has no school-age children
    Then the school-type toggle is shown but disabled
    And a hint explains that school-age children must be added to choose
    And the "Public" and "Private" buttons are aria-disabled
    And their accessible description names the "add school-age children" prerequisite
    When I set the household to 1 school-age child
    Then the school type toggle is enabled with "Public" and "Private" options
    And the default selection is "Public"

  # Behaviour: AYW-060
  Scenario: Private school raises expenses more than public
    Given I am on "/en/tools/cost-of-living-calculator"
    And the household has 2 school-age children
    When I switch the school type from "public" to "private"
    Then the schooling portion of the modeled expenses increases

  # Behaviour: AYW-060
  Scenario: area changes the housing estimate
    Given I am on the "Cost of living" tab
    And I set the household to 2 adults with no children
    When I switch the area from "city center" to "rural"
    Then the modeled housing expense decreases
    And the city total decreases accordingly
    And the housing estimate in the expense preview decreases
    And the essentials total in the preview decreases accordingly

  # Behaviour: AYW-059
  Scenario: Qualifying rows sit above a divider, others dimmed below
    Given I am on "/en/tools/cost-of-living-calculator"
    And I switch to the "Minimum role" tab
    And I set the baseline source to "savings target"
    When I enter a monthly savings target of "8000" USD
    Then I see the qualifying (city, role) rows grouped above a divider and non-qualifying rows dimmed below it
    And (city, role) rows that cannot reach 8000 USD essential savings are shown below the divider and de-emphasised

  # Behaviour: AYW-059
  Scenario: The lowest qualifying role is marked minimum
    Given I am on "/en/tools/cost-of-living-calculator"
    And I switch to the "Minimum role" tab
    And I set the baseline source to "savings target"
    When I enter a monthly savings target of "8000" USD
    Then the lowest role rank that reaches at least 8000 USD essential savings anywhere in the filter is marked as the minimum

  # Behaviour: AYW-059
  # The reported "only one Malaysia entry / results hidden" bug. Each (city, role) is its own
  # candidate row — there is NO per-role argmax that keeps only one "best" city per role — so every
  # place that clears the bar within the filter is shown, a country can occupy several rows (one per
  # qualifying seniority level), and no qualifying country is hidden behind a higher-saving neighbour.
  Scenario: Every qualifying city and role within the filter is included
    Given I am on the "Minimum role" tab with a baseline set
    And the geographic filter is the ASEAN region
    When the savings bar is cleared by several countries at several seniority levels
    Then every (city, role) whose essential savings is at or above the bar is shown as its own row
    And a country that clears the bar at more than one role appears on more than one row
    And no qualifying country is collapsed away behind another country's higher savings
    And rows are ordered by essential savings, highest first

  # Behaviour: AYW-059
  Scenario: Roles are labelled as software-engineering roles
    Given I am on the "Minimum role" tab with a baseline set
    When the page finishes loading
    Then a caption states the ladder is software-engineering roles covering IC and management tracks

  # Behaviour: AYW-059
  Scenario: Each role shows its per-country salary distribution
    Given I am on the "Minimum role" tab with a baseline set
    When I read a role row
    Then the role shows its country's p25, median, and p75 salary distribution
    And the row's essential savings is computed from the median salary

  # Behaviour: AYW-060
  Scenario: Geographic filter scopes the candidate cities
    Given I am on the "Minimum role" tab with a baseline set
    When I select the country "Indonesia" in the cascading filters
    Then every (city, role) row is drawn only from Indonesian cities

  # Behaviour: AYW-059
  Scenario: Min-role ranking follows essential savings, not non-salary comp or lifestyle
    Given I am on the "Minimum role" tab with a baseline set
    When I compare candidate order with their essential savings, non-salary comp, and each city's lifestyle cost
    Then rows are ordered by essential savings regardless of non-salary comp
    And at least one adjacent pair would be ordered differently by non-salary comp
    And candidate order and the minimum marker follow essential savings rather than after-lifestyle savings

  # Behaviour: AYW-059
  Scenario: Minimum role from a reference city and role
    Given I am on the "Minimum role" tab
    And I set the baseline source to "Match a role"
    And I pick the city "Jakarta" and the role "Senior SWE"
    When I view the minimum role result
    Then the baseline savings bar equals that role's essential savings in Jakarta
    And the marked minimum role reaches at least that essential savings in absolute terms

  # Behaviour: AYW-059
  Scenario: Minimum role from my own salary
    Given I am on the "Minimum role" tab
    And I set the baseline source to "my salary"
    When I enter my gross salary and its city
    Then the baseline savings bar equals my essential savings in my selected salary city
    And the bar is not raised to a cheaper city's optimum that I do not live in
    And the ladder marks the lowest role that meets or beats it

  # Behaviour: AYW-059
  Scenario: My-salary baseline accepts the gross in local currency or USD
    Given I am on the "Minimum role" tab
    And I set the baseline source to "my salary"
    When I compare "10000" SGD with the FX-equivalent "7744" USD for salary city "Singapore"
    Then I can enter my gross monthly salary in either Singapore's local currency or USD
    And the local-currency option follows the selected salary city
    And both inputs produce the same baseline and ranking

  # Behaviour: AYW-059
  Scenario: Household and area changes recalculate minimum-role candidates
    Given I am on the "Minimum role" tab and the "SWE I" role qualifies for the "single" household basis
    When I change the household to "married with 2 children" and the area to "center"
    Then "SWE I" is re-evaluated after childcare, schooling, and central housing raise modeled essentials
    And the marked minimum reflects the recalculated household
    And the role candidates' savings and the marked minimum role update accordingly

  # Behaviour: AYW-059
  Scenario: No role can reach the bar
    Given I am on the "Minimum role" tab
    When I set a savings target higher than any role's essential savings in any city
    Then the tool states that no role clears the bar
    And no row is marked as the minimum

  # Behaviour: AYW-059
  Scenario: Low-confidence cells are flagged on the minimum-role tab
    Given I am on the "Minimum role" tab with a baseline set
    When the table renders
    Then cells with lower data confidence display a visual flag indicator


  # Behaviour: AYW-057
  Scenario: Income exactly at the low-to-mid threshold uses the mid band
    Given I am on the "Savings" tab
    When I enter a gross monthly salary at exactly the low-to-mid band threshold for a city
    Then that city's net take-home uses the mid band effective tax rate

  # Behaviour: AYW-059
  Scenario: Zero savings target marks the lowest role as the minimum
    Given I am on the "Minimum role" tab
    And I set the baseline source to "savings target"
    When I enter a monthly savings target of zero USD
    Then the minimum marker appears on the lowest-ranked qualifying role, on each city row where it clears the bar
    And the qualifying (city, role) rows whose savings are at or above zero appear above the divider

  # Behaviour: AYW-060
  Scenario: household preview scaling
    Given I am on the cost-of-living calculator
    And the default household is 1 adult with no children in city center
    When I change the Adults control to 2
    Then the Housing preview amount is exactly 1.25 times the 1-adult amount
    And the Utilities preview amount is exactly 1.25 times the 1-adult amount
    And the Food preview amount is exactly 1.5 times the 1-adult amount
    And the Transport preview amount is unchanged from the 1-adult amount
    And the Housing preview amount increases for two adults
    And the Childcare and School preview amounts remain zero
    And the Total preview updates immediately without a page reload

  # Behaviour: AYW-060
  # Behaviour: AYW-059
  # Behaviour: AYW-058
  # Reconciled 2026-06-21 and 2026-06-22: all 9 controls, the min-role baseline source and its
  # inputs, and the savings gross are serialized in the URL (single source of truth). Selecting
  # country alone encodes only "country=id", not "tab=cost" (default tab is omitted).
  Scenario Outline: calculator state is kept in the URL
    Given I am on the calculator for the "<control>" control
    When I change the "<control>" control
    Then the URL query string holds the "<control>" state

    Examples:
      | control       |
      | filters       |
      | baseline      |
      | savings gross |
      | country       |
      | tab           |
      | cost basis    |

  # ── Accepted proposals: SG-001…006, USS-001…005, SG-D-001…004 (Phase 4 grill 2026-06-20) ──

  # Behaviour: AYW-058
  # SG-001 — Negative salary input is clamped to zero
  Scenario: Negative salary input is clamped to zero
    Given I am on the "Savings" tab
    When I enter a gross monthly salary of "-1000"
    Then the annual gross displayed is "0 USD"
    And the same zero-salary guidance replaces the city rows

  # Behaviour: AYW-058
  # SG-003 — Very large salary does not produce NaN or Infinity
  Scenario: Very large salary produces valid savings figures
    Given I am on the "Savings" tab
    When I enter a gross monthly salary of "99999999"
    Then no city row shows "NaN" or "Infinity" in any column
    And each city row shows a positive net take-home

  # Behaviour: AYW-058
  Scenario: Savings tab shows results after salary is entered
    Given a user is on the Savings tab with the empty-state message displayed
    When they enter a positive gross monthly salary value
    Then the instructional message disappears
    And the savings comparison table is shown with computed savings figures

  # Behaviour: AYW-060
  # USS-003 — Area toggle confirms data update
  Scenario: Area toggle shows selected state and confirms data update
    Given a user is on the Cost of Living tab
    And "City center" is the currently active area selection
    When the user clicks "Rural"
    Then the "Rural" button displays as the active/selected state
    And a visible signal confirms the table data has been recalculated for rural estimates

  # Behaviour: AYW-058
  # Behaviour: AYW-059
  # Behaviour: AYW-061
  # SG-D-001 — dual-currency display in the cost-of-living, savings, and minimum-role tables
  Scenario: money columns show local currency and USD
    Given the user is on the Cost of living tab at desktop width
    When the table renders with at least one city row
    Then every monetary cell shows the local currency amount and the USD equivalent
    And no money cell shows a bare integer without a currency label
    Given the user is on the Savings tab with a gross salary entered
    When the table renders
    Then the Net, Essentials, Essential-savings, and After-lifestyle-savings columns show both local and USD amounts
    Given I am on the "Minimum role" tab with a baseline set and a display currency chosen
    When I read a role row
    Then every money column (p25, median, p75, non-salary comp, total comp, and essential savings) shows the display currency on the first line and the city's local currency on the second line
    And each role row shows its essential savings in USD, the city's local currency, and the display currency
    And no money column shows only a single currency

  # SG-D-002 — covered by the "country shown beside city" scenario

  # Behaviour: AYW-057
  # Behaviour: AYW-061
  # SG-D-003 — Page heading matches tool identity; the browser title names the tool in each locale
  Scenario Outline: page title and H1 name the tool
    Given the user opens "/<locale>/tools/cost-of-living-calculator"
    When the page renders
    Then the H1 reads "<expected_h1>"
    And the browser title starts with "<expected_h1>"

    Examples:
      | locale | expected_h1               |
      | en     | Cost of Living Calculator |
      | id     | Kalkulator Biaya Hidup    |

  # Behaviour: AYW-058
  # prd.md acceptance criteria — design-system controls, locale URL redirect, mobile nav
  Scenario: The gross-salary field has a visible border and a label
    Given the user is on the "Savings" tab
    When the tab renders
    Then the gross-salary field renders with a visible border and padding
    And the gross-salary field has a visible label

  # Behaviour: AYW-059
  Scenario: Baseline selector is a segmented control
    Given the user is on the "Minimum role" tab
    When the tab renders
    Then the baseline-source control renders as a styled segmented button group, not a plain select

  # Behaviour: AYW-060
  # USS-004 and tab-label cleanliness — each tab label is a single phrase, and each tab description is its own
  # element linked to its trigger via aria-describedby (only the active one is visible; see "active tab description")
  Scenario: tab labels
    Given the user views the tab bar at any breakpoint
    When the tab bar renders
    Then each tab trigger's visible text is its label only, with the description not fused into it
    And the tab primary name and its descriptive sub-label are visually distinct
    And the two pieces of text do not run together without a visual separator
    And a screen reader announces them as separate text nodes
    And each of the three tabs has a description element associated with its trigger via aria-describedby
    And no tab description text is duplicated elsewhere on screen

  # ── URL state Phase 4 scenarios (added 2026-06-21) ──────────────────────────

  # Behaviour: AYW-060
  # URL-001 (adults), URL-002 (full country name), URL-012 (unknown city): an invalid deep-link
  # value is reset to its default on load and removed from the URL.
  Scenario Outline: invalid deep-link values fall back to defaults
    Given a deep link with query string "<query>"
    When the page resolves the deep link
    Then the "<control>" control returns to its default "<default_value>"
    And the URL is rewritten to have no "<param>" param

    Examples:
      | query             | control | default_value | param   |
      | adults=4          | Adults  | 1             | adults  |
      | country=Indonesia | Country | All countries | country |
      | city=atlantis     | City    | All cities    | city    |

  # Behaviour: AYW-060
  # URL-003 — Selecting a city backfills country and region
  Scenario: city selection backfills country and region
    Given I am on the calculator with no query string
    When I select the city "Jakarta"
    Then the URL query string includes "city=jakarta"
    And the Country filter shows "Indonesia" and the Region filter shows "ASEAN"
    Given a deep link with query string "city=singapore"
    When I open that link in a fresh tab
    Then the single-city Cost-of-living detail for Singapore is shown
    And the Country filter shows "Singapore" and the Region filter shows "ASEAN"

  # Behaviour: AYW-058
  # URL-004 — Selecting a broader region clears incompatible narrower filters
  # Behaviour: AYW-060
  # URL-010 — Region selection writes region to the URL
  Scenario: region selection clears narrower filters
    Given I am on the calculator with query string "city=singapore"
    When I select the region "Europe"
    Then the URL query string includes "region=europe"
    But the URL query string does not include "country" or "city"
    Given I am on the calculator with no query string
    When I choose the region "Europe" from a blank filter
    Then the URL query string writes "region=europe"
    And the URL query string has no "country" or "city" param

  # Behaviour: AYW-060
  # URL-006 and AC-12 (UWT-015) — the city-detail back link keeps an explicitly chosen parent
  # geo scope. A city-ONLY deep link, where the scope was auto-derived, returns to the bare calculator.
  Scenario Outline: city detail back link
    Given I am on the single-city detail with query string "<query>"
    When I read the single-city detail back link
    Then the back link points to "<back_link>"
    And the back link does not include "city"

    Examples:
      | query                                  | back_link                |
      | region=asean&country=sg&city=singapore | ?region=asean&country=sg |
      | city=london                            | ?tab=cost                |

  # Behaviour: AYW-060
  # Behaviour: AYW-061
  # URL-009 (escape links), AC-2 (DWT-B-003/DWT-B-004, chevron separators) and AC-3 (UWT-013, final
  # crumb equals the page H1) — the breadcrumb on the single-city detail, in each locale.
  Scenario Outline: calculator breadcrumb
    Given the user opens "/<locale>/tools/cost-of-living-calculator?city=singapore"
    When I read the breadcrumb above the page title
    Then a "Home" link to "/<locale>" is shown
    And a "Tools" link to "/<locale>/tools" is shown
    And the crumbs are separated by chevron icons
    And no literal "/" separator is shown between crumbs
    And the current-page crumb text reads "<expected_title>"
    And the current-page crumb is marked aria-current="page"

    Examples:
      | locale | expected_title            |
      | en     | Cost of Living Calculator |
      | id     | Kalkulator Biaya Hidup    |

  # Behaviour: AYW-060
  # URL-013 — Canonicalization uses replace so Back button skips the dirty URL
  Scenario: Canonicalization does not add a browser history entry
    Given a deep link with query string "city=atlantis"
    When the page rewrites the URL to canonical form
    Then pressing the browser Back button does not return to the "city=atlantis" URL

  # Behaviour: AYW-059
  # Behaviour: AYW-057
  # AC-4 (UWT-016/DWT-005), Cluster 2 and SG-003 — every control meets the 44px minimum touch target
  Scenario Outline: touch targets are at least 44 px
    Given I am on the "<tab>" tab at a <width>px-wide viewport
    When the "<control>" control is rendered
    Then each "<control>" is at least 44 pixels tall

    Examples:
      | tab            | width | control                |
      | Cost of living | 375   | geo-filter select      |
      | Cost of living | 375   | tab trigger            |
      | Cost of living | 375   | segmented radio        |
      | Minimum role   | 320   | baseline source option |
      | Minimum role   | 375   | baseline source option |

  # Behaviour: AYW-057
  # Behaviour: AYW-061
  # AC-5 (UWT-008) and EWT-R01 (regression of UWT-008) — the calculator page does not overflow
  # horizontally at 320px in English or Indonesian, because the longer Indonesian tab labels
  # must not widen the document either.
  Scenario Outline: no horizontal overflow at 320 px
    Given I am on the "<locale>" locale calculator at a 320px-wide viewport
    When the calculator page renders
    Then the document does not scroll horizontally

    Examples:
      | locale |
      | en     |
      | id     |

  # Behaviour: AYW-058
  # AC-8 (UWT-004), UWT-019 and UWT-007 — the Savings gross-salary field names its active currency
  # as a separate indicator at the field, and says why USD is used for every city.
  Scenario: savings currency indicator
    Given I am on the "Savings" tab
    When the gross-salary field renders
    Then the gross-salary label does not contain the literal currency code "USD"
    And an active-currency indicator next to the field shows "USD"
    And an explanation states salaries are compared in USD across all cities
    And the gross salary input displays its USD currency inline at the field

  # Behaviour: AYW-059
  # USS-002 and AC-9 (UWT-006) — a BLANK savings target shows empty-state guidance and no ladder. An explicit zero
  # engages the baseline, so the role ladder shows instead (code behaviour, owner decision Q18c).
  Scenario: minimum-role empty state
    Given I am on the "Minimum role" tab with the savings-target baseline and a blank target
    When the tab renders
    Then a minimum-role empty-state guidance message is shown
    And the role comparison table is not shown
    And no role salary data is visible
    But entering an explicit zero target replaces the guidance with the role ladder and its divider

  # Behaviour: AYW-060
  # AC-10 (UWT-007) — Region selector lists exactly the nine intended regions
  Scenario: The region selector lists exactly the nine intended regions
    Given I am on the calculator with no query string
    When the region filter renders
    Then the region selector offers exactly the nine regions africa, americas, asean, asia, europe, japan, mena, nordics, and oceania

  # Behaviour: AYW-060
  # AC-11 (UWT-014) — A country change that auto-changes the region surfaces an advisory
  Scenario: Selecting a country that changes the region shows a visible advisory
    Given I am on the calculator with no region selected
    When I select a country whose region differs from the current selection
    Then a visible region-auto-advisory message is shown

  # ── Phase 7: spec coverage sweep ──────────────────────────────────────────────

  # SG-U-001..004 (URL default-stripping): switching back to the default tab removes
  # the tab param so the URL stays clean.
  # Scenario: Switching to a non-default tab then back to the default tab removes the tab param
  #   Given I am on the calculator with no query string
  #   When I switch to the "Savings" tab and then switch back to the "Cost of living" tab
  #   Then the URL query string does not include a "tab" parameter

  # Behaviour: AYW-060
  # SG-U (area radiogroup) — the area control renders with role="radiogroup"
  Scenario: The area control is rendered as a radiogroup
    Given I am on the cost-of-living calculator
    When the cost-basis controls render
    Then the area segmented control has role="radiogroup"
    And the area radiogroup contains the "City center" and "Rural" options

  # Behaviour: AYW-059
  # SG-U (baseline SegmentedControl) — baseline selector is a radiogroup that shows or
  # hides the relevant sub-form depending on which option is active
  Scenario: The baseline selector shows the savings-target sub-form when savings target is selected
    Given the user is on the "Minimum role" tab
    When the tab renders
    Then the baseline-source control renders as a radiogroup with at least three options
    And the savings-target input is visible when savings target is the selected baseline
    And the reference-role inputs are hidden when savings target is the selected baseline

  # Behaviour: AYW-060
  # Regression — changing a filter must not scroll the page back to the top. The URL write is
  # in-page view state, not a page navigation, so it requests { scroll: false }.
  Scenario: Changing a filter keeps the page at the same scroll position
    Given I am on the cost-of-living calculator
    When I change the region filter to "Europe"
    Then the page does not jump to the top

  # Behaviour: AYW-058
  # Regression — typing a salary must not write the URL on every keystroke (the stutter bug).
  # The field echoes each keystroke instantly while the URL commit is debounced until typing
  # settles.
  Scenario: Typing the gross salary echoes instantly but commits to the URL only after typing settles
    Given I am on the "Savings" tab
    When I type a gross monthly salary of "7000" without pausing
    Then the salary field immediately shows "7000"
    And the gross salary is written to the URL once typing settles

  # Behaviour: AYW-060
  # Public primary schooling is not open to foreign residents in every country. Where it is not
  # fully open (limited or nationals-only — e.g. Singapore, Indonesia, UAE), a relocating foreigner
  # cannot realistically use it, so the calculator charges the PRIVATE figure and flags the cell.
  Scenario: Public schooling not open to foreigners is charged at the private rate
    Given I am on the cost-of-living calculator
    When I add one school-age child with public school selected
    Then the Singapore school cost equals its private-school figure and the cell is flagged

  # Behaviour: AYW-060
  # Where public schooling IS open to foreign residents (e.g. Germany), the public figure stands.
  Scenario: Public schooling open to foreigners keeps the public cost
    Given I am on the cost-of-living calculator
    When I add one school-age child with public school selected
    Then the Berlin school cost equals its public-school figure with no foreigner flag

  # ── Phase 8: UX-hardening fold-in (SG-001..003, USS-001..004, protected behaviours) ──
  # Accepted spec proposals from the 2026-06-22 three-lens retest (see plan
  # ayokoding-www-calculator-ux-hardening). Each scenario protects a behaviour that
  # landed in Phases 1-7 so feature-change-completeness holds.

  # Behaviour: AYW-060
  # Cluster 1 / SG-001 — only the active tab description is visible; it follows the tab.
  Scenario: active tab description
    Given the cost-of-living calculator is open with the "Cost of living" tab active
    When the page is rendered
    Then the "Cost of living" tab description is visible
    And the "Savings" tab description is not visible
    And the "Minimum role" tab description is not visible
    When the user selects the "Savings" tab
    Then only the "Savings" tab description is visible

  # Behaviour: AYW-060
  # USS-003 — Area toggle exposes its active state via ARIA.
  Scenario: Area toggle exposes its pressed state
    Given "City center" is the active area
    When the page is rendered
    Then the "City center" button has aria-pressed "true"
    And the "Rural" button has aria-pressed "false"

  # Behaviour: AYW-058
  Scenario: Sortable savings column exposes aria-sort
    Given the Savings tab table is shown
    When the page is rendered
    Then the sortable "Savings after essentials" column header has an aria-sort value

  # Behaviour: AYW-060
  # Cluster 3 — foreigner public-school flag clear, styled, and present in both views.
  Scenario: A school cost charged at the private rate carries a clear flag in the table and the city detail
    Given a city whose country does not open public school to foreigners
    And school-age children >= 1 and school type "public"
    When the page is rendered
    Then the cost-of-living table school cell shows a clearly-worded private-fallback flag
    And the flag is visually distinct from ordinary caption text
    And the city-detail school row shows the same flag

  # Behaviour: AYW-060
  # Cluster 4 — jargon glosses, localized OOP abbr title, localized region names.
  Scenario: Jargon table headers carry an accessible explanation
    Given the calculator is open
    When the page is rendered
    Then the "Healthcare (OOP)" header has a title explaining out-of-pocket (localized)
    And the "Relocation (sunk)" and "Liquidity reserve" headers carry explanatory titles
    And the "P25"/"Median"/"P75" headers carry percentile explanations
    And the "Track" column abbreviations ic/mgmt are expanded or carry abbr titles

  # Behaviour: AYW-061
  # Protected behaviour — the OOP abbr title is localized (id != literal "out-of-pocket").
  Scenario: The OOP abbreviation title is localized per locale
    Given the calculator is open
    When the page is rendered
    Then the localized out-of-pocket title differs between the en and id locales
    And the id-locale out-of-pocket title is not the literal English "out-of-pocket"

  # Behaviour: AYW-061
  # Protected behaviour — region option display names are localized for the reader.
  Scenario: Region names show in the reader's language
    Given the calculator is open
    When the region filter renders
    Then the region display label differs between the en and id locales

  # Behaviour: AYW-061
  # Protected behaviour — the serialized region key stays English for URL stability.
  Scenario: The URL value of a region stays its English key
    Given the calculator is open
    When the region filter renders
    Then each region option's serialized value is its English key

  # Behaviour: AYW-057
  Scenario: Healthcare scheme badges use consistent casing
    Given the calculator is open
    When the page is rendered
    Then no healthcare-scheme badge is rendered in ALL CAPS while another is lower-case

  # Behaviour: AYW-058
  Scenario Outline: savings empty state
    Given the Savings tab is activated
    When the gross monthly salary field is <salary>
    Then a prominent empty-state prompt is shown in the data area
    And an instructional message is shown
    And the savings comparison table is not shown
    And no savings figures or percentages are rendered without net income
    And the gross salary input receives focus

    Examples:
      | salary |
      | empty  |
      | zero   |

  # Behaviour: AYW-059
  Scenario: Minimum-role tab does not render the single-city essentials preview
    Given the Minimum-role tab is activated
    When the page is rendered
    Then no "Example — estimated monthly essentials" single-city cost preview is shown
    # The min-role tab now lists every qualifying city, so a one-city example is redundant there.

  # Behaviour: AYW-060
  # Cluster 6 / SG-002 + SG-003 — design-system fidelity.
  Scenario: Every dropdown shows one custom arrow and not the browser's native arrow
    Given the calculator at 1280px
    When the page is rendered
    Then every dropdown shows a custom chevron affordance
    And no dropdown shows the browser's native arrow

  # Behaviour: AYW-058
  Scenario: Salary-currency toggle bottom-aligns with its sibling input
    Given the Minimum-role "My salary" baseline at 1280px
    When the page is rendered
    Then the salary-currency toggle bottom-aligns with the gross salary input
