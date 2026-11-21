module CraneCli.Tests.Unit.Suite

open System
open System.IO
open System.Reflection
open TickSpec
open Xunit

let private assembly = Assembly.GetExecutingAssembly()

/// Every scenario in the owner corpus, one xUnit row each.
///
/// Feature text is embedded at build time so Unit setup remains in-process and
/// never discovers or reads the real filesystem at runtime.
let private buildScenarioData () : seq<obj[]> =
    let resources =
        assembly.GetManifestResourceNames()
        |> Array.filter (fun name -> name.EndsWith(".feature", StringComparison.Ordinal))

    if Array.isEmpty resources then
        failwith "no embedded .feature resource was found for the Crane Unit corpus"

    let defs = StepDefinitions(assembly)

    let loaded =
        resources
        |> Seq.collect (fun resourceName ->
            use stream = assembly.GetManifestResourceStream(resourceName)

            if isNull stream then
                failwithf "embedded Gherkin resource cannot be opened: %s" resourceName

            use reader = new StreamReader(stream)

            let lines =
                reader.ReadToEnd().Replace("\r\n", "\n", StringComparison.Ordinal).Split('\n')

            let feature = defs.GenerateFeature(resourceName, lines)
            feature.Scenarios |> Seq.map (fun scenario -> [| scenario :> obj |]))
        |> Seq.toList

    if List.isEmpty loaded then
        failwithf "the %d embedded feature resource(s) expanded to no scenarios" resources.Length

    loaded :> seq<_>

// @scenario specs/apps/crane/cli/behaviours/content/heading-check.feature: Section "2.3.1" expects H4 and MD has H3 — HIGH finding
// @scenario specs/apps/crane/cli/behaviours/content/heading-check.feature: Correct heading depth produces no finding
// @scenario specs/apps/crane/cli/behaviours/content/heading-check.feature: Heading depth inference from section number
// @scenario specs/apps/crane/cli/behaviours/content/nesting-check.feature: Correct single-level list produces no finding
// @scenario specs/apps/crane/cli/behaviours/content/nesting-check.feature: Inverted nesting detected as HIGH finding
// @scenario specs/apps/crane/cli/behaviours/content/nesting-check.feature: Off-by-one nesting detected as MEDIUM finding
// @scenario specs/apps/crane/cli/behaviours/content/text-check.feature: Complete conversion produces no findings
// @scenario specs/apps/crane/cli/behaviours/content/text-check.feature: Missing section produces a CRITICAL finding
// @scenario specs/apps/crane/cli/behaviours/content/text-check.feature: Whitespace normalization prevents false positives
// @scenario specs/apps/crane/cli/behaviours/content/text-check.feature: Fuzzy match accepts minor OCR spelling variation
// @scenario specs/apps/crane/cli/behaviours/media/figure-check.feature: Figure with Mermaid block produces no finding
// @scenario specs/apps/crane/cli/behaviours/media/figure-check.feature: Figure with placeholder produces no finding
// @scenario specs/apps/crane/cli/behaviours/media/figure-check.feature: Figure with no representation produces a HIGH finding
// @scenario specs/apps/crane/cli/behaviours/media/mermaid-validate.feature: valid Mermaid produces no finding
// @scenario specs/apps/crane/cli/behaviours/media/mermaid-validate.feature: Unknown diagram type produces a HIGH finding
// @scenario specs/apps/crane/cli/behaviours/media/mermaid-validate.feature: Unmatched bracket produces a HIGH finding
// @scenario specs/apps/crane/cli/behaviours/media/ocr-quality.feature: High error rate produces CRITICAL finding
// @scenario specs/apps/crane/cli/behaviours/media/ocr-quality.feature: Clean OCR section produces no finding
// @scenario specs/apps/crane/cli/behaviours/media/ocr-quality.feature: No OCR-tagged sections produces no finding
// @scenario specs/apps/crane/cli/behaviours/media/table-check.feature: Present table with matching structure produces no finding
// @scenario specs/apps/crane/cli/behaviours/media/table-check.feature: Missing table produces a CRITICAL finding
// @scenario specs/apps/crane/cli/behaviours/media/table-check.feature: Table with wrong row count produces a MEDIUM finding
// @scenario specs/apps/crane/cli/behaviours/media/table-check.feature: detect command identifies tables in layout text
// @scenario specs/apps/crane/cli/behaviours/pdf/pdf-commands.feature: Get page count from text PDF
// @scenario specs/apps/crane/cli/behaviours/pdf/pdf-commands.feature: Text-based PDF is detected
// @scenario specs/apps/crane/cli/behaviours/pdf/pdf-commands.feature: Image-only PDF is detected
// @scenario specs/apps/crane/cli/behaviours/reporting/report-management.feature: New chain creates a 6-character UUID report
// @scenario specs/apps/crane/cli/behaviours/reporting/report-management.feature: Chain extends when chain file is fresh (< 30s)
// @scenario specs/apps/crane/cli/behaviours/reporting/report-management.feature: Chain resets when chain file is stale (>= 30s)
// @scenario specs/apps/crane/cli/behaviours/reporting/skiplist-management.feature: New entry is written to the skip list file
// @scenario specs/apps/crane/cli/behaviours/reporting/skiplist-management.feature: Duplicate entry is not written twice
// @scenario specs/apps/crane/cli/behaviours/reporting/skiplist-management.feature: Known false positive returns match true
// @scenario specs/apps/crane/cli/behaviours/reporting/skiplist-management.feature: Unknown entry returns match false
// @scenario specs/apps/crane/cli/behaviours/system/check-all.feature: Aggregator with matching PDF and MD produces no findings
// @scenario specs/apps/crane/cli/behaviours/system/check-all.feature: Aggregator with mismatched Markdown exits 1 with findings that name their category
// @scenario specs/apps/crane/cli/behaviours/system/version.feature: crane --version prints a SemVer-shaped version and exits 0
// @scenario specs/apps/crane/cli/behaviours/content/text-check.feature: crane text search reports a present segment with its similarity and exits 0
// @scenario specs/apps/crane/cli/behaviours/content/text-check.feature: crane text search reports an absent segment as not found and exits 1
// @scenario specs/apps/crane/cli/behaviours/pdf/pdf-commands.feature: crane pdf extract writes the requested page range to standard output
// @scenario specs/apps/crane/cli/behaviours/pdf/pdf-commands.feature: A missing or unreadable PDF prints "Error:" on standard error and exits 1
// @scenario specs/apps/crane/cli/behaviours/system/check-all.feature: An unknown command prints usage and exits 1
type CraneCliUnitSuite() =
    static member Scenarios() : seq<obj[]> =
        buildScenarioData () |> Seq.toList :> seq<_>

    [<Theory>]
    [<MemberData("Scenarios")>]
    member _.``Crane unit scenarios``(item: obj) =
        match item with
        | :? Scenario as scenario -> scenario.Action.Invoke()
        | other -> failwithf "expected a TickSpec Scenario row, got %O" (other.GetType())
