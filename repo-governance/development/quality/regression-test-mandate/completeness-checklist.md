---
description: "Checklist before declaring a bug fix complete."
when_to_use: "Use as a final check before declaring a bug fix done."
---

# Completeness Checklist

Before declaring a bug fix complete, verify:

- [ ] A test exists that targets the specific defect condition (not a general "happy path" test
      that happened to pass even when broken).
- [ ] The test is committed in the same PR or commit as the fix (not in a follow-up).
- [ ] The test slots into the correct level per the [Behaviour-Driven Development](../../behaviour-driven-development.md).
- [ ] For behavioural/functional defects: a Gherkin scenario in `specs/**` captures the correct
      expectation and the test that consumes it is updated.
- [ ] `test:quick` passes (including Unit runtime and `test:behaviour:coverage`) after the fix + test are
      in place.
