# A deterministic `rhino-cli` validator for syllabus course-file conformance

One-line summary: the [Learning-Plan Syllabus Convention](../../../repo-governance/conventions/structure/learning-plan-syllabus.md)
now specifies a per-course file shape and ships a runnable `grep` **conformance recipe**, but nothing
in the toolchain enforces it — a deterministic `rhino-cli md syllabus validate` subcommand should
follow the now-settled format.

> Filed 2026-07-22 as the deferred half of the `learning-plan-syllabus-folder-convention` plan, which
> deliberately shipped the written convention and a documented recipe first and left the machine check
> as future work — a check should follow a settled format, not precede it.

## Problem / context

The syllabus convention derives a REQUIRED / RECOMMENDED / OPTIONAL section tiering from a measured
census of 174 course files across three corpora, and gives authors a copy-paste template plus a
`grep`-loop **conformance recipe** to self-check. That recipe is real and works — run against the
three corpora today it correctly reports exactly one file (`capstone-forge-ready.md`, a legitimate
capstone variant) missing a REQUIRED section and no other miss.

But the recipe is a documented shell loop an author must remember to run, not a gate. A learning-bearing
plan whose author skips it, or a course file that loses a REQUIRED section in a later edit, is caught
only by `plan-checker` Step 5n reading the plan docs — never by a deterministic check over the course
files themselves. The convention explicitly defers the machine check: "a deterministic check should
follow a settled format, not precede it."

## Why now

Not yet — that is the point of this brief. Two conditions must hold before building it:

- **The format must settle.** The convention was authored this week; its tiers are derived from three
  corpora and may shift as a fourth learning-bearing plan lands. A validator built on a still-moving
  census would encode a frozen list the convention explicitly warns against.
- **A second consumer must appear.** One recipe, run by hand, is adequate for three corpora. The cost
  of a `rhino-cli` subcommand (parser, tests, Gherkin behaviour tree, byte-identity across three repos)
  is only justified once the recipe is run often enough that forgetting it becomes the failure mode.

Filing now captures the design while it is fresh and names the promotion signal, so the decision to
build is a deliberate trigger rather than a rediscovery.

## Prior art / precedents

- The [`learning-plan-syllabus-folder-convention`](../../done/2026-07-22__learning-plan-syllabus-folder-convention/README.md)
  plan — this brief is its deferred deterministic-validator half, and the convention + recipe are its
  shipped output.
- [`mermaid-validator-does-not-check-syntax`](../q1-urgent-important/mermaid-validator-does-not-check-syntax.md) — a cautionary
  precedent: a `rhino-cli md` validator whose green result is trusted for a property it does not test.
  A syllabus validator must actually parse the section shape, not merely count files.
- The existing `rhino-cli md` family (`links validate`, `readme-index validate`, `heading-hierarchy
validate`) — the established pattern a `md syllabus validate` subcommand would join, including its
  pre-commit / pre-push / CI wiring and its byte-identity requirement across both parity repos.

## Proposed direction (sketch)

A `rhino-cli md syllabus validate [--corpus <path>]` subcommand that:

- discovers each `syllabus/courses/` corpus (or takes an explicit `--corpus` path), skipping
  `README.md` and `surgery.md`;
- checks every course file for the REQUIRED sections, with a capstone carve-out matching the
  convention's grandfathering;
- optionally re-measures the census and flags tier drift (a section crossing the 99% / 80% thresholds);
- exits non-zero with a per-file miss report, mirroring the documented recipe's output verbatim so the
  two never disagree.

Wire it into the same pre-commit / pre-push / CI positions as the other `md` validators, and add its
Gherkin behaviour tree under `specs/apps/rhino/cli/behaviours/**` per the byte-identity
boundary.

## Rough scope & non-goals

**In scope**: the subcommand, its unit + Gherkin coverage, its toolchain wiring, and byte-identical
propagation across `ose-public` / the private sibling.

**Non-goals**: retrofitting existing course files to the shape (the convention grandfathers the 17-file
ordered-list cohort and the capstone variant); validating course _body content_ (only structural
section presence); replacing `plan-checker` Step 5n (which gates the plan docs, a different surface).

## Risks & open questions

- **Premature freeze.** Building before the census settles bakes in a tier list the convention says to
  re-derive. Mitigation: the promotion signal below gates the build on a real second consumer.
- **Capstone / variant carve-outs.** The validator must encode the same carve-outs the recipe and
  convention describe, or it will flag legitimate variants — the exact vacuous-vs-noisy tension the
  mermaid-validator brief warns about.
- **Open question**: does the validator live as a new `md syllabus` subcommand, or as an extension of
  `readme-index validate` (which already understands `syllabus/` folder structure)?
- **Open question**: should tier-drift detection be a hard failure or a warning?

## What success looks like + promotion signal

**Promotion signal (build it when any one holds):**

- a **fourth** learning-bearing plan lands, making "run the recipe by hand" a repeated, forgettable
  step across four-plus corpora; or
- a course file regresses a REQUIRED section between edits and no gate catches it; or
- the census tiering stabilizes across at least one added corpus (no tier crosses a threshold), proving
  the format has settled.

**Success**: a green `rhino-cli md syllabus validate` in pre-commit / pre-push / CI means every course
file in every corpus carries its REQUIRED sections (capstone/grandfathered variants excepted), the
documented recipe and the validator never disagree, and the check is byte-identical across all three
repos.
