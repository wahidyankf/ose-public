Feature: Unit Handling

  As an authenticated user
  I want to optionally attach a quantity and unit of measure to an expense
  So that I can track commodity purchases alongside their monetary cost

  Background:
    Given the app is running
    And a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"
    And alice has logged in

  Scenario: Expense with metric unit "liter" displays quantity and unit
    Given alice has created an expense with amount "75000", currency "IDR", category "fuel", description "Petrol", date "2025-01-15", quantity 50.5, and unit "liter"
    When alice views the entry detail for "Petrol"
    Then the quantity should display as "50.5"
    And the unit should display as "liter"

  Scenario: Expense with imperial unit "gallon" displays quantity and unit
    Given alice has created an expense with amount "45.00", currency "USD", category "fuel", description "Gas", date "2025-01-15", quantity 10, and unit "gallon"
    When alice views the entry detail for "Gas"
    Then the quantity should display as "10"
    And the unit should display as "gallon"

  Scenario: Unsupported unit shows a validation error
    When alice navigates to the new entry form
    And alice fills in amount "10.00", currency "USD", category "misc", description "Cargo", date "2025-01-15", type "expense", quantity 5, and unit "fathom"
    And alice submits the entry form
    Then a validation error for the unit field should be displayed

  Scenario: Expense without quantity and unit fields is accepted
    When alice navigates to the new entry form
    And alice fills in amount "25.00", currency "USD", category "food", description "Dinner", date "2025-01-15", and type "expense"
    And alice leaves the quantity and unit fields empty
    And alice submits the entry form
    Then the entry list should contain an entry with description "Dinner"
