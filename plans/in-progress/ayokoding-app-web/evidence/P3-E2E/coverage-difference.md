# Behaviour coverage: 1001 before the moves, 1002 after

`rhino behaviour coverage validate` (the `test:behaviour:coverage` target) checked:

- before the moves: 1001 scenarios ([coverage-before-moves.raw.txt](./coverage-before-moves.raw.txt));
- after the moves, the new HTTP files, and the reference lines: 1002 scenarios, no findings
  ([coverage-after-moves.raw.txt](./coverage-after-moves.raw.txt); be and fe homes both report 1002, see
  [be-coverage-2.raw.txt](./be-coverage-2.raw.txt) and [fe-coverage-2.raw.txt](./fe-coverage-2.raw.txt)).

## Explanation

The difference is one scenario, and it is intended. The Outline "An old URL redirects 308 to its current page" in
`navigation/routes-and-navigation.feature` was split by plan N-9 into two blocks:

- the real-table rows stay in the Outline, which moves to the be home;
- one fixture-only scenario, "A fixture-only old URL redirects 308 to its current page" (`@fixture`), is new. It uses
  `/en/old-guide?from=local`, which the real corpus does not redirect.

Every other scenario is counted once, before and after: 18 moved scenarios were removed from their source files and
appear once in the four new files. No scenario was dropped and none was duplicated.

The plan's step said to stop on any difference. The owner's decision (coordinator, after the first report) accepts this
difference as the N-9 split. It is recorded in `learnings.md` (2026-11-28, P3-E2E section).
