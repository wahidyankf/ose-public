Feature: SideNav component

  # Behaviour: WUI-018
  Scenario: The side nav shows its brand and every tab
    When I render a SideNav with brand "OrganicLever" and tabs
    Then the text "OrganicLever" should be visible
    And the tab "Home" should be visible
    And the tab "History" should be visible

  # Behaviour: WUI-018
  Scenario: Tab click triggers onChange with tab id
    Given I render a SideNav with brand "OrganicLever" and tabs
    When the user clicks the "History" tab
    Then onChange should be called with "history"

  # Behaviour: WUI-018
  Scenario: The current tab is marked as current
    When I render a SideNav with brand "OrganicLever" current "home" and tabs
    Then the "Home" tab should be marked as current
    And the "History" tab should not be marked as current

  # Behaviour: WUI-018
  Scenario: Brand row click always calls onChange with home
    Given I render a SideNav with brand "OrganicLever" current "history" and tabs
    When the user clicks the brand row
    Then onChange should be called with "home"
