# Command Code Hooks

The native adapter translates Command Code payloads to the existing Public policy hooks. It retains native fields,
quotes shell argv, uses the requested execution directory, and preserves the first multi-read denial. The formatter
uses one transactional standard HIPPO admission for Markdown files. The retained legacy FERRET transport helper receives raw stdin; current capture registrations are global.

The current `agent-policy` selector forwards original JSON to the local maintained router using
`--scope local --harness commandcode`. Its fail-closed registration covers all eight native tool families.
The [selector regression](agent-policy-selector.test.sh) runs from the policy transport driver.

## Contents

- [Policy adapter](run-policy-hook.sh) — The local `agent-policy` selector and retained legacy named delegates; unlisted policies, malformed JSON, and failed requested
  directories refuse before delegation. Exit 2 reports invalid transport, and delegate failures propagate.
- [Policy transport tests](policy-hooks.test.sh) — Synthetic payloads, an isolated repository, fake formatter admission,
  and retained legacy transport behavior; the selector regression covers current local policy registration. The initial RED proved the missing adapter assertion before fixture setup.

Run the test through one ordinary HIPPO admission after independent review and with a finite owned process deadline.
It uses private Git metadata and a fake capture executable, with no provider session or real learning data. Passing
transport checks do not prove installed CLI discovery or live hook enforcement.
