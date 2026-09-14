/// Direct real-filesystem proof for the plan validator's disk adapter: the walk
/// that lists `plans/` and skips links at every depth, and the strict read that
/// tells a missing document apart from every other failure.
module RhinoCli.Tests.Integration.Steps.PlanStructureResourceTests

open System
open System.IO
open Xunit
open RhinoCli.Application.Plan

let private withTemporaryRoot (test: string -> unit) =
    let root =
        Path.Combine(Path.GetTempPath(), "rhino-plan-adapter-" + Guid.NewGuid().ToString("N"))

    Directory.CreateDirectory root |> ignore

    try
        test root
    finally
        Directory.Delete(root, true)

let private write (root: string) (path: string) (bytes: byte[]) =
    let full = Path.Combine(root, path)
    Directory.CreateDirectory(Path.GetDirectoryName(full: string)) |> ignore
    File.WriteAllBytes(full, bytes)

[<Fact>]
let ``listPlanFiles returns nothing when the repository has no plans directory`` () =
    withTemporaryRoot (fun root ->
        write root "docs/README.md" "# Docs\n"B
        Assert.Empty(listPlanFiles root))

[<Fact>]
let ``listPlanFiles lists every file under plans with forward slashes and skips links`` () =
    withTemporaryRoot (fun root ->
        write root "plans/backlog/real-plan/README.md" "# Plan\n"B
        write root "plans/backlog/real-plan/tech-docs/001-one.md" "# One\n"B
        write root "outside/ignored.md" "# Outside\n"B

        File.CreateSymbolicLink(Path.Combine(root, "plans", "backlog", "real-plan", "linked.md"), "README.md")
        |> ignore

        Directory.CreateSymbolicLink(Path.Combine(root, "plans", "backlog", "linked-plan"), "real-plan")
        |> ignore

        Assert.Equal<string list>(
            [ "plans/backlog/real-plan/README.md"
              "plans/backlog/real-plan/tech-docs/001-one.md" ],
            listPlanFiles root |> List.sort
        ))

[<Fact>]
let ``listPlanFiles returns nothing when plans itself is a link`` () =
    withTemporaryRoot (fun root ->
        write root "elsewhere/backlog/a-plan/README.md" "# Plan\n"B
        Directory.CreateSymbolicLink(Path.Combine(root, "plans"), "elsewhere") |> ignore
        Assert.Empty(listPlanFiles root))

[<Fact>]
let ``readPlanDocument tells text, absence, non-text and a directory apart`` () =
    withTemporaryRoot (fun root ->
        write root "plans/backlog/a-plan/brd.md" "# BRD\n"B
        write root "plans/backlog/a-plan/delivery.md" [| 0x23uy; 0xFFuy; 0xFEuy; 0x0Auy |]

        Directory.CreateDirectory(Path.Combine(root, "plans", "backlog", "a-plan", "prd.md"))
        |> ignore

        Assert.Equal<PlanRead>(Found "# BRD\n", readPlanDocument root "plans/backlog/a-plan/brd.md")
        Assert.Equal<PlanRead>(Missing, readPlanDocument root "plans/backlog/a-plan/learnings.md")
        Assert.Equal<PlanRead>(Missing, readPlanDocument root "plans/backlog/absent-plan/learnings.md")
        Assert.Equal<PlanRead>(NotText, readPlanDocument root "plans/backlog/a-plan/delivery.md")

        Assert.Equal<PlanRead>(
            Unreadable "Is a directory (os error 21)",
            readPlanDocument root "plans/backlog/a-plan/prd.md"
        ))

[<Fact>]
let ``readPlanDocument reports a document it may not open as unreadable`` () =
    if not (OperatingSystem.IsWindows()) then
        withTemporaryRoot (fun root ->
            write root "plans/backlog/a-plan/brd.md" "# BRD\n"B
            let full = Path.Combine(root, "plans", "backlog", "a-plan", "brd.md")
            File.SetUnixFileMode(full, UnixFileMode.None)

            try
                match readPlanDocument root "plans/backlog/a-plan/brd.md" with
                // A superuser reads through the mode bits, so there is no denial to observe.
                | Found _ -> ()
                | read -> Assert.Equal<PlanRead>(Unreadable "Permission denied (os error 13)", read)
            finally
                File.SetUnixFileMode(full, UnixFileMode.UserRead ||| UnixFileMode.UserWrite))
