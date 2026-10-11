---
title: "Capstone: Trust/Verify Log"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 20
---

_Capstone step 3 of 3 -- exercises co-17 (trust-vs-verify calibration) and co-24
(human-in-the-loop)._

Every change made during this capstone's session, mapped to a trust-or-verify decision and a
one-line rationale. A risky change (anything touching the actual conversion logic or its
correctness) always maps to a human verification step, not a skim.

| #   | Change                                                                                            | Decision                            | Rationale                                                                                                                                                                                                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | First generation of `parse_duration.py` (attempt 1)                                               | **Verify closely**                  | Novel logic (co-17): the conversion table and token-consumption check are exactly the kind of "looks right, might not be" arithmetic this topic's `ex-15 · spot-a-hallucinated-api` and `ex-47 · reject-a-confidently-wrong-refactor` warn about -- ran the full test suite rather than reading and trusting the code. |
| 2   | Rejecting attempt 1                                                                               | **Verify closely / human decision** | The failure was real (co-16), not a flaky test -- a human read the failure output, traced it to the exact wrong dict value, and wrote the rejection reason before any further generation was requested.                                                                                                                |
| 3   | One-line fix (`"m": 600` -> `"m": 60`)                                                            | **Verify closely**                  | Small diff, but it is the exact line that caused the failure -- re-ran the full suite rather than assuming a one-line change is automatically safe.                                                                                                                                                                    |
| 4   | Extract-method refactor (step 3)                                                                  | **Trust lightly, verify the tests** | Mechanical, no signature or behavior change claimed -- skimmed the diff for scope (co-15's checklist: does it touch anything beyond the stated refactor?), then let the test suite be the actual proof, matching `ex-16 · delegate-boilerplate-safely`'s "skim + why that was sufficient" pattern.                     |
| 5   | Final acceptance of `parse_duration.py` + `test_parse_duration.py` into `learning/capstone/code/` | **Human decision gate**             | The feature only ships once every one of the seven acceptance-criteria tests (from `prompt.md`) is green in the SAME run, confirmed by re-running the suite one final time against the exact files being committed -- not by trusting the last individual step's output in isolation.                                  |

**Verify**: every risky row above (1, 2, 3, 5 -- anything touching correctness) maps to an explicit
"verify closely" or "human decision gate" entry with a stated reason; only the purely mechanical
refactor (row 4) is trusted lightly, and even then the tests -- not a skim alone -- are the actual
gate.

## Capstone acceptance criteria -- final check

- [x] The feature passes its tests: all seven acceptance-criteria tests pass in the final run (step
      3's captured `7 passed in 0.00s`).
- [x] Every accepted change was verified before being built on: steps 2 and 3 each re-ran the full
      suite before the next step began.
- [x] The log above justifies each trust/verify call.
- [x] No unreviewed agent output reached the final diff: attempt 1 was caught, rejected, and never
      merged -- only the fixed-and-refactored final version lives in `learning/capstone/code/`.

**Done bar**: runnable end-to-end -- `python3 -m pytest test_parse_duration.py -q` against
`learning/capstone/code/` reproduces the final `7 passed` transcript; the capstone names no external
protocol, vendor, or version claim requiring a source.

---

← Previous: [Session](./session/overview.md)
