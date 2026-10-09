# 008 — Decision Records

Each record gives the choice, two alternatives, prior art, trade-offs, consequences, and what would make us
revisit it. Series decisions (numbered 1 to 42, made by the user on 2026-10-09) are inputs, not re-decided
here; a record cites them where they bind.

## D1 — The Filler Guard Is a TypeScript Unit Test

- **Selected:** the guard is a pure TypeScript module plus a file scanner in `apps/ayokoding-www/src/features/content/`,
  bound by Gherkin and run in `ayokoding-www:test:quick`. Details in [003](./003-filler-guard.md).
- **Alternatives:** (a) an `ayokoding-cli` subcommand in Go (`ayokoding-cli examples filler` or a sibling); (b) an
  ad-hoc script or the prototype used for calibration.
- **Prior art:** plan 03's `course-corpus-check` and plan 06's completion test are app-side tests; the CLI
  holds the harness, which runs containers and reads `run.yaml`. Series decision 37 says checks run in tested
  code, never ad-hoc scripts.
- **Trade-offs:** a CLI command would also serve authors without Node and would sit next to the other `examples`
  commands, but it would need a second implementation of frontmatter and outline parsing, and a new CI step. A
  script would be cheapest and would not survive review.
- **Consequences:** one implementation; the guard runs in every pull request with no new wiring; plan 14 imports
  it. Authors get their feedback from a Vitest run.
- **Revisit when:** a consumer outside the app needs the report faster than a Vitest run, such as a pre-commit
  hook or a job without Node. Then add a thin CLI command that runs the same compiled module.

## D2 — Six Structural Rules, Calibrated on the Real Corpus

- **Selected:** FG1 to FG6 ([003](./003-filler-guard.md#the-six-rules)), each a deterministic count with a
  minimum sample and a threshold set between the flagged extreme and the healthy extreme measured over 181
  courses. FG7 (a unique ratio over fenced code in example bodies) is rejected.
- **Alternatives:** (a) a single "unique-body ratio" rule (FG1) only; (b) a similarity score from an embedding or
  a language model.
- **Prior art:** the calibration found six courses that pass FG1 to FG5 and still repeat one closing paragraph in
  every example; FG6 was added for them. A single rule would miss them and the two security courses'
  boilerplate. Series decision 37 rules out judgement-based checks.
- **Trade-offs:** six rules are more to maintain than one, but each has one meaning, one constant, and a
  gap on both sides of its threshold (the margins are in the calibration table). A model-based score would catch more and could not be a test.
- **Consequences:** zero of the 94 healthy courses fire; 87 courses fire a rule (62 outlines on FG5 only, 25
  non-outlines). A wrong threshold shows up as a change in that count.
- **Revisit when:** a course appears with templated inline code and no code units (revisit FG7), or a healthy
  course fires (change the rule with a fixture and a new calibration table in the same PR).

## D3 — A Shrink-Only Baseline Instead of Per-Course Exemptions

- **Selected:** the 25 non-outline courses that fire today are listed in a closed baseline with an owner and a
  reason. The unit tests fail if a firing course is missing, if a listed course no longer fires, if the list
  grows past its cap, or if a rewritten course regresses. Nobody can exempt a course; they can only fix it.
- **Alternatives:** (a) fix all 25 in this plan so the baseline is empty; (b) report findings without failing,
  as warnings.
- **Prior art:** plan 02's closed allowlist for marked manifests, which can only shrink; the repository's rule
  that a flaky or failing test is never loosened or skipped.
- **Trade-offs:** fixing 25 courses in one plan would be several times the work of this plan and would push
  plans 11 to 13 (which own the other 17) into this one. A warning-only guard would let new filler in. The
  baseline lets the guard be strict from the first day and visible to the plans that own the rest.
- **Consequences:** after this plan the baseline holds 17 entries; plans 11 to 13 each remove the entries they
  fix, in the same commit as the fix; plan 14 requires an empty baseline. A course fixed early leaves the list
  early. The cap makes any growth visible in review.
- **Revisit when:** plan 14 empties the baseline; then the baseline module and its tests can be deleted, leaving
  the real-corpus scenario.

## D4 — Type Systems Uses TypeScript, OCaml, and Rust, Not Haskell

- **Selected:** `type-systems` teaches algebraic types, inference, and abstraction with runnable code in OCaml
  (inference, modules, functors, signatures), TypeScript (discriminated unions, narrowing, variance, branded
  types), and Rust (traits, newtypes, phantom types, `Option` and `Result`). F# appears in prose only, and Haskell
  is dropped.
- **Alternatives:** (a) add a Haskell toolchain (GHC) to the catalog and keep the old OCaml, Haskell, and F#
  mirror; (b) use OCaml only.
- **Prior art:** the old course mirrored one capstone in three languages "to compare syntax" and its overview
  said the course "deliberately does not require Just Enough F#". Plan 05's catalog has `ocaml`, `typescript`,
  and `rust`; it has no Haskell.
- **Trade-offs:** GHC is a large image and a new toolchain for one course, and typeclasses (Haskell's
  signature feature) are available as Rust traits and OCaml module signatures. OCaml alone would leave out the
  languages the reader already knows (`just-enough-typescript` is a prerequisite; Rust is added). Dropping
  Haskell loses `Functor` and `Monad` as native typeclasses; the course shows them as module signatures and
  traits and says so.
- **Consequences:** `just-enough-rust` joins the prerequisites ([001](./001-current-state.md#prerequisite-changes));
  no new toolchain is needed; Haskell is named in a comparison table, marked as an illustration.
- **Revisit when:** a Haskell toolchain enters the catalog for another reason, or a gate finds the typeclass
  material thin without it.

## D5 — Spring Boot Through a Hash-Locked Jar Recipe on the Java Toolchain

- **Selected:** extend the `java` catalog entry with an `install` recipe and a derived image that installs the
  course's jars from a lockfile (`jars.lock`, SHA-256 per jar) at image build, so units compile and run offline
  ([004](./004-code-harness-and-determinism.md#the-java-install-recipe)). Spring Boot 4.1.1 on JDK 25.
- **Alternatives:** (a) a new catalog language `spring` (a copy of the Java image with jars baked in), which
  would put the jar closure inside the Docker context; (b) drop Spring and teach layered services with
  `com.sun.net.httpserver` and plain JDBC, which is runnable but is not "Enterprise Java".
- **Prior art:** plan 05 gives Python, Node, and Go an `install` recipe with hash-checked lockfiles; Java is the
  one language with no recipe. The old course used `mvn test`, which needs a network and so cannot run under the
  harness.
- **Trade-offs:** the recipe is a change to a shared catalog entry, so any Java course is affected and the PR
  triggers a full harness run; in exchange, the lock file is reviewable and the same mechanism serves any later
  JVM course. A Boot-free design avoids the risk and fails the course's name and the readers' expectation.
- **Consequences:** `jars.lock` (about a hundred lines) is a reviewed artifact; a lock-agreement unit fails the
  harness if `pom.xml` and the lock drift; a catalog change forces a full run. If the Boot smoke probe (P9)
  fails and cannot be fixed, the course is BLOCKED at Phase 2 and the user decides.
- **Revisit when:** plan 05's catalog gets a general dependency mechanism for Java (for example a Maven
  mirror inside the toolchain), or a Boot upgrade changes the closure.

## D6 — Clojure Joins the Catalog; Common Lisp Stays Prose

- **Selected:** add a `clojure` language entry (Clojure 1.12.6 on the Temurin 25 base, three jars verified by
  SHA-256). Racket carries the Scheme material. Common Lisp is taught in prose and comparison tables, with any
  snippet marked as an illustration.
- **Alternatives:** (a) drop the Clojure sidebar and cover macros in Scheme and Racket only; (b) add both
  Clojure and a Common Lisp implementation (SBCL).
- **Prior art:** the old course had a Clojure sidebar in 5 of its 30 concepts and ran nothing; Clojure is the
  Lisp the reader is most likely to meet on the JVM, and `lisp` sits beside the JVM course in the path.
- **Trade-offs:** a catalog entry costs a Dockerfile, a fixture, a smoke row, and a full CI run; it buys
  runnable `defmacro`, `gensym`, and `macroexpand` output, which is the contrast with hygienic `syntax-rules`.
  SBCL would add a second new entry for a language the course only compares.
- **Consequences:** the `clojure` entry is the only new language toolchain in this plan; Common Lisp claims in
  the course carry sources, not output.
- **Revisit when:** the series adds a Common Lisp or Clojure-heavy course that would reuse the entry.

## D7 — The Git Course Is Proven Against Real Git

- **Selected:** a shell unit computes every object id with real Git under fixed names and dates and compares it
  with a shared vectors file; the Python units compare their own results with the same file. Pack fixtures are
  committed as hex text and verified by `git index-pack` ([004](./004-code-harness-and-determinism.md#the-git-oracle)).
- **Alternatives:** (a) check only Python against hard-coded ids in the lessons (self-consistency, no oracle);
  (b) call `git` from the Python units.
- **Prior art:** the old course's NUL bug (79 files) survived because nothing compared an id with Git. The
  shell toolchain ships Git.
- **Trade-offs:** a shared vectors file ties two kinds of unit together, but it is the single place the truth
  is written. Hard-coded ids in the lessons would be right today and drift silently; Python calling Git would
  make the "build your own" claim hollow.
- **Consequences:** the course's central claim ("our ids equal Git's") is an automatic check on every run; the
  course never prints a Git version; a static scan also forbids the literal bug.
- **Revisit when:** Git 3.0 changes the default hash or branch name (planned, not shipped as of October 2026);
  the vectors file then gains the new defaults.

## D8 — No Manifest Change

- **Selected:** the eight courses stay where they are in the three software-engineer career manifests (all in
  extension phases); this plan edits no manifest and no path page. It adds three prerequisite edges and checks
  them against plan 02's integrity rules ([001](./001-current-state.md#prerequisite-changes)).
- **Alternatives:** (a) move the rewritten courses to earlier phases because they are now good; (b) add them to
  skills or AI paths.
- **Prior art:** plan 06 restructures the accounting paths because it fills courses for those paths; no
  series plan asks this plan to place these eight differently.
- **Trade-offs:** moving courses is a pedagogy decision for the series owner and affects every reader's order.
  Leaving them avoids touching shared route data in a plan about content.
- **Consequences:** `placement` of the eight courses is unchanged; the manifests, their tests, and the path
  pages need no edit; the plan's blast radius is the course folders, the guard, and the harness catalog.
- **Revisit when:** plan 14's review of the finished library asks for a different order.

## D9 — Seven By Example Courses and One Primer; Counts Kept

- **Selected:** modes as listed in [002](./002-course-modes-and-definition-of-done.md#mode-selection); 78
  examples for seven courses and 80 for vulnerability management, as today.
- **Alternatives:** (a) Annotated Concept for the two security courses; (b) 75 examples everywhere, the floor.
- **Prior art:** plan 03's `format` values already say `by-example` for seven and `primer` for the F# course;
  the existing outlines and overviews state the counts.
- **Trade-offs:** keeping the counts keeps readers' bearings and costs nothing; Annotated Concept for security
  would reduce code but would lose the runnable check on every detection and triage step.
- **Consequences:** the completion test's floor is 75 examples and 28,000 words for all eight.
- **Revisit when:** a mode gate repeatedly fails a course because its material does not fit.

## D10 — Hand-Written Parser Combinators Instead of FParsec

- **Selected:** the compilers course builds a small parser-combinator library in F# in the lesson itself and uses
  it for the grammar. FParsec is explained in prose and marked as an illustration.
- **Alternatives:** (a) depend on the FParsec NuGet package; (b) teach recursive descent and Pratt parsing only.
- **Prior art:** the old concept list named FParsec primitives although no offline environment has the package;
  the harness runs without a network, and plan 05 gives .NET no package recipe.
- **Trade-offs:** a hand-written library is smaller than FParsec and teaches how combinators work, which is the
  course's goal; it is not production-grade, and the course says so.
- **Consequences:** no NuGet restore is needed; every F# unit is a `dotnet fsi` script or an SDK-only project.
- **Revisit when:** plan 05 adds a NuGet lock recipe for .NET.

## D11 — Security Examples Are Units Over Synthetic Data, With Reserved Addresses

- **Selected:** each example is its own unit (`ex-NN-<slug>/`) with a distinct script over shared synthetic
  fixtures (`lab-events.ndjson`, `findings.json`, and similar), not one script with ten subcommands. Addresses
  are limited to reserved ranges (SEC1), CVE fixtures use the year 2099, and the boundary banner appears once
  per level page ([005](./005-security-content-and-accuracy.md)).
- **Alternatives:** (a) keep the single lab script and vary its flags; (b) accept any fictional-looking
  address and rely on the Content Quality Gate.
- **Prior art:** the old lab ran the same report for many examples (80 for the vulnerability course); the
  repository's security by-example convention already requires reserved ranges.
- **Trade-offs:** 78 and 80 small scripts are more files than one lab, and each is readable on its own page;
  one script cannot make 80 different points. A machine check of addresses is cheap and removes a class of
  leaks.
- **Consequences:** FG2 and FG4 apply to the security courses for the first time (they have units now); a
  four-part version string looks like an address, so authors avoid it.
- **Revisit when:** the harness gains support for recorded real-world fixtures with a review step.

## D12 — A Blocked Course Changes Nothing on the Branch

- **Selected:** a BLOCKED course's partial work is saved as a patch outside the repository, the course folder
  returns to its pre-course state, and the course stays in the baseline. The plan does not merge with a BLOCKED
  course unless the user says so ([006](./006-execution-model.md#blocked-courses)).
- **Alternatives:** (a) commit the partial course with a warning; (b) mark the course as an outline again.
- **Prior art:** plan 06 leaves BLOCKED courses as outlines; here the old course is already live and is not an
  outline.
- **Trade-offs:** reverting leaves the old filler live, which is the status quo and keeps the ratchet green; a
  half-written course would be worse for readers than a templated one, and marking a live course as an
  outline would remove it from paths that need it.
- **Consequences:** a course can be re-attempted later from the saved patch; the final report names any course
  that did not finish.
- **Revisit when:** the user chooses a different handling for a specific course.

## D13 — One PR for the Guard and the Eight Courses

- **Selected:** one branch and one pull request deliver the guard, the baseline, the two toolchain changes, the
  eight courses, and the rule documents (series decision 39 and "one plan = one PR").
- **Alternatives:** (a) a guard PR first, then course PRs; (b) one PR per course.
- **Prior art:** plan 06 delivers 24 courses and two paths in one PR for the same reason: no half state on `main`.
- **Trade-offs:** a large PR is harder to review, which is offset by one commit per course and by gates that
  run per course. A guard-first PR would be red against 25 unbaselined courses unless the baseline landed with
  it, and per-course PRs would multiply deployments for no reader benefit.
- **Consequences:** rollback is one revert PR; the ratchet and the courses move together.
- **Revisit when:** the series owner asks for smaller deliveries.

## D14 — No Feature Flag

- **Selected:** no flag. Course content ships as it is merged.
- **Alternatives:** (a) a flag that hides rewritten courses until the series completes; (b) a draft state per
  course.
- **Prior art:** the same choice as plan 06 (its D13).
- **Trade-offs:** a flag adds a code path to a content plan and a cleanup step; the old courses were already
  public, and the rewrite is an improvement a reader sees at once.
- **Consequences:** nothing to remove after delivery; rollback is the revert PR.
- **Revisit when:** a rewritten course needs a staged reveal.
