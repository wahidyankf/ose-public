Feature: Skills path landing-body content

  As a reader considering a skills path
  I want that path's landing page to show its own authored runway-justification content
  So that I understand why this specific skills path starts where it does, not a generic pitch

  # Bound Phase 3, Cycle 3.1d — unit (path-landing.test.tsx) and e2e (course-paths.steps.ts).
  # Behaviour: AYW-129
  Scenario: A skills path's authored runway-justification content renders on its own landing
    Given two fixture skills paths whose landing bodies declare different runway-justification paragraphs for their differing first boundaries
    When a reader opens either skills path's landing page
    Then that path's landing renders its own authored runway-justification paragraph between the title and the syllabus
    And the other path's justification paragraph never appears on this page

  # Behaviour: AYW-130
  Scenario: A path landing page tab title reads as the path title
    When a reader opens the immediately-effective backend track landing page
    Then the browser tab title reads "Backend Track (Immediately-Effective)"

  # Behaviour: AYW-131
  Scenario: An assumed course with no page in this locale shows a readable title, not a raw slug
    Given the immediately-effective backend track assumes the course "just-enough-python", which has no page in Indonesian
    When a reader opens the backend track landing page in Indonesian
    Then the "Before you start" note links to a course titled "Just Enough Python"
    And no link in that note shows the raw slug "just-enough-python"

  # Behaviour: AYW-156
  Scenario: The paths hub and path landing read in Indonesian under /id
    When a reader opens the paths hub at /id/learn/paths in Indonesian
    Then the hub's course library link reads "Jelajahi seluruh pustaka kursus"
    When a reader opens the backend track landing page in Indonesian
    Then the "Before you start" heading reads "Sebelum memulai"
