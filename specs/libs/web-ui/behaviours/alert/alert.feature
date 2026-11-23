Feature: Alert component

  As a developer using the web-ui design system
  I want the Alert component to render correctly with title, description, and variants
  So that I can display accessible status messages and warnings

  # Behaviour: WUI-003
  Scenario: Renders default alert with title and description
    When the Alert is rendered with title "Warning" and description "Something happened"
    Then an element with role "alert" should be present
    And the alert title "Warning" should be present
    And the alert description "Something happened" should be present

  # Behaviour: WUI-003
  Scenario: A destructive alert shows its content in the destructive colour
    When the Alert is rendered with variant "destructive" and content "Error"
    Then the alert text should be drawn in the destructive colour

  # Behaviour: WUI-003
  Scenario: Has no accessibility violations
    When the Alert is rendered with title "Warning" and description "Something happened"
    Then the alert should have no accessibility violations

  # Behaviour: WUI-003
  Scenario Outline: Each alert variant is marked with its name
    When I render an Alert with variant "<variant>"
    Then the alert should have data-variant "<variant>"

    Examples:
      | variant     |
      | success     |
      | warning     |
      | info        |
      | destructive |

  # Behaviour: WUI-040
  Scenario: AlertTitle and AlertDescription are announced with the alert
    When the Alert is rendered with title "Warning" and description "Something happened"
    Then the alert should announce its title and description
