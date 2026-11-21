module CraneCli.Tests.Unit.Steps.VersionSteps

open System
open System.IO
open TickSpec
open Xunit
open CraneCore.Ports
open CraneCore.Adapters.Out.PdfAdapter
open CraneCli.Adapters.In.CliAdapter
open CraneCli.Tests.Unit.Steps.BddState

[<When>]
let ``I run "crane --version"`` () =
    use writer = new StringWriter()
    let original = Console.Out
    Console.SetOut writer

    try
        LastExitCode <- run (FakePdfAdapter("", 1, 0L) :> IPdfPort) [| "--version" |]
    finally
        Console.SetOut original

    LastOutput <- writer.ToString().Trim()

[<Then>]
let ``the version string matches a SemVer-shaped pattern`` () =
    Assert.Matches(@"^\d+\.\d+\.\d+(\.\d+)?$", LastOutput)
