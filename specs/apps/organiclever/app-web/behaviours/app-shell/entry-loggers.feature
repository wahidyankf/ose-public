Feature: Entry Loggers

  As an app user
  I want to log different types of entries (reading, learning, meal, focus, custom) from the app shell
  So that all my activities are captured in the journal with minimal friction

  # Behaviour: OAW-014
  Scenario: The add button opens the Add Entry sheet and the user can close it
    Given the app shell is visible
    When the user taps the FAB
    Then the Add Entry sheet is open with all entry kinds
    When the user closes the Add Entry sheet
    Then the Add Entry sheet is closed

  # Behaviour: OAW-014
  Scenario Outline: Choosing an entry kind opens its logger
    Given the user has opened the Add Entry sheet
    When the user selects the "<kind>" entry kind
    Then the "<kind>" logger is open

    Examples:
      | kind     |
      | Reading  |
      | Learning |
      | Meal     |
      | Focus    |
      | Custom   |

  # Behaviour: OAW-014
  Scenario Outline: Saving an entry closes the logger and adds it to the journal
    Given the user has opened the "<kind>" logger
    When the user enters "<entry>" in the "<kind>" logger
    And the user saves the entry
    Then the entry appears in the journal and the logger closes

    Examples:
      | kind     | entry                |
      | Reading  | Atomic Habits        |
      | Learning | TypeScript generics  |
      | Meal     | Oatmeal with berries |
      | Focus    | 25                   |
      | Custom   | Evening walk         |

  # Behaviour: OAW-014
  Scenario: Reading logger save is disabled without title
    Given the user has opened the reading logger
    When the user has not entered a title
    Then the save button is disabled

  # Behaviour: OAW-014
  Scenario: Focus logger save requires task or duration
    Given the user has opened the focus logger
    When the user has not entered task or duration
    Then the save button is disabled
