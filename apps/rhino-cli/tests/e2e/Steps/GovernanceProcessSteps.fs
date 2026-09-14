module RhinoCli.Tests.E2E.Steps.GovernanceProcessSteps

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/governance/governance-readme-index.feature"
      "specs/apps/rhino/cli/behaviours/governance/governance-word-budget.feature" ]

open System
open System.Diagnostics
open System.IO
open TickSpec
open Xunit

let private repositoryRoot =
    Path.GetFullPath(Path.Combine(__SOURCE_DIRECTORY__, "..", "..", "..", "..", ".."))

let private executable =
    Path.Combine(repositoryRoot, "apps/rhino-cli/src/dist/rhino-cli-fsharp")

let private words count =
    String.Join(" ", Array.create (max 0 count) "w")

let private wordBudgetConfig =
    "governance-word-budget:\n"
    + "  surfaces:\n"
    + "    - glob: \"repo-governance/**/*.md\"\n      target: 650\n      warn: 750\n      fail: 750\n"
    + "    - glob: \".claude/**/*.md\"\n      target: 650\n      warn: 750\n      fail: 750\n"
    + "    - glob: \".codex/**/*.md\"\n      target: 650\n      warn: 750\n      fail: 750\n"
    + "    - glob: \".opencode/**/*.md\"\n      target: 650\n      warn: 750\n      fail: 750\n"
    + "    - glob: \".agents/**/*.md\"\n      target: 650\n      warn: 750\n      fail: 750\n"
    + "    - glob: \"AGENTS.md\"\n      target: 650\n      warn: 750\n      fail: 750\n"
    + "    - glob: \"CLAUDE.md\"\n      target: 650\n      warn: 750\n      fail: 750\n"
    + "    - glob: \"RTK.md\"\n      target: 650\n      warn: 750\n      fail: 750\n"
    + "    - glob: \"**/README.md\"\n      target: 900\n      warn: 1000\n      fail: 1000\n"
    + "  resolved_tree:\n    root: \"CLAUDE.md\"\n    target: 1200\n    warn: 1500\n    fail: 1500\n"
    + "gates:\n  - id: governance-word-budget\n    type: check\n    command: governance word-budget validate\n    kind: rhino-cli\n    surfaces:\n      pre-push: { scope: all-file-type }\n"

/// A split command starts `./rhino` in the temp repository before its F#
/// remainder; this no-op stand-in lets the remainder scenarios run.
let private stubRhino (root: string) =
    let path = Path.Combine(root, "rhino")
    File.WriteAllText(path, "#!/bin/sh\nexit 0\n")

    File.SetUnixFileMode(
        path,
        UnixFileMode.UserRead
        ||| UnixFileMode.UserWrite
        ||| UnixFileMode.UserExecute
        ||| UnixFileMode.GroupRead
        ||| UnixFileMode.GroupExecute
        ||| UnixFileMode.OtherRead
        ||| UnixFileMode.OtherExecute
    )

let private initialize root =
    Directory.CreateDirectory root |> ignore

    let info =
        ProcessStartInfo(FileName = "git", WorkingDirectory = root, UseShellExecute = false)

    info.ArgumentList.Add("init")
    info.ArgumentList.Add("--quiet")
    use commandProcess = Process.Start info
    commandProcess.WaitForExit()
    Assert.Equal(0, commandProcess.ExitCode)
    stubRhino root
    File.WriteAllText(Path.Combine(root, "repo-config.yml"), wordBudgetConfig)

let private invoke root arguments =
    let info =
        ProcessStartInfo(
            FileName = executable,
            WorkingDirectory = root,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        )

    arguments |> List.iter info.ArgumentList.Add
    use commandProcess = Process.Start info
    let stdout = commandProcess.StandardOutput.ReadToEnd()
    let stderr = commandProcess.StandardError.ReadToEnd()
    commandProcess.WaitForExit()
    commandProcess.ExitCode, stdout + stderr

let private parent (path: string) =
    let value = path.TrimEnd('/')
    let index = value.LastIndexOf('/')
    if index < 0 then "" else value.Substring(0, index)

type GovernanceProcessSteps() =
    let root =
        Path.Combine(Path.GetTempPath(), "rhino-governance-e2e-" + Guid.NewGuid().ToString("N"))

    let mutable currentDirectory = ""
    let mutable exitCode = 0
    let mutable output = ""
    let mutable arguments: string list = []
    let mutable lastPath = ""
    let mutable firstGenerated = ""
    let mutable gateOutput = ""

    do initialize root

    let full (relative: string) =
        Path.Combine(root, relative.Replace('/', Path.DirectorySeparatorChar))

    let write (relative: string) (content: string) =
        let path = full relative
        let directory = Path.GetDirectoryName(path)

        if not (String.IsNullOrEmpty directory) then
            Directory.CreateDirectory(directory) |> ignore

        File.WriteAllText(path, content)

    let run (command: string list) =
        let code, text = invoke root (command @ arguments)
        exitCode <- code
        output <- text

    let addDirectory (label: string) (names: string list) =
        currentDirectory <- label.TrimEnd('/')

        if
            currentDirectory.StartsWith("apps/")
            || currentDirectory.StartsWith("plans/")
            || currentDirectory.StartsWith(".opencode/")
        then
            arguments <- []
        else
            arguments <- [ "--paths"; parent currentDirectory ]

        names
        |> List.iter (fun name ->
            write (currentDirectory + "/" + name) (if name = "README.md" then "# Index\n" else "x\n"))

    let indexPath (label: string) =
        if String.IsNullOrEmpty currentDirectory then
            label
        else
            currentDirectory + "/" + Path.GetFileName(label)

    let writeLinks (label: string) (links: string list) (annotated: bool) =
        let path = indexPath label
        let directory = parent path

        links
        |> List.iter (fun target -> write (directory + "/" + target.TrimStart('.').TrimStart('/')) "# Target\n")

        let suffix = if annotated then " — indexed" else ""

        write
            path
            (links
             |> List.map (fun target -> sprintf "- [Item](%s)%s" target suffix)
             |> String.concat "\n")

    [<Given>]
    member _.``directory "([^"]+)" contains "([^"]+)", "([^"]+)", "([^"]+)"``
        (directory: string, first: string, second: string, third: string)
        =
        addDirectory directory [ first; second; third ]

    [<Given>]
    member _.``directory "([^"]+)" contains "([^"]+)"``(directory: string, file: string) =
        addDirectory directory [ file ]

    [<Given>]
    member _.``directory "([^"]+)" contains "([^"]+)" and "([^"]+)"``
        (directory: string, first: string, second: string)
        =
        addDirectory directory [ first; second ]

    [<Given>]
    member _.``directory "([^"]+)" contains "([^"]+)" and no "([^"]+)"``
        (directory: string, file: string, _absent: string)
        =
        addDirectory directory [ file ]

    [<Given>]
    member _.``directory "([^"]+)" contains (\d+) agent files``(directory: string, count: int) =
        addDirectory directory [ for index in 1..count -> sprintf "agent-%d.md" index ]

    [<Given>]
    member _.``it contains subdirectory "([^"]+)" containing "([^"]+)"``(directory: string, file: string) =
        write (currentDirectory + "/" + directory + "/" + file) "# Child\n"

    [<Given>]
    member _.``it contains no "([^"]+)"``(name: string) =
        Assert.False(File.Exists(full (currentDirectory + "/" + name)))

    [<Given>]
    member _.``file "([^"]+)" exists``(path: string) =
        write path "# Index\n"
        currentDirectory <- parent path
        arguments <- [ "--paths"; parent currentDirectory ]

    [<Given>]
    member _.``"([^"]+)" links "([^"]+)" and "([^"]+)"``(label: string, first: string, second: string) =
        writeLinks label [ first; second ] true

    [<Given>]
    member _.``"([^"]+)" links "([^"]+)"``(label: string, target: string) = writeLinks label [ target ] true

    [<Given>]
    member _.``"([^"]+)" links "([^"]+)" only``(label: string, target: string) = writeLinks label [ target ] true

    [<Given>]
    member _.``"([^"]+)" links "([^"]+)" with no annotation text``(label: string, target: string) =
        writeLinks label [ target ] false

    [<Given>]
    member _.``"([^"]+)" does not link "([^"]+)"``(label: string, target: string) =
        let path = indexPath label
        write path "# Index\nNo links.\n"
        write (parent path + "/" + target.TrimStart('.').TrimStart('/')) "# Target\n"

    [<Given>]
    member _.``it does not link "([^"]+)"``(target: string) =
        let indexes = Directory.GetFiles(root, "README.md", SearchOption.AllDirectories)
        Assert.DoesNotContain(indexes, fun path -> File.ReadAllText(path).Contains(target))

    [<Given>]
    member _.``gate id "([^"]+)" is armed at "([^"]+)" before Phase 1``(oldId: string, scope: string) =
        write
            "repo-config.yml"
            (sprintf
                "gates:\n  - id: %s\n    type: check\n    command: governance readme-index validate\n    kind: rhino-cli\n    surfaces:\n      pre-push: { scope: all-file-type }\n"
                oldId)

        let code, text =
            invoke root [ "gate"; "list"; "--surface=pre-push"; "--format=text" ]

        Assert.Equal(0, code)
        Assert.Contains(oldId, text)
        Assert.Equal("scope: all-file-type", scope)

    [<When>]
    member _.``Phase 1's rename lands and gate id "([^"]+)" replaces it``(newId: string) =
        write
            "repo-config.yml"
            (sprintf
                "gates:\n  - id: %s\n    type: check\n    command: governance readme-index validate\n    kind: rhino-cli\n    surfaces:\n      pre-push: { scope: all-file-type }\n"
                newId)

        let code, text =
            invoke root [ "gate"; "list"; "--surface=pre-push"; "--format=text" ]

        exitCode <- code
        gateOutput <- text

    [<Then>]
    member _.``"([^"]+)" is armed at "([^"]+)" immediately, not deferred``(gateId: string, _scope: string) =
        Assert.Contains(gateId, gateOutput)

    [<Then>]
    member _.``the published gate list command completed successfully``() = Assert.Equal(0, exitCode)

    [<Then>]
    member _.``that output never shows both gate ids at once``() =
        Assert.Contains("governance-readme-index", gateOutput)
        Assert.DoesNotContain("md-readme-index", gateOutput)

    [<Given>]
    member _.``Phase 9 has not yet armed "([^"]+)"``(_gateId: string) = arguments <- []

    [<Given>]
    member _.``Phase 9 has armed "([^"]+)" at "([^"]+)"``(_gateId: string, _scope: string) =
        arguments <- [ "--fail-kinds"; "unannotated" ]

    [<Given>]
    member _.``the changed paths include "([^"]+)"``(path: string) = Assert.True(File.Exists(full path))

    [<When>]
    member _.``the developer runs gate run with surface pre-push``() =
        run [ "governance"; "readme-index"; "validate" ]

    [<Then>]
    member _.``no finding of kind "([^"]+)" causes a failure``(kind: string) =
        Assert.Equal(0, exitCode)
        Assert.Contains(kind, output)

    [<When>]
    member _.``the developer runs governance readme-index validate``() =
        run [ "governance"; "readme-index"; "validate" ]

    [<Then>]
    member _.``the command exits successfully``() = Assert.Equal(0, exitCode)

    [<Then>]
    member _.``the command exits with a failure code``() = Assert.NotEqual(0, exitCode)

    [<Then>]
    member _.``the finding names "([^"]+)" as unindexed``(name: string) = Assert.Contains(name, output)

    [<Then>]
    member _.``the finding names "([^"]+)" as unannotated``(name: string) =
        Assert.Contains(name, output)
        Assert.Contains("unannotated", output)

    [<Given>]
    member _.``the developer invokes governance readme-index validate with "--paths (.*)"``(path: string) =
        arguments <- [ "--paths"; path ]

    [<When>]
    member _.``the command runs``() =
        run [ "governance"; "readme-index"; "validate" ]

    [<Then>]
    member _.``it scans only "([^"]+)", not the unmodified DEFAULT_PATHS list``(path: string) =
        Assert.Equal(0, exitCode)
        Assert.DoesNotContain("apps/", output)
        Assert.Equal("repo-governance/", path)

    [<Then>]
    member _.``running it again with no "--paths" flag scans the unmodified DEFAULT_PATHS list``() =
        arguments <- []
        run [ "governance"; "readme-index"; "validate" ]
        Assert.Equal(0, exitCode)

    [<Given>]
    member _.``a scanned directory has one "orphan" finding and one "ghost" finding``() =
        write "repo-governance/README.md" "# Root\n\n- [Ghost](./ghost.md) - a link to no file\n"
        write "repo-governance/orphan.md" "# Orphan\n"

    [<When>]
    member _.``the developer runs governance readme-index validate with "--fail-kinds (.*)"``(kind: string) =
        arguments <- [ "--fail-kinds"; kind ]
        run [ "governance"; "readme-index"; "validate" ]

    [<Then>]
    member _.``the exit code reflects only the "([^"]+)" finding``(kind: string) =
        Assert.NotEqual(0, exitCode)
        Assert.Contains(kind, output)

    [<Then>]
    member _.``the "([^"]+)" finding is still printed in the output``(kind: string) = Assert.Contains(kind, output)

    [<Given>]
    member _.``a covered directory contains a markdown file with description and when_to_use frontmatter, and no "README.md"``
        ()
        =
        currentDirectory <- "repo-governance/widgets"

        write
            (currentDirectory + "/widget.md")
            "---\ntitle: \"Widget\"\ndescription: \"Widget description\"\nwhen_to_use: \"Use it\"\n---\n"

    [<When>]
    member _.``the developer runs governance readme-index generate``() =
        run [ "governance"; "readme-index"; "generate" ]

    [<Then>]
    member _.``a "README.md" is written linking that file with a derived annotation``() =
        let content = File.ReadAllText(full (currentDirectory + "/README.md"))
        Assert.Contains("widget.md", content)
        Assert.Contains("Widget description", content)

    [<Given>]
    member _.``a covered directory already has a conforming "README.md"``() =
        currentDirectory <- "repo-governance/covered"
        write (currentDirectory + "/note.md") "---\ndescription: \"Note\"\n---\n"
        write (currentDirectory + "/README.md") "# Covered\n- [Note](./note.md) — Note\n"

    [<When>]
    member _.``the developer runs governance readme-index generate twice``() =
        run [ "governance"; "readme-index"; "generate" ]
        firstGenerated <- File.ReadAllText(full (currentDirectory + "/README.md"))
        run [ "governance"; "readme-index"; "generate" ]

    [<Then>]
    member _.``the second run writes byte-identical content to the first``() =
        Assert.Equal(firstGenerated, File.ReadAllText(full (currentDirectory + "/README.md")))

    [<Given>]
    member _.``a directory already has a README.md index with hand-authored entry order``() =
        currentDirectory <- "repo-governance/ordered"

        [ "a.md"; "b.md"; "c.md" ]
        |> List.iter (fun name -> write (currentDirectory + "/" + name) "# File\n")

        write (currentDirectory + "/README.md") "# Ordered\n- [B](./b.md) — hand\n- [A](./a.md) — hand\n"

    [<Given>]
    member _.``a directory has no README.md index``() =
        currentDirectory <- "repo-governance/scaffold"
        write (currentDirectory + "/x.md") "---\ntitle: \"X\"\ndescription: \"X\"\n---\n"
        write (currentDirectory + "/y.md") "# Y\n"
        write (currentDirectory + "/sub/README.md") "# Sub\n"

    [<When>]
    member _.``the maintainer runs rhino-cli governance readme-index generate on that directory``() =
        run [ "governance"; "readme-index"; "generate" ]

    [<Then>]
    member _.``the existing entries keep their order and annotations``() =
        let content = File.ReadAllText(full (currentDirectory + "/README.md"))
        Assert.True(content.IndexOf("b.md") < content.IndexOf("a.md"), content)

    [<Then>]
    member _.``only genuinely missing entries are appended``() =
        Assert.Contains("c.md", File.ReadAllText(full (currentDirectory + "/README.md")))

    [<Then>]
    member _.``a complete annotated index is written``() =
        Assert.True(File.Exists(full (currentDirectory + "/README.md")))

    [<Then>]
    member _.``every sibling file and subdirectory appears exactly once``() =
        let content = File.ReadAllText(full (currentDirectory + "/README.md"))

        let once needle =
            (content.Length - content.Replace(needle, "").Length) / needle.Length

        [ "x.md"; "y.md"; "sub/README.md" ]
        |> List.iter (fun target -> Assert.Equal(1, once target))

    [<Given>]
    member _.``a rename map of old and new paths for a directory's children``() =
        currentDirectory <- "repo-governance/renamed"

        write
            (currentDirectory + "/README.md")
            "# Index\nProse.\n- [A](./old-a.md) — desc a\n- [B](./old-b.md) — desc b\nTail.\n"

        write "renames.txt" "old-a.md\tnew-a.md\nold-b.md\tnew-b.md\n"
        arguments <- [ "--map"; full "renames.txt"; "--paths"; "repo-governance" ]

    [<When>]
    member _.``the maintainer runs rhino-cli governance readme-index rewrite-paths with that map``() =
        run [ "governance"; "readme-index"; "rewrite-paths" ]

    [<Then>]
    member _.``every index link target is updated to its new path``() =
        let content = File.ReadAllText(full (currentDirectory + "/README.md"))
        Assert.Contains("new-a.md", content)
        Assert.DoesNotContain("old-a.md", content)

    [<Then>]
    member _.``entry order, annotation text, and surrounding prose are unchanged``() =
        let content = File.ReadAllText(full (currentDirectory + "/README.md"))
        Assert.True(content.IndexOf("new-a.md") < content.IndexOf("new-b.md"), content)
        Assert.Contains("Prose.", content)

    [<Given>]
    member _.``repo-config.yml declares a governance-word-budget section``() =
        Assert.True(File.Exists(full "repo-config.yml"))

    [<Given>]
    member _.``the section sets target (\d+), warn (\d+), fail (\d+)``(target: int, warn: int, fail: int) =
        let config = File.ReadAllText(full "repo-config.yml")

        [ target; warn; fail ]
        |> List.iter (fun value -> Assert.Contains(string value, config))

    [<Given>]
    member _.``the resolved CLAUDE.md tree totals (\d+) words``(count: int) =
        lastPath <- "CLAUDE.md"
        write lastPath (words count)

    [<Given>]
    member _.``repo-config.yml adds "([^"]+)" under governance-word-budget``(addition: string) =
        File.AppendAllText(full "repo-config.yml", "  " + addition + "\n")

    [<When>]
    member _.``the developer runs governance word-budget validate``() =
        run [ "governance"; "word-budget"; "validate" ]

    [<When>]
    member _.``the developer runs repo-config schema validate``() = run [ "repo-config"; "validate" ]

    [<When>]
    member _.``the developer runs harness instruction-size validate``() =
        run [ "harness"; "instruction-size"; "validate" ]

    [<When>]
    member _.``the developer runs gate list with surface pre-push and format text``() =
        run [ "gate"; "list"; "--surface=pre-push"; "--format=text" ]

    [<When>]
    member _.``the developer runs md links validate``() = run [ "md"; "links"; "validate" ]

    [<Then>]
    member _.``the word-budget command exits successfully``() = Assert.Equal(0, exitCode)

    [<Then>]
    member _.``the word-budget command exits with a failure code``() = Assert.NotEqual(0, exitCode)

    [<Then>]
    member _.``the output contains a "([^"]+)" finding for the resolved tree``(severity: string) =
        Assert.Contains(severity.ToUpperInvariant(), output.ToUpperInvariant())
        Assert.Contains("resolved-tree", output)

    [<Then>]
    member _.``the output contains no gate id "([^"]+)"``(gateId: string) = Assert.DoesNotContain(gateId, output)

    [<Then>]
    member _.``the output contains gate id "([^"]+)"``(gateId: string) = Assert.Contains(gateId, output)

    [<Then>]
    member _.``the command exits with a usage error``() = Assert.NotEqual(0, exitCode)

    [<Then>]
    member _.``the output reports an unknown subcommand``() =
        Assert.Contains("unrecognized", output.ToLowerInvariant())

    [<AfterScenario>]
    member _.Cleanup() =
        if Directory.Exists root then
            Directory.Delete(root, true)

module private FeatureRunner =
    let private featureRoot =
        Path.Combine(repositoryRoot, "specs/apps/rhino/cli/behaviours/governance")

    let run file title =
        let path = Path.Combine(featureRoot, file)
        let lines = File.ReadAllLines(path)

        let feature =
            lines |> Array.find (fun line -> line.TrimStart().StartsWith("Feature:"))

        let start =
            lines
            |> Array.findIndex (fun line ->
                let value = line.Trim() in value = "Scenario: " + title || value = "Scenario Outline: " + title)

        let finish =
            lines
            |> Array.skip (start + 1)
            |> Array.tryFindIndex (fun line ->
                let value = line.TrimStart()

                value.StartsWith("Scenario:")
                || value.StartsWith("Scenario Outline:")
                || value.StartsWith("@")
                || value.StartsWith("# Exemption("))
            |> Option.map (fun offset -> start + 1 + offset)
            |> Option.defaultValue lines.Length

        let backgroundStart =
            lines |> Array.tryFindIndex (fun line -> line.Trim() = "Background:")

        let firstScenario =
            lines |> Array.findIndex (fun line -> line.TrimStart().StartsWith("Scenario"))

        let background =
            backgroundStart
            |> Option.map (fun index -> lines.[index .. firstScenario - 1])
            |> Option.defaultValue [||]

        let generated =
            StepDefinitions([| typeof<GovernanceProcessSteps> |])
                .GenerateFeature(path, Array.concat [ [| feature; "" |]; background; lines.[start .. finish - 1] ])

        for scenario in generated.Scenarios do
            try
                scenario.Action.Invoke()
            with error ->
                raise (Exception(sprintf "%s: %s" title error.Message, error))

let private readmeScenarios =
    [ "A complete index passes"
      "A missing sibling link fails"
      "A missing subdirectory README link fails"
      "The rule does not reach grandchildren"
      "A split directory whose parent omits a child fails"
      "An uncovered tree is not scanned"
      "A generated mirror directory is not scanned"
      "The Phase 1 rename introduces no enforcement gap for orphan or ghost"
      "The unannotated finding kind is dark-launched, not enforced, before Phase 9"
      "The unannotated finding kind fails once armed and in scope"
      "The --paths flag overrides the default scan scope"
      "The --fail-kinds flag restricts which findings contribute to the exit code"
      "generate writes a conforming annotated index for a directory needing one"
      "generate is idempotent"
      "Generate no longer rewrites an existing index's order"
      "Generate still scaffolds a directory with no index"
      "Rewrite-paths updates link targets without touching order" ]

let private wordScenarios =
    [ "The config schema rejects an exemption key"
      "The old command is gone"
      "The old gate id is replaced by the armed word-budget gate"
      "An oversized resolved tree fails"
      "No inbound link to the renamed convention is left broken" ]

[<Fact>]
let ``README index scenarios cross the published process boundary`` () =
    readmeScenarios
    |> List.iter (FeatureRunner.run "governance-readme-index.feature")

[<Fact>]
let ``word-budget scenarios cross the published process boundary`` () =
    wordScenarios |> List.iter (FeatureRunner.run "governance-word-budget.feature")
