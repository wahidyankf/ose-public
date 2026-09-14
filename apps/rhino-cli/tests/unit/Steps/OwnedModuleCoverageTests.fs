module RhinoCli.Tests.Unit.Steps.OwnedModuleCoverageTests

open System
open Xunit
open RhinoCli.Application
open RhinoCli.Application.Governance
open RhinoCli.Application.RepoConfig
open RhinoCli.Cli
open RhinoCli.Domain.Types

let private scope kind : SurfaceScope =
    { Scope = kind
      Glob = None
      Globs = []
      LintStagedShell = None
      Trigger = [] }

let private gate id gateType kind : GateEntry =
    { Id = id
      GateType = gateType
      Command = id
      Kind = kind
      DoctorTools = []
      Wiring = None
      Restages = false
      Args = Map.empty
      Surfaces = []
      CarveOut = None
      Verifies = None
      Category = None
      CiGroup = None }

let private config gates : RepoConfig = { RepoConfig.empty with Gates = gates }

[<Fact>]
let ``Convention pure policy handles every supported license spelling`` () =
    let licenseTexts =
        [ "apps/spdx", "SPDX-License-Identifier: MIT"
          "apps/mit", "MIT"
          "apps/apache-comma", "Apache License, Version 2.0"
          "apps/apache", "Apache License 2.0"
          "apps/apache-spdx", "Apache-2.0"
          "apps/bsd-three", "BSD 3-Clause"
          "apps/bsd-two", "BSD-2-Clause"
          "apps/mozilla", "Mozilla Public License"
          "apps/gpl", "GNU General Public License"
          "apps/custom", "LicenseRef-Custom" ]
        |> Map.ofList

    let snapshot: Convention.LicenseAuditSnapshot =
        { RequiredDirectories = licenseTexts |> Map.toList |> List.map fst
          LicenseTexts = licenseTexts
          LicensingNotice =
            Some "| Path | License | Note |\n| --- | --- | --- |\n| `./apps\\spdx/` | mit | escaped\\|pipe |\n" }

    let license = Convention.validateLicenseSnapshot snapshot
    Assert.True(license.Success, license.Output)

[<Fact>]
let ``Governance pure word-budget policy labels severities and rejects unknown YAML keys`` () =
    Assert.Equal("warn", wordBudgetSeverityLabel WordBudgetSeverity.Warn)
    Assert.Equal("fail", wordBudgetSeverityLabel WordBudgetSeverity.Fail)
    Assert.Equal("ok", wordBudgetSeverityLabel WordBudgetSeverity.Within)

    for text in
        [ "- scalar-root\n"
          "other: value\n"
          "governance-word-budget:\n  surfaces: {}\n"
          "governance-word-budget:\n  surfaces: scalar\n"
          "governance-word-budget:\n  unexpected: true\n"
          "governance-word-budget:\n  surfaces:\n    - not-a-map\n"
          "governance-word-budget:\n  surfaces:\n    - glob: '**/*.md'\n      surprise: true\n"
          "governance-word-budget:\n  resolved_tree:\n    root: AGENTS.md\n    surprise: true\n" ] do
        let result = checkNoUnknownWordBudgetKeys text

        if text.Contains("surprise") || text.Contains("unexpected") then
            Assert.True(Result.isError result, sprintf "expected unknown key rejection for %s" text)
        else
            Assert.True(Result.isOk result, sprintf "expected non-applicable shape to pass for %s" text)

    Assert.True(Result.isError (checkNoUnknownWordBudgetKeys "governance-word-budget: [\n"))

[<Fact>]
let ``Governance pure text tree normalizes paths and exercises file directory and missing README decisions`` () =
    let tree =
        [ "./docs\\README.md",
          "- [Guide](./guide.md) — annotation\n- [Sub](./sub) — annotation\n- [Ghost](./gone.md) — annotation\n"
          "docs/guide.md", "---\ntitle: Guide\ndescription: Guide text.\n---\n"
          "docs/sub/README.md", "# Sub\n"
          "docs/orphan.md", "# Orphan\n"
          "docs/missing/child.md", "# Child\n" ]
        |> Map.ofList

    let findings = auditReadmeIndexTexts tree [ "./docs/" ]
    Assert.Contains(findings, fun finding -> finding.Kind = ReadmeIndexFindingKind.Ghost)
    Assert.Contains(findings, fun finding -> finding.Kind = ReadmeIndexFindingKind.Orphan)
    Assert.Equal("ghost", ReadmeIndexFindingKind.Ghost.Name)

    let generated = generateReadmeIndexTexts tree [ "docs" ]
    Assert.True(Map.containsKey "docs/missing/README.md" generated)

    let rewritten =
        rewriteReadmeIndexTextPaths generated [ "docs" ] [ "guide.md", "renamed.md" ]

    Assert.Contains("renamed.md", rewritten.["docs/README.md"])

[<Fact>]
let ``Governance pure text policies handle link suffixes non-sibling links empty roots and rewrite tails`` () =
    let tree =
        [ "docs/README.md",
          "[fragment](./guide.md#topic) — ok\n[query](guide.md?raw=1)\n[absolute](/outside.md)\n[parent](../up.md)\n[url](https://example.test/page.md)\n[scheme](mailto:person.md)\n[unchanged](other.md)\n[unterminated](guide.md"
          "docs/guide.md", "# Guide"
          "docs/sub/README.md", "# Sub" ]
        |> Map.ofList

    let findings = auditReadmeIndexTexts tree [ "docs" ]
    Assert.Contains(findings, fun finding -> finding.Kind = ReadmeIndexFindingKind.Unannotated)
    Assert.DoesNotContain(findings, fun finding -> finding.File.Contains("outside.md"))

    let rewritten =
        rewriteReadmeIndexTextPaths tree [ "docs" ] [ "guide.md", "renamed.md"; "missing.md", "replacement.md" ]

    Assert.Contains("renamed.md#topic", rewritten.["docs/README.md"])
    Assert.Contains("renamed.md?raw=1", rewritten.["docs/README.md"])
    Assert.Contains("other.md", rewritten.["docs/README.md"])
    Assert.Contains("unterminated", rewritten.["docs/README.md"])
    Assert.Empty(auditReadmeIndexTexts Map.empty [ "" ])

[<Fact>]
let ``Governance resolved text tree reports both warning bands and failure while stopping cycles`` () =
    let threshold: ResolvedTree =
        { Root = "AGENTS.md"
          Target = 1UL
          Warn = 3UL
          Fail = 5UL }

    let evaluate text =
        checkResolvedTextTree
            (Map.ofList [ "AGENTS.md", text ])
            { Surfaces = []
              ResolvedTree = threshold }
        |> Option.get

    Assert.Contains("over 1-word target", (evaluate "one two").Message)
    Assert.Contains("over 3-word warn threshold", (evaluate "one two three four").Message)
    Assert.Contains("over 5-word fail limit", (evaluate "one two three four five six").Message)

    let cycle = Map.ofList [ "a.md", "@b.md one"; "b.md", "@a.md two" ]
    Assert.Equal(2UL, resolveTextTreeSize cycle "a.md")
    Assert.Equal(1UL, resolveTextTreeSize (Map.ofList [ "root.md", "@/" ]) "root.md")

[<Fact>]
let ``RepoConfig pure path and glob validation covers every rejection family`` () =
    for value, expected in
        [ "", "non-empty"
          "/etc/passwd", "repository-relative"
          " leading", "whitespace"
          "trailing ", "whitespace"
          "a/../b", "parent-directory" ] do
        match validateRepoRelativePath value with
        | Error message -> Assert.Contains(expected, message)
        | Ok() -> Assert.Fail(sprintf "expected %s to fail" value)

    Assert.Equal<Result<unit, string>>(Ok(), validateRepoRelativePath "tooling/sdk/global.json")
    Assert.True(pathIsUnder "a/b" "a")
    Assert.True(pathIsUnder "a/" "a")
    Assert.False(pathIsUnder "a-b" "a")
    Assert.False(pathIsUnder "a" "")

    let patterns =
        [ "file[0-9].txt", None
          "[]abc]", None
          "[9-0]", Some "invalid range"
          "[abc", Some "unclosed character class"
          "***", Some "wildcards are either"
          "a**b", Some "recursive wildcards" ]

    for pattern, expected in patterns do
        match globPatternError pattern, expected with
        | None, None -> ()
        | Some actual, Some fragment -> Assert.Contains(fragment, actual)
        | actual, expected ->
            Assert.Fail(sprintf "unexpected glob result %A for %s; expected %A" actual pattern expected)

[<Fact>]
let ``RepoConfig semantic validation reports independent gate metadata violations in process`` () =
    let baseGate = gate "valid" Check External

    let broken =
        [ { baseGate with
              Id = "Bad Id"
              DoctorTools = [ "git"; "git"; "mystery" ]
              Wiring = Some Matrix
              Restages = true
              Surfaces =
                  [ PrePush,
                    { scope Other with
                        Glob = Some "*.md"
                        LintStagedShell = Some " " }
                    CommitMsg, scope PathGated
                    PreCommit, scope AffectedProjects ] }
          { baseGate with
              Id = "valid"
              GateType = Mutation
              CarveOut = Some StagedOnly
              Wiring = Some HandWired
              Surfaces = [ PrePush, scope AllFileType ] }
          { baseGate with
              Id = "valid"
              Kind = Nx
              Surfaces = [ Ci, scope AllFileType ] } ]

    let findings = gateSemanticFindings (config broken)

    for fragment in
        [ "lowercase kebab-case"
          "duplicate gate id"
          "unknown Doctor tool"
          "duplicate Doctor tool"
          "glob and globs require a file scope"
          "only valid for pre-commit affected-file-type"
          "must not be blank"
          "path-gated scope requires at least one trigger"
          "project scopes require kind nx"
          "nx kind requires"
          "wiring: only valid"
          "restages: only valid"
          "carve-out: only valid" ] do
        Assert.Contains(findings, fun finding -> finding.Contains(fragment))

[<Fact>]
let ``RepoConfig parses catalog entries and injected dotnet requirements without resources`` () =
    let text =
        "harness:\n  - name: codex\n    tier: generated\n    catalog:\n      platform: Codex\n      reads-agents-md: yes\n      instruction-surface: AGENTS.md\n      mcp-config: .codex/config.toml\n      agent-surface: .codex/agents\n      skills-surface: .agents/skills\n      status: active\n"

    match parse text with
    | Ok parsed ->
        let catalog = parsed.Harness.Head.Catalog.Value
        Assert.Equal("Codex", catalog.Platform)
        Assert.Equal(".agents/skills", catalog.SkillsSurface)
    | Error message -> Assert.Fail message

    let configured =
        { RepoConfig.empty with
            Doctor =
                { DotnetGlobalJson = Some "tooling/dotnet.json"
                  SkipTools = []
                  ExtraTools = [] } }

    let tool =
        buildDotnetToolDefWith (fun path -> Ok(sprintf "{ \"sdk\": { \"version\": \"%s\" } }" path)) configured

    Assert.Equal("tooling/dotnet.json", tool.ReadReq())

    for reader in
        [ (fun _ -> Error "missing")
          (fun _ -> Ok "not-json")
          (fun _ -> Ok "{}")
          (fun _ -> Ok "{ \"sdk\": {} }")
          (fun _ -> Ok "{ \"sdk\": { \"version\": 10 } }") ] do
        Assert.Equal("", (buildDotnetToolDefWith reader configured).ReadReq())

[<Fact>]
let ``RepoConfig strict parser rejects malformed harness ownership and every gate enum`` () =
    let failures =
        [ "harness:\n  - name: bad\n    tier: other\n", "tier"
          "harness:\n  - name: bad\n    tier: source\n    ownership:\n      - path: .claude\n", "class"
          "harness:\n  - scalar\n", ""
          "harness:\n  - name: bad\n    ownership: scalar\n", ""
          "gates:\n  - id: bad\n    type: unknown\n", "type"
          "gates:\n  - id: bad\n    kind: unknown\n", "kind"
          "gates:\n  - id: bad\n    wiring: unknown\n", "wiring"
          "gates:\n  - id: bad\n    carve-out: unknown\n", "carve-out"
          "gates:\n  - id: bad\n    surfaces:\n      ci:\n        scope: unknown\n", "scope" ]

    for document, fragment in failures do
        match parse document with
        | Error message when fragment = "" -> Assert.NotEmpty message
        | Error message -> Assert.Contains(fragment, message)
        | Ok parsed -> Assert.Fail(sprintf "expected strict parse failure, got %A" parsed)

    Assert.Equal<RepoConfig>(RepoConfig.empty, parse "{}" |> Result.defaultWith failwith)

    for document in
        [ ""
          "scalar"
          "harness: {}"
          "harness:\n  - name: valid\n    tier: source\n  - name: broken\n    tier: invalid\n"
          "gates:\n  - scalar\n"
          "gates:\n  - id: shape\n    surfaces: scalar\n"
          "gates:\n  - id: shape\n    surfaces:\n      ? [complex]\n      : { scope: other }\n" ] do
        parse document |> ignore

[<Fact>]
let ``RepoConfig semantic validation handles repeated shell placeholders and misplaced triggers`` () =
    let repeatedShell =
        { scope AffectedFileType with
            LintStagedShell = Some "{{command}} and {{command}}" }

    let misplacedTrigger =
        { scope Other with
            Trigger = [ "src/**" ] }

    let gates =
        [ { gate "shell" Check External with
              Surfaces = [ PreCommit, repeatedShell ] }
          { gate "trigger" Check External with
              Surfaces = [ Ci, misplacedTrigger ]
              CiGroup = Some "quality" } ]

    let findings = gateSemanticFindings (config gates)
    Assert.Contains(findings, fun finding -> finding.Contains("may appear at most once"))
    Assert.Contains(findings, fun finding -> finding.Contains("trigger: only valid for path-gated scope"))

    let validDoctor =
        { RepoConfig.empty with
            Doctor =
                { DotnetGlobalJson = Some "tooling/dotnet.json"
                  SkipTools = []
                  ExtraTools = [] } }

    Assert.Empty(semanticFindings validDoctor)

[<Fact>]
let ``Gate listing renders every enum and grouping envelope`` () =
    let gates =
        [ { gate "commit" Check External with
              Surfaces = [ CommitMsg, scope Other ]
              CarveOut = Some StagedOnly }
          { gate "files" Mutation RhinoCli with
              Surfaces = [ PreCommit, scope AffectedFileType ]
              Wiring = Some Matrix
              CiGroup = Some "format" }
          { gate "all-files" Check External with
              Surfaces = [ PrePush, scope AllFileType ] }
          { gate "projects" Check Nx with
              Surfaces = [ Ci, scope AffectedProjects ]
              CiGroup = Some "test" }
          { gate "all-projects" Check Nx with
              Surfaces = [ Ci, scope AllProjects ]
              CiGroup = Some "test" }
          { gate "path" Check External with
              Surfaces = [ Ci, scope PathGated ]
              Wiring = Some HandWired
              CiGroup = Some "manual" } ]

    for surface in [ "commit-msg"; "pre-commit"; "pre-push"; "ci" ] do
        Assert.True(Result.isOk (Gate.listFromConfig (config gates) surface OutputFormat.Json false))

    let grouped =
        Gate.listFromConfig (config gates) "ci" OutputFormat.Text true
        |> Result.defaultWith failwith

    Assert.Contains("test", grouped)
    Assert.DoesNotContain("path", grouped)
    Assert.True(Result.isError (Gate.listFromConfig (config gates) "unknown" OutputFormat.Text false))

[<Fact>]
let ``Gate lint-staged rendering quotes fixed arguments and handles package shapes`` () =
    let fileScope =
        { scope AffectedFileType with
            Glob = Some "*.md"
            Globs = [ "*.txt" ]
            LintStagedShell = Some "prefix {{command}} suffix" }

    let gates =
        [ { gate "node" Check External with
              Command = "npx --yes prettier --check"
              DoctorTools = [ "npm" ]
              Args = Map.ofList [ "value", [ "a\\\"$`b" ] ]
              Surfaces = [ PreCommit, fileScope ] }
          { gate "rhino" Mutation RhinoCli with
              Command = "md format"
              Category = Some "formatter"
              Surfaces =
                  [ PreCommit,
                    { fileScope with
                        LintStagedShell = Some "plain script" } ] }
          { gate "ignored" Mutation External with
              Surfaces = [ PreCommit, fileScope ] } ]

    let rendered = Gate.lintStagedFromConfig (config gates)
    Assert.Equal(2, rendered.Length)
    Assert.Contains("node_modules/.bin/prettier", rendered.Head |> snd |> String.concat " ")
    Assert.Contains("bash -c 'plain script' --", rendered.Head |> snd |> String.concat " ")

    Assert.True(Result.isError (Gate.emitPackageText (config gates) "ci" "{}"))
    Assert.True(Result.isError (Gate.emitPackageText (config gates) "pre-commit" "[]"))
    Assert.True(Result.isError (Gate.emitPackageText (config gates) "pre-commit" "{"))

    let updated, _ =
        Gate.emitPackageText (config gates) "pre-commit" "{\"lint-staged\":{\"old\":[]}}"
        |> Result.defaultWith failwith

    Assert.Contains("node_modules/.bin/prettier", updated)

[<Fact>]
let ``Gate planner exercises glob classes exclusions batching and direct command fallbacks`` () =
    let preCommit glob =
        PreCommit,
        { scope AffectedFileType with
            Glob = Some glob }

    let gates =
        [ { gate "first" Check External with
              Surfaces = [ preCommit "src/[!x]?*.fs" ] }
          { gate "second" Check External with
              Surfaces = [ preCommit "src/**" ] }
          { gate "empty-command" Check External with
              Command = " "
              Surfaces = [ Ci, scope Other ]
              CiGroup = Some "empty" } ]

    let input: Gate.GatePlanningInput =
        { ChangedPaths = [ "src/ab.fs"; "src/x.fs"; "src/generated/out.fs" ]
          TrackedPaths = []
          ExistingPaths = set [ "src/ab.fs"; "src/x.fs"; "src/generated/out.fs" ] }

    let batch =
        Gate.planRun (config gates) "pre-commit" None None input
        |> Result.defaultWith failwith

    Assert.Single batch |> ignore
    Assert.True(batch.Head.Batched)

    let direct =
        Gate.planRun (config gates) "ci" None (Some "empty") input
        |> Result.defaultWith failwith

    Assert.Empty(direct.Head.Arguments)

[<Fact>]
let ``Gate pure planner reports invalid registries skips unmatched paths and batches formatter mutations`` () =
    let input: Gate.GatePlanningInput =
        { ChangedPaths = [ "src/value.fs" ]
          TrackedPaths = [ "src/value.fs" ]
          ExistingPaths = set [ "src/value.fs" ] }

    Assert.True(Result.isError (Gate.planRun (config []) "unknown" None None input))

    let invalid =
        { gate "Bad Id" Check External with
            Surfaces = [ PreCommit, scope Other ] }

    Assert.True(Result.isError (Gate.planRun (config [ invalid ]) "pre-commit" None None input))

    let pathGated =
        { gate "path" Check External with
            Surfaces =
                [ PreCommit,
                  { scope PathGated with
                      Trigger = [ "docs/**" ] } ] }

    let skipped =
        Gate.planRun (config [ pathGated ]) "pre-commit" None None input
        |> Result.defaultWith failwith

    Assert.Empty skipped

    let formatter =
        { gate "formatter" Mutation External with
            Category = Some "formatter"
            Surfaces =
                [ PreCommit,
                  { scope AffectedFileType with
                      Glob = Some "src/**" } ] }

    let batch =
        Gate.planRun (config [ formatter ]) "pre-commit" None None input
        |> Result.defaultWith failwith

    Assert.True(batch.Head.Batched)

    Assert.Equal<Result<string, string>>(
        Ok "first\tPASS\nsecond\tPASS\n",
        Gate.summarizeGroup "quality" [ "first", true; "second", true ]
    )

    let duplicated =
        [ { gate "same" Check External with
              Surfaces = [ Ci, scope PathGated ]
              CiGroup = Some "quality" }
          { gate "same" Check External with
              Surfaces = [ Ci, scope Other ]
              CiGroup = Some "quality" } ]

    Assert.True(Result.isError (Gate.listFromConfig (config duplicated) "ci" OutputFormat.Json false))

[<Fact>]
let ``Gate document validation rejects hook workflow and package drift independently`` () =
    let local =
        { gate "local" Check External with
            Surfaces = [ PreCommit, scope AffectedFileType; Ci, scope Other ]
            CiGroup = Some "quality" }

    let validate gates files executable =
        Gate.validateDocuments
            (config gates)
            { Files = Map.ofList files
              ExecutableHooks = Set.ofList executable }

    Assert.True(Result.isError (validate [ local ] [] []))

    Assert.True(
        Result.isError (
            validate
                [ local ]
                [ ".husky/pre-commit", "# ./rhino gate run --surface pre-commit" ]
                [ ".husky/pre-commit" ]
        )
    )

    let hook = "#!/bin/sh\nexec ./rhino gate run --surface pre-commit\n"

    let workflowMissing =
        validate [ local ] [ ".husky/pre-commit", hook ] [ ".husky/pre-commit" ]

    Assert.True(Result.isError workflowMissing)

    let noCi =
        { local with
            Surfaces = [ PreCommit, scope AffectedFileType ]
            CarveOut = Some StagedOnly }

    let packageDrift =
        validate
            [ noCi ]
            [ ".husky/pre-commit", hook
              "package.json", "{\"lint-staged\":{\"wrong\":[]}}" ]
            [ ".husky/pre-commit" ]

    Assert.True(Result.isError packageDrift)

[<Fact>]
let ``Gate composition validation covers duplicate ids groups verifier shapes and formatter recursion`` () =
    Assert.True(Result.isError (Gate.validateGateIds [ gate "same" Check External; gate "same" Check External ] None))

    let missingGroup =
        { gate "missing-group" Check External with
            Surfaces = [ Ci, scope Other ] }

    Assert.True(Result.isError (Gate.listFromConfig (config [ missingGroup ]) "ci" OutputFormat.Text true))

    let mutation =
        { gate "format" Mutation External with
            Category = Some "formatter" }

    let wrongVerifier =
        { gate "verify" Mutation External with
            Verifies = Some "format" }

    let noDocuments: Gate.GateValidationDocuments =
        { Files = Map.empty
          ExecutableHooks = Set.empty }

    Assert.True(Result.isError (Gate.validateDocuments (config [ mutation; wrongVerifier ]) noDocuments))

    let secondMutation = { mutation with Id = "format-two" }

    let verifier id target =
        { gate id Check External with
            Verifies = Some target }

    Assert.True(
        Result.isOk (
            Gate.validateDocuments
                (config
                    [ mutation
                      verifier "verify" "format"
                      secondMutation
                      verifier "verify-two" "format-two" ])
                noDocuments
        )
    )

[<Fact>]
let ``Gate document validation accepts a complete hand-wired workflow and rejects aggregation and package shapes`` () =
    let handWired =
        { gate "test-quick" Check Nx with
            Command = "test:quick"
            Wiring = Some HandWired
            CiGroup = Some "quality"
            Surfaces = [ Ci, scope AffectedProjects ] }

    let workflow needs condition =
        sprintf
            "jobs:\n  test-quick:\n%s    steps:\n      - run: npx nx affected build\n      - run: npx nx run ignored\n      - run: echo ignored\n      - run: npx nx affected -t test\\:quick\n      - run: rhino-cli gate run --surface=ci --only=test-quick\n      - run: rhino-cli gate run --surface=ci --group=quality\n  quality-gate:\n    needs: [%s]\n"
            condition
            needs

    let validateWorkflow yaml =
        Gate.validateDocuments
            (config [ handWired ])
            { Files = Map.ofList [ ".github/workflows/pr-quality-gate.yml", yaml ]
              ExecutableHooks = Set.empty }

    Assert.True(Result.isOk (validateWorkflow (workflow "test-quick" "")))
    Assert.True(Result.isError (validateWorkflow "jobs:\n  unrelated:\n    steps: []\n"))
    Assert.True(Result.isError (validateWorkflow (workflow "unrelated" "")))
    Assert.True(Result.isOk (validateWorkflow (workflow "test-quick" "    if: ${{ false\n")))

    let noGates = config []

    for package, succeeds in [ "{}", false; "{\"lint-staged\":{}}", true; "[]", true; "{", false ] do
        let result =
            Gate.validateDocuments
                noGates
                { Files = Map.ofList [ "package.json", package ]
                  ExecutableHooks = Set.empty }

        Assert.Equal(succeeds, Result.isOk result)

    let emitted, _ =
        Gate.emitPackageText noGates "pre-commit" "{}" |> Result.defaultWith failwith

    Assert.Contains("lint-staged", emitted)

[<Fact>]
let ``Gate workflow parsing treats malformed and non-mapping YAML as empty or invalid documents`` () =
    let matrixGate =
        { gate "matrix" Check External with
            CiGroup = Some "quality"
            Surfaces = [ Ci, scope Other ] }

    let validate yaml =
        Gate.validateDocuments
            (config [ matrixGate ])
            { Files = Map.ofList [ ".github/workflows/pr-quality-gate.yml", yaml ]
              ExecutableHooks = Set.empty }

    for yaml in
        [ ""
          "- scalar\n"
          "{}\n"
          "[\n"
          "jobs:\n  scalar-job: scalar\n  structured:\n    steps: scalar\n    strategy:\n      matrix:\n        group: [one]\n    if: {}\n" ] do
        Assert.True(Result.isError (validate yaml))

[<Fact>]
let ``Gate package validation accepts the exact non-empty lint-staged projection`` () =
    let fileScope =
        { scope AffectedFileType with
            Glob = Some "*.md" }

    let local =
        { gate "markdown" Check External with
            Command = "markdownlint"
            CarveOut = Some StagedOnly
            Surfaces = [ PreCommit, fileScope ] }

    let registry = config [ local ]

    let package, _ =
        Gate.emitPackageText registry "pre-commit" "{}" |> Result.defaultWith failwith

    let result =
        Gate.validateDocuments
            registry
            { Files =
                Map.ofList
                    [ ".husky/pre-commit", "#!/bin/sh\nexec ./rhino gate run --surface pre-commit\n"
                      "package.json", package ]
              ExecutableHooks = set [ ".husky/pre-commit" ] }

    Assert.True(Result.isOk result)

[<Fact>]
let ``RepoConfig parses the grade vocabulary and each harness's model map`` () =
    // A grade whose `effort` is absent, and a grade whose whole entry is null,
    // both drop out rather than landing in the map with an empty effort — an
    // empty effort would read as "this grade declares no effort requirement".
    let text =
        String.Join(
            "\n",
            [ "model-grades:"
              "  planning: { effort: high }"
              "  execution: { effort: xhigh }"
              "  effortless: {}"
              "  absent:"
              "harness:"
              "  - name: claude-code"
              "    tier: source"
              "    model-map: { planning: opus, execution: sonnet }"
              "  - name: opencode"
              "    tier: generated"
              "" ]
        )

    match parse text with
    | Error message -> Assert.Fail message
    | Ok parsed ->
        Assert.Equal<Map<string, string>>(Map.ofList [ "planning", "high"; "execution", "xhigh" ], parsed.ModelGrades)

        let byName name =
            parsed.Harness |> List.find (fun entry -> entry.Name = name)

        Assert.Equal<Map<string, string>>(
            Map.ofList [ "planning", "opus"; "execution", "sonnet" ],
            (byName "claude-code").ModelMap
        )

        // An entry declaring no `model-map:` is the state that makes a mirror
        // pin no model at all, so it must parse to an empty map, not a failure.
        Assert.True((byName "opencode").ModelMap.IsEmpty)

// Plan edge shapes the shared corpus never reaches. Every expected outcome below
// is RHINO v0.3.0's own exit code, stdout and stderr for the same tree on disk,
// so these hold the F# port to RHINO's bytes rather than to a reading of its source.

/// Runs the pure plan validator over in-memory documents; `refuse` names the
/// read failure a document meets, if any.
let private planReport (documents: (string * string) list) (refuse: string -> string option) : Plan.PlanReport =
    let tree = Map.ofList documents

    let read path =
        match refuse path, Map.tryFind path tree with
        | Some reason, _ -> Plan.Unreadable reason
        | None, Some text -> Plan.Found text
        | None, None -> Plan.Missing

    Plan.validate (List.map fst documents) read

let private planOutcome exitCode stdout stderr : Plan.PlanOutcome =
    { Plan.ExitCode = exitCode
      Plan.Stdout = stdout
      Plan.Stderr = stderr }

[<Fact>]
let ``Plan reads fences, CRLF, unterminated text, link suffixes, and an extensionless companion as RHINO does`` () =
    let documents =
        [ "plans/backlog/edge-plan/README.md", "# Plan\n"
          "plans/backlog/edge-plan/brd.md", "# BRD\n"
          "plans/backlog/edge-plan/delivery.md",
          "# Delivery\n\n## Phase 1\n\n- [ ] work without a label\n- [ ] [AI] cite [AC-01\n"
          "plans/backlog/edge-plan/learnings.md", "# Learnings\n"
          "plans/backlog/edge-plan/tech-docs/001-first", "# First"
          "plans/backlog/edge-plan/tech-docs/README.md",
          "# Tech\r\n\n```md\n[hidden](002-hidden.md)\n~~~\n```\n[slash](back\\slash.md)\n[first](001-first) [anchor](001-first#part) [query](001-first?x=1) [dir](sub/x.md) [web](https://example.com) [open](unclosed" ]

    let report = planReport documents (fun _ -> None)

    Assert.Equal(
        planOutcome
            1
            "[plan] checked 1 plan, 3 findings\n"
            "[plan] plans/backlog/edge-plan:1:1 PLAN-DOCUMENT-001 prd.md required plan document is missing\n[plan] plans/backlog/edge-plan/delivery.md:5:1 PLAN-DELIVERY-001 - checklist item carries no executor label\n[plan] plans/backlog/edge-plan/tech-docs/README.md:7:1 PLAN-COMPANION-006 back\\slash.md entrypoint lists a companion that does not exist\n",
        Plan.renderText report
    )

    Assert.Equal(
        planOutcome
            1
            "{\"schemaVersion\":1,\"command\":\"plan\",\"exitCode\":1,\"subject\":\"plan\",\"inspected\":1,\"scanned\":[],\"notes\":[],\"violations\":[{\"kind\":\"PLAN-DOCUMENT-001\",\"path\":\"plans/backlog/edge-plan\",\"message\":\"required plan document is missing\",\"line\":1,\"column\":1,\"field\":\"prd.md\"},{\"kind\":\"PLAN-DELIVERY-001\",\"path\":\"plans/backlog/edge-plan/delivery.md\",\"message\":\"checklist item carries no executor label\",\"line\":5,\"column\":1,\"field\":\"-\"},{\"kind\":\"PLAN-COMPANION-006\",\"path\":\"plans/backlog/edge-plan/tech-docs/README.md\",\"message\":\"entrypoint lists a companion that does not exist\",\"line\":7,\"column\":1,\"field\":\"back\\\\slash.md\"}]}\n"
            "",
        Plan.renderJson report
    )

[<Fact>]
let ``Plan checks a CRLF delivery against an unterminated requirements document as RHINO does`` () =
    let documents =
        [ "plans/backlog/criteria-plan/README.md", "# Plan\n"
          "plans/backlog/criteria-plan/brd.md", "# BRD\n"
          "plans/backlog/criteria-plan/delivery.md",
          "# Delivery\r\n\r\n## Phase 1\r\n\r\n- [ ] [AI] work [AC-01] and [broken\r\n"
          "plans/backlog/criteria-plan/learnings.md", "# Learnings\n"
          "plans/backlog/criteria-plan/prd.md", "# PRD\n\n```gherkin\nScenario: [AC-01] one\n```"
          "plans/backlog/criteria-plan/tech-docs.md", "# Tech\n" ]

    let report = planReport documents (fun _ -> None)
    Assert.Equal(planOutcome 0 "[plan] checked 1 plan, no findings\n" "", Plan.renderText report)

    Assert.Equal(
        planOutcome
            0
            "{\"schemaVersion\":1,\"command\":\"plan\",\"exitCode\":0,\"subject\":\"plan\",\"inspected\":1,\"scanned\":[],\"notes\":[],\"violations\":[]}\n"
            "",
        Plan.renderJson report
    )

[<Fact>]
let ``Plan names an unknown root holding quotes and control characters as RHINO does`` () =
    let documents = [ "plans/we\"ird/root\t\r\n\u0001/slug/README.md", "# Plan\n" ]

    let report = planReport documents (fun _ -> None)

    Assert.Equal(
        planOutcome
            1
            "[plan] checked 1 plan, 7 findings\n"
            "[plan] plans/we\"ird:1:1 PLAN-LIFECYCLE-001 we\"ird plan root is not one of ideas, backlog, in-progress, done\n[plan] plans/we\"ird/root\t\r\n\u0001:1:1 PLAN-DOCUMENT-001 README.md required plan document is missing\n[plan] plans/we\"ird/root\t\r\n\u0001:1:1 PLAN-DOCUMENT-001 brd.md required plan document is missing\n[plan] plans/we\"ird/root\t\r\n\u0001:1:1 PLAN-DOCUMENT-001 delivery.md required plan document is missing\n[plan] plans/we\"ird/root\t\r\n\u0001:1:1 PLAN-DOCUMENT-001 learnings.md required plan document is missing\n[plan] plans/we\"ird/root\t\r\n\u0001:1:1 PLAN-DOCUMENT-001 prd.md required plan document is missing\n[plan] plans/we\"ird/root\t\r\n\u0001:1:1 PLAN-DOCUMENT-003 tech-docs plan carries no technical shape\n",
        Plan.renderText report
    )

    Assert.Equal(
        planOutcome
            1
            "{\"schemaVersion\":1,\"command\":\"plan\",\"exitCode\":1,\"subject\":\"plan\",\"inspected\":1,\"scanned\":[],\"notes\":[],\"violations\":[{\"kind\":\"PLAN-LIFECYCLE-001\",\"path\":\"plans/we\\\"ird\",\"message\":\"plan root is not one of ideas, backlog, in-progress, done\",\"line\":1,\"column\":1,\"field\":\"we\\\"ird\"},{\"kind\":\"PLAN-DOCUMENT-001\",\"path\":\"plans/we\\\"ird/root\\t\\r\\n\\u0001\",\"message\":\"required plan document is missing\",\"line\":1,\"column\":1,\"field\":\"README.md\"},{\"kind\":\"PLAN-DOCUMENT-001\",\"path\":\"plans/we\\\"ird/root\\t\\r\\n\\u0001\",\"message\":\"required plan document is missing\",\"line\":1,\"column\":1,\"field\":\"brd.md\"},{\"kind\":\"PLAN-DOCUMENT-001\",\"path\":\"plans/we\\\"ird/root\\t\\r\\n\\u0001\",\"message\":\"required plan document is missing\",\"line\":1,\"column\":1,\"field\":\"delivery.md\"},{\"kind\":\"PLAN-DOCUMENT-001\",\"path\":\"plans/we\\\"ird/root\\t\\r\\n\\u0001\",\"message\":\"required plan document is missing\",\"line\":1,\"column\":1,\"field\":\"learnings.md\"},{\"kind\":\"PLAN-DOCUMENT-001\",\"path\":\"plans/we\\\"ird/root\\t\\r\\n\\u0001\",\"message\":\"required plan document is missing\",\"line\":1,\"column\":1,\"field\":\"prd.md\"},{\"kind\":\"PLAN-DOCUMENT-003\",\"path\":\"plans/we\\\"ird/root\\t\\r\\n\\u0001\",\"message\":\"plan carries no technical shape\",\"line\":1,\"column\":1,\"field\":\"tech-docs\"}]}\n"
            "",
        Plan.renderJson report
    )

[<Fact>]
let ``Plan refuses a plan document it cannot read as RHINO does`` () =
    let documents =
        [ "plans/backlog/locked-plan/README.md", "# Plan\n"
          "plans/backlog/locked-plan/brd.md", "# BRD\n"
          "plans/backlog/locked-plan/delivery.md", "# Delivery\n\n## Phase 1\n\n- [ ] [AI] work [AC-01]\n"
          "plans/backlog/locked-plan/learnings.md", "# Learnings\n"
          "plans/backlog/locked-plan/prd.md", "# PRD\n\n```gherkin\nScenario: [AC-01] one\n```\n"
          "plans/backlog/locked-plan/tech-docs.md", "# Tech\n" ]

    let report =
        planReport documents (fun path ->
            if path.EndsWith("/delivery.md", StringComparison.Ordinal) then
                Some "Permission denied (os error 13)"
            else
                None)

    Assert.Equal(
        planOutcome 2 "" "[plan] plans/backlog/locked-plan/delivery.md: Permission denied (os error 13)\n",
        Plan.renderText report
    )

    Assert.Equal(
        planOutcome 2 "" "[plan] plans/backlog/locked-plan/delivery.md: Permission denied (os error 13)\n",
        Plan.renderJson report
    )
