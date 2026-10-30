Feature: Canonical fallback rendering

  As a reader
  I want a course to render its full canonical view whenever no path context applies
  So that graceful fallback is the default rendering, not an error path bolted on afterward

  # Cycle 3.4 (aggregate binder) added real e2e coverage alongside the pre-existing Phase 2 unit
  # binding — course-paths.steps.ts.
  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A course deep-linked without path context renders the canonical view
  @integration-exempt
  Scenario: A course deep-linked without path context renders the canonical view
    Given a reader opens a course URL /en/learn/courses/<course-id> with no path context query parameter
    When the course page renders
    Then the course body renders in full with the content-tree breadcrumb and its prerequisite list
    And a "this course is part of" affordance lists every path that includes the course

  # Cycle 3.4 (aggregate binder) added real e2e coverage alongside the pre-existing Phase 2 unit
  # binding — course-paths.steps.ts.
  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A course opened without path context renders the generic sidebar unchanged
  @integration-exempt
  Scenario: A course opened without path context renders the generic sidebar unchanged
    Given a reader opens a canonical course URL with no path context query parameter
    When the page renders
    Then the left sidebar shows the generic content tree exactly as it does elsewhere in the site
    And no path rail, path readout, or path breadcrumb segment appears

  # Exemption(integration): the route check and the query read run in-process with no local resource boundary to exercise; alternative-proof: ayokoding-www:test:unit / A page that is not a course in this locale keeps the generic sidebar when a path context query is present
  @integration-exempt
  # Exemption(e2e): the query read is an in-process call on an injected reader, which the browser boundary cannot observe; alternative-proof: ayokoding-www:test:unit / A page that is not a course in this locale keeps the generic sidebar when a path context query is present
  @e2e-exempt
  Scenario Outline: A page that is not a course in this locale keeps the generic sidebar when a path context query is present
    Given a reader opens the page <page> with a path context query parameter
    When the page renders
    Then the generic sidebar is shown
    And the path context query is not read

    Examples:
      | page                                 |
      | /en/browse                           |
      | /en/learn/courses                    |
      | /en/learn/courses-extra/git          |
      | /id/learn/courses/just-enough-python |
