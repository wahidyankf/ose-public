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
  Scenario: A legacy fundamentally-strong URL redirects to the canonical course URL
    When a visitor navigates to "/en/learn/fundamentally-strong/software-engineer/just-enough-python"
    Then the current URL should contain "/en/learn/courses/just-enough-python"

  # Maintainer decision (2026-07-23): the per-course redirect broadened from an exact-source rule
  # to a /:path* wildcard so deep course sub-pages (learning/*, drilling/*) 308 to their canonical
  # sub-page instead of 404ing after the move — this scenario proves that deep-path coverage.
  Scenario: A legacy fundamentally-strong deep sub-page URL redirects to its canonical course sub-page
    When a visitor navigates to "/en/learn/fundamentally-strong/software-engineer/just-enough-python/learning/beginner"
    Then the current URL should contain "/en/learn/courses/just-enough-python/learning/beginner"

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

  Scenario: A course reached via its legacy course URL resolves to the single canonical course body
    When a visitor navigates to "/en/learn/fundamentally-strong/software-engineer/just-enough-python"
    Then the resolved page title should equal the canonical course page title at "/en/learn/courses/just-enough-python"
