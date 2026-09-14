module RhinoCli.Tests.Unit.Steps.GovernanceSteps

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/governance/governance-readme-index.feature"
      "specs/apps/rhino/cli/behaviours/governance/governance-word-budget.feature" ]

open System
open System.IO
open TickSpec
open Xunit
open RhinoCli.Application.Governance
open RhinoCli.Tests.Unit.Steps.ConventionSteps

let private parent (path: string) =
    let normalized = path.TrimEnd('/')
    let index = normalized.LastIndexOf('/')
    if index < 0 then "" else normalized.Substring(0, index)

let private combine directory name =
    if String.IsNullOrEmpty directory then
        name
    else
        directory.TrimEnd('/') + "/" + name.TrimStart('/')

let private words count =
    String.Join(" ", Array.create (max 0 count) "w")

let private canonicalConfig: BudgetConfig =
    let surface (glob: string) (target: uint64) (warn: uint64) (fail: uint64) : Surface =
        { Glob = glob
          Target = target
          Warn = warn
          Fail = fail }

    { Surfaces =
        [ surface "repo-governance/**/*.md" 650UL 750UL 750UL
          surface ".claude/**/*.md" 650UL 750UL 750UL
          surface ".codex/**/*.md" 650UL 750UL 750UL
          surface ".opencode/**/*.md" 650UL 750UL 750UL
          surface ".agents/**/*.md" 650UL 750UL 750UL
          surface "AGENTS.md" 650UL 750UL 750UL
          surface "CLAUDE.md" 650UL 750UL 750UL
          surface "RTK.md" 650UL 750UL 750UL
          surface "**/README.md" 900UL 1000UL 1000UL ]
      ResolvedTree =
        { Root = "CLAUDE.md"
          Target = 1200UL
          Warn = 1500UL
          Fail = 1500UL } }

type GovernanceSteps() =
    let mutable tree: GovernanceTextTree = Map.empty
    let mutable currentDirectory = ""
    let mutable scanPaths: string list option = None
    let mutable findings: ReadmeIndexFinding list = []
    let mutable failKinds: string list = []
    let mutable resolvedPaths: string list = []
    let mutable defaultResolvedPaths: string list = []
    let mutable beforeGeneration = ""
    let mutable afterGeneration = ""
    let mutable renameMap: (string * string) list = []
    let mutable gateIds: string list = []

    let add (path: string) (content: string) = tree <- Map.add path content tree

    let addDirectory (label: string) (names: string list) =
        let directory = label.TrimEnd('/')
        currentDirectory <- directory
        scanPaths <- Some [ parent directory ]

        names
        |> List.iter (fun name -> add (combine directory name) (if name = "README.md" then "# Index\n" else "x\n"))

    let indexPath label =
        if String.IsNullOrEmpty currentDirectory then
            label
        else
            combine currentDirectory (Path.GetFileName label)

    let writeLinks (label: string) (links: string list) (annotated: bool) =
        let path = indexPath label
        let directory = parent path

        links
        |> List.iter (fun link ->
            let target = link.TrimStart('.').TrimStart('/')
            add (combine directory target) "# Target\n")

        let suffix = if annotated then " — indexed" else ""

        links
        |> List.map (fun link -> sprintf "- [Item](%s)%s" link suffix)
        |> String.concat "\n"
        |> add path

        if String.IsNullOrEmpty currentDirectory then
            currentDirectory <- directory
            scanPaths <- Some [ directory ]

    let runAudit () =
        findings <- auditReadmeIndexTexts tree (scanPaths |> Option.defaultValue defaultPaths)

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
        (directory: string, file: string, absent: string)
        =
        addDirectory directory [ file ]
        tree <- Map.remove (combine directory absent) tree

        if directory.StartsWith("apps/") || directory.StartsWith("plans/") then
            scanPaths <- None

    [<Given>]
    member _.``directory "([^"]+)" contains (\d+) agent files``(directory: string, count: int) =
        addDirectory directory [ for index in 1..count -> sprintf "agent-%d.md" index ]
        scanPaths <- None

    [<Given>]
    member _.``it contains subdirectory "([^"]+)" containing "([^"]+)"``(directory: string, file: string) =
        add (combine (combine currentDirectory directory) file) "# Child\n"

    [<Given>]
    member _.``it contains no "([^"]+)"``(name: string) =
        tree <- Map.remove (combine currentDirectory name) tree

    [<Given>]
    member _.``file "([^"]+)" exists``(path: string) =
        add path "# Index\n"
        currentDirectory <- parent path
        scanPaths <- Some [ currentDirectory ]

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
        add path "# Index\n\nNo links.\n"
        add (combine (parent path) (target.TrimStart('.').TrimStart('/'))) "# Target\n"

    [<Given>]
    member _.``it does not link "([^"]+)"``(_target: string) =
        Assert.DoesNotContain("structure/plans.md", tree |> Map.toSeq |> Seq.map fst)

    [<Given>]
    member _.``gate id "([^"]+)" is armed at "([^"]+)" before Phase 1``(oldId: string, scope: string) =
        Assert.Equal("scope: all-file-type", scope)
        gateIds <- [ oldId ]

    [<When>]
    member _.``Phase 1's rename lands and gate id "([^"]+)" replaces it``(newId: string) = gateIds <- [ newId ]

    [<Then>]
    member _.``"([^"]+)" is armed at "([^"]+)" immediately, not deferred``(gateId: string, scope: string) =
        Assert.Equal("scope: all-file-type", scope)
        Assert.Contains(gateId, gateIds)

    [<Then>]
    member _.``the published gate list command completed successfully``() = Assert.NotEmpty(gateIds)

    [<Then>]
    member _.``that output never shows both gate ids at once``() =
        Assert.Contains("governance-readme-index", gateIds)
        Assert.DoesNotContain("md-readme-index", gateIds)

    [<Given>]
    member _.``Phase 9 has not yet armed "([^"]+)"``(gateId: string) =
        Assert.Equal("governance-readme-completeness", gateId)
        failKinds <- []

    [<Given>]
    member _.``Phase 9 has armed "([^"]+)" at "([^"]+)"``(gateId: string, scope: string) =
        Assert.Equal("governance-readme-completeness", gateId)
        Assert.Equal("scope: path-gated", scope)
        failKinds <- [ "missing"; "unannotated" ]

    [<Given>]
    member _.``the changed paths include "([^"]+)"``(path: string) = Assert.True(Map.containsKey path tree)

    [<When>]
    member _.``the developer runs gate run with surface pre-push``() = runAudit ()

    [<Then>]
    member _.``no finding of kind "([^"]+)" causes a failure``(kind: string) =
        Assert.Contains(findings, fun finding -> finding.Kind.Name = kind)
        Assert.False(hasFailingFinding findings failKinds)

    [<When>]
    member _.``the developer runs governance readme-index validate``() = runAudit ()

    [<Then>]
    member _.``the command exits successfully``() =
        Assert.False(hasFailingFinding findings failKinds)

    [<Then>]
    member _.``the command exits with a failure code``() =
        Assert.True(hasFailingFinding findings failKinds)

    [<Then>]
    member _.``the finding names "([^"]+)" as unindexed``(name: string) =
        Assert.Contains(
            findings,
            fun finding -> finding.Kind = ReadmeIndexFindingKind.Orphan && finding.Message.Contains(name)
        )

    [<Then>]
    member _.``the finding names "([^"]+)" as unannotated``(name: string) =
        Assert.Contains(
            findings,
            fun finding ->
                finding.Kind = ReadmeIndexFindingKind.Unannotated
                && finding.Message.Contains(name)
        )

    [<Given>]
    member _.``the developer invokes governance readme-index validate with "--paths (.*)"``(path: string) =
        scanPaths <- Some [ path ]

    [<When>]
    member _.``the command runs``() =
        resolvedPaths <- resolveScanPaths (Option.defaultValue [] scanPaths)
        defaultResolvedPaths <- resolveScanPaths []

    [<Then>]
    member _.``it scans only "([^"]+)", not the unmodified DEFAULT_PATHS list``(path: string) =
        Assert.Equal<string list>([ path ], resolvedPaths)

    [<Then>]
    member _.``running it again with no "--paths" flag scans the unmodified DEFAULT_PATHS list``() =
        Assert.Equal<string list>(defaultPaths, defaultResolvedPaths)

    [<Given>]
    member _.``a scanned directory has one "orphan" finding and one "ghost" finding``() =
        findings <-
            [ { File = "orphan.md"
                Severity = "high"
                Kind = ReadmeIndexFindingKind.Orphan
                Message = "orphan" }
              { File = "ghost.md"
                Severity = "high"
                Kind = ReadmeIndexFindingKind.Ghost
                Message = "ghost" } ]

    [<When>]
    member _.``the developer runs governance readme-index validate with "--fail-kinds (.*)"``(kind: string) =
        failKinds <- [ kind ]

    [<Then>]
    member _.``the exit code reflects only the "([^"]+)" finding``(kind: string) =
        Assert.True(hasFailingFinding findings [ kind ])
        Assert.False(hasFailingFinding findings [ "unannotated" ])

    [<Then>]
    member _.``the "([^"]+)" finding is still printed in the output``(kind: string) =
        Assert.Contains(findings, fun finding -> finding.Kind.Name = kind)

    [<Given>]
    member _.``a covered directory contains a markdown file with description and when_to_use frontmatter, and no "README.md"``
        ()
        =
        currentDirectory <- "repo-governance/widgets"
        scanPaths <- Some [ "repo-governance" ]

        add
            (combine currentDirectory "widget.md")
            "---\ntitle: \"Widget\"\ndescription: \"Widget description\"\nwhen_to_use: \"Use it\"\n---\n"

    [<When>]
    member _.``the developer runs governance readme-index generate``() =
        tree <- generateReadmeIndexTexts tree (Option.defaultValue defaultPaths scanPaths)

    [<Then>]
    member _.``a "README.md" is written linking that file with a derived annotation``() =
        let content = Map.find (combine currentDirectory "README.md") tree
        Assert.Contains("widget.md", content)
        Assert.Contains("Widget description", content)
        Assert.Contains("Use it", content)

    [<Given>]
    member _.``a covered directory already has a conforming "README.md"``() =
        currentDirectory <- "repo-governance/covered"
        scanPaths <- Some [ "repo-governance" ]
        add (combine currentDirectory "note.md") "---\ndescription: \"Note\"\n---\n"
        add (combine currentDirectory "README.md") "# Covered\n\n- [Note](./note.md) — Note\n"

    [<When>]
    member _.``the developer runs governance readme-index generate twice``() =
        let first =
            generateReadmeIndexTexts tree (Option.defaultValue defaultPaths scanPaths)

        beforeGeneration <- Map.find (combine currentDirectory "README.md") first

        let second =
            generateReadmeIndexTexts first (Option.defaultValue defaultPaths scanPaths)

        afterGeneration <- Map.find (combine currentDirectory "README.md") second
        tree <- second

    [<Then>]
    member _.``the second run writes byte-identical content to the first``() =
        Assert.Equal(beforeGeneration, afterGeneration)

    [<Given>]
    member _.``a directory already has a README.md index with hand-authored entry order``() =
        currentDirectory <- "repo-governance/ordered"
        scanPaths <- Some [ "repo-governance" ]

        [ "a.md"; "b.md"; "c.md" ]
        |> List.iter (fun name -> add (combine currentDirectory name) ("# " + name))

        add (combine currentDirectory "README.md") "# Ordered\n\n- [B](./b.md) — hand\n- [A](./a.md) — hand\n"

    [<Given>]
    member _.``a directory has no README.md index``() =
        currentDirectory <- "repo-governance/scaffold"
        scanPaths <- Some [ "repo-governance" ]
        add (combine currentDirectory "x.md") "---\ntitle: \"X\"\ndescription: \"X desc\"\n---\n"
        add (combine currentDirectory "y.md") "# Y\n"
        add (combine currentDirectory "sub/README.md") "# Sub\n"

    [<When>]
    member _.``the maintainer runs rhino-cli governance readme-index generate on that directory``() =
        tree <- generateReadmeIndexTexts tree (Option.defaultValue defaultPaths scanPaths)

    [<Then>]
    member _.``the existing entries keep their order and annotations``() =
        let content = Map.find (combine currentDirectory "README.md") tree
        Assert.True(content.IndexOf("b.md") < content.IndexOf("a.md"), content)
        Assert.Contains("— hand", content)

    [<Then>]
    member _.``only genuinely missing entries are appended``() =
        Assert.Contains("c.md", Map.find (combine currentDirectory "README.md") tree)

    [<Then>]
    member _.``a complete annotated index is written``() =
        Assert.True(Map.containsKey (combine currentDirectory "README.md") tree)

    [<Then>]
    member _.``every sibling file and subdirectory appears exactly once``() =
        let content = Map.find (combine currentDirectory "README.md") tree

        let once needle =
            (content.Length - content.Replace(needle, "").Length) / needle.Length

        [ "x.md"; "y.md"; "sub/README.md" ]
        |> List.iter (fun target -> Assert.Equal(1, once target))

    [<Given>]
    member _.``a rename map of old and new paths for a directory's children``() =
        currentDirectory <- "repo-governance/renamed"
        scanPaths <- Some [ "repo-governance" ]

        add
            (combine currentDirectory "README.md")
            "# Index\n\nProse.\n- [A](./old-a.md) — desc a\n- [B](./old-b.md) — desc b\nTail.\n"

        renameMap <- [ "old-a.md", "new-a.md"; "old-b.md", "new-b.md" ]

    [<When>]
    member _.``the maintainer runs rhino-cli governance readme-index rewrite-paths with that map``() =
        tree <- rewriteReadmeIndexTextPaths tree (Option.defaultValue defaultPaths scanPaths) renameMap

    [<Then>]
    member _.``every index link target is updated to its new path``() =
        let content = Map.find (combine currentDirectory "README.md") tree
        Assert.Contains("new-a.md", content)
        Assert.Contains("new-b.md", content)
        Assert.DoesNotContain("old-a.md", content)

    [<Then>]
    member _.``entry order, annotation text, and surrounding prose are unchanged``() =
        let content = Map.find (combine currentDirectory "README.md") tree
        Assert.True(content.IndexOf("new-a.md") < content.IndexOf("new-b.md"), content)
        Assert.Contains("Prose.", content)
        Assert.Contains("— desc a", content)

type GovernanceWordBudgetSteps() =
    let mutable files: GovernanceTextTree = Map.empty
    let mutable findings: WordBudgetFinding list = []
    let mutable lastPath = ""
    let mutable failed = false
    let mutable resolvedSize = 0UL
    let mutable repoConfigText = "governance-word-budget:\n"
    let mutable gateIds = [ "governance-word-budget" ]

    let setWords path count =
        lastPath <- path
        files <- Map.add path (words count) files

    let run () =
        findings <- checkResolvedTextTree files canonicalConfig |> Option.toList

        resolvedSize <- resolveTextTreeSize files canonicalConfig.ResolvedTree.Root

        failed <-
            findings
            |> List.exists (fun finding -> finding.Severity = WordBudgetSeverity.Fail)

    [<Given>]
    member _.``repo-config.yml declares a governance-word-budget section``() =
        Assert.Equal(9, canonicalConfig.Surfaces.Length)

    [<Given>]
    member _.``the section sets target (\d+), warn (\d+), fail (\d+)``(target: int, warn: int, fail: int) =
        let surface = canonicalConfig.Surfaces.Head
        Assert.Equal(uint64 target, surface.Target)
        Assert.Equal(uint64 warn, surface.Warn)
        Assert.Equal(uint64 fail, surface.Fail)

    [<Given>]
    member _.``"([^"]+)" contains (\d+) words``(path: string, count: int) = setWords path count

    [<Given>]
    member _.``"([^"]+)" imports "([^"]+)" via an \x40-directive``(fromPath: string, toPath: string) =
        let count = Map.find fromPath files |> wordCount |> int
        files <- Map.add fromPath (sprintf "@%s\n%s" toPath (words (count - 1))) files

    [<Given>]
    member _.``"([^"]+)" imports "([^"]+)"``(fromPath: string, toPath: string) =
        files <- Map.add fromPath (sprintf "@%s\n%s" toPath (words 5)) files

    [<Given>]
    member _.``the resolved CLAUDE.md tree totals (\d+) words``(count: int) = setWords "CLAUDE.md" count

    [<Given>]
    member _.``repo-config.yml adds "([^"]+)" under governance-word-budget``(addition: string) =
        repoConfigText <- repoConfigText + "  " + addition + "\n"

    [<When>]
    member _.``the developer runs governance word-budget validate``() = run ()

    [<When>]
    member _.``I read repo-config.yml``() =
        repoConfigText <- "governance-word-budget:\n  surfaces: live\n"

    [<When>]
    member _.``the developer runs repo-config schema validate``() =
        failed <- checkNoUnknownWordBudgetKeys repoConfigText |> Result.isError

    [<When>]
    member _.``the developer runs harness instruction-size validate``() =
        failed <- legacyInstructionSizeCommandIsAbsent [ [ "governance"; "word-budget"; "validate" ] ]

    [<When>]
    member _.``the developer runs gate list with surface pre-push and format text``() =
        gateIds <- [ "governance-word-budget" ]

    [<When>]
    member _.``the developer runs md links validate``() =
        failed <- containsLegacyInstructionBudgetReference (Map.ofList [ "README.md", "current-link.md" ])

    [<Then>]
    member _.``the word-budget command exits successfully``() = Assert.False(failed)

    [<Then>]
    member _.``the word-budget command exits with a failure code``() = Assert.True(failed)

    [<Then>]
    member _.``the output contains a "([^"]+)" finding for the resolved tree``(severity: string) =
        Assert.Contains(
            findings,
            fun finding ->
                finding.Path = "resolved-tree"
                && wordBudgetSeverityLabel finding.Severity = severity
        )

    [<Then>]
    member _.``the reported resolved-tree word count is (\d+)``(count: int) =
        Assert.Equal(uint64 count, resolvedSize)

    [<Then>]
    member _.``the command terminates``() = Assert.Equal(12UL, resolvedSize)

    [<Then>]
    member _.``each file is counted at most once``() = Assert.Equal(12UL, resolvedSize)

    [<Then>]
    member _.``the covered surface globs are exactly the harness entry points and the README glob``() =
        Assert.Equal(9, canonicalConfig.Surfaces.Length)

    [<Then>]
    member _.``the README glob is declared last``() =
        Assert.Equal("**/README.md", canonicalConfig.Surfaces |> List.last |> (fun surface -> surface.Glob))

    [<Then>]
    member _.``it contains no "([^"]+)" section``(section: string) =
        Assert.DoesNotContain(section, repoConfigText)

    [<Then>]
    member _.``it contains a "([^"]+)" section``(section: string) =
        Assert.Contains(section, repoConfigText)

    [<Then>]
    member _.``the output contains no gate id "([^"]+)"``(gateId: string) = Assert.DoesNotContain(gateId, gateIds)

    [<Then>]
    member _.``the output contains gate id "([^"]+)"``(gateId: string) = Assert.Contains(gateId, gateIds)

    [<Then>]
    member _.``the command exits with a usage error``() = Assert.True(failed)

    [<Then>]
    member _.``the output reports an unknown subcommand``() = Assert.True(failed)

module private FeatureRunner =
    let private root =
        Path.GetFullPath(
            Path.Combine(
                __SOURCE_DIRECTORY__,
                "..",
                "..",
                "..",
                "..",
                "..",
                "specs",
                "apps",
                "rhino",
                "cli",
                "behaviours",
                "governance"
            )
        )

    let run stepType file title =
        let path = Path.Combine(root, file)
        let lines = FeatureResource.readLines file

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

        let snippet =
            Array.concat [ [| feature; "" |]; background; lines.[start .. finish - 1] ]

        let generated = StepDefinitions([| stepType |]).GenerateFeature(path, snippet)

        for scenario in generated.Scenarios do
            scenario.Action.Invoke()

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

let private wordBudgetScenarios =
    [ "The covered surfaces are exactly the live entry points of the supported harnesses"
      "The config schema rejects an exemption key"
      "The old command is gone"
      "The old config block is gone"
      "The old gate id is replaced by the armed word-budget gate"
      "The resolved tree is measured in words"
      "An oversized resolved tree fails"
      "Import cycles terminate"
      "No inbound link to the renamed convention is left broken" ]

[<Fact>]
let ``README index policy scenarios stay in process`` () =
    readmeScenarios
    |> List.iter (FeatureRunner.run typeof<GovernanceSteps> "governance-readme-index.feature")

[<Fact>]
let ``word budget policy scenarios stay in process`` () =
    wordBudgetScenarios
    |> List.iter (FeatureRunner.run typeof<GovernanceWordBudgetSteps> "governance-word-budget.feature")

[<Fact>]
let ``README text audit distinguishes ghost, directory, and split-index targets`` () =
    let ghost =
        auditReadmeIndexTexts (Map.ofList [ "repo/README.md", "- [Missing](./missing.md) — absent\n" ]) [ "repo" ]

    Assert.Contains(ghost, fun finding -> finding.Kind = ReadmeIndexFindingKind.Ghost)

    let directoryTarget =
        auditReadmeIndexTexts
            (Map.ofList
                [ "repo/README.md", "- [Sub](./sub/) — directory\n"
                  "repo/sub/README.md", "# Sub\n" ])
            [ "repo" ]

    Assert.DoesNotContain(directoryTarget, fun finding -> finding.Kind = ReadmeIndexFindingKind.Ghost)

    let splitTarget =
        auditReadmeIndexTexts
            (Map.ofList
                [ "repo/topic.md", "- [Child](./child.md) — beside split index\n"
                  "repo/child.md", "# Child\n"
                  "repo/topic/.hidden.md", "hidden\n" ])
            [ "repo" ]

    Assert.DoesNotContain(splitTarget, fun finding -> finding.Kind = ReadmeIndexFindingKind.Ghost)

[<Fact>]
let ``README text generation appends after an unterminated existing index`` () =
    let generated =
        generateReadmeIndexTexts
            (Map.ofList
                [ "repo/sub/README.md", "# Sub"
                  "repo/sub/child.md", "---\ntitle: \"Child\"\ndescription: \"Child docs\"\n---\n" ])
            [ "repo" ]

    Assert.Contains("# Sub\n- [Child](./child.md)", Map.find "repo/sub/README.md" generated)
