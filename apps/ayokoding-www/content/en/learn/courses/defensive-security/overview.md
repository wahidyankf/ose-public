---
title: "Overview"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 1
---

> **Safe defensive lab.** This course uses only original, synthetic telemetry stored in this directory.
> Its scripts open no socket and accept no host. If you later import generated NDJSON, do so only into an
> OpenSearch or ELK environment that you own and isolate.

## Prerequisites

- **Prior topics**: [Security Essentials](../security-essentials/overview.md) supplies baseline
  controls; [18 · Networking Essentials](../networking-essentials/overview.md) supplies the network
  vocabulary behind telemetry and segmentation.
- **Tools and environment**: Python 3.13+ and a POSIX shell. An optional self-owned OpenSearch or ELK
  lab can receive generated NDJSON, but every required exercise runs offline first.
- **Assumed knowledge**: reading JSON, basic shell commands, and the difference between an
  authentication event and an application request. No production log access is required.

## Why this exists

An attack that succeeds without useful telemetry is often discovered too late to contain well.
Defensive work makes the system observable, detects behavior worth review, guides a measured response,
and removes the condition that made recurrence likely.

**Keep this if you forget everything else**: centralize trustworthy telemetry, turn a known behavior
into a testable detection, rehearse response decisions, and harden the weakest exposed control. The lab
preserves the full chain—ingest, detect, hunt, respond, recover, improve—without touching a real target
or real person's data.

## Scope boundary

This is hands-on generalist blue-team breadth: portable Sigma rules, normalized telemetry,
OpenSearch/ELK-shaped ingestion, incident-response lifecycle practice, and baseline hardening. It does
**not** teach the Wazuh-specific decoders, Wazuh correlation-rule authoring, Wazuh dashboard operations,
or specialist false-positive tuning owned by `detection-engineering-and-siem-operations`, which follows
this course. A reader should leave here able to collaborate with that specialist—not mistake this
generalist lab for that deep SIEM-operations tier.

## Accuracy notes

- [NIST SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final), published in April 2025,
  supersedes Rev. 2 and frames incident-response considerations through CSF 2.0. The familiar prepare →
  detect/analyze → contain → eradicate → recover → lessons-learned sequence is used here as a practical
  tabletop teaching model, not presented as the current NIST phase model.
- [Sigma’s rule specification](https://sigmahq.io/sigma-specification/specification/sigma-rules-specification.html)
  defines portable YAML rules around a log source, detection, and condition. The course’s rule and
  fixtures are original, small lab material rather than a production detection library.
- The [MITRE ATT&CK Enterprise tactics page](https://attack.mitre.org/tactics/enterprise/) supplies the
  tactic/technique vocabulary. Technique mappings in the exercises organize defensive coverage; they are
  not instructions for conducting an attack.

## How the course is organized

- **[Learning](./learning/overview.md)** contains 78 executable, reviewable examples: beginner telemetry
  and portable detection foundations, intermediate hunting and incident-response practice, and advanced
  hardening, coverage, automation, and tabletop work.
- **[Drilling](./drilling/overview.md)** develops recall, judgment, local implementation, transfer, and
  self-review in the same five-step order used across the course library.
- **[Capstone](./learning/capstone/overview.md)** builds a complete local blue-team decision trail:
  inspect synthetic telemetry, validate two detections, conduct a tabletop, and record hardening follow-up.

Next: [Learning Overview](./learning/overview.md) →

## Legacy relation

Superseded by: this canonical course replaces the overlapping legacy defensive-security material;
the historical material remains available during the transition.
