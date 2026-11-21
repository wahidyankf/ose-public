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

  # Exemption(e2e): the scenario reads checked-in course frontmatter and the archived syllabus corpus from the repository, and no served page reads that corpus, so the end-to-end boundary does not exist for it; alternative-proof: ayokoding-www:test:unit / Every re-homed course declares its prerequisites
  @e2e-exempt
  Scenario: Every re-homed course declares its prerequisites
    Given the thirty-seven shipped topics and existing capstones have been re-homed into the course library
    When each re-homed course's canonical metadata is inspected
    Then every one declares a prerequisites list of course IDs
    And an empty list is accepted only for a course with no library prerequisite
    And every named prerequisite resolves to another course already in the library or declared on the syllabus roadmap

  # Exemption(e2e): an intentionally unauthored roadmap course has no public page by definition, so only the repository boundary can prove union membership; alternative-proof: ayokoding-www:test:integration / A prerequisite naming a syllabus-declared but not-yet-authored course still resolves
  @e2e-exempt
  Scenario: A prerequisite naming a syllabus-declared but not-yet-authored course still resolves
    When a course is declared on the syllabus roadmap but not yet authored into the course library
    Then a prerequisite naming that course resolves against the union of the course library and the syllabus roadmap
    And a prerequisite naming an unrecognized course ID still does not resolve

  # Exemption(e2e): the scenario reads checked-in course frontmatter and the archived syllabus corpus from the repository, and no served page reads that corpus, so the end-to-end boundary does not exist for it; alternative-proof: ayokoding-www:test:unit / A prerequisite naming an authored course absent from the syllabus roadmap still resolves
  @e2e-exempt
  Scenario: A prerequisite naming an authored course absent from the syllabus roadmap still resolves
    When a course is authored into the course library but not declared on the syllabus roadmap
    Then a prerequisite naming that course resolves against the union of the course library and the syllabus roadmap

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
