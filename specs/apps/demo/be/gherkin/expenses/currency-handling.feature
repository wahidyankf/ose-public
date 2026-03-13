Feature: Currency Handling

  As an authenticated user
  I want expense amounts stored with correct precision per currency
  So that monetary values are never imprecise or cross-currency mixed

  Background:
    Given the API is running
    And a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"
    And "alice" has logged in and stored the access token

  Scenario: USD expense amount preserves two decimal places
    Given alice has created an expense with body { "amount": "10.50", "currency": "USD", "category": "food", "description": "Coffee", "date": "2025-01-15", "type": "expense" }
    When alice sends GET /api/v1/expenses/{expenseId}
    Then the response status code should be 200
    And the response body should contain "amount" equal to "10.50"
    And the response body should contain "currency" equal to "USD"

  Scenario: IDR expense amount is stored and returned as a whole number
    Given alice has created an expense with body { "amount": "150000", "currency": "IDR", "category": "transport", "description": "Taxi", "date": "2025-01-15", "type": "expense" }
    When alice sends GET /api/v1/expenses/{expenseId}
    Then the response status code should be 200
    And the response body should contain "amount" equal to "150000"
    And the response body should contain "currency" equal to "IDR"

  Scenario: Unsupported currency code returns 400
    When alice sends POST /api/v1/expenses with body { "amount": "10.00", "currency": "EUR", "category": "food", "description": "Lunch", "date": "2025-01-15", "type": "expense" }
    Then the response status code should be 400
    And the response body should contain a validation error for "currency"

  Scenario: Malformed currency code returns 400
    When alice sends POST /api/v1/expenses with body { "amount": "10.00", "currency": "US", "category": "food", "description": "Lunch", "date": "2025-01-15", "type": "expense" }
    Then the response status code should be 400
    And the response body should contain a validation error for "currency"

  Scenario: Expense summary groups totals by currency without cross-currency mixing
    Given alice has created an expense with body { "amount": "20.00", "currency": "USD", "category": "food", "description": "Lunch", "date": "2025-01-15", "type": "expense" }
    And alice has created an expense with body { "amount": "10.00", "currency": "USD", "category": "food", "description": "Coffee", "date": "2025-01-15", "type": "expense" }
    And alice has created an expense with body { "amount": "150000", "currency": "IDR", "category": "transport", "description": "Taxi", "date": "2025-01-15", "type": "expense" }
    When alice sends GET /api/v1/expenses/summary
    Then the response status code should be 200
    And the response body should contain "USD" total equal to "30.00"
    And the response body should contain "IDR" total equal to "150000"

  Scenario: Negative amount is rejected with 400
    When alice sends POST /api/v1/expenses with body { "amount": "-10.00", "currency": "USD", "category": "food", "description": "Refund", "date": "2025-01-15", "type": "expense" }
    Then the response status code should be 400
    And the response body should contain a validation error for "amount"
