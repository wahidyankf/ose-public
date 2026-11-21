Feature: Course-paths accessibility contract

  As a reader using a keyboard or a screen reader
  I want every path-aware navigation surface to be a labelled, operable landmark
  So that following a learning path never depends on being able to see or use a mouse

  # Behaviour: AYW-139
  Scenario: Path navigation surfaces are labelled landmarks
    Given a reader uses a keyboard and a screen reader on a course in path context
    When they navigate the path rail, banner, breadcrumb, prerequisite list, and prev/next
    Then each is a labelled landmark

  # Behaviour: AYW-139
  Scenario: Path navigation works by keyboard with visible focus
    Given a reader uses a keyboard and a screen reader on a course in path context
    When they navigate the path rail, banner, breadcrumb, prerequisite list, and prev/next
    Then each is reachable and operable by keyboard with visible focus

  # Behaviour: AYW-139
  Scenario: The page language matches the locale
    Given a reader uses a keyboard and a screen reader on a course in path context
    Then the document language attribute matches the active locale
