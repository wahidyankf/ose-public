Feature: CopyButton primitive

  A standalone, reusable copy affordance that writes a value to the clipboard, confirms success via
  an icon swap and a polite live region, reverts after a timeout, and stays fully keyboard- and
  screen-reader-operable.

  # Behaviour: WUI-034
  Scenario: Clicking the copy button writes its value to the clipboard
    Given a CopyButton rendered with the value "npm install"
    When the user clicks the button
    Then the clipboard receives the exact text "npm install"

  # Behaviour: WUI-034
  Scenario: A successful copy swaps to the success icon and announces via a live region
    Given a CopyButton rendered with a value and a stubbed clipboard that resolves
    When the user clicks the button
    Then the button shows the success (Check) icon
    And a polite live region announces the copied label

  # Behaviour: WUI-034
  # Behaviour: WUI-050
  Scenario: The success state reverts to the resting state after the timeout
    Given a CopyButton that has just shown its success state
    When the revert timeout elapses
    Then the button shows the resting (Copy) icon again
    And the live region no longer announces the copied label

  # Behaviour: WUI-034
  Scenario: A failed copy shows no success and an error cue that is announced
    Given a CopyButton rendered with a stubbed clipboard that rejects
    When the user clicks the button
    Then the button does not show the success (Check) icon
    And the button shows the error (X) icon
    And a polite live region announces the error label

  # Behaviour: WUI-034
  Scenario Outline: The copy button is operable by keyboard
    Given a CopyButton is focused
    When the user presses <key>
    Then the clipboard receives the button's value

    Examples:
      | key   |
      | Enter |
      | Space |

  # Behaviour: WUI-050
  Scenario Outline: The copy button has an accessible name that follows its label
    Given a CopyButton rendered with <setup>
    When the accessibility tree is inspected
    Then the button has an accessible name of <name>

    Examples:
      | setup                  | name  |
      | the default labels     | Copy  |
      | copyLabel "Salin"      | Salin |

  # Behaviour: WUI-034
  Scenario: The copy button has no accessibility violations
    Given a CopyButton is rendered in its resting state
    When an automated accessibility scan runs
    Then no accessibility violations are reported

  # Behaviour: WUI-034
  Scenario: The copy button meets the minimum target size
    Given a CopyButton rendered at its default size
    When its rendered box is measured
    Then both dimensions are at least 24 CSS pixels

  # Behaviour: WUI-034
  # Behaviour: WUI-050
  Scenario: Re-clicking during the success window resets the revert timer
    Given a CopyButton has just shown its success state from a first click
    When the user clicks the button again before the revert timeout elapses
    Then the button remains in the success (Check) state
    And the revert timeout is measured from the second click, not the first

  # Behaviour: WUI-034
  Scenario: A retry after a failed clipboard write succeeds normally
    Given a CopyButton whose previous click failed to write to the clipboard
    When the user clicks the button again and the clipboard write resolves
    Then the button shows the success (Check) icon
    And a polite live region announces the copied label

  # Behaviour: WUI-034
  Scenario: The copy button exposes a native tooltip title
    Given a CopyButton rendered with the default labels
    When the button's attributes are inspected
    Then the button carries a title matching its accessible name
