Feature: Responsive Layout

  As a user accessing the app from different devices
  I want the interface to adapt to my screen size
  So that I can use the app comfortably on desktop, tablet, and mobile

  Background:
    Given the app is running
    And a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"
    And alice has logged in

  Scenario: Desktop viewport shows full sidebar navigation
    Given the viewport is set to "desktop" (1280x800)
    When alice navigates to the dashboard
    Then the sidebar navigation should be visible
    And the sidebar should display navigation labels alongside icons

  Scenario: Tablet viewport collapses sidebar to icons only
    Given the viewport is set to "tablet" (768x1024)
    When alice navigates to the dashboard
    Then the sidebar navigation should be collapsed to icon-only mode
    And hovering over a sidebar icon should show a tooltip with the label

  Scenario: Mobile viewport hides sidebar behind a hamburger menu
    Given the viewport is set to "mobile" (375x667)
    When alice navigates to the dashboard
    Then the sidebar should not be visible
    And a hamburger menu button should be displayed in the header
    When alice taps the hamburger menu button
    Then a slide-out navigation drawer should appear

  Scenario: Mobile navigation drawer closes on item selection
    Given the viewport is set to "mobile" (375x667)
    And the navigation drawer is open
    When alice taps a navigation item
    Then the drawer should close
    And the selected page should load

  Scenario: Entry list displays as a table on desktop
    Given the viewport is set to "desktop" (1280x800)
    And alice has created 3 entries
    When alice navigates to the entry list page
    Then entries should be displayed in a multi-column table
    And the table should show columns for date, description, category, amount, and currency

  Scenario: Entry list displays as cards on mobile
    Given the viewport is set to "mobile" (375x667)
    And alice has created 3 entries
    When alice navigates to the entry list page
    Then entries should be displayed as stacked cards
    And each card should show description, amount, and date

  Scenario: Admin user list is scrollable horizontally on mobile
    Given an admin user "superadmin" is logged in
    And the viewport is set to "mobile" (375x667)
    When the admin navigates to the user management page
    Then the user list should be horizontally scrollable
    And the visible columns should prioritize username and status

  Scenario: P&L report chart adapts to viewport width
    Given the viewport is set to "tablet" (768x1024)
    And alice has created income and expense entries
    When alice navigates to the reporting page
    Then the P&L chart should resize to fit the viewport
    And category breakdowns should stack vertically below the chart

  Scenario: Login form is centered and full-width on mobile
    Given alice has logged out
    And the viewport is set to "mobile" (375x667)
    When alice navigates to the login page
    Then the login form should span the full viewport width with padding
    And the form inputs should be large enough for touch interaction

  Scenario: Attachment upload area adapts to mobile
    Given the viewport is set to "mobile" (375x667)
    And alice has created an entry with description "Lunch"
    When alice opens the entry detail for "Lunch"
    Then the attachment upload area should display a prominent upload button
    And drag-and-drop should be replaced with a file picker
