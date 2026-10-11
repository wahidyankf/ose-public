---
title: "Overview"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 1
---

> **Safe defensive lab.** Every fixture, decoder, rule, and dashboard plan in this course is original
> teaching material. The required commands read local files only, open no socket, accept no target, and
> must not be pointed at production, customer, or third-party telemetry.

## Prerequisites

- **Required prior course**: [Defensive Security](../defensive-security/overview.md). It establishes
  generalist blue-team breadth: portable Sigma/ELK-shaped detection, incident response, and hardening.
- **Supporting prior courses**: [Security Essentials](../security-essentials/overview.md),
  [Offensive Security](../offensive-security/overview.md), and just-enough Python. You need to read
  a log and distinguish a fictional alert from proof of an incident.
- **Tools and environment**: Python 3.13+, a POSIX shell, and an editor. A self-owned isolated Wazuh lab
  is optional; the complete learning path runs offline with the bundled synthetic data.

## Why this exists

Raw telemetry is not an alert. A SIEM becomes useful when an engineer can make parsing assumptions
explicit, turn them into rules, test them against both suspicious and ordinary events, and record why a
threshold deserves an analyst's attention. This course develops that operational discipline with Wazuh
XML as one concrete, inspectable ruleset surface.

**Keep this if you forget everything else**: a detection is a maintained hypothesis. Parse only what you
can explain, correlate only what you can test, and tune using evidence so a real signal is not buried by
routine activity.

## Scope boundary

This is the specialist, Wazuh-specific deep tier: the reader authors local Wazuh decoder XML, correlation
rules, a dashboard plan, and a documented false-positive tuning decision. It follows
`defensive-security`, which retains its hands-on _generalist_ Sigma/ELK breadth, incident-response
lifecycle, and hardening work. This course consumes that foundation; it does not re-teach broad IR or
baseline hardening, and it never presents a detection as authorization to probe a real system.

## References

- Wazuh's current [decoder XML reference](https://documentation.wazuh.com/current/user-manual/ruleset/ruleset-xml-syntax/decoders.html)
  documents `prematch`, `regex`, and `order`; the lab illustrates those concepts with invented events.
- Wazuh's current [rules XML reference](https://documentation.wazuh.com/current/user-manual/ruleset/ruleset-xml-syntax/rules.html)
  describes frequency and timeframe correlation. Production rules must be tested with the deployed
  version's rule test before an owner enables them.
- Wazuh documents [custom dashboards](https://documentation.wazuh.com/current/user-manual/wazuh-dashboard/creating-custom-dashboards.html).
  The JSON here is a local dashboard _plan_, not an export to import blindly into another environment.

## How the course is organized

- **[Learning](./learning/overview.md)** offers 78 compact, executable examples: decoder and field work,
  then correlation and tuning, then dashboards, triage, testing, and lifecycle decisions.
- **[Drilling](./drilling/overview.md)** uses recall, judgment, local validation, transfer, and self-check
  in the course-library's fixed five-section order.
- **[Capstone](./learning/capstone/overview.md)** delivers an original local detection pack: decoder,
  rules, correlation check, dashboard plan, and a false-positive decision record.

Next: [Learning Overview](./learning/overview.md) →

## Legacy relation

Superseded by: this canonical course replaces the overlapping SIEM and detection portions of legacy
defensive-security material; the historical material remains available during the transition.
