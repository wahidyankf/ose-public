Feature: Dialog component

  As a developer using the ts-ui design system
  I want the Dialog component to render correctly with trigger and content
  So that I can build accessible modal interactions

  Scenario: Renders dialog with trigger button
    Given the Dialog is rendered with a trigger labeled "Open"
    Then the dialog trigger element with label "Open" should be present
    And the trigger should have data-slot "dialog-trigger"

  Scenario: Has no accessibility violations
    Given the Dialog is rendered open with title "Test Dialog"
    Then the dialog should have no accessibility violations
