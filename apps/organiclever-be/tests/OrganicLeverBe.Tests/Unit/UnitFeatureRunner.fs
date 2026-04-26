module OrganicLeverBe.Tests.Unit.UnitFeatureRunner

open System
open System.IO
open System.Reflection
open TickSpec
open Xunit
open OrganicLeverBe.Tests.State
open OrganicLeverBe.Tests.HttpTestFixture

/// Unit-level BDD runner.
///
/// Consumes the same shared Gherkin feature files as the integration runner but
/// marks every scenario with [Trait("Category", "Unit")] so they are picked up by
/// `dotnet test --filter Category=Unit`.
///
/// Uses a TestWebAppFactory to route all requests through the real Giraffe handler
/// pipeline, providing AltCover coverage of actual handler code.
/// Step definitions are shared with the integration runner: all TickSpec
/// [Given]/[When]/[Then] functions in the Integration.Steps.* modules are discovered
/// from the executing assembly.

let private assembly = Assembly.GetExecutingAssembly()

let private specsDir =
    let assemblyDir = Path.GetDirectoryName(assembly.Location)
    Path.Combine(assemblyDir, "specs")

let private getFeatureFile (namePart: string) =
    if Directory.Exists(specsDir) then
        Directory.GetFiles(specsDir, "*.feature", SearchOption.AllDirectories)
        |> Array.tryFind (fun f -> Path.GetFileNameWithoutExtension(f).Contains(namePart))
    else
        None

type private UnitScenarioServiceProvider(factory: TestWebAppFactory) =
    interface IServiceProvider with
        member _.GetService(serviceType: Type) =
            if serviceType = typeof<StepState> then
                let httpClient = factory.CreateClient()
                empty httpClient :> obj
            else
                null

/// Preserve inline '#' characters by replacing them with a temporary placeholder
/// before TickSpec's Gherkin parser strips them as comments.
let private preprocessFeatureLines (path: string) : string[] =
    File.ReadAllLines(path)
    |> Array.map (fun line ->
        let trimmed = line.TrimStart()

        if trimmed.StartsWith("#") then
            line
        else
            line.Replace("#", "HASH_SIGN"))

let private buildScenarioData (namePart: string) : seq<obj[]> =
    match getFeatureFile namePart with
    | Some path ->
        let defs = StepDefinitions(assembly)
        let factory = new TestWebAppFactory()

        defs.ServiceProviderFactory <- fun () -> UnitScenarioServiceProvider(factory) :> IServiceProvider

        let lines = preprocessFeatureLines path
        let feature = defs.GenerateFeature(path, lines)
        feature.Scenarios |> Seq.map (fun scenario -> [| scenario :> obj |])
    | None -> Seq.empty

[<Trait("Category", "Unit")>]
type UnitHealthFeatureTests() =
    static member Scenarios() : seq<obj[]> =
        buildScenarioData "health-check" |> Seq.toList :> seq<_>

    [<Theory>]
    [<MemberData("Scenarios")>]
    member _.``Health Check (unit)``(scenario: Scenario) = scenario.Action.Invoke()
