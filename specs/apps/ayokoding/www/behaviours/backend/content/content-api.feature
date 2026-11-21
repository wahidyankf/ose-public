Feature: Content API

  As a web client
  I want to retrieve page content by slug or section listing
  So that I can render the correct page with all its metadata and navigation context

  Background:
    Given the API is running

  # Behaviour: AYW-062
  Scenario: Get existing page by slug returns HTML, page metadata, and headings
    Given a published page exists at slug "en/learn/courses/just-enough-go/learning/beginner"
    When the client calls content.getBySlug with slug "en/learn/courses/just-enough-go/learning/beginner"
    Then the response should contain a non-null "html" field
    And the response should contain the page metadata for the requested slug
    And the response should contain a non-null "headings" field

  # Behaviour: AYW-062
  Scenario: Get existing page by slug returns previous and next links
    Given a published page exists at slug "en/learn/courses/just-enough-go/learning/beginner"
    When the client calls content.getBySlug with slug "en/learn/courses/just-enough-go/learning/beginner"
    Then the response should contain a "prev" navigation link
    And the response should contain a "next" navigation link

  Scenario: Get non-existent page by slug returns 404
    When the client calls content.getBySlug with slug "en/does/not/exist"
    Then the response should indicate the page was not found

  # Exemption(e2e): the browser-test server deliberately enables draft fixture pages globally and the public request cannot override that process-level content policy; alternative-proof: ayokoding-www:test:unit / Draft pages are excluded from content retrieval
  @e2e-exempt
  # Behaviour: AYW-070
  Scenario: Draft pages are excluded from content retrieval
    Given a draft page exists at slug "en/learn/paths/skills/e2e-fixture-alpha"
    When the client calls content.getBySlug with slug "en/learn/paths/skills/e2e-fixture-alpha"
    Then the response should indicate the page was not found

  # Behaviour: AYW-063
  Scenario Outline: Child pages are ordered by weight ascending through <surface>
    Given a section exists at slug "en/learn/courses/just-enough-go/learning" with child pages weighted 30, 1, 100, 20, and 10
    When the client reads the child pages of "en/learn/courses/just-enough-go/learning" through <surface>
    Then the response should contain 5 child pages
    And the child pages should be ordered by weight ascending

    Examples:
      | surface              |
      | content.listChildren |
      | content.getTree      |

  Scenario: Page content includes rendered HTML with code blocks preserved
    Given a published page exists at slug "en/learn/courses/just-enough-go/learning/beginner" with a fenced code block
    When the client calls content.getBySlug with slug "en/learn/courses/just-enough-go/learning/beginner"
    Then the response "html" field should contain a rendered code element

  # Behaviour: AYW-069
  Scenario: The course-path route data is returned for a locale
    When the client calls coursePaths.getRouteData with locale "en"
    Then the response should list each library course with its English page link
    And the response should include the course path manifests
