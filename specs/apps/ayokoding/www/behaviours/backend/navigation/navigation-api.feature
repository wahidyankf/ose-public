Feature: Navigation API

  As a web client
  I want to retrieve the navigation tree for a locale
  So that I can render the site sidebar and breadcrumb navigation correctly

  Background:
    Given the API is running

  Scenario: Navigation tree structure matches the filesystem hierarchy
    Given content exists in locale "en" with sections "about-ayokoding", "learn", and "rants"
    When the client calls content.getTree with locale "en"
    Then the response tree should contain top-level nodes for "about-ayokoding", "learn", and "rants"
    And each node should reflect its position in the directory hierarchy

  Scenario: Navigation nodes are ordered by weight ascending
    Given a section "learn/courses/just-enough-go/learning" in locale "en" has child nodes with weights 30, 1, 100, 20, and 10
    When the client calls content.getTree with locale "en"
    Then the children of "learn/courses/just-enough-go/learning" should appear in order: weight 1, weight 10, weight 20, weight 30, weight 100

  Scenario: Section nodes include a children array
    Given a section "learn/courses/just-enough-go/learning" in locale "en" contains at least one child page
    When the client calls content.getTree with locale "en"
    Then the "learn/courses/just-enough-go/learning" node should have a non-empty "children" array
    And each child should include a "slug" and "title"

  Scenario: Course nodes carry their category
    Given content exists in locale "en" with a course "learn/courses/sql-essentials" in category "data-and-databases"
    When the client calls content.getTree with locale "en"
    Then the "learn/courses/sql-essentials" node should include category "data-and-databases"
    And nodes without a category should have no "category" field
