Feature: Currency Handling

  As an authenticated user
  I want expense amounts displayed with correct precision per currency
  So that monetary values are never imprecise or cross-currency mixed

  Background:
    Given the app is running
    And a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"
    And alice has logged in

  Scenario: USD expense displays two decimal places
    Given alice has created an expense with amount "10.50", currency "USD", category "food", description "Coffee", and date "2025-01-15"
    When alice views the entry detail for "Coffee"
    Then the amount should display as "10.50"
    And the currency should display as "USD"

  Scenario: IDR expense displays as a whole number
    Given alice has created an expense with amount "150000", currency "IDR", category "transport", description "Taxi", and date "2025-01-15"
    When alice views the entry detail for "Taxi"
    Then the amount should display as "150000"
    And the currency should display as "IDR"

  Scenario: Unsupported currency code shows a validation error
    When alice navigates to the new entry form
    And alice fills in amount "10.00", currency "EUR", category "food", description "Lunch", date "2025-01-15", and type "expense"
    And alice submits the entry form
    Then a validation error for the currency field should be displayed

  Scenario: Malformed currency code shows a validation error
    When alice navigates to the new entry form
    And alice fills in amount "10.00", currency "US", category "food", description "Lunch", date "2025-01-15", and type "expense"
    And alice submits the entry form
    Then a validation error for the currency field should be displayed

  Scenario: Expense summary groups totals by currency
    Given alice has created expenses in both USD and IDR
    When alice navigates to the expense summary page
    Then the summary should display a separate total for "USD"
    And the summary should display a separate total for "IDR"
    And no cross-currency total should be shown

  Scenario: Negative amount shows a validation error
    When alice navigates to the new entry form
    And alice fills in amount "-10.00", currency "USD", category "food", description "Refund", date "2025-01-15", and type "expense"
    And alice submits the entry form
    Then a validation error for the amount field should be displayed
