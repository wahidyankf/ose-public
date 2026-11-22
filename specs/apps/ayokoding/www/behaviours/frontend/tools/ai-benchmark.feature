# The page places coding models in capability tiers by consensus across independently run
# benchmarks, ranks them inside one benchmark by its raw operator scores, compares API prices,
# and suggests substitutes for frontier models from a chosen harness (Command Code Pro by
# default). No composite or average score is computed anywhere on the page.
Feature: AI model benchmark tool

  Background:
    Given the AI benchmark dataset is loaded

  # ── Consensus tiers ─────────────────────────────────────────────────────────

  # Behaviour: AYW-053
  # Exemption(integration): consensus assignment reads only in-memory benchmark data, so no database, file system, process, or network boundary exists here; alternative-proof: ayokoding-www:test:unit / The consensus tier is the tier the model holds on the most benchmarks
  @integration-exempt
  # Exemption(e2e): the served build has no input seam that accepts a fixture model, so the end-to-end level cannot supply this input; alternative-proof: ayokoding-www:test:unit / The consensus tier is the tier the model holds on the most benchmarks
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

  # Behaviour: AYW-053
  # Exemption(integration): the minimum-coverage rule reads only in-memory benchmark data, so no database, file system, process, or network boundary exists here; alternative-proof: ayokoding-www:test:unit / A model tiered on fewer than two benchmarks has insufficient data
  @integration-exempt
  # Exemption(e2e): the served build has no input seam that accepts a fixture model, so the end-to-end level cannot supply this input; alternative-proof: ayokoding-www:test:unit / A model tiered on fewer than two benchmarks has insufficient data
  @e2e-exempt
  Scenario: A model tiered on fewer than two benchmarks has insufficient data
    Given a fixture model holding a tier on only one benchmark
    When its consensus tier is assigned
    Then that model's consensus tier is "insufficient"
    And that model has no consensus count

  # Behaviour: AYW-053
  # Exemption(integration): consensus assignment reads only in-memory benchmark data, so no database, file system, process, or network boundary exists here; alternative-proof: ayokoding-www:test:unit / A model whose benchmarks split below half has no consensus tier
  @integration-exempt
  # Exemption(e2e): the served build has no input seam that accepts a fixture model, so the end-to-end level cannot supply this input; alternative-proof: ayokoding-www:test:unit / A model whose benchmarks split below half has no consensus tier
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

  # Behaviour: AYW-053
  Scenario: Models with no consensus tier are listed in their own closed disclosure
    Given the roster holds models whose benchmarks split below half
    And the AI benchmark page is open in the Consensus tiers view
    When the page renders
    Then those models are listed inside the closed no-consensus disclosure
    And those models appear in no tier section
    And the insufficient-data disclosure does not list them

  # Behaviour: AYW-053
  # Exemption(integration): consensus ordering reads only in-memory benchmark data, so no database, file system, process, or network boundary exists here; alternative-proof: ayokoding-www:test:unit / Models in one consensus section are ordered by consensus strength
  @integration-exempt
  # Exemption(e2e): the served build has no input seam that accepts a fixture model, so the end-to-end level cannot supply this input; alternative-proof: ayokoding-www:test:unit / Models in one consensus section are ordered by consensus strength
  @e2e-exempt
  Scenario: Models in one consensus section are ordered by consensus strength
    Given fixture models in the planning consensus tier agreeing on 2 of 4, 3 of 4, and 3 of 3 benchmarks
    When the planning consensus section is ordered
    Then the order is 3 of 4, then 3 of 3, then 2 of 4

  # ── Tiers ─────────────────────────────────────────────────────────────────────

  # Behaviour: AYW-053
  Scenario: Every roster model appears in exactly one tier section
    Given the full roster is loaded
    When the tier groups are computed
    Then each model appears in exactly one of "ultra", "planning", "execution", "fast", or "insufficient"

  # ── Price ─────────────────────────────────────────────────────────────────────

  # Behaviour: AYW-053
  # Exemption(integration): the blended price reads only in-memory benchmark data, so no database, file system, process, or network boundary exists here; alternative-proof: ayokoding-www:test:unit / The blended price weights input three to one against output
  @integration-exempt
  # Exemption(e2e): the served build has no input seam that accepts a fixture model, so the end-to-end level cannot supply this input; alternative-proof: ayokoding-www:test:unit / The blended price weights input three to one against output
  @e2e-exempt
  Scenario: The blended price weights input three to one against output
    Given a fixture model priced at 4 dollars input and 20 dollars output per million tokens
    When its blended price is computed
    Then the blended price is 8 dollars per million tokens

  # ── Substitute finder ─────────────────────────────────────────────────────────

  # Behaviour: AYW-054
  # Exemption(integration): substitute selection reads only in-memory benchmark data, so no database, file system, process, or network boundary exists here; alternative-proof: ayokoding-www:test:unit / Only chosen-harness models at the same or a higher tier are listed
  @integration-exempt
  # Exemption(e2e): the served build has no input seam that accepts a fixture model, so the end-to-end level cannot supply this input; alternative-proof: ayokoding-www:test:unit / Only chosen-harness models at the same or a higher tier are listed
  @e2e-exempt
  Scenario: Only chosen-harness models at the same or a higher tier are listed
    Given a frontier fixture model in the "planning" tier
    And fixture models of the "command-code-pro" harness in the "ultra", "planning", and "execution" tiers and one with insufficient data
    And fixture models of the "opencode-go" harness in the "ultra" and "planning" tiers
    When substitutes are listed for the frontier model from the "command-code-pro" harness
    Then the substitutes are only the "ultra" and "planning" models of the "command-code-pro" harness

  # Behaviour: AYW-054
  # Exemption(integration): substitute ordering reads only in-memory benchmark data, so no database, file system, process, or network boundary exists here; alternative-proof: ayokoding-www:test:unit / Substitutes are ordered best first
  @integration-exempt
  # Exemption(e2e): the served build has no input seam that accepts a fixture model, so the end-to-end level cannot supply this input; alternative-proof: ayokoding-www:test:unit / Substitutes are ordered best first
  @e2e-exempt
  Scenario: Substitutes are ordered best first
    Given a frontier fixture model in the "planning" tier
    And fixture models of the "command-code-pro" harness in the "ultra", "planning", and "execution" tiers and one with insufficient data
    And fixture models of the "opencode-go" harness in the "ultra" and "planning" tiers
    When substitutes are listed for the frontier model from the "command-code-pro" harness
    Then the substitutes are ordered by consensus tier from highest to lowest, then by consensus strength

  # Behaviour: AYW-054
  Scenario: The substitute finder offers three harnesses with Command Code Pro chosen first
    Given the AI benchmark page is open
    When the reader looks at the substitute finder's harness choice
    Then it offers "Command Code Pro", "Command Code", and "OpenCode Go" in that order
    And "Command Code Pro" is chosen by default

  # Behaviour: AYW-054
  Scenario: Choosing a frontier model lists its Command Code Pro substitutes with a price comparison
    Given the AI benchmark page is open
    When the reader chooses a frontier model that has Command Code Pro models in its tier or higher
    Then the finder lists Command Code Pro models with their consensus tier, consensus count, and blended price
    And each listed model states how its blended price compares with the chosen model's

  # Behaviour: AYW-054
  Scenario: A frontier model above every model of the chosen harness shows the nearest options
    Given the AI benchmark page is open
    When the reader chooses a harness and a frontier model whose tier is above every model of that harness
    Then the finder states that no model of that harness reaches that model's tier
    And the finder lists the highest-scoring models of that harness as the nearest options

  # Behaviour: AYW-054
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

  # Behaviour: AYW-054
  # Behaviour: AYW-055
  Scenario: The chosen substitute target, substitute harness, and score basis are kept in the URL
    Given the AI benchmark page is open
    When the reader chooses "GPT-5.6 Terra" in the substitute finder
    Then the URL carries that model as the substitute target
    And reloading that URL shows the same substitute list
    When the reader changes the finder's harness to "Command Code"
    Then the URL carries that harness as the substitute harness
    And reloading that URL shows the same harness and the same substitute list
    When the reader changes the score basis to "Terminal-Bench"
    Then the URL carries that benchmark as the score basis
    And reloading that URL shows the same per-benchmark ranking

  # Behaviour: AYW-054
  # Behaviour: AYW-055
  Scenario Outline: An unrecognized URL parameter value falls back to the default
    Given the URL carries the "<key>" parameter with an unknown value
    When the page renders
    Then the "<control>" falls back to its default
    But no error is surfaced to the reader

    Examples:
      | control            | key         |
      | substitute harness | sub-harness |
      | harness filter     | harness     |
      | score basis        | benchmark   |

  # ── Page header and dates ─────────────────────────────────────────────────────

  # Behaviour: AYW-053
  # Behaviour: AYW-056
  Scenario Outline: The AI benchmark page renders fully in both locales
    Given the AI benchmark page is loaded in the "<locale>" locale at a 390 px viewport
    When the AI benchmark page renders
    Then the page shows a level-one heading in "<language>"
    And the document language attribute is "<locale>"
    And the substitute finder is present above the fold
    And every tier section is present
    And no rendered text matches a raw translation key
    And no raw translation key is rendered

    Examples:
      | locale | language   |
      | en     | English    |
      | id     | Indonesian |

  # Behaviour: AYW-053
  Scenario: The last-updated date is shown before the substitute finder
    Given the dataset carries a last-updated date
    And the AI benchmark page is open
    When the page renders
    Then the last-updated date is shown in text
    And the last-updated date precedes the substitute finder in document order

  # Behaviour: AYW-053
  Scenario: The page states that only independent results are scored
    Given the AI benchmark page is open
    When the page renders
    Then a line stating that only independently run results are scored is visible without interaction
    And that line states that vendor-reported results are excluded

  # ── Tier map ──────────────────────────────────────────────────────────────────

  # Behaviour: AYW-053
  Scenario: Each consensus tier section states the consensus rule
    Given the full roster is loaded
    When the tier map is rendered in the Consensus tiers view
    Then every tier section states that its models hold that tier on the most benchmarks
    And no tier section names a composite anchor or a composite floor score

  # Behaviour: AYW-053
  Scenario: Every rated model row shows its bar, consensus count, and API price in text
    Given the full roster is loaded
    When the tier map is rendered in the Consensus tiers view
    Then every rated model row carries the model name and its consensus count in text
    And every rated model row carries one capability bar
    And every rated model row carries its input and output API price in text, or states that no public API price exists
    But no rated model row shows a composite index

  # Behaviour: AYW-053
  Scenario: Bar length is proportional to the agreeing count
    Given two rated models agreeing on different numbers of benchmarks
    When the tier map is rendered in the Consensus tiers view
    Then the ratio of their bar lengths equals the ratio of their agreeing counts out of all benchmarks

  # Behaviour: AYW-053
  Scenario: The tier is carried in text, not by colour alone
    Given the full roster is loaded
    When the tier map is rendered
    Then every tier section has a text heading naming its tier

  # Behaviour: AYW-053
  Scenario: A limited-access model is labelled
    Given the roster holds a model with limited access
    When the tier map is rendered
    Then that model's row carries a limited-access label in text

  # Behaviour: AYW-053
  Scenario: Models with insufficient data are listed in a collapsed section
    Given the roster holds models scored on fewer than two benchmarks
    And the AI benchmark page is open
    When the page renders
    Then those models are listed inside a closed disclosure
    And each listed model shows whatever independent scores it has

  # ── Data table ────────────────────────────────────────────────────────────────

  # Behaviour: AYW-056
  Scenario: The data table is present without any interaction
    Given the full roster is loaded
    When the page first renders
    Then a data table is present in the document
    And the table has a caption
    And every table header cell declares a scope

  # Behaviour: AYW-056
  Scenario: The table lists every model's scores, tier, and prices
    Given the full roster is loaded
    When the data table is rendered
    Then each model row lists the tier of the active view, every benchmark score, input price, output price, and blended price

  # Behaviour: AYW-056
  Scenario: Every benchmark score names and links its operator
    Given the full roster is loaded
    When the data table is rendered
    Then every benchmark score cell names the operator that ran it
    And every benchmark score cell links to its source

  # Behaviour: AYW-056
  Scenario: Cost per task is shown where an independent operator publishes it
    Given a model whose independent operator publishes a cost per task
    And the AI benchmark page is open
    When the data table is rendered
    Then that model's row shows its cost per task in dollars

  # ── Methodology ───────────────────────────────────────────────────────────────

  # Behaviour: AYW-056
  Scenario: The methodology lists every benchmark, the roster, the operator order, and the consensus minimum
    Given the AI benchmark page is open
    When the reader opens the methodology section
    Then it lists every benchmark with its version
    And it states which models the roster covers
    And it states the operator order used to pick each figure
    And it states the minimum number of benchmarks needed for a consensus tier
    And it states that no average or composite score is computed

  # Behaviour: AYW-056
  Scenario: The methodology states the consensus rule
    Given the AI benchmark page is open
    When the reader opens the methodology section
    Then it states that a model's consensus tier is the tier it holds on the most benchmarks
    And it states that a consensus tie goes to the highest tied tier
    And it states that a tier needs at least half of the model's tiered benchmarks to agree, and a model below half has no consensus tier
    And it states that models are ordered inside a tier by how many benchmarks agree, then by how many benchmarks rated the model

  # Behaviour: AYW-056
  Scenario: The page lists every operator with its checked date and terms
    Given the dataset names its benchmark operators and price sources
    And the AI benchmark page is open
    When the page renders
    Then a sources section lists every named operator
    And each operator entry states the date it was last checked
    And each operator entry states how its figures are cited

  # ── Filters ───────────────────────────────────────────────────────────────────

  # Behaviour: AYW-055
  Scenario: The page with no query parameters shows the whole roster
    Given the URL carries no query parameters
    When the page renders
    Then every roster model is shown in the data table

  # Behaviour: AYW-055
  Scenario: A harness parameter narrows the tier map and the table
    Given the URL carries a harness parameter naming a known harness
    When the page renders
    Then only models that harness exposes are shown in the tier map
    And only models that harness exposes are shown in the data table

  # Behaviour: AYW-055
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

  # Behaviour: AYW-055
  Scenario Outline: A tier parameter narrows the results to that tier
    Given the URL carries "<query>"
    When the page renders
    Then only models in that tier are shown in the "<view>"
    And only models in that tier are shown in the data table

    Examples:
      | query                            | view                |
      | tier=planning                    | tier map            |
      | benchmark=deep-swe&tier=planning | DeepSWE ranked list |

  # Behaviour: AYW-055
  Scenario: Harness and tier parameters intersect
    Given the URL carries both a harness parameter and a tier parameter
    When the page renders
    Then only models satisfying both filters are shown

  # Behaviour: AYW-055
  Scenario: A duplicated query parameter resolves to its first value
    Given the URL carries the harness parameter twice with two different known harness values
    When the page renders
    Then the filter uses the first of the two values

  # Behaviour: AYW-055
  Scenario Outline: Resetting a control removes its parameter from the URL
    Given the URL carries "<query>"
    When the reader resets the "<control>" to its default
    Then the URL no longer carries the "<parameter>" parameter
    And the URL keeps its other parameters
    And the "<control>" shows its default

    Examples:
      | query                              | control     | parameter |
      | harness=opencode-go&tier=execution | tier filter | tier      |
      | benchmark=deep-swe                 | score basis | benchmark |

  # Behaviour: AYW-055
  Scenario: A filter combination matching no model renders an explicit empty state
    Given the URL carries a filter combination that matches no model
    When the page renders
    Then an explicit empty-state message is shown
    But the tier map and the data table do not render

  # ── Score basis (consensus tiers vs per-benchmark) ────────────────────────

  # Behaviour: AYW-055
  Scenario: The score basis defaults to the consensus tiers
    Given the URL carries no benchmark parameter
    When the page renders
    Then the tier map groups models by consensus tier
    And the score basis control shows "Consensus tiers"

  # Behaviour: AYW-055
  # Exemption(integration): per-benchmark ranking reads only in-memory benchmark data, so no database, file system, process, or network boundary exists here; alternative-proof: ayokoding-www:test:unit / Naming a benchmark ranks models by its raw score
  @integration-exempt
  # Exemption(e2e): the served build has no input seam that accepts a fixture model, so the end-to-end level cannot supply this input; alternative-proof: ayokoding-www:test:unit / Naming a benchmark ranks models by its raw score
  @e2e-exempt
  Scenario: Naming a benchmark ranks models by its raw score
    Given fixture models scoring 60, 80, and 70 on DeepSWE 1.1
    When the models are ranked for the DeepSWE score basis
    Then the ranked order is 80, 70, then 60
    And each shown score equals that model's DeepSWE figure with no normalization

  # Behaviour: AYW-055
  # Exemption(integration): figure selection reads only in-memory benchmark data, so no database, file system, process, or network boundary exists here; alternative-proof: ayokoding-www:test:unit / Only the pinned version counts in a per-benchmark view
  @integration-exempt
  # Exemption(e2e): the served build has no input seam that accepts a fixture model, so the end-to-end level cannot supply this input; alternative-proof: ayokoding-www:test:unit / Only the pinned version counts in a per-benchmark view
  @e2e-exempt
  Scenario: Only the pinned version counts in a per-benchmark view
    Given a fixture model scoring 90 on Terminal-Bench 2.1 with no Terminal-Bench 4.0 figure
    When the models are ranked for the Terminal-Bench score basis
    Then that model is unranked

  # Behaviour: AYW-055
  Scenario: Models without a score on the chosen benchmark are listed as unranked
    Given the roster holds models with no scored FrontierCode-AA figure
    And the URL carries a benchmark parameter naming FrontierCode-AA
    When the page renders
    Then those models are listed inside the closed unranked disclosure
    And the ranked list holds only models with a scored FrontierCode-AA figure in descending raw-score order

  # Behaviour: AYW-055
  Scenario: The methodology explains the per-benchmark view
    Given the AI benchmark page is open
    When the reader opens the methodology section
    Then it names the five score basis options: the consensus tiers and the four benchmarks
    And it states that a per-benchmark view shows raw operator figures with no normalization
    And it states that models without a scored figure on the chosen benchmark are unranked

  # ── Per-benchmark tiers ───────────────────────────────────────────────────

  # Behaviour: AYW-055
  # Exemption(integration): per-benchmark tier assignment reads only in-memory benchmark data, so no database, file system, process, or network boundary exists here; alternative-proof: ayokoding-www:test:unit / A model is placed in the highest per-benchmark tier whose anchor it meets on that benchmark
  @integration-exempt
  # Exemption(e2e): the served build has no input seam that accepts a fixture model, so the end-to-end level cannot supply this input; alternative-proof: ayokoding-www:test:unit / A model is placed in the highest per-benchmark tier whose anchor it meets on that benchmark
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

  # Behaviour: AYW-055
  Scenario: Per-benchmark tier sections name their benchmark anchor and floor
    Given the URL carries a benchmark parameter naming Terminal-Bench
    When the page renders
    Then the ultra, planning, and execution sections each name their Terminal-Bench anchor model
    And each of those sections states its floor as a raw Terminal-Bench score
    And the fast section states that it holds models below the Terminal-Bench execution floor

  # Behaviour: AYW-055
  Scenario: The methodology lists every benchmark's tier anchors
    Given the AI benchmark page is open
    When the reader opens the methodology section
    Then it lists every benchmark with its ultra, planning, and execution anchor and floor score
    And it states that a per-benchmark tier compares raw scores on that benchmark only

  # ── Accessibility and layout ──────────────────────────────────────────────────

  # Behaviour: AYW-053
  # jsdom cannot resolve `oklch()` custom properties through a cascade, so the rasterized contrast
  # assertion runs in the browser; the unit binding verifies every tier is wired to its tokens.
  Scenario Outline: Tier colours meet contrast in both themes
    Given the page is rendered in the "<theme>" theme
    When the computed styles of the tier tokens are read from the live page
    Then every tier label colour meets the WCAG AA contrast ratio against its background
    And every tier bar fill meets the WCAG non-text contrast ratio against the page background

    Examples:
      | theme |
      | light |
      | dark  |

  # Behaviour: AYW-053
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

  # Behaviour: AYW-053
  Scenario Outline: Every interactive target meets the minimum target size
    Given the AI benchmark page is loaded at a "<width>" px viewport
    When the bounding box of every link, form control, and disclosure control is measured
    Then every measured target is at least 24 CSS pixels wide and at least 24 CSS pixels tall

    Examples:
      | width |
      | 390   |
      | 1280  |

  # Behaviour: AYW-053
  Scenario: Tier map label text never exceeds the page's body text size
    Given the AI benchmark page is loaded at a 1440 px viewport
    When the computed font sizes of a tier map model label and the page body text are read from the live page
    Then the model label's computed font size is no larger than the page body text's computed font size
    And the model label's computed font size is at least 12 CSS pixels

  # Behaviour: AYW-053
  Scenario Outline: The substitute finder is visible above the fold on a phone
    Given the AI benchmark page is loaded at a "<width>" px wide, "<height>" px tall viewport
    When the vertical offset of the substitute finder is read from the live page
    Then that offset is less than the viewport height

    Examples:
      | width | height |
      | 320   | 568    |
      | 390   | 664    |
