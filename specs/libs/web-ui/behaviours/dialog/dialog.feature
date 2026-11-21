Feature: Dialog component

  As a developer using the web-ui design system
  I want the Dialog component to render correctly with trigger and content
  So that I can build accessible modal interactions

  # Behaviour: WUI-007
  Scenario: Activating the trigger opens a dialog showing its title
    When the Dialog is rendered with a trigger labeled "Open" and a title "Test Dialog"
    And the user activates the trigger labeled "Open"
    Then the dialog titled "Test Dialog" should be visible

  # Behaviour: WUI-007
  Scenario: Has no accessibility violations
    When the Dialog is rendered open with title "Test Dialog"
    Then the dialog should have no accessibility violations

  # Behaviour: WUI-038
  Scenario Outline: A dialog closes with its close button and with Escape
    Given the Dialog is open with title "Test Dialog"
    When the user <action>
    Then the dialog should be closed

    Examples:
      | action             |
      | clicks the close button |
      | presses Escape     |

  # Behaviour: WUI-039
  Scenario: DialogContent omits the close button when showCloseButton is false
    When the Dialog content is rendered with showCloseButton false
    Then the dialog should have no close button
