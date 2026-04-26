module OrganicLeverBe.Tests.Integration.FeatureRunner

open System
open System.IO
open System.Reflection
open TickSpec
open Xunit
open OrganicLeverBe.Tests.HttpTestFixture
open OrganicLeverBe.Tests.State

/// xUnit collection that forces all integration test classes to run sequentially
/// when integration-level tests are added back later. Currently health-only.
[<CollectionDefinition("IntegrationDb", DisableParallelization = true)>]
type IntegrationDbCollection() = class end

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

/// Each scenario gets its own isolated TestWebAppFactory instance for full HTTP isolation.
type private ScenarioServiceProvider(factory: TestWebAppFactory) =
    interface IServiceProvider with
        member _.GetService(serviceType: Type) =
            if serviceType = typeof<StepState> then
                let httpClient = factory.CreateClient()
                empty httpClient :> obj
            else
                null

/// Read a feature file but preserve inline '#' characters by replacing them with
/// a temporary placeholder HASH_SIGN before TickSpec's Gherkin parser strips them.
let private preprocessFeatureLines (path: string) : string[] =
    File.ReadAllLines(path)
    |> Array.map (fun line ->
        let trimmed = line.TrimStart()

        if trimmed.StartsWith("#") then
            line // actual Gherkin comment line — leave as-is
        else
            line.Replace("#", "HASH_SIGN"))

let private buildScenarioData (namePart: string) : seq<obj[]> =
    match getFeatureFile namePart with
    | Some path ->
        let defs = StepDefinitions(assembly)
        let factory = new TestWebAppFactory()

        defs.ServiceProviderFactory <- fun () -> ScenarioServiceProvider(factory) :> IServiceProvider

        let lines = preprocessFeatureLines path
        let feature = defs.GenerateFeature(path, lines)
        feature.Scenarios |> Seq.map (fun scenario -> [| scenario :> obj |])
    | None -> Seq.empty

[<Collection("IntegrationDb")>]
[<Trait("Category", "Integration")>]
type HealthFeatureTests() =
    static member Scenarios() : seq<obj[]> =
        buildScenarioData "health-check" |> Seq.toList :> seq<_>

    [<Theory>]
    [<MemberData("Scenarios")>]
    member this.``Health Check``(scenario: Scenario) = scenario.Action.Invoke()
