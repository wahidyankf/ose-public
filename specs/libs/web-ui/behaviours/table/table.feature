Feature: Table

  # Behaviour: WUI-031
  Scenario: A table exposes header, body, rows, cells, and caption as table semantics
    Given a table with the caption "Invoices", the column header "Invoice", and the body row cell "INV-001"
    Then the table has the caption "Invoices"
    And the table has the column header "Invoice"
    And the table has a body row with the cell "INV-001"
