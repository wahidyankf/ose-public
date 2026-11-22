# The page places coding models in capability tiers by consensus across independently run
# benchmarks, ranks them inside one benchmark by its raw operator scores, compares API prices,
# and suggests substitutes for frontier models from a chosen harness (Command Code Pro by
# default). No composite or average score is computed anywhere on the page.
Feature: AI model benchmark tool

  Background:
    Given the AI benchmark dataset is loaded

  # ── Consensus tiers ─────────────────────────────────────────────────────────

  # Exemption(integration): consensus assignment is pure in-process logic with no local-resource boundary; alternative-proof: ayokoding-www:test:unit / The consensus tier is the tier the model holds on the most benchmarks
  @integration-exempt
  # Exemption(e2e): fixture per-benchmark tiers are private scoring inputs with no public browser control; alternative-proof: ayokoding-www:test:unit / The consensus tier is the tier the model holds on the most benchmarks
  @e2e-exempt
  Scenario Outline: The consensus tier is the tier the model holds on the most benchmarks
    Given a fixture model holding "<deepSwe>", "<terminalBench>", "<sweAtlas>", and "<frontierCode>" tiers on the four benchmarks
    When its consensus tier is assigned
    Then that model's consensus tier is "<tier>"
    And its consensus count is <agreeing> of <considered> benchmarks

    Examples:
      | deepSwe  | terminalBench | sweAtlas | frontierCode | tier      | agreeing | considered |
      | ultra    | ultra         | planning | execution    | ultra     | 2        | 4          |
      | planning | planning      | ultra    | execution    | planning  | 2        | 4          |
      | ultra    | ultra         | planning | planning     | ultra     | 2        | 4          |
      | planning | ultra         | planning | ultra        | ultra     | 2        | 4          |
      | fast     | fast          | fast     | planning     | fast      | 3        | 4          |
      | ultra    | ultra         | unranked | unranked     | ultra     | 2        | 2          |
      | ultra    | planning      | unranked | unranked     | ultra     | 1        | 2          |

  # Exemption(integration): the minimum-coverage rule is pure in-process logic with no local-resource boundary; alternative-proof: ayokoding-www:test:unit / A model tiered on fewer than two benchmarks has insufficient data
  @integration-exempt
  # Exemption(e2e): the single-benchmark fixture is a private scoring input with no public browser control; alternative-proof: ayokoding-www:test:unit / A model tiered on fewer than two benchmarks has insufficient data
  @e2e-exempt
  Scenario: A model tiered on fewer than two benchmarks has insufficient data
    Given a fixture model holding a tier on only one benchmark
    When its consensus tier is assigned
    Then that model's consensus tier is "insufficient"
    And that model has no consensus count

  # Exemption(integration): consensus assignment is pure in-process logic with no local-resource boundary; alternative-proof: ayokoding-www:test:unit / A model whose benchmarks split below half has no consensus tier
  @integration-exempt
  # Exemption(e2e): fixture per-benchmark tiers are private scoring inputs with no public browser control; alternative-proof: ayokoding-www:test:unit / A model whose benchmarks split below half has no consensus tier
  @e2e-exempt
  Scenario Outline: A model whose benchmarks split below half has no consensus tier
    Given a fixture model holding "<deepSwe>", "<terminalBench>", "<sweAtlas>", and "<frontierCode>" tiers on the four benchmarks
    When its consensus tier is assigned
    Then that model has no consensus tier
    And that model is not in the insufficient group

    Examples:
      | deepSwe | terminalBench | sweAtlas  | frontierCode |
      | ultra   | planning      | execution | unranked     |
      | ultra   | planning      | execution | fast         |

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Models with no consensus tier are listed in their own closed disclosure
  @integration-exempt
  Scenario: Models with no consensus tier are listed in their own closed disclosure
    Given the roster holds models whose benchmarks split below half
    And the AI benchmark page is open in the Consensus tiers view
    When the page renders
    Then those models are listed inside the closed no-consensus disclosure
    And those models appear in no tier section
    And the insufficient-data disclosure does not list them

  # Exemption(integration): consensus ordering is pure in-process logic with no local-resource boundary; alternative-proof: ayokoding-www:test:unit / Models in one consensus section are ordered by consensus strength
  @integration-exempt
  # Exemption(e2e): fixture consensus counts are private scoring inputs with no public browser control; alternative-proof: ayokoding-www:test:unit / Models in one consensus section are ordered by consensus strength
  @e2e-exempt
  Scenario: Models in one consensus section are ordered by consensus strength
    Given fixture models in the planning consensus tier agreeing on 2 of 4, 3 of 4, and 3 of 3 benchmarks
    When the planning consensus section is ordered
    Then the order is 3 of 4, then 3 of 3, then 2 of 4

  # ── Tiers ─────────────────────────────────────────────────────────────────────

  # Exemption(integration): the roster invariant is pure in-process data validation with no local-resource boundary; alternative-proof: ayokoding-www:test:unit / Every tier anchor is a previous-generation model with general access
  @integration-exempt
  # Exemption(e2e): model lines and release dates are dataset fields with no public browser control; alternative-proof: ayokoding-www:test:unit / Every tier anchor is a previous-generation model with general access
  @e2e-exempt
  Scenario: Every tier anchor is a previous-generation model with general access
    Given the full roster is loaded
    When the tier anchors are inspected
    Then every tier anchor has general access
    And every tier anchor has a newer model from the same vendor in the roster

  # Exemption(integration): the roster invariant is pure in-process data validation with no local-resource boundary; alternative-proof: ayokoding-www:test:unit / Every listed harness's in-house model line is in the roster
  @integration-exempt
  # Exemption(e2e): the set of in-house model lines is a dataset constant with no public browser control; alternative-proof: ayokoding-www:test:unit / Every listed harness's in-house model line is in the roster
  @e2e-exempt
  Scenario: Every listed harness's in-house model line is in the roster
    Given the full roster is loaded
    When the in-house model lines of the listed harnesses are inspected
    Then each in-house model line has at least one model in the roster
    And each of those models is offered in its own harness

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

  # Exemption(integration): substitute selection is pure in-process logic with no local-resource boundary; alternative-proof: ayokoding-www:test:unit / Substitutes are models of the chosen harness in the same or a higher tier
  @integration-exempt
  # Exemption(e2e): the fixture roster is a private input with no public browser control; alternative-proof: ayokoding-www:test:unit / Substitutes are models of the chosen harness in the same or a higher tier
  @e2e-exempt
  Scenario: Substitutes are models of the chosen harness in the same or a higher tier
    Given a frontier fixture model in the "planning" tier
    And fixture models of the "command-code-pro" harness in the "ultra", "planning", and "execution" tiers and one with insufficient data
    And fixture models of the "opencode-go" harness in the "ultra" and "planning" tiers
    When substitutes are listed for the frontier model from the "command-code-pro" harness
    Then the substitutes are only the "ultra" and "planning" models of the "command-code-pro" harness
    And the substitutes are ordered by consensus tier from highest to lowest, then by consensus strength

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The substitute finder offers three harnesses with Command Code Pro chosen first
  @integration-exempt
  Scenario: The substitute finder offers three harnesses with Command Code Pro chosen first
    Given the AI benchmark page is open
    When the reader looks at the substitute finder's harness choice
    Then it offers "Command Code Pro", "Command Code", and "OpenCode Go" in that order
    And "Command Code Pro" is chosen by default

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Choosing a frontier model lists its Command Code Pro substitutes with a price comparison
  @integration-exempt
  Scenario: Choosing a frontier model lists its Command Code Pro substitutes with a price comparison
    Given the AI benchmark page is open
    When the reader chooses a frontier model that has Command Code Pro models in its tier or higher
    Then the finder lists Command Code Pro models with their consensus tier, consensus count, and blended price
    And each listed model states how its blended price compares with the chosen model's

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A frontier model above every model of the chosen harness shows the nearest options
  @integration-exempt
  Scenario: A frontier model above every model of the chosen harness shows the nearest options
    Given the AI benchmark page is open
    When the reader chooses a harness and a frontier model whose tier is above every model of that harness
    Then the finder states that no model of that harness reaches that model's tier
    And the finder lists the highest-scoring models of that harness as the nearest options

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Changing the finder's harness lists that harness's models
  @integration-exempt
  Scenario Outline: Changing the finder's harness lists that harness's models
    Given the AI benchmark page is open
    When the reader chooses "GPT-5.6 Terra" in the substitute finder
    And the reader changes the finder's harness to "<harness>"
    Then the finder lists only "<harness>" models
    And the finder's lead line names "<harness>"

    Examples:
      | harness      |
      | Command Code |
      | OpenCode Go  |

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The chosen substitute target is kept in the URL
  @integration-exempt
  Scenario: The chosen substitute target is kept in the URL
    Given the AI benchmark page is open
    When the reader chooses "GPT-5.6 Terra" in the substitute finder
    Then the URL carries that model as the substitute target
    And reloading that URL shows the same substitute list

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The chosen substitute harness is kept in the URL
  @integration-exempt
  Scenario: The chosen substitute harness is kept in the URL
    Given the AI benchmark page is open
    When the reader chooses "GPT-5.6 Terra" in the substitute finder
    And the reader changes the finder's harness to "Command Code"
    Then the URL carries that harness as the substitute harness
    And reloading that URL shows the same harness and the same substitute list

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / An unrecognized substitute harness falls back to Command Code Pro
  @integration-exempt
  Scenario: An unrecognized substitute harness falls back to Command Code Pro
    Given the URL carries a substitute harness parameter with an unknown value
    When the page renders
    Then the finder's harness is "Command Code Pro"
    But no error is surfaced to the reader

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
    And the AI benchmark page is open
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

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Each consensus tier section states the consensus rule
  @integration-exempt
  Scenario: Each consensus tier section states the consensus rule
    Given the full roster is loaded
    When the tier map is rendered in the Consensus tiers view
    Then every tier section states that its models hold that tier on the most benchmarks
    And no tier section names a composite anchor or a composite floor score

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Every rated model row shows its bar, consensus count, and API price in text
  @integration-exempt
  Scenario: Every rated model row shows its bar, consensus count, and API price in text
    Given the full roster is loaded
    When the tier map is rendered in the Consensus tiers view
    Then every rated model row carries the model name and its consensus count in text
    And every rated model row carries one capability bar
    And every rated model row carries its input and output API price in text, or states that no public API price exists
    But no rated model row shows a composite index

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Bar length is proportional to the agreeing count
  @integration-exempt
  Scenario: Bar length is proportional to the agreeing count
    Given two rated models agreeing on different numbers of benchmarks
    When the tier map is rendered in the Consensus tiers view
    Then the ratio of their bar lengths equals the ratio of their agreeing counts out of all benchmarks

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
    And the AI benchmark page is open
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
    Then each model row lists the tier of the active view, every benchmark score, input price, output price, and blended price

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
    And the AI benchmark page is open
    When the data table is rendered
    Then that model's row shows its cost per task in dollars

  # ── Methodology ───────────────────────────────────────────────────────────────

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The page explains how the score is calculated
  @integration-exempt
  Scenario: The page explains how the score is calculated
    Given the AI benchmark page is open
    When the reader opens the methodology section
    Then it lists every benchmark with its version
    And it states which models the roster covers
    And it states the operator order used to pick each figure
    And it states the minimum number of benchmarks needed for a consensus tier
    And it states that no average or composite score is computed

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The methodology states the consensus rule
  @integration-exempt
  Scenario: The methodology states the consensus rule
    Given the AI benchmark page is open
    When the reader opens the methodology section
    Then it states that a model's consensus tier is the tier it holds on the most benchmarks
    And it states that a consensus tie goes to the highest tied tier
    And it states that a tier needs at least half of the model's tiered benchmarks to agree, and a model below half has no consensus tier
    And it states that models are ordered inside a tier by how many benchmarks agree, then by how many benchmarks rated the model

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The page lists every operator with its checked date and terms
  @integration-exempt
  Scenario: The page lists every operator with its checked date and terms
    Given the dataset names its benchmark operators and price sources
    And the AI benchmark page is open
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

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Every listed harness is a known harness parameter value
  @integration-exempt
  Scenario Outline: Every listed harness is a known harness parameter value
    Given the URL carries the harness parameter "<harness>"
    When the page renders
    Then the harness filter shows "<name>"
    And the result count equals the number of models that harness exposes

    Examples:
      | harness          | name             |
      | claude-code      | Claude Code      |
      | codex-cli        | Codex CLI        |
      | command-code     | Command Code     |
      | command-code-pro | Command Code Pro |
      | cursor           | Cursor           |
      | opencode-go      | OpenCode Go      |
      | opencode-zen     | OpenCode Zen     |

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

  # ── Score basis (consensus tiers vs per-benchmark) ────────────────────────

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The score basis defaults to the consensus tiers
  @integration-exempt
  Scenario: The score basis defaults to the consensus tiers
    Given the URL carries no benchmark parameter
    When the page renders
    Then the tier map groups models by consensus tier
    And the score basis control shows "Consensus tiers"

  # Exemption(integration): per-benchmark ranking is pure in-process logic with no local-resource boundary; alternative-proof: ayokoding-www:test:unit / Naming a benchmark ranks models by its raw score
  @integration-exempt
  # Exemption(e2e): fixture figures are private scoring inputs with no public browser control; alternative-proof: ayokoding-www:test:unit / Naming a benchmark ranks models by its raw score
  @e2e-exempt
  Scenario: Naming a benchmark ranks models by its raw score
    Given fixture models scoring 60, 80, and 70 on DeepSWE 1.1
    When the models are ranked for the DeepSWE score basis
    Then the ranked order is 80, 70, then 60
    And each shown score equals that model's DeepSWE figure with no normalization

  # Exemption(integration): figure selection is pure in-process logic with no local-resource boundary; alternative-proof: ayokoding-www:test:unit / Only the pinned version counts in a per-benchmark view
  @integration-exempt
  # Exemption(e2e): a wrongly versioned fixture figure cannot be injected through the public page; alternative-proof: ayokoding-www:test:unit / Only the pinned version counts in a per-benchmark view
  @e2e-exempt
  Scenario: Only the pinned version counts in a per-benchmark view
    Given a fixture model scoring 90 on Terminal-Bench 2.1 with no Terminal-Bench 4.0 figure
    When the models are ranked for the Terminal-Bench score basis
    Then that model is unranked

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Models without a score on the chosen benchmark are listed as unranked
  @integration-exempt
  Scenario: Models without a score on the chosen benchmark are listed as unranked
    Given the roster holds models with no scored FrontierCode-AA figure
    And the URL carries a benchmark parameter naming FrontierCode-AA
    When the page renders
    Then those models are listed inside the closed unranked disclosure
    And the ranked list holds only models with a scored FrontierCode-AA figure in descending raw-score order

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / An unrecognized benchmark falls back to the consensus tiers
  @integration-exempt
  Scenario: An unrecognized benchmark falls back to the consensus tiers
    Given the URL carries a benchmark parameter with an unknown value
    When the page renders
    Then the tier map groups models by consensus tier
    But no error is surfaced to the reader

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The chosen benchmark is kept in the URL
  @integration-exempt
  Scenario: The chosen benchmark is kept in the URL
    Given the AI benchmark page is open
    When the reader changes the score basis to "Terminal-Bench"
    Then the URL carries that benchmark as the score basis
    And reloading that URL shows the same per-benchmark ranking

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Resetting the score basis to Consensus tiers removes it from the URL
  @integration-exempt
  Scenario: Resetting the score basis to Consensus tiers removes it from the URL
    Given the URL carries a benchmark parameter naming a known benchmark
    When the reader resets the score basis to "Consensus tiers"
    Then the URL no longer carries the benchmark parameter
    And the tier map groups models by consensus tier

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The methodology explains the per-benchmark view
  @integration-exempt
  Scenario: The methodology explains the per-benchmark view
    Given the AI benchmark page is open
    When the reader opens the methodology section
    Then it names the five score basis options: the consensus tiers and the four benchmarks
    And it states that a per-benchmark view shows raw operator figures with no normalization
    And it states that models without a scored figure on the chosen benchmark are unranked

  # ── Per-benchmark tiers ───────────────────────────────────────────────────

  # Exemption(integration): per-benchmark tier assignment is pure in-process logic with no local-resource boundary; alternative-proof: ayokoding-www:test:unit / A model is placed in the highest per-benchmark tier whose anchor it meets on that benchmark
  @integration-exempt
  # Exemption(e2e): the fixture anchors and model figures are private scoring inputs with no public browser control; alternative-proof: ayokoding-www:test:unit / A model is placed in the highest per-benchmark tier whose anchor it meets on that benchmark
  @e2e-exempt
  Scenario Outline: A model is placed in the highest per-benchmark tier whose anchor it meets on that benchmark
    Given fixture DeepSWE anchors scoring 60 for ultra, 55 for planning, and 45 for execution
    And a fixture model scoring <score> on DeepSWE 1.1
    When its DeepSWE tier is assigned
    Then that model's DeepSWE tier is "<tier>"

    Examples:
      | score | tier      |
      | 61    | ultra     |
      | 60    | ultra     |
      | 57    | planning  |
      | 45    | execution |
      | 30    | fast      |

  # Exemption(integration): the roster invariant is pure in-process data validation with no local-resource boundary; alternative-proof: ayokoding-www:test:unit / Every benchmark has descending per-benchmark anchor floors
  @integration-exempt
  # Exemption(e2e): anchor sets are dataset constants with no public browser control; alternative-proof: ayokoding-www:test:unit / Every benchmark has descending per-benchmark anchor floors
  @e2e-exempt
  Scenario: Every benchmark has descending per-benchmark anchor floors
    Given the full roster is loaded
    When the per-benchmark tier anchors are inspected
    Then every benchmark names an ultra, a planning, and an execution anchor
    And every anchor is a general-access model with a scored figure on that benchmark
    And every anchor has a newer model from the same vendor in the roster
    And on every benchmark the ultra floor is above the planning floor, which is above the execution floor

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Each per-benchmark anchor lands in the tier it defines on its benchmark
  @integration-exempt
  Scenario: Each per-benchmark anchor lands in the tier it defines on its benchmark
    Given the full roster is loaded
    When every model's tier is assigned on DeepSWE
    Then the DeepSWE ultra anchor is in the "ultra" tier on DeepSWE
    And the DeepSWE planning anchor is in the "planning" tier on DeepSWE
    And the DeepSWE execution anchor is in the "execution" tier on DeepSWE

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Per-benchmark tier sections name their benchmark anchor and floor
  @integration-exempt
  Scenario: Per-benchmark tier sections name their benchmark anchor and floor
    Given the URL carries a benchmark parameter naming Terminal-Bench
    When the page renders
    Then the ultra, planning, and execution sections each name their Terminal-Bench anchor model
    And each of those sections states its floor as a raw Terminal-Bench score
    And the fast section states that it holds models below the Terminal-Bench execution floor

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A tier parameter in a per-benchmark view narrows to that benchmark's tier
  @integration-exempt
  Scenario: A tier parameter in a per-benchmark view narrows to that benchmark's tier
    Given the URL carries a benchmark parameter naming DeepSWE and a tier parameter naming a known tier
    When the page renders
    Then only models in that tier on DeepSWE are shown in the ranked list
    And only models in that tier on DeepSWE are shown in the data table

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The methodology lists every benchmark's tier anchors
  @integration-exempt
  Scenario: The methodology lists every benchmark's tier anchors
    Given the AI benchmark page is open
    When the reader opens the methodology section
    Then it lists every benchmark with its ultra, planning, and execution anchor and floor score
    And it states that a per-benchmark tier compares raw scores on that benchmark only

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
