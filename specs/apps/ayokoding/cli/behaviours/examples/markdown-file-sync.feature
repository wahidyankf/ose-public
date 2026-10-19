Feature: Lesson code matches the files that run
  As a reader
  I want every code block in a lesson to be the code that runs
  So that what I copy behaves as the lesson says

  Background:
    Given an opted-in course

  Scenario: A lesson block identical to its file passes
    Given a lesson block anchored to "learning/code/ex-01-hello/example.py" with the same bytes as the file
    When I sync the course
    Then no sync finding is reported

  # Exemption(e2e): sync compares files on the local filesystem and starts no container; alternative-proof: ayokoding-cli:test:integration / A lesson block that differs from its file is a mismatch
  @e2e-exempt
  Scenario: A lesson block that differs from its file is a mismatch
    Given a lesson block anchored to "learning/code/ex-01-hello/example.py" that differs on its third line
    When I sync the course
    Then the finding "ayokoding.sync.mismatch" names the lesson file, the anchor line, and the third line

  # Exemption(e2e): sync compares files on the local filesystem and starts no container; alternative-proof: ayokoding-cli:test:integration / An anchor to a missing file is reported
  @e2e-exempt
  Scenario: An anchor to a missing file is reported
    Given a lesson block anchored to "learning/code/ex-09-gone/example.py", which does not exist
    When I sync the course
    Then the finding "ayokoding.sync.missing-file" names "learning/code/ex-09-gone/example.py"

  # Exemption(e2e): sync compares files on the local filesystem and starts no container; alternative-proof: ayokoding-cli:test:integration / A line-range anchor compares only the selected lines
  @e2e-exempt
  Scenario: A line-range anchor compares only the selected lines
    Given a lesson block anchored to lines 3 to 5 of a ten-line file and holding exactly those lines
    When I sync the course
    Then no sync finding is reported

  # Exemption(e2e): sync compares files on the local filesystem and starts no container; alternative-proof: ayokoding-cli:test:integration / An unanchored code block is reported unless marked as an illustration
  @e2e-exempt
  Scenario: An unanchored code block is reported unless marked as an illustration
    Given a lesson with one unanchored "python" block and one "python" block marked as an illustration
    When I sync the course
    Then exactly one finding "ayokoding.sync.unanchored-fence" is reported, for the unmarked block

  # Exemption(e2e): sync compares files on the local filesystem and starts no container; alternative-proof: ayokoding-cli:test:integration / An output block must be anchored to an expected-output file
  @e2e-exempt
  Scenario: An output block must be anchored to an expected-output file
    Given a lesson with an "Output" block that has no anchor
    When I sync the course
    Then the finding "ayokoding.sync.unanchored-output" names the lesson line

  # Exemption(e2e): sync compares files on the local filesystem and starts no container; alternative-proof: ayokoding-cli:test:integration / A unit no lesson shows is reported
  @e2e-exempt
  Scenario: A unit no lesson shows is reported
    Given the unit "learning/code/ex-05-sets" that no lesson anchor targets
    When I sync the course
    Then the finding "ayokoding.sync.unreferenced-unit" names "learning/code/ex-05-sets"

  Scenario: Writing the sync repairs anchored blocks from their files
    Given a lesson block anchored to a file whose bytes differ from the block
    When I sync the course with writing enabled
    Then the lesson block holds the file's bytes
    And syncing again reports no finding and changes no file
