---
title: "Catalog Report CLI"
date: 2026-08-03T00:00:00+07:00
draft: false
weight: 1
---

Build a compact catalog report, not a Windows project. The program proves nullable-aware lookup,
records, a LINQ query, an interface seam, and one awaited operation.

## Run and verify

```bash
dotnet run --project code/CatalogReport/CatalogReport.csproj
dotnet test code/CatalogReport.Tests/CatalogReport.Tests.csproj
```

The program prints a sorted report and reports a missing requested ID as `unavailable`. The test
project uses `Microsoft.NET.Test.Sdk`, `xunit`, and `xunit.runner.visualstudio` package references to
verify missing lookup handling, alphabetical report order, and an empty request through `dotnet test`.

## Extend the report

Before running the program, predict the report order and the text shown for the missing ID. Then add
one more missing ID to the request list in `code/CatalogReport/Program.cs`. Add that ID to the
request in `KeepsMissingProductSafe` and expect a second `unavailable` line. The existing order
test should still confirm that found products are alphabetical. Run both commands above again.

You are done when the printed report matches your prediction, has one `unavailable` line for each
missing ID, and all tests pass. Keep the lookup result nullable: the exercise is to handle absence
at the report boundary, not to invent a placeholder product.

## Why this capstone stays small

A desktop UI would add platform APIs before the core language choices are visible. This console
program keeps those choices inspectable: nullable types represent absence, a record models data,
LINQ creates a report, an interface makes the source replaceable, and `await` keeps the asynchronous
boundary honest.
