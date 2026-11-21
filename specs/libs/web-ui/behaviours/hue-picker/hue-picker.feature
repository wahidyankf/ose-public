Feature: HuePicker component

  # Behaviour: WUI-013
  Scenario: Renders 6 swatches
    When I render a HuePicker with value "teal"
    Then the component should have 6 swatch buttons

  # Behaviour: WUI-013
  Scenario: Click calls onChange
    Given I render a HuePicker with value "teal"
    When the user clicks the "sage" swatch
    Then onChange should be called with "sage"

  # Behaviour: WUI-013
  Scenario: aria-pressed reflects selection
    When I render a HuePicker with value "teal"
    Then the "teal" swatch should have aria-pressed "true"
    And the "sage" swatch should have aria-pressed "false"

  # Behaviour: WUI-014
  Scenario: HUES lists the six hues terracotta, honey, sage, teal, sky, plum in that order
    When I read the HUES list
    Then the list should be "terracotta, honey, sage, teal, sky, plum"
