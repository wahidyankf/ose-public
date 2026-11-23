module CraneCore.Tests.Unit.Tests.PdfToMarkdownRoutingFeatureRunner

open System
open System.IO
open System.Reflection
open TickSpec
open Xunit
open CraneCore.Tests.Unit.Tests.PdfToMarkdownRoutingSteps

let private assembly = Assembly.GetExecutingAssembly()

let private getFeatureResource (namePart: string) =
    assembly.GetManifestResourceNames()
    |> Array.tryFind (fun name ->
        name.Contains(namePart, StringComparison.Ordinal)
        && name.EndsWith(".feature", StringComparison.Ordinal))

type private ConvertScenarioServiceProvider() =
    interface IServiceProvider with
        member _.GetService(serviceType: Type) =
            if serviceType = typeof<ConvertState> then
                emptyState :> obj
            else
                null

let private buildScenarioData (namePart: string) : seq<obj[]> =
    match getFeatureResource namePart with
    | Some resourceName ->
        let defs = StepDefinitions(assembly)
        defs.ServiceProviderFactory <- fun () -> ConvertScenarioServiceProvider() :> IServiceProvider
        use stream = assembly.GetManifestResourceStream(resourceName)

        if isNull stream then
            failwithf "embedded Gherkin resource cannot be opened: %s" resourceName

        use reader = new StreamReader(stream)

        let lines =
            reader.ReadToEnd().Replace("\r\n", "\n", StringComparison.Ordinal).Split('\n')

        let feature = defs.GenerateFeature(resourceName, lines)
        feature.Scenarios |> Seq.map (fun scenario -> [| scenario :> obj |])
    | None -> failwithf "embedded Gherkin resource not found: %s" namePart

// @scenario specs/libs/fsharp-crane-core/behaviours/convert/pdf-to-markdown-routing.feature: A PDF with a real text layer converts to its extracted page text
// @scenario specs/libs/fsharp-crane-core/behaviours/convert/pdf-to-markdown-routing.feature: A PDF with no usable text layer converts to its OCR text
type ConvertFeatureTests() =
    static member Scenarios() : seq<obj[]> =
        buildScenarioData "pdf-to-markdown-routing" |> Seq.toList :> seq<_>

    [<Theory>]
    [<MemberData("Scenarios")>]
    member _.``PDF to Markdown Routing``(scenario: Scenario) = scenario.Action.Invoke()
