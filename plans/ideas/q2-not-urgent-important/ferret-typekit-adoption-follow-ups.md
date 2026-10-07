# FERRET Follow-Ups from the `typekit` Adoption

One-line summary: moving FERRET onto returned `Result` values kept every code a caller sees, and so kept three things
that read as accidents: deadline-bound tests that also measure the host, an over-long `--limit` answered as unavailable
storage, and an `add_days` that can still raise.

> Surfaced 2026-10-07 while `ferret-cli` adopted `typekit.Result` (PR #655) and shipped `ferret-cli/v0.3.3`. Filed
> under Upstream Tool Defects, because FERRET is a pinned tool this repository owns. That change promised no change in
> behaviour, so it fixed none of these.

## Problem / context

1. **Deadline-bound scenarios fail under host load.** The fail-open scenarios assert wall-clock budgets on spawned
   processes. `apps/ferret-cli/tests/support/wrapper.py` sends TERM at 900 ms and KILL at 1,000 ms, and
   `within_deadline` accepts a call that returns within `DEADLINE_SECONDS` (1.0 s) plus `TAIL_SECONDS` (0.25 s). With
   the host's load average at 10 to 21 (concurrent integration tests and file indexing of a fresh worktree), these
   scenarios failed in four baseline attempts and in about half of isolated reruns, with or without HIPPO's constrained
   profile, while nothing else failed. They then passed once load fell below 8. The scenarios measure host scheduling as
   well as the wrapper's watchdog, so a busy machine turns a required gate red on a correct change. The adoption reran a
   target only when every failure was in that deadline-bound set, and it kept every attempt's log.
2. **An over-long `--limit` is answered as unavailable storage.** `_limit` in
   `apps/ferret-cli/src/ferret/domain/query.py` accepts ASCII digits with leading zeros. A run of zeros longer than
   CPython's integer-string limit (4,300 digits by default) makes `int()` raise `ValueError`. That used to reach
   `main`'s last-resort handler, which answers `ferret.storage.unavailable`, and the adoption kept that code through
   `attempt(...).map_err(...)` with a comment saying so. The test
   `test_a_page_size_of_more_zeros_than_an_integer_may_be_read_from_is_answered_as_unavailable_storage` in
   `apps/ferret-cli/tests/unit/test_queries.py` pins it. Every other malformed page size answers `ferret.args.invalid`.
3. **`add_days` can still raise.** `add_days` in `apps/ferret-cli/src/ferret/domain/timestamps.py` returns
   `moment + timedelta(days=days)`, so a moment near the end of the calendar raises `OverflowError`. The neighbouring
   `_at_offset` already turns the same overflow into an `Err`. No validated capture time reaches the overflow today, so
   `expiry_of` in `apps/ferret-cli/src/ferret/domain/retention.py` calls `add_days` unguarded.

## Why now

The adoption left the domain with no `except`, so each of these is now one narrow change with a clear test. Item 1 also
costs every FERRET change a rerun when the host is busy, and that cost does not show once the rerun reports green.

## Prior art / precedents

- Duplicate check, 2026-10-07: no open issue or pull request in this repository matches `ferret`, `ferret deadline`,
  `int_max_str_digits`, or `add_days`. No idea brief names FERRET, and the one FERRET backlog plan,
  `plans/backlog/ferret-init-02-local-backend/`, covers a local backend and none of these three.
- [ayokoding-www-e2e-flake-under-concurrent-load](../q3-urgent-not-important/ayokoding-www-e2e-flake-under-concurrent-load.md)
  is the same class as item 1 in another app: a required gate that flakes under shared-machine load.
- `_at_offset` in `timestamps.py` is the in-file precedent for item 3.

## Proposed direction (sketch)

Each item is a choice for FERRET's owner:

- Item 1: keep the bounds, because the 1,000 ms promise is the product. Choose between measuring the watchdog on a fake
  clock in the unit layer and keeping one real-time scenario in a lane that does not share the host, or recording the
  scenarios as load-sensitive with a load check before they run. Loosening a bound is not an option.
- Item 2: answer `ferret.args.invalid` for an over-long `--limit` by rejecting the length before `int()`, and replace
  the pinning test. This changes an observable code, so it ships as a behaviour change with its specification, or the
  current answer is documented as intended.
- Item 3: make `add_days` return a `Result`, as `_at_offset` does, and let `expiry_of` map the `Err` to its internal
  failure.

## Rough scope & non-goals

In scope: the deadline scenarios and their lane, the `--limit` code, and `add_days`. Out of scope: the 1,000 ms hook
budget itself, other exit codes, and `typekit`.

## Risks & open questions

- Item 2 changes the code a caller sees for one input, so it needs a CHANGELOG entry and a version decision. (open)
- A fake-clock watchdog test proves the logic but not the timing on a real host, and some real-time check must remain.
  (open)

## What success looks like + promotion signal

Success: the fail-open scenarios pass on a loaded host as often as on an idle one, an over-long `--limit` answers the
code its siblings answer, and no domain function in `ferret-cli` raises. Promote item 1 when a FERRET change next needs
a rerun for a deadline failure. Items 2 and 3 can ride with the next FERRET behaviour change.
