---
title: "SWE Language Dev"
description: "Language-specific development agents plus UI and code-quality checkers and fixers."
---

# SWE Language Dev

- [Swe Code Checker](./swe-code-checker.md) — Validates that application and library projects conform to platform coding standards, Nx target conventions, and language-specific best practices. Outputs to local-tmp/swe-code/ with progressive streaming.
- [Swe Csharp Dev](./swe-csharp-dev.md) — Develops C# applications following nullable reference type principles, async/await patterns, and platform coding standards. Use when implementing C# code for OSE Platform.
- [Swe E2e Dev](./swe-e2e-dev.md) — Develops end-to-end tests using Playwright following OSE Platform testing patterns and standards. Use when implementing E2E tests for OSE Platform applications.
- [Swe Java Dev](./swe-java-dev.md) — Develops Java applications with Spring Boot following platform coding standards, the Cucumber Unit adapter, and enforced coverage. Use when implementing Java code for the OSE Platform LMS backend.
- [Swe Rust Dev](./swe-rust-dev.md) — Develops Rust applications following ownership principles, zero-cost abstraction patterns, and platform coding standards. Use when implementing Rust code for OSE Platform.
- [Swe Typescript Dev](./swe-typescript-dev.md) — Develops TypeScript applications following type safety principles, modern patterns, and platform coding standards. Use when implementing TypeScript code for OSE Platform.
- [Swe Ui Checker](./swe-ui-checker.md) — Validates UI component quality including token compliance, accessibility, responsive design, component patterns, and dark mode. Use when auditing frontend components.
- [Swe Ui Fixer](./swe-ui-fixer.md) — Applies validated fixes from swe-ui-checker audit reports. Re-validates findings before applying changes. Use after reviewing swe-ui-checker output.
- [Swe Ui Maker](./swe-ui-maker.md) — Creates UI components following all conventions — CVA variants, Radix composition, accessibility, responsive design, unit tests, and Storybook stories. Use when creating new shared components.
