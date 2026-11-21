Feature: Toggle component

  # Behaviour: WUI-009
  Scenario Outline: A toggle reports its on or off state
    When I render a Toggle with value <value>
    Then the toggle switch should have aria-checked "<checked>"

    Examples:
      | value | checked |
      | false | false   |
      | true  | true    |

  # Behaviour: WUI-009
  Scenario: Click triggers onChange
    Given I render a Toggle with value false
    When the user clicks the toggle
    Then onChange should be called with true

  # Behaviour: WUI-009
  Scenario: Disabled toggle does not trigger onChange
    Given I render a Toggle with value false and disabled
    When the user clicks the toggle
    Then onChange should not be called

  # Behaviour: WUI-009
  Scenario: Renders with label
    When I render a Toggle with value false and label "Enable notifications"
    Then the label "Enable notifications" should be visible

  # Behaviour: WUI-048
  Scenario: A toggle is operable with the Space key
    Given I render a Toggle with value false
    When the user presses Space on the toggle
    Then onChange should be called with true
