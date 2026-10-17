Feature: Course landing progress

  As a learner returning to a course
  I want the course header to show my progress and continue where I stopped
  So that I do not start the course again

  Background:
    Given the app is running

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A started course shows its progress and a Continue button
  @integration-exempt
  Scenario: A started course shows its progress and a Continue button
    Given a reader completed the first two learning pages of a course
    When the reader opens the course landing page
    Then the header shows "In progress" and "2 of P pages done"
    And the main button reads "Continue course:" followed by the third page's title and links to it

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A finished course offers a review
  @integration-exempt
  Scenario: A finished course offers a review
    Given a reader completed every learning page of a course
    When the reader opens the course landing page
    Then the header shows "Done" and "P of P pages done"
    And the main button reads "Review course" and links to the first learning page
