module CraneCli.Tests.Unit.Steps.SkiplistSteps

open System
open TickSpec
open Xunit
open CraneCore.Logic.SkiplistManager
open CraneCli.Tests.Unit.Steps.BddState
open CraneCli.Tests.Unit.Steps.InMemoryBoundaries

// ---- BDD shared state ----
let mutable private currentMdBasename: string = "nist-sp-800-53"
let mutable private currentPath: string = "memory/skiplist.md"

let private resetStore () =
    reset ()
    currentPath <- "memory/skiplist.md"

let private dependencies () = skiplistDependencies currentPath

let private serializeJson value =
    let opts = System.Text.Json.JsonSerializerOptions()
    opts.DefaultIgnoreCondition <- System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
    System.Text.Json.JsonSerializer.Serialize(value, opts)

// ---- BDD Given steps ----

[<Given>]
let ``no existing skip list for "([^"]*)"`` (mdBasename: string) =
    currentMdBasename <- mdBasename
    resetStore ()

[<Given>]
let ``a skip list for "([^"]*)" already containing the entry for text-completeness "([^"]*)"``
    (mdBasename: string)
    (description: string)
    =
    currentMdBasename <- mdBasename
    resetStore ()
    addWith (dependencies ()) mdBasename "text-completeness" description |> ignore

[<Given>]
let ``a skip list containing "([^|]*)\| ([^|]*)\| ([^"]*)"``
    (category: string)
    (mdBasename: string)
    (description: string)
    =
    currentMdBasename <- mdBasename.Trim()
    resetStore ()

    addWith (dependencies ()) (mdBasename.Trim()) (category.Trim()) (description.Trim())
    |> ignore

// ---- BDD When steps ----

[<When>]
let ``I run "crane skiplist add nist-sp-800-53 text-completeness '([^']*)'"`` (description: string) =
    RunWithWriter(fun w ->
        match addWith (dependencies ()) currentMdBasename "text-completeness" description with
        | Ok added ->
            w.WriteLine(serializeJson {| added = added |})
            0
        | Error msg ->
            eprintfn "Error: %s" msg
            1)

[<When>]
let ``I run "crane skiplist add" with the same arguments`` () =
    RunWithWriter(fun w ->
        match addWith (dependencies ()) currentMdBasename "text-completeness" "Page header on p.3" with
        | Ok added ->
            w.WriteLine(serializeJson {| added = added |})
            0
        | Error msg ->
            eprintfn "Error: %s" msg
            1)

[<When>]
let ``I run "crane skiplist check nist-sp-800-53 mermaid-syntax '([^']*)'"`` (description: string) =
    RunWithWriter(fun w ->
        match checkWith (dependencies ()) currentMdBasename "mermaid-syntax" description with
        | Ok found ->
            w.WriteLine(serializeJson {| ``match`` = found |})
            if found then 0 else 1
        | Error msg ->
            eprintfn "Error: %s" msg
            1)

[<When>]
let ``I run "crane skiplist check nist-sp-800-53 text-completeness '([^']*)'"`` (description: string) =
    resetStore ()

    RunWithWriter(fun w ->
        match checkWith (dependencies ()) currentMdBasename "text-completeness" description with
        | Ok found ->
            w.WriteLine(serializeJson {| ``match`` = found |})
            if found then 0 else 1
        | Error msg ->
            eprintfn "Error: %s" msg
            1)

// ---- BDD Then steps ----

[<Then>]
let ``the skip list file is created`` () =
    Assert.True(exists currentPath, $"Skip list file should exist: {currentPath}")

[<Then>]
let ``it contains one entry with category "([^"]*)"`` (category: string) =
    Assert.True(exists currentPath)
    let content = readAllText currentPath
    Assert.Contains($"## FALSE_POSITIVE: {category} |", content)

[<Then>]
let ``the skip list file contains exactly one matching entry`` () =
    match listWith (dependencies ()) currentMdBasename with
    | Ok entries -> Assert.Equal(1, entries.Length)
    | Error msg -> Assert.Fail(msg)

[<Then>]
let ``the JSON output contains match true`` () =
    let doc = System.Text.Json.JsonDocument.Parse(LastOutput)
    Assert.True(doc.RootElement.GetProperty("match").GetBoolean())

[<Then>]
let ``the JSON output contains match false`` () =
    let doc = System.Text.Json.JsonDocument.Parse(LastOutput)
    Assert.False(doc.RootElement.GetProperty("match").GetBoolean())

// ---- BDD list steps (CRN-021) ----

[<Given>]
let ``a skip list for "([^"]*)" holding (\d+) entries`` (mdBasename: string) (count: int) =
    currentMdBasename <- mdBasename
    resetStore ()

    [ 1..count ]
    |> List.iter (fun index ->
        addWith (dependencies ()) mdBasename "text-completeness" $"entry {index}"
        |> ignore)

[<When>]
let ``I run "crane skiplist list ([^"]*)"`` (mdBasename: string) =
    currentMdBasename <- mdBasename

    RunWithWriter(fun w ->
        match listWith (dependencies ()) mdBasename with
        | Ok entries ->
            w.WriteLine(serializeJson entries)
            0
        | Error msg ->
            eprintfn "Error: %s" msg
            1)

[<Then>]
let ``the JSON output lists (\d+) entries`` (count: int) =
    let doc = System.Text.Json.JsonDocument.Parse(LastOutput)
    Assert.Equal(count, doc.RootElement.GetArrayLength())
