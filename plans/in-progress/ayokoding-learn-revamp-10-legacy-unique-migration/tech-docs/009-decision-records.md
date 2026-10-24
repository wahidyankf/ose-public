# 009 — Decision Records

Each record states the selected option, two alternatives actually considered, prior art or evidence, the
trade-offs accepted, the consequences, and what would make this plan revisit the decision.

## Decision D1: CliftonStrengths is classified `obsolete`

- **Selected:** Do not migrate `personal-development/tools/cliftonstrengths/` (46 files, about 14,163
  words) into any course; record it `obsolete` with the reason stated in the mapping table.
- **Alternative A — migrate it into a new `personal-development`-flavoured course.** Rejected: the
  14-category taxonomy (`course-categories.ts`) has no personal-development category, and CliftonStrengths
  is Gallup's trademarked, licensed assessment framework (34 named themes), not open engineering or
  accounting content this catalog otherwise teaches.
- **Alternative B — fold its content into `engineering-management` or `technical-communication` as a
  supplementary section.** Rejected: those courses teach leadership and communication skills generically;
  reproducing a specific third-party proprietary framework's 34 themes inside them would import the same
  licensing exposure into an existing course rather than avoiding it, and neither course's own scope note
  claims to teach a personality-assessment framework.
- **Evidence:** read `overview.md` (which self-identifies the framework as "a personal development tool
  created by the Gallup organization") and a sample of the 34 theme pages; checked the 14-category
  constant for a fit.
- **Trade-off accepted:** a reader who came to the legacy tree specifically for CliftonStrengths content
  finds no AyoKoding course on it after plan 14 deletes the legacy tree; the redirect fallback sends them
  to the catalog instead of a specific course.
- **Consequence:** zero new courses, zero toolchain or metadata impact; the 65-file navigation bucket and
  this single topic are this plan's only `obsolete` content dispositions besides the three individual
  nav-adjacent pages.
- **Revisit if:** the catalog ever adds a personal-development or career-coaching category, or the
  repository obtains an explicit license to reproduce Gallup's framework.

## Decision D2: one consistent rule for every per-language legacy corpus

- **Selected:** Apply the same test to all 12 per-language legacy corpora (C#, Clojure, Dart, Elixir, F#,
  Go, Java, Kotlin, Python, Rust, TypeScript, WebAssembly): a `just-enough-X` primer (explicitly 1 to 15
  estimated hours) does not make a materially deeper legacy corpus `covered`, even where a specialized
  existing course (e.g. `enterprise-java-and-the-jvm`, `actor-model-concurrency`, `csp-style-concurrency`)
  also uses that language for a different, narrower angle.
- **Alternative A — judge each language case by case**, exempting Python (already used as the primary
  language across much of the catalog) and Java (already deepened by `enterprise-java-and-the-jvm`) from
  the `new` disposition. Rejected: this would require a separate, less consistent argument per language,
  and the "cumulative incidental depth across many courses" standard it relies on is harder for a future
  auditor to re-check than "is there one dedicated course on this exact subject."
- **Alternative B — migrate none of the 12** on the theory that the catalog's many Python-heavy and
  Go/Java-using courses already give enough exposure. Rejected: none of those courses states "teaches
  Python/Go/Java in depth" as its subject; a learner who specifically wants deep language fluency has no
  single course to go to, the same gap this plan exists to close.
- **Evidence:** `just-enough-X`'s own stated `estimatedHours` (1 to 15) versus each legacy corpus's word
  count (47,000 to 258,750 words) and example count (75 to 90-plus).
- **Trade-off accepted:** Python, already the catalog's most-used implementation language, gets its own
  additional `python-in-depth` course even though many existing courses already exercise it; this is a
  deliberate consistency choice over a tighter but case-by-case scope.
- **Consequence:** 12 new courses, each naming its narrower sibling course (where one exists) as a
  complementary course, not a replacement, in its own Why-this-exists section.
- **Revisit if:** a future plan finds that one of the 12 in-depth courses duplicates its sibling specialty
  course more than this plan's scope notes anticipated.

## Decision D3: the architecture corpus (DDD, FSM, hexagonal, patterns, C4, general survey) is `covered`, not `new`

- **Selected:** Classify all six software-architecture legacy topics (about 1.5 million words combined) as
  `covered` by the existing `domain-driven-design`, `software-architecture`,
  `object-oriented-design-and-patterns`, `event-driven-architecture`, `system-design`, and
  `technical-communication` courses.
- **Alternative A — migrate the legacy corpus's distinctive three-paradigm (procedural/OOP/FP) comparative
  teaching format as new, parallel courses.** Rejected: each of the six existing target courses already
  teaches the underlying subject (DDD, FSM, hexagonal architecture, design patterns, C4 diagramming) at
  dedicated depth; adding a second, differently structured course on the same subject would give the
  catalog two entries for one learning need, which the catalog's own category/format model does not have
  a clean way to distinguish for a learner browsing by subject.
- **Alternative B — treat the three-paradigm comparison as worth exactly one new course** (a single
  "comparative architecture patterns" course covering all six topics' paradigm-comparison angle).
  Rejected for this plan's scope: the resulting course would need to re-teach DDD, FSM, hexagonal
  architecture, and general patterns from scratch to make its comparison self-contained, duplicating
  the existing courses' own concept sections rather than building on them.
- **Evidence:** direct measurement of each existing course's own mention count for the matching concept
  (domain-driven-design's own subject; 48 finite-state-machine mentions in
  `object-oriented-design-and-patterns`; 42 C4 mentions in `technical-communication`; 5 and 11 hexagonal
  mentions in `software-architecture` and `object-oriented-design-and-patterns` respectively).
- **Trade-off accepted:** the legacy corpus's specific three-paradigm comparative depth is not preserved
  as a standalone course; it is recorded as recommended source material for plans 11 to 13's audit of the
  six target courses instead.
- **Consequence:** zero new courses from roughly 13% of the legacy tree's total word count, which keeps
  this plan's new-course count to 48 rather than a much larger number.
- **Revisit if:** plans 11 to 13's audit of `domain-driven-design` or `object-oriented-design-and-patterns`
  finds the paradigm-comparison angle is a real, currently-missing teaching need, not already addressed by
  a deeper pass over the existing course.

## Decision D4: merge only topics below their mode's floor; keep full-sized topics separate

- **Selected:** Merge a legacy topic into another only when it alone would not reach its assigned mode's
  worked-example floor (45 for Annotated-Concept). A topic already at or above its mode's floor (for
  example, each of the four AI coding-agent tools, at 80 to 90-plus example headings each) stays its own
  course even when a thematically similar sibling topic exists.
- **Alternative A — merge by theme regardless of size** (for example, merge all four AI coding-agent tools
  into one "AI coding agents" course). Rejected: combining four already-full-sized corpora would push the
  merged course to roughly 340 examples, far over the By Example ceiling of 85, and would blur the
  product-specific configuration details a reader comparing two specific tools actually needs.
- **Alternative B — never merge; give every legacy topic, however small, its own course.** Rejected: at
  least two topics (Testing Library at 36,345 words, Vitest at 34,037 words) are each individually below
  the By Example floor on their own; a standalone course that cannot reach its own mode's floor would
  itself be a definition-of-done violation on day one.
- **Evidence:** per-topic word and example counts from the mapping table.
- **Trade-off accepted:** 7 of the 48 new courses teach more than one named tool or library (for example,
  `text-processing-with-awk-sed-and-jq`), so a learner browsing by a single tool's name must recognize the
  merged course's title names more than one tool.
- **Consequence:** 7 Annotated-Concept merged courses instead of roughly 11 undersized ones.
- **Revisit if:** a merged course's Content Quality Gate finds the merge makes the course incoherent (the
  tools do not actually fit one teaching narrative) rather than efficient.

## Decision D5: `datomic-and-datalog-essentials` uses a reference implementation, not the real Datomic server

- **Selected:** Teach the immutable-fact, Datalog-query model with a small, deterministic, in-process
  reference engine built in Python, and state explicitly that the course does not require or run the
  real, licensed Datomic server.
- **Alternative A — add a Datomic toolchain and run the real server.** Rejected: Datomic's licensing terms
  are a vendor's commercial decision that can change independently of this plan; adding a toolchain
  dependency on a product whose free-tier terms this plan cannot durably guarantee creates a risk plan 05's
  existing toolchains (all either open-source or already licensed for CI use) do not carry.
- **Alternative B — classify the topic `obsolete`** on the theory that the real product is encumbered.
  Rejected: the immutable-fact/Datalog model itself is open, well-documented computer-science content
  (predating Datomic), not proprietary, and no other course teaches it; dropping the subject because one
  vendor's implementation is licensed would lose real teaching value for no necessary reason.
- **Evidence:** Datomic's own public documentation and the Datalog literature, read 2026-10-09, confirm
  the underlying model (datoms, transactions, Datalog queries) is openly describable without the server.
  The Transaction Model page (<https://docs.datomic.com/transactions/model.html>) names Datomic data
  "_information_, specifically a set of atomic immutable facts", and "we call facts in Datomic _datoms_":
  "Each datom associates an entity (E) with a value (V) via an attribute (A), similar to the
  subject/predicate/object of RDF."
  That E-A-V fact shape, plus Datalog's documented query model over it, is what the reference engine
  reimplements; nothing in that shape requires the licensed server to describe or test.
- **Trade-off accepted:** the course cannot claim to teach "how to operate the real Datomic product"; it
  teaches the model Datomic is known for, which the course's own Accuracy notes state plainly.
- **Consequence:** no new toolchain for a single course; the model is still fully teachable and
  testable deterministically.
- **Revisit if:** a future plan finds a durably free, CI-safe way to run the real Datomic server and
  judges the real-server fidelity is worth the added toolchain.

## Decision D6: two React Native examples use `mode: static` with reason `android`; the rest run for real

- **Selected:** 7 of 9 runtime anchors in `cross-platform-mobile-with-react-native` run for real (Node/TS
  logic and navigation, no emulator); 2 of 9 (native-module bridge, build variant) use `mode: static` with
  the written reason `android`, matching plan 05's own enum.
- **Alternative A — run every example against a real Android emulator.** Rejected: an emulator is heavy,
  slow, and historically flaky in CI; plan 05's own `static` mode exists precisely for this class of
  problem (iOS/Android build-dependent content), and only 2 of 16 examples in this course actually need a
  native build to validate.
- **Alternative B — drop the native-module-bridge topic entirely to avoid the issue.** Rejected: "when a
  feature needs a native module and how it is bridged" is one of this course's five stated learning
  objectives; removing it would leave a known, real gap in the course's own promised scope.
- **Evidence:** plan 05's `tech-docs/004`/`011` name Android and iOS as accepted `static.reason` values
  precisely for this situation.
- **Trade-off accepted:** those 2 examples are validated (compiled/linted), not executed with an asserted
  runtime output.
- **Consequence:** the course's own target table states "7 of 9" and "2 of 9 (static, `android`)"
  explicitly, so the distinction is visible to a reader of the course brief, not buried.
- **Revisit if:** a future, CI-safe deterministic Android build/execute path becomes available in the
  harness.

## Decision D7: no new course is assigned to any career or skills path manifest

- **Selected:** Every one of the 48 courses states "None" in its "In which paths" section; path assignment
  is left to a later plan or to the path's own maintainer.
- **Alternative A — assign each course to the most obviously related path's extension phase in this same
  plan.** Rejected: this plan's own scope (inventory and migrate) is already large (48 courses in 16
  waves); adding 8 path-manifest edits on top would multiply the review surface and risk breaking a
  frozen-membership test for a path this plan's author does not own content-wise.
- **Alternative B — leave the decision entirely unstated.** Rejected: silence would look like an oversight
  rather than a considered scope boundary; stating the reason (plan 02's closure rule R4 does not require
  it) in every course brief makes the boundary auditable.
- **Evidence:** plan 02's own closure rule R4, which binds only courses that are already path members.
- **Trade-off accepted:** a learner following an existing path does not automatically encounter any of
  these 48 courses; they are discoverable only via the catalog's category grouping until a later plan adds
  them to a path.
- **Consequence:** zero frozen-membership test changes in this plan.
- **Revisit if:** a path's maintainer requests one or more of these 48 courses for their path's extension
  phase.

## Decision D8: one hash-locked jar recipe serves Java, Kotlin, and Clojure

- **Selected:** Plan 09 merges first and leaves a `clojure` entry with no `install` recipe and a `java`
  entry with one (`JarFetch.java`, `jars.lock`, lines `<group>:<artifact>:<version> <sha256>`). This plan
  extends the merged `clojure` entry, and the `kotlin` entry, with the same `install` block, and teaches the
  shared `JarFetch.java` one optional third lock field, `[<repository>]` (`central` by default, or
  `clojars`). Each lock-bearing course keeps its own `learning/code/jars.lock`. WebAssembly is the only new
  toolchain this plan adds.
- **Alternative A — resolve dependencies with a Clojure build tool (tools.deps) at image build.** Rejected:
  it is a second resolver with its own cache layout and no native SHA-256 verification, so the "hash-locked,
  no network at run time" guarantee (plan 05 decision D9) would rest on a different, weaker mechanism for
  Clojure alone, and the three JVM languages would no longer share one reviewed recipe.
- **Alternative B — bake every library into the toolchain base image.** Rejected: it makes every course
  pay for libraries only three courses use, couples unrelated courses to one version set, and makes a
  single bump a full-catalog change; per-course locks keep a change local to the course that owns it.
- **Evidence:** plan 09's decisions D5 (a hash-locked jar recipe on `java`) and D6 (`clojure` joins the
  catalog); plan 05's decision D9 and "Adding a Toolchain" procedure; Clojars repository metadata read
  2026-10-10 showing Pedestal 0.8.2, Migratus 1.6.8, and `next.jdbc` 1.3.1118 are published there while
  Maven Central answered 404 for the same coordinates.
- **Trade-off accepted:** Clojars becomes a second trust root. It is mitigated the same way as Maven
  Central: HTTPS fetch only at image build, and every jar checked against a SHA-256 recorded in the
  committed lock, so a changed upstream artifact fails the build instead of changing a course silently.
- **Consequence:** three Clojure locks (one per course), two Kotlin locks, three Java locks; a change to
  `JarFetch.java` also changes the `java` image, so the one Phase 1 full examples run doubles as the proof
  that plan 09's Java units still pass; the Clojars field is unused by every Java and Kotlin course.
- **Revisit if:** a course needs a repository other than Maven Central and Clojars (add another named
  repository to the same field), or a Clojure course needs a library with a native (non-jar) component.

## Decision D9: `typescript` gains an npm lock recipe plus install links for node_modules resolution

- **Selected:** give the `typescript` catalog entry an `install` recipe (`lockfiles:
[package-lock.json]`, an `sh -c` argv that derives a `package.json` from the course lock and runs
  `npm ci` into `/srv/node-deps`, `PATH` extended with the install `.bin`, and one install link
  `node_modules` to `/srv/node-deps/node_modules`), and wire install links into every locked unit's
  working copy in the CLI (`unitLinks`: caller links first, install links added for locked units only,
  caller wins a name clash). The course `frontend-unit-testing-with-vitest-and-testing-library` commits
  one `learning/code/package-lock.json`; all 78 units declare it via `dependencies.lockfile`.
- **Alternative A — bake vitest and Testing Library into the typescript base image.** Rejected: same
  reason as D8 Alternative B; every non-frontend TypeScript course would carry a test stack it never
  uses, and a version bump would rebuild the shared image instead of one course lock.
- **Alternative B — per-unit vendored node_modules committed to the repo.** Rejected: thousands of
  generated files per unit would drown review, and the wave template bans generated files in units.
- **Alternative C — install into `/deps` like the root-user toolchains.** Rejected: the typescript image
  ends `USER node`, and the environment Dockerfile template carries no `USER` directive, so the install
  argv cannot create root-owned paths; `/srv/node-deps` is pre-created node-owned in the image's Dockerfile.
- **Evidence:** the course brief states "the pinned versions in the node toolchain lockfile are the
  source of truth", but no lockfile existed and `examples check` failed 87/87 on the bare typescript
  image; the harness already materialized caller-supplied working-copy symlinks
  (`TestRunMaterializesLinks`) but nothing wired them end to end; runs are `--read-only` under a host
  uid, so dependencies must resolve from a world-readable install beside the unit, which the link
  provides for ESM imports that ignore `NODE_PATH`.
- **Trade-off accepted:** `npm ci` runs at environment-image build (network on) while units run offline;
  the derived `package.json` is build-local and never committed, so the lock stays the single source of
  truth. Vitest cache writes go to the writable working copy, not the read-only install.
- **Consequence:** first toolchain to exercise the locked-unit path end to end; `catalog.Link`,
  `Install.Links`, and `unitLinks` are covered by `TestDecodeAcceptsInstallLinks`,
  `TestDecodeRefusesVagueInstallLinks`, and `TestRunAddsInstallLinksToLockedUnits`.
- **Revisit if:** a second npm course needs a different stack (add its own lock; the recipe is shared),
  or a toolchain needs links for unlocked units (extend `unitLinks` past the lockfile guard).

## Decision D9 follow-up: vitest 5 read-only adaptations and detector compliance

- **Vitest 5 needs three read-only adaptations** (found by running the first locked unit, not by
  reading docs): `XDG_DATA_HOME=/tmp/ayokoding-data` in the recipe `env` (the v5 API-token file
  defaults under `~/.local/share`, unwritable when runs are `--read-only` with `HOME=/`);
  `--fsModuleCachePath=/tmp/.vitest-cache` on every unit command (the v5 module cache defaults to
  `node_modules/.vitest-cache`, read-only through the link); `--outputFile=report.json` for the
  machine-readable-report unit (v5 writes `--reporter=json` to `.vitest/json/output.json` instead
  of stdout, which broke `parse.mjs`). Full course: EX-CHECK 87/87 green.
- **Phase-2 detector compliance (no detector changes):** the course lock lives at the course root
  (`<course>/package-lock.json`, refs `lockfile: package-lock.json`) because the
  unit-without-run.yaml detector flags any code-root holding a non-markdown file; the capstone
  `expected/main.stdout.txt` nests one deeper (`expected/main/main.stdout.txt`) exactly like the
  wave-1 capstones, since only root and direct-child dirs are checked. `estimatedHours` follows the
  brief (`from the drift test message`): 12 after the lock moved out of the scanned `code/` tree.
- **Latent note (not fixed here):** the environment-image tag hashes the toolchain image, the lock
  bytes, and the install command, but not the install `env` or links — a recipe-env change alone
  reuses a stale image. Remedy applied locally: delete the stale `ayokoding-env` image so the next
  locked run rebuilds. Revisit if a recipe env change ever needs automatic invalidation.
- **Worktree hygiene learned:** 196 gitignored `obj/`/`bin/` dirs (dotnet build residue) under two
  pre-existing courses inflated their scanner counts (`just-enough-csharp` read 108h); the scanner
  counts ignored files, so residue must be deleted, not worked around. The one tracked Rust
  `src/bin` dir was verified and kept.

## Decision D10: the `go` entry gains an `install` recipe (`go.mod` lockfile, baked module cache)

- **Selected:** the `go` toolchain entry (pinned `golang:1.27`, unchanged image) gains an `install`
  block naming `go.mod`: the install argv downloads the course lockfile's requirements into
  `/deps/gomod` (build time, the only phase with network), and run-time `GOMODCACHE=/deps/gomod/cache`
  plus `GOPROXY=off` makes unit `go build` runs hermetic. Method follows tech-docs/003
  §"Install recipes for the other toolchains" (same RED, GREEN, REFACTOR steps as the `kotlin` change).
- **Why not `vendor/`:** the gin maker vendored Gin per unit (87 dirs, 83k files); vendored
  `LICENSE.md` files fail the `md-naming` kebab gate (whole-tree scan, 25 findings) and the commit
  would carry 83 thousand third-party files. All vendor dirs deleted; nothing vendored in the repo.
- **Course side:** `web-backends-in-go-with-gin` keeps one shared `learning/code/go.mod` (+ `go.sum`)
  as the env lock; all 87 units point at it with `dependencies: lockfile: learning/code/go.mod`
  while keeping their own per-unit `go.mod`/`go.sum` for resolution. The shared lock covers the full
  gin closure (verified: units import only gin + its transitive deps). `estimatedHours` follows the
  drift message: 32.
- **Alternative B — `services: [postgres]` for network:** rejected; the units use no database, and the
  service network has no external route anyway (run contract §Network).
- **Evidence:** `run_execute.go` ("Units without services run on --network none"), run contract
  ("no route out" even with services), env planner (`BuildEnvironment` hashes image + lock bytes +
  install argv), sibling recipes (rust `Cargo.lock` → `/deps/rust`; typescript `package-lock.json` →
  `/srv/node-deps`). Single-unit harness run passed, then full course EX-CHECK exit 0 (87/87).
- **Trade-off accepted:** `toolchains/catalog.yaml` changes, so the PR examples check runs in full
  mode (plan 05 rule) and the CLI must be rebuilt from source (embedded catalog).
- **Latent note (same as D9):** the env tag still ignores install `env`; only image/lock/argv hash.
- **Revisit if:** a second Go course needs third-party modules (it reuses this recipe with its own
  course lock), or Go modules ever need a private proxy (extend the recipe, never the units).
