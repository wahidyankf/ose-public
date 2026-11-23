Feature: ProgressRing component

  # Behaviour: WUI-010
  Scenario Outline: The progress ring reports its value as a percentage
    When I render a ProgressRing with progress <progress>
    Then the progressbar should have aria-valuenow "<percent>"

    Examples:
      | progress | percent |
      | 1        | 100     |
      | 0.5      | 50      |
      | 0        | 0       |

  # Behaviour: WUI-010
  Scenario: Has correct aria attributes
    When I render a ProgressRing with progress 0.75
    Then the progressbar should have aria-valuemin "0"
    And the progressbar should have aria-valuemax "100"

  # Behaviour: WUI-043
  Scenario Outline: Progress below 0 or above 1 is clamped to 0 or 100
    When I render a ProgressRing with progress <progress>
    Then the progressbar should have aria-valuenow "<percent>"

    Examples:
      | progress | percent |
      | -0.5     | 0       |
      | 1.5      | 100     |
