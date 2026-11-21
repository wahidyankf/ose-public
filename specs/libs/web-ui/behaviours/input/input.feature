Feature: Input component

  As a developer using the web-ui design system
  I want the Input component to render correctly with all native input behaviours
  So that I can build accessible and functional form fields

  # Behaviour: WUI-004
  Scenario: An input is a focusable textbox
    When the Input is rendered with aria-label "test input"
    Then a focusable textbox element should be present

  # Behaviour: WUI-004
  Scenario: Supports disabled state
    When the Input is rendered as disabled with aria-label "disabled input"
    Then the textbox element should have the disabled attribute

  # Behaviour: WUI-004
  Scenario: An input is at least 44 pixels tall (touch target)
    When I render an Input
    Then the input should be at least 44 pixels tall

  # Behaviour: WUI-004
  Scenario: Has no accessibility violations
    When the Input is rendered with a label "Email" associated via htmlFor
    Then the input should have no accessibility violations

  # Behaviour: WUI-041
  Scenario: An input with aria-invalid shows its invalid state
    When I render an Input with aria-invalid set
    Then the input should be marked invalid

  # Behaviour: WUI-042
  Scenario: Typing in an input reports each change to onChange
    Given I render an Input with an onChange handler
    When the user types "ab"
    Then onChange should be called once per keystroke with the value so far
