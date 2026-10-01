# The page ranks coding models by a composite index built only from independently run benchmark
# results, places each model in one of four capability tiers anchored on previous-generation
# models, compares API prices, and suggests OpenCode Go substitutes for frontier models.
Feature: AI model benchmark tool

  Background:
    Given the AI benchmark dataset is loaded

  # ── Composite index ───────────────────────────────────────────────────────────

  # Exemption(integration): the composite index is pure in-process arithmetic with no local-resource boundary; alternative-proof: ayokoding-www:test:unit / The composite index is the equal-weight mean of the scored benchmarks
  @integration-exempt
  # Exemption(e2e): the fixture model's figures are private scoring inputs with no public browser control; alternative-proof: ayokoding-www:test:unit / The composite index is the equal-weight mean of the scored benchmarks
  @e2e-exempt
  Scenario: The composite index is the equal-weight mean of the scored benchmarks
    Given a fixture model scoring 70 on DeepSWE, 40 on Terminal-Bench, and 61 on SWE-Atlas-QnA
    When its composite index is computed
    Then the composite index is 57

  # Exemption(integration): figure selection is pure in-process logic with no local-resource boundary; alternative-proof: ayokoding-www:test:unit / Only figures for the pinned benchmark version enter the composite index
  @integration-exempt
  # Exemption(e2e): a wrongly versioned fixture figure cannot be injected through the public page; alternative-proof: ayokoding-www:test:unit / Only figures for the pinned benchmark version enter the composite index
  @e2e-exempt
  Scenario: Only figures for the pinned benchmark version enter the composite index
    Given a fixture model scoring 60 on DeepSWE 1.1 and 40 on Terminal-Bench 4.0
    And that model also carries a Terminal-Bench 2.1 figure of 90
    When its composite index is computed
    Then the composite index is 50

  # Exemption(integration): the minimum-coverage rule is pure in-process logic with no local-resource boundary; alternative-proof: ayokoding-www:test:unit / A model scored on fewer than two benchmarks has insufficient data
  @integration-exempt
  # Exemption(e2e): the single-figure fixture is a private scoring input with no public browser control; alternative-proof: ayokoding-www:test:unit / A model scored on fewer than two benchmarks has insufficient data
  @e2e-exempt
  Scenario: A model scored on fewer than two benchmarks has insufficient data
    Given a fixture model with a score on only one composite benchmark
    When its tier is assigned
    Then that model's tier is "insufficient"
    And that model has no composite index

  # ── Tiers ─────────────────────────────────────────────────────────────────────

  # Exemption(integration): the anchor comparison is pure in-process logic with no local-resource boundary; alternative-proof: ayokoding-www:test:unit / A model meets an anchor when its composite index reaches the anchor's
  @integration-exempt
  # Exemption(e2e): the fixture anchor and model figures are private scoring inputs with no public browser control; alternative-proof: ayokoding-www:test:unit / A model meets an anchor when its composite index reaches the anchor's
  @e2e-exempt
  Scenario: A model meets an anchor when its composite index reaches the anchor's
    Given a fixture anchor scoring 70 on DeepSWE and 20 on Terminal-Bench with no SWE-Atlas-QnA score
    And a fixture model scoring 66 on DeepSWE, 22 on Terminal-Bench, and 70 on SWE-Atlas-QnA
    When the model is compared with the anchor
    Then the model's composite index is above the anchor's even though it trails on DeepSWE and Terminal-Bench
    And the model meets the anchor

  # Exemption(integration): tier assignment is pure in-process logic with no local-resource boundary; alternative-proof: ayokoding-www:test:unit / A model is placed in the highest tier whose anchor it meets
  @integration-exempt
  # Exemption(e2e): the fixture anchors and model are private scoring inputs with no public browser control; alternative-proof: ayokoding-www:test:unit / A model is placed in the highest tier whose anchor it meets
  @e2e-exempt
  Scenario Outline: A model is placed in the highest tier whose anchor it meets
    Given fixture tier anchors scoring 60 for ultra, 55 for planning, and 45 for execution on every composite benchmark
    And a fixture model scoring <score> on every composite benchmark
    When its tier is assigned
    Then that model's tier is "<tier>"

    Examples:
      | score | tier      |
      | 61    | ultra     |
      | 60    | ultra     |
      | 57    | planning  |
      | 45    | execution |
      | 30    | fast      |

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Each tier anchor lands in the tier it defines
  @integration-exempt
  Scenario: Each tier anchor lands in the tier it defines
    Given the full roster is loaded
    When every model's tier is assigned
    Then the ultra anchor is in the "ultra" tier
    And the planning anchor is in the "planning" tier
    And the execution anchor is in the "execution" tier

  # Exemption(integration): the roster invariant is pure in-process data validation with no local-resource boundary; alternative-proof: ayokoding-www:test:unit / Every tier anchor is a previous-generation model with general access
  @integration-exempt
  # Exemption(e2e): model lines and release dates are dataset fields with no public browser control; alternative-proof: ayokoding-www:test:unit / Every tier anchor is a previous-generation model with general access
  @e2e-exempt
  Scenario: Every tier anchor is a previous-generation model with general access
    Given the full roster is loaded
    When the tier anchors are inspected
    Then every tier anchor has general access
    And every tier anchor has a newer model from the same vendor in the roster

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Every roster model belongs to exactly one tier group
  @integration-exempt
  Scenario: Every roster model belongs to exactly one tier group
    Given the full roster is loaded
    When the tier groups are computed
    Then each model appears in exactly one of "ultra", "planning", "execution", "fast", or "insufficient"

  # ── Price ─────────────────────────────────────────────────────────────────────

  # Exemption(integration): the blended price is pure in-process arithmetic with no local-resource boundary; alternative-proof: ayokoding-www:test:unit / The blended price weights input three to one against output
  @integration-exempt
  # Exemption(e2e): the fixture price is a private pricing input with no public browser control; alternative-proof: ayokoding-www:test:unit / The blended price weights input three to one against output
  @e2e-exempt
  Scenario: The blended price weights input three to one against output
    Given a fixture model priced at 4 dollars input and 20 dollars output per million tokens
    When its blended price is computed
    Then the blended price is 8 dollars per million tokens

  # ── Substitute finder ─────────────────────────────────────────────────────────

  # Exemption(integration): substitute selection is pure in-process logic with no local-resource boundary; alternative-proof: ayokoding-www:test:unit / Substitutes are OpenCode Go models in the same or a higher tier
  @integration-exempt
  # Exemption(e2e): the fixture roster is a private input with no public browser control; alternative-proof: ayokoding-www:test:unit / Substitutes are OpenCode Go models in the same or a higher tier
  @e2e-exempt
  Scenario: Substitutes are OpenCode Go models in the same or a higher tier
    Given a frontier fixture model in the "planning" tier
    And OpenCode Go fixture models in the "ultra", "planning", and "execution" tiers and one with insufficient data
    When substitutes are listed for the frontier model
    Then the substitutes are only the "ultra" and "planning" OpenCode Go models
    And the substitutes are ordered by composite index from highest to lowest

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Choosing a frontier model lists its OpenCode Go substitutes with a price comparison
  @integration-exempt
  Scenario: Choosing a frontier model lists its OpenCode Go substitutes with a price comparison
    Given the AI benchmark page is open
    When the reader chooses "GPT-5.6 Terra" in the substitute finder
    Then the finder lists OpenCode Go models with their tier, composite index, and blended price
    And each listed model states how its blended price compares with the chosen model's

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A frontier model with no same-tier OpenCode Go model shows the nearest options
  @integration-exempt
  Scenario: A frontier model with no same-tier OpenCode Go model shows the nearest options
    Given the AI benchmark page is open
    When the reader chooses "Claude Sonnet 5.5" in the substitute finder
    Then the finder states that no OpenCode Go model reaches that model's tier
    And the finder lists the highest-scoring OpenCode Go models as the nearest options

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The chosen substitute target is kept in the URL
  @integration-exempt
  Scenario: The chosen substitute target is kept in the URL
    Given the AI benchmark page is open
    When the reader chooses "GPT-5.6 Terra" in the substitute finder
    Then the URL carries that model as the substitute target
    And reloading that URL shows the same substitute list

  # ── Page header and dates ─────────────────────────────────────────────────────

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The English page renders its localized heading
  @integration-exempt
  Scenario: The English page renders its localized heading
    Given the locale is "en"
    When the AI benchmark page renders
    Then the page shows a level-one heading in English
    And the document language attribute is "en"

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The Indonesian page renders its localized heading
  @integration-exempt
  Scenario: The Indonesian page renders its localized heading
    Given the locale is "id"
    When the AI benchmark page renders
    Then the page shows a level-one heading in Indonesian
    And the document language attribute is "id"

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The last-updated date is shown before the substitute finder
  @integration-exempt
  Scenario: The last-updated date is shown before the substitute finder
    Given the dataset carries a last-updated date
    When the page renders
    Then the last-updated date is shown in text
    And the last-updated date precedes the substitute finder in document order

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The page states that only independent results are scored
  @integration-exempt
  Scenario: The page states that only independent results are scored
    Given the AI benchmark page is open
    When the page renders
    Then a line stating that only independently run results are scored is visible without interaction
    And that line states that vendor-reported results are excluded

  # ── Tier map ──────────────────────────────────────────────────────────────────

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Each tier section names its anchor and floor score
  @integration-exempt
  Scenario: Each tier section names its anchor and floor score
    Given the full roster is loaded
    When the tier map is rendered
    Then the ultra, planning, and execution sections each name their anchor model
    And each of those sections states its floor score
    And the fast section states that it holds rated models below the execution floor

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Every rated model row shows its bar, index, and API price in text
  @integration-exempt
  Scenario: Every rated model row shows its bar, index, and API price in text
    Given the full roster is loaded
    When the tier map is rendered
    Then every rated model row carries the model name and its composite index in text
    And every rated model row carries one capability bar
    And every rated model row carries its input and output API price in text, or states that no public API price exists

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Bar length is proportional to the composite index
  @integration-exempt
  Scenario: Bar length is proportional to the composite index
    Given two rated models whose composite indices differ
    When the tier map is rendered
    Then the ratio of their bar lengths equals the ratio of their composite indices

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The tier is carried in text, not by colour alone
  @integration-exempt
  Scenario: The tier is carried in text, not by colour alone
    Given the full roster is loaded
    When the tier map is rendered
    Then every tier section has a text heading naming its tier

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A limited-access model is labelled
  @integration-exempt
  Scenario: A limited-access model is labelled
    Given the roster holds a model with limited access
    When the tier map is rendered
    Then that model's row carries a limited-access label in text

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Models with insufficient data are listed in a collapsed section
  @integration-exempt
  Scenario: Models with insufficient data are listed in a collapsed section
    Given the roster holds models scored on fewer than two benchmarks
    When the page renders
    Then those models are listed inside a closed disclosure
    And each listed model shows whatever independent scores it has

  # ── Data table ────────────────────────────────────────────────────────────────

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The data table is present without any interaction
  @integration-exempt
  Scenario: The data table is present without any interaction
    Given the full roster is loaded
    When the page first renders
    Then a data table is present in the document
    And the table has a caption
    And every table header cell declares a scope

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The table lists every model's scores, tier, and prices
  @integration-exempt
  Scenario: The table lists every model's scores, tier, and prices
    Given the full roster is loaded
    When the data table is rendered
    Then each model row lists its tier, every benchmark score, composite index, input price, output price, and blended price

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Every benchmark score names and links its operator
  @integration-exempt
  Scenario: Every benchmark score names and links its operator
    Given the full roster is loaded
    When the data table is rendered
    Then every benchmark score cell names the operator that ran it
    And every benchmark score cell links to its source

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Cost per task is shown where an independent operator publishes it
  @integration-exempt
  Scenario: Cost per task is shown where an independent operator publishes it
    Given a model whose independent operator publishes a cost per task
    When the data table is rendered
    Then that model's row shows its cost per task in dollars

  # ── Methodology ───────────────────────────────────────────────────────────────

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The page explains how the score is calculated
  @integration-exempt
  Scenario: The page explains how the score is calculated
    Given the AI benchmark page is open
    When the reader opens the methodology section
    Then it lists every composite benchmark with its version and weight
    And it states the operator order used to pick each figure
    And it states the minimum number of benchmarks needed for a tier
    And it lists every tier anchor with its floor score

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The worked example matches the computed index
  @integration-exempt
  Scenario: The worked example matches the computed index
    Given the AI benchmark page is open
    When the reader opens the methodology section
    Then the worked example shows a model's benchmark scores and the resulting composite index
    And the worked example's composite index equals that model's index in the data table

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The page lists every operator with its checked date and terms
  @integration-exempt
  Scenario: The page lists every operator with its checked date and terms
    Given the dataset names its benchmark operators and price sources
    When the page renders
    Then a sources section lists every named operator
    And each operator entry states the date it was last checked
    And each operator entry states how its figures are cited

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / No raw translation key leaks on either locale
  @integration-exempt
  Scenario Outline: No raw translation key leaks on either locale
    Given the locale is "<locale>"
    When the AI benchmark page renders
    Then no rendered text matches a raw translation key

    Examples:
      | locale |
      | en     |
      | id     |

  # ── Filters ───────────────────────────────────────────────────────────────────

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The page with no query parameters shows the whole roster
  @integration-exempt
  Scenario: The page with no query parameters shows the whole roster
    Given the URL carries no query parameters
    When the page renders
    Then every roster model is shown in the data table

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A harness parameter narrows the tier map and the table
  @integration-exempt
  Scenario: A harness parameter narrows the tier map and the table
    Given the URL carries a harness parameter naming a known harness
    When the page renders
    Then only models that harness exposes are shown in the tier map
    And only models that harness exposes are shown in the data table

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A tier parameter narrows the tier map and the table
  @integration-exempt
  Scenario: A tier parameter narrows the tier map and the table
    Given the URL carries a tier parameter naming a known tier
    When the page renders
    Then only models in that tier are shown in the tier map
    And only models in that tier are shown in the data table

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Harness and tier parameters intersect
  @integration-exempt
  Scenario: Harness and tier parameters intersect
    Given the URL carries both a harness parameter and a tier parameter
    When the page renders
    Then only models satisfying both filters are shown

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / An unrecognized filter value falls back to the unfiltered view
  @integration-exempt
  Scenario: An unrecognized filter value falls back to the unfiltered view
    Given the URL carries a harness parameter with an unknown value
    When the page renders
    Then every roster model is shown
    But no error is surfaced to the reader

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A duplicated query parameter resolves to its first value
  @integration-exempt
  Scenario: A duplicated query parameter resolves to its first value
    Given the URL carries the harness parameter twice with two different known harness values
    When the page renders
    Then the filter uses the first of the two values

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Resetting a filter to "All" removes it from the URL
  @integration-exempt
  Scenario: Resetting a filter to "All" removes it from the URL
    Given the URL carries both a harness parameter and a tier parameter
    When the reader resets the tier filter to "All tiers"
    Then the URL retains the harness parameter but no longer carries the tier parameter

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A filter combination matching no model renders an explicit empty state
  @integration-exempt
  Scenario: A filter combination matching no model renders an explicit empty state
    Given the URL carries a filter combination that matches no model
    When the page renders
    Then an explicit empty-state message is shown
    But the tier map and the data table do not render

  # ── Accessibility and layout ──────────────────────────────────────────────────

  # jsdom cannot resolve `oklch()` custom properties through a cascade, so the rasterized contrast
  # assertion runs in the browser; the unit binding verifies every tier is wired to its tokens.
  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Tier colours meet contrast in both themes
  @integration-exempt
  Scenario Outline: Tier colours meet contrast in both themes
    Given the page is rendered in the "<theme>" theme
    When the computed styles of the tier tokens are read from the live page
    Then every tier label colour meets the WCAG AA contrast ratio against its background
    And every tier bar fill meets the WCAG non-text contrast ratio against the page background

    Examples:
      | theme |
      | light |
      | dark  |

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The document never scrolls horizontally
  @integration-exempt
  Scenario Outline: The document never scrolls horizontally
    Given the AI benchmark page is loaded at a "<width>" px viewport in the "<locale>" locale
    When the document's scroll width is compared with its client width
    Then the document scroll width does not exceed the document client width

    Examples:
      | width | locale |
      | 320   | en     |
      | 390   | en     |
      | 768   | en     |
      | 1280  | en     |
      | 1440  | en     |
      | 320   | id     |
      | 1440  | id     |

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Every interactive target meets the minimum target size
  @integration-exempt
  Scenario Outline: Every interactive target meets the minimum target size
    Given the AI benchmark page is loaded at a "<width>" px viewport
    When the bounding box of every link, form control, and disclosure control is measured
    Then every measured target is at least 24 CSS pixels wide and at least 24 CSS pixels tall

    Examples:
      | width |
      | 390   |
      | 1280  |

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Tier map label text never exceeds the page's body text size
  @integration-exempt
  Scenario: Tier map label text never exceeds the page's body text size
    Given the AI benchmark page is loaded at a 1440 px viewport
    When the computed font sizes of a tier map model label and the page body text are read from the live page
    Then the model label's computed font size is no larger than the page body text's computed font size
    And the model label's computed font size is at least 12 CSS pixels

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The substitute finder is visible above the fold on a phone
  @integration-exempt
  Scenario Outline: The substitute finder is visible above the fold on a phone
    Given the AI benchmark page is loaded at a "<width>" px wide, "<height>" px tall viewport
    When the vertical offset of the substitute finder is read from the live page
    Then that offset is less than the viewport height

    Examples:
      | width | height |
      | 320   | 568    |
      | 390   | 664    |

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The page behaves identically in both locales
  @integration-exempt
  Scenario Outline: The page behaves identically in both locales
    Given the AI benchmark page is loaded in the "<locale>" locale at a 390 px viewport
    When the page renders
    Then the substitute finder is present above the fold
    And every tier section is present
    And no raw translation key is rendered

    Examples:
      | locale |
      | en     |
      | id     |
