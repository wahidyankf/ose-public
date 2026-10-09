# 005 — Fast-Changing-Tool Sourcing Policy

## Which courses this applies to

The four AI coding-agent courses (`claude-code-for-engineers`, `hermes-agent-for-engineers`,
`openclaw-for-engineers`, `pi-coding-agent-for-engineers`) teach commercial products whose configuration
surface, default behaviour, and even command names can change between minor releases. The legacy pages
this plan migrates from predate this plan and are not assumed to be current; they are source material to
mine, never a fact to copy forward as already verified.

## The policy

1. **Re-verify at writing time, not at planning time.** This plan (written 2026-10-09) does not assert
   any current version number, current default permission model, or current pricing for any of the four
   tools; every such fact is deferred to the maker, who checks the vendor's own documentation on the day
   the lesson is actually written.
2. **Date every version-specific claim.** Each course's `## References` section records, for every claim
   that could go stale, the exact version string the maker verified, the access date, and a direct link.
   The Content Quality Gate checks that this date is no more than 30 days before the course's last content
   commit; a stale or missing date is a blocking finding, not a style note.
3. **Never depend on live behaviour to make an example pass.** Every runnable example in these four
   courses drives a deterministic fixture shim of the tool's CLI and file-system effects, not the real
   binary and not a real network call. This means a reader two years from now still sees the example run
   and produce the recorded output, even if the real product's behaviour has since changed; the course
   text, not the harness, carries the currency risk, and the text's own dated References section is where
   a reader checks whether something has moved on.
4. **State the shim's simplifications in the text.** Where the fixture shim's behaviour is a deliberate
   simplification of the real product (for example, a simplified permission-prompt flow), the course says
   so plainly, so a reader does not mistake the shim for a guarantee about the live product.
5. **Comparison claims need the same freshness.** The capstone and the final advanced cluster in each of
   the four courses compare it against at least one sibling tool in this same plan; that comparison is
   re-verified on the same day as the rest of the course's version-specific claims, not written once and
   left to drift relative to the other three courses' own update dates.

## Why this is a policy, not a one-off caveat

Without a stated policy, a maker under time pressure could plausibly write "as of today" once in an
overview page and then treat every subsequent claim as covered by it, even months apart across a
48-course, 16-wave execution. Stating the rule once, here, and making the Content Quality Gate check the
dated-reference requirement directly (FR5 in [prd.md](../prd.md#functional-requirements)) removes that
ambiguity: a missing or stale date on a version-specific claim is caught mechanically, not left to a
reviewer's attention span.
