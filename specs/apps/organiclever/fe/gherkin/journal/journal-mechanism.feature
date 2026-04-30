Feature: Generic journal entry mechanism on /app
  As a user of organiclever-web
  I want to log, edit, and delete generic journal entries with a name and payload
  So that I have a working entry-capture loop before the typed app ships

  Background:
    Given the app is running
    And I have opened "/app" in a fresh browser session

  Scenario: Empty state on first visit
    Given PGlite database "ol_journal_v1" (IndexedDB) is empty
    Then I see a heading "Journal"
    And I see empty-state copy "No entries yet — press + to add one"
    And I see a focusable button labelled "Add entry"

  Scenario: Adding a single entry
    When I press the "Add entry" button
    Then a form sheet opens with one draft containing a "Name" input and a "Payload" textarea
    When I type "workout" into the "Name" input of draft 1
    And I type "{\"reps\": 12, \"weight\": 20}" into the "Payload" textarea of draft 1
    And I press the "Save" button
    Then the form sheet closes
    And the list shows one entry with name "workout"
    And the list entry shows a relative timestamp "just now"
    And the list entry does not show an "edited" line
    And PGlite database "ol_journal_v1" (IndexedDB) contains exactly one entry with name "workout"

  Scenario: Adding a batch of three drafts
    When I press the "Add entry" button
    And I type "workout" into the "Name" input of draft 1
    And I type "{\"reps\": 12}" into the "Payload" textarea of draft 1
    And I press the "+ Add another" button
    And I type "reading" into the "Name" input of draft 2
    And I type "{\"title\": \"Sapiens\"}" into the "Payload" textarea of draft 2
    And I press the "+ Add another" button
    And I type "meditation" into the "Name" input of draft 3
    And I type "{\"durationMins\": 20}" into the "Payload" textarea of draft 3
    And I press the "Save" button
    Then the form sheet closes
    And the list shows three entries
    And the entries appear in storage order: "workout", "reading", "meditation"
    And the rendered list shows them with the same "createdAt" timestamp
    And every entry has "updatedAt" equal to its "createdAt"
    And PGlite database "ol_journal_v1" (IndexedDB) contains exactly three entries (no nested arrays)

  Scenario: Batch timestamp + sort across batches
    Given the list shows three entries from a single earlier batch
    When I press the "Add entry" button
    And I add a draft with name "focus" and payload "{}"
    And I press the "Save" button
    Then the list shows four entries
    And the newest entry "focus" appears first in the list
    And the three earlier entries appear after, in their original within-batch order

  Scenario: Removing a draft from the sheet before saving
    When I press the "Add entry" button
    And I press the "+ Add another" button
    And I press the "Remove draft" button on draft 2
    Then the sheet shows one draft

  Scenario: Persisting entries across reload
    Given the list shows two entries with names "workout" and "reading"
    When I hard-reload the page
    Then the list still shows two entries with names "workout" and "reading"
    And the order is preserved (newest first)

  Scenario: Cancelling the form discards every draft
    When I press the "Add entry" button
    And I type "workout" into the "Name" input of draft 1
    And I press the "+ Add another" button
    And I type "reading" into the "Name" input of draft 2
    And I press the "Cancel" button
    Then the form sheet closes
    And the list still shows zero entries
    And PGlite database "ol_journal_v1" (IndexedDB) remains empty

  Scenario: Mixed-validity batch is rejected as a whole
    When I press the "Add entry" button
    And I type "workout" into the "Name" input of draft 1
    And I type "{\"reps\": 12}" into the "Payload" textarea of draft 1
    And I press the "+ Add another" button
    And I leave the "Name" input of draft 2 empty
    And I press the "Save" button
    Then I see an inline error on draft 2: "Name is required"
    And the form sheet remains open
    And PGlite database "ol_journal_v1" (IndexedDB) remains empty

  Scenario: Submitting invalid JSON payload is rejected
    When I press the "Add entry" button
    And I type "workout" into the "Name" input of draft 1
    And I type "{not json}" into the "Payload" textarea of draft 1
    And I press the "Save" button
    Then I see an inline error on draft 1: "Payload must be valid JSON"
    And the form sheet remains open

  Scenario: Storage unavailable surfaces a typed error banner
    Given the IndexedDB API is unavailable in this browser session
    When I open "/app"
    Then I see an inline error banner reading "Storage unavailable — data was not saved"
    And the banner is rendered because the React layer narrowed `state.status === "error"` and `state.cause._tag === "StorageUnavailable"`
    And no "Add entry" button is rendered while `state.status !== "ready"`

  Scenario: Preset name chips fill the name input of the focused draft
    When I press the "Add entry" button
    And I click the "reading" preset chip on draft 1
    Then the "Name" input of draft 1 has the value "reading"

  Scenario: Expanding payload preview shows the full JSON
    Given the list shows one entry with payload "{\"title\": \"Sapiens\", \"pages\": 320, \"notes\": \"Excellent\"}"
    When I click the "View payload" disclosure on that entry
    Then the row expands to show the full pretty-printed JSON payload

  Scenario: Editing an entry refreshes updatedAt without reordering
    Given the list shows two entries:
      | name    | payload                |
      | reading | {"title": "Sapiens"}   |
      | workout | {"reps": 12}           |
    And the newest entry in the list is "reading"
    When I press the "Edit" button on the "reading" entry
    Then the form sheet opens seeded with name "reading" and payload "{\"title\": \"Sapiens\"}"
    When I change the payload to "{\"title\": \"Sapiens\", \"pages\": 320}"
    And I press the "Save" button
    Then the form sheet closes
    And the "reading" entry still appears first in the list
    And the "reading" entry shows an "edited just now" line
    And the "reading" entry's "createdAt" is unchanged
    And the "reading" entry's "updatedAt" is later than its "createdAt"

  Scenario: Deleting an entry requires confirmation
    Given the list shows two entries with names "workout" and "reading"
    When I press the "Delete" button on the "reading" entry
    Then I see an inline confirm "Delete this entry? Yes / Cancel"
    When I press the "Cancel" confirm button
    Then the list still shows two entries
    When I press the "Delete" button on the "reading" entry
    And I press the "Yes" confirm button
    Then the list shows one entry with name "workout"
    And PGlite database "ol_journal_v1" (IndexedDB) contains exactly one entry with name "workout"

  Scenario: Bumping (bring to top) mutates createdAt and reorders
    Given the list shows two entries:
      | name    | payload                |
      | reading | {"title": "Sapiens"}   |
      | workout | {"reps": 12}           |
    And the newest entry in the list is "reading"
    And I record the original "createdAt" of the "workout" entry as T0
    When I press the "Bring to top" button on the "workout" entry
    Then the list shows the "workout" entry first
    And the "reading" entry appears second
    And the "workout" entry's "createdAt" is later than T0
    And the "workout" entry's "updatedAt" equals its new "createdAt"
    And PGlite database "ol_journal_v1" (IndexedDB) reflects the new "createdAt" for the "workout" entry

  Scenario: Bump persists across reload
    Given the list shows two entries with names "workout" and "reading"
    And I press the "Bring to top" button on the "workout" entry
    When I hard-reload the page
    Then the list still shows two entries
    And the "workout" entry still appears first
