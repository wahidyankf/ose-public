Feature: Course catalog and learning paths

  As a learner choosing what to study
  I want clear course metadata and consistent learning paths
  So that I can understand prerequisites and follow the intended order

  Background:
    Given the app is running

  Scenario: The course catalog reflects current published metadata
    When a learner opens the course catalog
    Then courses are grouped by their authored categories
    And each course shows its title, description, format, and applicable effort estimate
    And no catalog count depends on a frozen copy of the shared corpus

  Scenario: An outline course is not presented as a completed lesson collection
    Given a course is currently marked as outline-only
    When a learner opens its landing page
    Then the course shows its outline status and available material honestly
    And it is not presented as fully completed by having no learning pages

  Scenario: A path uses the current manifest's phase order
    Given a valid path manifest contains ordered phases and course membership
    When a learner opens that path
    Then its roadmap and course controls follow the manifest's phase order
    And phase labels and course position numbers agree across the page

  Scenario: Prerequisite links identify the required courses
    Given a published course declares prerequisites
    When a learner opens its course landing page
    Then each prerequisite is shown with its current title and canonical route
    And the path does not place a required core prerequisite after its dependent course

  Scenario: Invalid path context falls back to canonical course navigation
    Given a course URL contains a path identifier that is missing or does not contain that course
    When a learner opens that URL
    Then the course still renders with canonical navigation
    And no path-specific control claims the invalid path is active

  Scenario: A malformed manifest does not break valid learning paths
    Given the manifest collection contains one malformed file and one valid path
    When the path collection is loaded
    Then the valid path remains available
    And the malformed file is excluded with a developer diagnostic

  Scenario: An empty path category shows an intentional empty state
    Given a path category currently contains no published paths
    When a learner opens that category
    Then the page explains that no paths are available in that category
    And the rest of the learning navigation remains usable
