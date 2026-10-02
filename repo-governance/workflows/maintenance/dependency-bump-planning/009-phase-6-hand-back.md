---
description: Emits the final user-visible summary and the re-run reminder for plans whose promotion is delayed past the cutoff.
when_to_use: Use when finishing the workflow and reporting the plan path, report path, and final status.
---

# Phase 6: Hand-back (Sequential)

Emit a user-visible summary: `plan-path`, `clearance-report` path, `final-status`, and a reminder
that **the plan is a snapshot as of the cutoff date**. Per the policy's
[When the Plan Spans Many Days](../../../development/workflow/dependency-bump-policy.md) section, if
promotion to `in-progress/` is delayed, the eligibility check must be re-run before execution to
catch newly-eligible versions or newly-disclosed CVEs.
