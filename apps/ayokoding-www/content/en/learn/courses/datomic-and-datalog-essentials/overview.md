---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

A row-mutating database answers what is true now and forgets everything else the moment an update lands. Regulators, support desks, and month-end reports keep asking about then, so teams bolt on audit tables, frozen exports, and reconciliation spreadsheets that drift from the truth they shadow. This course teaches the model that removes the bolt-ons: facts as immutable datoms, time as a queryable axis, and questions as declarative Datalog.

## Why this exists -- the big idea

**The problem before the solution**: `nosql-databases` and `graph-databases` teach document, key-value, column, and graph models, but nobody teaches the immutable-fact, time-aware, Datalog-query model, and no course touches Datalog at all. **Keep this if you forget everything else**: nothing is ever deleted, and a retraction is itself a new fact.

## What you will be able to

After this course you can model data as immutable datoms of entity, attribute, value, and transaction instead of mutable rows; write Datalog queries that join and filter over a fact database declaratively; query the database as of a past point in time without special-casing history in the schema; explain the trade-offs of an immutable, append-only fact log against a row-mutating database; and build a minimal, deterministic reference engine that stores datoms and answers simple Datalog queries.

## How this course is organized

[Learning](/en/learn/courses/datomic-and-datalog-essentials/learning/overview) holds 48 worked examples in nine themes: [Theme A](/en/learn/courses/datomic-and-datalog-essentials/learning/theme-a-datoms-and-entities) (Examples 1-5) stores facts as datoms, [Theme B](/en/learn/courses/datomic-and-datalog-essentials/learning/theme-b-schema-and-attributes) (Examples 6-10) declares typed slots, [Theme C](/en/learn/courses/datomic-and-datalog-essentials/learning/theme-c-transactions-and-retraction) (Examples 11-15) batches and retracts, [Theme D](/en/learn/courses/datomic-and-datalog-essentials/learning/theme-d-basic-datalog-queries) (Examples 16-21) queries declaratively, [Theme E](/en/learn/courses/datomic-and-datalog-essentials/learning/theme-e-unification-and-rules) (Examples 22-27) unifies and names rules, [Theme F](/en/learn/courses/datomic-and-datalog-essentials/learning/theme-f-as-of-and-history-queries) (Examples 28-33) reads the past, [Theme G](/en/learn/courses/datomic-and-datalog-essentials/learning/theme-g-indexes) (Examples 34-38) sorts for speed, [Theme H](/en/learn/courses/datomic-and-datalog-essentials/learning/theme-h-cardinality-and-references) (Examples 39-43) models sets and links, and [Theme I](/en/learn/courses/datomic-and-datalog-essentials/learning/theme-i-trade-offs-and-when-to-use-this-model) (Examples 44-48) prices the trade-offs. The [capstone](/en/learn/courses/datomic-and-datalog-essentials/learning/capstone/overview) builds a reference engine over an order-and-shipment domain, and [drilling](/en/learn/courses/datomic-and-datalog-essentials/drilling/overview) turns the sixteen concepts into recall, problems, katas, and checklists.

## Prerequisites

Prior courses: just-enough-python, because every example runs on Python 3.14's standard library, and sql-essentials for the query-concept bridge from joins to Datalog patterns. Assumed knowledge: basic set theory and SQL joins.

## About the examples

Every runnable example builds and queries a small in-process reference engine with Python 3.14's standard library only: no licensed Datomic server is required or run, and the engine's behaviour is claimed only to model the concepts, not to replicate every real Datomic feature. No network call happens, no clock is read, and every number belongs to the fictional Kencana Parts Co. The silent partner in every file is determinism, so two runs print byte-identical output.

## References

- Datomic Team, Datomic documentation: database values, transactions, queries, and Datalog (concepts of datoms, as-of and since filters, and rules as reused in this course; this course teaches a reference model and states explicitly that it does not require or run the licensed Datomic server). Accessed 2026-10-21.
- Abiteboul, Hull, and Vianney: Foundations of Databases (Datalog semantics: unification, recursion, and negation over facts, which this course follows). Accessed 2026-10-21.
- Prerequisite vocabulary this course assumes: [just-enough-python](/en/learn/courses/just-enough-python/learning/overview) for every runnable example and [sql-essentials](/en/learn/courses/sql-essentials/learning/overview) for the query-concept bridge - accessed 2026-10-21; Python mechanics and join intuition come from those courses, not from the legacy pages below.
- Legacy material this course migrates and re-verifies: software-engineering data databases datomic legacy pages - accessed 2026-10-21; every fact mined from those pages was re-checked against the sources above on the same date rather than copied as already correct.
