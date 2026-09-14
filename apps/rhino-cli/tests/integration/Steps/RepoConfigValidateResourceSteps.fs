/// TickSpec step definitions binding
/// `repo-config-validate.feature`'s five scenarios to
/// `RhinoCli.Application.RepoConfig`
/// [Repo-grounded —
/// `specs/apps/rhino/cli/behaviours/repo-config-validate/repo-config-validate.feature`,
/// `apps/rhino-cli/tests/repo_config_validate.rs`].
///
/// Follows `RepoConfigSteps.fs`'s per-scenario slicing convention: each xunit
/// `[<Fact>]` below runs exactly one scenario, extracted from the real,
/// frozen feature file rather than a duplicated/rewritten copy of its
/// wording.
///
/// Scenarios 2 and 3 ("the canonical repo-config.yml") read THIS
/// repository's own real `repo-config.yml` via
/// `RhinoCli.Infrastructure.GitRoot.findRoot` — mirroring the Rust step
/// definitions, which load the real file for the same reason. The vendored
/// skill-directory set is derived from the real `.agents/skills`/
/// `.claude/skills` trees at test-run time rather than hard-coded, because
/// any vendored plugin payload is repository-local — a sibling repository
/// may carry one while another carries none — and a hard-coded expectation
/// here would make this file non-portable across them, breaking this port's
/// byte-identical-source goal.
///
/// Scenarios 4 and 5 build a synthetic, self-contained fixture (mirroring
/// the Rust suite's `synthetic_config_with_vendored_probe`) for the same
/// reason: which paths are vendored is repository-local, so a scenario
/// probing the vendored/ownership cross-check must not depend on either
/// repo's actual vendored set.
module RhinoCli.Tests.Integration.Steps.RepoConfigValidateResourceSteps

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/repo-config-validate/repo-config-validate.feature" ]

open System
open System.IO
open TickSpec
open Xunit
open RhinoCli.Application.RepoConfig

/// Instance step-definition container — see `ConventionSteps.fs`'s module
/// doc comment for why TickSpec's one-instance-per-scenario lifecycle makes
/// instance-level mutable fields the idiomatic state-threading mechanism
/// here.
type RepoConfigValidateSteps() =
    let mutable canonicalText: string option = None
    let mutable loadedConfig: RepoConfig option = None
    let mutable codexEntry: HarnessEntry option = None
    let mutable codexEntryText: string option = None
    let mutable lastValidate: (bool * string) option = None
    let mutable lastLoad: Result<RepoConfig, string> option = None
    let mutable baselineText: string option = None
    let mutable workingText: string option = None

    let probePath = ".agents/skills/probe"

    let newTempDir () =
        let dir =
            Path.Combine(Path.GetTempPath(), "rhino-cli-repo-config-validate-" + Guid.NewGuid().ToString("N"))

        Directory.CreateDirectory(dir) |> ignore
        dir

    /// Writes `content` as `repo-config.yml` inside a fresh, throwaway temp
    /// directory, runs `f` against that directory, then deletes it — every
    /// synthetic fixture below is validated through this rather than a
    /// persistent shared directory, since each call is independent.
    let withTempConfig (content: string) (f: string -> 'a) : 'a =
        let dir = newTempDir ()

        try
            File.WriteAllText(Path.Combine(dir, "repo-config.yml"), content)
            f dir
        finally
            Directory.Delete(dir, true)

    let runLoad (content: string) : Result<RepoConfig, string> =
        withTempConfig content RhinoCli.Application.RepoConfig.load

    let runValidate (content: string) : bool * string =
        withTempConfig content RhinoCli.Application.RepoConfig.validateAtRoot

    /// Replaces the first (and, for every call site below, only) occurrence
    /// of `pattern` in `input` with `replacement` — `String.Replace` would
    /// silently replace every occurrence, which is the wrong tool whenever a
    /// test needs to prove exactly one mutation caused a result.
    let replaceFirst (pattern: string) (replacement: string) (input: string) : string =
        let idx = input.IndexOf(pattern, StringComparison.Ordinal)

        if idx < 0 then
            failwith (sprintf "pattern not found: %s" pattern)

        input.Substring(0, idx) + replacement + input.Substring(idx + pattern.Length)

    let readCanonicalConfigText () : string * string =
        match RhinoCli.Infrastructure.GitRoot.findRoot () with
        | Error message -> failwith message
        | Ok repoRoot -> repoRoot, File.ReadAllText(Path.Combine(repoRoot, "repo-config.yml"))

    /// The rhino-cli registry's indentation in raw repo-config.yml text: a v2
    /// document nests it under `extensions.rhino-cli`, four columns in; a v1
    /// document keeps it at the root.
    let registryIndent (text: string) : string =
        if text.Contains("\nextensions:\n  rhino-cli:\n", StringComparison.Ordinal) then
            "    "
        else
            ""

    /// Shifts a registry fragment written in v1 column positions to where the
    /// registry sits in `text`, so one mutation reads the same for v1 and v2.
    let reindent (text: string) (fragment: string) : string =
        let indent = registryIndent text

        fragment.Split('\n')
        |> Array.map (fun line -> if line = "" then line else indent + line)
        |> String.concat "\n"

    /// Slices the `- name: codex` harness entry out of raw repo-config.yml
    /// text: from its own line up to (but excluding) the next line at or left
    /// of the registry's own indentation, mirroring the Rust suite's `slice_codex_entry`.
    let sliceCodexEntry (text: string) : string =
        let indent = registryIndent text
        let marker = sprintf "\n%s  - name: codex" indent
        let idx = text.IndexOf(marker, StringComparison.Ordinal)

        if idx < 0 then
            failwith "codex harness entry not found in repo-config.yml"

        let rest = text.Substring(idx + 1)
        let lines = rest.Split('\n')

        let entryLines =
            lines
            |> Array.skip 1
            |> Array.takeWhile (fun l -> l.Length = 0 || l.StartsWith(indent + " ", StringComparison.Ordinal))

        String.concat "\n" (Array.append [| lines.[0] |] entryLines)

    /// Every `.agents/skills/<dir>` with no `.claude/skills/<dir>`
    /// counterpart: plugin payload with no canonical source to regenerate it
    /// from, derived from the real filesystem rather than hard-coded (see
    /// module doc comment). Repo-relative, sorted.
    let vendoredSkillDirs (repoRoot: string) : string list =
        let mirror = Path.Combine(repoRoot, ".agents", "skills")
        let source = Path.Combine(repoRoot, ".claude", "skills")

        if not (Directory.Exists mirror) then
            []
        else
            Directory.GetDirectories(mirror)
            |> Array.map Path.GetFileName
            |> Array.filter (fun name -> not (Directory.Exists(Path.Combine(source, name))))
            |> Array.map (fun name -> ".agents/skills/" + name)
            |> Array.sort
            |> List.ofArray

    /// A minimal, self-contained registry declaring one generated harness
    /// entry whose `vendored:` list and `ownership: class: vendored`
    /// declaration agree on `probePath` — the fixture scenarios 4 and 5
    /// mutate in one direction each.
    let syntheticConfigWithVendoredProbe () : string =
        String.concat
            "\n"
            [ "harness:"
              "  - name: codex"
              "    tier: generated"
              "    agent-dir: .codex/agents"
              "    mirrors: .claude/agents"
              "    skills-dir: .agents/skills"
              "    skills-mirrors: .claude/skills"
              "    vendored:"
              sprintf "      - %s" probePath
              "    ownership:"
              sprintf "      - { path: %s, class: vendored, reason: synthetic probe for the cross-check }" probePath
              "" ]

    // ---- Given/When/Then: schema-parity gate (scenario 1) ----

    [<Given>]
    member _.``"rhino-cli repo-config validate" in each repo's pre-commit and pre-push/PR``() =
        let _, text = readCanonicalConfigText ()
        canonicalText <- Some text

    [<When>]
    member _.``repo-config.yml is validated``() =
        lastValidate <- Some(runValidate (Option.get canonicalText))

    [<Then>]
    member _.``the command strict-deserializes it against the canonical RepoConfig schema``() =
        match lastValidate with
        | Some(ok, output) -> Assert.True(ok, sprintf "canonical repo-config.yml must validate cleanly: %s" output)
        | None -> Assert.Fail("no validation has run")

    [<Then>]
    member _.``it passes when only values differ``() =
        let mutated =
            replaceFirst
                "config: .opencode/opencode.json"
                "config: .opencode/opencode-alt.json"
                (Option.get canonicalText)

        let ok, output = runValidate mutated
        Assert.True(ok, sprintf "a value-only change (identical key set) must still pass: %s" output)

    [<Then>]
    member _.``it fails when a required key is missing or an unknown key is present``() =
        let withUnknownKey =
            replaceFirst
                (reindent (Option.get canonicalText) "  - name: claude-code\n")
                (reindent (Option.get canonicalText) "  - name: claude-code\n    bogus-unknown-key: true\n")
                (Option.get canonicalText)

        let okUnknown, outputUnknown = runValidate withUnknownKey
        Assert.False(okUnknown, sprintf "an unknown key inside a harness entry must be rejected: %s" outputUnknown)

        let withMissingTier =
            replaceFirst
                (reindent (Option.get canonicalText) "  - name: claude-code\n    tier: source\n")
                (reindent (Option.get canonicalText) "  - name: claude-code\n")
                (Option.get canonicalText)

        let okMissing, outputMissing = runValidate withMissingTier
        Assert.False(okMissing, sprintf "a missing required key must be rejected: %s" outputMissing)

    [<Then>]
    member _.``running it independently against the byte-identical schema in both repos is equivalent to an identical key set across both repo-config.yml files``
        ()
        =
        let valueVariant =
            replaceFirst
                "config: .opencode/opencode.json"
                "config: .opencode/opencode-alt.json"
                (Option.get canonicalText)

        let keyVariant =
            replaceFirst
                (reindent (Option.get canonicalText) "  - name: claude-code\n")
                (reindent (Option.get canonicalText) "  - name: claude-code\n    bogus-unknown-key: true\n")
                (Option.get canonicalText)

        let okValue, _ = runValidate valueVariant
        let okKey, _ = runValidate keyVariant
        Assert.True(okValue, "identical key set (values differ) must validate")
        Assert.False(okKey, "divergent key set (unknown key) must fail")

    // ---- Given/When/Then: codex skills mirror (scenario 2) ----

    [<Given>]
    member _.``the canonical repo-config.yml``() =
        let repoRoot, text = readCanonicalConfigText ()
        canonicalText <- Some text

        match RhinoCli.Application.RepoConfig.load repoRoot with
        | Error message -> failwith message
        | Ok config -> loadedConfig <- Some config

    [<When>]
    member _.``the codex harness entry is inspected``() =
        match loadedConfig with
        | None -> Assert.Fail("no config was loaded by a Given step")
        | Some config ->
            codexEntry <- config.Harness |> List.tryFind (fun h -> h.Name = "codex")
            codexEntryText <- canonicalText |> Option.map sliceCodexEntry
            Assert.True(codexEntry.IsSome, "codex harness entry must exist in repo-config.yml")

    [<Then>]
    member _.``it declares ".agents/skills" as a mirror of ".claude/skills"``() =
        match codexEntry with
        | None -> Assert.Fail("codex entry was not loaded by a When step")
        | Some entry ->
            Assert.Equal<string option>(Some ".agents/skills", entry.SkillsDir)
            Assert.Equal<string option>(Some ".claude/skills", entry.SkillsMirrors)
            // A declaration the schema does not know is a silent no-op, so
            // prove the strict deserializer actually accepts these keys
            // rather than merely tolerating their absence.
            let ok, output = runValidate (Option.get canonicalText)
            Assert.True(ok, sprintf "the canonical config carrying skills-mirrors must strict-deserialize: %s" output)

    [<Then>]
    member _.``it declares every vendored skill subdirectory``() =
        let repoRoot, _ = readCanonicalConfigText ()
        let expected = vendoredSkillDirs repoRoot

        match codexEntry with
        | None -> Assert.Fail("codex entry was not loaded by a When step")
        | Some entry ->
            let declared = entry.Vendored |> List.sort
            Assert.Equal<string list>(expected, declared)

    [<Then>]
    member _.``each vendored entry names the plugin it came from``() =
        match codexEntry, codexEntryText with
        | None, _
        | _, None -> Assert.Fail("codex entry was not loaded by a When step")
        | Some entry, Some entryText ->
            // A bare path list says WHICH directories are exempt but not WHY,
            // so a later reader cannot tell a genuine plugin payload from a
            // mistake someone silenced.
            for dir in entry.Vendored do
                let line =
                    entryText.Split('\n')
                    |> Array.tryFind (fun l -> l.TrimStart().StartsWith("- " + dir, StringComparison.Ordinal))

                match line with
                | None -> Assert.Fail(sprintf "vendored entry %s must be on its own line" dir)
                | Some l ->
                    let parts = l.Split('#')

                    Assert.True(parts.Length > 1, sprintf "vendored entry %s carries no inline origin comment" dir)
                    Assert.Contains("plugin", parts.[1].ToLowerInvariant())

    [<Then>]
    member _.``the schema rejects a typo'd key inside the vendored declaration``() =
        let baseline =
            String.concat
                "\n"
                [ "harness:"
                  "  - name: probe"
                  "    tier: generated"
                  "    ownership:"
                  "      - { path: probe/path, class: vendored, reason: synthetic probe }"
                  "" ]

        match runLoad baseline with
        | Ok _ -> ()
        | Error message -> Assert.Fail(sprintf "baseline ownership fixture (no typo) must load cleanly: %s" message)

        let typod = replaceFirst "reason:" "resaon:" baseline

        match runLoad typod with
        | Error _ -> ()
        | Ok _ -> Assert.Fail("a typo'd key inside an ownership entry must be rejected")

    // ---- Given/When/Then: exhaustive ownership classes (scenario 3) ----

    [<When>]
    member _.``the harness ownership declarations are inspected``() =
        match loadedConfig with
        | None -> Assert.Fail("no config was loaded by a Given step")
        | Some config -> Assert.False(List.isEmpty config.Harness, "the harness registry must not be empty")

    [<Then>]
    member _.``every binding path a harness entry claims carries exactly one of the classes "generated", "vendored", or "source"``
        ()
        =
        match loadedConfig with
        | None -> Assert.Fail("no config was loaded by a Given step")
        | Some config ->
            // Every `OwnershipClass` value is, by construction, exactly one
            // of the three cases below — an exhaustive match on all
            // three cases, with none omitted, is what makes a fourth case
            // a compile error rather than a silently-ignored value.
            let allOwnership = config.Harness |> List.collect (fun h -> h.Ownership)
            Assert.False(List.isEmpty allOwnership, "at least one ownership declaration must exist")

            for owned in allOwnership do
                match owned.Class with
                | ClassGenerated
                | ClassVendored
                | ClassSource -> ()

            // Scope note: this port models only agent-dir/skills-dir/vendored
            // as "claimed paths" (not config/rules-dir/instruction, which
            // this port does not parse into structured fields — see the
            // module doc comment on `RepoConfig.fs`), so the completeness
            // check below is narrower than the Rust suite's own
            // `claimed_paths`-based check.
            let claimedPaths (entry: HarnessEntry) : string list =
                (entry.AgentDir |> Option.toList)
                @ (entry.SkillsDir |> Option.toList)
                @ entry.Vendored

            let unclassified =
                [ for entry in config.Harness do
                      for path in claimedPaths entry do
                          if not (entry.Ownership |> List.exists (fun o -> o.Path = path)) then
                              yield sprintf "%s: %s" entry.Name path ]

            Assert.True(
                List.isEmpty unclassified,
                sprintf "every claimed path must carry a declared ownership class; unclassified: %A" unclassified
            )

    [<Then>]
    member _.``a registry entry declaring a fourth class value fails to deserialize``() =
        let mutated =
            replaceFirst "class: source" "class: bespoke" (Option.get canonicalText)

        match runLoad mutated with
        | Error _ -> ()
        | Ok _ ->
            Assert.Fail(
                "a class value outside generated/vendored/source must be a hard deserialization error rather than a silently-ignored value"
            )

    [<Then>]
    member _.``a vendored declaration carrying an empty reason fails validation``() =
        let text = Option.get canonicalText

        let line =
            text.Split('\n')
            |> Array.tryFind (fun l -> l.Contains("class: vendored"))
            |> Option.defaultWith (fun () -> failwith "no vendored ownership declaration found")

        let idx = line.IndexOf("reason:", StringComparison.Ordinal)
        Assert.True(idx >= 0, "a vendored declaration must carry a reason on the same line")
        let blankedLine = line.Substring(0, idx) + "reason: \"\" }"
        let mutated = replaceFirst line blankedLine text

        let ok, output = runValidate mutated
        Assert.False(ok, sprintf "a vendored declaration with an empty reason must fail: %s" output)

    [<Then>]
    member _.``the canonical config carrying a non-empty reason on every vendored declaration exits 0``() =
        let ok, output = runValidate (Option.get canonicalText)
        Assert.True(ok, sprintf "the canonical config must validate: %s" output)

    // ---- Given/When/Then: ownership-without-vendored cross-check (scenario 4) ----

    [<Given>]
    member _.``a synthetic registry entry whose skills-dir vendored path is declared in both hand-maintained lists``() =
        let text = syntheticConfigWithVendoredProbe ()
        let ok, output = runValidate text

        Assert.True(ok, sprintf "the synthetic baseline fixture must validate cleanly before it is mutated: %s" output)

        baselineText <- Some text
        workingText <- Some text

    [<When>]
    member _.``the vendored: entry for that path is removed``() =
        let removedLine = sprintf "      - %s\n" probePath
        let text = Option.get workingText
        Assert.Contains(removedLine, text)
        workingText <- Some(replaceFirst removedLine "" text)

    [<Then>]
    member _.``rhino-cli repo-config validate fails naming the ownership path with no matching vendored entry``() =
        let ok, output = runValidate (Option.get workingText)
        lastValidate <- Some(ok, output)

        Assert.False(
            ok,
            sprintf
                "an ownership entry declared class: vendored under skills-dir with no matching vendored: entry must fail: %s"
                output
        )

        Assert.Contains(probePath, output)
        Assert.Contains("no matching", output)

    [<Then>]
    member _.``it exits 0 once the vendored entry is restored, proving the check is falsifiable in both directions``() =
        let ok, output = runValidate (Option.get baselineText)
        Assert.True(ok, sprintf "the fixture, with the vendored: entry restored, must validate: %s" output)

    // ---- When/Then: vendored-without-ownership cross-check (scenario 5) ----

    [<When>]
    member _.``the matching "class: vendored" ownership declaration for that path is changed to another class``() =
        let text = Option.get workingText
        Assert.Contains("class: vendored", text)
        workingText <- Some(replaceFirst "class: vendored" "class: generated" text)

    [<Then>]
    member _.``rhino-cli repo-config validate fails naming the vendored entry with no matching ownership declaration``
        ()
        =
        let ok, output = runValidate (Option.get workingText)
        lastValidate <- Some(ok, output)

        Assert.False(
            ok,
            sprintf
                "a vendored: entry with no matching ownership declaration carrying class: vendored must fail: %s"
                output
        )

        Assert.Contains(probePath, output)
        Assert.Contains("no matching", output)

    [<Then>]
    member _.``it exits 0 once the ownership declaration is restored to "class: vendored", proving the check is falsifiable in both directions``
        ()
        =
        let ok, output = runValidate (Option.get baselineText)
        Assert.True(ok, sprintf "the fixture, with the ownership declaration restored, must validate: %s" output)

/// Reads one named `Scenario:` block out of the real, frozen
/// `repo-config-validate.feature` file (leaving the file itself untouched)
/// and runs it through TickSpec bound only against `RepoConfigValidateSteps`
/// — see `RepoConfigSteps.fs`'s `FeatureRunner` for why this is per-scenario
/// rather than per-file.
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
                "repo-config-validate",
                "repo-config-validate.feature"
            )
        )

    let private extractScenario (featureLines: string[]) (scenarioTitle: string) : string[] =
        let featureLine =
            featureLines
            |> Array.find (fun l -> l.TrimStart().StartsWith("Feature:", StringComparison.Ordinal))

        let scenarioHeader = sprintf "Scenario: %s" scenarioTitle

        let startIdx = featureLines |> Array.findIndex (fun l -> l.Trim() = scenarioHeader)

        let endIdx =
            featureLines
            |> Array.skip (startIdx + 1)
            |> Array.tryFindIndex (fun l ->
                let trimmed = l.Trim()

                trimmed.StartsWith("Scenario:", StringComparison.Ordinal)
                || trimmed.StartsWith("Scenario Outline:", StringComparison.Ordinal))
            |> Option.map (fun relativeIdx -> startIdx + 1 + relativeIdx)
            |> Option.defaultValue featureLines.Length

        Array.append [| featureLine; "" |] featureLines.[startIdx .. endIdx - 1]

    /// Runs the single scenario named `scenarioTitle` from
    /// `repo-config-validate.feature`, bound against `RepoConfigValidateSteps`.
    let run (scenarioTitle: string) : unit =
        let allLines = File.ReadAllLines featurePath
        let snippet = extractScenario allLines scenarioTitle
        let definitions = StepDefinitions([| typeof<RepoConfigValidateSteps> |])
        let feature = definitions.GenerateFeature(featurePath, snippet)
        let scenario = Seq.exactlyOne feature.Scenarios
        scenario.Action.Invoke()

[<Fact>]
let ``A schema-parity gate enforces the identical key set`` () =
    FeatureRunner.run "A schema-parity gate enforces the identical key set"

[<Fact>]
let ``The registry declares the Codex skills mirror and its vendored exclusions`` () =
    FeatureRunner.run "The registry declares the Codex skills mirror and its vendored exclusions"

[<Fact>]
let ``There is no fourth ownership class and no undeclared reason`` () =
    FeatureRunner.run "There is no fourth ownership class and no undeclared reason"

[<Fact>]
let ``A vendored ownership declaration under skills-dir requires a matching vendored entry`` () =
    FeatureRunner.run "A vendored ownership declaration under skills-dir requires a matching vendored entry"

[<Fact>]
let ``A vendored entry under skills-dir requires a matching ownership declaration`` () =
    FeatureRunner.run "A vendored entry under skills-dir requires a matching ownership declaration"
