Feature: Course metadata

  As a content maintainer
  I want every course's catalog metadata validated against its content
  So that the catalog, sidebar, and course header never show missing or stale facts

  # Exemption(e2e): the content index is built from a temporary course directory, while the served site is built only from the repository's own course library, so the end-to-end project cannot supply a malformed course; alternative-proof: ayokoding-www:test:unit / A course page with an unknown category still appears on the site
  @e2e-exempt
  Scenario: A course page with an unknown category still appears on the site
    Given a course page whose frontmatter has an unknown category value
    When the content index is built
    Then the page is still in the content index
