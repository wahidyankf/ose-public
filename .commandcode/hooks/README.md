# Command Code Hooks

The native adapter translates Command Code payloads to the existing Public policy hooks. It retains native fields,
quotes shell argv, uses the requested execution directory, and preserves the first multi-read denial. The formatter
uses one transactional standard HIPPO admission for Markdown files. The shared FERRET wrapper receives raw stdin.

## Contents

- [Policy adapter](run-policy-hook.sh) — Four named delegates; unlisted policies, malformed JSON, and failed requested
  directories refuse before delegation. Exit 2 reports invalid transport, and delegate failures propagate.
- [Policy transport tests](policy-hooks.test.sh) — Synthetic payloads, an isolated repository, fake formatter admission,
  and all three registrations. The initial RED proved the missing adapter assertion before fixture setup.

Run the test through one ordinary HIPPO admission after independent review and with a finite owned process deadline.
It uses private Git metadata and a fake capture executable, with no provider session or real learning data. Passing
transport checks do not prove installed CLI discovery or live hook enforcement.
