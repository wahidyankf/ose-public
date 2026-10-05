---
description: "Before a number is allowed to justify a decision, prove the command produced it, prove it measures the path that actually runs, and prove the metric responds to the thing being changed"
when_to_use: "Read this index to find the right Trustworthy Measurement child document."
---

# Trustworthy Measurement

- [Trustworthy Measurement — Rule 1: Prove the Command Ran](./rule-1-prove-the-command-ran.md) — A timing harness reports elapsed time whether or not the measured command executed - assert exit code and output, not just duration, and watch for shell builtin-transform traps Use before trusting any timing number from a benchmark harness or shell loop.
- [Trustworthy Measurement — Rules 2-4](./rules-2-to-4.md) — Measure the integrated path not an isolated invocation, establish the critical path before prescribing a wall-clock remedy, and treat a remedy written before anyone saw a timeline as a hypothesis Use before hard-gating a plan phase on a benchmark number, or before applying a pre-authored performance remedy.
- [Trustworthy Measurement — Rule 5: Probes and Scans Must Assert Their Reach](./rule-5-probes-and-scans-must-assert-their-reach.md) — A falsifiability probe proves nothing unless it moves the byte the check actually guards, and a scan proves nothing unless it asserts where it stopped Use when proving a guard is falsifiable, or when a script locates a region by walking a file.
- [Trustworthy Measurement — Rule 6: An Assertion Must Outlive Its Moment](./rule-6-an-assertion-must-outlive-its-moment.md) — A baseline read from `HEAD` expires when the change lands, so an executable assertion states the invariant that holds afterwards Use when writing a test that reads the repository around it, or that states a before-and-after claim.
- [Trustworthy Measurement — Rule 7: Prove the Run Finished](./rule-7-prove-the-run-finished.md) — A run that was killed leaves output that reads exactly like a finished one - record a terminal exit marker as the run's last action and treat its absence as "did not finish", never as "still running" or "passed" Use whenever a command is backgrounded, wrapped in a timeout, or long enough that its result is read after the fact.
