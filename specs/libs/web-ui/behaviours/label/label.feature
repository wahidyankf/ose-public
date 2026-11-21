Feature: Label component

  As a developer using the web-ui design system
  I want the Label component to render correctly and associate with form controls
  So that I can build accessible form fields

  # Behaviour: WUI-006
  Scenario: A label shows its text
    When the Label is rendered with text "Email"
    Then the label element with text "Email" should be present

  # Behaviour: WUI-006
  Scenario: A label names its form control and focuses it when clicked
    When the Label is rendered with text "Email" associated to input "email-input"
    Then clicking the label focuses its input and names it
    And the label and input association should have no accessibility violations
