---
title: Licensing
description: License analysis and compliance decisions for open-source dependencies used in open-sharia-enterprise
category: explanation
subcategory: licensing
tags:
  - licensing
  - compliance
  - open-source
  - index
created: 2026-03-26
---

# Licensing

License analysis and compliance documentation for open-source dependencies used in the open-sharia-enterprise platform.

## Why Licensing Documentation?

Open-source licenses impose conditions on how software may be used, modified, and distributed. Some licenses are permissive (MIT, Apache 2.0), while others require specific obligations (LGPL, EPL) or contain non-compete restrictions (FSL). Documenting license decisions ensures the project remains compliant and reduces legal risk.

## Documents

- [Why MIT? — Strategic Rationale](mit-license-rationale.md) - Why this repository uses the MIT License: business risks accepted, benefits of full openness, and the market context (building-block economy vs. feature-monopoly model).
- [Licensing Decisions](licensing-decisions.md) - Analysis and decisions for notable dependencies: Liquibase FSL-1.1-ALv2, Hibernate LGPL-2.1, sharp-libvips LGPL-3.0, and Logback EPL-1.0/LGPL-2.1. Includes the quarterly audit schedule.
- [Production Dependency Compatibility](dependency-compatibility.md) - Historical audit (2026-04-04) of production dependency licenses, including LGPL elimination and MPL-2.0 analysis.

## Related Documentation

- [Database Audit Trail Pattern](../../../../governance/development/pattern/database-audit-trail.md) - Migration tool selection per language ecosystem
- [Software Engineering Index](../README.md) - All software engineering documentation
