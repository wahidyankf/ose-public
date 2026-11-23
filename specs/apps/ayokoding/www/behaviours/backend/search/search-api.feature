Feature: Search API

  As a web client
  I want to search content by keyword within a locale
  So that readers can discover relevant pages without knowing exact slugs

  Background:
    Given the API is running

  # Behaviour: AYW-065
  Scenario Outline: Search results carry the <field> field
    Given published pages indexed under locale "en" include <indexed>
    When the client calls search.query with locale "en" and query "<query>"
    Then the response should contain at least one result
    And each result should carry its "<field>" field as "<expected>"

    Examples:
      | indexed                           | query       | field   | expected  |
      | a page titled "Beginner Examples" | goroutines  | title   | non-empty |
      | a page titled "Beginner Examples" | goroutines  | slug    | non-empty |
      | a page titled "Beginner Examples" | goroutines  | excerpt | non-empty |
      | content about "programming"       | programming | locale  | en        |

  Scenario: Search is scoped to the requested locale
    Given a page exists in locale "en" with title "Spring Security Basics"
    And no equivalent page exists in locale "id"
    When the client calls search.query with locale "id" and query "Spring Security Basics"
    Then the response should contain no results

  Scenario: Empty query returns an error
    When the client calls search.query with locale "en" and an empty query
    Then the response should indicate an invalid input error
