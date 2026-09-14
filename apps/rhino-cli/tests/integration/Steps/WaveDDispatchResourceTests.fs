/// Plain xunit tests for the Wave D routes of `RhinoCli.Cli.Dispatch.route`
/// — `md links|mermaid|frontmatter|frontmatter-dates|audit`,
/// `governance word-budget|readme-index`, and `git lockfile sync`.
///
/// `DispatchUnitTests.fs` pins the router's own argv handling; this file
/// drives each Wave D leaf end-to-end against a throwaway fixture repository
/// so both the passing and the finding-present arm of every leaf runs. On a
/// clean corpus `shadow-diff.sh` only ever exercises the passing arm, which
/// is how two Wave D formatter defects reached `main` (see `learnings.md`,
/// 2026-08-28). Split leaves start a `./rhino` stand-in before their F#
/// remainder; the naming and heading-hierarchy leaves are RHINO's alone.
module RhinoCli.Tests.Integration.Steps.WaveDDispatchResourceTests

open System
open System.IO
open Xunit
open RhinoCli.Cli.Dispatch

let private newTempDir () =
    let dir =
        Path.Combine(Path.GetTempPath(), "rhino-cli-waved-dispatch-" + Guid.NewGuid().ToString("N"))

    Directory.CreateDirectory(dir) |> ignore
    dir

let private writeFile (root: string) (relativePath: string) (content: string) =
    let full = Path.Combine(root, relativePath)
    Directory.CreateDirectory(Path.GetDirectoryName(full)) |> ignore
    File.WriteAllText(full, content)

/// Runs `route`, capturing stdout/stderr around the call and restoring the
/// prior writers afterwards even if `route` throws.
let private runCaptured (getRepoRoot: unit -> Result<string, string>) (argv: string[]) : int * string * string =
    let originalOut = Console.Out
    let originalErr = Console.Error
    use outWriter = new StringWriter()
    use errWriter = new StringWriter()

    try
        Console.SetOut(outWriter)
        Console.SetError(errWriter)
        let exitCode = route getRepoRoot argv
        exitCode, outWriter.ToString(), errWriter.ToString()
    finally
        Console.SetOut(originalOut)
        Console.SetError(originalErr)

let private okRoot (root: string) () = Ok root

/// Delegated and split leaves start `./rhino` at the repository root before
/// any F# remainder; this stand-in runs `body` as that script.
let private stubRhino (root: string) (body: string) =
    writeFile root "rhino" ("#!/bin/sh\n" + body)

    File.SetUnixFileMode(
        Path.Combine(root, "rhino"),
        UnixFileMode.UserRead ||| UnixFileMode.UserWrite ||| UnixFileMode.UserExecute
    )

/// A `./rhino` stand-in that passes every delegated command.
let private passingRhino = "exit 0\n"

/// A `repo-config.yml` whose resolved-tree budget is tight enough that any
/// prose `AGENTS.md` trips the `Fail` band. Per-file surface budgets are
/// RHINO's; the F# remainder checks only the resolved tree.
let private tightWordBudgetConfig =
    "governance-word-budget:\n\
     \x20 surfaces:\n\
     \x20   - glob: \"docs/**/*.md\"\n\
     \x20     target: 3\n\
     \x20     warn: 4\n\
     \x20     fail: 5\n\
     \x20 resolved_tree:\n\
     \x20   root: AGENTS.md\n\
     \x20   target: 3\n\
     \x20   warn: 4\n\
     \x20   fail: 5\n"

// ---------------------------------------------------------------------------
// md links validate
// ---------------------------------------------------------------------------

[<Fact>]
let ``route reports all links valid for a repository with no markdown`` () =
    let root = newTempDir ()
    stubRhino root passingRhino
    let code, out, _ = runCaptured (okRoot root) [| "md"; "links"; "validate" |]
    Assert.Equal(0, code)
    Assert.Contains("All links valid!", out)

[<Fact>]
let ``route reports a broken link and exits 1`` () =
    let root = newTempDir ()
    stubRhino root passingRhino
    writeFile root "docs/a.md" "# A\n\n![gone](./missing.png)\n"

    let code, out, err = runCaptured (okRoot root) [| "md"; "links"; "validate" |]

    Assert.Equal(1, code)
    Assert.Contains("# Broken Links Report", out)
    Assert.Contains("found 1 broken links", err)

// ---------------------------------------------------------------------------
// md mermaid validate
// ---------------------------------------------------------------------------

[<Fact>]
let ``route passes md mermaid validate for a repository with no diagrams`` () =
    let root = newTempDir ()
    let code, _, err = runCaptured (okRoot root) [| "md"; "mermaid"; "validate" |]
    Assert.Equal(0, code)
    Assert.DoesNotContain("violation", err)

[<Fact>]
let ``route accepts every md mermaid validate threshold flag`` () =
    let root = newTempDir ()

    let code, _, _ =
        runCaptured
            (okRoot root)
            [| "md"
               "mermaid"
               "validate"
               "--max-label-len"
               "10"
               "--max-width"
               "3"
               "--max-depth"
               "2"
               "--max-subgraph-nodes"
               "4"
               "--changed-only"
               "-v" |]

    Assert.Equal(0, code)

[<Fact>]
let ``route honours --quiet on md mermaid validate`` () =
    let root = newTempDir ()

    let code, _, _ =
        runCaptured (okRoot root) [| "md"; "mermaid"; "validate"; "--quiet" |]

    Assert.Equal(0, code)

// ---------------------------------------------------------------------------
// md frontmatter validate
// ---------------------------------------------------------------------------

[<Fact>]
let ``route passes md frontmatter validate for an empty repository`` () =
    let root = newTempDir ()
    stubRhino root passingRhino
    let code, out, _ = runCaptured (okRoot root) [| "md"; "frontmatter"; "validate" |]
    Assert.Equal(0, code)
    Assert.Contains("PASSED", out)

// ---------------------------------------------------------------------------
// md frontmatter-dates validate
// ---------------------------------------------------------------------------

[<Fact>]
let ``route passes md frontmatter-dates validate for an empty repository`` () =
    let root = newTempDir ()
    stubRhino root passingRhino

    let code, out, _ =
        runCaptured (okRoot root) [| "md"; "frontmatter-dates"; "validate" |]

    Assert.Equal(0, code)
    Assert.Contains("PASSED", out)

// ---------------------------------------------------------------------------
// md audit
// ---------------------------------------------------------------------------

[<Fact>]
let ``route passes md audit when every member passes`` () =
    let root = newTempDir ()
    stubRhino root passingRhino
    let code, out, _ = runCaptured (okRoot root) [| "md"; "audit" |]
    Assert.Equal(0, code)
    Assert.Contains("MD AUDIT PASSED", out)

[<Fact>]
let ``route fails md audit and names the failing member`` () =
    let root = newTempDir ()
    stubRhino root "exit 1\n"

    let code, _, err = runCaptured (okRoot root) [| "md"; "audit" |]

    Assert.Equal(1, code)
    Assert.Contains("MD AUDIT FAILED", err)
    Assert.Contains("Error: md audit found", err)

[<Fact>]
let ``route honours md audit --skip`` () =
    let root = newTempDir ()
    // Only the skipped naming member would fail.
    stubRhino root "case \"$1 $2\" in\n\"md naming\") exit 1 ;;\nesac\nexit 0\n"

    let code, out, _ =
        runCaptured (okRoot root) [| "md"; "audit"; "--skip"; "validate-naming" |]

    Assert.Equal(0, code)
    Assert.Contains("MD AUDIT PASSED", out)

// ---------------------------------------------------------------------------
// governance word-budget validate
// ---------------------------------------------------------------------------

[<Fact>]
let ``route skips word-budget when repo-config declares no section`` () =
    let root = newTempDir ()
    stubRhino root passingRhino

    let code, out, _ =
        runCaptured (okRoot root) [| "governance"; "word-budget"; "validate" |]

    Assert.Equal(0, code)
    Assert.Contains("WORD BUDGET: SKIPPED", out)

[<Fact>]
let ``route fails word-budget for a resolved tree over its fail band`` () =
    let root = newTempDir ()
    stubRhino root passingRhino
    writeFile root "repo-config.yml" tightWordBudgetConfig
    writeFile root "AGENTS.md" "one two three four five six seven eight nine ten\n"

    let code, out, err =
        runCaptured (okRoot root) [| "governance"; "word-budget"; "validate" |]

    Assert.Equal(1, code)
    Assert.Contains("WORD BUDGET:", out)
    Assert.Contains("progressive disclosure", err)

// ---------------------------------------------------------------------------
// governance readme-index validate / generate
// ---------------------------------------------------------------------------

[<Fact>]
let ``route passes readme-index validate for an empty repository`` () =
    let root = newTempDir ()
    stubRhino root passingRhino

    let code, out, _ =
        runCaptured (okRoot root) [| "governance"; "readme-index"; "validate" |]

    Assert.Equal(0, code)
    Assert.Contains("README INDEX AUDIT PASSED", out)

[<Fact>]
let ``route reports readme-index generate wrote nothing for an empty repository`` () =
    let root = newTempDir ()

    let code, out, _ =
        runCaptured (okRoot root) [| "governance"; "readme-index"; "generate" |]

    Assert.Equal(0, code)
    Assert.Contains("README INDEX GENERATE:", out)

[<Fact>]
let ``route renders readme-index generate as JSON and markdown`` () =
    let root = newTempDir ()

    let _, jsonOut, _ =
        runCaptured (okRoot root) [| "governance"; "readme-index"; "generate"; "-o"; "json" |]

    Assert.Contains("rhino-cli/readme-index-generate/v1", jsonOut)

    let _, mdOut, _ =
        runCaptured (okRoot root) [| "governance"; "readme-index"; "generate"; "-o"; "markdown" |]

    Assert.Contains("## README Index Generate", mdOut)

// ---------------------------------------------------------------------------
// governance readme-index rewrite-paths
// ---------------------------------------------------------------------------

[<Fact>]
let ``route rejects readme-index rewrite-paths without --map`` () =
    let root = newTempDir ()

    let code, _, err =
        runCaptured (okRoot root) [| "governance"; "readme-index"; "rewrite-paths" |]

    Assert.NotEqual(0, code)
    Assert.Contains("--map", err)

[<Fact>]
let ``route reports a missing --map file rather than throwing`` () =
    let root = newTempDir ()

    let code, _, err =
        runCaptured
            (okRoot root)
            [| "governance"
               "readme-index"
               "rewrite-paths"
               "--map"
               Path.Combine(root, "no-such-map.txt") |]

    Assert.NotEqual(0, code)
    Assert.StartsWith("Error: ", err)

// ---------------------------------------------------------------------------
// git lockfile sync
// ---------------------------------------------------------------------------

[<Fact>]
let ``route surfaces a git lockfile sync failure outside a repository`` () =
    let root = newTempDir ()
    let code, _, err = runCaptured (okRoot root) [| "git"; "lockfile"; "sync" |]
    Assert.NotEqual(0, code)
    Assert.StartsWith("Error: ", err)
