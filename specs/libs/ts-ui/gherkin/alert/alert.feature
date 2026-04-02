Feature: Alert component

  As a developer using the ts-ui design system
  I want the Alert component to render correctly with title, description, and variants
  So that I can display accessible status messages and warnings

  Scenario: Renders default alert with title and description
    Given the Alert is rendered with title "Warning" and description "Something happened"
    Then an element with role "alert" should be present
    And the alert title "Warning" should be present
    And the alert description "Something happened" should be present

  Scenario: Renders destructive variant
    Given the Alert is rendered with variant "destructive" and content "Error"
    Then the alert element should contain the class "text-destructive"

  Scenario: Has no accessibility violations
    Given the Alert is rendered with title "Warning" and description "Something happened"
    Then the alert should have no accessibility violations
