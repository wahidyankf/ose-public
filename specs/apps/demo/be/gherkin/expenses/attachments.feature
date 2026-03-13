Feature: Entry Attachments

  As an authenticated user
  I want to attach images and documents to expense entries
  So that I can store receipts and invoices alongside each transaction

  Supported types — images: image/jpeg, image/png; documents: application/pdf

  Background:
    Given the API is running
    And a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"
    And "alice" has logged in and stored the access token
    And alice has created an entry with body { "amount": "10.50", "currency": "USD", "category": "food", "description": "Lunch", "date": "2025-01-15", "type": "expense" }

  Scenario: Upload JPEG image returns 201 with attachment metadata
    When alice uploads file "receipt.jpg" with content type "image/jpeg" to POST /api/v1/expenses/{expenseId}/attachments
    Then the response status code should be 201
    And the response body should contain a non-null "id" field
    And the response body should contain "filename" equal to "receipt.jpg"
    And the response body should contain "content_type" equal to "image/jpeg"
    And the response body should contain a non-null "url" field

  Scenario: Upload PDF document returns 201 with attachment metadata
    When alice uploads file "invoice.pdf" with content type "application/pdf" to POST /api/v1/expenses/{expenseId}/attachments
    Then the response status code should be 201
    And the response body should contain a non-null "id" field
    And the response body should contain "filename" equal to "invoice.pdf"
    And the response body should contain "content_type" equal to "application/pdf"
    And the response body should contain a non-null "url" field

  Scenario: List attachments for an entry returns all uploaded files with metadata
    Given alice has uploaded file "receipt.jpg" with content type "image/jpeg" to the entry
    And alice has uploaded file "invoice.pdf" with content type "application/pdf" to the entry
    When alice sends GET /api/v1/expenses/{expenseId}/attachments
    Then the response status code should be 200
    And the response body should contain 2 items in the "attachments" array
    And the response body should contain an attachment with "filename" equal to "receipt.jpg"
    And the response body should contain an attachment with "filename" equal to "invoice.pdf"

  Scenario: Delete attachment returns 204
    Given alice has uploaded file "receipt.jpg" with content type "image/jpeg" to the entry
    When alice sends DELETE /api/v1/expenses/{expenseId}/attachments/{attachmentId}
    Then the response status code should be 204

  Scenario: Upload unsupported file type returns 415
    When alice uploads file "malware.exe" with content type "application/octet-stream" to POST /api/v1/expenses/{expenseId}/attachments
    Then the response status code should be 415
    And the response body should contain a validation error for "file"

  Scenario: Upload file exceeding the size limit returns 413
    When alice uploads an oversized file to POST /api/v1/expenses/{expenseId}/attachments
    Then the response status code should be 413
    And the response body should contain an error message about file size

  Scenario: Upload attachment to another user's entry returns 403
    Given a user "bob" is registered with email "bob@example.com" and password "Str0ng#Pass2"
    And bob has created an entry with body { "amount": "25.00", "currency": "USD", "category": "transport", "description": "Taxi", "date": "2025-01-15", "type": "expense" }
    When alice uploads file "receipt.jpg" with content type "image/jpeg" to POST /api/v1/expenses/{bobExpenseId}/attachments
    Then the response status code should be 403

  Scenario: List attachments on another user's entry returns 403
    Given a user "bob" is registered with email "bob@example.com" and password "Str0ng#Pass2"
    And bob has created an entry with body { "amount": "25.00", "currency": "USD", "category": "transport", "description": "Taxi", "date": "2025-01-15", "type": "expense" }
    When alice sends GET /api/v1/expenses/{bobExpenseId}/attachments
    Then the response status code should be 403

  Scenario: Delete attachment on another user's entry returns 403
    Given a user "bob" is registered with email "bob@example.com" and password "Str0ng#Pass2"
    And bob has created an entry with body { "amount": "25.00", "currency": "USD", "category": "transport", "description": "Taxi", "date": "2025-01-15", "type": "expense" }
    And alice has uploaded file "receipt.jpg" with content type "image/jpeg" to the entry
    When alice sends DELETE /api/v1/expenses/{bobExpenseId}/attachments/{attachmentId}
    Then the response status code should be 403

  Scenario: Delete non-existent attachment returns 404
    Given alice has uploaded file "receipt.jpg" with content type "image/jpeg" to the entry
    When alice sends DELETE /api/v1/expenses/{expenseId}/attachments/{randomAttachmentId}
    Then the response status code should be 404
