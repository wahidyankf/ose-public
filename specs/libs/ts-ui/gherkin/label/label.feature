Feature: Label component

  As a developer using the ts-ui design system
  I want the Label component to render correctly and associate with form controls
  So that I can build accessible form fields

  Scenario: Renders with text content
    Given the Label is rendered with text "Email"
    Then the label element with text "Email" should be present
    And the label should have data-slot "label"

  Scenario: Associates with form control via htmlFor
    Given the Label is rendered with text "Email" associated to input "email-input"
    Then the label and input association should have no accessibility violations

  Scenario: Has no accessibility violations
    Given the Label is rendered with text "Email" associated to input "email-input"
    Then the label and input association should have no accessibility violations
