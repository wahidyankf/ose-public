Feature: Home page
  # Behaviour: OSA-001
  Scenario: Home page shows the OSE Application heading
    Given the ose-app-web dev server is running
    When I navigate to "/"
    Then I see the heading "OSE Application"

  # Behaviour: OSA-002
  Scenario: Home page offers a Get Started button
    Given the ose-app-web dev server is running
    When I navigate to "/"
    Then I see a "Get Started" button
