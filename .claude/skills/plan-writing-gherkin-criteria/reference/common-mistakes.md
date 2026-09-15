# Gherkin Acceptance Criteria — Common Mistakes

## Mistake 1: Too many steps per scenario

**Problem**: Scenarios with 15+ steps become hard to read and maintain

**Solution**: Break into multiple scenarios or use Background for common setup

```gherkin
# ❌ Too long
Scenario: Complete purchase workflow
  Given I am on homepage
  When I search for "laptop"
  And I click first result
  And I click "Add to Cart"
  And I click "View Cart"
  And I click "Checkout"
  And I fill in shipping address
  And I fill in billing address
  And I select payment method
  And I enter card details
  And I click "Place Order"
  Then order should be confirmed
  # (continues for many more steps...)

# ✅ Better - Break into multiple scenarios
Scenario: Add item to cart
  When I search for "laptop" and add first result to cart
  Then cart should contain 1 item

Scenario: Complete checkout with valid payment
  Given cart contains "laptop" item
  When I complete checkout with shipping address and payment details
  Then order should be placed successfully
```

## Mistake 2: Asserting internal implementation

**Problem**: Coupling tests to implementation details that may change

```gherkin
# ❌ Bad - Asserts internal state
Then user object should have "lastLoginTimestamp" property
And "sessions" database table should have new row
```

```gherkin
# ✅ Good - Asserts observable behaviour
Then user should be logged in
And user session should be active
```

## Mistake 3: Ambiguous language

**Problem**: Vague language open to interpretation

```gherkin
# ❌ Ambiguous
Then the system should respond quickly
```

```gherkin
# ✅ Specific
Then the response should be received within 200ms
```

## Mistake 4: Testing multiple behaviours in one scenario

**Problem**: Scenario tests multiple unrelated behaviours

```gherkin
# ❌ Bad - Multiple behaviours
# Deliberate non-conforming example — unrelated user-management and article-creation
# outcomes are combined; repeated primary keywords alone are allowed
Scenario: User management and article creation
  Given I create user "Alice"
  Then user "Alice" should exist
  And I create article "Test"
  Then article "Test" should exist

# ✅ Good - Separate scenarios
Scenario: Create new user
  When I create user "Alice"
  Then user "Alice" should exist in system

Scenario: Create new article
  Given I am logged in as editor
  When I create article "Test"
  Then article "Test" should be published
```
