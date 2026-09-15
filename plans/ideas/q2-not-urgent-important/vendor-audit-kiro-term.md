# Vendor-audit: add `Kiro` to the vendor-term list (parity repos)

One-line summary: teach the vendor-audit scanner the term `Kiro` (and `.kiro/`) so a Kiro mention
leaking into vendor-neutral governance prose is caught instead of passing silently.

> De-promoted 2026-07-21 from a full backlog plan (full detail preserved in git history).

## Problem / context

The vendor-audit scanner enforces vendor-neutrality across `repo-governance/**` by matching a fixed
denylist of vendor terms — `Claude Code`, `OpenCode`, `\bCursor\b`, `\bAmazon Q\b`, `\bAntigravity\b`,
and similar — implemented in `apps/rhino-cli/src/application/repo_governance/vendor_audit.rs`. "Kiro"
/ "Kiro CLI" entered the repo's vocabulary as the Amazon Q Developer succession, but it is not in that
list, so a Kiro mention in governance prose would pass the scanner silently — exactly the failure the
scanner exists to prevent. The gap is preventive, not corrective: `grep -rn "Kiro"
repo-governance/` currently returns nothing, so there is no live leak, only an open door.

## Why now

The term is already in circulation (Amazon Q's IDE plugins reach end-of-support 2027-04-30, with Kiro
CLI as the named successor), and the scanner is blind to it today. This is the canonical
enumeration-based-guard failure mode — a denylist that fails open on every term nobody has added yet —
so it is cheapest to close before the first mention lands, not after.

## Prior art / precedents

- **Governance Vendor-Independence convention** — the rule the scanner enforces and whose companion term
  table must stay in sync with the denylist. [vendor-independence](../../../repo-governance/conventions/structure/governance-vendor-independence.md)
- **OWASP allowlist-over-denylist guidance** — the security principle behind the "denylist fails open on
  every unnamed term" critique in the out-of-scope redesign. [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- **Kiro (AWS)** — the Amazon Q successor tool whose term the scanner must learn to catch. [kiro.dev](https://kiro.dev/)

## Proposed direction (sketch)

- Add `\bKiro\b` and the `.kiro/` path prefix to the vendor-term list in `vendor_audit.rs`, with
  companion Gherkin under `specs/apps/rhino/cli/behaviours/**`.
- Update the companion term table in the Governance Vendor-Independence Convention in the same change,
  so the documented list and the scanner agree (editing only the doc would make it lie about the
  tool).
- Land the change byte-identically in both parity repos together, and add `.kiro/` to the
  platform-bindings catalog only if a Kiro binding is actually shipped.

## Rough scope & non-goals

In scope: the `Kiro`/`.kiro/` term addition, the doc-table sync, the Gherkin, and byte-identical
two-repo parity landing.

Out of scope (for now): the broader redesign from denylist to allowlist — evaluate whether the
scanner should instead fail closed on any proper-noun tool reference outside an allowlisted set, but
if that is out of appetite, record the decision explicitly rather than silently shipping the
next-vendor-hits-this-again denylist.

## Risks & open questions

- The change touches `apps/rhino-cli/**`, required byte-identical across `ose-public`
  and the private sibling — this is why the originating single-repo plan could not fix it; execution must be a
  coordinated two-repo parity change.
- Denylist vs. allowlist redesign is the real open decision: patch the one term now, or fix the class
  so the next unnamed vendor fails closed? A patch is cheap but recurring; the redesign is larger
  appetite. (open — must be decided or explicitly deferred before promotion)

## What success looks like + promotion signal

Success: a file under `repo-governance/` containing "Kiro" is flagged by name with a non-zero exit,
a Kiro mention under a Platform Binding Examples heading is still skipped, vendor-free prose still
passes (the falsifiability control), and the documented term table diffs identical to the scanner's
list across both parity repos. Ready to re-promote once the denylist-vs-allowlist scope question is
settled — either "just add the term" is accepted as the appetite, or the allowlist redesign is
chosen as the real deliverable.
