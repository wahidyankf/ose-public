/// Plan structure: lifecycle roots, the six documents, technical companions,
/// acceptance identifiers, and the delivery checklist [Repo-grounded — RHINO
/// `v0.3.0` `src/plan.rs`, `src/plan/{lifecycle,documents,companions,criteria,delivery}.rs`,
/// `src/markdown.rs::{prose_lines, sibling_links}` and `src/report.rs`]. The
/// shared plan-validator contract freezes the rule identifiers, messages,
/// diagnostics, and exit classes, so every rule here mirrors RHINO's and the
/// shared corpus under `specs/fixtures/plan-structure/` proves both agree.
module RhinoCli.Application.Plan

open System
open System.Diagnostics.CodeAnalysis
open System.IO
open System.Text

/// One structural finding. Every plan rule places its finding at a line,
/// column `1`, and names the field it is about.
type PlanFinding =
    { Rule: string
      Path: string
      Line: int
      Column: int
      Field: string
      Message: string }

/// How reading one plan document ended [Repo-grounded — `runtime.rs::TreeError`].
type PlanRead =
    | Found of string
    | Missing
    /// The file opened and its bytes are not UTF-8.
    | NotText
    | Unreadable of string

/// The result of one run: the plans inspected and what they break, or the
/// reason the run could not happen.
type PlanReport =
    { Inspected: int
      Findings: PlanFinding list
      Refusal: string option }

/// What a renderer hands the CLI leaf.
type PlanOutcome =
    { ExitCode: int
      Stdout: string
      Stderr: string }

let private prefix = "plans/"
let private roots = [ "ideas"; "backlog"; "in-progress"; "done" ]

let private required =
    [ "README.md"; "brd.md"; "delivery.md"; "learnings.md"; "prd.md" ]

let private technical = "tech-docs"
let private executors = [ "AI"; "HUMAN" ]

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

/// Ordinal comparison in code-point order, which is the byte order RHINO sorts
/// its UTF-8 strings by: surrogates rank above the rest of the BMP.
let private codePointOrder (left: string) (right: string) : int =
    let rank (c: char) =
        if Char.IsSurrogate c then int c + 0x2000
        elif int c >= 0xE000 then int c - 0x800
        else int c

    let rec loop index =
        if index = min left.Length right.Length then
            compare left.Length right.Length
        else
            match compare (rank left.[index]) (rank right.[index]) with
            | 0 -> loop (index + 1)
            | order -> order

    loop 0

/// Rust's `str::lines`: split on `\n`, drop a `\r` only where it precedes that
/// `\n`, and yield no trailing empty line after a final newline.
let private lines (text: string) : string list =
    let parts = text.Split('\n')

    let count =
        if text.EndsWith("\n", StringComparison.Ordinal) then
            parts.Length - 1
        else
            parts.Length

    [ for index in 0 .. count - 1 ->
          let part = parts.[index]

          if index < parts.Length - 1 && part.EndsWith("\r", StringComparison.Ordinal) then
              part.Substring(0, part.Length - 1)
          else
              part ]
    |> fun found -> if text.Length = 0 then [] else found

/// The fence character and run length a line opens or closes with.
let private fence (line: string) : (char * int) option =
    let trimmed = line.TrimStart()

    if
        trimmed.StartsWith("```", StringComparison.Ordinal)
        || trimmed.StartsWith("~~~", StringComparison.Ordinal)
    then
        Some(trimmed.[0], trimmed |> Seq.takeWhile (fun c -> c = trimmed.[0]) |> Seq.length)
    else
        None

/// The lines of a document outside fenced blocks, one-based; a fence closes
/// only on the same character at the same length or longer
/// [Repo-grounded — `markdown.rs::prose_lines`].
let proseLines (text: string) : (int * string) list =
    let folder (openFence: (char * int) option, acc: (int * string) list) (index: int, line: string) =
        match openFence, fence line with
        | None, Some opening -> Some opening, acc
        | Some(character, length), Some(closing, closingLength) when closing = character && closingLength >= length ->
            None, acc
        | None, None -> None, (index + 1, line) :: acc
        | _ -> openFence, acc

    lines text |> List.indexed |> List.fold folder (None, []) |> snd |> List.rev

/// Sibling targets a document links to, each with the first line it appears
/// on: the part before `#`/`?`, and only targets naming neither a directory
/// nor a scheme [Repo-grounded — `markdown.rs::sibling_links`].
let siblingLinks (text: string) : (string * int) list =
    let rec targets (rest: string) (found: string list) =
        match rest.IndexOf("](", StringComparison.Ordinal) with
        | -1 -> List.rev found
        | start ->
            let after = rest.Substring(start + 2)

            match after.IndexOf(')') with
            | -1 -> List.rev ("" :: found)
            | close ->
                let target = after.Substring(0, close)

                let target =
                    match target.IndexOfAny([| '#'; '?' |]) with
                    | -1 -> target
                    | cut -> target.Substring(0, cut)

                targets (after.Substring(close + 1)) (target :: found)

    proseLines text
    |> List.collect (fun (number, line) -> targets line [] |> List.map (fun target -> target, number))
    |> List.filter (fun (target, _) -> target <> "" && not (target.Contains '/') && not (target.Contains ':'))
    |> List.distinctBy fst

/// Lowercase ASCII letters and digits, separated by single hyphens.
let isKebabCase (name: string) : bool =
    name <> ""
    && not (name.StartsWith("-", StringComparison.Ordinal))
    && not (name.EndsWith("-", StringComparison.Ordinal))
    && not (name.Contains("--", StringComparison.Ordinal))
    && name
       |> Seq.forall (fun c -> (c >= 'a' && c <= 'z') || Char.IsAsciiDigit c || c = '-')

let private finding (rule: string) (path: string) (line: int) (field: string) (message: string) : PlanFinding =
    { Rule = rule
      Path = path
      Line = line
      Column = 1
      Field = field
      Message = message }

// ---------------------------------------------------------------------------
// Discovery [Repo-grounded — `plan.rs::{discover, entries}`]
// ---------------------------------------------------------------------------

type private PlanDirectory =
    { Path: string
      Root: string
      Slug: string
      Held: string list }

/// Every file under `plans/` as (root, slug, path within the plan). A file
/// directly under a root is a brief rather than part of a plan.
let private entries (files: string list) : (string * string * string) list =
    files
    |> List.choose (fun path ->
        if path.StartsWith(prefix, StringComparison.Ordinal) then
            match path.Substring(prefix.Length).Split('/', 3) with
            | [| root; slug; relative |] -> Some(root, slug, relative)
            | _ -> None
        else
            None)

/// Every plan directory, in path order of its first file.
let private discover (files: string list) : PlanDirectory list =
    entries files
    |> List.groupBy (fun (root, slug, _) -> root, slug)
    |> List.map (fun ((root, slug), held) ->
        { Path = prefix + root + "/" + slug
          Root = root
          Slug = slug
          Held =
            held
            |> List.map (fun (_, _, relative) -> relative)
            |> List.sortWith codePointOrder })

// ---------------------------------------------------------------------------
// Lifecycle [Repo-grounded — `plan/lifecycle.rs`]
// ---------------------------------------------------------------------------

/// Every root outside the four canonical names, reported once each.
let private unknownRoots (files: string list) : PlanFinding list =
    files
    |> List.choose (fun path ->
        if path.StartsWith(prefix, StringComparison.Ordinal) then
            match path.Substring(prefix.Length).Split('/', 2) with
            | [| root; _ |] when not (List.contains root roots) -> Some root
            | _ -> None
        else
            None)
    |> List.distinct
    |> List.map (fun root ->
        finding "PLAN-LIFECYCLE-001" (prefix + root) 1 root "plan root is not one of ideas, backlog, in-progress, done")

let private isADate (text: string) : bool =
    text.Length = 10
    && text
       |> Seq.indexed
       |> Seq.forall (fun (index, c) ->
           if index = 4 || index = 7 then
               c = '-'
           else
               Char.IsAsciiDigit c)

/// The name half of a completed slug: a date, then two underscores.
let private completedName (slug: string) : string option =
    match slug.IndexOf("__", StringComparison.Ordinal) with
    | separator when separator >= 0 && isADate (slug.Substring(0, separator)) -> Some(slug.Substring(separator + 2))
    | _ -> None

/// Slugs held under more than one root, each with the first root holding it.
let private sharedSlugs (files: string list) : Map<string, string> =
    entries files
    |> List.map (fun (root, slug, _) -> slug, root)
    |> List.distinct
    |> List.groupBy fst
    |> List.filter (fun (_, pairs) -> List.length pairs > 1)
    |> List.map (fun (slug, pairs) -> slug, snd (List.head pairs))
    |> Map.ofList

let private lifecycle (shared: Map<string, string>) (plan: PlanDirectory) : PlanFinding list =
    let completed = completedName plan.Slug
    let live = plan.Root <> "done"

    let at rule message =
        [ finding rule plan.Path 1 plan.Slug message ]

    if live && plan.Slug.Length >= 10 && isADate (plan.Slug.Substring(0, 10)) then
        at "PLAN-LIFECYCLE-002" "live plan slug carries a date"
    elif not live && completed.IsNone then
        at "PLAN-LIFECYCLE-003" "done plan slug has no YYYY-MM-DD__ prefix"
    elif not (isKebabCase (defaultArg completed plan.Slug)) then
        at "PLAN-LIFECYCLE-004" "plan slug is not lowercase hyphen-separated"
    else
        match Map.tryFind plan.Slug shared with
        | Some first when first <> plan.Root ->
            at "PLAN-LIFECYCLE-005" "plan slug occupies more than one lifecycle root"
        | _ -> []

// ---------------------------------------------------------------------------
// Documents [Repo-grounded — `plan/documents.rs`]
// ---------------------------------------------------------------------------

let private documents (plan: PlanDirectory) : PlanFinding list =
    let holds name = List.contains name plan.Held

    let missing =
        required
        |> List.filter (holds >> not)
        |> List.map (fun name -> finding "PLAN-DOCUMENT-001" plan.Path 1 name "required plan document is missing")

    let single = holds (technical + ".md")

    let directory =
        plan.Held
        |> List.exists (fun held -> held.StartsWith(technical + "/", StringComparison.Ordinal))

    match single, directory with
    | true, true ->
        missing
        @ [ finding "PLAN-DOCUMENT-002" plan.Path 1 technical "plan carries both technical shapes" ]
    | false, false ->
        missing
        @ [ finding "PLAN-DOCUMENT-003" plan.Path 1 technical "plan carries no technical shape" ]
    | _ -> missing

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/// One document's text, `None` when absent, or the refusal a failed read
/// obliges [Repo-grounded — `plan.rs::{read, refuse}`].
let private readDocument (read: string -> PlanRead) (path: string) : Result<string option, string> =
    match read path with
    | Found text -> Ok(Some text)
    | Missing -> Ok None
    | Unreadable reason -> Error(sprintf "%s: %s" path reason)
    | NotText -> Error(sprintf "%s: holds no text" path)

// ---------------------------------------------------------------------------
// Companions [Repo-grounded — `plan/companions.rs`]
// ---------------------------------------------------------------------------

/// A three-digit ordinal: its value and the digits as written, plus what
/// follows the hyphen.
let private ordinal (name: string) : (int * string * string) option =
    if
        name.Length >= 4
        && name.[3] = '-'
        && name.Substring(0, 3) |> Seq.forall Char.IsAsciiDigit
    then
        Some(int (name.Substring(0, 3)), name.Substring(0, 3), name.Substring(4))
    else
        None

/// Duplicates first, then contiguity from 001.
let private sequence (ordinals: (int * string) list) (directory: string) : PlanFinding list =
    let duplicated =
        ordinals
        |> List.countBy fst
        |> List.filter (fun (_, count) -> count > 1)
        |> List.map (fun (value, _) -> ordinals |> List.find (fun (held, _) -> held = value) |> snd)
        |> List.sortWith codePointOrder

    if not (List.isEmpty duplicated) then
        duplicated
        |> List.map (fun digits ->
            finding "PLAN-COMPANION-003" directory 1 digits "companion ordinal is used more than once")
    elif ordinals |> List.map fst |> List.sort <> [ 1 .. List.length ordinals ] then
        [ finding "PLAN-COMPANION-002" directory 1 "-" "companion ordinals are not contiguous from 001" ]
    else
        []

let private moduleFindings (plan: PlanDirectory) (listed: (string * int) list) (name: string) =
    let path = plan.Path + "/" + technical + "/" + name

    let unlisted =
        if listed |> List.exists (fun (target, _) -> target = name) then
            []
        else
            [ finding "PLAN-COMPANION-005" path 1 "-" "companion exists but the entrypoint does not list it" ]

    match ordinal name with
    | Some(value, digits, rest) ->
        let stem =
            match rest.LastIndexOf('.') with
            | -1 -> rest
            | dot -> rest.Substring(0, dot)

        let named =
            if isKebabCase stem then
                []
            else
                [ finding
                      "PLAN-COMPANION-004"
                      path
                      1
                      stem
                      "companion name after its ordinal is not lowercase hyphen-separated" ]

        named @ unlisted, Some(value, digits)
    | None ->
        let digits = name |> Seq.takeWhile Char.IsAsciiDigit |> Seq.length
        let field = if digits > 0 then name.Substring(0, digits) else name

        finding "PLAN-COMPANION-001" path 1 field "companion ordinal is not exactly three digits"
        :: unlisted,
        None

let private companions (read: string -> PlanRead) (plan: PlanDirectory) : Result<PlanFinding list, string> =
    let modulePrefix = technical + "/"

    let modules =
        plan.Held
        |> List.filter (fun held ->
            held.StartsWith(modulePrefix, StringComparison.Ordinal)
            && not (held.EndsWith("/README.md", StringComparison.Ordinal)))
        |> List.map (fun held -> held.Substring(modulePrefix.Length))

    let indexPath = plan.Path + "/" + technical + "/README.md"

    if List.isEmpty modules then
        Ok []
    else
        readDocument read indexPath
        |> Result.map (fun index ->
            let listed = index |> Option.map siblingLinks |> Option.defaultValue []
            let perModule = modules |> List.map (moduleFindings plan listed)

            let ordered =
                if perModule |> List.forall (snd >> Option.isSome) then
                    sequence (perModule |> List.choose snd) (plan.Path + "/" + technical)
                else
                    []

            let absent =
                listed
                |> List.filter (fun (target, _) -> not (List.contains target modules))
                |> List.map (fun (target, line) ->
                    finding
                        "PLAN-COMPANION-006"
                        indexPath
                        line
                        target
                        "entrypoint lists a companion that does not exist")

            (perModule |> List.collect fst) @ ordered @ absent)

// ---------------------------------------------------------------------------
// Criteria [Repo-grounded — `plan/criteria.rs`]
// ---------------------------------------------------------------------------

/// Every bracketed `LETTERS-DIGITS` identifier on one line; a `[` nothing
/// closes ends the line.
let private identifiers (line: string) : string list =
    let valid (candidate: string) =
        match candidate.Split('-', 2) with
        | [| letters; digits |] ->
            letters <> ""
            && letters |> Seq.forall (fun c -> c >= 'A' && c <= 'Z')
            && digits <> ""
            && digits |> Seq.forall Char.IsAsciiDigit
        | _ -> false

    let rec loop (rest: string) (found: string list) =
        match rest.IndexOf('[') with
        | -1 -> List.rev found
        | start ->
            let after = rest.Substring(start + 1)

            match after.IndexOf(']') with
            | -1 -> List.rev found
            | close ->
                let candidate = after.Substring(0, close)
                loop (after.Substring(close + 1)) (if valid candidate then candidate :: found else found)

    loop line []

let private criteria
    (read: string -> PlanRead)
    (plan: PlanDirectory)
    (checklist: string option)
    : Result<PlanFinding list, string> =
    let requirements = plan.Path + "/prd.md"

    readDocument read requirements
    |> Result.map (fun definitions ->
        match definitions with
        | None -> []
        | Some text ->
            // Read line by line, fences included: the scenarios live inside a
            // fenced Gherkin block.
            let definedAt =
                lines text
                |> List.indexed
                |> List.filter (fun (_, line) -> line.TrimStart().StartsWith("Scenario:", StringComparison.Ordinal))
                |> List.collect (fun (index, line) ->
                    identifiers line |> List.map (fun identifier -> identifier, index + 1))

            let duplicates =
                definedAt
                |> List.indexed
                |> List.filter (fun (position, (identifier, _)) ->
                    definedAt
                    |> List.take position
                    |> List.exists (fun (held, _) -> held = identifier))
                |> List.map (fun (_, (identifier, line)) ->
                    finding
                        "PLAN-CRITERION-001"
                        requirements
                        line
                        identifier
                        "acceptance identifier is defined more than once")

            let defined = definedAt |> List.map fst |> Set.ofList

            let undefined =
                checklist
                |> Option.map proseLines
                |> Option.defaultValue []
                |> List.collect (fun (number, line) ->
                    identifiers line
                    |> List.filter (defined.Contains >> not)
                    |> List.map (fun identifier ->
                        finding
                            "PLAN-CRITERION-002"
                            (plan.Path + "/delivery.md")
                            number
                            identifier
                            "delivery item cites an undefined acceptance identifier"))

            duplicates @ undefined)

// ---------------------------------------------------------------------------
// Delivery [Repo-grounded — `plan/delivery.rs`]
// ---------------------------------------------------------------------------

type private Bullet =
    | Link
    | Bare
    | Unlabelled
    | Labelled of string

/// Strip an optional task marker, then read the executor label. A
/// code-formatted label without a checkbox is prose, not an item.
let private classify (item: string) : Bullet =
    let marked, rest =
        match
            [ "[ ] "; "[x] "; "[X] " ]
            |> List.tryFind (fun opening -> item.StartsWith(opening, StringComparison.Ordinal))
        with
        | Some opening -> true, item.Substring(opening.Length)
        | None -> false, item

    let quoted = rest.StartsWith("`", StringComparison.Ordinal)
    let rest = if quoted then rest.Substring(1) else rest
    let close = rest.IndexOf(']')

    if quoted && not marked then
        Bare
    elif rest.StartsWith("[", StringComparison.Ordinal) && close > 0 then
        if rest.Substring(close + 1).StartsWith("(", StringComparison.Ordinal) then
            Link
        else
            Labelled(rest.Substring(1, close - 1))
    elif marked then
        Unlabelled
    else
        Bare

type private Section =
    { Heading: (int * string) option
      Bullets: (int * Bullet) list }

/// The checklist's `## ` sections in order, each with its `- ` bullets.
let private sections (text: string) : Section list =
    let close (current: Section) =
        { current with
            Bullets = List.rev current.Bullets }

    let completed, current =
        proseLines text
        |> List.fold
            (fun (completed: Section list, current: Section) (number, line) ->
                if line.StartsWith("## ", StringComparison.Ordinal) then
                    close current :: completed,
                    { Heading = Some(number, line.Substring(3).Trim())
                      Bullets = [] }
                elif line.StartsWith("- ", StringComparison.Ordinal) then
                    completed,
                    { current with
                        Bullets = (number, classify (line.Substring 2)) :: current.Bullets }
                else
                    completed, current)
            ([], { Heading = None; Bullets = [] })

    List.rev (close current :: completed)

let private delivery (plan: PlanDirectory) (checklist: string option) : PlanFinding list =
    let path = plan.Path + "/delivery.md"

    let items (section: Section) =
        section.Bullets
        |> List.collect (fun (number, bullet) ->
            match bullet with
            | Bare
            | Unlabelled -> [ finding "PLAN-DELIVERY-001" path number "-" "checklist item carries no executor label" ]
            | Labelled label when not (List.contains label executors) ->
                [ finding "PLAN-DELIVERY-002" path number label "executor label is not AI or HUMAN" ]
            | _ -> [])

    let inspectSection (found: PlanFinding list, substantive: int) (section: Section) =
        let holdsItems =
            section.Bullets
            |> List.exists (fun (_, bullet) ->
                match bullet with
                | Unlabelled
                | Labelled _ -> true
                | _ -> false)

        match section.Heading with
        | None -> found, substantive
        | Some(number, "Plan Archival") ->
            let early =
                if substantive = 0 then
                    [ finding "PLAN-DELIVERY-004" path number "-" "archival items appear before a substantive phase" ]
                else
                    []

            found @ early @ items section, substantive
        | Some(_, heading) when not (heading.StartsWith("Phase ", StringComparison.Ordinal)) && not holdsItems ->
            found, substantive
        | Some(number, heading) ->
            let unnumbered =
                if
                    heading.Length > 6
                    && heading.StartsWith("Phase ", StringComparison.Ordinal)
                    && Char.IsAsciiDigit heading.[6]
                then
                    []
                else
                    [ finding "PLAN-DELIVERY-003" path number heading "delivery phase heading carries no phase number" ]

            found @ unnumbered @ items section, substantive + 1

    checklist
    |> Option.map (sections >> List.fold inspectSection ([], 0) >> fst)
    |> Option.defaultValue []

// ---------------------------------------------------------------------------
// Validation [Repo-grounded — `plan.rs::validate`]
// ---------------------------------------------------------------------------

/// The findings for one plan under a known or unknown root, or a refusal.
let private inspectPlan (read: string -> PlanRead) (shared: Map<string, string>) (unknown: bool) (plan: PlanDirectory) =
    let settled = if unknown then [] else lifecycle shared plan

    // An archived plan is held to its lifecycle form and nothing else, and a
    // brief under `ideas` is not a formal plan.
    if plan.Root = "done" || plan.Root = "ideas" then
        Ok settled
    else
        companions read plan
        |> Result.bind (fun companionFindings ->
            readDocument read (plan.Path + "/delivery.md")
            |> Result.bind (fun checklist ->
                criteria read plan checklist
                |> Result.map (fun criterionFindings ->
                    settled
                    @ documents plan
                    @ companionFindings
                    @ criterionFindings
                    @ delivery plan checklist)))

/// Validates every plan under `plans/` in `files` (repository-relative paths,
/// any order), reading documents through `read`. A refusal stops the run.
let validate (files: string list) (read: string -> PlanRead) : PlanReport =
    let files = files |> List.sortWith codePointOrder
    let rootFindings = unknownRoots files
    let unknown = rootFindings |> List.map (fun f -> f.Field) |> Set.ofList
    let shared = sharedSlugs files

    let rec run (plans: PlanDirectory list) (inspected: int) (found: PlanFinding list) : PlanReport =
        match plans with
        | [] ->
            { Inspected = inspected
              Findings = found
              Refusal = None }
        | plan :: remaining ->
            match inspectPlan read shared (unknown.Contains plan.Root) plan with
            | Ok planFindings -> run remaining (inspected + 1) (found @ planFindings)
            | Error reason ->
                { Inspected = inspected + 1
                  Findings = []
                  Refusal = Some reason }

    run (discover files) 0 rootFindings

// ---------------------------------------------------------------------------
// Rendering [Repo-grounded — `report.rs::{finish, as_json, quote}`]
// ---------------------------------------------------------------------------

/// Sorted by path, line, column, rule, then field.
let private ordered (findings: PlanFinding list) : PlanFinding list =
    findings
    |> List.sortWith (fun left right ->
        [ codePointOrder left.Path right.Path
          compare left.Line right.Line
          compare left.Column right.Column
          codePointOrder left.Rule right.Rule
          codePointOrder left.Field right.Field ]
        |> List.tryFind ((<>) 0)
        |> Option.defaultValue 0)

/// A JSON string literal, escaped as RHINO's hand-written `quote` escapes it.
let private quote (value: string) : string =
    let escape (c: char) =
        match c with
        | '"' -> "\\\""
        | '\\' -> "\\\\"
        | '\n' -> "\\n"
        | '\r' -> "\\r"
        | '\t' -> "\\t"
        | control when control < ' ' -> sprintf "\\u%04x" (int control)
        | other -> other.ToString()

    "\"" + (value |> Seq.map escape |> String.concat "") + "\""

let private render (report: PlanReport) (success: PlanFinding list -> int -> PlanOutcome) : PlanOutcome =
    match report.Refusal with
    | Some reason ->
        { ExitCode = 2
          Stdout = ""
          Stderr = sprintf "[plan] %s\n" reason }
    | None -> success (ordered report.Findings) (if List.isEmpty report.Findings then 0 else 1)

/// `[plan] checked N plans, …` on stdout and one sorted diagnostic per finding on stderr.
let renderText (report: PlanReport) : PlanOutcome =
    render report (fun findings exitCode ->
        let summary =
            match List.length findings with
            | 0 -> "no findings"
            | 1 -> "1 finding"
            | count -> sprintf "%d findings" count

        { ExitCode = exitCode
          Stdout =
            sprintf
                "[plan] checked %d %s, %s\n"
                report.Inspected
                (if report.Inspected = 1 then "plan" else "plans")
                summary
          Stderr =
            findings
            |> List.map (fun f -> sprintf "[plan] %s:%d:%d %s %s %s\n" f.Path f.Line f.Column f.Rule f.Field f.Message)
            |> String.concat "" })

/// One JSON object on one line, with the same sorted violations.
let renderJson (report: PlanReport) : PlanOutcome =
    render report (fun findings exitCode ->
        let violations =
            findings
            |> List.map (fun f ->
                sprintf
                    "{\"kind\":%s,\"path\":%s,\"message\":%s,\"line\":%d,\"column\":%d,\"field\":%s}"
                    (quote f.Rule)
                    (quote f.Path)
                    (quote f.Message)
                    f.Line
                    f.Column
                    (quote f.Field))
            |> String.concat ","

        { ExitCode = exitCode
          Stdout =
            sprintf
                "{\"schemaVersion\":1,\"command\":\"plan\",\"exitCode\":%d,\"subject\":\"plan\",\"inspected\":%d,\"scanned\":[],\"notes\":[],\"violations\":[%s]}\n"
                exitCode
                report.Inspected
                violations
          Stderr = "" })

// ---------------------------------------------------------------------------
// Disk adapter [Repo-grounded — `runtime/disk.rs::{walk, read}`]
// ---------------------------------------------------------------------------

/// Every file under `<repoRoot>/plans`, repository-relative with `/`
/// separators. Links are skipped at every depth, and a directory that cannot
/// be listed contributes nothing. Integration proves it against real trees.
[<ExcludeFromCodeCoverage>]
let listPlanFiles (repoRoot: string) : string list =
    let root = Path.GetFullPath repoRoot

    let rec walk (directory: DirectoryInfo) : string list =
        let children =
            try
                directory.GetFileSystemInfos() |> List.ofArray
            with
            | :? IOException
            | :? UnauthorizedAccessException -> []

        children
        |> List.filter (fun child -> isNull child.LinkTarget)
        |> List.collect (fun child ->
            match child with
            | :? DirectoryInfo as nested -> walk nested
            | _ -> [ Path.GetRelativePath(root, child.FullName).Replace('\\', '/') ])

    let plans = DirectoryInfo(Path.Combine(root, "plans"))

    if plans.Exists && isNull plans.LinkTarget then
        walk plans
    else
        []

let private strictUtf8 = UTF8Encoding(false, true)

/// Reads one repository-relative document the way RHINO's `read_to_string`
/// does: strict UTF-8, absence distinct from every other failure. Integration
/// proves every branch against real files.
[<ExcludeFromCodeCoverage>]
let readPlanDocument (repoRoot: string) (path: string) : PlanRead =
    let full = Path.Combine(repoRoot, path)

    try
        let bytes = File.ReadAllBytes full

        try
            Found(strictUtf8.GetString bytes)
        with :? DecoderFallbackException ->
            NotText
    with
    | :? FileNotFoundException
    | :? DirectoryNotFoundException -> Missing
    | :? UnauthorizedAccessException when Directory.Exists full -> Unreadable "Is a directory (os error 21)"
    | :? UnauthorizedAccessException -> Unreadable "Permission denied (os error 13)"
    | :? IOException as error -> Unreadable error.Message
