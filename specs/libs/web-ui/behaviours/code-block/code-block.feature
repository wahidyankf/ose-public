Feature: CodeBlock primitive

  A layout composer that overlays a CopyButton on an already-highlighted code figure, establishing
  its own positioning context and copying the verbatim multi-line source.

  # Behaviour: WUI-033
  Scenario: The code block renders its highlighted children and a copy button
    Given a CodeBlock rendered with code text and a highlighted <pre> child
    When the component mounts
    Then the highlighted child is present
    And a copy button is present within the code-block wrapper

  # Behaviour: WUI-033
  Scenario: Copying from the code block yields the verbatim multi-line source
    Given a CodeBlock whose code prop is a three-line annotated snippet with trailing comments
    When the user clicks the code block's copy button
    Then the clipboard receives the snippet byte-for-byte including every annotation and newline

  # Behaviour: WUI-033
  Scenario: The copy button sits at the block corner, outside the scrolling code
    Given a CodeBlock rendered with a highlighted <pre> child
    When the copy button's position in the DOM is inspected
    Then the copy button is a child of the wrapper, not a descendant of the scrolling <pre>

  # Behaviour: WUI-033
  Scenario: The copy button is discoverable at rest and reveals fully on hover or focus
    Given a CodeBlock is rendered
    When the copy button's resting presentation is inspected
    Then the copy button is partially visible at rest rather than fully hidden
    And it becomes fully visible on hover, focus, and touch

  # Behaviour: WUI-033
  Scenario: Jumping to a code block leaves it clear of a sticky header
    Given a CodeBlock is rendered
    When the wrapper is inspected
    Then the block lands clear of a sticky header when it is jumped to

  # Behaviour: WUI-051
  @visual
  Scenario: The code block renders correctly in light and dark themes
    Given the CodeBlock stories are loaded in Storybook
    When the resting and copied stories are captured in light and dark themes
    Then each screenshot matches its committed visual baseline
