# 📚 Product Requirements: Reader Journeys and Documentation Experience

## Product Overview

This program produces one repository experience with two clear reader paths. A product-first
orientation explains why the platform exists. The repository then guides each audience toward the
next useful outcome with short, trustworthy navigation and a dedicated guided onboarding document.

The documentation itself is the product surface in this plan. Success means a reader can choose a
path, follow commands with stated outcomes, understand failures, and return to a stable reference
without encountering contradictory claims.

## Personas

### 🧭 Product person

Understands enterprise products and business problems but may not know Nx, Rust, F#, monorepos,
Gherkin, or repository governance. Wants the mission, product map, maturity, repository role, and
where product decisions live.

### 🧰 Early-level engineer

Can use a terminal and Git but needs prerequisites explained, commands prefixed correctly, expected
outcomes stated, and recovery steps near the failure they address.

### 🔄 Returning maintainer

Already knows the repository and wants a short route to exact project commands, quality gates,
architecture, plans, and source-of-truth references.

## Reader Journey Contract

### Shared opening

The root README must answer, in this order:

1. What problem does this repository help solve?
2. Who is it for?
3. How does it differ from its sibling repositories?
4. What is its maturity and contribution posture?
5. Which reader path should I choose?

### Reader paths

- **🧭 Understand the product** — mission → product/repository map → roadmap/specifications → next
  product document.
- **🧰 Run OSE locally** — supported platform → prerequisites → clone/bootstrap → project discovery →
  visible first run → optional authorized-contributor workflow.

Sibling repositories appear in the shared opening as accurate one-line descriptions and links only.
No reader path, tutorial, or metadata change is delivered for them.

## Human Voice Contract

Every changed reader-facing document must satisfy all of these requirements:

- Lead with the reader's purpose or problem, not “This directory contains…”.
- Write in active voice and use second person where it sounds natural.
- Explain Nx, monorepo, Gherkin, BDD, TDD, and other niche terms on first use for the intended
  audience.
- Prefer concrete verbs and outcomes over claims such as “comprehensive,” “robust,” “seamless,” or
  “powerful.”
- Keep paragraphs short and vary sentence openings; do not stamp every README from one template.
- Use contractions when they make the sentence sound natural.
- Never use “just,” “simply,” or “obviously” to minimize a reader's difficulty.
- Place the expected outcome immediately after a command and the recovery route immediately after a
  likely failure.
- Use emojis only as supplementary wayfinding; pair every emoji with a text label.
- Keep READMEs as maps. Move lengthy procedures to tutorials/how-to guides and facts to reference
  docs.
- End each entry point with a clear next step, not a generic pile of links.
- Run an independent read-aloud/editorial pass that checks for repetitive cadence, stock filler, and
  text that sounds machine-assembled.

## README Disposition Contract

Every tracked README receives exactly one of these outcomes in the ledger:

| Disposition          | Meaning                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `rewrite`            | The document's purpose or structure no longer serves its reader.                                                                           |
| `targeted-fix`       | A bounded factual, command, link, tone, or navigation defect requires an edit.                                                             |
| `link-only`          | The README should stay short and route detail to a canonical document.                                                                     |
| `verified-unchanged` | It already meets the reader, fact, link, and voice checks.                                                                                 |
| `generated`          | A canonical source owns it; regenerate and validate instead of hand-editing.                                                               |
| `historical-exempt`  | It records completed work or archived material and remains untouched.                                                                      |
| `identity-bound`     | It sits inside this plan's no-edit scope for `rhino-cli`; audit only, never edit in this plan. Most, not all, are byte-identical.          |
| `not-reader-doc`     | A non-README Markdown file is inventoried but is not living repository-facing documentation.                                               |
| `follow-up-required` | A blocking non-terminal state: the defect needs a separately scoped code, infrastructure, or governance change before this plan can close. |

No in-scope file may be absent from the ledger. No file may receive two terminal dispositions, and
no `follow-up-required` state may remain at archival.

## GitHub About Metadata Contract

The values below are the exact all-AI mutation contract. Topic arrays are lowercase GitHub slugs;
execution may not improvise new wording or topics.

| Repository   | Exact description                                                                                    | Exact homepage             | Exact topic set                                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `ose-public` | Open source platform for researching and building trustworthy, Sharia-compliant enterprise products. | `https://oseplatform.com/` | `enterprise-software`, `erp`, `fsharp`, `islamic-finance`, `monorepo`, `nx`, `open-source`, `rust`, `sharia-compliant`, `typescript` |

Before mutation, the executor captures `gh repo view --json` output with sensitive fields excluded.
After mutation, the executor reads the same fields back and verifies exact intent. If the live values
already equal the contract, the executor records verified equality instead of forcing a mutation.

## Package Metadata Contract

The root `package.json` uses the exact description from the GitHub About contract. The executor
applies the value through a repository-authoritative JSON update command, runs formatting, and
verifies exact equality with `jq -r '.description' package.json`.

## Product Scope

### In scope

- Reader routing, an onboarding tutorial, living READMEs, and directly related current docs in
  `ose-public`.
- Evidence-based disposition of every tracked README without forcing cosmetic edits.
- macOS and Ubuntu fresh-checkout journeys, with WSL2 described only as a possible unverified path.
- Complete GitHub About and package metadata for `ose-public`.

### Out of scope

- Product behavior, UI, API, or infrastructure changes made only to make a tutorial pass.
- Any change delivered into a sibling repository.
- Edits inside the `rhino-cli` byte-identity boundary.
- Public contribution intake or community-response commitments.
- Production credentials, production access, deployment, or operator runbooks in newcomer flows.
- Native Windows verification or a WSL2 support guarantee.
- Modernizing immutable historical plans and archived content.

## Product Risks

| Risk                                                       | Product response                                                                                                                |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| One template makes every directory sound interchangeable.  | Preserve the shared journey shape but write directory-specific openings, examples, and next steps.                              |
| A polished tutorial masks a broken command.                | Resolve commands from manifests and Nx configuration, then execute clean-checkout journeys on both supported operating systems. |
| Emojis become decoration or replace meaning.               | Use a small purposeful wayfinding vocabulary and pair every emoji with a text label.                                            |
| Audience paths duplicate durable facts.                    | Keep shared facts in reference docs and let each path link instead of restating them.                                           |
| A prose sweep erases repository character.                 | Edit by reader purpose, require file-specific rationale, and run a distinct AI read-aloud review.                               |
| Sibling-repository prose drifts toward claiming work done. | Describe siblings in one factual line each and link to the canonical related-repositories reference.                            |

## User Stories and Acceptance Criteria

### Story 1: Product orientation

As a product person, I want a plain-language product and repository map so that I can understand the
platform without learning its build system first.

```gherkin
Scenario: Product reader finds the product map
  Given a reader opens the ose-public root README without prior Nx knowledge
  When the reader follows the Understand the product path
  Then the reader can explain the repository's purpose and its relationship to the sibling OSE repositories
  And the reader reaches the current roadmap or product specification without entering setup instructions
```

### Story 2: Platform first success

As an early-level engineer, I want a verified walkthrough so that I can see the OSE website run
locally and understand what succeeded.

```gherkin
Scenario: Engineer runs ose-public from a fresh checkout
  Given a supported macOS or Ubuntu environment with the documented prerequisites
  When the engineer follows the onboarding tutorial from clone through the ose-www development target
  Then the documented page loads at the configured local address without browser console errors
  And every command and expected outcome matches the live repository configuration
```

### Story 3: Honest contribution posture

As a reader, I want contribution guidance to match repository policy so that I do not prepare a pull
request that the maintainer does not accept.

```gherkin
Scenario: Contribution entry points preserve closed external intake
  Given a reader opens the root README or the CONTRIBUTING file
  When the reader looks for contribution instructions
  Then external contributions are clearly described as closed or authorization-only
  And authorized contributors receive the current worktree-to-PR workflow without a response-time promise
```

### Story 4: Exhaustive but low-churn coverage

As a maintainer, I want every README reviewed without forcing cosmetic edits so that the refresh is
complete and reviewable.

```gherkin
Scenario: Every README receives one disposition
  Given the tracked README inventory is captured from Git at a recorded revision
  When the executor completes the disposition ledger
  Then every tracked README path appears exactly once with one allowed terminal disposition
  And a document that already passes its checks is recorded as verified-unchanged rather than edited
```

### Story 5: Executable commands

As an early-level engineer, I want commands tied to live configuration so that documentation does
not teach nonexistent projects, targets, paths, or flags.

```gherkin
Scenario: Documented repository commands resolve
  Given a living reader-facing document contains a shell command
  When the command is checked against its authoritative manifest help output or resolved Nx project configuration
  Then every referenced path project target and flag exists
  And unsafe or state-changing examples are excluded from the newcomer journey
```

### Story 6: Natural writing

As a reader, I want documentation that sounds like a thoughtful teammate so that I can trust it and
keep reading.

```gherkin
Scenario: Changed documentation passes the human voice review
  Given a changed reader-facing document has passed mechanical Markdown checks
  When an independent AI docs reviewer reads it aloud against the human voice contract
  Then the prose is specific welcoming and appropriate to its named audience
  And repetitive stock openings filler claims and template-like cadence are absent
```

### Story 7: Secret-free documentation work

As a maintainer, I want the plan and docs to remain secret-free so that documentation work cannot
leak operational information.

```gherkin
Scenario: Delivered artifacts preserve the sensitivity boundary
  Given the executor has audited documentation and produced plan evidence
  When plan files docs evidence metadata and learnings are scanned and reviewed by an AI
  Then no real secret credential hostname username IP address or connection string is present
  And every example uses a placeholder or a named environment variable
```

### Story 8: Consistent repository relationships

As a reader, I want one accurate ecosystem model so that I can distinguish content parity from byte
identity.

```gherkin
Scenario: Repository relationship claims agree
  Given content parity covers ose-public and private-sibling while rhino-cli byte identity covers the same pair
  When the reader compares living relationship documentation across the repository
  Then each document states the same two boundaries without including beaver-nest in either one
  And repository-specific product content is not described as parity content
```

### Story 9: The byte-identity boundary stays closed

As a maintainer, I want this plan to leave shared files alone so that no cross-repository sync
obligation opens.

```gherkin
Scenario: Delivery units avoid the identity boundary
  Given this plan declares apps/rhino-cli and its bound Gherkin tree a no-edit scope
  When any delivery unit in this plan is staged for commit
  Then git diff --cached --name-only lists no path inside that boundary
  And the ledger records those paths as identity-bound rather than edited
```

### Story 10: Complete repository metadata

As a GitHub visitor, I want the About panel to describe the repository accurately so that I can
choose the right starting point before opening a file.

```gherkin
Scenario: GitHub About metadata matches the contract
  Given the approved About and package description contracts
  When the metadata values are applied or verified through the named GitHub and npm commands
  Then the repository displays the approved description homepage and topic set
  And the root package description matches the same wording
```

### Story 11: Supported platform honesty

As an engineer, I want platform support stated honestly so that an unverified path is not presented
as guaranteed.

```gherkin
Scenario: Operating-system guidance distinguishes support from possibility
  Given macOS and Ubuntu Linux are the verified onboarding environments
  When a reader reviews platform guidance in any onboarding entry point
  Then macOS and Ubuntu are identified as supported paths
  And WSL2 is labeled as potentially workable but unsupported and unverified
```

## Product Scope Exemptions

- **UI-design funnel**: not applicable; no application screen or shared UI component changes.
- **Application Gherkin/spec binding**: not applicable to documentation-only edits. If execution
  discovers a code bug requiring a fix, that fix moves to a separate plan unless it blocks this
  program; any blocking fix follows the regression-test mandate.
- **Learning syllabus record**: not applicable. The onboarding document is a bounded operational
  walkthrough, not a course, curriculum, or reusable learning-path corpus.
- **Rule-15/Rule-16 live product retests**: not triggered by docs-only changes. The explicit browser
  walkthroughs in this plan validate documented first-success behavior instead.
