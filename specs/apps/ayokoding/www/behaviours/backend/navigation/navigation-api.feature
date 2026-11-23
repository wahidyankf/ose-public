Feature: Navigation API

  As a web client
  I want to retrieve the navigation tree for a locale
  So that I can render the site sidebar and breadcrumb navigation correctly

  Background:
    Given the API is running

  # Behaviour: AYW-064
  Scenario Outline: The navigation tree <aspect>
    Given content exists in locale "en" with sections "about-ayokoding", "learn", and "rants"
    When the client calls content.getTree with locale "en"
    Then the tree <aspect>

    Examples:
      | aspect                                                   |
      | lists top-level sections with their pages nested beneath |
      | gives every section a non-empty children array           |
      | gives every node a slug and title                        |

  Scenario: Course nodes carry their category
    Given content exists in locale "en" with a course "learn/courses/sql-essentials" in category "data-and-databases"
    When the client calls content.getTree with locale "en"
    Then the "learn/courses/sql-essentials" node should include category "data-and-databases"
    And nodes without a category should have no "category" field
