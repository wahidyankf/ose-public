Feature: Accessibility

  As a user with accessibility needs
  I want the app to follow WCAG guidelines
  So that I can use assistive technologies and navigate efficiently

  Background:
    Given the app is running

  Scenario: All form inputs have associated labels
    When a visitor navigates to the registration page
    Then every input field should have an associated visible label
    And every input field should have an accessible name

  Scenario: Error messages are announced to screen readers
    Given a visitor is on the login page
    When the visitor submits the form with empty fields
    Then validation errors should have role "alert"
    And the errors should be associated with their respective fields via aria-describedby

  Scenario: Keyboard navigation works through all interactive elements
    Given a user "alice" is logged in
    When alice presses Tab repeatedly on the dashboard
    Then focus should move through all interactive elements in logical order
    And the currently focused element should have a visible focus indicator

  Scenario: Modal dialogs trap focus
    Given a user "alice" is logged in
    And alice is on an entry with an attachment
    When alice clicks the delete button and a confirmation dialog appears
    Then focus should be trapped within the dialog
    And pressing Escape should close the dialog and return focus to the trigger

  Scenario: Color contrast meets WCAG AA standards
    Given a visitor opens the app
    Then all text should meet a minimum contrast ratio of 4.5:1 against its background
    And all interactive elements should meet a minimum contrast ratio of 3:1

  Scenario: Images and icons have alternative text
    Given a user "alice" is logged in
    And alice has an entry with a JPEG attachment
    When alice views the attachment
    Then the image should have descriptive alt text
    And decorative icons should be hidden from assistive technologies
