---
title: "Overview"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Security Essentials](../security-essentials/learning/overview.md) supplies
  safe input handling and everyday application defenses; [Backend at Scale](../backend-at-scale/learning/overview.md)
  supplies the OAuth/OIDC and service surface that this course assesses; and
  [Just Enough Python](../just-enough-python/learning/overview.md) supplies the Python needed to
  read and run the local demonstrations.
- **Tools and environment**: Python 3.13+, a terminal, and a virtual environment. The few external
  packages are pinned in `learning/code/requirements.txt`; every executable works only with local,
  synthetic values and never contacts a network service.
- **Assumed knowledge**: request/response flow, parameterized SQL, password hashing at a using level,
  and the distinction between a session and a bearer token.

## Why this exists

Security is a property of a whole system, not a feature attached to a route. An attacker needs one
unprotected boundary; defenders need a reasoned set of mutually reinforcing controls. This course
teaches that reasoning from the CIA triad and STRIDE through cryptography, identity, browser defenses,
dependency risk, and a secure delivery loop.

**Scope boundary**: this is the conceptual engineering spine between `security-essentials` and the
hands-on `offensive-security` and `defensive-security` courses. It does not teach exploitation
workflows, operational detection, or incident response. Instead, it explains how to model risk,
choose preventive controls, and prove those controls fail closed in a small application.

## How the course is organized

- **[Learning](./learning/overview.md)** presents 52 annotated worked examples in three theme
  clusters. Tables, diagrams, and small runnable Python programs are used only where each medium
  makes the security mechanism clearer.
- **[Drilling](./drilling/overview.md)** turns the control vocabulary, risk judgments, and review
  sequence into retrieval practice.

Next: [Learning Overview](./learning/overview.md) →

## Legacy relation

Superseded by: this canonical course replaces the overlapping legacy information-security foundations;
the historical material remains available during the transition.
