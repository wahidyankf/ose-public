# 008 — Decision Records

Each record gives the choice, two alternatives, prior art, trade-offs, consequences, and what would
make us revisit it. Series decisions (numbered 1–40, made by the user on 2026-10-09) are inputs, not
re-decided here; a record cites them where they bind.

## D1 — Every Course Teaches With Runnable Code

- **Selected:** every course, including the comparative and Sharia ones, carries runnable Python
  units; Annotated-Concept courses keep at least about half of their worked examples code-bearing.
- **Alternatives:** (a) the no-code Annotated-Concept sub-mode for the "softer" courses (audit,
  IFRS vs US GAAP, Sharia standards); (b) code only in illustrations that are never run.
- **Prior art:** the 2026-08-15 accounting syllabus planned "paper, no build" courses and produced
  today's 186–313-word outlines; the exemplar `statistics-for-evaluation` mixes annotated reasoning
  with runnable code in the same mode.
- **Trade-offs:** more work per course and a harness dependency, in exchange for courses an engineer
  can trust and test.
- **Consequences:** every course needs `run.yaml` units and passes the harness (series decisions 27,
  30–32); the audience (decision 16: engineers building accounting systems) gets code it can reuse.
- **Revisit when:** a course's material genuinely has nothing to compute, or a gate finds the code in
  a course is decorative.

## D2 — Python Is the Single Code Medium

- **Selected:** Python with the standard library; PostgreSQL only where a database behaviour is the
  lesson.
- **Alternatives:** (a) TypeScript, the app's own language; (b) SQL only, or spreadsheets.
- **Prior art:** `just-enough-python` is already a prerequisite of most technical courses; the
  exemplar courses use Python; Python's `decimal` module gives exact money arithmetic without a
  dependency.
- **Trade-offs:** TypeScript has no built-in decimal type (money would need a library); SQL alone
  cannot express engines, simulations, or report generation well; spreadsheets do not run in the
  harness.
- **Consequences:** `just-enough-python` joins every course's prerequisites (rule L1) and every
  path's `assumes`.
- **Revisit when:** the series adds a TypeScript-first path that wants the accounting courses as core.

## D3 — Mode Chosen per Course by the Kind of Material

- **Selected:** 11 By Example courses (mechanisms with good and bad inputs) and 13 Annotated-Concept
  courses (reasoning, comparison, specification), listed with reasons in
  [002](./002-course-modes-and-definition-of-done.md#mode-selection).
- **Alternatives:** (a) all By Example, for uniformity; (b) all Annotated Concept, for less code.
- **Prior art:** `sql-essentials` (By Example) and `statistics-for-evaluation` (Annotated Concept)
  each fit their material; the gate adapter defines both modes with separate floors.
- **Trade-offs:** two shapes to maintain, in exchange for each course using the shape that teaches
  its material best. All By Example would force 75 runnable examples on comparative material; all
  Annotated Concept would under-drill mechanisms.
- **Consequences:** two makers and two mode gates are used; the content-shape test reads the format.
- **Revisit when:** a mode gate repeatedly fails a course because its material does not fit the mode.

## D4 — Targets Derived From Part Lengths and Exemplars

- **Selected:** word floors from the minimum part lengths (28,000 and 22,000), drilling floors from
  values two of three exemplars reach ([002](./002-course-modes-and-definition-of-done.md#word-targets)).
- **Alternatives:** (a) copy the exemplars' totals (about 52,000 words); (b) no word or drilling
  targets, leaving everything to the gates.
- **Prior art:** the gate adapter's part lengths and floors; the three measured exemplars.
- **Trade-offs:** exemplar totals would double the work with no quality rule behind it; no targets
  would let a thin course pass, because the gates do not count words or drill items.
- **Consequences:** a deterministic test can check the floors; the gates still judge quality.
- **Revisit when:** the gate adapter adds its own word or drilling floors, or a course passes the
  floors but the gates judge it thin.

## D5 — Sharia Content: Attribute, Show Differences, Flag Decisions, Rule Nothing

- **Selected:** rules SC1–SC8 in [004](./004-sharia-content-policy-and-sources.md): every position
  attributed with document and date, differences side by side, a fixed board-decision callout, a fixed
  disclaimer, current standards with effective dates, configuration for jurisdiction values, and a
  human check of every AAOIFI link.
- **Alternatives:** (a) teach one framework (AAOIFI only) as "the" rules; (b) describe Islamic finance
  in general terms without naming standards.
- **Prior art:** series decision 19; the 2026-08-16 Sharia syllabus cited FAS 9, superseded by FAS 39
  from 1 January 2023, which shows why effective dates matter.
- **Trade-offs:** (a) would be simpler but would present one view as the only one, which decision 19
  forbids; (b) would be safe but useless to engineers who must encode a policy.
- **Consequences:** a durable rule module (D9); four or more callouts per Sharia course; a `[HUMAN]`
  link check before merge.
- **Revisit when:** AAOIFI changes standards again (FAS 51 and FAS 52 take effect 1 January 2027,
  and the courses must then describe them as in force), or aaoifi.com is confirmed safe for automated
  fetching.

## D6 — Journal Entries Before Financial Statements

- **Selected:** swap positions 3 and 4 so `journal-entries-and-posting-mechanics` comes before
  `financial-statements-and-close-cycle`, and drop the journal course's requirement on statements.
- **Alternatives:** (a) keep plan 02's order and the journal → statements requirement; (b) merge the
  two courses.
- **Prior art:** standard accounting teaching order (record, then summarise); plan 02's own rubric
  marks journey-only edges for removal (R-JOURNEY).
- **Trade-offs:** (a) would make the statements course teach statements without the postings that
  produce them; (b) would make one oversized course and change the course set, which plan 02's
  membership test freezes.
- **Consequences:** two `weight` values swap; the manifest tests and the integration step change
  their expected order.
- **Revisit when:** a reader study shows learners want statements first as motivation (then a short
  preview in foundations, not a reorder, is the next step).

## D7 — Remove the Ramp Milestone Strip

- **Selected:** delete `RampMilestoneStrip` and its test; rewrite the skills statement and the hub
  strapline in plain words.
- **Alternatives:** (a) keep the strip with new labels; (b) replace it with a per-path phase count.
- **Prior art:** decisions 16–18 replaced "Dangerous/Comfortable/Confident" with per-phase outcomes;
  plan 02 assigned the strip's removal to this plan; plan 04 (D11) keeps the strip until then.
- **Trade-offs:** (a) keeps a second, competing model next to the outcomes; (b) repeats what plan 04's
  `LearnPathCard` already shows inside each card (the phase count and hours), and a count says little
  about what a reader can do. Removing the strip loses nothing the path pages do not now say better.
- **Consequences:** the ERP cards also lose the strip now, before plan 07 restructures ERP; the new
  statement is already true for them.
- **Revisit when:** the skills landing gets a redesign that needs a per-path summary.

## D8 — Board Decisions as a Warning Callout

- **Selected:** the existing `{{< callout type="warning" >}}` with the bold label "Sharia board
  decision needed." (the UI funnel in [../prd.md](../prd.md#ui-design-funnel)).
- **Alternatives:** (a) the `info` callout; (b) a plain bold label in the text.
- **Prior art:** the site's callout shortcode and web-ui `Alert` (warning variant, 6.90:1 contrast);
  legacy security tutorials use warning callouts for legal notices.
- **Trade-offs:** warning is the most visible and signals "stop and decide"; info reads as optional;
  a plain label is easy to miss and gives the content test nothing stable to find.
- **Consequences:** no new component; the content-shape test can count callouts. The `Alert`
  renders `role="alert"`, which a tester may flag for static text; a conditional packet in
  [../delivery.md](../delivery.md) handles that.
- **Revisit when:** a usability test shows readers skip warning callouts, or the site adds a dedicated
  decision component.

## D9 — A Durable Home for the Sharia Rules

- **Selected:** a new reference module
  `.agents/skills/apps-ayokoding-www-developing-content/reference/sharia-content.md`, linked from the
  skill and from the AyoKoding gate adapter, with the content-shape test gating the checkable parts.
- **Alternatives:** (a) keep the rules only in this plan (archived after merge); (b) put them in the
  gate adapter only.
- **Prior art:** plan 05 puts its harness rules in the same skill's `reference/` folder; plan 02 puts
  its course-status rules there too.
- **Trade-offs:** (a) would leave plan 07's three Sharia ERP courses without a rule to follow; (b)
  reaches checkers but not makers, who write the content.
- **Consequences:** plan 07 cites the module; the rules-propagation phase records the enforcement of
  each rule.
- **Revisit when:** a second content product needs Sharia rules (then the rules move to a
  repository-wide convention).

## D10 — Batches by Prerequisite Level, Three Agents, Two-Cycle Caps

- **Selected:** levels L0–L11, at most 3 background agents, every loop capped at 2 cycles, BLOCKED
  courses recorded and reported while the batch moves on ([006](./006-execution-model.md)).
- **Alternatives:** (a) one course at a time; (b) all 24 at once.
- **Prior art:** the repository's N+1 agent model (N = 3); series decision 29 and the user's
  2-cycle cap of 2026-10-09.
- **Trade-offs:** (a) is slow and gains nothing for independent courses; (b) breaks prerequisite
  reuse and overloads the machine.
- **Consequences:** a later course's maker reads finished earlier courses; a BLOCKED course stops
  the plan before the manifest phase until the user decides.
- **Revisit when:** BLOCKED courses are frequent (then the briefs, not the cap, need work).

## D11 — One PR for All 24 Courses and Both Paths

- **Selected:** one delivery unit: 24 courses, the restructure, the landing changes, and the rules.
- **Alternatives:** (a) one PR per path; (b) one PR per batch.
- **Prior art:** series decision 39 (the restructure ships in the same PR as the filled courses) and
  the series rule "one plan = one PR".
- **Trade-offs:** a large PR to review, in exchange for `main` never showing a restructured path with
  outline courses in its core (which R5 forbids) or a filled course in an unrestructured path. (a)
  would split the 19 shared courses from the Sharia path that reuses them; (b) would leave the paths
  marked or broken between PRs.
- **Consequences:** the PR is mostly content; reviewers rely on the gate reports and the evidence
  summary.
- **Revisit when:** never for this plan; later content plans follow their own series rule.

## D12 — A Content-Shape Test in the App's Test Suite

- **Selected:** `accounting-course-completion.feature` bound by a Unit step file over the real content.
- **Alternatives:** (a) an `ayokoding-cli` subcommand; (b) a one-time measurement recorded as
  evidence only.
- **Prior art:** plan 02's outline guard and plan 03's metadata drift test both read real content in
  the Unit suite; series decision 37 forbids ad-hoc scripts.
- **Trade-offs:** (a) would add a Go command for checks that the app's TypeScript tests already do
  for similar rules; (b) would not stop a later regression.
- **Consequences:** `test:quick` guards the 24 courses from now on.
- **Revisit when:** plan 14's series-completion gate adds a general check that covers this one; then
  this test can be folded into it.

## D13 — No Feature Flag

- **Selected:** no flag. Everything ships complete in one merge.
- **Alternatives:** (a) a flag for the path restructure; (b) `draft: true` on the courses until all
  are done.
- **Prior art:** plan 02 shipped its path model without a flag for the same reason.
- **Trade-offs:** a flag would hide behaviour that is complete at merge and add removal work; drafts
  would hide content that `main` already holds complete.
- **Consequences:** rollback is a revert of the merge commit.
- **Revisit when:** a part of this plan must ship before the rest (not planned).

## D14 — Database Access in Course Code

- **Selected:** SQL units use a new catalog toolchain `psql` (the PostgreSQL 18.6 service image,
  which contains the client); Python units that need the database use the `python` toolchain, the
  `postgres` service, and a hash-locked lockfile pinning the pure-Python driver `pg8000`
  ([003](./003-code-harness-and-determinism.md#database-units)).
- **Alternatives:** (a) `psycopg[binary]`, the most common driver; (b) a derived image with Python and
  the PostgreSQL client together.
- **Prior art:** plan 05's catalog (python language toolchain, postgres service, "one toolchain per
  unit", "Adding a Toolchain"); `pg8000` is a DB-API 2.0 driver, so the code transfers to other
  drivers.
- **Trade-offs:** (a) ships platform-specific wheels with a bundled C library, so the lockfile must
  carry hashes for each platform; (b) is a new derived image to build, pin, and maintain. The chosen
  pair reuses an image the catalog already trusts and adds only pure-Python packages.
- **Consequences:** one catalog entry, one fixture unit, one smoke row; three course lockfiles. Later
  plans (for example the SQL courses in plan 12) can reuse `psql`.
- **Revisit when:** a course needs a driver feature pg8000 lacks, or plan 05 adds an equivalent entry
  first (then this plan uses it instead).

## D15 — Align the Stale Content Tree-Shape Rule

- **Selected:** narrow-edit the tree-shape rule in the gate adapter and in the content skill's
  `canonical-content-tree-shape.md` so they describe the course layout
  `content/en/learn/courses/<slug>/` with `learning/` and `drilling/`, and limit the old
  `<domain>/<area>/<topic>/` shape with `by-concept`/`by-example`/`in-the-field` tracks to the legacy
  tree.
- **Alternatives:** (a) leave the rule and treat its findings as false positives; (b) edit it only if a
  gate actually flags these courses.
- **Prior art:** all 181 courses already use the course layout; series decision 30 fixes the unit
  folders inside it; plan 04 reported the same rule as stale without changing it.
- **Trade-offs:** (a) leaves a rule that every new course contradicts, and a `normal`-mode gate may
  block on it; (b) makes the rule's correctness depend on a checker's mood. The edit is narrow and
  matches what exists.
- **Consequences:** a rules-propagation outcome in this PR; if another plan already fixed the rule on
  `main`, Phase 0 records it and this edit is skipped.
- **Revisit when:** plan 14 deletes the legacy tree (then the legacy clause goes too).

## D16 — Re-Point Real-Outline Test Examples to an ERP Course

- **Selected:** a test that uses an accounting course as a real outline example is re-pointed to
  `erp-foundations-and-history`.
- **Alternatives:** (a) convert those tests to synthetic fixtures now; (b) delete those assertions.
- **Prior art:** plan 03's E2E catalog steps use `accounting-foundations` as "an outline course"; E2E
  runs against real course content with fixture manifests, so a synthetic course would have to exist
  on the real site.
- **Trade-offs:** (a) would put a fake course in the shipped content; (b) would lose coverage of the
  Outline badge while outlines still exist.
- **Consequences:** plan 07 must re-point these tests again, to a capstone course, which stays an
  outline until plan 08 runs (the series runs in order, decision 42),
  and the last plan that removes the last outline must decide how to test the badge; reported as a
  cross-plan handoff.
- **Revisit when:** no outline course remains in the library.
