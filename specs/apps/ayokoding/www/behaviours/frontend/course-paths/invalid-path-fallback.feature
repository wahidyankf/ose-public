Feature: Invalid path context fallback

  As a reader
  I want an unrecognized or stale path context to fall back silently to the canonical view
  So that a broken or outdated path link never surfaces an error

  # Behaviour: AYW-149
  Scenario: An invalid path context falls back to the canonical view
    Given a reader opens a course URL with a path context that names no known path
    When the course page renders
    Then the course renders the canonical standalone view
    And no error is shown

  # Behaviour: AYW-152
  Scenario Outline: A paths URL that names no known category, arc, or path shows the not-found page
    Given a reader opens the paths URL <url>
    Then the not-found page is shown with a 404 status

    Examples:
      | url                                                        |
      | /en/learn/paths/no-such-category                           |
      | /en/learn/paths/careers/no-such-arc                        |
      | /en/learn/paths/careers/immediately-effective/no-such-path |
