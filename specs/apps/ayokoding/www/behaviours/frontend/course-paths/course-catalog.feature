Feature: Course catalog

  As a learner choosing a course
  I want the courses page grouped by category with one card per course
  So that I can pick a course without opening dozens of pages

  Background:
    Given the course library holds courses with a category, a description, a format, and an estimated time

  # Behaviour: AYW-101
  Scenario: Every course appears once under its category
    When a reader opens the courses page
    Then the page shows one section heading per category that has courses
    And the sections follow the fixed category order
    And every course appears in exactly one section

  # Behaviour: AYW-102
  Scenario: A course card shows the facts needed to choose
    When a reader opens the courses page
    Then the card for "SQL Essentials" shows its one-line description
    And the card shows the format "Code by example"
    And the card shows an estimated time in the form "About N h"
    And the card shows how many paths use the course

  # Behaviour: AYW-103
  Scenario: An outline course card says it is an outline
    Given a course is marked as an outline
    When a reader opens the courses page
    Then that course's card shows an "Outline" badge
    And that card shows no format and no estimated time

  # Behaviour: AYW-104
  Scenario: A card links only to the course landing page
    When a reader opens the courses page
    Then each card holds exactly one link
    And that link opens the course landing page
    And no card links to an Overview, Learning, or Drilling page

  # Behaviour: AYW-105
  Scenario: A jump link moves to its category section
    When a reader activates the "Data and databases" jump link
    Then the "Data and databases" section heading is the link target

  # Behaviour: AYW-106
  Scenario: The catalog fits a phone screen
    Given a viewport 375 pixels wide
    When a reader opens the courses page
    Then the cards stack in one column
    And the main content does not scroll sideways
