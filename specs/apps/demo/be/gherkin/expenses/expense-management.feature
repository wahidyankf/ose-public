Feature: Financial Entry Management

  As an authenticated user
  I want to record and manage income and expense entries
  So that I can track my financial activity across currencies and categories

  Background:
    Given the API is running
    And a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"
    And "alice" has logged in and stored the access token

  Scenario: Create expense entry with amount and currency returns 201 with entry ID
    When alice sends POST /api/v1/expenses with body { "amount": "10.50", "currency": "USD", "category": "food", "description": "Lunch", "date": "2025-01-15", "type": "expense" }
    Then the response status code should be 201
    And the response body should contain a non-null "id" field

  Scenario: Create income entry with amount and currency returns 201 with entry ID
    When alice sends POST /api/v1/expenses with body { "amount": "3000.00", "currency": "USD", "category": "salary", "description": "Monthly salary", "date": "2025-01-31", "type": "income" }
    Then the response status code should be 201
    And the response body should contain a non-null "id" field

  Scenario: Get own entry by ID returns amount, currency, category, description, date, and type
    Given alice has created an entry with body { "amount": "10.50", "currency": "USD", "category": "food", "description": "Lunch", "date": "2025-01-15", "type": "expense" }
    When alice sends GET /api/v1/expenses/{expenseId}
    Then the response status code should be 200
    And the response body should contain "amount" equal to "10.50"
    And the response body should contain "currency" equal to "USD"
    And the response body should contain "category" equal to "food"
    And the response body should contain "description" equal to "Lunch"
    And the response body should contain "date" equal to "2025-01-15"
    And the response body should contain "type" equal to "expense"

  Scenario: List own entries returns a paginated response
    Given alice has created 3 entries
    When alice sends GET /api/v1/expenses
    Then the response status code should be 200
    And the response body should contain a non-null "data" field
    And the response body should contain a non-null "total" field
    And the response body should contain a non-null "page" field

  Scenario: Update an entry amount and description returns 200
    Given alice has created an entry with body { "amount": "10.00", "currency": "USD", "category": "food", "description": "Breakfast", "date": "2025-01-10", "type": "expense" }
    When alice sends PUT /api/v1/expenses/{expenseId} with body { "amount": "12.00", "currency": "USD", "category": "food", "description": "Updated breakfast", "date": "2025-01-10", "type": "expense" }
    Then the response status code should be 200
    And the response body should contain "amount" equal to "12.00"
    And the response body should contain "description" equal to "Updated breakfast"

  Scenario: Delete an entry returns 204
    Given alice has created an entry with body { "amount": "10.00", "currency": "USD", "category": "food", "description": "Snack", "date": "2025-01-05", "type": "expense" }
    When alice sends DELETE /api/v1/expenses/{expenseId}
    Then the response status code should be 204

  Scenario: Unauthenticated request to create an entry returns 401
    When the client sends POST /api/v1/expenses with body { "amount": "10.00", "currency": "USD", "category": "food", "description": "Coffee", "date": "2025-01-01", "type": "expense" }
    Then the response status code should be 401
