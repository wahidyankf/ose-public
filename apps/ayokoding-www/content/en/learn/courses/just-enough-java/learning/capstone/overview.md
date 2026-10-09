---
title: "Capstone: Task Board Report"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 1
---

Build and test a deliberately small task-board report. The project proves the primer surface:
a record models immutable task data, a sealed state hierarchy is rendered by exhaustive switch,
a generic list owns tasks, a stream creates the open-task report, and JUnit verifies the result.

## Run

    cd code
    mvn test
    mvn -q exec:java -Dexec.mainClass=org.ayokoding.java.TaskBoard

The Maven project declares Java 21 because its sealed-switch syntax is final there. JUnit is only a
test dependency; no application framework is introduced.

## Try an extension

Before running the application, predict which name its current fixture prints. Then add an `Open`
task named `plan review` to the fixture in `TaskBoard.main`. Update
`TaskBoardTest.reportsOnlySortedOpenTasks` with the same new task and assert the three expected names
in alphabetical order. Run `mvn test` and the application again; explain why the `Done` task is absent
from both reports.

## Acceptance checks

- Task value equality works through its record components.
- The sealed state hierarchy has no default switch branch.
- Open task names are filtered and sorted through a stream pipeline.
- The JUnit test suite checks sorted open names, every sealed state, blank names through parameterized inputs, and a missing state.
- `mvn test` passes under Java 25 (the project compiles the Java 21 language level).

## Why this stays small

Spring, persistence, dependency injection, and server wiring would conceal the language choices the
course is meant to make visible. This capstone proves readiness for those next layers without
claiming to teach them.
