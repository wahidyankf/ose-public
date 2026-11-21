Feature: Language Setting

  As an app user
  I want to switch the app language between English and Bahasa Indonesia
  So that I can use the app in my preferred language

  # Behaviour: OAW-018
  Scenario: Selecting Bahasa shows the app in Indonesian
    Given the settings screen shows language is English
    When the user selects Indonesian language
    Then the language is set to Indonesian

  # Behaviour: OAW-018
  Scenario: Selecting English shows the app in English
    Given the settings screen shows language is Indonesian
    When the user selects English language
    Then the language is set to English
