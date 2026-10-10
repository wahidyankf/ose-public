---
title: "Overview"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 1
---

> **Rules of engagement — read first.** This course is **lab-local and authorized-scope-only**.
> Run hands-on material only against a deliberately vulnerable target that you own and self-host on
> `localhost` or an isolated host-only network, after recording written authorization and boundaries.
> Do not test, scan, enumerate, exploit, or attempt to access any real-world, third-party, shared,
> employer, or public target. Unauthorized access is illegal and outside this course.

## Prerequisites

- **Prior topics**: [IT and Application Security](../it-and-application-security/overview.md)
  supplies threat and application-security vocabulary; [Security Essentials](../security-essentials/learning/overview.md)
  supplies safe defensive controls; and [Just Enough Bash](../just-enough-bash/learning/overview.md)
  supplies terminal basics.
- **Tools and environment**: Python 3.13+, POSIX shell, and a self-owned local lab. The included
  programs read synthetic fixtures and reject any target other than `localhost` or `127.0.0.1`.
- **Assumed knowledge**: HTTP request/response flow, basic SQL parameterization, and a willingness
  to stop if authorization or isolation is unclear.

## Why this exists

Defenders make better decisions when they can trace a weakness from an exposed assumption to a
reproducible, bounded finding. Offensive security supplies that adversarial perspective—but only
within an engagement that protects people, systems, and evidence. The output is a clear report that
helps a defender fix a specific problem, not a collection of techniques to use against others.

**Keep this if you forget everything else**: authorization comes before every action; keep the lab
isolated; prove only what the written scope permits; then hand the owner a reproducible finding and a
remediation. [NIST SP 800-115](https://csrc.nist.gov/pubs/sp/800/115/final) places planning and rules
of engagement before testing; this course adopts that order.

## Scope boundary

This is the lab-only, adversarial companion to
[IT and Application Security](../it-and-application-security/overview.md), which teaches preventive
controls and threat modeling. It is not a guide to attacking real systems, evading detection, social
engineering people, persistence, or extracting data. [Defensive Security](../defensive-security/overview.md)
continues with detection, response, and hardening once a safe finding has been produced.

## How the course is organized

- **[Learning](./learning/overview.md)** has 78 progressively structured examples: engagement
  safety, synthetic discovery evidence, lab web findings, and reporting. Every hands-on example
  repeats the authorized-lab rule and works from local fixtures or an explicitly self-hosted target.
- **[Drilling](./drilling/overview.md)** builds recall, judgment, safe implementation, transfer, and
  self-review habits.
- **[Capstone](./learning/capstone/overview.md)** validates a local-only scope, interprets fixture
  evidence, and writes two remediation-oriented findings without sending network traffic.

Next: [Learning Overview](./learning/overview.md) →

## Legacy relation

Superseded by: this canonical course replaces the overlapping legacy offensive-security material;
the historical material remains available during the transition.
