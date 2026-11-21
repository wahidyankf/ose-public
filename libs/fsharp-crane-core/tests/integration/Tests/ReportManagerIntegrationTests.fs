module CraneCore.Tests.Integration.Tests.ReportManagerIntegrationTests

open System.IO
open Xunit
open CraneCore.Logic.ReportManager

[<Fact>]
// @scenario specs/libs/fsharp-crane-core/behaviours/reports/reports.feature: Report stamps use UTC+7
let ``utc7Timestamp returns a timestamp string`` () =
    let result = utc7Timestamp ()
    Assert.Matches(@"^\d{4}-\d{2}-\d{2}--\d{2}-\d{2}$", result)

[<Fact>]
let ``initReport creates a report file in the local-tmp pdf-to-md family directory`` () =
    let scope = sprintf "test-scope-%s" (System.Guid.NewGuid().ToString("N").[..5])

    match initReport scope "test.pdf" "test.md" with
    | Ok path ->
        Assert.True(path.StartsWith("local-tmp/pdf-to-md/"))
        Assert.True(File.Exists(path))
        // cleanup
        File.Delete(path)
        let chainFile = sprintf "local-tmp/.execution-chain-%s" scope

        if File.Exists(chainFile) then
            File.Delete(chainFile)
    | Error msg -> Assert.Fail(sprintf "initReport failed: %s" msg)

[<Fact>]
let ``finalizeReport returns Error for non-existent report`` () =
    match finalizeReport "nonexistent-report.md" "DONE" with
    | Error _ -> ()
    | Ok() -> Assert.Fail("expected error for non-existent report")

[<Fact>]
let ``finalizeReport updates status in existing report`` () =
    let scope = sprintf "finalize-test-%s" (System.Guid.NewGuid().ToString("N").[..5])

    match initReport scope "test.pdf" "test.md" with
    | Ok path ->
        match finalizeReport path "DONE" with
        | Ok() ->
            let content = File.ReadAllText(path)
            Assert.Contains("Status: DONE", content)
            File.Delete(path)
        | Error msg -> Assert.Fail(sprintf "finalizeReport failed: %s" msg)

        let chainFile = sprintf "local-tmp/.execution-chain-%s" scope

        if File.Exists(chainFile) then
            File.Delete(chainFile)
    | Error msg -> Assert.Fail(sprintf "initReport failed: %s" msg)

[<Fact>]
let ``getOrExtendChain returns same chain within window`` () =
    let scope = sprintf "chain-test-%s" (System.Guid.NewGuid().ToString("N").[..5])
    let chainFile = sprintf "local-tmp/.execution-chain-%s" scope

    try
        let chain1 = getOrExtendChain scope
        let chain2 = getOrExtendChain scope
        // Second call should extend the chain (contain first id)
        Assert.True(chain2.Contains("__"), "Chain should be extended with __")
        Assert.True(chain2.StartsWith(chain1.Split("__").[0]))
    finally
        if File.Exists(chainFile) then
            File.Delete(chainFile)

[<Fact>]
let ``getOrExtendChain starts fresh chain when chain file has invalid format`` () =
    let scope = sprintf "chain-invalid-%s" (System.Guid.NewGuid().ToString("N").[..5])
    let chainFile = sprintf "local-tmp/.execution-chain-%s" scope

    try
        Directory.CreateDirectory("local-tmp") |> ignore
        // Write a chain file with invalid format (no space separator)
        File.WriteAllText(chainFile, "invalidformat")
        let chain = getOrExtendChain scope
        // Should not contain __ since chain starts fresh
        Assert.False(chain.Contains("__"), "Fresh chain should not contain __")
    finally
        if File.Exists(chainFile) then
            File.Delete(chainFile)

[<Fact>]
let ``getOrExtendChain starts fresh chain when chain file timestamp is too old`` () =
    let scope = sprintf "chain-expired-%s" (System.Guid.NewGuid().ToString("N").[..5])
    let chainFile = sprintf "local-tmp/.execution-chain-%s" scope

    try
        Directory.CreateDirectory("local-tmp") |> ignore
        // Write a chain file with expired timestamp (0 = epoch)
        File.WriteAllText(chainFile, "0 oldchain123")
        let chain = getOrExtendChain scope
        // Old chain should be discarded, new chain starts fresh
        Assert.False(chain.Contains("__"), "Expired chain should not be extended")
    finally
        if File.Exists(chainFile) then
            File.Delete(chainFile)

[<Fact>]
// @scenario specs/libs/fsharp-crane-core/behaviours/reports/reports.feature: A report that cannot be written or finalized returns an Error
let ``initReport surfaces an exception instead of crashing when the report path cannot be written`` () =
    // A scope containing path separators drives the report path into nested
    // directories that local-tmp/pdf-to-md/ alone never creates, so
    // File.WriteAllText throws and initReport's own `with ex ->` handler is
    // what turns that into a Result, rather than an unhandled exception.
    let scope = "nonexistent-subdir/deeply/nested"

    match initReport scope "pdf.pdf" "md.md" with
    | Error message -> Assert.Contains("Failed to init report", message)
    | Ok path -> Assert.Fail(sprintf "expected a write failure, got Ok %s" path)

[<Fact>]
let ``finalizeReport surfaces an exception instead of crashing when the report cannot be rewritten`` () =
    let path =
        System.IO.Path.Combine(
            System.IO.Path.GetTempPath(),
            sprintf "crane-report-readonly-%s.md" (System.Guid.NewGuid().ToString("N").[..7])
        )

    System.IO.File.WriteAllText(path, "Status: IN_PROGRESS\n")
    System.IO.File.SetAttributes(path, System.IO.FileAttributes.ReadOnly)

    try
        match finalizeReport path "DONE" with
        | Error message -> Assert.Contains("Failed to finalize report", message)
        | Ok() -> Assert.Fail("expected a write failure against a read-only report")
    finally
        System.IO.File.SetAttributes(path, System.IO.FileAttributes.Normal)
        System.IO.File.Delete(path)
