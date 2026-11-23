Feature: Sidebar course categories

  As a learner moving between courses
  I want the sidebar's Courses section grouped by category
  So that I see the courses near me without scrolling past the whole library

  # Behaviour: AYW-040
  Scenario: The Courses section lists category groups
    When a reader opens the courses page
    Then the sidebar Courses section shows one group button per category with its course count
    And every group starts closed

  Scenario: The current course's group starts open
    When a reader opens the "SQL Essentials" course landing page
    Then the "Data and databases" group is open
    And "SQL Essentials" is marked as the current page
    And every other group is closed

  Scenario: A group opens and closes from the keyboard
    Given the sidebar shows a closed group
    When the reader focuses its button and presses Enter
    Then the group's courses are shown and the button reports that it is expanded
    When the reader presses Space
    Then the group's courses are hidden and the button reports that it is collapsed

  Scenario: The mobile drawer shows the same groups
    Given a viewport 375 pixels wide
    When the reader opens the navigation drawer on the "SQL Essentials" course landing page
    Then the drawer shows the same category groups
    And the "Data and databases" group is open

  # Exemption(integration): the assertion reads the rendered page in a browser, and the integration project runs in node with no DOM or browser driver, so the end-to-end project supplies that browser; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A group the reader opened stays open while the page finishes loading
  @integration-exempt
  # Exemption(e2e): a browser run cannot hold the path context reader suspended, so the boundary is the unit tier; alternative-proof: ayokoding-www:test:unit / A group the reader opened stays open while the page finishes loading
  @e2e-exempt
  Scenario: A group the reader opened stays open while the page finishes loading
    Given the reader has opened the "Tools and practices" group on the courses page
    When the course path context finishes loading
    Then the "Tools and practices" group is still open with its course listed
    And the sidebar is still a single navigation region
    And the path context query is not read
    When the reader presses Space on the group button
    Then the "Tools and practices" group closes
