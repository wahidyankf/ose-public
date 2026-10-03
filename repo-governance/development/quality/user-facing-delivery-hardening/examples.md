---
description: "Worked examples of the sixteen rules applied."
when_to_use: "Use for a concrete example of these rules applied."
---

# Examples

## PASS: A user-facing plan that cannot ship bland

```
- Delivery steps name the web-ui primitive per mockup element (Rule 2)
- Each of mobile/tablet/desktop mockups has its own RED/GREEN step (Rules 3, 9)
- Mockup colors annotated as theme tokens; reconciliation step present (Rule 8)
- Cascading-filter Gherkin enumerates region/country/city independently (Rule 4)
- Ordering test asserts which rows land above/below the divider (Rules 5, 12)
- Finalization blocks archival on production Playwright sign-off per breakpoint/locale (Rules 1, 10)
- Screenshots committed to evidence/ and referenced in delivery.md (Rules 1, 10; Evidence Capture Convention)
- Deploy-config sweep + live-URL smoke test included (Rule 11)
- A near-end three-tester round (web-exploratory + web-usability + web-design) runs across ALL locales; every EWT/UWT/DWT defect finding is fixed (ticked) before archival — deferral requires explicit user permission and only when the fix is genuinely impossible (SG-### proposals may be triaged) (Rule 15)
- For an API change, a near-end swe-api-tester (exploratory charter) round runs against the running endpoint(s); every AET-### defect finding is fixed (ticked) before archival (SG-### proposals may be triaged) (Rule 16)
```

## FAIL: The incident this convention prevents

```
- Tests assert "a tablist exists" and "a divider exists" — pass under bare markup and inverted logic
- One wide table ships; mobile/tablet mockups never bound
- Raw teal copied from the mockup; off-brand and semantically wrong
- Zero findings → archived to done/ → bland, buggy UI live in production
```
