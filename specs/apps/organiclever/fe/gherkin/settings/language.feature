Feature: Language Setting

  Scenario: Switch to Bahasa Indonesia
    Given the settings screen shows language is English
    When the user selects Indonesian language
    Then the language is set to Indonesian

  Scenario: Switch back to English
    Given the settings screen shows language is Indonesian
    When the user selects English language
    Then the language is set to English
