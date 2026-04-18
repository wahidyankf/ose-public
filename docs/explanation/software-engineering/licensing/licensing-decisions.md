---
title: Licensing Decisions
description: License analysis and compliance decisions for notable open-source dependencies in open-sharia-enterprise, including Liquibase FSL-1.1-ALv2, Hibernate LGPL-2.1, sharp-libvips LGPL-3.0, and Logback EPL-1.0/LGPL-2.1
category: explanation
subcategory: licensing
tags:
  - licensing
  - compliance
  - open-source
  - liquibase
  - hibernate
  - fsl
  - lgpl
created: 2026-03-26
updated: 2026-03-26
---

# Licensing Decisions

This document records license analysis and compliance decisions for open-source dependencies that require explicit justification. Each entry states the dependency, its license, the relevant concern, and the decision with rationale.

## Scope

This document covers dependencies whose licenses fall outside the straightforward permissive category (MIT, Apache 2.0, BSD) or that changed license in a way that requires re-evaluation. Permissive licenses with no use restrictions require no entry here.

---

## Liquibase: FSL-1.1-ALv2

### Background

Liquibase changed its license from Apache 2.0 to the [Functional Source License 1.1 (Apache 2.0 Future License)](https://fsl.software/) (FSL-1.1-ALv2) in version 5.0, released September 2025.

FSL-1.1-ALv2 is a source-available, time-delayed open-source license. Its key properties are:

- **Not OSI-approved.** FSL is not recognised as an open-source license by the Open Source Initiative.
- **Non-compete clause.** For two years from the release date of each version, use of the software to provide a **competing commercial migration tool** is prohibited. This is the "Competing Use" restriction.
- **Conversion to Apache 2.0.** After the two-year period, each version automatically converts to Apache 2.0. Liquibase 5.0 will become Apache 2.0 in September 2027.
- **Internal and non-competing use.** All other uses — internal tooling, building applications, running migrations in your own products — are explicitly permitted during the restriction period.

The Apache Software Foundation flagged FSL as incompatible with Apache 2.0 in ASF LEGAL-721. This incompatibility applies to FSL-licensed code being bundled into ASF projects, not to applications that depend on Liquibase as a runtime tool.

### Decision: KEEP Liquibase

**Status**: Historical record — the Java demo apps using Liquibase were extracted to [ose-primer](https://github.com/wahidyankf/ose-primer) on 2026-04-18. This analysis applies to any future Java apps that use Liquibase in this repo.

**Rationale:**

The FSL non-compete clause prohibits building a "Competing Use" — specifically, a product or service whose primary purpose is to provide database schema migration capabilities commercially in competition with Liquibase. Open Sharia Enterprise is an enterprise platform for Sharia-compliant business systems. It uses Liquibase as an internal migration tool to manage the platform's own database schema. This is explicitly permitted under FSL-1.1-ALv2.

The ASF LEGAL-721 incompatibility affects projects that distribute FSL-licensed code as part of an Apache-licensed distribution. It does not restrict an application from having Liquibase as a build or runtime dependency.

**Version tracking:**

| Liquibase Version | License Change Date | Apache 2.0 Conversion |
| ----------------- | ------------------- | --------------------- |
| 5.0.0             | September 2025      | September 2027        |

**Action required:** Review each major Liquibase upgrade. If Liquibase introduces new restrictions in future versions, re-evaluate before upgrading.

**References:**

- [Functional Source License (FSL)](https://fsl.software/)
- [Liquibase license announcement](https://www.liquibase.com/blog/liquibase-license-update)
- [ASF LEGAL-721 (FSL incompatibility)](https://issues.apache.org/jira/browse/LEGAL-721)

---

## Hibernate ORM: LGPL-2.1

### Background

Hibernate ORM is licensed under the [GNU Lesser General Public License 2.1](https://www.gnu.org/licenses/lgpl-2.1.html) (LGPL-2.1). LGPL-2.1 permits use in proprietary applications under specific conditions:

- The LGPL-licensed library must be dynamically linked (not statically compiled into the application binary).
- The end user must be able to replace the library with a modified version. For Java applications, this is satisfied by shipping a standard JVM with a replaceable jar on the classpath.
- Modifications to the LGPL library itself must be released under LGPL.

### Usage in This Project

Hibernate ORM is used through the Java Persistence API (JPA) Service Provider Interface (SPI). The application code depends on JPA annotations and interfaces (`jakarta.persistence.*`); Hibernate is the runtime provider resolved at application startup through standard Java service-loader mechanisms.

This constitutes **dynamic linking through a standard interface**. The application does not:

- Statically compile Hibernate bytecode into application classes
- Modify Hibernate source code
- Distribute Hibernate as part of a standalone library

### Decision: COMPLIANT — No Action Required

**Status**: Compliant with LGPL-2.1 terms as used in Spring Boot applications. Historical record — the Java demo apps were extracted to [ose-primer](https://github.com/wahidyankf/ose-primer) on 2026-04-18. This analysis applies to any future Java/Spring Boot apps in this repo.

**Rationale:**

Dynamic linking through the JPA SPI satisfies the LGPL-2.1 requirements. Spring Boot's embedded deployment model ships Hibernate as a replaceable jar in `BOOT-INF/lib/`, which means end users can substitute the Hibernate jar with a compatible version. No source code from Hibernate is copied or statically linked into application classes.

**References:**

- [Hibernate ORM license](https://hibernate.org/community/license/)
- [GNU LGPL-2.1 text](https://www.gnu.org/licenses/lgpl-2.1.html)

---

## sharp-libvips: LGPL-3.0

### Background

[sharp](https://sharp.pixelplumbing.com/) is a high-performance image processing library for Node.js. It depends on [libvips](https://libvips.github.io/libvips/), which is licensed under the [GNU Lesser General Public License 3.0](https://www.gnu.org/licenses/lgpl-3.0.html) (LGPL-3.0).

LGPL-3.0 has similar requirements to LGPL-2.1 with one additional condition: users must be able to run the application with a modified version of the LGPL library. For native dynamic libraries (`.so`, `.dylib`, `.dll`), this means the library must not be statically linked into a binary that cannot be relaunched with a replacement library.

### Usage in This Project

sharp is used in Node.js applications (primarily `ayokoding-web`) for server-side image optimisation. sharp loads libvips as a **native dynamic addon** via Node.js's N-API interface. The libvips binary is distributed as a platform-specific prebuilt package (`@img/sharp-linux-x64` etc.) and loaded at runtime with `require()`.

This constitutes **dynamic linking** through the native addon interface. The application:

- Does not statically link libvips bytecode into application code
- Does not modify libvips source code
- Loads libvips as a runtime-replaceable shared library

### Decision: COMPLIANT — No Action Required

**Status**: Compliant with LGPL-3.0 terms as used in Node.js applications.

**Rationale:**

Loading libvips as a native dynamic addon through Node.js N-API satisfies the LGPL-3.0 requirement for dynamic linking. Users can replace the libvips shared library by substituting the prebuilt package with a compatible version. No libvips source code is embedded in application code.

**References:**

- [sharp license information](https://sharp.pixelplumbing.com/install#licensing)
- [libvips license](https://libvips.github.io/libvips/)
- [GNU LGPL-3.0 text](https://www.gnu.org/licenses/lgpl-3.0.html)

---

## Logback: EPL-1.0 / LGPL-2.1 Dual License

### Background

[Logback](https://logback.qos.ch/) is the default logging framework for Spring Boot applications. Logback is distributed under a **dual license**: either the [Eclipse Public License 1.0](https://www.eclipse.org/legal/epl-v10.html) (EPL-1.0) or the [GNU Lesser General Public License 2.1](https://www.gnu.org/licenses/lgpl-2.1.html) (LGPL-2.1). Recipients choose which license to use.

EPL-1.0 characteristics:

- Copyleft applies only to the EPL-licensed file itself, not to the larger application
- Compatible with inclusion in proprietary applications
- Modifications to EPL-covered files must be released under EPL-1.0
- Commonly used in Eclipse Foundation projects

LGPL-2.1 characteristics (see Hibernate entry above for full analysis):

- Copyleft applies to modifications of the library itself
- Dynamic linking is explicitly permitted

### Decision: ELECT EPL-1.0

**Status**: This project elects EPL-1.0 for Logback use. Historical record — the Java demo apps were extracted to [ose-primer](https://github.com/wahidyankf/ose-primer) on 2026-04-18. This analysis applies to any future Java/Spring Boot apps in this repo.

**Rationale:**

Both licenses permit use of Logback in proprietary enterprise applications through dynamic linking. EPL-1.0 is elected because:

- EPL-1.0 is the more common choice for commercial Spring Boot applications
- EPL-1.0 file-level copyleft is narrower in scope than LGPL-2.1 library-level copyleft
- Logback is used as an unmodified runtime dependency; neither EPL-1.0 nor LGPL-2.1 imposes obligations on the application code

No modifications are made to Logback source code, so no source disclosure obligation is triggered under either license.

**References:**

- [Logback license page](https://logback.qos.ch/license.html)
- [Eclipse Public License 1.0](https://www.eclipse.org/legal/epl-v10.html)
- [GNU LGPL-2.1 text](https://www.gnu.org/licenses/lgpl-2.1.html)

---

## Quarterly Audit Schedule

License compliance is an ongoing responsibility. Dependencies change their licenses (as Liquibase did in version 5.0), and new dependencies are added over time.

### Audit Frequency

Perform a license compliance audit **once per quarter**. Schedule audits to align with quarter boundaries (January, April, July, October).

### Audit Scope

Each quarterly audit must:

1. **Check major dependency upgrades** for license changes. Pay particular attention to:
   - Migration tools (Liquibase, Flyway, Alembic, goose, SQLx, DbUp, EF Core, Migratus, Drizzle)
   - ORM and persistence libraries (Hibernate, SQLAlchemy, GORM, Dapper)
   - Logging frameworks (Logback, Log4j2, SLF4J)
   - Image processing libraries (sharp, libvips)

2. **Review new dependencies** added since the last audit. Identify any that use non-permissive licenses (LGPL, EPL, FSL, BUSL, SSPL, AGPL) and document a compliance decision.

3. **Update this document** when a license change is detected or a new compliance decision is made. Include the detection date and affected version range.

4. **Track FSL time-delayed conversions.** Liquibase 5.0 converts to Apache 2.0 in September 2027. Update the Liquibase entry when conversion occurs and remove the non-compete restriction note.

### Audit Output

After each audit, record the outcome as a brief note in the relevant dependency entry (or add a new entry). If no changes are found, add a dated "No changes found" note to this section.

| Quarter | Audit Date | Outcome          | Auditor |
| ------- | ---------- | ---------------- | ------- |
| Q1 2026 | 2026-03-26 | Initial document | —       |

---

## Related Documentation

- [Database Audit Trail Pattern](../../../../governance/development/pattern/database-audit-trail.md) - Migration tool selection and audit column requirements per language ecosystem
- [Software Engineering Index](../README.md) - All software engineering documentation
- [Licensing Index](./README.md) - Index of all licensing documents
