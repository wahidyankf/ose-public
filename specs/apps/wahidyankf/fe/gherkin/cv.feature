Feature: CV page

  As a visitor to wahidyankf-web
  I want the CV page to show my career and education history
  So that I can browse my professional background

  Background:
    Given the app is running

  Scenario: CV renders the Curriculum Vitae heading
    When a visitor opens the CV page
    Then the H1 shows "Curriculum Vitae"

  Scenario: CV renders a search input
    When a visitor opens the CV page
    Then a search input with placeholder "Search CV entries..." is visible

  Scenario: CV renders the Highlights section header
    When a visitor opens the CV page
    Then a "Highlights" section header is visible

  Scenario: CV cross-linked via scrollTop query scrolls into the entries
    When a visitor opens the CV page with search term "TypeScript" and scrollTop true
    Then the page scrolls past Highlights into the matching entries
