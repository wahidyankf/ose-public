Feature: Canonical fallback rendering

  As a reader
  I want a course to render its full canonical view whenever no path context applies
  So that graceful fallback is the default rendering, not an error path bolted on afterward

  # Behaviour: AYW-147
  Scenario: A course without path context renders its body and content-tree breadcrumb
    Given a reader opens a course URL /en/learn/courses/<course-id> with no path context query parameter
    When the course page renders
    Then the course body renders in full with the content-tree breadcrumb

  Scenario: A course opened without path context renders the generic sidebar unchanged
    Given a reader opens a canonical course URL with no path context query parameter
    When the page renders
    Then the left sidebar shows the generic content tree exactly as it does elsewhere in the site
    And no path rail, path readout, or path breadcrumb segment appears

  # Behaviour: AYW-148
  Scenario Outline: A page that is not a course keeps the generic sidebar even with a path query
    Given a reader opens the page <page> with a path context query parameter
    When the page renders
    Then the generic sidebar is shown

    Examples:
      | page                                 |
      | /en/browse                           |
      | /en/learn/courses                    |
      | /en/learn/courses-extra/git          |
      | /id/tentang-ayokoding                |
