Feature: Bilingual accessible shell

  As a reader visiting the learning site
  I want familiar navigation in my chosen language
  So that I can read comfortably on a phone or computer

  Background:
    Given the app is running

  Scenario Outline: The page shell uses the route's language
    When a reader opens the "<locale>" home page
    Then the document language is "<locale>"
    And the header, footer, and primary controls use that language

    Examples:
      | locale |
      | en     |
      | id     |

  Scenario: The locale switch preserves an available translated destination
    Given a reader is on a page with a translation in the other supported locale
    When the reader switches locale
    Then the translated page opens in the other locale
    And the active locale control matches the destination

  Scenario: Keyboard readers can skip the repeated navigation
    When a keyboard reader activates the skip-to-content link
    Then focus moves to the main content
    And the page retains a visible focus indicator

  Scenario Outline: The shell fits the viewport without document overflow
    When a reader opens a representative course page at "<width>" pixels wide
    Then the main content remains readable without horizontal document scrolling
    And the navigation uses the layout intended for that viewport

    Examples:
      | width |
      | 375   |
      | 768   |
      | 1280  |

  Scenario: Mobile navigation restores focus after dismissal
    Given a reader has opened the mobile navigation panel
    When the reader dismisses the panel with Escape
    Then the panel closes
    And focus returns to its opener

  Scenario: A selected theme survives a reload
    Given a reader has chosen the dark theme
    When the reader reloads the page
    Then the page uses the dark theme
    And theme text and controls remain accessible

  Scenario: A resized sidebar retains its width within supported bounds
    Given a reader has resized the desktop sidebar within the supported bounds
    When the reader opens another content page
    Then the sidebar uses the saved width
    And the content remains reachable at the current viewport size
