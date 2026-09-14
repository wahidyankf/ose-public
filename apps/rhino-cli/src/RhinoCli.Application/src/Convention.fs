/// Port of the Rust `convention` namespace's license validator and the pure
/// aggregate behind `convention audit`
/// [Repo-grounded —
/// `apps/rhino-cli/src/application/repo_governance/license_audit.rs`,
/// `apps/rhino-cli/src/commands/convention_audit.rs`]. The emoji validator is
/// RHINO's `convention emoji validate`; the CLI hands that command to
/// `./rhino` whole. Findings use the shared `RhinoCli.Domain.Types.Finding`
/// record, since `Severity` / `Message` / `Path` cover everything the license
/// validator reports.
module RhinoCli.Application.Convention

open System
open System.Diagnostics.CodeAnalysis
open System.IO
open RhinoCli.Domain.Types

/// The outcome of running one convention validator: whether it passed, the
/// human-readable text a CLI invocation would print, and the structured
/// findings behind that text.
type ValidatorResult =
    { Success: bool
      Output: string
      Findings: Finding list }

/// Per-directory `LICENSE` presence and SPDX-consistency audit
/// [Repo-grounded — `license_audit.rs`].
module private License =

    /// App directories that are intentionally exempt from the LICENSE
    /// requirement.
    let exemptApps: Set<string> = set [ "rhino-cli" ]

    /// A single row parsed from the `LICENSING-NOTICE.md` table.
    type private Claim =
        { ClaimPath: string
          ClaimLicense: string }

    /// Returns the sorted names of non-hidden subdirectories inside `dir`.
    /// Returns an empty list when `dir` does not exist.
    [<ExcludeFromCodeCoverage>]
    let readNonHiddenDirs (dir: string) : string list =
        if not (Directory.Exists dir) then
            []
        else
            Directory.GetDirectories dir
            |> Array.map Path.GetFileName
            |> Array.filter (fun name -> not (name.StartsWith(".", StringComparison.Ordinal)))
            |> Array.sort
            |> Array.toList

    /// Returns a sorted list of relative directory paths that must contain a
    /// `LICENSE` file: non-exempt, non-`-e2e` subdirectories of `apps/`, all
    /// subdirectories of `libs/`, and `specs/` when it exists.
    [<ExcludeFromCodeCoverage>]
    let requiredDirs (repoRoot: string) : string list =
        let apps =
            readNonHiddenDirs (Path.Combine(repoRoot, "apps"))
            |> List.filter (fun name ->
                not (exemptApps.Contains name)
                && not (name.EndsWith("-e2e", StringComparison.Ordinal)))
            |> List.map (fun name -> sprintf "apps/%s" name)

        let libs =
            readNonHiddenDirs (Path.Combine(repoRoot, "libs"))
            |> List.map (fun name -> sprintf "libs/%s" name)

        let specs =
            if Directory.Exists(Path.Combine(repoRoot, "specs")) then
                [ "specs" ]
            else
                []

        apps @ libs @ specs |> List.sort

    /// The result of reading a directory's `LICENSE` file for its SPDX
    /// identifier.
    type private SpdxOutcome =
        | Found of string
        | Missing
        | Unreadable of string

    /// Maps the first line of a `LICENSE` file to a canonical SPDX
    /// identifier, recognising `SPDX-License-Identifier:` headers and common
    /// prose patterns. Returns `line` unchanged when no pattern matches.
    let classifyLine (line: string) : string =
        let spdxPrefix = "SPDX-License-Identifier:"

        if
            line.Length >= spdxPrefix.Length
            && line.Substring(0, spdxPrefix.Length).Equals(spdxPrefix, StringComparison.OrdinalIgnoreCase)
        then
            line.Substring(spdxPrefix.Length).Trim()
        else
            let lower = line.ToLowerInvariant()

            if lower.Contains("mit license") || lower = "mit" then
                "MIT"
            elif
                lower.Contains("apache license, version 2.0")
                || lower.Contains("apache license 2.0")
                || lower.Contains("apache-2.0")
            then
                "Apache-2.0"
            elif lower.Contains("bsd 3-clause") || lower.Contains("bsd-3-clause") then
                "BSD-3-Clause"
            elif lower.Contains("bsd 2-clause") || lower.Contains("bsd-2-clause") then
                "BSD-2-Clause"
            elif lower.Contains("mozilla public license") || lower.Contains("mpl-2.0") then
                "MPL-2.0"
            elif lower.Contains("gnu general public license") then
                "GPL"
            else
                line

    /// Reads the first non-blank line of the `LICENSE` file at `path` and
    /// classifies it as an SPDX identifier.
    [<ExcludeFromCodeCoverage>]
    let private extractSpdx (path: string) : SpdxOutcome =
        if not (File.Exists path) then
            Missing
        else
            let firstNonBlank =
                File.ReadAllLines(path) |> Array.tryFind (fun l -> l.Trim() <> "")

            match firstNonBlank with
            | Some line -> Found(classifyLine (line.Trim()))
            | None -> Unreadable(sprintf "LICENSE file \"%s\" is empty" path)

    /// Returns `true` when `identified` and `claim` refer to the same SPDX
    /// license, either by direct case-insensitive comparison or after
    /// normalising both through `classifyLine`.
    let licensesEqual (identified: string) (claim: string) : bool =
        String.Equals(identified, claim, StringComparison.OrdinalIgnoreCase)
        || String.Equals(classifyLine identified, classifyLine claim, StringComparison.OrdinalIgnoreCase)

    /// Normalises a raw path value from `LICENSING-NOTICE.md` by stripping
    /// surrounding whitespace, backticks, leading `./`, trailing `/`, and
    /// converting backslashes to forward slashes.
    let normaliseClaimPath (raw: string) : string =
        let trimmed = raw.Trim().Trim('`').Trim()

        let withoutPrefix =
            if trimmed.StartsWith("./", StringComparison.Ordinal) then
                trimmed.Substring(2)
            else
                trimmed

        let withoutSuffix =
            if withoutPrefix.EndsWith("/", StringComparison.Ordinal) then
                withoutPrefix.Substring(0, withoutPrefix.Length - 1)
            else
                withoutPrefix

        withoutSuffix.Replace('\\', '/')

    /// Returns `true` when `path` falls within the scope of this audit
    /// (immediate children of `apps/` or `libs/`, or the `specs` root).
    [<ExcludeFromCodeCoverage>]
    let ownedByLicenseAudit (path: string) : bool =
        if path = "specs" then
            true
        elif
            path.StartsWith("apps/", StringComparison.Ordinal)
            || path.StartsWith("libs/", StringComparison.Ordinal)
        then
            let rest = path.Substring(5)
            not (String.IsNullOrEmpty rest) && not (rest.Contains("/"))
        else
            false

    /// Splits a GFM table row `line` into individual cell strings,
    /// respecting backslash-escaped pipe characters.
    let splitMarkdownRow (line: string) : string list =
        let trimmed = line.Trim()

        // Coverage note: `splitMarkdownRow` lives in the `private License`
        // module, so both of its call sites are the only ways to reach it.
        // `isMarkdownTableSeparator` below only calls it after its own
        // `line.StartsWith("|", ...)` guard passed, and
        // `parseLicensingNotice`'s `loop` only calls it after the same
        // guard on an already-`Trim()`-ed `line`. Trimming a string whose
        // first character is already non-whitespace (`|`) is a no-op, so
        // `trimmed` always still starts with `|` here — the `else` arm is
        // unreachable via either public-facing entry point
        // (`License.audit`).
        let trimmed =
            if trimmed.StartsWith("|", StringComparison.Ordinal) then
                trimmed.Substring(1)
            else
                trimmed

        let trimmed =
            if trimmed.EndsWith("|", StringComparison.Ordinal) then
                trimmed.Substring(0, trimmed.Length - 1)
            else
                trimmed

        let rec loop (chars: char list) (current: char list) (escaped: bool) (cells: string list) : string list =
            match chars with
            | [] -> List.rev (String(current |> List.rev |> Array.ofList) :: cells)
            | c :: rest when escaped -> loop rest (c :: current) false cells
            | '\\' :: rest -> loop rest current true cells
            | '|' :: rest -> loop rest [] false (String(current |> List.rev |> Array.ofList) :: cells)
            | c :: rest -> loop rest (c :: current) false cells

        loop (trimmed |> List.ofSeq) [] false []

    /// Returns `true` when `line` is a GFM table separator row (e.g.
    /// `| --- | :---: |`).
    [<ExcludeFromCodeCoverage>]
    let isMarkdownTableSeparator (line: string) : bool =
        if not (line.StartsWith("|", StringComparison.Ordinal)) then
            false
        else
            let cells = splitMarkdownRow line

            not (List.isEmpty cells)
            && cells
               |> List.forall (fun cell ->
                   let core = cell.Trim().Trim(':')
                   core.Length > 0 && core |> Seq.forall (fun ch -> ch = '-'))

    /// Finds the column indices for the `path`/`directory` and `license`
    /// headers in a GFM table header row.
    [<ExcludeFromCodeCoverage>]
    let findColumns (cells: string list) : int option * int option =
        cells
        |> List.indexed
        |> List.fold
            (fun (pathCol, licenseCol) (i, cell) ->
                match cell.Trim().ToLowerInvariant() with
                | "path"
                | "directory" when pathCol = None -> (Some i, licenseCol)
                | "license" when licenseCol = None -> (pathCol, Some i)
                | _ -> (pathCol, licenseCol))
            (None, None)

    /// Parses `LICENSING-NOTICE.md` at `path` and extracts every claim row
    /// from GFM tables that have both a `Path`/`Directory` column and a
    /// `License` column. Returns an empty list when the file does not
    /// exist.
    [<ExcludeFromCodeCoverage>]
    let private parseLicensingNotice (path: string) : Claim list =
        if not (File.Exists path) then
            []
        else
            let lines = File.ReadAllLines path

            let rec loop
                (i: int)
                (pathCol: int option)
                (licenseCol: int option)
                (inTable: bool)
                (acc: Claim list)
                : Claim list =
                if i >= lines.Length then
                    List.rev acc
                else
                    let line = lines.[i].Trim()

                    if not (line.StartsWith("|", StringComparison.Ordinal)) then
                        loop (i + 1) None None false acc
                    else
                        let cells = splitMarkdownRow line

                        if not inTable then
                            if i + 1 >= lines.Length then
                                loop (i + 1) pathCol licenseCol inTable acc
                            else
                                let separator = lines.[i + 1].Trim()

                                if not (isMarkdownTableSeparator separator) then
                                    loop (i + 1) pathCol licenseCol inTable acc
                                else
                                    let pc, lc = findColumns cells
                                    loop (i + 2) pc lc (pc.IsSome && lc.IsSome) acc
                        else
                            match pathCol, licenseCol with
                            | Some pc, Some lc when pc < List.length cells && lc < List.length cells ->
                                let rawPath = cells.[pc].Trim()
                                let rawLicense = cells.[lc].Trim()

                                if rawPath <> "" && rawLicense <> "" then
                                    loop
                                        (i + 1)
                                        pathCol
                                        licenseCol
                                        inTable
                                        ({ ClaimPath = rawPath
                                           ClaimLicense = rawLicense }
                                         :: acc)
                                else
                                    loop (i + 1) pathCol licenseCol inTable acc
                            | _ -> loop (i + 1) pathCol licenseCol inTable acc

            loop 0 None None false []

    /// Audits every required `apps/` and `libs/` subdirectory (plus
    /// `specs/`) for a `LICENSE` file and cross-checks identified SPDX
    /// identifiers against `LICENSING-NOTICE.md`. Findings are sorted by
    /// path.
    [<ExcludeFromCodeCoverage>]
    let audit (repoRoot: string) : Finding list =
        let dirs = requiredDirs repoRoot

        let outcomes =
            dirs
            |> List.map (fun rel -> rel, extractSpdx (Path.Combine(repoRoot, rel, "LICENSE")))

        let licenseByDir =
            outcomes
            |> List.choose (fun (rel, outcome) ->
                match outcome with
                | Found spdx -> Some(rel, spdx)
                | Missing
                | Unreadable _ -> None)
            |> Map.ofList

        let missingOrUnreadable =
            outcomes
            |> List.choose (fun (rel, outcome) ->
                match outcome with
                | Found _ -> None
                | Missing ->
                    Some
                        { Severity = Severity.Blocking
                          Message =
                            sprintf "[missing-license] %s — required directory \"%s\" has no LICENSE file" rel rel
                          Path = Some rel }
                | Unreadable message ->
                    Some
                        { Severity = Severity.Blocking
                          Message = sprintf "[unreadable-license] %s — read LICENSE in \"%s\": %s" rel rel message
                          Path = Some rel })

        let claims = parseLicensingNotice (Path.Combine(repoRoot, "LICENSING-NOTICE.md"))

        let mismatches =
            claims
            |> List.choose (fun claim ->
                let normalised = normaliseClaimPath claim.ClaimPath

                if not (ownedByLicenseAudit normalised) then
                    None
                else
                    match Map.tryFind normalised licenseByDir with
                    | None -> None
                    | Some identified ->
                        if licensesEqual identified claim.ClaimLicense then
                            None
                        else
                            Some
                                { Severity = Severity.Blocking
                                  Message =
                                    sprintf
                                        "[spdx-mismatch] %s — LICENSING-NOTICE.md claims \"%s\" for \"%s\" but LICENSE identifies \"%s\""
                                        normalised
                                        claim.ClaimLicense
                                        normalised
                                        identified
                                  Path = Some normalised })

        missingOrUnreadable @ mismatches |> List.sortBy (fun f -> f.Path)

    /// Renders license findings as human-readable text.
    let formatText (findings: Finding list) : string =
        if List.isEmpty findings then
            "LICENSE AUDIT PASSED: no findings\n"
        else
            let header = sprintf "LICENSE AUDIT FAILED: %d finding(s)\n" (List.length findings)

            let body =
                findings |> List.map (fun f -> sprintf "  %s\n" f.Message) |> String.concat ""

            header + body

/// Runs the per-directory LICENSE validator over `repoRoot`
/// [Repo-grounded — `convention_validate_license.rs::run`].
[<ExcludeFromCodeCoverage>]
let runLicenseValidate (repoRoot: string) : ValidatorResult =
    let findings = License.audit repoRoot

    { Success = List.isEmpty findings
      Output = License.formatText findings
      Findings = findings }

/// In-memory view of the paths and text owned by the license audit.
type LicenseAuditSnapshot =
    { RequiredDirectories: string list
      LicenseTexts: Map<string, string>
      LicensingNotice: string option }

let private noticeClaims (text: string) : (string * string) list =
    text.Replace("\r\n", "\n").Split('\n')
    |> Array.choose (fun line ->
        let cells = License.splitMarkdownRow line |> List.map (fun cell -> cell.Trim())

        match cells with
        | path :: license :: _ when
            path <> ""
            && license <> ""
            && not (path.Equals("Path", StringComparison.OrdinalIgnoreCase))
            && not (path |> Seq.forall (fun character -> character = '-' || character = ':'))
            ->
            Some(License.normaliseClaimPath path, license)
        | _ -> None)
    |> Array.toList

/// Pure license validation over a snapshot supplied by a resource adapter.
let validateLicenseSnapshot (snapshot: LicenseAuditSnapshot) : ValidatorResult =
    let identified =
        snapshot.LicenseTexts
        |> Map.map (fun _ contents ->
            contents.Replace("\r\n", "\n").Split('\n')
            |> Array.tryFind (String.IsNullOrWhiteSpace >> not)
            |> Option.map (fun line -> License.classifyLine (line.Trim())))

    let missing =
        snapshot.RequiredDirectories
        |> List.choose (fun directory ->
            match Map.tryFind directory identified |> Option.flatten with
            | Some _ -> None
            | None ->
                Some
                    { Severity = Severity.Blocking
                      Message =
                        sprintf
                            "[missing-license] %s — required directory \"%s\" has no LICENSE file"
                            directory
                            directory
                      Path = Some directory })

    let mismatches =
        snapshot.LicensingNotice
        |> Option.map noticeClaims
        |> Option.defaultValue []
        |> List.choose (fun (directory, claim) ->
            match Map.tryFind directory identified |> Option.flatten with
            | Some actual when not (License.licensesEqual actual claim) ->
                Some
                    { Severity = Severity.Blocking
                      Message =
                        sprintf
                            "[spdx-mismatch] %s — LICENSING-NOTICE.md claims \"%s\" for \"%s\" but LICENSE identifies \"%s\""
                            directory
                            claim
                            directory
                            actual
                      Path = Some directory }
            | _ -> None)

    let findings = missing @ mismatches |> List.sortBy (fun finding -> finding.Path)

    { Success = List.isEmpty findings
      Output = License.formatText findings
      Findings = findings }

/// Pure aggregation for the public `convention audit` result.
let aggregateConventionResults (results: (string * ValidatorResult) list) (skip: string list) : ValidatorResult =
    let selected =
        results |> List.filter (fun (name, _) -> not (List.contains name skip))

    let failures =
        selected
        |> List.choose (fun (name, result) ->
            if result.Success then
                None
            else
                Some(sprintf "%s: %d finding(s) found" name result.Findings.Length))

    if List.isEmpty failures then
        { Success = true
          Output = sprintf "CONVENTION AUDIT PASSED: all %d validators passed\n" selected.Length
          Findings = [] }
    else
        { Success = false
          Output =
            sprintf "CONVENTION AUDIT FAILED: %d validator(s) reported failures\n" failures.Length
            + (failures |> List.map (sprintf "  %s\n") |> String.concat "")
          Findings = [] }
