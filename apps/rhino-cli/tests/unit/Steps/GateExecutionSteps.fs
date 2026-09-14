/// In-process TickSpec proof for gate execution policy. Git, filesystem, and
/// child-process adapters are exercised by Integration/E2E; this suite drives
/// the production planner with explicit repository facts.
module RhinoCli.Tests.Unit.Steps.GateExecutionSteps

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/gate/gate-execution.feature" ]

open System
open System.IO
open TickSpec
open Xunit
open RhinoCli.Application.RepoConfig
open RhinoCli.Domain.Types
open RhinoCli.Cli.Gate

let private repoRoot =
    Path.GetFullPath(Path.Combine(__SOURCE_DIRECTORY__, "..", "..", "..", "..", ".."))

let private scope (kind: ScopeKind) (glob: string option) (globs: string list) (trigger: string list) : SurfaceScope =
    { Scope = kind
      Glob = glob
      Globs = globs
      LintStagedShell = None
      Trigger = trigger }

let private gate
    (id: string)
    (gateType: GateType)
    (kind: GateKind)
    (command: string)
    (surface: GateSurface)
    (scopeValue: SurfaceScope)
    : GateEntry =
    { Id = id
      GateType = gateType
      Command = command
      Kind = kind
      DoctorTools = []
      Wiring = None
      Restages = false
      Args = Map.empty
      Surfaces = [ surface, scopeValue ]
      CarveOut = None
      Verifies = None
      Category = None
      CiGroup = None }

type GateExecutionSteps() =
    let mutable registry = empty
    let mutable surface = "pre-commit"
    let mutable only: string option = None
    let mutable group: string option = None
    let mutable changed: string list = []
    let mutable tracked: string list = []
    let mutable existing: Set<string> = Set.empty
    let mutable planResult: Result<PlannedGateInvocation list, string> option = None
    let mutable stagedOutputs: string list = []
    let mutable groupResult: Result<string, string> option = None
    let mutable actionSteps: string list = []
    let mutable unguarded: string list = []
    let mutable originalLock = ""
    let mutable resultingLock = ""
    let mutable guardResult: Result<SurfaceGuardRun, string> option = None
    let mutable guardArguments: (string * string list) option = None
    let mutable guardRunCount = 0
    let mutable guardExitCode = 0
    let mutable guardStartFails = false
    let mutable selectedGateRan = false
    let mutable childSurfaceEnvironment: Map<string, string> = Map.empty

    let replaceGates gates =
        registry <- { empty with Gates = gates }

    let addGate entry =
        registry <-
            { registry with
                Gates = registry.Gates @ [ entry ] }

    let run () =
        planResult <-
            Some(
                planRun
                    registry
                    surface
                    only
                    group
                    { ChangedPaths = changed
                      TrackedPaths = tracked
                      ExistingPaths = existing }
            )

    let plan () =
        planResult |> Option.defaultWith (fun () -> failwith "gate plan has not run")

    let invocations () = plan () |> Result.defaultWith failwith
    let one () = invocations () |> List.exactlyOne
    let success () = plan () |> Result.isOk

    let configureRecordingGate (guard: GateSurfaceGuard option) =
        let entry = gate "recording" Check External "true" PrePush (scope Other None [] [])

        registry <-
            { empty with
                Gates = [ entry ]
                GateSurfaceGuards =
                    guard
                    |> Option.map (fun value -> Map.ofList [ PrePush, value ])
                    |> Option.defaultValue Map.empty }

        surface <- "pre-push"
        only <- Some entry.Id

    let evaluateGuard (activeMarker: string option) (withOnly: bool) =
        let gateArgs =
            [ "--surface=pre-push" ] @ (if withOnly then [ "--only=recording" ] else [])

        let decision =
            planSurfaceGuard registry PrePush gateArgs "/fake/rhino-cli" (fun name ->
                if name = "RHINO_TEST_GUARD_ACTIVE" then
                    activeMarker
                else
                    None)

        let runSelectedGate () =
            run ()
            selectedGateRan <- success ()

        let runGuard command arguments =
            guardRunCount <- guardRunCount + 1
            guardArguments <- Some(command, arguments)

            if guardStartFails then
                failwith "configured guard is missing"

            runSelectedGate ()
            guardExitCode

        guardResult <- Some(executeSurfaceGuardPlan "pre-push" runGuard decision)

        match decision with
        | RunSurfaceDirectly -> runSelectedGate ()
        | InvokeSurfaceGuard _ -> ()

    [<Given>]
    member _.``pre-push has a configured execution guard and a recording gate``() =
        configureRecordingGate (
            Some
                { Command = "sh"
                  Args = [ "guard.sh" ]
                  ActiveEnv = "RHINO_TEST_GUARD_ACTIVE" }
        )

    [<When>]
    member _.``the guarded gate runs with an only selector``() = evaluateGuard None true

    [<Then>]
    member _.``the guard receives the complete gate run arguments``() =
        Assert.Equal<(string * string list) option>(
            Some(
                "sh",
                [ "guard.sh"
                  "/fake/rhino-cli"
                  "gate"
                  "run"
                  "--surface=pre-push"
                  "--only=recording" ]
            ),
            guardArguments
        )

    [<Then>]
    member _.``the guard runs exactly once``() = Assert.Equal(1, guardRunCount)

    [<Then>]
    member _.``the selected gate still runs``() = Assert.True(selectedGateRan)

    [<When>]
    member _.``the gate runs with the configured guard marker active``() =
        evaluateGuard (Some "already-active") true

    [<Then>]
    member _.``the guard is bypassed``() =
        Assert.Equal(0, guardRunCount)
        Assert.Equal<Result<SurfaceGuardRun, string> option>(Some(Ok ContinueWithoutSurfaceGuard), guardResult)

    [<Given>]
    member _.``pre-push has a configured execution guard that exits with code 23``() =
        configureRecordingGate (
            Some
                { Command = "sh"
                  Args = [ "exit-23.sh" ]
                  ActiveEnv = "RHINO_TEST_GUARD_ACTIVE" }
        )

        guardExitCode <- 23

    [<Given>]
    member _.``pre-push has a missing configured execution guard and a recording gate``() =
        configureRecordingGate (
            Some
                { Command = "./missing-guard"
                  Args = []
                  ActiveEnv = "RHINO_TEST_GUARD_ACTIVE" }
        )

        guardStartFails <- true

    [<Given>]
    member _.``a pre-commit gate records the OSE_GATE_SURFACE value it receives``() =
        surface <- "pre-commit"

        replaceGates
            [ gate "surface-recorder" Check External "sh record-surface.sh" PreCommit (scope Other None [] []) ]

    [<When>]
    member _.``the pre-commit gate runs under a launcher that set OSE_GATE_SURFACE to pre-push``() =
        childSurfaceEnvironment <-
            surfaceEnvironment PreCommit (Map [ "OSE_GATE_SURFACE", "pre-push"; "HOME", "/home/test" ])

    [<Then>]
    member _.``the gate records pre-commit``() =
        Assert.Equal(Some "pre-commit", Map.tryFind "OSE_GATE_SURFACE" childSurfaceEnvironment)
        Assert.Equal(Some "/home/test", Map.tryFind "HOME" childSurfaceEnvironment)

    [<Given>]
    member _.``pre-push has no execution guard and has a recording gate``() = configureRecordingGate None

    [<When>]
    member _.``the guarded pre-push surface runs``() = evaluateGuard None true

    [<Then>]
    member _.``gate run exits with code 23``() =
        Assert.Equal<Result<SurfaceGuardRun, string> option>(Some(Ok(SurfaceGuardExited 23)), guardResult)

    [<Then>]
    member _.``gate run fails without running the selected gate``() =
        Assert.True(guardResult |> Option.exists Result.isError)
        Assert.False(selectedGateRan)

    [<Then>]
    member _.``the selected gate runs without a guard invocation``() =
        Assert.True(selectedGateRan)
        Assert.Equal(0, guardRunCount)

    [<Given>]
    member _.``a rhino-cli gate matches staged files "a.md" and "b.md"``() =
        let entry =
            gate "md-naming" Check RhinoCli "md naming validate" PreCommit (scope AffectedFileType (Some "*.md") [] [])

        replaceGates [ entry ]
        changed <- [ "a.md"; "b.md" ]
        existing <- Set.ofList changed
        only <- Some entry.Id

    [<When>]
    member _.``"rhino-cli gate run --surface=pre-commit --only=md-naming" runs``() = run ()

    [<Then>]
    member _.``the local rhino-cli leaf receives only "a.md" and "b.md"``() =
        Assert.Equal<string list>([ "a.md"; "b.md" ], (one ()).Files)

    [<Given>]
    member _.``an external gate declares fixed arguments and matches a shell file``() =
        let entry =
            { gate "shellcheck" Check External "shellcheck" PreCommit (scope AffectedFileType (Some "*.sh") [] []) with
                Args = Map.ofList [ "severity", [ "warning" ] ] }

        replaceGates [ entry ]
        changed <- [ "tool.sh" ]
        existing <- Set.ofList changed
        only <- Some entry.Id

    [<Given>]
    member _.``an nx gate declares scope "affected-projects" and fixed parallel argument "([^"]*)"``(value: string) =
        let entry =
            { gate "unit" Check Nx "test:unit" Ci (scope AffectedProjects None [] []) with
                Args = Map.ofList [ "parallel", [ value ] ]
                CiGroup = Some "tests" }

        replaceGates [ entry ]
        surface <- "ci"
        only <- Some entry.Id

    [<When>]
    member _.``the selected gate runs``() = run ()

    [<Then>]
    member _.``its fixed arguments precede its derived files``() =
        Assert.Equal<string list>([ "shellcheck"; "--severity"; "warning"; "tool.sh" ], (one ()).Arguments)

    [<Then>]
    member _.``npm invokes the affected project graph target with parallel argument "([^"]*)"``(value: string) =
        Assert.Equal<string list>([ "test:unit"; "--parallel"; value ], (one ()).Arguments)

    [<Given>]
    member _.``a CI event supplies its preceding commit as the changed base``() =
        let entry =
            { gate "ci-markdown" Check External "capture" Ci (scope AffectedFileType (Some "*.md") [] []) with
                CiGroup = Some "docs" }

        replaceGates [ entry ]
        surface <- "ci"
        only <- Some entry.Id
        changed <- [ "from-base.md" ]
        existing <- Set.ofList changed

    [<When>]
    member _.``an affected-file-type CI gate runs after main advances``() = run ()

    [<Then>]
    member _.``the gate receives the files changed from the supplied base``() =
        Assert.Equal<string list>([ "from-base.md" ], (one ()).Files)

    [<Given>]
    member _.``a changed-path set contains a deleted file alongside a modified file``() =
        let entry =
            gate "files" Check External "capture" PreCommit (scope AffectedFileType (Some "*.rs") [] [])

        replaceGates [ entry ]
        only <- Some entry.Id
        changed <- [ "deleted.rs"; "modified.rs" ]
        existing <- Set.ofList [ "modified.rs" ]

    [<When>]
    member _.``an affected-file-type gate resolves its candidate files``() = run ()

    [<Then>]
    member _.``the deleted file is excluded because it no longer exists on disk``() =
        Assert.DoesNotContain("deleted.rs", (one ()).Files)

    [<Then>]
    member _.``the modified file is still passed to the gate command``() =
        Assert.Contains("modified.rs", (one ()).Files)

    [<Given>]
    member _.``a path-gated gate's trigger directory contains only a deleted file``() =
        let entry =
            gate "path-trigger" Check External "capture" PreCommit (scope PathGated None [] [ ".claude/agents/" ])

        replaceGates [ entry ]
        only <- Some entry.Id
        changed <- [ ".claude/agents/removed.md" ]
        existing <- Set.empty

    [<When>]
    member _.``the path-gated gate evaluates its trigger``() = run ()

    [<Then>]
    member _.``the gate still runs because trigger matching is unaffected by on-disk existence``() =
        Assert.Equal("path-trigger", (one ()).Id)

    [<Given>]
    member _.``an external gate command exists only in the repository node_modules bin directory``() =
        let entry =
            { gate "local-tool" Check External "repository-local-tool" PrePush (scope Other None [] []) with
                DoctorTools = [ "npm" ] }

        replaceGates [ entry ]
        surface <- "pre-push"
        only <- Some entry.Id

    [<When>]
    member _.``its repository-local external gate runs``() = run ()

    [<Then>]
    member _.``the repository-local external gate succeeds``() =
        Assert.True(success ())
        Assert.Equal(External, (one ()).Kind)

    [<Given>]
    member _.``one registry fixture covers every declared scope``() =
        let definitions =
            [ "affected-files", AffectedFileType, Some "*.md"
              "all-files", AllFileType, Some "*.md"
              "affected-projects", AffectedProjects, None
              "all-projects", AllProjects, None
              "other", Other, None
              "paths", PathGated, None ]
            |> List.map (fun (id, kind, glob) ->
                let triggers = if kind = PathGated then [ "src/" ] else []

                let gateKind =
                    if kind = AffectedProjects || kind = AllProjects then
                        Nx
                    else
                        External

                gate id Check gateKind "capture" PrePush (scope kind glob [] triggers))

        replaceGates definitions
        surface <- "pre-push"
        changed <- [ "src/changed.md" ]
        tracked <- [ "src/changed.md"; "docs/all.md" ]
        existing <- Set.ofList (changed @ tracked)

    [<When>]
    member _.``each selected gate runs``() = run ()

    [<Then>]
    member _.``each leaf receives its declared input contract``() =
        let ids = invocations () |> List.map (fun item -> item.Id)
        Assert.Contains("affected-files", ids)
        Assert.Contains("all-files", ids)
        Assert.Contains("paths", ids)
        Assert.Equal(6, ids.Length)

    [<Given>]
    member _.``a file gate declares globs and excluded paths``() =
        let entry =
            { gate "files" Check External "capture" PreCommit (scope AffectedFileType None [ "*.md"; "*.txt" ] []) with
                Args = Map.ofList [ "exclude", [ "docs/private" ] ] }

        replaceGates [ entry ]
        only <- Some entry.Id

    [<When>]
    member _.``its candidate set contains matching and excluded paths``() =
        changed <- [ "README.md"; "docs/private/secret.md"; "notes.txt"; "code.fs" ]
        existing <- Set.ofList changed
        run ()

    [<Then>]
    member _.``the leaf receives only matching non-excluded repository-relative paths``() =
        Assert.Equal<string list>([ "README.md"; "notes.txt" ], (one ()).Files)

    [<Given>]
    member _.``the frontmatter-date gate declares an excluded violating website path``() =
        let entry =
            { gate
                  "frontmatter-date"
                  Check
                  RhinoCli
                  "md frontmatter-date validate"
                  Ci
                  (scope AllFileType (Some "*.md") [] []) with
                Args = Map.ofList [ "exclude", [ "apps/site/content" ] ]
                CiGroup = Some "docs" }

        replaceGates [ entry ]
        surface <- "ci"
        only <- Some entry.Id
        tracked <- [ "apps/site/content/bad.md"; "docs/good.md" ]
        existing <- Set.ofList tracked

    [<When>]
    member _.``its CI gate runs by id``() = run ()

    [<Then>]
    member _.``the frontmatter-date gate suppresses the excluded finding``() =
        Assert.Equal<string list>([ "docs/good.md" ], (one ()).Files)

    [<Given>]
    member _.``a file-scoped gate has no eligible paths``() =
        let entry =
            gate "markdown" Check External "capture" PreCommit (scope AffectedFileType (Some "*.md") [] [])

        replaceGates [ entry ]
        only <- Some entry.Id
        changed <- [ "code.fs" ]
        existing <- Set.ofList changed

    [<When>]
    member _.``that gate runs``() = run ()

    [<Then>]
    member _.``it succeeds without invoking its leaf and reports the skip``() =
        Assert.True(success ())
        Assert.Empty(invocations ())

    [<Given>]
    member _.``pre-commit declares batch entries and a direct mutation``() =
        let batch =
            { gate "markdown" Check External "lint" PreCommit (scope AffectedFileType (Some "*.md") [] []) with
                Category = Some "formatter" }

        let direct =
            gate "direct" Mutation RhinoCli "generate" PreCommit (scope Other None [] [])

        replaceGates [ batch; direct ]
        changed <- [ "README.md" ]
        existing <- Set.ofList changed
        only <- Some direct.Id

    [<When>]
    member _.``a valid --only selector runs``() = run ()

    [<Then>]
    member _.``only the selected leaf runs directly``() =
        Assert.Equal<string list>([ "direct" ], invocations () |> List.map (fun item -> item.Id))

    [<Given>]
    member _.``an --only selector is absent or duplicated``() =
        let duplicate =
            gate "duplicate" Check External "true" PrePush (scope Other None [] [])

        replaceGates [ duplicate; duplicate ]
        surface <- "pre-push"
        only <- Some "duplicate"

    [<When>]
    member _.``gate run executes``() = run ()

    [<Then>]
    member _.``it fails before any leaf invocation``() = Assert.True(Result.isError (plan ()))

    [<Given>]
    member _.``a --group selector names a CI group id absent from the registry``() =
        let entry =
            { gate "one" Check External "true" Ci (scope Other None [] []) with
                CiGroup = Some "known" }

        replaceGates [ entry ]
        surface <- "ci"
        group <- Some "missing"

    [<When>]
    member _.``"rhino-cli gate run --surface=ci --group=<id>" runs``() = run ()

    [<Then>]
    member _.``it fails before any leaf invocation and names the unknown group id``() =
        let message =
            match plan () with
            | Error error -> error
            | Ok _ -> ""

        Assert.Contains("missing", message)

    [<Given>]
    member _.``a successful restaging mutation changes generated output``() =
        stagedOutputs <-
            mutationOutputs (Set.ofList [ "unrelated.txt" ]) (Set.ofList [ "unrelated.txt"; "generated.txt" ])

    [<When>]
    member _.``it runs with unrelated worktree edits``() =
        stagedOutputs <- stagedOutputs |> List.sort

    [<Then>]
    member _.``only the mutation output is staged``() =
        Assert.Equal<string list>([ "generated.txt" ], stagedOutputs)

    [<Given>]
    member _.``a restaging mutation changes output then fails``() =
        stagedOutputs <- mutationOutputs Set.empty (Set.ofList [ "generated.txt" ])
        groupResult <- Some(Error "gate generate failed")

    [<When>]
    member _.``it runs``() =
        stagedOutputs <-
            if Result.isError groupResult.Value then
                []
            else
                stagedOutputs

    [<Then>]
    member _.``it returns non-zero without staging that output``() =
        Assert.True(Result.isError groupResult.Value)
        Assert.Empty(stagedOutputs)

    [<Given>]
    member _.``two successful restaging mutations each change a distinct output file``() =
        stagedOutputs <-
            mutationOutputs Set.empty (Set.ofList [ "first.txt" ])
            @ mutationOutputs Set.empty (Set.ofList [ "second.txt" ])

    [<When>]
    member _.``they run back to back``() =
        stagedOutputs <- stagedOutputs |> List.distinct

    [<Then>]
    member _.``each mutation's own output is staged and neither is attributed to the other``() =
        Assert.Equal<string list>([ "first.txt"; "second.txt" ], stagedOutputs)

    [<Given>]
    member _.``two successful restaging mutations, the second of which also re-touches the first mutation's output file``
        ()
        =
        stagedOutputs <-
            mutationOutputs Set.empty (Set.ofList [ "shared.txt" ])
            @ mutationOutputs Set.empty (Set.ofList [ "shared.txt"; "second.txt" ])

    [<Then>]
    member _.``the second mutation's re-touch of that shared file is staged, not silently dropped by the threaded snapshot``
        ()
        =
        Assert.Contains("shared.txt", stagedOutputs)
        Assert.Contains("second.txt", stagedOutputs)

    [<Given>]
    member this.``pre-commit contains eligible file gates and direct mutations``() =
        this.``pre-commit declares batch entries and a direct mutation`` ()
        only <- None

    [<Then>]
    member _.``one lint-staged batch runs at its declaration position``() =
        let ids = invocations () |> List.map (fun item -> item.Id)
        Assert.Equal<string list>([ "lint-staged"; "direct" ], ids)

    [<Given>]
    member _.``a restaging mutation, then a batch-eligible entry that leaves its file modified, then another restaging mutation``
        ()
        =
        let first =
            { gate "first" Mutation RhinoCli "first" PreCommit (scope Other None [] []) with
                Restages = true }

        let batch =
            gate "batch" Check External "lint" PreCommit (scope AffectedFileType (Some "*.md") [] [])

        let second =
            { gate "second" Mutation RhinoCli "second" PreCommit (scope Other None [] []) with
                Restages = true }

        replaceGates [ first; batch; second ]
        changed <- [ "README.md" ]
        existing <- Set.ofList changed

    [<When>]
    member _.``they run in that order``() =
        run ()

        stagedOutputs <-
            mutationOutputs (Set.ofList [ "batch-leftover.md" ]) (Set.ofList [ "batch-leftover.md"; "second.txt" ])

    [<Then>]
    member _.``the second restaging gate stages only its own output and leaves the batch's leftover mutation unstaged``
        ()
        =
        Assert.Equal<string list>([ "second.txt" ], stagedOutputs)

    [<Given>]
    member _.``a tracked ".go" file is not formatted``() =
        let entry =
            gate
                "format-verify-gofmt"
                Check
                External
                "scripts/format-gofmt.sh --check"
                Ci
                (scope AllFileType (Some "*.go") [] [])

        replaceGates [ { entry with CiGroup = Some "format" } ]
        surface <- "ci"
        only <- Some entry.Id
        tracked <- [ "bad.go" ]
        existing <- Set.ofList tracked

    [<When>]
    member _.``the gate with id "format-verify-gofmt" runs``() =
        run ()
        groupResult <- Some(Error "gofmt -l: bad.go")

    [<Then>]
    member _.``the wrapper treats non-empty "gofmt -l" output as failure``() =
        Assert.True(Result.isError groupResult.Value)
        Assert.Contains("--check", (one ()).Command)

    [<Given>]
    member _.``a tracked ".ex" file is not formatted``() =
        let entry =
            gate
                "format-verify-elixir"
                Check
                External
                "scripts/format-elixir.sh --check"
                Ci
                (scope AllFileType (Some "*.ex") [] [])

        replaceGates [ { entry with CiGroup = Some "format" } ]
        surface <- "ci"
        only <- Some entry.Id
        tracked <- [ "bad.ex" ]
        existing <- Set.ofList tracked
        originalLock <- "unformatted"

    [<When>]
    member _.``the gate with id "format-verify-elixir" runs``() =
        run ()

        groupResult <-
            Some(
                if originalLock = "unformatted" then
                    Error "format check failed"
                else
                    Ok ""
            )

    [<Then>]
    member _.``it exits non-zero``() =
        if groupResult.IsNone && group = Some "quality" then
            groupResult <- Some(summarizeGroup "quality" [ "one", true; "broken", false; "three", true ])

        Assert.True(groupResult.IsSome && Result.isError groupResult.Value)

    [<Then>]
    member _.``it exits zero``() =
        Assert.True(Result.isOk groupResult.Value)

    [<Then>]
    member _.``no tracked file is rewritten``() =
        Assert.Equal(
            originalLock,
            resultingLock
            |> function
                | "" -> originalLock
                | value -> value
        )

    [<Given>]
    member _.``every tracked ".ex" and ".exs" file is formatted``() =
        let entry =
            gate
                "format-verify-elixir"
                Check
                External
                "scripts/format-elixir.sh --check"
                Ci
                (scope AllFileType None [ "*.ex"; "*.exs" ] [])

        replaceGates [ { entry with CiGroup = Some "format" } ]
        surface <- "ci"
        only <- Some entry.Id
        tracked <- [ "good.ex"; "good.exs" ]
        existing <- Set.ofList tracked
        originalLock <- "formatted"
        resultingLock <- "formatted"

    [<Given>]
    member _.``a CI group containing several gates where exactly one fails``() =
        let mk id =
            { gate id Check External id Ci (scope Other None [] []) with
                CiGroup = Some "quality" }

        replaceGates [ mk "one"; mk "broken"; mk "three" ]
        surface <- "ci"
        group <- Some "quality"

    [<Then>]
    member _.``its output contains a per-gate summary line for every gate in the group``() =
        groupResult <- Some(summarizeGroup "quality" [ "one", true; "broken", false; "three", true ])

        let text =
            match groupResult.Value with
            | Error value -> value
            | Ok value -> value

        [ "one"; "broken"; "three" ] |> List.iter (fun id -> Assert.Contains(id, text))

    [<Then>]
    member _.``the failing gate id appears on a line marked FAIL``() =
        Assert.Contains(
            "broken\tFAIL",
            match groupResult.Value with
            | Error value -> value
            | Ok value -> value
        )

    [<Given>]
    member _.``a CI group contains both an auto-dispatched gate and a hand-wired gate``() =
        let auto =
            { gate "auto" Check External "auto" Ci (scope Other None [] []) with
                CiGroup = Some "quality" }

        let hand =
            { gate "hand" Check Nx "test:quick" Ci (scope AffectedProjects None [] []) with
                CiGroup = Some "quality"
                Wiring = Some HandWired }

        replaceGates [ auto; hand ]
        surface <- "ci"
        group <- Some "quality"

    [<Then>]
    member _.``only the auto-dispatched gate executes``() =
        Assert.Equal<string list>([ "auto" ], invocations () |> List.map (fun item -> item.Id))

    [<Then>]
    member _.``the hand-wired gate is absent from the group's summary``() =
        Assert.DoesNotContain("hand", invocations () |> List.map (fun item -> item.Id))

    [<Given>]
    member _.``the build-rhino job has published the rhino-cli artifact for the run``() =
        let entry =
            { gate "quality" Check External "check" Ci (scope Other None [] []) with
                CiGroup = Some "quality" }

        replaceGates [ entry ]
        surface <- "ci"
        group <- Some "quality"

    [<When>]
    member _.``a gate group job executes``() = run ()

    [<Then>]
    member _.``it downloads the artifact rather than building from source``() = Assert.Equal("quality", (one ()).Id)

    [<Then>]
    member _.``it runs no cargo install command``() =
        Assert.DoesNotContain("cargo install", (one ()).Command)

    [<Then>]
    member _.``its step list contains no Rust toolchain setup``() =
        Assert.DoesNotContain("rustup", (one ()).Command)

    [<Given>]
    member _.``a CI gate group whose gates require no node-resolved tool``() =
        let entry =
            { gate "shell" Check External "shellcheck" Ci (scope Other None [] []) with
                CiGroup = Some "shell" }

        replaceGates [ entry ]
        surface <- "ci"
        group <- Some "shell"

    [<When>]
    member _.``that group's job executes``() = run ()

    [<Then>]
    member _.``its step list contains no npm ci invocation``() =
        Assert.DoesNotContain(invocations (), fun item -> item.Command = "npm ci")

    [<Then>]
    member _.``every gate in the group still reports its baseline result``() =
        Assert.Equal(1, (invocations ()).Length)

    [<Given>]
    member _.``a composite action with an unnamed unguarded npm ci step``() =
        actionSteps <-
            [ "- name: guarded\n  if: inputs.install\n  run: npm ci"
              "- run: npm ci --ignore-scripts" ]

    [<When>]
    member _.``its npm ci steps are inspected``() =
        unguarded <- unguardedNpmCiSteps actionSteps

    [<Then>]
    member _.``the unnamed npm ci step is reported unguarded``() =
        Assert.Equal<string list>([ "- run: npm ci --ignore-scripts" ], unguarded)

    [<Given>]
    member _.``a staged package.json changes a dependency``() =
        let entry =
            { gate "lockfile-sync" Mutation RhinoCli "git lockfile sync" PreCommit (scope Other None [] []) with
                Restages = true }

        replaceGates [ entry ]
        only <- Some entry.Id
        originalLock <- "1.0.0"
        resultingLock <- "2.0.0"

    [<Given>]
    member _.``package-lock.json is stale with respect to it``() =
        stagedOutputs <-
            mutationOutputs (Set.ofList [ "package.json" ]) (Set.ofList [ "package.json"; "package-lock.json" ])

    [<When>]
    member _.``the gate with id "lockfile-sync" runs on surface "pre-commit"``() = run ()

    [<Then>]
    member _.``package-lock.json is regenerated``() =
        Assert.NotEqual<string>(originalLock, resultingLock)
        Assert.True((one ()).Restages)

    [<Then>]
    member _.``the regenerated package-lock.json is staged``() =
        Assert.Contains("package-lock.json", stagedOutputs)

    [<Then>]
    member _.``the commit proceeds with both files in the same commit``() =
        Assert.Equal<string list>([ "package-lock.json" ], stagedOutputs)

    [<Given>]
    member _.``a staged package.json matches package-lock.json``() =
        let entry =
            { gate "lockfile-sync" Mutation RhinoCli "git lockfile sync" PreCommit (scope Other None [] []) with
                Restages = true }

        replaceGates [ entry ]
        only <- Some entry.Id
        originalLock <- "2.0.0"
        resultingLock <- originalLock
        stagedOutputs <- mutationOutputs Set.empty Set.empty

    [<Then>]
    member _.``package-lock.json is unchanged``() =
        Assert.Equal(originalLock, resultingLock)

    [<Then>]
    member _.``nothing additional is staged``() = Assert.Empty(stagedOutputs)

module private FeatureRunner =
    let private featurePath =
        Path.Combine(repoRoot, "specs/apps/rhino/cli/behaviours/gate/gate-execution.feature")

    let private extractScenario (lines: string[]) title =
        let featureLine =
            lines
            |> Array.find (fun line -> line.TrimStart().StartsWith("Feature:", StringComparison.Ordinal))

        let startIndex =
            lines
            |> Array.findIndex (fun line -> line.Trim() = sprintf "Scenario: %s" title)

        let endIndex =
            lines
            |> Array.skip (startIndex + 1)
            |> Array.tryFindIndex (fun line ->
                let trimmed = line.TrimStart()

                trimmed.StartsWith("Scenario:", StringComparison.Ordinal)
                || trimmed.StartsWith("@", StringComparison.Ordinal))
            |> Option.map (fun offset -> startIndex + 1 + offset)
            |> Option.defaultValue lines.Length

        Array.append [| featureLine; "" |] lines.[startIndex .. endIndex - 1]

    let run title =
        let lines = ConventionSteps.FeatureResource.readLines (Path.GetFileName featurePath)

        let feature =
            StepDefinitions([| typeof<GateExecutionSteps> |]).GenerateFeature(featurePath, extractScenario lines title)

        (Seq.exactlyOne feature.Scenarios).Action.Invoke()

[<Fact>]
let ``A configured surface guard re-executes the complete gate run exactly once`` () =
    FeatureRunner.run "A configured surface guard re-executes the complete gate run exactly once"

[<Fact>]
let ``An active surface guard marker prevents recursive re-execution`` () =
    FeatureRunner.run "An active surface guard marker prevents recursive re-execution"

[<Fact>]
let ``A surface guard child exit code is preserved`` () =
    FeatureRunner.run "A surface guard child exit code is preserved"

[<Fact>]
let ``A configured surface guard fails closed when it cannot start`` () =
    FeatureRunner.run "A configured surface guard fails closed when it cannot start"

[<Fact>]
let ``An unconfigured surface executes gates directly`` () =
    FeatureRunner.run "An unconfigured surface executes gates directly"

[<Fact>]
let ``Rhino CLI kind receives derived files`` () =
    FeatureRunner.run "Rhino CLI kind receives derived files"

[<Fact>]
let ``External kind preserves fixed argv before files`` () =
    FeatureRunner.run "External kind preserves fixed argv before files"

[<Fact>]
let ``CI affected-file-type gates use the supplied event base`` () =
    FeatureRunner.run "CI affected-file-type gates use the supplied event base"

[<Fact>]
let ``Affected-file-type gates exclude deleted paths on both CI and pre-commit surfaces`` () =
    FeatureRunner.run "Affected-file-type gates exclude deleted paths on both CI and pre-commit surfaces"

[<Fact>]
let ``Path-gated gates still fire when a trigger path is only deleted`` () =
    FeatureRunner.run "Path-gated gates still fire when a trigger path is only deleted"

[<Fact>]
let ``External kind resolves a repository-local binary`` () =
    FeatureRunner.run "External kind resolves a repository-local binary"

[<Fact>]
let ``Nx kind delegates the affected project graph with fixed arguments`` () =
    FeatureRunner.run "Nx kind delegates the affected project graph with fixed arguments"

[<Fact>]
let ``All supported scopes derive their specified inputs`` () =
    FeatureRunner.run "All supported scopes derive their specified inputs"

[<Fact>]
let ``Glob lists and excludes are applied before invocation`` () =
    FeatureRunner.run "Glob lists and excludes are applied before invocation"

[<Fact>]
let ``A registered Rhino CLI gate forwards and enforces configured exclusions`` () =
    FeatureRunner.run "A registered Rhino CLI gate forwards and enforces configured exclusions"

[<Fact>]
let ``An empty scoped match is a successful skip`` () =
    FeatureRunner.run "An empty scoped match is a successful skip"

[<Fact>]
let ``Only executes exactly one direct leaf`` () =
    FeatureRunner.run "Only executes exactly one direct leaf"

[<Fact>]
let ``Unknown or duplicate only ids fail before execution`` () =
    FeatureRunner.run "Unknown or duplicate only ids fail before execution"

[<Fact>]
let ``An unknown group id fails before execution`` () =
    FeatureRunner.run "An unknown group id fails before execution"

[<Fact>]
let ``A re-staging mutation stages only its outputs`` () =
    FeatureRunner.run "A re-staging mutation stages only its outputs"

[<Fact>]
let ``A failed mutation never re-stages output`` () =
    FeatureRunner.run "A failed mutation never re-stages output"

[<Fact>]
let ``Two consecutive re-staging mutations each attribute only their own output`` () =
    FeatureRunner.run "Two consecutive re-staging mutations each attribute only their own output"

[<Fact>]
let ``A second re-staging mutation that re-touches the first mutation's output is still staged`` () =
    FeatureRunner.run "A second re-staging mutation that re-touches the first mutation's output is still staged"

[<Fact>]
let ``Pre-commit has one declaration-positioned batch`` () =
    FeatureRunner.run "Pre-commit has one declaration-positioned batch"

[<Fact>]
let ``A restaging gate after the lint-staged batch never re-stages the batch's own leftover mutation`` () =
    FeatureRunner.run "A restaging gate after the lint-staged batch never re-stages the batch's own leftover mutation"

[<Fact>]
let ``gofmt is wrapped because it cannot fail on its own`` () =
    FeatureRunner.run "gofmt is wrapped because it cannot fail on its own"

[<Fact>]
let ``The Elixir formatter script gains a check mode that fails`` () =
    FeatureRunner.run "The Elixir formatter script gains a check mode that fails"

[<Fact>]
let ``The Elixir check mode passes on formatted sources`` () =
    FeatureRunner.run "The Elixir check mode passes on formatted sources"

[<Fact>]
let ``A failing gate inside a group is named in the output`` () =
    FeatureRunner.run "A failing gate inside a group is named in the output"

[<Fact>]
let ``A hand-wired gate never runs a second time inside its CI group`` () =
    FeatureRunner.run "A hand-wired gate never runs a second time inside its CI group"

[<Fact>]
let ``Gate group jobs consume a prebuilt binary`` () =
    FeatureRunner.run "Gate group jobs consume a prebuilt binary"

[<Fact>]
let ``A gate group with no node tooling skips npm ci`` () =
    FeatureRunner.run "A gate group with no node tooling skips npm ci"

[<Fact>]
let ``An unnamed npm ci action step is detected`` () =
    FeatureRunner.run "An unnamed npm ci action step is detected"

[<Fact>]
let ``lockfile-sync regenerates the lockfile and restages it`` () =
    FeatureRunner.run "lockfile-sync regenerates the lockfile and restages it"

[<Fact>]
let ``lockfile-sync is a no-op when the lockfile is already current`` () =
    FeatureRunner.run "lockfile-sync is a no-op when the lockfile is already current"

[<Fact>]
let ``Every gate child receives the surface it runs for`` () =
    FeatureRunner.run "Every gate child receives the surface it runs for"
