---
title: "Learning Overview"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 1
---

Use this primer to make small, safe changes to Java code before moving into the Enterprise Java
and JVM course. The progression starts with runnable values and objects, then adds typed models,
collections, streams, and tests. Every lesson embeds the code it explains, with a matching file
in the [source map](./code/README.md).

## Work through the examples

1. [Beginner examples 1–26](./beginner.md): launch a program, use values, define objects, and pick
   basic collections.
2. [Intermediate examples 27–52](./intermediate.md): validate records, handle sealed variants,
   write generic helpers, and start stream transformations.
3. [Advanced examples 53–80](./advanced.md): combine pipelines and result types, test behavior,
   and compare Java's two source-launch modes.
4. [Task board capstone](./capstone/overview.md): consolidate records, sealed states, streams,
   Maven, and JUnit in one short report. Follow it with the [drills](../drilling/overview.md).

Install Java 25 to run every example. Most examples use Java 21 language features; the compact
source file in example 80 uses the finalized Java 25 syntax. Run each command from the `learning/`
directory as shown in its lesson. Examples 1 and 3 are Maven application projects; examples 69–71 and the capstone use Maven
for JUnit tests. Predict the output before running, then make the suggested small change.

## Concepts

1. **co-01 · jdk-build-tool** — Maven compiles, runs, and tests a project in this primer.
2. **co-02 · main-method** — public static void main(String[]) is the classic entry point.
3. **co-03 · primitives** — primitives, wrappers, autoboxing, and String model basic values.
4. **co-04 · classes-objects** — classes define fields, constructors, and methods; new instantiates.
5. **co-05 · interfaces** — interfaces, including default methods, supply polymorphic contracts.
6. **co-06 · inheritance** — extends and Override express subtype behavior.
7. **co-07 · records** — records are concise immutable data carriers with value semantics.
8. **co-08 · sealed-types** — sealed hierarchies constrain permitted variants.
9. **co-09 · enums** — enums model a fixed typed set, optionally with data and methods.
10. **co-10 · instanceof-pattern** — pattern matching binds a tested value to a typed variable.
11. **co-11 · switch-pattern** — pattern switches dispatch over known variants.
12. **co-12 · exhaustive-switch** — a sealed hierarchy can make a switch exhaustive without default.
13. **co-13 · generics** — generic classes and methods preserve compile-time type information.
14. **co-14 · bounded-generics** — bounds and wildcards express safe constraints and variance.
15. **co-15 · collections-list** — lists preserve ordered, indexed values.
16. **co-16 · collections-map** — maps associate unique keys with values.
17. **co-17 · collections-set** — sets model uniqueness.
18. **co-18 · streams-map-filter** — streams compose lazy transformations and selection.
19. **co-19 · streams-collect** — collectors materialize or group a stream result.
20. **co-20 · streams-reduce** — reductions aggregate many values to one.
21. **co-21 · lambdas** — lambdas implement functional interfaces inline.
22. **co-22 · method-references** — method references abbreviate a simple forwarding lambda.
23. **co-23 · optional** — Optional models an intentionally possibly absent value.
24. **co-24 · exceptions** — checked/unchecked exceptions and explicit handling model failure.
25. **co-25 · jvm-memory** — reachability, assignment, identity, and equality are different ideas; avoid treating JVM storage layout as a language guarantee.
26. **co-26 · junit-test** — a JUnit Jupiter test is executed by the build tool.
27. **co-27 · single-file-source-run** — java Hello.java launches one source file directly.
28. **co-28 · compact-source-and-instance-main** — Java 25 compact source and instance main reduce
    ceremonial startup code.

Read the examples in order, then complete the capstone before moving to enterprise JVM material.
