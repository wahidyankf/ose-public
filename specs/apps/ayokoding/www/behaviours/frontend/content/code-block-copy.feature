Feature: Code-Block Copy Button

  As a reader visiting AyoKoding
  I want a copy-to-clipboard button on fenced code blocks
  So that I can copy example code without manually selecting it

  Background:
    Given the app is running

  # Behaviour: AYW-023
  Scenario: A non-mermaid code block renders a copy button
    Given a visitor opens an English content page containing a fenced Lua code block
    When the page renders
    Then the code block displays a copy button

  Scenario: A mermaid block renders no copy button
    Given a visitor opens a content page containing a mermaid fenced block
    When the page renders
    Then the mermaid block renders as a diagram with no copy button

  # Behaviour: AYW-024
  Scenario: The copy button is labelled in Indonesian on the Indonesian site
    Given a visitor opens an Indonesian content page containing a fenced code block
    When the accessibility tree is inspected
    Then the copy button has the Indonesian accessible name "Salin"

  Scenario: Clicking copy places the verbatim annotated source on the clipboard
    Given a visitor is on a page whose Lua block contains "-- => output" annotations
    When the visitor clicks that block's copy button
    Then the clipboard contains the block's source verbatim including the "-- => output" annotations

  Scenario: The copy button confirms success to the visitor
    Given a visitor has clicked a code block's copy button
    When the copy succeeds
    Then the button shows a "Copied" confirmation before reverting

  Scenario: The copy button is reachable on a touch viewport without hovering
    Given a visitor loads a content page on a touch (no-hover) viewport
    When the code block is rendered
    Then the copy button is visible without any hover interaction
