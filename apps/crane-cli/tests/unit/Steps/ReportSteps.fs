module CraneCli.Tests.Unit.Steps.ReportSteps

open System
open TickSpec
open Xunit
open CraneCore.Logic.ReportManager
open CraneCli.Tests.Unit.Steps.BddState
open CraneCli.Tests.Unit.Steps.InMemoryBoundaries

// ---- BDD shared state ----
let mutable private lastReportPath: string = ""
let mutable private currentScope: string = "pdf-to-md"

// ---- BDD Given steps ----

[<Given>]
let ``no existing chain file for scope "([^"]*)"`` (scope: string) =
    currentScope <- scope
    reset ()

[<Given>]
let ``a chain file for "([^"]*)" created (\d+) seconds ago with UUID "([^"]*)"``
    (scope: string)
    (seconds: int)
    (uuid: string)
    =
    currentScope <- scope
    reset ()
    let chainFile = $"local-tmp/.execution-chain-{scope}"
    let ts = fixedUtcNow.ToUnixTimeSeconds() - int64 seconds
    writeAllText chainFile $"{ts} {uuid}"

// ---- BDD When steps ----

[<When>]
let ``I run "crane report init" with scope "([^"]*)"`` (scope: string) =
    currentScope <- scope

    RunWithWriter(fun w ->
        let code =
            match initReportWith reportDependencies scope "test.pdf" "test.md" with
            | Ok path ->
                lastReportPath <- path
                let opts = System.Text.Json.JsonSerializerOptions()
                opts.DefaultIgnoreCondition <- System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
                w.WriteLine(System.Text.Json.JsonSerializer.Serialize({| path = path |}, opts))
                0
            | Error msg ->
                eprintfn "Error: %s" msg
                1

        code)

// ---- BDD Then steps ----

[<Then>]
let ``a report file is created in "([^"]*)"`` (dir: string) =
    Assert.True(exists lastReportPath, $"Report file should exist: {lastReportPath}")
    Assert.True(lastReportPath.StartsWith(dir, StringComparison.Ordinal), $"Path should start with {dir}")

[<Then>]
let ``the filename matches the pattern "([^"]*)"`` (_pattern: string) =
    let filename = lastReportPath.Split('/') |> Array.last

    Assert.True(
        filename.EndsWith("__audit.md", StringComparison.Ordinal),
        $"Filename should end with __audit.md: {filename}"
    )

    Assert.True(
        filename.StartsWith(currentScope + "__", StringComparison.Ordinal),
        $"Filename should start with scope: {filename}"
    )

    let parts = filename.Replace("__audit.md", "").Split("__")
    Assert.True(parts.Length >= 3, $"Filename should have at least 3 parts: {filename}")
    let chain = parts.[1]
    Assert.Matches(@"^[0-9a-f]{6}$", chain)

[<Then>]
let ``the JSON output contains the report path`` () =
    let doc = System.Text.Json.JsonDocument.Parse(LastOutput)
    let path = doc.RootElement.GetProperty("path").GetString()
    Assert.NotEmpty(path)

[<Then>]
let ``the report filename contains "([^"]*)" followed by a new 6-hex UUID`` (prefix: string) =
    let filename = lastReportPath.Split('/') |> Array.last
    Assert.True(filename.Contains(prefix, StringComparison.Ordinal), $"Filename should contain '{prefix}': {filename}")

[<Then>]
let ``the report filename contains only the new 6-hex UUID .no "([^"]*)".`` (uuid: string) =
    let filename = lastReportPath.Split('/') |> Array.last
    Assert.DoesNotContain(uuid, filename)

// ---- BDD finalize steps (CRN-018) ----

let mutable private finalizedPath: string = ""

[<Given>]
let ``an audit report in progress for scope "([^"]*)"`` (scope: string) =
    reset ()
    finalizedPath <- $"local-tmp/pdf-to-md/{scope}__abc123__2026-09-05--12-30__audit.md"
    writeAllText finalizedPath $"# Audit Report\n\nScope: {scope}\nStatus: IN_PROGRESS\n"

[<When>]
let ``I run "crane report finalize" with status "([^"]*)"`` (status: string) =
    RunWithWriter(fun w ->
        match finalizeReportWith reportDependencies finalizedPath status with
        | Ok() ->
            let opts = System.Text.Json.JsonSerializerOptions()
            opts.DefaultIgnoreCondition <- System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull

            w.WriteLine(
                System.Text.Json.JsonSerializer.Serialize(
                    {| status = status
                       path = finalizedPath |},
                    opts
                )
            )

            0
        | Error msg ->
            eprintfn "Error: %s" msg
            1)

[<Then>]
let ``the report file says "([^"]*)"`` (text: string) =
    Assert.Contains(text, readAllText finalizedPath)

[<Then>]
let ``the JSON output names the status "([^"]*)" and the report path`` (status: string) =
    let doc = System.Text.Json.JsonDocument.Parse(LastOutput)
    Assert.Equal(status, doc.RootElement.GetProperty("status").GetString())
    Assert.NotEmpty(doc.RootElement.GetProperty("path").GetString())
