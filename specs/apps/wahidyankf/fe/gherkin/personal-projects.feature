Feature: Personal projects page

  As a visitor to wahidyankf-web
  I want to browse a list of personal projects
  So that I can learn what I have built outside of employed work

  Background:
    Given the app is running

  Scenario: Personal projects page renders the heading
    When a visitor opens the personal projects page
    Then the H1 shows "Personal Projects"

  Scenario: Personal projects page renders a search input
    When a visitor opens the personal projects page
    Then a search input with placeholder "Search projects..." is visible

  Scenario: Personal projects page lists at least one project card
    When a visitor opens the personal projects page
    Then at least one project card is visible

  Scenario: Each project card exposes external links where applicable
    When a visitor opens the personal projects page
    Then every project card exposes a Repository, Website, or YouTube link where the project has that resource
