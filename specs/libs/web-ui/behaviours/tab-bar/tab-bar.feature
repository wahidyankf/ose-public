Feature: TabBar component

  # Behaviour: WUI-017
  Scenario: Renders tabs
    When I render a TabBar with tabs "Home,History,Settings" and current "Home"
    Then the tab bar should show 3 tabs

  # Behaviour: WUI-017
  Scenario: Click triggers onChange
    Given I render a TabBar with tabs "Home,History,Settings" and current "Home"
    When the user clicks the "History" tab
    Then onChange should be called with "history"

  # Behaviour: WUI-017
  Scenario Outline: Each tab reports whether it is the selected tab
    When I render a TabBar with tabs "Home,History,Settings" and current "home"
    Then the "<tab>" tab should have aria-selected "<selected>"

    Examples:
      | tab     | selected |
      | Home    | true     |
      | History | false    |
