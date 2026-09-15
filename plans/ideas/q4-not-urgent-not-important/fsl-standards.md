# FSL standards

One-line summary: decide whether and how the Functional Source License (FSL) applies in this repo and
codify the resulting licensing standard.

> Idea, added (original capture undated; generic item — source line: "FSL standards"; FSL interpretation
> unconfirmed).
> Relocated from private-sibling/plans/ideas/fsl-standards.md on 2026-08-06 by plan-ideas-grooming.

## Problem / context

This is a one-line capture ("FSL standards") whose intent is not fully pinned down: it most plausibly
refers to the Functional Source License (FSL), a source-available license, and asks whether this repo
should adopt or codify a standard around it. The repo is currently proprietary (All Rights Reserved),
so any FSL adoption would be a deliberate licensing-posture change, not a formatting tweak. No baseline
measured, and the exact meaning of the original note is itself an open question.

## Why now

Not urgent — there is no forcing event. It becomes timely only if there is an actual reason to move any
part of the repo toward a source-available posture, or to standardize how licensing is expressed.

## Prior art / precedents

- **fsl-license-migration plan** — prior in-repo work that already moved licensing toward FSL; the
  concrete precedent for any FSL standard. done plan (private, not linked)
- **Licensing convention** — the existing in-repo licensing rule any FSL standard would be codified
  into. licensing.md (private, not linked)
- **Functional Source License (Sentry)** — the source-available license this idea is about, converting
  to Apache-2.0/MIT after two years. [fsl.software](https://fsl.software)
- **Business Source License (BUSL)** — FSL's four-year predecessor that FSL improves on; the reference
  point for the conversion-window design (no stable public URL verified).

## Proposed direction (sketch)

- First confirm what "FSL standards" was meant to capture (Functional Source License, or something
  else entirely).
- If FSL: decide whether any code should move from proprietary to FSL, and where the boundary sits.
- Codify the resulting rule in the existing proprietary-licensing convention rather than as a new
  scattered standard.

## Rough scope & non-goals

In scope: clarifying the intent and, if warranted, a licensing-standard decision around FSL.

Out of scope (for now): actually relicensing any code before the intent and rationale are confirmed;
third-party dependency licensing (a separate concern).

## Risks & open questions

- Does "FSL" here mean the Functional Source License, or something else? (open — this is the blocker)
- Is there any real driver to change the repo's proprietary posture? (open)
- How would an FSL boundary interact with the existing proprietary-licensing convention? (open)

## What success looks like + promotion signal

Success: the intent behind "FSL standards" is confirmed and, if warranted, a clear licensing standard is
codified in the licensing convention. Ready to promote to a `backlog/` plan only once the original intent
is confirmed and a real driver exists — until then it stays an under-specified two-pager.
