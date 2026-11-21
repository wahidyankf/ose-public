Feature: Responsive Layout

  As a reader visiting AyoKoding from different devices
  I want the layout to adapt to my screen size
  So that I can comfortably read content on desktop, laptop, and mobile

  Background:
    Given the app is running

  # Behaviour: AYW-050
  Scenario: Desktop viewport shows sidebar, content, and table of contents
    Given the viewport is set to "desktop" (1280x800)
    When a visitor opens a content page
    Then the sidebar navigation should be visible
    And the main content area should be visible
    And the table of contents should be visible

  Scenario: Laptop viewport shows sidebar and content but hides table of contents
    Given the viewport is set to "laptop" (1024x768)
    When a visitor opens a content page
    Then the sidebar navigation should be visible
    And the main content area should be visible
    And the table of contents should not be visible

  Scenario: Mobile viewport shows hamburger menu and hides sidebar
    Given the viewport is set to "mobile" (375x667)
    When a visitor opens a content page
    Then a hamburger menu button should be visible in the header
    And the sidebar navigation should not be visible

  Scenario: Mobile hamburger menu opens the sidebar drawer
    Given the viewport is set to "mobile" (375x667)
    And a visitor is on a content page
    When the visitor taps the hamburger menu button
    Then a sidebar drawer should slide into view
    And the sidebar navigation links should be visible inside the drawer
