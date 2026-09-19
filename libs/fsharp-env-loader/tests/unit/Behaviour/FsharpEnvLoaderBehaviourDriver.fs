/// TickSpec step definitions and scenario runner binding both of
/// `fsharp-env-loader`'s Gherkin feature files —
/// `specs/libs/fsharp-env-loader/behaviours/env-tier/env-tier.feature` and
/// `specs/libs/fsharp-env-loader/behaviours/port-resolver/port-resolver.feature`
/// — to `FsharpEnvLoader.EnvTier` and `FsharpEnvLoader.PortResolver`. This is
/// the Unit behaviour driver for `fsharp-env-loader`.
///
/// One instance-mutable-field step class is consumed by a
/// `[<Theory>][<MemberData>]` runner per feature file so `Scenario Outline`
/// `Examples` tables expand naturally through TickSpec rather than a
/// hand-rolled per-title slice. Env-tier effects are routed through
/// deterministic in-memory ports, keeping this Unit driver independent of the
/// real filesystem and process environment.
module FsharpEnvLoader.Tests.Unit.Behaviour.FsharpEnvLoaderBehaviourDriver

open System
open System.Collections.Generic
open System.IO
open System.Reflection
open TickSpec
open Xunit
open FsharpEnvLoader

type FsharpEnvLoaderBehaviourSteps() =
    // --- deterministic env/filesystem ports (env-tier scenarios) -----------
    let namedDirs = Dictionary<string, string>()
    let files = Dictionary<string, string list>()
    let environment = Dictionary<string, string>()
    let mutable resolvedTier: string option = None
    let mutable loadOutcome: Result<unit, exn> option = None

    let ensureDir (name: string) : string =
        match namedDirs.TryGetValue name with
        | true, dir -> dir
        | false, _ ->
            let dir = $"memory://{name}"
            namedDirs.[name] <- dir
            dir

    let readEnvironment (key: string) : string =
        match environment.TryGetValue key with
        | true, value -> value
        | false, _ -> null

    let ports: EnvTier.EnvTierPorts =
        { GetEnvironmentVariable = readEnvironment
          SetEnvironmentVariable = fun key value -> environment[key] <- value
          FileExists = files.ContainsKey
          ReadLines = fun path -> files[path]
          CombinePath = fun directory fileName -> $"{directory}/{fileName}" }

    let setFile (directory: string) (fileName: string) (lines: string list) : unit =
        files[$"{directory}/{fileName}"] <- lines

    // --- PortResolver scenario state ----------------------------------------
    let mutable declaredVar = ""
    let mutable declaredFallback = 0
    let mutable envMap: Map<string, string> = Map.empty
    let mutable resolveOutcome: Result<int, string> option = None

    let runResolve (argv: string list) : Result<int, string> =
        let readEnvironment =
            fun (key: string) ->
                match envMap.TryFind key with
                | Some v -> v
                | None -> null

        PortResolver.resolvePort (List.toArray argv) readEnvironment declaredVar declaredFallback

    // --- env-tier.feature ---------------------------------------------------

    [<Given>]
    member _.``a fresh temporary search directory``() = ensureDir "primary" |> ignore

    [<Given>]
    member _.``a fresh temporary search directory named "([^"]+)"``(name: string) = ensureDir name |> ignore

    [<Given>]
    member _.``a search directory that does not exist``() =
        namedDirs.["primary"] <- "memory://missing"

    [<Given>]
    member _.``the search directory has a "([^"]+)" file setting "([^"]+)" to "([^"]*)"``
        (fileName: string, key: string, value: string)
        =
        setFile (ensureDir "primary") fileName [ $"{key}={value}" ]

    [<Given>]
    member _.``directory "([^"]+)" has a "([^"]+)" file setting "([^"]+)" to "([^"]*)"``
        (name: string, fileName: string, key: string, value: string)
        =
        setFile (ensureDir name) fileName [ $"{key}={value}" ]

    [<Given>]
    member _.``the search directory has a "([^"]+)" file with no content``(fileName: string) =
        setFile (ensureDir "primary") fileName []

    [<Given>]
    member _.``the search directory has a "([^"]+)" file with the raw line "([^"]*)"``(fileName: string, line: string) =
        setFile (ensureDir "primary") fileName [ line ]

    [<Given>]
    member _.``the search directory has a "([^"]+)" file with CRLF lines setting "([^"]+)" to "([^"]*)" and "([^"]+)" to "([^"]*)"``
        (fileName: string, keyA: string, valueA: string, keyB: string, valueB: string)
        =
        setFile (ensureDir "primary") fileName [ $"{keyA}={valueA}\r"; $"{keyB}={valueB}\r" ]

    [<Given>]
    member _.``the search directory has a "([^"]+)" file with a leading comment, a blank line, then "([^"]+)" set to "([^"]*)", then a trailing comment``
        (fileName: string, key: string, value: string)
        =
        setFile
            (ensureDir "primary")
            fileName
            [ "# a leading comment"; ""; "   "; $"{key}={value}"; "# a trailing comment" ]

    [<Given>]
    member _.``the search directory has a "([^"]+)" file with a line with no "=" followed by "([^"]+)" set to "([^"]*)"``
        (fileName: string, key: string, value: string)
        =
        setFile (ensureDir "primary") fileName [ "this line has no equals sign"; $"{key}={value}" ]

    [<Given>]
    member _.``the search directory has a "([^"]+)" file setting padded "([^"]+)" to "([^"]*)"``
        (fileName: string, key: string, value: string)
        =
        setFile (ensureDir "primary") fileName [ $"   {key}   =   {value}   " ]

    [<Given>]
    member _.``the process environment already has "([^"]+)" set to "([^"]*)"``(key: string, value: string) =
        environment[key] <- value

    [<Given>]
    member _.``APP_ENV is unset``() = environment.Remove("APP_ENV") |> ignore

    [<Given>]
    member _.``APP_ENV is set to "([^"]*)"``(value: string) = environment["APP_ENV"] <- value

    [<When>]
    member _.``the env tier resolves``() =
        resolvedTier <- Some(EnvTier.resolveTierWith readEnvironment)

    [<When>]
    member _.``the env tier loads from the search directory``() =
        loadOutcome <-
            try
                EnvTier.loadEnvTierFromWith ports [ ensureDir "primary" ]
                Some(Ok())
            with error ->
                Some(Error error)

    [<When>]
    member _.``the env tier loads from search directories "([^"]+)" then "([^"]+)"``(a: string, b: string) =
        loadOutcome <-
            try
                EnvTier.loadEnvTierFromWith ports [ ensureDir a; ensureDir b ]
                Some(Ok())
            with error ->
                Some(Error error)

    [<Then>]
    member _.``the resolved tier is "([^"]*)"``(expected: string) =
        match resolvedTier with
        | Some actual -> Assert.Equal(expected, actual)
        | None ->
            Assert.Fail("no tier has been resolved — the scenario is missing its \"When the env tier resolves\" step")

    [<Then>]
    member _.``"([^"]+)" is "([^"]*)"``(key: string, expected: string) =
        Assert.Equal(expected, readEnvironment key)

    [<Then>]
    member _.``loading completes without raising``() =
        match loadOutcome with
        | Some(Ok()) -> ()
        | Some(Error error) -> Assert.Fail($"environment loading raised: %s{error.Message}")
        | None -> Assert.Fail("environment loading was not invoked")

    // --- port-resolver.feature ----------------------------------------------

    [<Given>]
    member _.``the app declares the prefixed variable "([^"]+)" with fallback (\d+)``(varName: string, fallback: int) =
        declaredVar <- varName
        declaredFallback <- fallback

    [<Given>]
    member _.``the environment sets "([^"]+)" to "([^"]*)"``(key: string, value: string) =
        envMap <- envMap.Add(key, value)

    [<Given>]
    member _.``the environment does not set "([^"]+)"``(key: string) = envMap <- envMap.Remove(key)

    [<When>]
    member _.``the port resolves with a "([^"]+)" flag of "([^"]*)"``(flagName: string, value: string) =
        resolveOutcome <- Some(runResolve [ flagName; value ])

    [<When>]
    member _.``the port resolves with no "([^"]+)" flag``(_flagName: string) = resolveOutcome <- Some(runResolve [])

    [<Then>]
    member _.``the resolved port is (\d+)``(expected: int) =
        match resolveOutcome with
        | Some(Ok actual) -> Assert.Equal(expected, actual)
        | Some(Error msg) -> Assert.Fail(sprintf "expected Ok %d but resolution errored: %s" expected msg)
        | None -> Assert.Fail("no resolution has been attempted")

    [<Then>]
    member _.``resolution throws, naming "([^"]+)" and the valid range``(sourceName: string) =
        match resolveOutcome with
        | Some(Error msg) ->
            Assert.Contains(sourceName, msg)
            Assert.Contains("between", msg)
        | Some(Ok actual) ->
            Assert.Fail(sprintf "expected an error naming \"%s\" but resolution returned Ok %d" sourceName actual)
        | None -> Assert.Fail("no resolution has been attempted")

    // --- cleanup --------------------------------------------------------------

    [<AfterScenario>]
    member _.Cleanup() =
        namedDirs.Clear()
        files.Clear()
        environment.Clear()
        resolvedTier <- None
        loadOutcome <- None
        declaredVar <- ""
        declaredFallback <- 0
        envMap <- Map.empty
        resolveOutcome <- None

/// Reads the Gherkin feature files TickSpec's `CopyGherkinSpecs` build target
/// copies into this test binary's own output directory, and runs every
/// scenario in `featureFileName` through `FsharpEnvLoaderBehaviourSteps`.
module private FeatureRunner =
    let private assembly = Assembly.GetExecutingAssembly()

    let private specsDir =
        let assemblyDir = Path.GetDirectoryName(assembly.Location)
        Path.Combine(assemblyDir, "specs")

    let private getFeatureFile (featureFileName: string) : string option =
        if Directory.Exists specsDir then
            Directory.GetFiles(specsDir, "*.feature", SearchOption.AllDirectories)
            |> Array.tryFind (fun f -> Path.GetFileName(f) = featureFileName)
        else
            None

    let scenarios (featureFileName: string) : seq<obj[]> =
        match getFeatureFile featureFileName with
        | Some path ->
            let defs = StepDefinitions([| typeof<FsharpEnvLoaderBehaviourSteps> |])
            let lines = File.ReadAllLines path
            let feature = defs.GenerateFeature(path, lines)
            feature.Scenarios |> Seq.map (fun scenario -> [| scenario :> obj |])
        | None -> Seq.empty

type EnvTierFeatureTests() =
    static member Scenarios() : seq<obj[]> =
        FeatureRunner.scenarios "env-tier.feature" |> Seq.toList :> seq<_>

    [<Theory>]
    [<MemberData("Scenarios")>]
    member _.``Tiered .env file loading``(scenario: Scenario) = scenario.Action.Invoke()

type PortResolverFeatureTests() =
    static member Scenarios() : seq<obj[]> =
        FeatureRunner.scenarios "port-resolver.feature" |> Seq.toList :> seq<_>

    [<Theory>]
    [<MemberData("Scenarios")>]
    member _.``Runtime listener port resolution``(scenario: Scenario) = scenario.Action.Invoke()
