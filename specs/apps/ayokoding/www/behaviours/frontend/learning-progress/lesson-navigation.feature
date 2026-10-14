Feature: Lesson navigation

  As a learner inside a course
  I want to see where I am and move to the next page in one step
  So that I can work through a course and a path without getting lost

  Background:
    Given the app is running

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The context bar shows where the reader is in a path
  @integration-exempt
  Scenario: The context bar shows where the reader is in a path
    When a reader opens a learning page of a course in path context
    Then the context bar links to the path page
    And it names the phase that contains the course
    And it shows "Course k of N" for the course's position in the path
    And it shows "Page p of P" and how many pages of the course are done

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The context bar works without a path
  @integration-exempt
  Scenario: The context bar works without a path
    When a reader opens a learning page with no path context and no remembered path for that course
    Then the context bar shows the course title, "Page p of P", and how many pages are done
    And it shows no path or phase link

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Mark complete and continue opens the next learning page
  @integration-exempt
  Scenario: Mark complete and continue opens the next learning page
    Given a reader is on a learning page that is not the course's last page
    When the reader activates "Mark complete & continue"
    Then the next learning page of the course opens
    And the previous page is counted as done

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The last page of a course leads to the next course in the path
  @integration-exempt
  Scenario: The last page of a course leads to the next course in the path
    Given a reader is on the last learning page of a course in path context
    And the path has a course after it
    When the reader activates "Mark complete & continue"
    Then the next course's landing page opens in the same path context

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The last page of the path leads back to the path page
  @integration-exempt
  Scenario: The last page of the path leads back to the path page
    Given a reader is on the last learning page of the path's last course in path context
    When the reader activates "Mark complete & continue"
    Then the path page opens

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Without a path, the last page leads back to the course landing page
  @integration-exempt
  Scenario: Without a path, the last page leads back to the course landing page
    Given a reader is on a course's last learning page with no path context
    When the reader activates "Mark complete & continue"
    Then the course landing page opens

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Previous goes back one page, then to the course landing page
  @integration-exempt
  Scenario: Previous goes back one page, then to the course landing page
    Given a reader is on the first learning page of a course
    Then "Previous" links to the course landing page
    When the reader opens the second learning page
    Then "Previous" links to the first learning page

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The path context is remembered inside the same course
  @integration-exempt
  Scenario: The path context is remembered inside the same course
    Given a reader opened a course's learning page in path context
    When the reader opens another learning page of the same course from a link without path context
    Then the context bar still shows the same path and phase
    And the navigation links keep the path context

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Opening or scrolling a page never marks it complete
  @integration-exempt
  Scenario: Opening or scrolling a page never marks it complete
    Given a reader has no saved progress
    When the reader opens a learning page and scrolls to its end
    Then the page is not counted as done
