/// TickSpec step definitions binding
/// `governance-readme-index.feature`'s 18 scenarios (one a `Scenario
/// Outline` with 3 `Examples` rows) to `RhinoCli.Application.Governance`
/// [Repo-grounded —
/// `specs/apps/rhino/cli/behaviours/governance/governance-readme-index.feature`,
/// `apps/rhino-cli/src/application/governance/readme_index.rs`,
/// `apps/rhino-cli/src/commands/governance_validate_readme_index.rs`,
/// `apps/rhino-cli/src/commands/governance_generate_readme_index.rs`,
/// `apps/rhino-cli/src/commands/governance_rewrite_readme_index_paths.rs`].
///
/// Follows `MdSteps.fs`'s/`EnvStagedGuardSteps.fs`'s per-scenario slicing
/// convention: each xunit `[<Fact>]` below runs exactly one scenario,
/// extracted from the real, frozen feature file. `governance` is not yet
/// listed in `FSHARP_NAMESPACES` (that flip is later, separate Wave D
/// integration work), so every scenario below calls
/// `RhinoCli.Application.Governance`'s functions directly with an explicit
/// path list, never through CLI argv parsing.
///
/// Most fixture `Given` steps below name repo-realistic-looking paths (e.g.
/// `"repo-governance/conventions/formatting/"`, `".claude/skills/grill-me/
/// reference/"`) purely for narrative flavor: `.claude/skills/grill-me/
/// reference/` genuinely has a `README.md` in this very repository today, so
/// a scenario asserting it is missing one is necessarily building an
/// isolated, throwaway temp-directory fixture, not reading the real tree —
/// only the final path SEGMENT of each such label is used to name the
/// on-disk fixture directory (`resolveIndexFile`/the `directory "..."
/// contains ...` steps below), and every scenario's fixture lives under its
/// own fresh `scenarioRoot()` temp directory, always passed to
/// `Governance.auditReadmeIndex`/`generateReadmeIndex`/`rewriteIndexPaths`
/// as an explicit, absolute scan root — mirroring `readme_index.rs`'s own
/// unit tests, which likewise always pass a throwaway `TempDir` as the scan
/// root rather than exercising `DEFAULT_PATHS` against the real repository.
///
/// The two scenarios that DO need `DEFAULT_PATHS`'s actual routing behaviour
/// ("An uncovered tree is not scanned", "A generated mirror directory is not
/// scanned") deliberately leave `scanPathsOverride` unset so the shared "the
/// developer runs governance readme-index validate" `When` step falls back
/// to `Governance.resolveScanPaths []` — proving a fixture placed outside
/// `docs/`, `repo-governance/`, `specs/`, `.claude/` is never reached, the
/// same way `readme_index.rs`'s own
/// `scenario_a_generated_mirror_directory_is_not_scanned` test only ever
/// scans a `repo-governance` root and leaves an out-of-scope mirror tree
/// beside it.
///
/// The gate-id-rename scenario ("The Phase 1 rename introduces no
/// enforcement gap for orphan or ghost") is registry/fixture-only: it reads
/// this repository's own real `repo-config.yml` via
/// `RhinoCli.Application.RepoConfig` (mirroring `RepoConfigSteps.fs`'s
/// precedent for "the harness registry section of repo-config.yml") and
/// asserts on the gate-id list already recorded there — no new application
/// code, since the rename already landed in a prior, separate plan. The two
/// `unannotated` dark-launch/armed scenarios need no registry lookup at all:
/// `Governance.hasFailingFinding`'s own empty-vs-non-empty `failKinds`
/// branching IS the entire "armed" mechanism (there is no other "Phase 9
/// armed" flag anywhere in the source) — the armed scenario instead hardcods
/// the real `governance-readme-completeness` gate's registered `fail-kinds:
/// [missing, unannotated]` list, mirroring
/// `governance_validate_readme_index.rs`'s own
/// `scenario_unannotated_finding_kind_fails_once_armed_and_in_scope` unit
/// test, which does exactly the same thing.
module RhinoCli.Tests.Integration.Steps.GovernanceResourceSteps

/// Explicit static-coverage ownership; the validator scopes this file's
/// TickSpec bindings to these canonical features.
let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/governance/governance-readme-index.feature"
      "specs/apps/rhino/cli/behaviours/governance/governance-word-budget.feature" ]

let private consoleCaptureLock = obj ()

open System
open System.IO
open TickSpec
open Xunit
open RhinoCli.Application.Governance

/// Instance step-definition container — see `ConventionSteps.fs`'s module
/// doc comment for why TickSpec's one-instance-per-scenario lifecycle makes
/// instance-level mutable fields the idiomatic state-threading mechanism
/// here.
type GovernanceSteps() =
    let mutable scenarioRootDir: string option = None
    let mutable currentDir: string option = None
    let mutable scanPathsOverride: string list option = None
    let mutable lastFindings: ReadmeIndexFinding list = []
    let mutable activeFailKinds: string list = []
    let mutable lastIndexPath: string option = None

    // ---- "The --paths flag overrides the default scan scope" state ----
    let mutable explicitPathsFlag: string list option = None
    let mutable resolvedWithFlag: string list option = None
    let mutable resolvedWithoutFlag: string list option = None

    // ---- "The --fail-kinds flag ..." state ----
    let mutable syntheticFindings: ReadmeIndexFinding list = []

    // ---- gate-id-rename state ----
    let mutable gateIds: string list = []
    let mutable previousGate: (string * string) option = None

    // ---- generate/rewrite-paths state ----
    let mutable idempotentBefore: string option = None
    let mutable idempotentAfter: string option = None
    let mutable renameMap: (string * string) list = []

    let scenarioRoot () : string =
        match scenarioRootDir with
        | Some dir -> dir
        | None ->
            let dir =
                Path.Combine(Path.GetTempPath(), "rhino-cli-governance-" + Guid.NewGuid().ToString("N"))

            Directory.CreateDirectory dir |> ignore
            scenarioRootDir <- Some dir
            dir

    /// The final path segment of a repo-realistic-looking label — see this
    /// module's doc comment for why only the basename is used.
    let basename (p: string) : string =
        let trimmed = p.TrimEnd('/')
        let idx = trimmed.LastIndexOf('/')
        if idx < 0 then trimmed else trimmed.Substring(idx + 1)

    let dirPrefix (p: string) : string =
        let trimmed = p.TrimEnd('/')
        let idx = trimmed.LastIndexOf('/')
        if idx < 0 then "" else trimmed.Substring(0, idx)

    let useScenarioRootAsScanPath () =
        scanPathsOverride <- Some [ scenarioRoot () ]

    /// Resolves the on-disk index-file path a `"..." links ...`/`"..." does
    /// not link ...` step's quoted source label refers to: relative to the
    /// already-established `currentDir` when one exists, or — for the one
    /// scenario with no prior `directory "..." contains ...` step — derives
    /// a fresh directory from the label's own prefix.
    let resolveIndexFile (label: string) : string =
        match currentDir with
        | Some dir -> Path.Combine(dir, basename label)
        | None ->
            let prefix = dirPrefix label

            let newRoot =
                Path.Combine(scenarioRoot (), (if prefix = "" then "root" else basename prefix))

            Directory.CreateDirectory newRoot |> ignore
            currentDir <- Some newRoot
            useScenarioRootAsScanPath ()
            Path.Combine(newRoot, basename label)

    let ensureLinkTarget (baseDir: string) (rawTarget: string) : unit =
        let cleaned = rawTarget.Replace('\\', '/')

        let cleaned =
            if cleaned.StartsWith("./", StringComparison.Ordinal) then
                cleaned.Substring(2)
            else
                cleaned

        if cleaned <> "" then
            let full = Path.Combine(baseDir, cleaned.Replace('/', Path.DirectorySeparatorChar))

            if cleaned.EndsWith("/README.md", StringComparison.Ordinal) then
                if not (File.Exists full) then
                    Directory.CreateDirectory(Path.GetDirectoryName(full: string)) |> ignore
                    File.WriteAllText(full, "# Stub\n")
            elif not (File.Exists full) then
                let dir = Path.GetDirectoryName(full: string)

                if not (String.IsNullOrEmpty dir) then
                    Directory.CreateDirectory dir |> ignore

                File.WriteAllText(full, "x\n")

    let writeLinks (label: string) (links: string list) : unit =
        let indexPath = resolveIndexFile label
        lastIndexPath <- Some indexPath
        let dir = Path.GetDirectoryName(indexPath: string)
        links |> List.iter (ensureLinkTarget dir)
        let bullets = links |> List.mapi (fun i l -> sprintf "- [Item %d](%s)" i l)
        let content = "# Index\n\n" + String.Join("\n", bullets) + "\n"
        File.WriteAllText(indexPath, content)

    let runValidate () =
        let paths = scanPathsOverride |> Option.defaultValue (resolveScanPaths [])
        lastFindings <- auditReadmeIndex (scenarioRoot ()) paths

    // ---- Given: fixture construction ----

    [<Given>]
    member _.``directory "([^"]+)" contains "([^"]+)", "([^"]+)", "([^"]+)"``
        (dirLabel: string, f1: string, f2: string, f3: string)
        =
        let dir = Path.Combine(scenarioRoot (), basename dirLabel)
        Directory.CreateDirectory dir |> ignore

        [ f1; f2; f3 ]
        |> List.iter (fun f ->
            File.WriteAllText(Path.Combine(dir, f), (if f = "README.md" then "# Index\n" else "x\n")))

        currentDir <- Some dir
        useScenarioRootAsScanPath ()

    [<Given>]
    member _.``directory "([^"]+)" contains "([^"]+)"``(dirLabel: string, f1: string) =
        let dir = Path.Combine(scenarioRoot (), basename dirLabel)
        Directory.CreateDirectory dir |> ignore
        File.WriteAllText(Path.Combine(dir, f1), (if f1 = "README.md" then "# Index\n" else "x\n"))
        currentDir <- Some dir
        useScenarioRootAsScanPath ()

    [<Given>]
    member _.``directory "([^"]+)" contains "([^"]+)" and "([^"]+)"``(dirLabel: string, f1: string, f2: string) =
        let parent = currentDir |> Option.defaultValue (scenarioRoot ())
        let dir = Path.Combine(parent, basename dirLabel)
        Directory.CreateDirectory dir |> ignore

        [ f1; f2 ]
        |> List.iter (fun f -> File.WriteAllText(Path.Combine(dir, f), "x\n"))

    [<Given>]
    member _.``directory "([^"]+)" contains "([^"]+)" and no "([^"]+)"``
        (dirLabel: string, f1: string, _readme: string)
        =
        // The two "uncovered tree" fixtures always live outside DEFAULT_PATHS
        // — `scanPathsOverride` is deliberately left unset (see module doc
        // comment) so the shared validate `When` step falls back to
        // `resolveScanPaths []`.
        let dir =
            Path.Combine(scenarioRoot (), dirLabel.TrimEnd('/').Replace('/', Path.DirectorySeparatorChar))

        Directory.CreateDirectory dir |> ignore
        File.WriteAllText(Path.Combine(dir, f1), "x\n")
        currentDir <- Some dir

    [<Given>]
    member _.``directory "([^"]+)" contains (\d+) agent files``(dirLabel: string, count: int) =
        let dir =
            Path.Combine(scenarioRoot (), dirLabel.TrimEnd('/').Replace('/', Path.DirectorySeparatorChar))

        Directory.CreateDirectory dir |> ignore

        for i in 0 .. count - 1 do
            File.WriteAllText(Path.Combine(dir, sprintf "agent-%d.md" i), "x\n")

        currentDir <- Some dir

    [<Given>]
    member _.``it contains subdirectory "([^"]+)" containing "([^"]+)"``(subLabel: string, fileName: string) =
        let parent = currentDir |> Option.defaultValue (scenarioRoot ())
        let sub = Path.Combine(parent, basename subLabel)
        Directory.CreateDirectory sub |> ignore
        File.WriteAllText(Path.Combine(sub, fileName), (if fileName = "README.md" then "# Sub\n" else "x\n"))

    [<Given>]
    member _.``it contains no "([^"]+)"``(name: string) =
        let dir =
            currentDir
            |> Option.defaultWith (fun () -> failwith "a directory must be established first")

        let path = Path.Combine(dir, name)
        Assert.False(File.Exists(path) || Directory.Exists(path), sprintf "expected %s to be absent" path)

    [<Given>]
    member _.``file "([^"]+)" exists``(path: string) =
        let dir = Path.Combine(scenarioRoot (), basename (dirPrefix path))
        Directory.CreateDirectory dir |> ignore
        File.WriteAllText(Path.Combine(dir, basename path), "# Ai Agents\n")
        currentDir <- Some dir
        // The split-directory's parent ("agents/") is itself the scan root
        // here — it is legitimately exempt from its own missing-README
        // check even though it holds indexable content (the split-index
        // file), matching `readme_index.rs::audit_one_dir`'s root-exemption
        // rationale ("a caller passes a covered-tree root deliberately").
        // The child directory under test is never exempt.
        scanPathsOverride <- Some [ dir ]

    [<Given>]
    member _.``"([^"]+)" links "([^"]+)" and "([^"]+)"``(label: string, l1: string, l2: string) =
        writeLinks label [ l1; l2 ]

    [<Given>]
    member _.``"([^"]+)" links "([^"]+)"``(label: string, l1: string) = writeLinks label [ l1 ]

    [<Given>]
    member _.``"([^"]+)" links "([^"]+)" only``(label: string, l1: string) = writeLinks label [ l1 ]

    [<Given>]
    member _.``"([^"]+)" links "([^"]+)" with no annotation text``(label: string, l1: string) = writeLinks label [ l1 ]

    [<Given>]
    member _.``"([^"]+)" does not link "([^"]+)"``(label: string, _target: string) =
        let indexPath = resolveIndexFile label
        File.WriteAllText(indexPath, "# Index\n\nNo links here.\n")
        lastIndexPath <- Some indexPath

    [<Given>]
    member _.``it does not link "([^"]+)"``(target: string) =
        let indexPath =
            lastIndexPath
            |> Option.defaultWith (fun () -> failwith "an index must be established first")

        Assert.DoesNotContain(target, File.ReadAllText(indexPath))

    // ---- Given/When: gate-id-rename scenario ----

    [<Given>]
    member _.``gate id "([^"]+)" is armed at "([^"]+)" before Phase 1``(oldId: string, scope: string) =
        previousGate <- Some(oldId, scope)

    [<When>]
    member _.``Phase 1's rename lands and gate id "([^"]+)" replaces it``(newId: string) =
        match previousGate with
        | Some(oldId, scope) ->
            Assert.True(oldId <> newId)
            Assert.Equal("scope: all-file-type", scope)
        | None -> failwith "the pre-rename gate must be established first"

        match RhinoCli.Infrastructure.GitRoot.findRoot () with
        | Error message -> failwith message
        | Ok repoRoot ->
            match RhinoCli.Application.RepoConfig.load repoRoot with
            | Error message -> failwith message
            | Ok config -> gateIds <- config.Gates |> List.map (fun g -> g.Id)

    [<Then>]
    member _.``"([^"]+)" is armed at "([^"]+)" immediately, not deferred``(gateId: string, _scope: string) =
        Assert.Contains(gateId, gateIds)

    [<Then>]
    member _.``the published gate list command completed successfully``() = Assert.NotEmpty(gateIds)

    [<Then>]
    member _.``that output never shows both gate ids at once``() =
        Assert.DoesNotContain("md-readme-index", gateIds)
        Assert.Contains("governance-readme-index", gateIds)

    // ---- Given/When/Then: unannotated dark-launch/armed scenarios ----

    [<Given>]
    member _.``Phase 9 has not yet armed "([^"]+)"``(_gateId: string) = activeFailKinds <- []

    [<Given>]
    member _.``Phase 9 has armed "([^"]+)" at "([^"]+)"``(_gateId: string, _scope: string) =
        activeFailKinds <- [ "missing"; "unannotated" ]

    [<Given>]
    member _.``the changed paths include "([^"]+)"``(path: string) =
        let indexPath =
            lastIndexPath
            |> Option.defaultWith (fun () -> failwith "a changed index must be established first")

        Assert.Equal(basename path, Path.GetFileName(indexPath))
        scanPathsOverride <- Some [ scenarioRoot () ]

    [<When>]
    member _.``the developer runs gate run with surface pre-push``() = runValidate ()

    [<Then>]
    member _.``no finding of kind "([^"]+)" causes a failure``(kind: string) =
        Assert.False(hasFailingFinding lastFindings [])
        Assert.True(lastFindings |> List.exists (fun f -> f.Kind.Name = kind))

    // ---- When/Then: shared validate runner ----

    [<When>]
    member _.``the developer runs governance readme-index validate``() =
        activeFailKinds <- []
        runValidate ()

    [<Then>]
    member _.``the command exits successfully``() =
        Assert.False(hasFailingFinding lastFindings activeFailKinds)

    [<Then>]
    member _.``the command exits with a failure code``() =
        Assert.True(hasFailingFinding lastFindings activeFailKinds)

    [<Then>]
    member _.``the finding names "([^"]+)" as unindexed``(name: string) =
        Assert.True(
            lastFindings
            |> List.exists (fun f ->
                f.Kind = ReadmeIndexFindingKind.Orphan
                && (f.File.Contains name || f.Message.Contains name)),
            sprintf "expected an orphan finding naming %s: %A" name lastFindings
        )

    [<Then>]
    member _.``the finding names "([^"]+)" as unannotated``(name: string) =
        Assert.True(
            lastFindings
            |> List.exists (fun f ->
                f.Kind = ReadmeIndexFindingKind.Unannotated
                && (f.File.Contains name || f.Message.Contains name)),
            sprintf "expected an unannotated finding naming %s: %A" name lastFindings
        )

    // ---- Given/When/Then: --paths flag scenario ----

    [<Given>]
    member _.``the developer invokes governance readme-index validate with "--paths (.*)"``(pathsArg: string) =
        explicitPathsFlag <- Some [ pathsArg ]

    [<When>]
    member _.``the command runs``() =
        resolvedWithFlag <- Some(resolveScanPaths (explicitPathsFlag |> Option.defaultValue []))
        resolvedWithoutFlag <- Some(resolveScanPaths [])

    [<Then>]
    member _.``it scans only "([^"]+)", not the unmodified DEFAULT_PATHS list``(expected: string) =
        Assert.Equal<string list>([ expected ], resolvedWithFlag |> Option.defaultValue [])

    [<Then>]
    member _.``running it again with no "--paths" flag scans the unmodified DEFAULT_PATHS list``() =
        Assert.Equal<string list>(defaultPaths, resolvedWithoutFlag |> Option.defaultValue [])

    // ---- Given/When/Then: --fail-kinds flag scenario ----

    [<Given>]
    member _.``a scanned directory has one "orphan" finding and one "ghost" finding``() =
        syntheticFindings <-
            [ { File = "orphan.md"
                Severity = "high"
                Kind = ReadmeIndexFindingKind.Orphan
                Message = "orphan: orphan.md exists but is not linked" }
              { File = "ghost.md"
                Severity = "high"
                Kind = ReadmeIndexFindingKind.Ghost
                Message = "ghost: README.md links ghost.md, which does not exist" } ]

    [<When>]
    member _.``the developer runs governance readme-index validate with "--fail-kinds (.*)"``(kinds: string) =
        let failKinds = kinds.Split(' ') |> Array.toList
        activeFailKinds <- failKinds
        lastFindings <- syntheticFindings

    [<Then>]
    member _.``the exit code reflects only the "([^"]+)" finding``(_kind: string) =
        Assert.True(hasFailingFinding lastFindings activeFailKinds)
        Assert.False(hasFailingFinding lastFindings [ "missing-does-not-exist" ])

    [<Then>]
    member _.``the "([^"]+)" finding is still printed in the output``(kind: string) =
        Assert.True(lastFindings |> List.exists (fun f -> f.Kind.Name = kind))

    // ---- Given/When/Then: generate scenarios ----

    [<Given>]
    member _.``a covered directory contains a markdown file with description and when_to_use frontmatter, and no "README.md"``
        ()
        =
        let dir = Path.Combine(scenarioRoot (), "repo-governance", "widgets")
        Directory.CreateDirectory dir |> ignore

        let content =
            "---\ntitle: \"Widget\"\ndescription: \"Widget description\"\nwhen_to_use: \"Use it for widgets\"\n---\n\n# Widget\n"

        File.WriteAllText(Path.Combine(dir, "widget.md"), content)
        currentDir <- Some dir

    [<When>]
    member _.``the developer runs governance readme-index generate``() =
        generateReadmeIndex (scenarioRoot ()) [ scenarioRoot () ] |> ignore

    [<Then>]
    member _.``a "README.md" is written linking that file with a derived annotation``() =
        let readmePath = Path.Combine(currentDir |> Option.get, "README.md")
        Assert.True(File.Exists readmePath)
        let content = File.ReadAllText readmePath
        Assert.Contains("widget.md", content)
        Assert.Contains("—", content)
        Assert.Contains("Widget description", content)
        Assert.Contains("Use it for widgets", content)

    [<Given>]
    member _.``a covered directory already has a conforming "README.md"``() =
        let dir = Path.Combine(scenarioRoot (), "covered")
        Directory.CreateDirectory dir |> ignore
        File.WriteAllText(Path.Combine(dir, "note.md"), "---\ndescription: \"Note description\"\n---\n\n# Note\n")

        File.WriteAllText(
            Path.Combine(dir, "README.md"),
            "---\ntitle: \"Covered\"\n---\n\n# Covered\n\n- [Note](./note.md) — Note description\n"
        )

        currentDir <- Some dir

    [<When>]
    member _.``the developer runs governance readme-index generate twice``() =
        let readmePath = Path.Combine(currentDir |> Option.get, "README.md")
        generateReadmeIndex (scenarioRoot ()) [ scenarioRoot () ] |> ignore
        idempotentBefore <- Some(File.ReadAllText readmePath)
        generateReadmeIndex (scenarioRoot ()) [ scenarioRoot () ] |> ignore
        idempotentAfter <- Some(File.ReadAllText readmePath)

    [<Then>]
    member _.``the second run writes byte-identical content to the first``() =
        Assert.Equal(idempotentBefore |> Option.defaultValue "", idempotentAfter |> Option.defaultValue "")

    [<Given>]
    member _.``a directory already has a README.md index with hand-authored entry order``() =
        let dir = Path.Combine(scenarioRoot (), "ordered")
        Directory.CreateDirectory dir |> ignore
        File.WriteAllText(Path.Combine(dir, "a.md"), "# A\n")
        File.WriteAllText(Path.Combine(dir, "b.md"), "# B\n")
        File.WriteAllText(Path.Combine(dir, "c.md"), "# C\n")

        File.WriteAllText(
            Path.Combine(dir, "README.md"),
            "# Ordered\n\n- [B custom](./b.md) — hand text\n- [A custom](./a.md) — hand text\n"
        )

        currentDir <- Some dir

    [<Given>]
    member _.``a directory has no README.md index``() =
        let dir = Path.Combine(scenarioRoot (), "scaffold")
        Directory.CreateDirectory dir |> ignore
        File.WriteAllText(Path.Combine(dir, "x.md"), "---\ntitle: \"X\"\ndescription: \"X desc\"\n---\n\n# X\n")
        File.WriteAllText(Path.Combine(dir, "y.md"), "y\n")
        let sub = Path.Combine(dir, "sub")
        Directory.CreateDirectory sub |> ignore
        File.WriteAllText(Path.Combine(sub, "README.md"), "# Sub\n")
        currentDir <- Some dir

    [<When>]
    member _.``the maintainer runs rhino-cli governance readme-index generate on that directory``() =
        generateReadmeIndex (scenarioRoot ()) [ scenarioRoot () ] |> ignore

    [<Then>]
    member _.``the existing entries keep their order and annotations``() =
        let content = File.ReadAllText(Path.Combine(currentDir |> Option.get, "README.md"))

        let idxB =
            content.IndexOf("[B custom](./b.md) — hand text", StringComparison.Ordinal)

        let idxA =
            content.IndexOf("[A custom](./a.md) — hand text", StringComparison.Ordinal)

        Assert.True(idxB >= 0 && idxA >= 0 && idxB < idxA, content)

    [<Then>]
    member _.``only genuinely missing entries are appended``() =
        let content = File.ReadAllText(Path.Combine(currentDir |> Option.get, "README.md"))
        Assert.Contains("c.md", content)

    [<Then>]
    member _.``a complete annotated index is written``() =
        let readmePath = Path.Combine(currentDir |> Option.get, "README.md")
        Assert.True(File.Exists readmePath)

    [<Then>]
    member _.``every sibling file and subdirectory appears exactly once``() =
        let content = File.ReadAllText(Path.Combine(currentDir |> Option.get, "README.md"))

        let occurrences (needle: string) =
            (content.Length - content.Replace(needle, "").Length) / needle.Length

        Assert.Equal(1, occurrences "x.md")
        Assert.Equal(1, occurrences "y.md")
        Assert.Equal(1, occurrences "sub/README.md")

    // ---- Given/When/Then: rewrite-paths scenario ----

    [<Given>]
    member _.``a rename map of old and new paths for a directory's children``() =
        let dir = Path.Combine(scenarioRoot (), "renamed")
        Directory.CreateDirectory dir |> ignore

        File.WriteAllText(
            Path.Combine(dir, "README.md"),
            "# Renamed\n\nSome prose here.\n\n- [Old A](./old-a.md) — desc a\n- [Old B](./old-b.md) — desc b\n\nMore prose.\n"
        )

        File.WriteAllText(Path.Combine(dir, "old-a.md"), "a\n")
        File.WriteAllText(Path.Combine(dir, "old-b.md"), "b\n")
        currentDir <- Some dir
        renameMap <- [ "old-a.md", "new-a.md"; "old-b.md", "new-b.md" ]

    [<When>]
    member _.``the maintainer runs rhino-cli governance readme-index rewrite-paths with that map``() =
        rewriteIndexPaths (scenarioRoot ()) [ scenarioRoot () ] renameMap |> ignore

    [<Then>]
    member _.``every index link target is updated to its new path``() =
        let content = File.ReadAllText(Path.Combine(currentDir |> Option.get, "README.md"))
        Assert.Contains("./new-a.md", content)
        Assert.Contains("./new-b.md", content)
        Assert.DoesNotContain("old-a.md", content)
        Assert.DoesNotContain("old-b.md", content)

    [<Then>]
    member _.``entry order, annotation text, and surrounding prose are unchanged``() =
        let content = File.ReadAllText(Path.Combine(currentDir |> Option.get, "README.md"))
        Assert.Contains("Some prose here.", content)
        Assert.Contains("More prose.", content)
        Assert.Contains("— desc a", content)
        Assert.Contains("— desc b", content)
        let idxA = content.IndexOf("new-a.md", StringComparison.Ordinal)
        let idxB = content.IndexOf("new-b.md", StringComparison.Ordinal)
        Assert.True(idxA >= 0 && idxB >= 0 && idxA < idxB, content)

    [<AfterScenario>]
    member _.Cleanup() =
        match scenarioRootDir with
        | Some dir when Directory.Exists dir -> Directory.Delete(dir, true)
        | _ -> ()

/// Reads one named `Scenario:`/`Scenario Outline:` block out of the real,
/// frozen `governance-readme-index.feature` file (leaving the file itself
/// untouched) and runs it through TickSpec bound only against
/// `GovernanceSteps` — see `EnvStagedGuardSteps.fs`'s `FeatureRunner` for why
/// this is per-scenario rather than per-file, and why a `Scenario Outline`
/// runs every generated `Examples:` row.
module private FeatureRunner =

    let private featurePath: string =
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
                "governance",
                "governance-readme-index.feature"
            )
        )

    let private extractScenario (featureLines: string[]) (scenarioTitle: string) : string[] =
        let featureLine =
            featureLines
            |> Array.find (fun l -> l.TrimStart().StartsWith("Feature:", StringComparison.Ordinal))

        let startIdx =
            featureLines
            |> Array.findIndex (fun l ->
                let trimmed = l.Trim()

                trimmed = sprintf "Scenario: %s" scenarioTitle
                || trimmed = sprintf "Scenario Outline: %s" scenarioTitle)

        let endIdx =
            featureLines
            |> Array.skip (startIdx + 1)
            |> Array.tryFindIndex (fun l ->
                let trimmed = l.Trim()

                trimmed.StartsWith("Scenario:", StringComparison.Ordinal)
                || trimmed.StartsWith("Scenario Outline:", StringComparison.Ordinal)
                || trimmed.StartsWith("@", StringComparison.Ordinal)
                || trimmed.StartsWith("# Exemption(", StringComparison.Ordinal))
            |> Option.map (fun relativeIdx -> startIdx + 1 + relativeIdx)
            |> Option.defaultValue featureLines.Length

        Array.append [| featureLine; "" |] featureLines.[startIdx .. endIdx - 1]

    /// Runs every generated sub-scenario for `scenarioTitle`, bound against
    /// `GovernanceSteps`. A plain `Scenario:` generates exactly one; the
    /// `Scenario Outline:` generates one per `Examples:` row.
    let run (scenarioTitle: string) : unit =
        let allLines = File.ReadAllLines featurePath
        let snippet = extractScenario allLines scenarioTitle
        let definitions = StepDefinitions([| typeof<GovernanceSteps> |])
        let feature = definitions.GenerateFeature(featurePath, snippet)

        for scenario in feature.Scenarios do
            scenario.Action.Invoke()

[<Fact>]
let ``A complete index passes`` () =
    FeatureRunner.run "A complete index passes"

[<Fact>]
let ``A missing sibling link fails`` () =
    FeatureRunner.run "A missing sibling link fails"

[<Fact>]
let ``A missing subdirectory README link fails`` () =
    FeatureRunner.run "A missing subdirectory README link fails"

[<Fact>]
let ``The rule does not reach grandchildren`` () =
    FeatureRunner.run "The rule does not reach grandchildren"

[<Fact>]
let ``A split directory whose parent omits a child fails`` () =
    FeatureRunner.run "A split directory whose parent omits a child fails"

[<Fact>]
let ``An uncovered tree is not scanned`` () =
    FeatureRunner.run "An uncovered tree is not scanned"

[<Fact>]
let ``A generated mirror directory is not scanned`` () =
    FeatureRunner.run "A generated mirror directory is not scanned"

[<Fact>]
let ``The Phase 1 rename introduces no enforcement gap for orphan or ghost`` () =
    FeatureRunner.run "The Phase 1 rename introduces no enforcement gap for orphan or ghost"

[<Fact>]
let ``The unannotated finding kind is dark-launched, not enforced, before Phase 9`` () =
    FeatureRunner.run "The unannotated finding kind is dark-launched, not enforced, before Phase 9"

[<Fact>]
let ``The unannotated finding kind fails once armed and in scope`` () =
    FeatureRunner.run "The unannotated finding kind fails once armed and in scope"

[<Fact>]
let ``The --paths flag overrides the default scan scope`` () =
    FeatureRunner.run "The --paths flag overrides the default scan scope"

[<Fact>]
let ``The --fail-kinds flag restricts which findings contribute to the exit code`` () =
    FeatureRunner.run "The --fail-kinds flag restricts which findings contribute to the exit code"

[<Fact>]
let ``generate writes a conforming annotated index for a directory needing one`` () =
    FeatureRunner.run "generate writes a conforming annotated index for a directory needing one"

[<Fact>]
let ``generate is idempotent`` () =
    FeatureRunner.run "generate is idempotent"

[<Fact>]
let ``Generate no longer rewrites an existing index's order`` () =
    FeatureRunner.run "Generate no longer rewrites an existing index's order"

[<Fact>]
let ``Generate still scaffolds a directory with no index`` () =
    FeatureRunner.run "Generate still scaffolds a directory with no index"

[<Fact>]
let ``Rewrite-paths updates link targets without touching order`` () =
    FeatureRunner.run "Rewrite-paths updates link targets without touching order"

// =============================================================================
// `governance-word-budget.feature` — 20 scenarios (Wave D PR9)
// =============================================================================

/// Builds `n` single-character, single-space-separated "words" — content
/// whose `wordCount` is exactly `n`, the same fixture-construction trick
/// `word_budget.rs`'s own test module uses (`n_words`).
let private nWords (n: int) : string =
    String.Join(" ", Array.create (max 0 n) "w")

/// Mirrors the live `governance-word-budget:` section of `repo-config.yml`
/// verbatim (see that file): eight general surfaces at target 650/warn
/// 750/fail 750 (including `RTK.md`, added alongside the RTK tool), `**/README.md`
/// declared last at the wider 900/1000/1000, and a `CLAUDE.md`-rooted
/// resolved tree at 1200/1500/1500 — exactly what the feature's
/// `Background:` (dropped from the per-scenario TickSpec snippet below
/// along with its two steps, since no scenario needs it re-declared at
/// runtime; its state is this fixture) and every scenario's own prose
/// numbers already assume.
let private canonicalWordBudgetConfig: BudgetConfig =
    let generalSurface (glob: string) : Surface =
        { Glob = glob
          Target = 650UL
          Warn = 750UL
          Fail = 750UL }

    { Surfaces =
        [ generalSurface "repo-governance/**/*.md"
          generalSurface ".claude/**/*.md"
          generalSurface ".codex/**/*.md"
          generalSurface ".opencode/**/*.md"
          generalSurface ".agents/**/*.md"
          generalSurface "AGENTS.md"
          generalSurface "CLAUDE.md"
          generalSurface "RTK.md"
          { Glob = "**/README.md"
            Target = 900UL
            Warn = 1000UL
            Fail = 1000UL } ]
      ResolvedTree =
        { Root = "CLAUDE.md"
          Target = 1200UL
          Warn = 1500UL
          Fail = 1500UL } }

/// Instance step-definition container for `governance-word-budget.feature`
/// — see `GovernanceSteps`'s doc comment above for why TickSpec's
/// one-instance-per-scenario lifecycle makes instance-level mutable fields
/// the idiomatic state-threading mechanism here. Every fixture lives under
/// its own fresh `scenarioRoot()` temp directory, mirroring
/// `word_budget.rs`'s own tests, which always pass a throwaway `TempDir` as
/// `repoRoot` — except the handful of scenarios that are explicitly
/// registry/text proxy checks against THIS repository's own live
/// `repo-config.yml`/governance tree (see `Governance.fs`'s module doc
/// comment for why those stay proxy checks), which use
/// `RhinoCli.Infrastructure.GitRoot.findRoot` instead, mirroring
/// `RepoConfigValidateSteps.fs`'s precedent for the same distinction.
type GovernanceWordBudgetSteps() =
    let mutable scenarioRootDir: string option = None
    let mutable lastFindings: WordBudgetFinding list = []
    let mutable lastExitFailed: bool = false
    let mutable lastPath: string option = None
    let mutable lastResolvedTreeSize: uint64 = 0UL
    let mutable declaredWordCounts: Map<string, int> = Map.empty
    let mutable liveRepoConfigText: string = ""
    let mutable liveWordBudgetConfig: BudgetConfig option = None
    let mutable gateIds: string list = []
    let mutable schemaFixtureYaml: string = ""
    let mutable configuredWordBudget: BudgetConfig option = None
    let mutable legacyCommandExitCode: int option = None
    let mutable legacyCommandError: string = ""

    let scenarioRoot () : string =
        match scenarioRootDir with
        | Some dir -> dir
        | None ->
            let dir =
                Path.Combine(Path.GetTempPath(), "rhino-cli-word-budget-" + Guid.NewGuid().ToString("N"))

            Directory.CreateDirectory dir |> ignore
            scenarioRootDir <- Some dir
            dir

    let writeWordsAt (relPath: string) (n: int) : unit =
        let full =
            Path.Combine(scenarioRoot (), relPath.Replace('/', Path.DirectorySeparatorChar))

        let dir = Path.GetDirectoryName(full: string)

        if not (String.IsNullOrEmpty dir) then
            Directory.CreateDirectory dir |> ignore

        File.WriteAllText(full, nWords n)
        lastPath <- Some relPath
        declaredWordCounts <- Map.add relPath n declaredWordCounts

    let runValidate () =
        let root = scenarioRoot ()

        let config =
            configuredWordBudget
            |> Option.defaultWith (fun () -> failwith "word-budget config not established")

        lastFindings <- checkResolvedTree root config |> Option.toList

        lastResolvedTreeSize <- resolveTreeSize (Path.Combine(root, config.ResolvedTree.Root))

        lastExitFailed <- lastFindings |> List.exists (fun f -> f.Severity = WordBudgetSeverity.Fail)

    let findRepoRoot () : string =
        match RhinoCli.Infrastructure.GitRoot.findRoot () with
        | Error message -> failwith message
        | Ok repoRoot -> repoRoot

    // ---- Given: Background (state is `canonicalWordBudgetConfig`, built above) ----

    [<Given>]
    member _.``repo-config.yml declares a governance-word-budget section``() =
        configuredWordBudget <- Some canonicalWordBudgetConfig

    [<Given>]
    member _.``the section sets target (\d+), warn (\d+), fail (\d+)``(target: int, warn: int, fail: int) =
        let config =
            configuredWordBudget
            |> Option.defaultWith (fun () -> failwith "word-budget config not established")

        configuredWordBudget <-
            Some
                { config with
                    Surfaces =
                        config.Surfaces
                        |> List.map (fun surface ->
                            if surface.Glob = "**/README.md" then
                                surface
                            else
                                { surface with
                                    Target = uint64 target
                                    Warn = uint64 warn
                                    Fail = uint64 fail }) }

    // ---- Given: fixture construction ----

    [<Given>]
    member _.``"([^"]+)" contains (\d+) words``(path: string, n: int) = writeWordsAt path n

    // F#'s lexer rejects an '@' character inside a double-backtick
    // identifier (FS1104) — unlike every other step in this file, this
    // step's text carries a literal '@'. `\x40` is the regex hex escape for
    // '@' (0x40 = ASCII 64): it contains no literal '@' character in the F#
    // source, so the lexer accepts it, while still matching a literal '@'
    // in the actual Gherkin step text at runtime (the same reason the
    // coverage tool's F# extractor requires the bare `[<Given>]` + backtick
    // form here — it does not recognize the attribute's `string`
    // constructor overload as a step definition at all).
    [<Given>]
    member _.``"([^"]+)" imports "([^"]+)" via an \x40-directive``(fromPath: string, toPath: string) =
        // Overwrites the file the earlier `"..." contains N words` step
        // wrote, preserving that step's stated total word count while
        // replacing its first token with the `@`-import directive —
        // mirrors `word_budget.rs`'s own fixture, whose CLAUDE.md word
        // count already includes the import line itself.
        let totalWords = declaredWordCounts |> Map.tryFind fromPath |> Option.defaultValue 1

        let bodyWords = max 0 (totalWords - 1)
        let content = sprintf "@%s\n%s" toPath (nWords bodyWords)
        File.WriteAllText(Path.Combine(scenarioRoot (), fromPath), content)

    [<Given>]
    member _.``"([^"]+)" imports "([^"]+)"``(fromPath: string, toPath: string) =
        let content = sprintf "@%s\n%s" toPath (nWords 5)
        File.WriteAllText(Path.Combine(scenarioRoot (), fromPath), content)

    [<Given>]
    member _.``the resolved CLAUDE.md tree totals (\d+) words``(n: int) =
        writeWordsAt canonicalWordBudgetConfig.ResolvedTree.Root n

    [<Given>]
    member _.``repo-config.yml adds "([^"]+)" under governance-word-budget``(addition: string) =
        schemaFixtureYaml <-
            "governance-word-budget:\n"
            + "  surfaces:\n"
            + "    - glob: \"AGENTS.md\"\n"
            + "      target: 400\n"
            + "      warn: 500\n"
            + "      fail: 500\n"
            + "  resolved_tree:\n"
            + "    root: \"CLAUDE.md\"\n"
            + "    target: 1200\n"
            + "    warn: 1500\n"
            + "    fail: 1500\n"
            + "  "
            + addition
            + "\n"

    // ---- When ----

    [<When>]
    member _.``the developer runs governance word-budget validate``() = runValidate ()

    [<When>]
    member _.``I read repo-config.yml``() =
        let repoRoot = findRepoRoot ()
        liveRepoConfigText <- File.ReadAllText(Path.Combine(repoRoot, "repo-config.yml"))

        match mergedBudgetConfig repoRoot with
        | Error message -> failwith message
        | Ok cfg -> liveWordBudgetConfig <- cfg

    [<When>]
    member _.``the developer runs repo-config schema validate``() =
        lastExitFailed <-
            match checkNoUnknownWordBudgetKeys schemaFixtureYaml with
            | Ok() -> false
            | Error _ -> true

    [<When>]
    member _.``the developer runs harness instruction-size validate``() =
        lock consoleCaptureLock (fun () ->
            use errorWriter = new StringWriter()
            let originalError = Console.Error

            try
                Console.SetError(errorWriter)

                legacyCommandExitCode <-
                    Some(
                        RhinoCli.Cli.Dispatch.route
                            (fun () -> Ok(scenarioRoot ()))
                            [| "harness"; "instruction-size"; "validate" |]
                    )

                legacyCommandError <- errorWriter.ToString()
            finally
                Console.SetError(originalError))

    [<When>]
    member _.``the developer runs gate list with surface pre-push and format text``() =
        let repoRoot = findRepoRoot ()

        match RhinoCli.Application.RepoConfig.load repoRoot with
        | Error message -> failwith message
        | Ok cfg -> gateIds <- cfg.Gates |> List.map (fun g -> g.Id)

    /// Proxy check mirroring `word_budget.rs`'s own
    /// `scenario_no_inbound_link_to_the_renamed_convention_is_left_broken`
    /// test: greps the governed trees for the convention doc's pre-rename
    /// name rather than exercising a real `md links validate` command,
    /// which is not yet ported to F# at all (`Md.fs` has no links-validate
    /// function yet — a later, separate Wave D PR's scope).
    [<When>]
    member _.``the developer runs md links validate``() =
        let repoRoot = findRepoRoot ()
        let staleNeedle = "instruction-file-size-budget.md"

        let containsStaleNeedle (path: string) : bool =
            (File.ReadAllText path).Contains(staleNeedle, StringComparison.Ordinal)

        let treeOffenders =
            [ "repo-governance"; ".claude"; "docs" ]
            |> List.collect (fun dir ->
                let root = Path.Combine(repoRoot, dir)

                if not (Directory.Exists root) then
                    []
                else
                    Directory.GetFiles(root, "*.md", SearchOption.AllDirectories)
                    |> Array.filter containsStaleNeedle
                    |> Array.toList)

        let agentsMdPath = Path.Combine(repoRoot, "AGENTS.md")

        let agentsOffender =
            if File.Exists agentsMdPath && containsStaleNeedle agentsMdPath then
                [ agentsMdPath ]
            else
                []

        lastExitFailed <- not (List.isEmpty (treeOffenders @ agentsOffender))

    // ---- Then: shared exit-code steps ----

    [<Then>]
    member _.``the word-budget command exits successfully``() = Assert.False(lastExitFailed)

    [<Then>]
    member _.``the word-budget command exits with a failure code``() = Assert.True(lastExitFailed)

    // ---- Then: finding-presence steps ----

    [<Then>]
    member _.``the output contains a "([^"]+)" finding for the resolved tree``(sev: string) =
        Assert.True(
            lastFindings
            |> List.exists (fun f -> f.Path = "resolved-tree" && wordBudgetSeverityLabel f.Severity = sev)
        )

    // ---- Then: finding-detail steps ----

    [<Then>]
    member _.``the reported resolved-tree word count is (\d+)``(n: int) =
        Assert.Equal(uint64 n, lastResolvedTreeSize)

    // ---- Then: narrative-only steps (the real assertion already ran above) ----

    [<Then>]
    member _.``the command terminates``() =
        Assert.Equal(12UL, lastResolvedTreeSize)

    /// `resolveRecursive`'s cycle guard is what makes this assertion (see
    /// below) return at all rather than stack-overflow/hang — termination
    /// is proven by construction, not asserted separately.
    [<Then>]
    member _.``each file is counted at most once``() =
        // CLAUDE.md = "@AGENTS.md" (1 token) + 5 body words = 6; AGENTS.md =
        // "@CLAUDE.md" (1 token) + 5 body words = 6. A cycle-guard failure
        // would double-count past 12.
        Assert.Equal(12UL, lastResolvedTreeSize)

    // ---- Then: repo-config.yml registry/text proxy steps ----

    [<Then>]
    member _.``the covered surface globs are exactly the harness entry points and the README glob``() =
        let expected =
            set
                [ "repo-governance/**/*.md"
                  ".claude/**/*.md"
                  ".codex/**/*.md"
                  ".opencode/**/*.md"
                  ".agents/**/*.md"
                  "AGENTS.md"
                  "CLAUDE.md"
                  "RTK.md"
                  "**/README.md" ]

        let actual =
            liveWordBudgetConfig
            |> Option.map (fun c -> c.Surfaces |> List.map (fun s -> s.Glob) |> Set.ofList)
            |> Option.defaultValue Set.empty

        Assert.Equal<Set<string>>(expected, actual)

    [<Then>]
    member _.``the README glob is declared last``() =
        let last =
            liveWordBudgetConfig
            |> Option.bind (fun c -> c.Surfaces |> List.tryLast)
            |> Option.map (fun s -> s.Glob)

        Assert.Equal(Some "**/README.md", last)

    [<Then>]
    member _.``it contains no "([^"]+)" section``(needle: string) =
        Assert.DoesNotContain(needle, liveRepoConfigText)

    [<Then>]
    member _.``it contains a "([^"]+)" section``(needle: string) =
        Assert.Contains(needle, liveRepoConfigText)

    [<Then>]
    member _.``the output contains no gate id "([^"]+)"``(id: string) = Assert.DoesNotContain(id, gateIds)

    [<Then>]
    member _.``the output contains gate id "([^"]+)"``(id: string) = Assert.Contains(id, gateIds)

    [<Then>]
    member _.``the command exits with a usage error``() =
        Assert.Equal(Some 2, legacyCommandExitCode)

    [<Then>]
    member _.``the output reports an unknown subcommand``() =
        Assert.Contains("unrecognized or not-yet-routed invocation", legacyCommandError)

    [<AfterScenario>]
    member _.Cleanup() =
        match scenarioRootDir with
        | Some dir when Directory.Exists dir -> Directory.Delete(dir, true)
        | _ -> ()

/// Reads one named `Scenario:`/`Scenario Outline:` block out of the real,
/// frozen `governance-word-budget.feature` file, INCLUDING its
/// `Background:` block (unlike `FeatureRunner` above, whose bound feature
/// file has none) since every scenario here depends on it, and runs it
/// through TickSpec bound only against `GovernanceWordBudgetSteps`.
module private WordBudgetFeatureRunner =

    let private featurePath: string =
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
                "governance",
                "governance-word-budget.feature"
            )
        )

    let private extractScenario (featureLines: string[]) (scenarioTitle: string) : string[] =
        let featureLine =
            featureLines
            |> Array.find (fun l -> l.TrimStart().StartsWith("Feature:", StringComparison.Ordinal))

        let backgroundStart =
            featureLines |> Array.tryFindIndex (fun l -> l.Trim() = "Background:")

        // The Background block always sits before every scenario, exactly
        // once — its end is the first `Scenario:`/`Scenario Outline:` line
        // anywhere in the file, NOT `startIdx - 1` (which would instead
        // span every scenario between the Background and the one actually
        // being sliced, for every scenario after the first).
        let firstScenarioIdx =
            backgroundStart
            |> Option.bind (fun bIdx ->
                featureLines
                |> Array.skip (bIdx + 1)
                |> Array.tryFindIndex (fun l ->
                    let trimmed = l.Trim()

                    trimmed.StartsWith("Scenario:", StringComparison.Ordinal)
                    || trimmed.StartsWith("Scenario Outline:", StringComparison.Ordinal))
                |> Option.map (fun relativeIdx -> bIdx + 1 + relativeIdx))

        let startIdx =
            featureLines
            |> Array.findIndex (fun l ->
                let trimmed = l.Trim()

                trimmed = sprintf "Scenario: %s" scenarioTitle
                || trimmed = sprintf "Scenario Outline: %s" scenarioTitle)

        let endIdx =
            featureLines
            |> Array.skip (startIdx + 1)
            |> Array.tryFindIndex (fun l ->
                let trimmed = l.Trim()

                trimmed.StartsWith("Scenario:", StringComparison.Ordinal)
                || trimmed.StartsWith("Scenario Outline:", StringComparison.Ordinal)
                || trimmed.StartsWith("@", StringComparison.Ordinal)
                || trimmed.StartsWith("# Exemption(", StringComparison.Ordinal))
            |> Option.map (fun relativeIdx -> startIdx + 1 + relativeIdx)
            |> Option.defaultValue featureLines.Length

        let backgroundLines =
            match backgroundStart, firstScenarioIdx with
            | Some bIdx, Some sIdx when sIdx > bIdx -> featureLines.[bIdx .. sIdx - 1]
            | _ -> [||]

        Array.concat
            [ [| featureLine; "" |]
              backgroundLines
              featureLines.[startIdx .. endIdx - 1] ]

    /// Runs every generated sub-scenario for `scenarioTitle`, bound against
    /// `GovernanceWordBudgetSteps`. A plain `Scenario:` generates exactly
    /// one; a `Scenario Outline:` generates one per `Examples:` row.
    let run (scenarioTitle: string) : unit =
        let allLines = File.ReadAllLines featurePath
        let snippet = extractScenario allLines scenarioTitle
        let definitions = StepDefinitions([| typeof<GovernanceWordBudgetSteps> |])
        let feature = definitions.GenerateFeature(featurePath, snippet)

        for scenario in feature.Scenarios do
            scenario.Action.Invoke()

[<Fact>]
let ``The covered surfaces are exactly the live entry points of the supported harnesses`` () =
    WordBudgetFeatureRunner.run "The covered surfaces are exactly the live entry points of the supported harnesses"

[<Fact>]
let ``The config schema rejects an exemption key`` () =
    WordBudgetFeatureRunner.run "The config schema rejects an exemption key"

[<Fact>]
let ``The old command is gone`` () =
    WordBudgetFeatureRunner.run "The old command is gone"

[<Fact>]
let ``The old config block is gone`` () =
    WordBudgetFeatureRunner.run "The old config block is gone"

[<Fact>]
let ``The old gate id is replaced by the armed word-budget gate`` () =
    WordBudgetFeatureRunner.run "The old gate id is replaced by the armed word-budget gate"

[<Fact>]
let ``The resolved tree is measured in words`` () =
    WordBudgetFeatureRunner.run "The resolved tree is measured in words"

[<Fact>]
let ``An oversized resolved tree fails`` () =
    WordBudgetFeatureRunner.run "An oversized resolved tree fails"

[<Fact>]
let ``Import cycles terminate`` () =
    WordBudgetFeatureRunner.run "Import cycles terminate"

[<Fact>]
let ``No inbound link to the renamed convention is left broken`` () =
    WordBudgetFeatureRunner.run "No inbound link to the renamed convention is left broken"

// ---- Plain unit tests targeting coverage gaps not reachable via the Gherkin
// corpus above: normalization edge cases, ghost/split-index/present-fallback
// findings, frontmatter-parsing fallbacks, split-index update mechanics,
// rewrite-paths edge cases, and the word-budget config-parsing branches.

module private GovernanceUnitTestFixtures =
    let newTempDir (prefix: string) : string =
        let dir =
            Path.Combine(Path.GetTempPath(), sprintf "rhino-cli-governance-%s-%s" prefix (Guid.NewGuid().ToString("N")))

        Directory.CreateDirectory(dir) |> ignore
        dir

open GovernanceUnitTestFixtures

[<Fact>]
let ``auditReadmeIndex normalizes absolute, URL-like, and fragment link targets while flagging unannotated bare links``
    ()
    =
    let root = newTempDir "linktargets"

    try
        File.WriteAllText(Path.Combine(root, "bar.md"), "bar")
        File.WriteAllText(Path.Combine(root, "orphan.md"), "orphan")
        File.WriteAllText(Path.Combine(root, "orphan2.md"), "orphan2")

        File.WriteAllText(
            Path.Combine(root, "README.md"),
            "# Index\n\n"
            + "- [Bar](bar.md)\n"
            + "- [Abs](/abs.md)\n"
            + "- [Url](https://example.com/x.md)\n"
            + "- [Frag](./bar.md#section)\n"
            + "- [Orphan2](orphan2.md)\n"
        )

        let findings = auditReadmeIndex root [ root ]

        let orphanFindings =
            findings |> List.filter (fun f -> f.Kind = ReadmeIndexFindingKind.Orphan)

        Assert.Single(orphanFindings) |> ignore
        Assert.Contains(orphanFindings, fun f -> f.File.Contains "orphan.md")

        let unannotated =
            findings |> List.filter (fun f -> f.Kind = ReadmeIndexFindingKind.Unannotated)

        Assert.Contains(unannotated, fun f -> f.File.Contains "bar.md")
        Assert.Contains(unannotated, fun f -> f.File.Contains "orphan2.md")
        Assert.DoesNotContain(findings, fun f -> f.Message.Contains "abs.md")
        Assert.DoesNotContain(findings, fun f -> f.Message.Contains "example.com")
    finally
        Directory.Delete(root, true)

[<Fact>]
let ``auditReadmeIndex reports a ghost finding for a split-index link with no target on disk`` () =
    let root = newTempDir "ghost"

    try
        Directory.CreateDirectory(Path.Combine(root, "child")) |> ignore
        File.WriteAllText(Path.Combine(root, "general.md"), "general")

        File.WriteAllText(
            Path.Combine(root, "child.md"),
            "# Child\n\n"
            + "- [General](general.md) — shared general doc\n"
            + "- [Truly Missing](truly-missing.md) — ghost target\n"
        )

        let findings = auditReadmeIndex root [ root ]

        let ghostFindings =
            findings |> List.filter (fun f -> f.Kind = ReadmeIndexFindingKind.Ghost)

        Assert.Single(ghostFindings) |> ignore
        Assert.Contains(ghostFindings, fun f -> f.Message.Contains "truly-missing.md")
        Assert.Equal("ghost", ghostFindings.[0].Kind.Name)

        Assert.DoesNotContain(
            findings,
            fun f -> f.Kind = ReadmeIndexFindingKind.Ghost && f.Message.Contains "general.md"
        )
    finally
        Directory.Delete(root, true)

[<Fact>]
let ``auditReadmeIndex recognizes a bare-directory link via the SiblingTargets Present fallback`` () =
    let root = newTempDir "present-fallback"

    try
        Directory.CreateDirectory(Path.Combine(root, "structure.md")) |> ignore
        File.WriteAllText(Path.Combine(root, "structure.md", "README.md"), "# Structure\n")

        File.WriteAllText(Path.Combine(root, "README.md"), "# Index\n\n- [Structure](structure.md) — annotated doc\n")

        let findings = auditReadmeIndex root [ root ]

        Assert.DoesNotContain(findings, fun f -> f.Kind = ReadmeIndexFindingKind.Ghost)
    finally
        Directory.Delete(root, true)

[<Fact>]
let ``auditReadmeIndex never walks into a dot-prefixed or skip-listed subdirectory`` () =
    let root = newTempDir "skiptest"

    try
        File.WriteAllText(Path.Combine(root, "README.md"), "# Index\n")

        Directory.CreateDirectory(Path.Combine(root, ".hidden")) |> ignore
        File.WriteAllText(Path.Combine(root, ".hidden", "README.md"), "# Hidden\n")

        Directory.CreateDirectory(Path.Combine(root, "node_modules")) |> ignore
        File.WriteAllText(Path.Combine(root, "node_modules", "README.md"), "# Vendored\n")

        let findings = auditReadmeIndex root [ root ]

        Assert.Empty(findings)
    finally
        Directory.Delete(root, true)

[<Fact>]
let ``generateReadmeIndex falls back to the file name when frontmatter is not a mapping or fails to parse`` () =
    let root = newTempDir "metatest"

    try
        let sub = Path.Combine(root, "metatest")
        Directory.CreateDirectory(sub) |> ignore

        File.WriteAllText(Path.Combine(sub, "weird.md"), "---\n- item1\n- item2\n---\n\n# Weird\n")
        File.WriteAllText(Path.Combine(sub, "badyaml.md"), "---\ntitle: \"unterminated\n---\n\n# Bad\n")

        generateReadmeIndex root [ root ] |> ignore

        let generated = File.ReadAllText(Path.Combine(sub, "README.md"))

        Assert.Contains("weird.md", generated)
        Assert.Contains("badyaml.md", generated)
        Assert.Contains("Weird", generated)
        Assert.Contains("Badyaml", generated)
    finally
        Directory.Delete(root, true)

[<Fact>]
let ``generateReadmeIndex appends a new entry to an already-existing split-index file`` () =
    let root = newTempDir "splitupdate"

    try
        File.WriteAllText(Path.Combine(root, "widgets.md"), "# Widgets\n")
        Directory.CreateDirectory(Path.Combine(root, "widgets")) |> ignore
        File.WriteAllText(Path.Combine(root, "widgets", "a.md"), "x\n")

        generateReadmeIndex root [ root ] |> ignore

        let content = File.ReadAllText(Path.Combine(root, "widgets.md"))
        Assert.Contains("./widgets/a.md", content)
    finally
        Directory.Delete(root, true)

[<Fact>]
let ``generateReadmeIndex treats a subdirectory already linked via its shorthand split-index name as satisfied`` () =
    let root = newTempDir "shorthand"

    try
        File.WriteAllText(Path.Combine(root, "README.md"), "# Root\n\n- [Sub](./sub.md)\n")
        Directory.CreateDirectory(Path.Combine(root, "sub")) |> ignore
        File.WriteAllText(Path.Combine(root, "sub", "README.md"), "# Sub\n")

        let before = File.ReadAllText(Path.Combine(root, "README.md"))
        generateReadmeIndex root [ root ] |> ignore
        let after = File.ReadAllText(Path.Combine(root, "README.md"))

        Assert.Equal(before, after)
    finally
        Directory.Delete(root, true)

[<Fact>]
let ``generateReadmeIndex appends at the end of an existing index file with no entries yet`` () =
    let root = newTempDir "noentries"

    try
        File.WriteAllText(Path.Combine(root, "README.md"), "# Title\n")
        File.WriteAllText(Path.Combine(root, "extra.md"), "body\n")

        generateReadmeIndex root [ root ] |> ignore

        let content = File.ReadAllText(Path.Combine(root, "README.md"))
        Assert.Contains("./extra.md", content)
        Assert.True(content.IndexOf("# Title") < content.IndexOf("./extra.md"))
    finally
        Directory.Delete(root, true)

[<Fact>]
let ``rewriteIndexPaths leaves a file untouched when none of its link targets match the rename map`` () =
    let root = newTempDir "norenames"

    try
        File.WriteAllText(
            Path.Combine(root, "doc.md"),
            "# Doc\n\n- [Keep](./keep-me.md)\n- [Nested](./sub/keep-me-too.md)\n\nSome text with a broken marker](unterminated\n"
        )

        let result = rewriteIndexPaths root [ root ] [ ("old.md", "new.md") ]

        Assert.Empty(result)
    finally
        Directory.Delete(root, true)

[<Fact>]
let ``rewriteIndexPaths accepts a direct md file path and rewrites a matching link`` () =
    let root = newTempDir "directmdpath"

    try
        let filePath = Path.Combine(root, "doc.md")
        File.WriteAllText(filePath, "[X](./old.md)")

        let result = rewriteIndexPaths root [ filePath ] [ ("old.md", "new.md") ]

        Assert.Contains(filePath, result)
        Assert.Contains("new.md", File.ReadAllText filePath)
    finally
        Directory.Delete(root, true)

[<Fact>]
let ``rewriteIndexPaths ignores a direct non-md file path`` () =
    let root = newTempDir "directnonmd"

    try
        let filePath = Path.Combine(root, "notes.txt")
        File.WriteAllText(filePath, "[X](./old.md)")

        let result = rewriteIndexPaths root [ filePath ] [ ("old.md", "new.md") ]

        Assert.Empty(result)
    finally
        Directory.Delete(root, true)

[<Fact>]
let ``rewriteIndexPaths skips files under a configured skip directory`` () =
    let root = newTempDir "skiprewrite"

    try
        Directory.CreateDirectory(Path.Combine(root, "node_modules")) |> ignore
        let vendored = Path.Combine(root, "node_modules", "vendored.md")
        File.WriteAllText(vendored, "[X](./old.md)")

        let result = rewriteIndexPaths root [ root ] [ ("old.md", "new.md") ]

        Assert.Empty(result)
        Assert.Contains("./old.md", File.ReadAllText vendored)
    finally
        Directory.Delete(root, true)

[<Fact>]
let ``rewriteIndexPaths tolerates a path that does not exist on disk`` () =
    let root = newTempDir "nonexistent"

    try
        let missing = Path.Combine(root, "does-not-exist")

        let result = rewriteIndexPaths root [ missing ] [ ("old.md", "new.md") ]

        Assert.Empty(result)
    finally
        Directory.Delete(root, true)

[<Fact>]
let ``rewriteIndexPaths short-circuits to an empty result when the rename map is empty`` () =
    let root = newTempDir "emptyrenames"

    try
        File.WriteAllText(Path.Combine(root, "doc.md"), "[X](./old.md)")

        let result = rewriteIndexPaths root [ root ] []

        Assert.Empty(result)
    finally
        Directory.Delete(root, true)

[<Fact>]
let ``wordBudgetSeverityLabel maps every severity to its lowercase label`` () =
    Assert.Equal("ok", wordBudgetSeverityLabel WordBudgetSeverity.Within)
    Assert.Equal("warn", wordBudgetSeverityLabel WordBudgetSeverity.Warn)
    Assert.Equal("fail", wordBudgetSeverityLabel WordBudgetSeverity.Fail)

[<Fact>]
let ``checkResolvedTree reports the target-relative wording when size is within warn but exceeds target`` () =
    let root = newTempDir "resolvedwarn1"

    try
        File.WriteAllText(Path.Combine(root, "root.md"), String.Join(" ", Array.create 8 "w"))

        let config: BudgetConfig =
            { Surfaces = []
              ResolvedTree =
                { Root = "root.md"
                  Target = 5UL
                  Warn = 10UL
                  Fail = 20UL } }

        let finding = checkResolvedTree root config

        Assert.True(finding.IsSome)
        Assert.Contains("over 5-word target", finding.Value.Message)
    finally
        Directory.Delete(root, true)

[<Fact>]
let ``checkResolvedTree reports the warn-threshold wording once size exceeds warn but stays within fail`` () =
    let root = newTempDir "resolvedwarn2"

    try
        File.WriteAllText(Path.Combine(root, "root.md"), String.Join(" ", Array.create 15 "w"))

        let config: BudgetConfig =
            { Surfaces = []
              ResolvedTree =
                { Root = "root.md"
                  Target = 5UL
                  Warn = 10UL
                  Fail = 20UL } }

        let finding = checkResolvedTree root config

        Assert.True(finding.IsSome)
        Assert.Contains("over 10-word warn threshold", finding.Value.Message)
    finally
        Directory.Delete(root, true)

[<Fact>]
let ``checkResolvedTree resolves a bare relative root filename against the current directory when repoRoot is empty``
    ()
    =
    let cwd = Directory.GetCurrentDirectory()

    let fileName =
        sprintf "rhino-cli-governance-bare-%s.md" (Guid.NewGuid().ToString("N"))

    let fullPath = Path.Combine(cwd, fileName)

    try
        File.WriteAllText(fullPath, "one two three four five six")

        let config: BudgetConfig =
            { Surfaces = []
              ResolvedTree =
                { Root = fileName
                  Target = 1UL
                  Warn = 1UL
                  Fail = 100UL } }

        let finding = checkResolvedTree "" config

        Assert.True(finding.IsSome)
        Assert.Equal(6UL, finding.Value.Size)
    finally
        File.Delete fullPath

[<Fact>]
let ``resolveTreeSize stops counting a chain of at-imports once import depth exceeds four levels`` () =
    let root = newTempDir "depthchain"

    try
        let path n =
            Path.Combine(root, sprintf "file%d.md" n)

        for n in 0..4 do
            File.WriteAllText(path n, sprintf "@file%d.md\nX" (n + 1))

        File.WriteAllText(path 5, "Y")

        let total = resolveTreeSize (path 0)

        Assert.Equal(10UL, total)
    finally
        Directory.Delete(root, true)

[<Fact>]
let ``checkNoUnknownWordBudgetKeys tolerates a top-level YAML document that is not a mapping`` () =
    Assert.Equal(Ok(), checkNoUnknownWordBudgetKeys "- a\n- b\n")

[<Fact>]
let ``checkNoUnknownWordBudgetKeys tolerates a governance-word-budget value that is not a mapping`` () =
    Assert.Equal(Ok(), checkNoUnknownWordBudgetKeys "governance-word-budget: scalar-value\n")

[<Fact>]
let ``checkNoUnknownWordBudgetKeys tolerates a section with no surfaces key`` () =
    Assert.Equal(Ok(), checkNoUnknownWordBudgetKeys "governance-word-budget:\n  resolved_tree:\n    root: \"x.md\"\n")

[<Fact>]
let ``checkNoUnknownWordBudgetKeys tolerates surfaces declared as a mapping instead of a list`` () =
    Assert.Equal(Ok(), checkNoUnknownWordBudgetKeys "governance-word-budget:\n  surfaces:\n    glob: \"x.md\"\n")

[<Fact>]
let ``checkNoUnknownWordBudgetKeys tolerates surfaces declared as a scalar string`` () =
    Assert.Equal(Ok(), checkNoUnknownWordBudgetKeys "governance-word-budget:\n  surfaces: \"oops\"\n")

[<Fact>]
let ``checkNoUnknownWordBudgetKeys tolerates a surface list item that is not a mapping`` () =
    Assert.Equal(Ok(), checkNoUnknownWordBudgetKeys "governance-word-budget:\n  surfaces:\n    - \"not-a-map\"\n")

[<Fact>]
let ``checkNoUnknownWordBudgetKeys tolerates a section with no resolved_tree key`` () =
    Assert.Equal(Ok(), checkNoUnknownWordBudgetKeys "governance-word-budget:\n  surfaces: []\n")

[<Fact>]
let ``checkNoUnknownWordBudgetKeys returns an error for genuinely malformed YAML syntax`` () =
    let result = checkNoUnknownWordBudgetKeys "governance-word-budget:\n  surfaces: [\n"

    match result with
    | Error _ -> ()
    | Ok() -> Assert.Fail("expected malformed YAML to produce an Error")

[<Fact>]
let ``mergedBudgetConfig defaults an absent surfaces key to an empty list`` () =
    let root = newTempDir "nosurfaces"

    try
        File.WriteAllText(
            Path.Combine(root, "repo-config.yml"),
            "governance-word-budget:\n  resolved_tree:\n    root: \"x.md\"\n    target: 1\n    warn: 2\n    fail: 2\n"
        )

        match mergedBudgetConfig root with
        | Ok(Some cfg) -> Assert.Empty(cfg.Surfaces)
        | other -> Assert.Fail(sprintf "expected Ok(Some cfg) with empty Surfaces, got %A" other)
    finally
        Directory.Delete(root, true)

[<Fact>]
let ``mergedBudgetConfig propagates a checkNoUnknownWordBudgetKeys error`` () =
    let root = newTempDir "badkey"

    try
        File.WriteAllText(Path.Combine(root, "repo-config.yml"), "governance-word-budget:\n  bogus-key: true\n")

        match mergedBudgetConfig root with
        | Error _ -> ()
        | other -> Assert.Fail(sprintf "expected Error, got %A" other)
    finally
        Directory.Delete(root, true)

[<Fact>]
let ``mergedBudgetConfig returns Ok None for an empty repo-config.yml`` () =
    let root = newTempDir "emptyconfig"

    try
        File.WriteAllText(Path.Combine(root, "repo-config.yml"), "")

        Assert.Equal(Ok None, mergedBudgetConfig root)
    finally
        Directory.Delete(root, true)

[<Fact>]
let ``mergedBudgetConfig returns Ok None when governance-word-budget is absent`` () =
    let root = newTempDir "nogovsection"

    try
        File.WriteAllText(Path.Combine(root, "repo-config.yml"), "harness: []\n")

        Assert.Equal(Ok None, mergedBudgetConfig root)
    finally
        Directory.Delete(root, true)

[<Fact>]
let ``mergedBudgetConfig successfully parses a fully valid governance-word-budget section`` () =
    let root = newTempDir "validconfig"

    try
        File.WriteAllText(
            Path.Combine(root, "repo-config.yml"),
            "governance-word-budget:\n"
            + "  surfaces:\n"
            + "    - glob: \"*.md\"\n"
            + "      target: 500\n"
            + "      warn: 800\n"
            + "      fail: 1000\n"
            + "  resolved_tree:\n"
            + "    root: \"AGENTS.md\"\n"
            + "    target: 2000\n"
            + "    warn: 3000\n"
            + "    fail: 4000\n"
        )

        match mergedBudgetConfig root with
        | Ok(Some cfg) ->
            Assert.Equal("*.md", cfg.Surfaces.[0].Glob)
            Assert.Equal(500UL, cfg.Surfaces.[0].Target)
            Assert.Equal("AGENTS.md", cfg.ResolvedTree.Root)
            Assert.Equal(4000UL, cfg.ResolvedTree.Fail)
        | other -> Assert.Fail(sprintf "expected Ok(Some cfg), got %A" other)
    finally
        Directory.Delete(root, true)

[<Fact>]
let ``resolveTreeSize tolerates an at-import target that Path.GetFullPath cannot canonicalize`` () =
    // A NUL byte inside the "@import" target makes `Path.GetFullPath`
    // throw; `resolveRecursive`'s `try ... with _ -> path` falls back to
    // the raw (uncanonicalized) path instead of propagating the exception,
    // and the malformed import itself contributes 0 words (its `File.Exists`
    // check is simply `false` for a NUL-containing path).
    let root = newTempDir "badimportpath"

    try
        let rootFile = Path.Combine(root, "root.md")
        File.WriteAllText(rootFile, "Normal content here.\n@badimport" + string '\000' + "hidden\n")

        let size = resolveTreeSize rootFile

        Assert.Equal(4UL, size)
    finally
        Directory.Delete(root, true)

[<Fact>]
let ``mergedBudgetConfig reports a deserialization error for a surface value of the wrong YAML type`` () =
    // `target: not-a-number` sails through `checkNoUnknownWordBudgetKeys`
    // unchanged (that check only rejects unrecognized *keys*, never
    // validates value shapes), so this exercises the distinct `with ex ->
    // Error ex.Message` fallback around the strongly typed
    // `Deserialize<RepoConfigWordBudgetDto>` call instead.
    let root = newTempDir "badtargettype"

    try
        File.WriteAllText(
            Path.Combine(root, "repo-config.yml"),
            "governance-word-budget:\n"
            + "  surfaces:\n"
            + "    - glob: \"*.md\"\n"
            + "      target: not-a-number\n"
            + "      warn: 10\n"
            + "      fail: 20\n"
            + "  resolved_tree:\n"
            + "    root: \"docs/README.md\"\n"
            + "    target: 10\n"
            + "    warn: 20\n"
            + "    fail: 30\n"
        )

        Assert.Equal(Ok(), checkNoUnknownWordBudgetKeys (File.ReadAllText(Path.Combine(root, "repo-config.yml"))))

        match mergedBudgetConfig root with
        | Error message -> Assert.Contains("deserialization", message)
        | other -> Assert.Fail(sprintf "expected Error, got %A" other)
    finally
        Directory.Delete(root, true)
