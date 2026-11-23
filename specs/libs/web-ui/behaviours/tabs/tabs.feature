Feature: Tabs

  # Behaviour: WUI-027
  Scenario: Activating a tab shows its panel and hides the others
    Given tabs "Overview" and "Details" with the "Overview" panel showing
    When the user activates the "Details" tab
    Then the "Details" panel is shown
    And the "Overview" panel is hidden
