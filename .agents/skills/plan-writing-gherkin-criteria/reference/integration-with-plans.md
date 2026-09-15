# Gherkin Acceptance Criteria — Integration with Plans

## Separate Plan Identity From Product Behaviour

A heading or mapping table may carry the plan requirement ID. A Gherkin packet intended for `specs/`
must write its Feature, Rule, Background, Scenario, Scenario Outline, Examples, steps, comments,
and tags in the owning app/lib's durable domain language. It must not contain a plan slug, number,
phase, delivery-unit name, or plan acceptance-criterion identifier. Outside the fence, record
`ADD`/`UPDATE`/`DELETE`/`RETAIN`, the exact owner-relative feature path, durable scenario title, and
Unit/Integration/E2E disposition. This keeps traceability while allowing the packet to be copied into
the long-lived owner corpus unchanged.

## Plan Acceptance Criteria Format

Plans use Gherkin for phase-level acceptance criteria. Keep the Markdown heading outside the fence:

### Acceptance Criteria

```gherkin
Scenario: Required skills are discoverable
  Given the repository requires reusable agent skills
  When the agent bindings are generated
  Then .claude/skills/ directory should exist with README and TEMPLATE
  And the required skills should be present
  And the AI Agents Convention should document the skills frontmatter field
  And each required skill should load for its declared task
  And existing agents should continue working without modification
```

## User Story Acceptance Criteria

User stories in requirements use detailed Gherkin scenarios. Keep the story statement and descriptive
label outside the Gherkin fence:

**User story:** As a content editor, I want to preview articles before publishing.

```gherkin
Scenario: Preview unpublished article
  Given I am logged in as content editor
  And I have draft article "Test Article"
  When I click "Preview" button for "Test Article"
  Then I should see article preview in new tab
  And preview should render markdown correctly
  And preview should display "DRAFT" watermark

Scenario: Preview shows latest changes
  Given I am editing article "Test Article"
  When I make changes to article content
  And I click "Preview" without saving
  Then preview should reflect unsaved changes
  And original article should remain unchanged in database
```
