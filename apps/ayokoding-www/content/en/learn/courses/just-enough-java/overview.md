---
title: "Overview"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 1
---

Want a compact modern-Java on-ramp before the enterprise JVM course? This primer teaches the bounded
surface needed to read and make small Java changes: syntax, objects, records and sealed types,
generics, collections, streams, testing, and a JVM-memory orientation.

## Prerequisites

This course requires [Object-Oriented Programming Essentials](../object-oriented-programming-essentials/learning/overview.md).
It assumes static-type literacy and a terminal. Install a **Java 25 JDK** and Maven. Most
examples compile at the Java 21 language level; example 80 uses a feature finalized in Java 25.
The five Maven example projects and the capstone pin their plugins.

## Scope boundary

This is just enough modern Java to become productive on the JVM, not exhaustive Java or enterprise
framework training. It stops before Spring, dependency injection frameworks, ORM design, advanced
concurrency, reflection, performance tuning, and application-server operations. Continue with the
Enterprise Java and the JVM course for that depth once its companion bundle is available.

## Run modes

Use a build tool for projects and tests. For a disposable one-off, Java's single-file launch mode
runs `java Hello.java`; it does not require a separately produced class file. Compact source files
and instance main methods were finalized in Java 25, so example 80 requires that JDK.

## Sources

- [Java Language Specification, Java SE 21](https://docs.oracle.com/javase/specs/jls/se21/jls21.pdf)
  is the normative language reference for the stable core taught here.
- [JEP 330](https://openjdk.org/jeps/330) specifies single-file source-code launch.
- [JEP 441](https://openjdk.org/jeps/441) specifies Java 21 pattern switches, including guarded cases.
- [JEP 512](https://openjdk.org/jeps/512) specifies Java 25 compact source files and instance main methods.
- [JUnit User Guide](https://docs.junit.org/6.0.2/overview) documents JUnit Jupiter testing APIs.
- [Oracle Java support roadmap](https://www.oracle.com/java/technologies/java-se-support-roadmap.html) lists Java 25 as an LTS release.

All code is original instructional material. Version-sensitive claims stay limited to cited source
features; use the installed JDK's release notes before adopting newer syntax in production.
