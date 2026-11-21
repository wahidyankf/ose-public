Feature: Resizable panel primitive

  As a developer using the web-ui design system
  I want a resizable panel primitive with a draggable, keyboard-accessible handle
  So that consuming apps can build resizable side rails that clamp to a safe width band

  Scenario: Widen the panel by dragging the handle right
    Given a resizable panel rendered at 250 pixels with a 150 to 350 pixel band
    When the user drags the separator handle 60 pixels to the right
    Then the panel width becomes 310 pixels

  Scenario: Dragging past the maximum stops at the maximum
    Given a resizable panel rendered at 340 pixels with a 150 to 350 pixel band
    When the user drags the separator handle 100 pixels to the right
    Then the panel width stops at 350 pixels

  # Behaviour: WUI-045
  Scenario: Dragging past the minimum stops at the minimum
    Given a resizable panel rendered at 160 pixels with a 150 to 350 pixel band
    When the user drags the separator handle 100 pixels to the left
    Then the panel width stops at 150 pixels

  Scenario: Dragging updates the width as the pointer moves
    Given a resizable panel rendered at 250 pixels with a 150 to 350 pixel band
    When the user drags the separator handle 60 pixels to the right without releasing
    Then the panel width becomes 310 pixels

  Scenario: Releasing the drag persists the final width to localStorage
    Given a resizable panel rendered at 250 pixels with a 150 to 350 pixel band
    When the user drags the separator handle 60 pixels to the right
    Then the width 310 pixels is persisted to localStorage

  Scenario: ArrowRight widens the panel by the keyboard step
    Given the separator handle is focused on a panel at 250 pixels
    When the user presses ArrowRight
    Then the panel width becomes 260 pixels

  Scenario: The handle reports the new width through aria-valuenow
    Given the separator handle is focused on a panel at 250 pixels
    When the user presses ArrowRight
    Then the handle reports 260 as its aria-valuenow

  # Behaviour: WUI-044
  # Behaviour: WUI-049
  Scenario: ArrowLeft narrows the panel by the keyboard step
    Given the separator handle is focused on a panel at 250 pixels with a keyboard step of 20 pixels
    When the user presses ArrowLeft
    Then the panel width becomes 230 pixels

  Scenario: The handle is a vertical separator
    Given a resizable panel is rendered
    When the accessibility tree is inspected
    Then the handle has role "separator"
    And the handle has aria-orientation "vertical"

  Scenario: Dragging the handle does not select text
    Given a resizable panel is rendered
    When the user drags the separator handle 60 pixels to the right
    Then no page text is selected

  Scenario: The handle's accessible label can be localized
    Given a resizable panel is rendered with a custom handle label "Ubah ukuran panel"
    When the accessibility tree is inspected
    Then the handle has aria-label "Ubah ukuran panel"

  Scenario: Reset the panel to its default width by double-clicking the handle
    Given a resizable panel rendered at 250 pixels has been dragged to 310 pixels
    When the user double-clicks the separator handle
    Then the panel width returns to 250 pixels

  Scenario Outline: Home and End jump the panel to the edges of the band
    Given the separator handle is focused on a panel at 250 pixels with a 150 to 350 pixel band
    When the user presses <key>
    Then the panel width becomes <width> pixels

    Examples:
      | key  | width |
      | Home | 150   |
      | End  | 350   |

  # Behaviour: WUI-049
  Scenario: Re-clamp a persisted width that falls outside the band on load
    Given a corrupted localStorage value of 999999 pixels for the panel width
    When a resizable panel with a 150 to 350 pixel band is rendered
    Then the panel width renders at the maximum band width, not the corrupted value

  # Behaviour: WUI-046
  Scenario: A saved width inside the band is restored on load
    Given a saved localStorage value of 300 pixels for the panel width
    When a resizable panel with a 150 to 350 pixel band is rendered
    Then the panel width becomes 300 pixels
