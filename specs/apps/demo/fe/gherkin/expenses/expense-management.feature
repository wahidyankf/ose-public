Feature: Financial Entry Management

  As an authenticated user
  I want to record and manage income and expense entries through the UI
  So that I can track my financial activity across currencies and categories

  Background:
    Given the app is running
    And a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"
    And alice has logged in

  Scenario: Creating an expense entry adds it to the entry list
    When alice navigates to the new entry form
    And alice fills in amount "10.50", currency "USD", category "food", description "Lunch", date "2025-01-15", and type "expense"
    And alice submits the entry form
    Then the entry list should contain an entry with description "Lunch"

  Scenario: Creating an income entry adds it to the entry list
    When alice navigates to the new entry form
    And alice fills in amount "3000.00", currency "USD", category "salary", description "Monthly salary", date "2025-01-31", and type "income"
    And alice submits the entry form
    Then the entry list should contain an entry with description "Monthly salary"

  Scenario: Clicking an entry shows its full details
    Given alice has created an entry with amount "10.50", currency "USD", category "food", description "Lunch", date "2025-01-15", and type "expense"
    When alice clicks the entry "Lunch" in the list
    Then the entry detail should display amount "10.50"
    And the entry detail should display currency "USD"
    And the entry detail should display category "food"
    And the entry detail should display description "Lunch"
    And the entry detail should display date "2025-01-15"
    And the entry detail should display type "expense"

  Scenario: Entry list shows pagination for multiple entries
    Given alice has created 3 entries
    When alice navigates to the entry list page
    Then the entry list should display pagination controls
    And the entry list should show the total count

  Scenario: Editing an entry updates the displayed values
    Given alice has created an entry with amount "10.00", currency "USD", category "food", description "Breakfast", date "2025-01-10", and type "expense"
    When alice clicks the edit button on the entry "Breakfast"
    And alice changes the amount to "12.00" and description to "Updated breakfast"
    And alice saves the changes
    Then the entry detail should display amount "12.00"
    And the entry detail should display description "Updated breakfast"

  Scenario: Deleting an entry removes it from the list
    Given alice has created an entry with amount "10.00", currency "USD", category "food", description "Snack", date "2025-01-05", and type "expense"
    When alice clicks the delete button on the entry "Snack"
    And alice confirms the deletion
    Then the entry list should not contain an entry with description "Snack"

  Scenario: Unauthenticated visitor cannot access the entry form
    Given alice has logged out
    When alice navigates to the new entry form URL directly
    Then alice should be redirected to the login page
