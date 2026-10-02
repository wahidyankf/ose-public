# Lifecycle-Owned Mechanical Suppression

## PR Quality-Gate Invocation

Read the gate's Deterministic Boundary before reviewing. Suppress every property it lists: its declared tool
runs in pull request CI, and a red CI result is that tool's finding, never a specialist's. Do not rerun,
tool-verify, or AI-rederive such a property.

Continue semantic review, including behavioural correctness, architecture, security, test
integrity, performance, documentation meaning, instruction decay, and type soundness. Continue
surface-conditional runtime/manual tester gates; they are not substitutes for registered lifecycle
checks.

## Standalone Invocation

Without the quality-gate delegation handoff, retain each specialist's existing charter and
SUPPRESS block. Continue suppressing purely mechanical failures ordinarily caught by configured
compiler/build, lint/format, link/diagram/naming, spec-presence, or boundary gates; standalone
instructions may run read-only checks as evidence. Do not infer delegated ownership or weaken
semantic review from this module.
