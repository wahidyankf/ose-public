Feature: Course re-home redirects and prerequisites

  As a reader following a legacy fundamentally-strong course URL, or browsing the
  library the old way
  I want the legacy path to resolve to the re-homed course
  So that bookmarks, external links, and the old-way section-index browse keep
  working once the 37 shipped topics and existing capstones move into the
  course library

  Background:
    Given the app is running

  # Behaviour: AYW-034
  # Behaviour: AYW-153
  # Maintainer decision (2026-07-23): the per-course redirect broadened from an exact-source rule
  # to a /:path* wildcard so deep course sub-pages (learning/*, drilling/*) 308 to their canonical
  # sub-page instead of 404ing after the move — the second example proves that deep-path coverage.
  Scenario Outline: legacy course URLs reach the canonical course
    When a visitor navigates to "<legacy_url>"
    Then the current URL should contain "<canonical_url>"
    And the resolved page title should equal the canonical course page title at "<canonical_url>"
    And the canonical course page is titled "<canonical_title>"
    And the redirect preserves any path context query parameter

    Examples:
      | legacy_url                                                                           | canonical_url                                          | canonical_title    |
      | /en/learn/fundamentally-strong/software-engineer/just-enough-python                   | /en/learn/courses/just-enough-python                   | Just Enough Python |
      | /en/learn/fundamentally-strong/software-engineer/just-enough-python/learning/beginner | /en/learn/courses/just-enough-python/learning/beginner | Beginner Examples  |

  # Q-E=C override (RESOLVED 2026-07-23): the three fundamentally-strong browse roots are
  # deleted and their old URLs 308 to the course library landing, a narrow exception to the
  # rest of the legacy `_index.md` tree's "updated, never deleted" rule.
  # Behaviour: AYW-035
  Scenario Outline: The retired fundamentally-strong browse roots permanently redirect to the course library
    When a raw HTTP GET is made to "<legacy_url>" with redirects disabled
    Then the response status should be 308
    And the response Location header should equal "/en/learn/courses"

    Examples:
      | legacy_url                                                 |
      | /en/learn/fundamentally-strong                             |
      | /en/learn/fundamentally-strong/software-engineer            |
      | /en/learn/fundamentally-strong/software-engineer/overview   |

  # Behaviour: AYW-085
  Scenario: The course library the retired browse roots redirect to resolves every re-homed course
    When a visitor navigates to "/en/learn/courses"
    Then every course catalog entry should resolve to live content, not a drained or missing location
