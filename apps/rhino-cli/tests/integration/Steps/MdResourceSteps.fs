/// Real-filesystem Integration TickSpec step definitions binding `docs-validate-frontmatter.feature`'s
/// F#-remainder scenarios to `RhinoCli.Application.Md.validateDocsFrontmatter`
/// [Repo-grounded —
/// `specs/apps/rhino/cli/behaviours/md/docs-validate-frontmatter.feature`,
/// `apps/rhino-cli/src/application/docs/frontmatter.rs`,
/// `apps/rhino-cli/src/commands/md_validate_frontmatter.rs`]. Naming and
/// heading-hierarchy rules are RHINO's; `gate/rust-delegation.feature` binds
/// their delegation.
///
/// Follows `ConventionSteps.fs`'s/`TestCoverageSteps.fs`'s per-scenario
/// slicing convention: each xunit `[<Fact>]` below runs exactly one scenario,
/// extracted from the real, frozen feature file. `md` is not yet listed in
/// `FSHARP_NAMESPACES` (that flip is later, separate Wave D integration
/// work), so — matching `TestCoverageSteps.fs`'s own precedent for
/// `test-coverage validate` before its Wave C flip — every scenario below
/// calls one of `RhinoCli.Application.Md`'s validators directly with a path
/// list (or a repo root standing in for it) built by hand rather than
/// parsing an argv string.
///
/// Also binds `docs-validate-mermaid.feature`'s 39 scenarios to
/// `RhinoCli.Application.Md.validateMermaidDocs`/`parseMermaidDiagram`
/// [Repo-grounded —
/// `specs/apps/rhino/cli/behaviours/md/docs-validate-mermaid.feature`,
/// `apps/rhino-cli/tests/docs.rs`'s `DocsWorld` mermaid step definitions].
/// This feature's fixtures and assertions are ported directly from
/// `docs.rs` (the legacy Rust source's step definitions) rather
/// than re-derived from `md_validate_mermaid.rs` in isolation — several
/// scenario titles describe round thresholds ("4 nodes at one rank") that
/// the actual fixtures deliberately overshoot ("5 parallel nodes") to clear
/// the validator's strict `>` comparison, and only `docs.rs` records that
/// intent. The three mermaid-parser-only scenarios ("the parser processes
/// the file") call `extractMermaidBlocks`/`parseMermaidDiagram` directly,
/// mirroring `docs.rs`'s own direct-parser step group.
///
/// Also binds `md-audit.feature`'s 1 scenario to
/// `RhinoCli.Application.Md.runAudit`
/// [Repo-grounded —
/// `specs/apps/rhino/cli/behaviours/md/md-audit.feature`,
/// `apps/rhino-cli/src/commands/md_audit.rs`]. `runAudit` only dispatches the
/// five member validators this file has ported so far (`frontmatter-dates`
/// and `readme-index` are not yet ported — see `runAudit`'s doc comment in
/// `Md.fs`), which this feature's sole scenario (an empty repository, where
/// every member trivially passes) does not need to distinguish.
module RhinoCli.Tests.Integration.Steps.MdResourceSteps

/// Exact static-coverage ownership for the real-filesystem adapter.
let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/md/docs-validate-frontmatter.feature"
      "specs/apps/rhino/cli/behaviours/md/docs-validate-links.feature"
      "specs/apps/rhino/cli/behaviours/md/docs-validate-mermaid.feature"
      "specs/apps/rhino/cli/behaviours/md/md-audit.feature"
      "specs/apps/rhino/cli/behaviours/md/repo-governance-frontmatter-audit.feature" ]

open System
open System.IO
open System.Text.Json
open TickSpec
open Xunit
open RhinoCli.Application.Md
open RhinoCli.Domain.Types

/// Instance step-definition container — see `ConventionSteps.fs`'s module
/// doc comment for why TickSpec's one-instance-per-scenario lifecycle makes
/// instance-level mutable fields the idiomatic state-threading mechanism
/// here.
type MdResourceSteps() =
    let mutable rootDir: string option = None
    let mutable outcome: Result<Finding list, string> option = None
    let mutable useAllowlist = false
    let mutable stagedFiles: string list = []

    // ---- docs-validate-mermaid.feature state ----
    let mutable mermaidResult: MermaidValidationResult option = None
    let mutable mermaidRendered: string option = None
    let mutable mermaidThresholds: (int * int) option = None
    let mutable mermaidStagedFiles: string list = []
    let mutable mermaidChangedFiles: string list option = None
    let mutable mermaidFileA: string option = None
    let mutable mermaidFileB: string option = None
    let mutable mermaidParsedEdges: (string * string) list = []
    let mutable mermaidParsedDepth: int = 0

    // ---- md-audit.feature state ----
    let mutable mdAuditResult: MdAuditResult option = None

    // ---- repo-governance-frontmatter-audit.feature state ----
    let mutable frontmatterDatesFileNeedle: string option = None
    let mutable frontmatterDatesTarget: string option = None

    let root () =
        match rootDir with
        | Some dir -> dir
        | None -> failwith "no repository root has been prepared by a Given step"

    /// Returns the scenario's shared temp-dir root, creating it on first
    /// use — lets a scenario with more than one `Given`/`And` fixture step
    /// (e.g. heading-hierarchy's "exclude-flag-suppresses-tree") write into
    /// the same tree instead of each step getting its own temp dir.
    let ensureRoot () =
        match rootDir with
        | Some dir -> dir
        | None ->
            let dir =
                Path.Combine(Path.GetTempPath(), "rhino-cli-md-" + Guid.NewGuid().ToString("N"))

            Directory.CreateDirectory(dir) |> ignore
            rootDir <- Some dir
            dir

    let theOutcome () : Result<Finding list, string> =
        outcome
        |> Option.defaultWith (fun () -> failwith "no command has been run by a When step")

    let theFindings () : Finding list =
        match theOutcome () with
        | Ok findings -> findings
        | Error message -> failwith (sprintf "expected the md validator to produce findings, got error: %s" message)

    let newTempDir () = ensureRoot ()

    let writeDoc (relativePath: string) (content: string) =
        let full = Path.Combine(ensureRoot (), relativePath)
        Directory.CreateDirectory(Path.GetDirectoryName(full)) |> ignore
        File.WriteAllText(full, content)

    /// Wraps `body` in a single ` ```mermaid ` fenced code block inside a
    /// minimal markdown document — the mermaid scenarios' shared fixture
    /// shape [Repo-grounded — `docs.rs::mermaid_block`].
    let mermaidBlock (body: string) : string =
        sprintf "# Diagram\n\n```mermaid\n%s\n```\n" body

    let theMermaidResult () : MermaidValidationResult =
        mermaidResult
        |> Option.defaultWith (fun () -> failwith "no mermaid command has been run by a When step")

    let mermaidFileANeedle () : string =
        mermaidFileA
        |> Option.defaultWith (fun () -> failwith "fixture must set mermaidFileA")

    let mermaidFileBNeedle () : string =
        mermaidFileB
        |> Option.defaultWith (fun () -> failwith "fixture must set mermaidFileB")

    let assertHasBlockingFindingContaining (needle: string) =
        let findings = theFindings ()

        Assert.Contains(
            findings,
            fun (f: Finding) ->
                f.Severity = Severity.Blocking
                && f.Message.Contains(needle, StringComparison.Ordinal)
        )

    let assertHasBlockingFindingWithMessageAndPath (messageNeedle: string) =
        let findings = theFindings ()

        Assert.Contains(
            findings,
            fun (f: Finding) ->
                f.Severity = Severity.Blocking
                && f.Message.Contains(messageNeedle, StringComparison.Ordinal)
                && (f.Path |> Option.isSome)
        )

    let assertHasBlockingFindingInPathWithMessage (pathNeedle: string) (messageNeedle: string) =
        let findings = theFindings ()

        Assert.Contains(
            findings,
            fun (f: Finding) ->
                f.Severity = Severity.Blocking
                && f.Message.Contains(messageNeedle, StringComparison.Ordinal)
                && (f.Path |> Option.defaultValue "").Replace('\\', '/').Contains(pathNeedle, StringComparison.Ordinal)
        )

    let assertHasBlockingFindingInPath (pathNeedle: string) =
        let findings = theFindings ()

        Assert.Contains(
            findings,
            fun (f: Finding) ->
                f.Severity = Severity.Blocking
                && (f.Path |> Option.defaultValue "").Replace('\\', '/').Contains(pathNeedle, StringComparison.Ordinal)
        )

    let assertNoFindingInPath (pathNeedle: string) =
        let findings = theFindings ()

        Assert.DoesNotContain(
            findings,
            fun (f: Finding) ->
                (f.Path |> Option.defaultValue "").Replace('\\', '/').Contains(pathNeedle, StringComparison.Ordinal)
        )

    /// Runs `validateFrontmatterDates` against the scenario's prepared root,
    /// mirroring `md_validate_frontmatter_dates.rs::run`'s path- and
    /// exclude-resolution logic at the level this file's own precedent
    /// allows (`md` is not yet wired to CLI argv — see this file's module
    /// doc comment): `frontmatterDatesTarget`, when a fixture sets it, is the
    /// command's sole explicit path argument; otherwise the whole prepared
    /// root stands in for the Rust command's five-directory default path
    /// list (every fixture below writes under a subdirectory a real
    /// invocation's defaults would already reach). The registry-driven
    /// `md-frontmatter-dates` gate's `exclude` arg is read from
    /// `repo-config.yml` at the root exactly as the real command reads it,
    /// with no CLI `--exclude` flag to merge in since no scenario here
    /// exercises one.
    let runFrontmatterDatesValidate () : Result<Finding list, string> =
        let repoRoot = root ()

        let paths =
            match frontmatterDatesTarget with
            | Some target -> [ Path.Combine(repoRoot, target) ]
            | None -> [ repoRoot ]

        let excludedPrefixes =
            (RhinoCli.Application.RepoConfig.loadOrDefault repoRoot).Gates
            |> List.tryFind (fun gate -> gate.Id = "md-frontmatter-dates")
            |> Option.bind (fun gate -> gate.Args |> Map.tryFind "exclude")
            |> Option.defaultValue []

        validateFrontmatterDates paths excludedPrefixes

    let frontmatterDatesFileNeedleValue () : string =
        frontmatterDatesFileNeedle
        |> Option.defaultWith (fun () -> failwith "fixture must set frontmatterDatesFileNeedle")

    // ---- Given ----

    [<Given>]
    member _.``a software-engineering doc with title, description, category, subcategory, and tags frontmatter``() =
        rootDir <- Some(newTempDir ())

        writeDoc
            "docs/explanation/software-engineering/foo.md"
            "---\ntitle: T\ndescription: D\ncategory: explanation\nsubcategory: S\ntags: [a]\n---\nbody\n"

    [<Given>]
    member _.``a governance doc with description and when_to_use frontmatter``() =
        rootDir <- Some(newTempDir ())

        writeDoc "repo-governance/conventions/foo.md" "---\ndescription: D\nwhen_to_use: Use when W.\n---\nbody\n"

    [<Given>]
    member _.``a governance doc with description, when_to_use, and a title field``() =
        rootDir <- Some(newTempDir ())

        writeDoc
            "repo-governance/conventions/foo.md"
            "---\ntitle: T\ndescription: D\nwhen_to_use: Use when W.\n---\nbody\n"

    [<Given>]
    member _.``a governance doc with description, when_to_use, and a category field``() =
        rootDir <- Some(newTempDir ())

        writeDoc
            "repo-governance/conventions/foo.md"
            "---\ncategory: explanation\ndescription: D\nwhen_to_use: Use when W.\n---\nbody\n"

    [<Given>]
    member _.``a governance doc under repo-governance/glossary carrying only a title field``() =
        rootDir <- Some(newTempDir ())
        writeDoc "repo-governance/glossary/foo.md" "---\ntitle: T\n---\nbody\n"

    [<Given>]
    member _.``a doc without frontmatter under a docs folder whose name ends in repo-governance``() =
        rootDir <- Some(newTempDir ())
        writeDoc "docs/reference/renamed-to-repo-governance/foo.md" "# Foo\n\nbody\n"

    /// The deprecated `category: software` value is itself the "all required
    /// frontmatter fields" fixture this scenario needs — every required
    /// field is present, `category` is merely the deprecated-but-recognised
    /// value, matching `frontmatter.rs::tests::software_deprecated_category_emits_warn`.
    [<Given>]
    member _.``a software-engineering doc with all required frontmatter fields``() =
        rootDir <- Some(newTempDir ())

        writeDoc
            "docs/explanation/software-engineering/foo.md"
            "---\ntitle: T\ndescription: D\ncategory: software\nsubcategory: S\ntags: [a]\n---\nbody\n"

    // ---- Given (docs-validate-links.feature) ----

    [<Given>]
    member _.``markdown files where all internal links point to existing files``() =
        writeDoc "source.md" "See [destination](./destination.md) for details.\n"
        writeDoc "destination.md" "# Destination\n"

    [<Given>]
    member _.``a markdown file with an image link pointing to a non-existent file``() =
        writeDoc "broken-source.md" "![diagram](./does-not-exist.png)\n"

    [<Given>]
    member _.``a markdown file containing only external HTTPS links``() =
        writeDoc "external-only.md" "See [a](https://example.com) and [b](https://example.org/page).\n"

    [<Given>]
    member _.``a markdown file that links to an existing heading anchor in another file``() =
        writeDoc "anchor-source.md" "See [section](./anchor-doc.md#section).\n"
        writeDoc "anchor-doc.md" "# Title\n\n## Section\n"

    [<Given>]
    member _.``a markdown file that links to a non-existent heading anchor in an existing file``() =
        writeDoc "broken-anchor-source.md" "See [section](./broken-anchor-doc.md#missing).\n"
        writeDoc "broken-anchor-doc.md" "# Title\n"

    [<Given>]
    member _.``a markdown file containing a same-file anchor link that has no matching heading``() =
        writeDoc "same-file-anchor.md" "# Title\n\nSee [missing](#missing) below.\n"

    /// This scenario's Gherkin `Given` line reads (verbatim, from the frozen
    /// feature file): `a markdown file that links to the anchor
    /// "#snake_case" of a file whose heading is "snake_case"`. TickSpec's
    /// own Gherkin line-lexer treats `#` as a comment marker even inside a
    /// quoted string — unlike the static behaviour-coverage adapter's
    /// parser, which (correctly, per the Gherkin spec) only treats a
    /// `#` that *starts* a trimmed line as a comment — so by the time
    /// TickSpec tries to match a step against this line, everything from the
    /// `#` onward has already been stripped, leaving only `a markdown file
    /// that links to the anchor "` (a dangling, unterminated quote) as the
    /// text step matching actually sees at runtime — verified via the
    /// `[FAIL] Missing step definition` message that truncated text produced
    /// before this method's pattern covered it.
    ///
    /// Both TickSpec and the static behaviour-coverage adapter treat a
    /// backtick-quoted step name as a raw (unescaped) regex rather than a
    /// literal string — the existing `` a git index with "(.*)" staged ``
    /// step elsewhere in this file already relies on that. This method's
    /// name below exploits the same mechanism, spelling out a
    /// `(?:full|truncated)` alternation so ONE step pattern satisfies both
    /// checkers at once: `scripts/behaviour-coverage.mjs` matches the
    /// first alternative against the frozen feature file's real,
    /// untruncated line (no "missing step" gap), while `TickSpec` matches
    /// the second alternative against the truncated text it actually
    /// presents at runtime (so the fixture body below really does run, and
    /// the step is not an "orphan" the coverage tool can only find via the
    /// first alternative).
    [<Given>]
    member _.``(?:a markdown file that links to the anchor "#snake_case" of a file whose heading is "snake_case"|a markdown file that links to the anchor ")``
        ()
        =
        writeDoc "snake-source.md" "See [snake](./snake-doc.md#snake_case).\n"
        writeDoc "snake-doc.md" "# snake_case\n"

    // ---- Given (docs-validate-mermaid.feature) ----

    [<Given>]
    member _.``a markdown file containing a flowchart where every node label is within the limit``() =
        writeDoc "docs/d.md" (mermaidBlock "flowchart TD\n    A[Start] --> B[End]")

    [<Given>]
    member _.``a markdown file containing a flowchart with a node label longer than the limit``() =
        writeDoc
            "docs/d.md"
            (mermaidBlock "flowchart TD\n    A[This label is definitely longer than thirty characters total]")

    [<Given>]
    member _.``a markdown file containing a flowchart with a node label of 35 characters``() =
        let label = String.replicate 35 "x"
        writeDoc "docs/d.md" (mermaidBlock (sprintf "flowchart TD\n    A[%s]" label))

    [<Given>]
    member _.``a markdown file containing a TB flowchart with 10 nodes chained sequentially``() =
        let body =
            [ 0..8 ]
            |> List.map (fun i -> sprintf "N%d --> N%d" i (i + 1))
            |> String.concat "\n    "

        writeDoc "docs/d.md" (mermaidBlock (sprintf "flowchart TD\n    %s" body))

    [<Given>]
    member _.``a markdown file containing a TB flowchart where no rank has more than 3 nodes``() =
        writeDoc "docs/d.md" (mermaidBlock "flowchart TD\n    R --> A\n    R --> B\n    R --> C")

    /// 5 parallel targets → span 5 > default max-width 4 → flagged (4 alone
    /// is not > 4) [Repo-grounded — `docs.rs::given_m_tb_width_4`].
    [<Given>]
    member _.``a markdown file containing a TB flowchart where one rank has 4 parallel nodes``() =
        writeDoc
            "docs/d.md"
            (mermaidBlock "flowchart TD\n    R --> A\n    R --> B\n    R --> C\n    R --> D\n    R --> E")

    [<Given>]
    member _.``a markdown file containing an LR flowchart where no rank has more than 3 nodes``() =
        writeDoc "docs/d.md" (mermaidBlock "flowchart LR\n    R --> A\n    R --> B\n    R --> C")

    /// A 6-node chain → LR depth 6 > default max-width 4 (LR swaps
    /// horizontal/vertical) → flagged
    /// [Repo-grounded — `docs.rs::given_m_lr_chain_deep`].
    [<Given>]
    member _.``a markdown file containing an LR flowchart with a chain that is 4 levels deep``() =
        let body =
            [ 0..4 ]
            |> List.map (fun i -> sprintf "N%d --> N%d" i (i + 1))
            |> String.concat "\n    "

        writeDoc "docs/d.md" (mermaidBlock (sprintf "flowchart LR\n    %s" body))

    /// Same 5-parallel shape as the "4 parallel nodes" fixture above — this
    /// scenario's point is that `--max-width 5` makes it pass
    /// [Repo-grounded — `docs.rs::given_m_width_4_flag`].
    [<Given>]
    member _.``a markdown file containing a flowchart with 4 nodes at one rank``() =
        writeDoc
            "docs/d.md"
            (mermaidBlock "flowchart TD\n    R --> A\n    R --> B\n    R --> C\n    R --> D\n    R --> E")

    /// Span 4 (Root→A,B,C,D) and depth 6 (A→E→F→G→H→I); the shared "plain
    /// run" When step applies `mermaidThresholds` (max-width 3, max-depth 5)
    /// so both thresholds are exceeded and the complex-diagram warning fires
    /// [Repo-grounded — `docs.rs::given_m_both_exceeded`].
    [<Given>]
    member _.``a markdown file containing a flowchart with 4 nodes at one rank and more than 5 ranks deep``() =
        writeDoc
            "docs/d.md"
            (mermaidBlock
                "flowchart TB\n    Root --> A\n    Root --> B\n    Root --> C\n    Root --> D\n    A --> E\n    E --> F\n    F --> G\n    G --> H\n    H --> I")

        mermaidThresholds <- Some(3, 5)

    /// Span 4 (Root→A,B,C,D) and depth 4 (A→E→F→G); the When step applies
    /// `--max-width 3 --max-depth 3` explicitly
    /// [Repo-grounded — `docs.rs::given_m_width_depth_4`].
    [<Given>]
    member _.``a markdown file containing a flowchart with 4 nodes at one rank and exactly 4 ranks deep``() =
        writeDoc
            "docs/d.md"
            (mermaidBlock
                "flowchart TB\n    Root --> A\n    Root --> B\n    Root --> C\n    Root --> D\n    A --> E\n    E --> F\n    F --> G")

    [<Given>]
    member _.``a markdown file containing a mermaid code block with exactly one flowchart diagram``() =
        writeDoc "docs/d.md" (mermaidBlock "flowchart TD\n    A --> B")

    [<Given>]
    member _.``a markdown file containing a mermaid code block with two flowchart declarations``() =
        writeDoc "docs/d.md" (mermaidBlock "flowchart TD\n    A --> B\nflowchart LR\n    C --> D")

    [<Given>]
    member _.``a markdown file containing a mermaid block using the graph keyword instead of flowchart with no violations``
        ()
        =
        writeDoc "docs/d.md" (mermaidBlock "graph TD\n    A[Start] --> B[End]")

    [<Given>]
    member _.``a markdown file containing an over-wide LR flowchart with a %% comment above the directive``() =
        let body =
            [ 0..4 ]
            |> List.map (fun i -> sprintf "N%d --> N%d" i (i + 1))
            |> String.concat "\n    "

        writeDoc "docs/d.md" (mermaidBlock ("%% Color palette: Blue #0173B2\nflowchart LR\n    " + body))

    [<Given>]
    member _.``a markdown file containing an over-wide LR flowchart with an init directive above the type``() =
        let body =
            [ 0..4 ]
            |> List.map (fun i -> sprintf "N%d --> N%d" i (i + 1))
            |> String.concat "\n    "

        writeDoc "docs/d.md" (mermaidBlock ("%%{init: {'theme':'base'}}%%\nflowchart LR\n    " + body))

    [<Given>]
    member _.``a markdown file containing an over-long state label with a %% comment above the directive``() =
        let label = String.replicate 40 "y"

        writeDoc "docs/d.md" (mermaidBlock ("%% a comment\nstateDiagram-v2\n    [*] --> a\n    a --> b : " + label))

    [<Given>]
    member _.``a markdown file containing a sequenceDiagram with a %% comment above the directive``() =
        writeDoc "docs/d.md" (mermaidBlock "%% a comment\nsequenceDiagram\n    A ->> B: hello there friend")

    [<Given>]
    member _.``a markdown file containing only sequenceDiagram and classDiagram mermaid blocks``() =
        let content =
            mermaidBlock "sequenceDiagram\n    A->>B: hi"
            + mermaidBlock "classDiagram\n    class Foo"

        writeDoc "docs/d.md" content

    [<Given>]
    member _.``a markdown file containing no mermaid code blocks``() =
        writeDoc "docs/d.md" "# Just text\n\nNo diagrams here.\n"

    [<Given>]
    member _.``a markdown file with a mermaid violation that has not been staged in git``() =
        writeDoc
            "docs/unstaged.md"
            (mermaidBlock "flowchart TD\n    A[This label is definitely longer than thirty characters total]")

    [<Given>]
    member _.``a markdown file with a mermaid violation that is not in the push range``() =
        writeDoc
            "outside/d.md"
            (mermaidBlock "flowchart TD\n    A[This label is definitely longer than thirty characters total]")

        writeDoc "docs/clean.md" "# Clean\n"
        mermaidChangedFiles <- Some [ "docs/clean.md" ]

    [<Given>]
    member _.``a markdown file containing a flowchart with a label length violation``() =
        writeDoc
            "docs/d.md"
            (mermaidBlock "flowchart TD\n    A[This label is definitely longer than thirty characters total]")

    [<Given>]
    member _.``a markdown file containing a flowchart with no violations``() =
        writeDoc "docs/d.md" (mermaidBlock "flowchart TD\n    A[ok] --> B[fine]")

    [<Given>]
    member _.``a markdown file under plans/ containing a Mermaid flowchart with a label longer than 30 characters``() =
        writeDoc
            "plans/p.md"
            (mermaidBlock "flowchart TD\n    A[This label is definitely longer than thirty characters total]")

    [<Given>]
    member _.``a markdown file with a flowchart line "A --> B & C & D"``() =
        writeDoc "docs/parser.md" (mermaidBlock "flowchart TD\n    A --> B & C & D")

    [<Given>]
    member _.``a markdown file with a flowchart line "A & B --> C & D"``() =
        writeDoc "docs/parser.md" (mermaidBlock "flowchart TD\n    A & B --> C & D")

    [<Given>]
    member _.``a markdown file with a flowchart "T --> A & B & C & D & E"``() =
        writeDoc "docs/d.md" (mermaidBlock "flowchart TD\n    T --> A & B & C & D & E")

    [<Given>]
    member _.``a markdown file containing a flowchart with a subgraph that holds 7 child nodes``() =
        writeDoc
            "docs/d.md"
            (mermaidBlock
                "flowchart TD\n    subgraph WF [Group]\n    A --> B\n    B --> C\n    C --> D\n    D --> E\n    E --> F\n    F --> G\n    end")

    [<Given>]
    member _.``a markdown file containing a flowchart with a subgraph that holds exactly 6 child nodes``() =
        writeDoc
            "docs/d.md"
            (mermaidBlock
                "flowchart TD\n    subgraph WF [Group]\n    A --> B\n    B --> C\n    C --> D\n    D --> E\n    E --> F\n    end")

    [<Given>]
    member _.``a markdown file containing a flowchart with a subgraph that holds 5 child nodes``() =
        writeDoc
            "docs/d.md"
            (mermaidBlock
                "flowchart TD\n    subgraph WF [Group]\n    A --> B\n    B --> C\n    C --> D\n    D --> E\n    end")

    [<Given>]
    member _.``a markdown file with a flowchart using only single-target edges and small subgraphs``() =
        writeDoc "docs/d.md" (mermaidBlock "flowchart TD\n    A --> B\n    subgraph WF [Group]\n    C --> D\n    end")

    [<Given>]
    member _.``a markdown file under plans/done containing a flowchart with a width violation``() =
        writeDoc
            "plans/done/2024-01-01__old/notes.md"
            (mermaidBlock "flowchart TD\n    R --> A\n    R --> B\n    R --> C\n    R --> D\n    R --> E")

        mermaidFileA <- Some "plans/done/2024-01-01__old/notes.md"

    [<Given>]
    member _.``a markdown file under docs containing a flowchart with a different width violation``() =
        writeDoc
            "docs/wide.md"
            (mermaidBlock "flowchart TD\n    S --> P\n    S --> Q\n    S --> R\n    S --> T\n    S --> U")

        mermaidFileB <- Some "docs/wide.md"

    [<Given>]
    member _.``a markdown file under specs/ containing a flowchart with a width violation``() =
        writeDoc
            "specs/apps/foo/notes.md"
            (mermaidBlock "flowchart TD\n    R --> A\n    R --> B\n    R --> C\n    R --> D\n    R --> E")

        mermaidFileA <- Some "specs/apps/foo/notes.md"

    /// TickSpec treats a backtick-quoted step name as a raw (unescaped)
    /// regex — see this file's `snake_case`-anchor `Given` above — so the
    /// literal `|` characters in this scenario's Gherkin text must be
    /// escaped here or TickSpec parses them as regex alternation, which
    /// made this step ambiguous against the `"A --> B & C & D"` step.
    [<Given>]
    member _.``a markdown file with a flowchart line "A -->\|yes\| B"``() =
        writeDoc "docs/parser.md" (mermaidBlock "flowchart TD\n    A -->|yes| B")

    [<Given>]
    member _.``a markdown file with a flowchart forming the cycle A --> B --> C --> A``() =
        writeDoc "docs/d.md" (mermaidBlock "flowchart TD\n    A --> B\n    B --> C\n    C --> A")

    // ---- Given (md-audit.feature) ----

    [<Given>]
    member _.``a repository containing no markdown files``() = rootDir <- Some(newTempDir ())

    // ---- Given (repo-governance-frontmatter-audit.feature) ----

    [<Given>]
    member _.``a governance directory with no forbidden date metadata in markdown files``() =
        writeDoc "repo-governance/clean.md" "---\ntitle: T\n---\n\nClean body.\n"

    [<Given>]
    member _.``a governance markdown file whose body contains a Last Updated footer block``() =
        writeDoc "repo-governance/footer.md" "# Title\n\nBody.\n\n**Last Updated**: 2026-01-01\n"
        frontmatterDatesFileNeedle <- Some "repo-governance/footer.md"

    [<Given>]
    member _.``a governance markdown file whose body contains a standalone Created date annotation``() =
        writeDoc "repo-governance/created.md" "# Title\n\n- **Created**: 2026-01-01\n"
        frontmatterDatesFileNeedle <- Some "repo-governance/created.md"

    /// The website-app exemption is registry-driven (the `md-frontmatter-dates`
    /// gate's `exclude` arg), not hardcoded — this fixture declares its own
    /// local `repo-config.yml` so it exercises the real exclusion mechanism
    /// rather than depending on this repo's own configuration
    /// [Repo-grounded — `docs.rs::given_fd_website_exempt`].
    [<Given>]
    member _.``a markdown file with forbidden date metadata under a website app directory``() =
        writeDoc "apps/ayokoding-www/content/post.md" "---\nupdated: 2026-01-01\n---\n"

        writeDoc
            "repo-config.yml"
            (String.concat
                "\n"
                [ "gates:"
                  "  - id: md-frontmatter-dates"
                  "    args:"
                  "      exclude:"
                  "        - apps/"
                  "" ])

        frontmatterDatesTarget <- Some "apps/ayokoding-www"

    // ---- When ----

    [<When>]
    member _.``the developer runs docs validate-frontmatter``() =
        outcome <- Some(validateDocsFrontmatter [ root () ])

    // ---- When (docs-validate-links.feature) ----

    [<When>]
    member _.``the developer runs docs validate-links``() =
        outcome <-
            Some(
                Ok(
                    validateDocsLinks
                        { RepoRoot = root ()
                          StagedFiles = None
                          ExcludePrefixes = [] }
                )
            )

    // ---- When (docs-validate-mermaid.feature) ----

    /// The scenarios that reuse this shared "plain run" step scope the scan
    /// to `docs/` (matching `docs.rs::when_m_run`'s always-passed `"docs"`
    /// positional argument) and apply `mermaidThresholds` when a fixture set
    /// it (the "both thresholds exceeded" warning scenario)
    /// [Repo-grounded — `docs.rs::when_m_run`].
    [<When>]
    member _.``the developer runs docs validate-mermaid``() =
        let baseOptions =
            match mermaidThresholds with
            | Some(mw, md) ->
                { defaultMermaidValidateOptions with
                    MaxWidth = mw
                    MaxDepth = md }
            | None -> defaultMermaidValidateOptions

        mermaidResult <-
            Some(
                validateMermaidDocs
                    { RepoRoot = root ()
                      Paths = [ "docs" ]
                      StagedFiles = None
                      ChangedFiles = None
                      ExcludePrefixes = []
                      Options = baseOptions }
            )

    [<When>]
    member _.``the developer runs docs validate-mermaid with --max-label-len 40``() =
        mermaidResult <-
            Some(
                validateMermaidDocs
                    { RepoRoot = root ()
                      Paths = [ "docs" ]
                      StagedFiles = None
                      ChangedFiles = None
                      ExcludePrefixes = []
                      Options =
                        { defaultMermaidValidateOptions with
                            MaxLabelLen = 40 } }
            )

    [<When>]
    member _.``the developer runs docs validate-mermaid with --max-width 5``() =
        mermaidResult <-
            Some(
                validateMermaidDocs
                    { RepoRoot = root ()
                      Paths = [ "docs" ]
                      StagedFiles = None
                      ChangedFiles = None
                      ExcludePrefixes = []
                      Options =
                        { defaultMermaidValidateOptions with
                            MaxWidth = 5 } }
            )

    [<When>]
    member _.``the developer runs docs validate-mermaid with --max-depth 3``() =
        mermaidResult <-
            Some(
                validateMermaidDocs
                    { RepoRoot = root ()
                      Paths = [ "docs" ]
                      StagedFiles = None
                      ChangedFiles = None
                      ExcludePrefixes = []
                      Options =
                        { defaultMermaidValidateOptions with
                            MaxWidth = 3
                            MaxDepth = 3 } }
            )

    [<When>]
    member _.``the developer runs docs validate-mermaid with the --staged-only flag``() =
        mermaidResult <-
            Some(
                validateMermaidDocs
                    { RepoRoot = root ()
                      Paths = []
                      StagedFiles = Some mermaidStagedFiles
                      ChangedFiles = None
                      ExcludePrefixes = []
                      Options = defaultMermaidValidateOptions }
            )

    [<When>]
    member _.``the developer runs docs validate-mermaid with the --changed-only flag``() =
        mermaidResult <-
            Some(
                validateMermaidDocs
                    { RepoRoot = root ()
                      Paths = []
                      StagedFiles = None
                      ChangedFiles = mermaidChangedFiles
                      ExcludePrefixes = []
                      Options = defaultMermaidValidateOptions }
            )

    [<When>]
    member _.``the developer runs docs validate-mermaid with -o json``() =
        let result =
            validateMermaidDocs
                { RepoRoot = root ()
                  Paths = [ "docs" ]
                  StagedFiles = None
                  ChangedFiles = None
                  ExcludePrefixes = []
                  Options = defaultMermaidValidateOptions }

        mermaidResult <- Some result
        mermaidRendered <- Some(formatMermaidJson result)

    [<When>]
    member _.``the developer runs docs validate-mermaid with -o markdown``() =
        let result =
            validateMermaidDocs
                { RepoRoot = root ()
                  Paths = [ "docs" ]
                  StagedFiles = None
                  ChangedFiles = None
                  ExcludePrefixes = []
                  Options = defaultMermaidValidateOptions }

        mermaidResult <- Some result
        mermaidRendered <- Some(formatMermaidMarkdown result)

    [<When>]
    member _.``the developer runs docs validate-mermaid with --verbose``() =
        let result =
            validateMermaidDocs
                { RepoRoot = root ()
                  Paths = [ "docs" ]
                  StagedFiles = None
                  ChangedFiles = None
                  ExcludePrefixes = []
                  Options = defaultMermaidValidateOptions }

        mermaidResult <- Some result
        mermaidRendered <- Some(formatMermaidText result true false)

    [<When>]
    member _.``the developer runs docs validate-mermaid with --quiet``() =
        let result =
            validateMermaidDocs
                { RepoRoot = root ()
                  Paths = [ "docs" ]
                  StagedFiles = None
                  ChangedFiles = None
                  ExcludePrefixes = []
                  Options = defaultMermaidValidateOptions }

        mermaidResult <- Some result
        mermaidRendered <- Some(formatMermaidText result false true)

    [<When>]
    member _.``the developer runs docs validate-mermaid without path arguments``() =
        mermaidResult <-
            Some(
                validateMermaidDocs
                    { RepoRoot = root ()
                      Paths = []
                      StagedFiles = None
                      ChangedFiles = None
                      ExcludePrefixes = []
                      Options = defaultMermaidValidateOptions }
            )

    [<When>]
    member _.``the developer runs docs validate-mermaid with --max-subgraph-nodes 4``() =
        mermaidResult <-
            Some(
                validateMermaidDocs
                    { RepoRoot = root ()
                      Paths = [ "docs" ]
                      StagedFiles = None
                      ChangedFiles = None
                      ExcludePrefixes = []
                      Options =
                        { defaultMermaidValidateOptions with
                            MaxSubgraphNodes = 4 } }
            )

    [<When>]
    member _.``the developer runs docs validate-mermaid with --exclude plans/done``() =
        mermaidResult <-
            Some(
                validateMermaidDocs
                    { RepoRoot = root ()
                      Paths = []
                      StagedFiles = None
                      ChangedFiles = None
                      ExcludePrefixes = [ "plans/done" ]
                      Options = defaultMermaidValidateOptions }
            )

    /// Cycle-4 F1/F5 regression fixture: `--exclude ""` must exclude
    /// nothing, not silently empty the scanned file set
    /// [Repo-grounded — `docs.rs::when_m_exclude_empty`].
    [<When>]
    member _.``the developer runs docs validate-mermaid with an empty --exclude value``() =
        mermaidResult <-
            Some(
                validateMermaidDocs
                    { RepoRoot = root ()
                      Paths = []
                      StagedFiles = None
                      ChangedFiles = None
                      ExcludePrefixes = [ "" ]
                      Options = defaultMermaidValidateOptions }
            )

    // ---- When (md-audit.feature) ----

    [<When>]
    member _.``the developer runs "rhino-cli md audit"``() =
        mdAuditResult <- Some(runAudit (root ()))

    // ---- When (repo-governance-frontmatter-audit.feature) ----

    [<When>]
    member _.``the developer runs md frontmatter validate on the directory``() =
        outcome <- Some(runFrontmatterDatesValidate ())

    [<When>]
    member _.``the developer runs md frontmatter validate on the file``() =
        outcome <- Some(runFrontmatterDatesValidate ())

    [<When>]
    member _.``the parser processes the file``() =
        let content = File.ReadAllText(Path.Combine(root (), "docs/parser.md"))
        let blocks = extractMermaidBlocks "docs/parser.md" content
        let block = List.head blocks
        let diagram, _ = parseMermaidDiagram block
        mermaidParsedEdges <- diagram.Edges |> List.map (fun e -> e.From, e.To)
        mermaidParsedDepth <- mermaidDepth diagram.Nodes diagram.Edges

    // ---- Then ----

    /// Shared across every `md` sub-feature's exit-code assertions. The
    /// md-audit scenario populates `mdAuditResult`, the mermaid scenarios
    /// populate `mermaidResult` instead of the generic `Finding`-based
    /// `outcome` (see this file's module doc comment), so this step checks
    /// `mdAuditResult` first, then `mermaidResult`, and falls back to
    /// `outcome` for every other validator.
    [<Then>]
    member _.``the command exits successfully``() =
        match mdAuditResult with
        | Some result -> Assert.Empty(result.Failures)
        | None ->
            match mermaidResult with
            | Some result ->
                Assert.True(
                    List.isEmpty result.Violations,
                    sprintf "expected no mermaid violations, got %A" result.Violations
                )
            | None ->
                match theOutcome () with
                | Ok findings ->
                    Assert.False(
                        findings |> List.exists (fun f -> f.Severity = Severity.Blocking),
                        "expected no fail-level findings"
                    )
                | Error message -> failwith (sprintf "expected the md command to succeed, got error: %s" message)

    [<Then>]
    member _.``the command exits with a failure code``() =
        match mermaidResult with
        | Some result -> Assert.False(List.isEmpty result.Violations, "expected at least one mermaid violation")
        | None ->
            match theOutcome () with
            | Ok findings ->
                Assert.True(
                    findings |> List.exists (fun f -> f.Severity = Severity.Blocking),
                    "expected at least one fail-level finding"
                )
            | Error _ -> ()

    [<Then>]
    member _.``the frontmatter output reports zero fail-level findings``() =
        let failFindings =
            theFindings () |> List.filter (fun f -> f.Severity = Severity.Blocking)

        Assert.Empty(failFindings)

    [<Then>]
    member _.``the frontmatter output identifies title as a key outside the allow-list``() =
        assertHasBlockingFindingContaining "field \"title\" is not permitted"

    [<Then>]
    member _.``the frontmatter output identifies category as a key outside the allow-list``() =
        assertHasBlockingFindingContaining "field \"category\" is not permitted"

    // ---- Then (docs-validate-links.feature) ----

    [<Then>]
    member _.``the output reports no broken links found``() = Assert.Empty(theFindings ())

    [<Then>]
    member _.``the output identifies the file containing the broken link``() =
        assertHasBlockingFindingInPath "broken-source.md"

    /// Shared with the mermaid feature's `--exclude plans/done` scenario,
    /// which populates `mermaidResult` instead of the generic `Finding`-
    /// based `outcome` — see this file's module doc comment.
    [<Then>]
    member _.``the output does not mention the plans/done file``() =
        match mermaidResult with
        | Some result ->
            let f = mermaidFileANeedle ()

            Assert.DoesNotContain(
                result.Violations,
                fun (v: MermaidViolation) -> v.FilePath.Replace('\\', '/').Contains(f, StringComparison.Ordinal)
            )
        | None -> assertNoFindingInPath "plans/done"

    [<Then>]
    member _.``the output does mention the docs file``() =
        match mermaidResult with
        | Some result ->
            let f = mermaidFileBNeedle ()

            Assert.Contains(
                result.Violations,
                fun (v: MermaidViolation) -> v.FilePath.Replace('\\', '/').Contains(f, StringComparison.Ordinal)
            )
        | None -> assertHasBlockingFindingInPath "docs/reference/page.md"

    [<Then>]
    member _.``the output identifies the broken anchor``() =
        assertHasBlockingFindingWithMessageAndPath "does not match any heading anchor"

    [<Then>]
    member _.``the output identifies the broken same-file anchor``() =
        assertHasBlockingFindingInPathWithMessage "same-file-anchor.md" "does not match any heading anchor in this file"

    // ---- Then (docs-validate-mermaid.feature) ----

    [<Then>]
    member _.``the output reports no violations``() =
        let result = theMermaidResult ()
        Assert.True(List.isEmpty result.Violations, sprintf "expected no violations, got %A" result.Violations)

    [<Then>]
    member _.``the output reports no new violations or warnings introduced by these fixes``() =
        let result = theMermaidResult ()
        Assert.True(List.isEmpty result.Violations, sprintf "expected no violations, got %A" result.Violations)
        Assert.True(List.isEmpty result.Warnings, sprintf "expected no warnings, got %A" result.Warnings)

    [<Then>]
    member _.``the output identifies the file, block, and node with the oversized label``() =
        let result = theMermaidResult ()

        Assert.Contains(
            result.Violations,
            fun (v: MermaidViolation) ->
                v.Kind = MermaidLabelTooLong
                && v.NodeId = "A"
                && v.FilePath.Replace('\\', '/').Contains("docs/d.md", StringComparison.Ordinal)
        )

    [<Then>]
    member _.``the output identifies the file and block with the excessive width``() =
        let result = theMermaidResult ()
        Assert.Contains(result.Violations, fun (v: MermaidViolation) -> v.Kind = MermaidWidthExceeded)

    [<Then>]
    member _.``the output contains a warning about diagram complexity``() =
        let result = theMermaidResult ()
        Assert.Contains(result.Warnings, fun (w: MermaidWarning) -> w.Kind = MermaidComplexDiagram)

    [<Then>]
    member _.``the output identifies the file and block with multiple diagrams``() =
        let result = theMermaidResult ()
        Assert.Contains(result.Violations, fun (v: MermaidViolation) -> v.Kind = MermaidMultipleDiagrams)

    [<Then>]
    member _.``the output is valid JSON``() =
        let text =
            mermaidRendered
            |> Option.defaultWith (fun () -> failwith "no rendered mermaid output")

        use doc = JsonDocument.Parse(text)
        ignore doc

    [<Then>]
    member _.``the JSON contains the violation kind, file path, block index, and node id``() =
        let text =
            mermaidRendered
            |> Option.defaultWith (fun () -> failwith "no rendered mermaid output")

        use doc = JsonDocument.Parse(text)
        let violation = doc.RootElement.GetProperty("violations").[0]
        Assert.Equal("label_too_long", violation.GetProperty("kind").GetString())

        Assert.Contains(
            "docs/d.md",
            violation.GetProperty("filePath").GetString().Replace('\\', '/'),
            StringComparison.Ordinal
        )

        Assert.Equal(0, violation.GetProperty("blockIndex").GetInt32())
        Assert.Equal("A", violation.GetProperty("nodeId").GetString())

    [<Then>]
    member _.``the output contains a table with File, Block, Line, Severity, Kind, and Detail columns``() =
        let text =
            mermaidRendered
            |> Option.defaultWith (fun () -> failwith "no rendered mermaid output")

        Assert.Contains("| File | Block | Line | Severity | Kind | Detail |", text)

    [<Then>]
    member _.``the output includes per-file scan detail lines``() =
        let text =
            mermaidRendered
            |> Option.defaultWith (fun () -> failwith "no rendered mermaid output")

        Assert.Contains("block(s) scanned", text)

    [<Then>]
    member _.``the output contains no text``() =
        let text =
            mermaidRendered
            |> Option.defaultWith (fun () -> failwith "no rendered mermaid output")

        Assert.Equal("", text)

    [<Then>]
    member _.``the output identifies the file under plans/``() =
        let result = theMermaidResult ()

        Assert.Contains(
            result.Violations,
            fun (v: MermaidViolation) ->
                v.Kind = MermaidLabelTooLong
                && v.FilePath.Replace('\\', '/').Contains("plans/p.md", StringComparison.Ordinal)
        )

    [<Then>]
    member _.``three edges are produced: A->B, A->C, A->D``() =
        Assert.Equal(3, mermaidParsedEdges.Length)

        for pair in [ "A", "B"; "A", "C"; "A", "D" ] do
            Assert.Contains(pair, mermaidParsedEdges)

    [<Then>]
    member _.``nodes B, C, D each have an in-edge from A``() =
        for target in [ "B"; "C"; "D" ] do
            Assert.Contains(("A", target), mermaidParsedEdges)

    [<Then>]
    member _.``four edges are produced: A->C, A->D, B->C, B->D``() =
        Assert.Equal(4, mermaidParsedEdges.Length)

        for pair in [ "A", "C"; "A", "D"; "B", "C"; "B", "D" ] do
            Assert.Contains(pair, mermaidParsedEdges)

    [<Then>]
    member _.``the output identifies the rank with 5 parallel nodes``() =
        let result = theMermaidResult ()

        Assert.Contains(
            result.Violations,
            fun (v: MermaidViolation) -> v.Kind = MermaidWidthExceeded && v.ActualWidth = 5
        )

    [<Then>]
    member _.``the output contains a warning about subgraph density``() =
        let result = theMermaidResult ()
        Assert.Contains(result.Warnings, fun (w: MermaidWarning) -> w.Kind = MermaidSubgraphDense)

    [<Then>]
    member _.``the output contains no subgraph density warning``() =
        let result = theMermaidResult ()
        Assert.DoesNotContain(result.Warnings, fun (w: MermaidWarning) -> w.Kind = MermaidSubgraphDense)

    [<Then>]
    member _.``the output does mention the plans/done file``() =
        let result = theMermaidResult ()
        let f = mermaidFileANeedle ()

        Assert.Contains(
            result.Violations,
            fun (v: MermaidViolation) -> v.FilePath.Replace('\\', '/').Contains(f, StringComparison.Ordinal)
        )

    [<Then>]
    member _.``the output identifies the file under specs/``() =
        let result = theMermaidResult ()
        let f = mermaidFileANeedle ()

        Assert.Contains(
            result.Violations,
            fun (v: MermaidViolation) ->
                v.Kind = MermaidWidthExceeded
                && v.FilePath.Replace('\\', '/').Contains(f, StringComparison.Ordinal)
        )

    [<Then>]
    member _.``one edge is produced: A->B``() =
        Assert.Equal<(string * string) list>([ "A", "B" ], mermaidParsedEdges)

    [<Then>]
    member _.``node B is ranked one level below node A``() = Assert.Equal(2, mermaidParsedDepth)

    [<Then>]
    member _.``no width violation is reported for the cycle members``() =
        let result = theMermaidResult ()
        Assert.DoesNotContain(result.Violations, fun (v: MermaidViolation) -> v.Kind = MermaidWidthExceeded)

    // ---- Then (md-audit.feature) ----

    [<Then>]
    member _.``the output reports all md validators passed``() =
        let result =
            mdAuditResult
            |> Option.defaultWith (fun () -> failwith "no md audit command has been run by a When step")

        Assert.Contains("MD AUDIT PASSED", result.Report)

    // ---- Then (repo-governance-frontmatter-audit.feature) ----

    [<Then>]
    member _.``the output reports zero frontmatter findings``() = Assert.Empty(theFindings ())

    [<Then>]
    member _.``the output identifies the forbidden footer block and its location``() =
        assertHasBlockingFindingInPathWithMessage (frontmatterDatesFileNeedleValue ()) "Last Updated"

    [<Then>]
    member _.``the output identifies the forbidden inline annotation and its location``() =
        assertHasBlockingFindingInPathWithMessage (frontmatterDatesFileNeedleValue ()) "inline date annotation"

    [<AfterScenario>]
    member _.Cleanup() =
        match rootDir with
        | Some dir when Directory.Exists dir -> Directory.Delete(dir, true)
        | _ -> ()

/// Reads one named `Scenario:` block out of a real, frozen `*.feature` file
/// under the `md` Gherkin directory (leaving the file itself untouched) and
/// runs it through TickSpec bound only against `MdResourceSteps` — see
/// `ConventionSteps.fs`'s `FeatureRunner` for why this is per-scenario
/// rather than per-file. Parameterised over the feature file name (rather
/// than one module per feature file) because `MdResourceSteps` already binds more
/// than one feature file's scenarios; splitting this module per file would
/// duplicate `extractScenario`/`run` for no behavioural difference.
module private FeatureRunner =

    let private featureDir: string =
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
                "md"
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
                || trimmed.StartsWith("Scenario Outline:", StringComparison.Ordinal)
                || trimmed.StartsWith("@", StringComparison.Ordinal))
            |> Option.map (fun relativeIdx -> startIdx + 1 + relativeIdx)
            |> Option.defaultValue featureLines.Length

        Array.append [| featureLine; "" |] featureLines.[startIdx .. endIdx - 1]

    /// Runs the single scenario named `scenarioTitle` from `featureFileName`
    /// (a `*.feature` file under the `md` Gherkin directory), bound against
    /// `MdResourceSteps`.
    let run (featureFileName: string) (scenarioTitle: string) : unit =
        let featurePath = Path.Combine(featureDir, featureFileName)
        let allLines = File.ReadAllLines featurePath
        let snippet = extractScenario allLines scenarioTitle
        let definitions = StepDefinitions([| typeof<MdResourceSteps> |])
        let feature = definitions.GenerateFeature(featurePath, snippet)
        let scenario = Seq.exactlyOne feature.Scenarios
        scenario.Action.Invoke()

[<Fact>]
let ``Software-engineering doc with all required frontmatter fields passes`` () =
    FeatureRunner.run
        "docs-validate-frontmatter.feature"
        "Software-engineering doc with all required frontmatter fields passes"

[<Fact>]
let ``Governance doc with description and when_to_use passes the two-key schema`` () =
    FeatureRunner.run
        "docs-validate-frontmatter.feature"
        "Governance doc with description and when_to_use passes the two-key schema"

[<Fact>]
let ``Governance doc carrying a title field fails the allow-list`` () =
    FeatureRunner.run "docs-validate-frontmatter.feature" "Governance doc carrying a title field fails the allow-list"

[<Fact>]
let ``Governance doc carrying any other key fails the allow-list`` () =
    FeatureRunner.run "docs-validate-frontmatter.feature" "Governance doc carrying any other key fails the allow-list"

[<Fact>]
let ``Governance subtree outside the four sub-trees is still validated`` () =
    FeatureRunner.run
        "docs-validate-frontmatter.feature"
        "Governance subtree outside the four sub-trees is still validated"

[<Fact>]
let ``A folder whose name ends in repo-governance is outside the governance tree`` () =
    FeatureRunner.run
        "docs-validate-frontmatter.feature"
        "A folder whose name ends in repo-governance is outside the governance tree"

[<Fact>]
let ``The software-engineering schema is unaffected by the governance allow-list`` () =
    FeatureRunner.run
        "docs-validate-frontmatter.feature"
        "The software-engineering schema is unaffected by the governance allow-list"

[<Fact>]
let ``Software-engineering doc with deprecated software category emits warn not fail`` () =
    FeatureRunner.run
        "docs-validate-frontmatter.feature"
        "Software-engineering doc with deprecated software category emits warn not fail"

[<Fact>]
let ``A document set with all valid internal links passes validation`` () =
    FeatureRunner.run "docs-validate-links.feature" "A document set with all valid internal links passes validation"

[<Fact>]
let ``External URLs are not validated`` () =
    FeatureRunner.run "docs-validate-links.feature" "External URLs are not validated"

[<Fact>]
let ``valid anchor link passes validation`` () =
    FeatureRunner.run "docs-validate-links.feature" "valid anchor link passes validation"

[<Fact>]
let ``broken anchor link produces a broken-anchor finding`` () =
    FeatureRunner.run "docs-validate-links.feature" "broken anchor link produces a broken-anchor finding"

[<Fact>]
let ``same-file anchor with no matching heading produces a broken-anchor finding`` () =
    FeatureRunner.run
        "docs-validate-links.feature"
        "same-file anchor with no matching heading produces a broken-anchor finding"

[<Fact>]
let ``anchor slugs keep underscores per the GitHub reference algorithm`` () =
    FeatureRunner.run "docs-validate-links.feature" "anchor slugs keep underscores per the GitHub reference algorithm"

[<Fact>]
let ``A flowchart with all short node labels passes validation`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "A flowchart with all short node labels passes validation"

[<Fact>]
let ``A node label exceeding the character limit is flagged`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "A node label exceeding the character limit is flagged"

[<Fact>]
let ``The max label length is configurable via flag`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "The max label length is configurable via flag"

[<Fact>]
let ``A deep sequential flowchart (long chain) passes validation regardless of depth`` () =
    FeatureRunner.run
        "docs-validate-mermaid.feature"
        "A deep sequential flowchart (long chain) passes validation regardless of depth"

[<Fact>]
let ``A TB flowchart with at most 3 nodes per rank passes validation`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "A TB flowchart with at most 3 nodes per rank passes validation"

[<Fact>]
let ``A TB flowchart with 4 nodes at one rank is flagged`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "A TB flowchart with 4 nodes at one rank is flagged"

[<Fact>]
let ``A LR flowchart with at most 3 nodes per rank passes validation`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "A LR flowchart with at most 3 nodes per rank passes validation"

[<Fact>]
let ``A LR flowchart with a chain 4 levels deep is flagged`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "A LR flowchart with a chain 4 levels deep is flagged"

[<Fact>]
let ``The max width is configurable via flag`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "The max width is configurable via flag"

[<Fact>]
let ``A flowchart exceeding both width and depth thresholds passes with a warning`` () =
    FeatureRunner.run
        "docs-validate-mermaid.feature"
        "A flowchart exceeding both width and depth thresholds passes with a warning"

[<Fact>]
let ``The max depth threshold for the both-exceeded warning is configurable via flag`` () =
    FeatureRunner.run
        "docs-validate-mermaid.feature"
        "The max depth threshold for the both-exceeded warning is configurable via flag"

[<Fact>]
let ``A mermaid block with a single flowchart passes validation`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "A mermaid block with a single flowchart passes validation"

[<Fact>]
let ``A mermaid block with two flowchart declarations is flagged`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "A mermaid block with two flowchart declarations is flagged"

[<Fact>]
let ``A mermaid block using the graph keyword alias is validated identically`` () =
    FeatureRunner.run
        "docs-validate-mermaid.feature"
        "A mermaid block using the graph keyword alias is validated identically"

[<Fact>]
let ``A flowchart preceded by a Mermaid comment line is still validated`` () =
    FeatureRunner.run
        "docs-validate-mermaid.feature"
        "A flowchart preceded by a Mermaid comment line is still validated"

[<Fact>]
let ``A flowchart preceded by a Mermaid init directive is still validated`` () =
    FeatureRunner.run
        "docs-validate-mermaid.feature"
        "A flowchart preceded by a Mermaid init directive is still validated"

[<Fact>]
let ``A state diagram preceded by a Mermaid comment line is still validated`` () =
    FeatureRunner.run
        "docs-validate-mermaid.feature"
        "A state diagram preceded by a Mermaid comment line is still validated"

[<Fact>]
let ``A commented non-flowchart block is still ignored`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "A commented non-flowchart block is still ignored"

[<Fact>]
let ``Non-flowchart mermaid blocks are ignored`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "Non-flowchart mermaid blocks are ignored"

[<Fact>]
let ``A markdown file with no mermaid blocks passes validation`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "A markdown file with no mermaid blocks passes validation"

[<Fact>]
let ``With --staged-only only staged markdown files are checked`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "With --staged-only only staged markdown files are checked"

[<Fact>]
let ``With --changed-only only files changed since upstream are checked`` () =
    FeatureRunner.run
        "docs-validate-mermaid.feature"
        "With --changed-only only files changed since upstream are checked"

[<Fact>]
let ``JSON output contains structured violation data`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "JSON output contains structured violation data"

[<Fact>]
let ``Markdown output produces a formatted table`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "Markdown output produces a formatted table"

[<Fact>]
let ``Verbose flag includes per-file detail in text output`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "Verbose flag includes per-file detail in text output"

[<Fact>]
let ``Quiet flag suppresses non-error output when there are no violations`` () =
    FeatureRunner.run
        "docs-validate-mermaid.feature"
        "Quiet flag suppresses non-error output when there are no violations"

[<Fact>]
let ``Plans directory is scanned by default`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "Plans directory is scanned by default"

[<Fact>]
let ``A multi-target edge with the & operator expands into separate edges`` () =
    FeatureRunner.run
        "docs-validate-mermaid.feature"
        "A multi-target edge with the & operator expands into separate edges"

[<Fact>]
let ``Multi-source and multi-target on both sides expand into a Cartesian product`` () =
    FeatureRunner.run
        "docs-validate-mermaid.feature"
        "Multi-source and multi-target on both sides expand into a Cartesian product"

[<Fact>]
let ``A 5-target fan-out triggers width violation under default threshold`` () =
    FeatureRunner.run
        "docs-validate-mermaid.feature"
        "A 5-target fan-out triggers width violation under default threshold"

[<Fact>]
let ``A subgraph with 7 child nodes emits subgraph density warning`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "A subgraph with 7 child nodes emits subgraph density warning"

[<Fact>]
let ``A subgraph with 6 children passes default threshold`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "A subgraph with 6 children passes default threshold"

[<Fact>]
let ``Subgraph density threshold is configurable`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "Subgraph density threshold is configurable"

[<Fact>]
let ``Existing diagrams without & or large subgraphs are unaffected`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "Existing diagrams without & or large subgraphs are unaffected"

[<Fact>]
let ``exclude flag skips the named subtree (mermaid)`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "exclude flag skips the named subtree"

[<Fact>]
let ``an empty exclude value does not silently empty the file set`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "an empty exclude value does not silently empty the file set"

[<Fact>]
let ``repo-wide default scan finds violation outside the legacy default directories`` () =
    FeatureRunner.run
        "docs-validate-mermaid.feature"
        "repo-wide default scan finds violation outside the legacy default directories"

[<Fact>]
let ``A pipe-labeled edge is parsed as an edge`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "A pipe-labeled edge is parsed as an edge"

[<Fact>]
let ``A cyclic flowchart ranks as its underlying chain`` () =
    FeatureRunner.run "docs-validate-mermaid.feature" "A cyclic flowchart ranks as its underlying chain"

[<Fact>]
let ``Every md validator passes on a repository with no markdown files`` () =
    FeatureRunner.run "md-audit.feature" "Every md validator passes on a repository with no markdown files"

[<Fact>]
let ``Clean directory passes the audit`` () =
    FeatureRunner.run "repo-governance-frontmatter-audit.feature" "Clean directory passes the audit"

[<Fact>]
let ``Body containing Last Updated footer block fails`` () =
    FeatureRunner.run "repo-governance-frontmatter-audit.feature" "Body containing Last Updated footer block fails"

[<Fact>]
let ``Body containing standalone Created annotation fails`` () =
    FeatureRunner.run "repo-governance-frontmatter-audit.feature" "Body containing standalone Created annotation fails"

[<Fact>]
let ``File under website app directory is exempt and passes`` () =
    FeatureRunner.run
        "repo-governance-frontmatter-audit.feature"
        "File under website app directory is exempt and passes"
