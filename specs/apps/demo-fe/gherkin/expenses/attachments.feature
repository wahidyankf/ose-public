Feature: Entry Attachments

  As an authenticated user
  I want to attach images and documents to expense entries through the UI
  So that I can store receipts and invoices alongside each transaction

  Background:
    Given the app is running
    And a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"
    And alice has logged in
    And alice has created an entry with amount "10.50", currency "USD", category "food", description "Lunch", date "2025-01-15", and type "expense"

  Scenario: Uploading a JPEG image adds it to the attachment list
    When alice opens the entry detail for "Lunch"
    And alice uploads file "receipt.jpg" as an image attachment
    Then the attachment list should contain "receipt.jpg"
    And the attachment should display as type "image/jpeg"

  Scenario: Uploading a PDF document adds it to the attachment list
    When alice opens the entry detail for "Lunch"
    And alice uploads file "invoice.pdf" as a document attachment
    Then the attachment list should contain "invoice.pdf"
    And the attachment should display as type "application/pdf"

  Scenario: Entry detail shows all uploaded attachments
    Given alice has uploaded "receipt.jpg" and "invoice.pdf" to the entry
    When alice opens the entry detail for "Lunch"
    Then the attachment list should contain 2 items
    And the attachment list should include "receipt.jpg"
    And the attachment list should include "invoice.pdf"

  Scenario: Deleting an attachment removes it from the list
    Given alice has uploaded "receipt.jpg" to the entry
    When alice opens the entry detail for "Lunch"
    And alice clicks the delete button on attachment "receipt.jpg"
    And alice confirms the deletion
    Then the attachment list should not contain "receipt.jpg"

  Scenario: Uploading an unsupported file type shows an error
    When alice opens the entry detail for "Lunch"
    And alice attempts to upload file "malware.exe"
    Then an error message about unsupported file type should be displayed
    And the attachment list should remain unchanged

  Scenario: Uploading an oversized file shows an error
    When alice opens the entry detail for "Lunch"
    And alice attempts to upload an oversized file
    Then an error message about file size limit should be displayed
    And the attachment list should remain unchanged

  Scenario: Cannot upload attachment to another user's entry
    Given a user "bob" has created an entry with description "Taxi"
    When alice navigates to bob's entry detail
    Then the upload attachment button should not be visible

  Scenario: Cannot view attachments on another user's entry
    Given a user "bob" has created an entry with description "Taxi"
    When alice navigates to bob's entry detail
    Then an access denied message should be displayed

  Scenario: Cannot delete attachment on another user's entry
    Given a user "bob" has created an entry with an attachment
    When alice navigates to bob's entry detail
    Then the delete attachment button should not be visible

  Scenario: Deleting a non-existent attachment shows a not-found error
    Given alice has uploaded "receipt.jpg" to the entry
    And the attachment has been deleted from another session
    When alice clicks the delete button on attachment "receipt.jpg"
    And alice confirms the deletion
    Then an error message about attachment not found should be displayed
