Feature: Code-Block Copy Button

  As a reader of the OSE platform site
  I want a copy-to-clipboard button on fenced code blocks
  So that I can copy example code without manually selecting it

  # Behaviour: OSW-021
  Scenario: Code blocks in site content show a copy button
    Given a reader opens the about page with a code sample
    Then the code sample shows a copy button

  # Behaviour: OSW-022
  Scenario: Mermaid diagrams show no copy button
    Given a reader opens the about page with a mermaid diagram
    Then the mermaid diagram shows no copy button

  # Behaviour: OSW-021
  Scenario: Clicking the copy button copies the code to the clipboard and confirms it
    Given a reader opens the about page with a code sample
    When the reader clicks the copy button of the code sample
    Then the code sample is copied to the clipboard
    And the copy button confirms the copy
