Feature: Internationalisation and Language Switching

  As a reader visiting AyoKoding
  I want to switch between available languages
  So that I can read content in my preferred language

  Background:
    Given the app is running

  # Behaviour: AYW-003
  Scenario: Language switcher displays the current locale
    When a visitor is on a page under the /en locale
    Then the language switcher should display "English" as the current language

  # Behaviour: AYW-004
  Scenario: Switching language redirects to the locale-specific URL
    Given a visitor is on the English AI benchmark page at /en/tools/ai-benchmark
    When the visitor selects Indonesian from the language switcher
    Then the visitor should be redirected to the Indonesian AI benchmark page at /id/tools/ai-benchmark

  # Behaviour: AYW-005
  Scenario: UI labels change to the selected language
    When a visitor is on the Indonesian version of a page
    Then navigation labels and UI text should be displayed in Indonesian
    And the page title and headings should reflect the Indonesian locale content
