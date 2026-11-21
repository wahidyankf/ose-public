Feature: Path-order navigation

  As a reader following a learning path
  I want prev/next and the path rail to follow the manifest's course order
  So that I always know where I am in the path and what comes next

  # Behaviour: AYW-134
  Scenario: Prev and next follow the active path's order
    Given a reader is on a course with an active path context
    When the reader reads the prev/next navigation
    Then prev and next are the neighboring courses in that path's manifest
    And both links preserve the path context query parameter
    And next crosses from the last core course into the first extension course, keeping the path context

  # Behaviour: AYW-135
  Scenario: The path rail shows the whole ordered arc beside a course at desktop width
    Given a reader opens a course in path context on a desktop-width viewport
    When the page renders
    Then the left rail lists that path's courses grouped under phase headings in manifest order with the current course marked
    And the current course is distinguished by a marker and weight, not by colour alone
    And the rail offers a link back to the full path and to the whole course library
    And each rail row shows its position number before the course title

  # Behaviour: AYW-137
  Scenario: The path readout opens the course drawer on a phone
    Given a reader opens a course in path context on a phone-width viewport
    When they activate the path readout's "open path course list" control
    Then the existing left navigation drawer opens showing that path's ordered courses

  # Behaviour: AYW-137
  Scenario: Focus moves into the path drawer and returns to its control on dismissal
    Given a reader opens a course in path context on a phone-width viewport
    When they activate the path readout's "open path course list" control
    Then focus moves into the drawer and returns to the control when the drawer is dismissed

  # Behaviour: AYW-136
  Scenario: The path rail scrolls the current course into view without moving the page
    Given a reader opens a course whose rail row starts below the visible part of the sidebar
    When the page renders
    Then the sidebar scrolls so the current course's row is fully visible
    And the page itself stays scrolled to the top

  # Behaviour: AYW-137
  Scenario: Choosing a course in the path drawer closes it
    Given a reader has the pocket drawer open from a course's path readout
    When they pick another course's row in the drawer
    Then the drawer closes

  # Behaviour: AYW-138
  Scenario: The path readout states the course position as course k of N on a phone
    Given a reader on a phone opens a course in path context
    Then the path readout reads "course 2 of 3"
