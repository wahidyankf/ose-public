Feature: Course landing header

  As a learner arriving at a course
  I want a short summary and a clear place to start
  So that I can decide whether to take the course and begin in one click

  # Behaviour: AYW-107
  Scenario: The header shows description, format, time, and category
    Given a course with a description, a format, an estimated time, a category, and prerequisites
    When a reader opens the course landing page
    Then the header shows the description under the title
    And the header shows the format, the estimated time, and the category

  # Behaviour: AYW-107
  Scenario: The header lists the paths that use the course
    Given a course with a description, a format, an estimated time, a category, and prerequisites
    When a reader opens the course landing page
    Then the header lists the paths that use the course as links

  # Behaviour: AYW-108
  Scenario Outline: Start course opens the best first page
    Given the course <course> is open on its landing page
    When a reader activates "Start course" on the course landing page
    Then the page <best first page> opens
    And that page is not inside a folder that has no index page

    Examples:
      | course                          | best first page                                                     |
      | sql-essentials                  | /en/learn/courses/sql-essentials/learning/overview                  |
      | capstone-data-pipeline          | /en/learn/courses/capstone-data-pipeline/learning/capstone/overview |
      | capstone-first-working-software | /en/learn/courses/capstone-first-working-software/overview          |

  # Behaviour: AYW-109
  Scenario: The course contents list follows the header
    When a reader opens the course landing page
    Then the "Course contents" heading and the list of course pages appear after the header

  # Behaviour: AYW-107
  Scenario: A course page shows its prerequisites list and its paths list at most once
    When a reader opens the course landing page
    Then the page has exactly one prerequisites list
    And the page has at most one "This course is part of" list

  Scenario: An outline course header says it is an outline
    Given a course is marked as an outline
    When a reader opens the course landing page
    Then the header shows an "Outline" badge
    And the header shows no estimated time

  # Behaviour: AYW-110
  Scenario: Pages inside a course have no header
    When a reader opens a learning page inside a course
    Then no course header is shown
