/// Source scan behind the F# keep list. Every governance rule `rhino-cli` still
/// implements must be named on an `extensions.rhino-cli.delegation` row of
/// `repo-config.yml`, and none may be a rule the pinned RHINO v0.3.0 provides,
/// except `plan-structure`, which AC-58 and AC-60 require F# to validate
/// directly. The scanned Application sources and the registry are embedded
/// resources, so no test here touches the filesystem.
///
/// A rule site is a top-level `validate*`, `check*`, `audit*` or `run*Validate`
/// function, a `Kind = "…"` or `Category = "…"` finding literal, or a case of a
/// `*FindingKind` union. The scan cannot see a rule hidden inside a mapped
/// function, so the function map below is reviewed with every change to it.
module RhinoCli.Tests.Unit.Steps.KeepListSourceScanTests

open System
open System.IO
open System.Reflection
open System.Text.RegularExpressions
open Xunit
open YamlDotNet.RepresentationModel

let private resourcePrefix = "keep-list/"

let private scannedSources =
    [ "Convention.fs"
      "Governance.fs"
      "HarnessPolicy.fs"
      "HarnessRuntime.fs"
      "Md.fs"
      "RepoConfig.fs"
      "RepoGovernance.fs" ]

/// Embedded text keyed by its path under `keep-list/`.
let private resources: Map<string, string> =
    let assembly = Assembly.GetExecutingAssembly()

    assembly.GetManifestResourceNames()
    |> Array.choose (fun name ->
        let normalised = name.Replace('\\', '/')

        if normalised.StartsWith(resourcePrefix, StringComparison.Ordinal) then
            use stream = assembly.GetManifestResourceStream name
            use reader = new StreamReader(stream)
            Some(normalised.Substring resourcePrefix.Length, reader.ReadToEnd().Replace("\r\n", "\n"))
        else
            None)
    |> Map.ofArray

let private functionSite =
    Regex(
        @"^let (?:rec )?((?:validate|check|audit)[A-Za-z0-9]*|run[A-Za-z0-9]*Validate)(?=\s)(?!\s*:)",
        RegexOptions.Multiline
    )

let private findingLiteral = Regex(@"\b(?:Kind|Category)\s*=\s*""([^""]+)""")

let private findingKindUnion =
    Regex(
        @"^type ([A-Za-z0-9]*FindingKind)\s*=\s*\n((?:[ \t]*\|[ \t]*[A-Z][A-Za-z0-9]*[ \t]*\n)+)",
        RegexOptions.Multiline
    )

let private unionCase = Regex(@"\|\s*([A-Z][A-Za-z0-9]*)")

/// Every rule site found in the scanned sources, as `<file> <site>`.
let private sites () : string list =
    scannedSources
    |> List.collect (fun file ->
        let source = Map.find ("src/" + file) resources

        let functions =
            [ for m in functionSite.Matches source -> sprintf "%s %s" file m.Groups.[1].Value ]

        let literals =
            [ for m in findingLiteral.Matches source -> sprintf "%s kind %s" file m.Groups.[1].Value ]

        let cases =
            [ for union in findingKindUnion.Matches source do
                  for case in unionCase.Matches union.Groups.[2].Value ->
                      sprintf "%s %s.%s" file union.Groups.[1].Value case.Groups.[1].Value ]

        functions @ literals @ cases)
    |> List.distinct

/// The rules each known site implements.
let private ruleOf: Map<string, string list> =
    [ "Md.fs validateDocsFrontmatter", [ "md-frontmatter-values" ]
      "Md.fs validateDocsFrontmatterDocuments", [ "md-frontmatter-values" ]
      "Md.fs validateDocsLinksContent", [ "md-links-anchor-and-image" ]
      "Md.fs validateDocsLinksDocuments", [ "md-links-anchor-and-image" ]
      "Md.fs validateDocsLinks", [ "md-links-anchor-and-image" ]
      "Md.fs validateAllLinksDetailed", [ "md-links-anchor-and-image" ]
      "Md.fs kind broken-anchor", [ "md-links-anchor-and-image" ]
      "Md.fs validateMermaidBlocks", [ "mermaid-width"; "mermaid-multiple-diagrams"; "mermaid-strict-label-length" ]
      "Md.fs validateMermaidDocs", [ "mermaid-width"; "mermaid-multiple-diagrams"; "mermaid-strict-label-length" ]
      "Md.fs validateMermaidDocuments", [ "mermaid-width"; "mermaid-multiple-diagrams"; "mermaid-strict-label-length" ]
      "Md.fs validateFrontmatterDates", [ "md-frontmatter-dates-body" ]
      "Md.fs validateFrontmatterDatesDetailed", [ "md-frontmatter-dates-body" ]
      "Md.fs validateFrontmatterDatesDocuments", [ "md-frontmatter-dates-body" ]
      "Governance.fs auditReadmeIndex", [ "readme-index-links" ]
      "Governance.fs auditReadmeIndexTexts", [ "readme-index-links" ]
      "Governance.fs ReadmeIndexFindingKind.Orphan", [ "readme-index-orphan" ]
      "Governance.fs ReadmeIndexFindingKind.Ghost", [ "readme-index-ghost" ]
      "Governance.fs ReadmeIndexFindingKind.Unannotated", [ "readme-index-unannotated" ]
      "Governance.fs checkResolvedTree", [ "word-budget-resolved-tree" ]
      "Governance.fs checkResolvedTextTree", [ "word-budget-resolved-tree" ]
      "Governance.fs checkNoUnknownWordBudgetKeys", [ "repo-config-extension-schema" ]
      "Convention.fs runLicenseValidate", [ "convention-license" ]
      "Convention.fs validateLicenseSnapshot", [ "convention-license" ]
      "RepoConfig.fs validateRepoRelativePath", [ "repo-config-extension-schema" ]
      "RepoConfig.fs validateText", [ "repo-config-extension-schema" ]
      "RepoConfig.fs validateAtRoot", [ "repo-config-extension-schema" ]
      "RepoGovernance.fs auditLayerCoherence", [ "repo-governance-layer-coherence" ]
      "RepoGovernance.fs auditLayerCoherenceDocuments", [ "repo-governance-layer-coherence" ]
      "RepoGovernance.fs auditTraceability", [ "repo-governance-traceability" ]
      "RepoGovernance.fs auditTraceabilityDocuments", [ "repo-governance-traceability" ]
      "HarnessPolicy.fs validateRequestedHarness", [ "harness-name" ]
      "HarnessRuntime.fs validateHarnessName", [ "harness-name" ]
      "HarnessRuntime.fs validateCatalogCoverageState", [ "harness-catalog" ]
      "HarnessRuntime.fs validateCatalogCoverage", [ "harness-catalog" ]
      "HarnessRuntime.fs runHarnessCatalogValidate", [ "harness-catalog" ]
      "HarnessRuntime.fs validateCodexAgentFilenames", [ "harness-codex-agents" ]
      "HarnessRuntime.fs validateCodexAgentsDir", [ "harness-codex-agents" ]
      "HarnessRuntime.fs validateVendoredDeclarations", [ "harness-vendored-declarations" ]
      "HarnessRuntime.fs validateRegistryDrivenScripts", [ "harness-registry-scripts" ]
      "HarnessRuntime.fs auditSkillsMirrors", [ "harness-skills-mirror" ]
      "HarnessRuntime.fs validateMirrorOrphanState", [ "harness-skills-mirror" ]
      "HarnessRuntime.fs validateMirrorOrphans", [ "harness-skills-mirror" ]
      "HarnessRuntime.fs validateAgentCountValues", [ "harness-agent-count" ]
      "HarnessRuntime.fs validateAgentYaml", [ "harness-claude-frontmatter" ]
      "HarnessRuntime.fs validateAgentDocument", [ "harness-claude-frontmatter" ]
      "HarnessRuntime.fs validateYamlFormattingRaw", [ "harness-claude-frontmatter" ]
      "HarnessRuntime.fs validateSync", [ "harness-sync" ]
      "HarnessRuntime.fs validateBindingContent", [ "harness-bindings" ]
      "HarnessRuntime.fs validateBindings", [ "harness-bindings" ]
      "HarnessRuntime.fs validateClaude", [ "harness-claude" ]
      "HarnessRuntime.fs validateOwnership", [ "harness-ownership" ] ]
    |> Map.ofList

/// Sites that match the scan's shape but implement no rule, each with the reason.
let private notRules: Map<string, string> =
    [ "RepoGovernance.fs auditCategoryCommand",
      "names the command behind one repo-governance audit category; the aggregate reuses member leaves" ]
    |> Map.ofList

/// Rules the pinned RHINO v0.3.0 provides, each with the finding kind that proves it.
let private rhinoProvided: Map<string, string> =
    [ "md-naming", "md naming validate: invalid-md-name, fragmented-md-name"
      "md-heading-hierarchy", "md heading-hierarchy validate: missing-h1, multiple-h1, heading-level-jump"
      "mermaid-label-length", "md mermaid validate: mermaid-legibility, a label longer than the declared limit"
      "convention-emoji", "convention emoji validate: emoji-in-prohibited-file"
      "readme-missing", "md readme-index validate: missing-readme-index"
      "md-links-missing-target", "md internal-link validate: internal-link-missing"
      "md-frontmatter-required-key", "md frontmatter validate: missing-frontmatter-key"
      "md-frontmatter-enum", "md frontmatter validate: invalid-frontmatter-value"
      "md-frontmatter-updated-key", "md frontmatter validate: forbidden-frontmatter-key"
      "word-budget-per-file", "governance word-budget validate: word-limit-exceeded"
      "plan-structure", "plan validate: the shared plan-structure rule set" ]
    |> Map.ofList

/// The one RHINO-provided rule F# keeps on purpose.
let private namedException = "plan-structure"

type private DelegationRow = { Command: string; Keeps: string list }

/// The `extensions.rhino-cli.delegation` rows of the embedded registry.
let private delegationRows () : DelegationRow list =
    let stream = YamlStream()
    use reader = new StringReader(Map.find "repo-config.yml" resources)
    stream.Load reader

    let child (key: string) (node: YamlNode) : YamlNode option =
        match node with
        | :? YamlMappingNode as mapping ->
            mapping.Children
            |> Seq.tryFind (fun pair ->
                match pair.Key with
                | :? YamlScalarNode as scalar -> scalar.Value = key
                | _ -> false)
            |> Option.map (fun pair -> pair.Value)
        | _ -> None

    let scalar (node: YamlNode option) : string =
        match node with
        | Some(:? YamlScalarNode as value) -> value.Value
        | _ -> ""

    let scalars (node: YamlNode option) : string list =
        match node with
        | Some(:? YamlSequenceNode as values) ->
            values.Children
            |> Seq.choose (fun value ->
                match value with
                | :? YamlScalarNode as item -> Some item.Value
                | _ -> None)
            |> List.ofSeq
        | _ -> []

    let rows =
        stream.Documents
        |> Seq.tryHead
        |> Option.bind (fun document -> child "extensions" document.RootNode)
        |> Option.bind (child "rhino-cli")
        |> Option.bind (child "delegation")

    match rows with
    | Some(:? YamlSequenceNode as sequence) ->
        sequence.Children
        |> Seq.map (fun row ->
            { Command = scalar (child "command" row)
              Keeps = scalars (child "keeps" row) })
        |> List.ofSeq
    | _ -> []

let private describe (items: string list) = String.Join("; ", items)

[<Fact>]
let ``The scan reads every Application source it names and the registry`` () =
    let expected =
        "repo-config.yml" :: (scannedSources |> List.map (fun file -> "src/" + file))
        |> List.sort

    Assert.Equal<string list>(expected, resources |> Map.toList |> List.map fst |> List.sort)

[<Fact>]
let ``Every rule site in the scanned sources maps to a named rule`` () =
    let found = sites ()

    let unmapped =
        found
        |> List.filter (fun site -> not (ruleOf.ContainsKey site || notRules.ContainsKey site))

    Assert.NotEmpty(found)
    Assert.True(List.isEmpty unmapped, sprintf "unmapped F# rule sites: %s" (describe unmapped))

[<Fact>]
let ``The registry declares the delegation rows that hold the keep list`` () =
    Assert.True(
        not (List.isEmpty (delegationRows ())),
        "repo-config.yml declares no extensions.rhino-cli.delegation rows"
    )

[<Fact>]
let ``Every rule F# still implements is on a delegation row's keep list`` () =
    let kept = delegationRows () |> List.collect (fun row -> row.Keeps) |> Set.ofList

    let unkept =
        sites ()
        |> List.collect (fun site ->
            Map.tryFind site ruleOf
            |> Option.defaultValue []
            |> List.map (fun rule -> rule, site))
        |> List.filter (fun (rule, _) -> not (kept.Contains rule))
        |> List.map (fun (rule, site) -> sprintf "%s (%s)" rule site)

    Assert.True(List.isEmpty unkept, sprintf "F# rules on no keep list: %s" (describe unkept))

[<Fact>]
let ``No F# rule site implements a rule RHINO provides`` () =
    let duplicated =
        sites ()
        |> List.collect (fun site ->
            Map.tryFind site ruleOf
            |> Option.defaultValue []
            |> List.filter (fun rule -> rule <> namedException && rhinoProvided.ContainsKey rule)
            |> List.map (fun rule ->
                sprintf "%s implements %s, which RHINO provides (%s)" site rule rhinoProvided.[rule]))

    Assert.True(List.isEmpty duplicated, sprintf "F# re-implements RHINO rules: %s" (describe duplicated))

[<Fact>]
let ``No keep list names a rule RHINO provides except plan-structure`` () =
    let rows = delegationRows ()

    let offending =
        rows
        |> List.collect (fun row ->
            row.Keeps
            |> List.filter (fun rule -> rule <> namedException && rhinoProvided.ContainsKey rule)
            |> List.map (fun rule -> sprintf "%s keeps %s" row.Command rule))

    Assert.True(not (List.isEmpty rows), "repo-config.yml declares no extensions.rhino-cli.delegation rows")
    Assert.True(List.isEmpty offending, sprintf "keep lists naming RHINO rules: %s" (describe offending))
