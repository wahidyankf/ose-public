/// The one shared spec loader of this unit suite. It locates the Gherkin feature files that the
/// `CopyGherkinSpecs` build target copies into the test binary's output directory and binds each
/// scenario to TickSpec step definitions. It is the only unit-test file allowed to touch the file
/// system: `scripts/check-fsharp-hermetic.mjs` allow-lists this path in `test:unit`'s lint target,
/// and every other unit-test file stays hermetic.
module FsharpEnvLoader.Tests.Unit.Behaviour.SpecLoader

open System
open System.IO
open System.Reflection
open TickSpec

let private assembly = Assembly.GetExecutingAssembly()

let private specsDir =
    let assemblyDir = Path.GetDirectoryName(assembly.Location)
    Path.Combine(assemblyDir, "specs")

let private getFeatureFile (featureFileName: string) : string =
    let found =
        if Directory.Exists specsDir then
            Directory.GetFiles(specsDir, "*.feature", SearchOption.AllDirectories)
            |> Array.tryFind (fun f -> Path.GetFileName(f) = featureFileName)
        else
            None

    match found with
    | Some path -> path
    | None -> failwith $"feature file %s{featureFileName} is not under %s{specsDir}; the copy step did not run"

/// Runs every scenario in `featureFileName` through the step definitions of `stepsType`. A missing
/// feature file is a failure, never an empty list, so a broken copy cannot pass over zero scenarios.
let scenarios (stepsType: Type) (featureFileName: string) : seq<obj[]> =
    let path = getFeatureFile featureFileName
    let defs = StepDefinitions([| stepsType |])
    let lines = File.ReadAllLines path
    let feature = defs.GenerateFeature(path, lines)
    feature.Scenarios |> Seq.map (fun scenario -> [| scenario :> obj |])
