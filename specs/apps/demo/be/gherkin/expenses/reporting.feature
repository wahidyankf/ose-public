Feature: Financial Reporting

  As an authenticated user
  I want to generate a profit-and-loss summary for a date range
  So that I can review my net financial position for any period

  Background:
    Given the API is running
    And a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"
    And "alice" has logged in and stored the access token

  Scenario: P&L summary returns income total, expense total, and net for a period
    Given alice has created an entry with body { "amount": "5000.00", "currency": "USD", "category": "salary", "description": "Monthly salary", "date": "2025-01-15", "type": "income" }
    And alice has created an entry with body { "amount": "150.00", "currency": "USD", "category": "food", "description": "Groceries", "date": "2025-01-20", "type": "expense" }
    When alice sends GET /api/v1/reports/pl?from=2025-01-01&to=2025-01-31&currency=USD
    Then the response status code should be 200
    And the response body should contain "income_total" equal to "5000.00"
    And the response body should contain "expense_total" equal to "150.00"
    And the response body should contain "net" equal to "4850.00"

  Scenario: P&L breakdown includes category-level amounts for income and expenses
    Given alice has created an entry with body { "amount": "3000.00", "currency": "USD", "category": "salary", "description": "Salary", "date": "2025-02-10", "type": "income" }
    And alice has created an entry with body { "amount": "500.00", "currency": "USD", "category": "freelance", "description": "Freelance project", "date": "2025-02-15", "type": "income" }
    And alice has created an entry with body { "amount": "200.00", "currency": "USD", "category": "transport", "description": "Monthly pass", "date": "2025-02-05", "type": "expense" }
    When alice sends GET /api/v1/reports/pl?from=2025-02-01&to=2025-02-28&currency=USD
    Then the response status code should be 200
    And the income breakdown should contain "salary" with amount "3000.00"
    And the income breakdown should contain "freelance" with amount "500.00"
    And the expense breakdown should contain "transport" with amount "200.00"

  Scenario: Income entries are excluded from expense total
    Given alice has created an entry with body { "amount": "1000.00", "currency": "USD", "category": "salary", "description": "Bonus", "date": "2025-03-05", "type": "income" }
    When alice sends GET /api/v1/reports/pl?from=2025-03-01&to=2025-03-31&currency=USD
    Then the response status code should be 200
    And the response body should contain "income_total" equal to "1000.00"
    And the response body should contain "expense_total" equal to "0.00"

  Scenario: Expense entries are excluded from income total
    Given alice has created an entry with body { "amount": "75.00", "currency": "USD", "category": "utilities", "description": "Internet bill", "date": "2025-04-10", "type": "expense" }
    When alice sends GET /api/v1/reports/pl?from=2025-04-01&to=2025-04-30&currency=USD
    Then the response status code should be 200
    And the response body should contain "income_total" equal to "0.00"
    And the response body should contain "expense_total" equal to "75.00"

  Scenario: P&L summary filters by currency without cross-currency mixing
    Given alice has created an entry with body { "amount": "1000.00", "currency": "USD", "category": "freelance", "description": "USD project", "date": "2025-05-01", "type": "income" }
    And alice has created an entry with body { "amount": "5000000", "currency": "IDR", "category": "freelance", "description": "IDR project", "date": "2025-05-01", "type": "income" }
    When alice sends GET /api/v1/reports/pl?from=2025-05-01&to=2025-05-31&currency=USD
    Then the response status code should be 200
    And the response body should contain "income_total" equal to "1000.00"

  Scenario: P&L summary for a period with no entries returns zero totals
    When alice sends GET /api/v1/reports/pl?from=2099-01-01&to=2099-01-31&currency=USD
    Then the response status code should be 200
    And the response body should contain "income_total" equal to "0.00"
    And the response body should contain "expense_total" equal to "0.00"
    And the response body should contain "net" equal to "0.00"
