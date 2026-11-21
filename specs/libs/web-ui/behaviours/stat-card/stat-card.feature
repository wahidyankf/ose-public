Feature: StatCard component

  # Behaviour: WUI-016
  Scenario: Renders label and value
    When I render a StatCard with label "Steps" value "12500" unit "steps" hue "teal" icon "trend"
    Then the text "Steps" should be visible
    And the text "12500" should be visible
    And the text "steps" should be visible

  # Behaviour: WUI-016
  Scenario Outline: A stat card shows an info tip only when it has info
    When I render a StatCard with label "Steps" value "12500" unit "steps" hue "teal" icon "trend" <info>
    Then the InfoTip trigger should be <presence>

    Examples:
      | info                        | presence |
      | and info "Daily step count" | visible  |
      | without info                | absent   |
