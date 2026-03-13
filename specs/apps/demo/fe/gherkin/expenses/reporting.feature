Feature: Financial Reporting

  As an authenticated user
  I want to view a profit-and-loss summary for a date range
  So that I can review my net financial position for any period

  Background:
    Given the app is running
    And a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"
    And alice has logged in

  Scenario: P&L report displays income total, expense total, and net for a period
    Given alice has created an income entry of "5000.00" USD on "2025-01-15"
    And alice has created an expense entry of "150.00" USD on "2025-01-20"
    When alice navigates to the reporting page
    And alice selects date range "2025-01-01" to "2025-01-31" with currency "USD"
    Then the report should display income total "5000.00"
    And the report should display expense total "150.00"
    And the report should display net "4850.00"

  Scenario: P&L breakdown shows category-level amounts
    Given alice has created income entries in categories "salary" and "freelance"
    And alice has created expense entries in category "transport"
    When alice navigates to the reporting page
    And alice selects the appropriate date range and currency "USD"
    Then the income breakdown should list "salary" and "freelance" categories
    And the expense breakdown should list "transport" category

  Scenario: Income entries are excluded from expense total
    Given alice has created only an income entry of "1000.00" USD on "2025-03-05"
    When alice views the P&L report for March 2025 in USD
    Then the report should display income total "1000.00"
    And the report should display expense total "0.00"

  Scenario: Expense entries are excluded from income total
    Given alice has created only an expense entry of "75.00" USD on "2025-04-10"
    When alice views the P&L report for April 2025 in USD
    Then the report should display income total "0.00"
    And the report should display expense total "75.00"

  Scenario: P&L report filters by currency without mixing
    Given alice has created income entries in both USD and IDR
    When alice views the P&L report filtered to "USD" only
    Then the report should display only USD amounts
    And no IDR amounts should be included

  Scenario: P&L report for a period with no entries shows zero totals
    When alice navigates to the reporting page
    And alice selects date range "2099-01-01" to "2099-01-31" with currency "USD"
    Then the report should display income total "0.00"
    And the report should display expense total "0.00"
    And the report should display net "0.00"
