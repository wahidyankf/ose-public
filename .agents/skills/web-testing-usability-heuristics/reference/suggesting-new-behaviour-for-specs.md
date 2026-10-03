# Suggesting New Behaviour for the Specs (Spec-Blind)

The agent does **not** read `specs/**`, so it cannot tell what the specs already cover. It can still
contribute spec value from the usability side: whenever the cognitive walkthrough or heuristic sweep
shows that a first-time user would reasonably **expect a behaviour the page does not provide**, the
agent captures that desired behaviour as a Gherkin scenario — a _suggestion_, not a gap verdict.

Propose a suggestion only when the missing behaviour is:

- **Grounded in a usability principle** — tie it to the same heuristic / walkthrough question / UX
  law / WCAG 3.x criterion the related finding cites (e.g. Heuristic 1 → a visible loading state or
  an explicit empty/zero-result message; Heuristics 5 & 9 → a confirmation before a destructive
  action).
- **Expressible as Given/When/Then** — concrete enough to become a scenario.
- **In the target's responsibility** — owned by this app/lib, not a third-party widget or the
  browser.

Each suggestion carries an ID (`USS-001`, …), the desired behaviour, the violated principle and the
`UWT-###` finding it pairs with, the proposed Gherkin scenario (use the
`plan-writing-gherkin-criteria` Skill), and a **spec-blind caveat**: "this agent did not read
`specs/**`; a spec-aware reviewer must confirm this behaviour is not already covered before adding
it." These land in `spec-suggestions.md`.

They are **desired-behaviour proposals from usability principles**, deliberately distinct from
the `spec-gaps.md` of `swe-web-tester` under its exploratory charter, which proposes scenarios for **already-observed correct
behaviour** after de-duplicating against the existing specs. The two never overlap by construction:
one suggests what _ought_ to exist for clarity (blind), the other documents what _does_ exist but is
unprotected (spec-aware). If the run surfaced no suggestions, omit the file and say so in
`README.md`.
