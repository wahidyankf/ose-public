/// Plain xunit tests for the branches of `RhinoCli.Application.Harness` that
/// `agents-bindings.feature`'s 10 scenarios never reach.
///
/// The scenarios exercise the happy paths and the two failure modes they
/// specify. Everything else in the module — the frontmatter parser's four
/// rejection arms, agent-name collision detection, group nesting, the
/// unreadable-catalog arm, and the `warning` check constructor — is reachable
/// only from inputs a well-formed repository never produces. Pinning them
/// directly keeps them pinned regardless of what the corpus contains, the
/// same corpus-independence rule the two Wave D formatter defects taught (see
/// `learnings.md`, 2026-08-28).
module RhinoCli.Tests.Integration.Steps.HarnessResourceTests

open System
open System.IO
open Xunit
open RhinoCli.Application.Harness

let private scratch () : string =
    let dir =
        Path.Combine(Path.GetTempPath(), "rhino-cli-harness-unit-" + Guid.NewGuid().ToString("N"))

    Directory.CreateDirectory dir |> ignore
    dir

let private writeFile (path: string) (content: string) : unit =
    Directory.CreateDirectory(Path.GetDirectoryName path) |> ignore
    File.WriteAllText(path, content)

// ---------------------------------------------------------------------------
// ValidationCheck / ValidationResult
// ---------------------------------------------------------------------------

[<Fact>]
let ``passed carries no expected-actual pair`` () =
    let check = ValidationCheck.passed "Name" "all good"
    Assert.Equal("passed", check.Status)
    Assert.Equal("", check.Expected)
    Assert.Equal("", check.Actual)
    Assert.Equal("all good", check.Message)

[<Fact>]
let ``warning carries the expected-actual pair`` () =
    let check = ValidationCheck.warning "Name" "want" "got" "advisory"
    Assert.Equal("warning", check.Status)
    Assert.Equal("want", check.Expected)
    Assert.Equal("got", check.Actual)

[<Fact>]
let ``failedMsg carries no expected-actual pair`` () =
    let check = ValidationCheck.failedMsg "Name" "io error"
    Assert.Equal("failed", check.Status)
    Assert.Equal("", check.Expected)
    Assert.Equal("", check.Actual)

[<Fact>]
let ``tally counts each status into its own bucket`` () =
    let result =
        ValidationResult.empty
        |> ValidationResult.tally (ValidationCheck.passed "a" "ok")
        |> ValidationResult.tally (ValidationCheck.warning "b" "w" "x" "advisory")
        |> ValidationResult.tally (ValidationCheck.failed "c" "w" "x" "bad")
        |> ValidationResult.tally (ValidationCheck.failedMsg "d" "io")

    Assert.Equal(4, result.TotalChecks)
    Assert.Equal(1, result.PassedChecks)
    Assert.Equal(1, result.WarningChecks)
    Assert.Equal(2, result.FailedChecks)

[<Fact>]
let ``tally preserves insertion order`` () =
    let result =
        ValidationResult.empty
        |> ValidationResult.tally (ValidationCheck.passed "first" "ok")
        |> ValidationResult.tally (ValidationCheck.passed "second" "ok")

    Assert.Equal<string list>([ "first"; "second" ], result.Checks |> List.map (fun c -> c.Name))

// ---------------------------------------------------------------------------
// Frontmatter
// ---------------------------------------------------------------------------

[<Fact>]
let ``normalizeYaml inserts the missing space after a colon`` () =
    Assert.Equal("name: value\ndescription: ok\n", normalizeYaml "name:value\ndescription: ok\n")

[<Fact>]
let ``normalizeYaml leaves list items alone`` () =
    // The key must start the line, so an indented `- Read` never matches.
    Assert.Equal("tools:\n  - Read\n  - Write\n", normalizeYaml "tools:\n  - Read\n  - Write\n")

[<Fact>]
let ``extractFrontmatter splits a well-formed file`` () =
    match extractFrontmatter "---\nname: foo\ndescription: bar\n---\nbody here\n" with
    | Ok(front, body) ->
        Assert.Equal("name: foo\ndescription: bar", front)
        Assert.Equal("body here\n", body)
    | Error e -> failwith e

[<Fact>]
let ``extractFrontmatter rejects a file too short to hold frontmatter`` () =
    Assert.Equal(Error "file too short to contain frontmatter", extractFrontmatter "---\n")

[<Fact>]
let ``extractFrontmatter rejects a missing opening marker`` () =
    Assert.Equal(Error "frontmatter does not start with ---", extractFrontmatter "name: foo\n---\nbody\n")

[<Fact>]
let ``extractFrontmatter rejects a missing closing marker`` () =
    Assert.Equal(Error "frontmatter closing --- not found", extractFrontmatter "---\nname: foo\nbody\nstuff\n")

[<Fact>]
let ``extractFrontmatter yields an empty body when the file ends at the closing marker`` () =
    match extractFrontmatter "---\nname: foo\n---" with
    | Ok(front, body) ->
        Assert.Equal("name: foo", front)
        Assert.Equal("", body)
    | Error e -> failwith e

// ---------------------------------------------------------------------------
// Agent source discovery
// ---------------------------------------------------------------------------

[<Fact>]
let ``isMirrorableAgentFilename accepts only a non-README markdown file`` () =
    Assert.True(isMirrorableAgentFilename "probe-maker.md" false)
    Assert.False(isMirrorableAgentFilename "probe-maker.md" true)
    Assert.False(isMirrorableAgentFilename "README.md" false)
    Assert.False(isMirrorableAgentFilename "notes.txt" false)

[<Fact>]
let ``readAgentName reads the frontmatter name rather than the filename`` () =
    let root = scratch ()
    let path = Path.Combine(root, "on-disk-filename.md")
    writeFile path "---\nname: frontmatter-name\ndescription: probe\n---\nbody\n"
    Assert.Equal(Ok "frontmatter-name", readAgentName path)

[<Fact>]
let ``readAgentName rejects a file with no name field`` () =
    let root = scratch ()
    let path = Path.Combine(root, "nameless.md")
    writeFile path "---\ndescription: probe\n---\nbody\n"

    match readAgentName path with
    | Ok name -> failwithf "expected a failure, got %s" name
    | Error message -> Assert.Contains("has no scalar 'name' frontmatter field", message)

[<Fact>]
let ``readAgentName rejects a non-mapping frontmatter block`` () =
    let root = scratch ()
    let path = Path.Combine(root, "sequence.md")
    writeFile path "---\n- one\n- two\n---\nbody\n"

    match readAgentName path with
    | Ok name -> failwithf "expected a failure, got %s" name
    | Error message -> Assert.Contains(path, message)

[<Fact>]
let ``readAgentName reports an unreadable file`` () =
    let root = scratch ()
    let path = Path.Combine(root, "absent.md")

    match readAgentName path with
    | Ok name -> failwithf "expected a failure, got %s" name
    | Error message -> Assert.Contains("failed to read file", message)

[<Fact>]
let ``readAgentName reports a malformed frontmatter block`` () =
    let root = scratch ()
    let path = Path.Combine(root, "no-marker.md")
    writeFile path "name: foo\ndescription: bar\nbody\n"

    match readAgentName path with
    | Ok name -> failwithf "expected a failure, got %s" name
    | Error message -> Assert.Contains("failed to extract frontmatter from", message)

[<Fact>]
let ``discoverAgentSources walks one level of group nesting and sorts by name`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, "zulu.md")) "---\nname: zulu\n---\nbody\n"
    writeFile (Path.Combine(root, "group", "alpha.md")) "---\nname: alpha\n---\nbody\n"
    // Neither of these is mirrorable, and the second level of nesting is
    // deliberately not walked.
    writeFile (Path.Combine(root, "README.md")) "# index\n"
    writeFile (Path.Combine(root, "group", "deeper", "hidden.md")) "---\nname: hidden\n---\nbody\n"

    match discoverAgentSources root with
    | Ok sources -> Assert.Equal<string list>([ "alpha"; "zulu" ], sources |> List.map snd)
    | Error e -> failwith e

[<Fact>]
let ``discoverAgentSources rejects two sources flattening to one mirror name`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, "first.md")) "---\nname: same\n---\nbody\n"
    writeFile (Path.Combine(root, "group", "second.md")) "---\nname: same\n---\nbody\n"

    match discoverAgentSources root with
    | Ok sources -> failwithf "expected a collision, got %A" (sources |> List.map snd)
    | Error message ->
        Assert.Contains("agent name collision: 'same'", message)
        Assert.Contains("flat mirror filenames must be unique", message)

[<Fact>]
let ``discoverAgentSources reports an unreadable directory`` () =
    let root = scratch ()

    match discoverAgentSources (Path.Combine(root, "absent")) with
    | Ok sources -> failwithf "expected a failure, got %A" sources
    | Error message -> Assert.Contains("failed to read", message)

[<Fact>]
let ``expectedBindingPaths is empty when there is no claude agents directory`` () =
    Assert.Equal(Ok([]: string list), expectedBindingPaths (scratch ()))

[<Fact>]
let ``expectedBindingPaths names one codex toml mirror per discovered agent`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, ".claude", "agents", "probe.md")) "---\nname: probe-maker\n---\nbody\n"
    Assert.Equal(Ok [ ".codex/agents/probe-maker.toml" ], expectedBindingPaths root)

[<Fact>]
let ``expectedBindingPaths propagates a discovery failure`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, ".claude", "agents", "nameless.md")) "---\ndescription: probe\n---\nbody\n"

    match expectedBindingPaths root with
    | Ok paths -> failwithf "expected a failure, got %A" paths
    | Error message -> Assert.Contains("has no scalar 'name' frontmatter field", message)

// ---------------------------------------------------------------------------
// Catalog coverage
// ---------------------------------------------------------------------------

[<Fact>]
let ``validateCatalogCoverage tolerates a leading slash in the directory name`` () =
    let root = scratch ()
    Directory.CreateDirectory(Path.Combine(root, ".github")) |> ignore
    writeFile (Path.Combine(root, platformBindingsCatalog)) "# Platform Bindings\n\n- `/.github` row\n"

    let check = validateCatalogCoverage root "/.github"
    Assert.Equal("passed", check.Status)
    Assert.Equal("Catalog Coverage: /.github", check.Name)

[<Fact>]
let ``validateCatalogCoverage reports an unreadable catalog`` () =
    let root = scratch ()
    Directory.CreateDirectory(Path.Combine(root, ".github")) |> ignore
    // The directory is present, so the catalog must be read — and it is absent.
    let check = validateCatalogCoverage root ".github"
    Assert.Equal("failed", check.Status)
    Assert.Contains("failed to read " + platformBindingsCatalog, check.Message)

[<Fact>]
let ``validateCatalogCoverage covers a present file, not only a directory`` () =
    let root = scratch ()
    // `.github` is listed as a directory in production, but the check accepts
    // any present path so a single-file binding surface would still be covered.
    writeFile (Path.Combine(root, ".github")) "placeholder\n"
    writeFile (Path.Combine(root, platformBindingsCatalog)) "# Platform Bindings\n\n- `.github` row\n"
    Assert.Equal("passed", (validateCatalogCoverage root ".github").Status)

// ---------------------------------------------------------------------------
// Codex agent files
// ---------------------------------------------------------------------------

[<Fact>]
let ``isRejectedCodexAgentFilename accepts only a toml file`` () =
    Assert.False(isRejectedCodexAgentFilename "probe-maker.toml")
    Assert.True(isRejectedCodexAgentFilename "probe-maker.md")
    Assert.True(isRejectedCodexAgentFilename "probe-maker")

[<Fact>]
let ``validateCodexAgentsDir passes when the directory is absent`` () =
    let check = validateCodexAgentsDir (scratch ())
    Assert.Equal("passed", check.Status)
    Assert.Contains("absent; nothing to check", check.Message)

[<Fact>]
let ``validateCodexAgentsDir passes on an empty directory`` () =
    let root = scratch ()
    Directory.CreateDirectory(Path.Combine(root, ".codex", "agents")) |> ignore
    Assert.Equal("passed", (validateCodexAgentsDir root).Status)

[<Fact>]
let ``validateCodexAgentsDir names every offender in sorted order`` () =
    let root = scratch ()
    let agents = Path.Combine(root, ".codex", "agents")
    writeFile (Path.Combine(agents, "zulu.md")) "# z\n"
    writeFile (Path.Combine(agents, "alpha.md")) "# a\n"
    writeFile (Path.Combine(agents, "keep.toml")) "description = \"keep\"\n"

    let check = validateCodexAgentsDir root
    Assert.Equal("failed", check.Status)
    Assert.Contains("non-.toml file(s): alpha.md, zulu.md", check.Actual)
    Assert.DoesNotContain("keep.toml", check.Actual)
    Assert.Contains("[agents.<name>] table in .codex/config.toml", check.Message)

// ---------------------------------------------------------------------------
// validateBindings composition
// ---------------------------------------------------------------------------

[<Fact>]
let ``validateBindings folds in the sync checks, catalog coverage, and both codex checks`` () =
    let result = validateBindings (scratch ())
    let names = result.Checks |> List.map (fun c -> c.Name)

    // An empty scratch repo has no agents, so the static per-binding-file
    // checks contribute nothing and every remaining family shows up once.
    // `Agent Equivalence` is the discovery-error check: a scratch repo has no
    // `.claude/agents`, so the walk reports once instead of per agent.
    let syncNames =
        [ "No Stale Agent Directory"
          "Agent Count"
          "Agent Equivalence"
          "No Synced Skill Mirror"
          "Skills Mirror: .agents/skills" ]

    for expected in syncNames do
        Assert.Contains(expected, names)

    for dir in knownBindingDirs do
        Assert.Contains(sprintf "Catalog Coverage: %s" dir, names)

    Assert.Contains(sprintf "Codex Agent Files: %s" codexAgentDir, names)
    Assert.Contains(sprintf "Codex Config Region: %s" codexConfigFile, names)

    // The orphan family fails closed rather than abstaining: a scratch repo
    // declares no `harness:` registry, so there is no list of generated agent
    // directories to walk and the check says so instead of reporting nothing.
    Assert.Contains("Mirror Orphans", names)
    Assert.Equal(List.length syncNames + List.length knownBindingDirs + 4, result.TotalChecks)

// ---------------------------------------------------------------------------
// `--harness` name acceptance
// ---------------------------------------------------------------------------

/// A registry holding exactly the names a test needs, so the assertions below
/// do not depend on this repository's live `harness:` list.
let private registryWith (names: string list) : RhinoCli.Application.RepoConfig.RepoConfig =
    { RhinoCli.Application.RepoConfig.empty with
        Harness =
            names
            |> List.map (fun name ->
                { RhinoCli.Application.RepoConfig.HarnessEntry.Name = name
                  Tier = RhinoCli.Application.RepoConfig.Tier.Generated
                  AgentDir = None
                  Mirrors = None
                  ForbidDir = None
                  SkillsDir = None
                  SkillsMirrors = None
                  Vendored = []
                  ModelMap = Map.empty
                  Catalog = None
                  Ownership = [] }) }

[<Fact>]
let ``acceptedHarnessNames is the registry order`` () =
    Assert.Equal<string list>(
        [ "claude-code"; "opencode"; "codex" ],
        acceptedHarnessNames (registryWith [ "claude-code"; "opencode"; "codex" ])
    )

[<Fact>]
let ``validateHarnessName accepts a declared name`` () =
    Assert.Equal(Ok(), validateHarnessName (registryWith [ "claude-code"; "codex" ]) "codex")

[<Fact>]
let ``validateHarnessName rejects an undeclared name and quotes the accepted set`` () =
    match validateHarnessName (registryWith [ "claude-code"; "codex" ]) "cursor" with
    | Ok() -> failwith "expected 'cursor' to be rejected"
    | Error message -> Assert.Equal("unknown harness name 'cursor'; expected one of 'claude-code', 'codex'", message)

[<Fact>]
let ``validateHarnessName rejects every name against an empty registry`` () =
    // A registry contraction to nothing rejects the previously-accepted name
    // automatically — the accepted set is never hard-coded.
    match validateHarnessName (registryWith []) "codex" with
    | Ok() -> failwith "expected 'codex' to be rejected"
    | Error message -> Assert.Equal("unknown harness name 'codex'; expected one of ", message)

// ---------------------------------------------------------------------------
// Duplication detection — helpers
// ---------------------------------------------------------------------------

let private proseLines (tag: string) (count: int) : string =
    String.Join("\n", [ for i in 1..count -> sprintf "%s line %d carries its own sentence." tag i ])
    + "\n"

let private agentAt (root: string) (name: string) (body: string) : string =
    let path = Path.Combine(root, ".claude", "agents", name + ".md")
    writeFile path (sprintf "---\nname: %s\n---\n%s" name body)
    path

let private skillAt (root: string) (name: string) (body: string) : string =
    let path = Path.Combine(root, ".claude", "skills", name, "SKILL.md")
    writeFile path (sprintf "---\nname: %s\n---\n%s" name body)
    path

[<Fact>]
let ``stripFrontmatterBody returns a file with no frontmatter unchanged`` () =
    // Unlike `extractFrontmatter`, which rejects such a file: a duplication
    // scan still has to read its body.
    Assert.Equal("# Title\n", stripFrontmatterBody "# Title\n")

[<Fact>]
let ``stripFrontmatterBody removes an LF frontmatter block`` () =
    Assert.Equal("Body\n", stripFrontmatterBody "---\nname: foo\n---\nBody\n")

[<Fact>]
let ``stripFrontmatterBody removes a CRLF frontmatter block`` () =
    Assert.Contains("Body", stripFrontmatterBody "---\r\nname: foo\r\n---\r\nBody\r\n")

[<Fact>]
let ``stripFrontmatterBody returns the input when the fence never closes`` () =
    let unclosed = "---\nname: foo\nstill frontmatter\n"
    Assert.Equal(unclosed, stripFrontmatterBody unclosed)

[<Fact>]
let ``stripFrontmatterBody yields an empty body when the file ends at the closing fence`` () =
    Assert.Equal("", stripFrontmatterBody "---\nname: foo\n---")

[<Fact>]
let ``normalizeLines trims trailing whitespace and collapses blank runs`` () =
    Assert.Equal<string list>([ "a"; "b"; "c" ], normalizeLines "a  \nb\t\nc")
    Assert.Equal<string list>([ "a"; ""; "b" ], normalizeLines "a\n\n\nb")

[<Fact>]
let ``isExcludedWindow skips blank-only and heading-only windows`` () =
    Assert.True(isExcludedWindow (List.replicate duplicationWindowSize ""))
    Assert.True(isExcludedWindow [ "# One"; ""; "## Two"; "" ])
    Assert.False(isExcludedWindow [ "# One"; "prose carries meaning" ])

// ---------------------------------------------------------------------------
// Duplication detection — scanning
// ---------------------------------------------------------------------------

[<Fact>]
let ``detectDuplication reports nothing for a repository with no agents`` () =
    Assert.Equal(Ok([]: DuplicationFinding list), detectDuplication (scratch ()))

[<Fact>]
let ``detectDuplication ignores a window repeated inside one file`` () =
    // Repetition within a single file is not cross-file duplication, so the
    // cluster never reaches two distinct files.
    let root = scratch ()
    let block = proseLines "shared" 12
    agentAt root "alpha-one" (block + block) |> ignore

    match detectDuplication root with
    | Ok findings -> Assert.Equal<DuplicationFinding list>([], findings)
    | Error e -> failwith e

[<Fact>]
let ``detectDuplication exempts two files in the same role family`` () =
    // `*-checker` agents are *designed* to share workflow boilerplate.
    let root = scratch ()
    let block = proseLines "shared" 12
    agentAt root "alpha-checker" (block + proseLines "alpha" 4) |> ignore
    agentAt root "beta-checker" (block + proseLines "beta" 4) |> ignore

    match detectDuplication root with
    | Ok findings -> Assert.Equal<DuplicationFinding list>([], findings)
    | Error e -> failwith e

[<Fact>]
let ``detectDuplication exempts the maker-checker-fixer trio of one domain`` () =
    let root = scratch ()
    let block = proseLines "shared" 12
    agentAt root "alpha-maker" (block + proseLines "one" 4) |> ignore
    agentAt root "alpha-checker" (block + proseLines "two" 4) |> ignore
    agentAt root "alpha-fixer" (block + proseLines "three" 4) |> ignore

    match detectDuplication root with
    | Ok findings -> Assert.Equal<DuplicationFinding list>([], findings)
    | Error e -> failwith e

[<Fact>]
let ``detectDuplication reports duplication spanning different roles and domains`` () =
    let root = scratch ()
    let block = proseLines "shared" 12
    let alpha = agentAt root "alpha-one" (block + proseLines "alpha" 4)
    let beta = agentAt root "beta-two" (block + proseLines "beta" 4)

    match detectDuplication root with
    | Error e -> failwith e
    | Ok findings ->
        Assert.NotEmpty findings

        for finding in findings do
            Assert.Equal<string list>([ alpha; beta ] |> List.sort, finding.Files |> List.sort)
            Assert.Equal(duplicationWindowSize, finding.WindowSize)
            Assert.Equal("high", finding.Severity)
            Assert.Contains("verbatim duplication across 2 files", finding.Message)

[<Fact>]
let ``detectDuplication reports an agent duplicating a skill body`` () =
    let root = scratch ()
    let block = proseLines "shared" 11
    let agent = agentAt root "alpha-one" (block + proseLines "alpha" 4)
    let skill = skillAt root "gamma-notes" (block + proseLines "gamma" 4)

    match detectDuplication root with
    | Error e -> failwith e
    | Ok findings ->
        Assert.NotEmpty findings
        let files = findings |> List.collect (fun f -> f.Files) |> List.distinct
        Assert.Contains(agent, files)
        Assert.Contains(skill, files)

[<Fact>]
let ``detectDuplication skips a file shorter than one window`` () =
    let root = scratch ()
    agentAt root "alpha-one" (proseLines "alpha" 3) |> ignore
    agentAt root "beta-two" (proseLines "alpha" 3) |> ignore

    match detectDuplication root with
    | Ok findings -> Assert.Equal<DuplicationFinding list>([], findings)
    | Error e -> failwith e

[<Fact>]
let ``detectDuplication orders findings by first file then first start line`` () =
    let root = scratch ()
    // Two independent shared blocks, seeded so the sort has something to do.
    let first = proseLines "first" 10
    let second = proseLines "second" 10
    agentAt root "alpha-one" (first + proseLines "pad" 3 + second) |> ignore
    agentAt root "beta-two" (first + proseLines "other" 3 + second) |> ignore

    match detectDuplication root with
    | Error e -> failwith e
    | Ok findings ->
        Assert.NotEmpty findings

        let keys = findings |> List.map (fun f -> List.head f.Files, List.head f.StartLines)

        Assert.Equal<(string * int) list>(List.sort keys, keys)

[<Fact>]
let ``detectDuplication reads the registry-declared source directory`` () =
    // The scan follows `harness:` rather than assuming `.claude/`, so a
    // registry that names another directory is honoured.
    let root = scratch ()
    let block = proseLines "shared" 12

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        "harness:\n  - { name: claude-code, tier: source, agent-dir: .custom/agents }\n"

    let write (name: string) (body: string) =
        let path = Path.Combine(root, ".custom", "agents", name + ".md")
        writeFile path (sprintf "---\nname: %s\n---\n%s" name body)
        path

    let alpha = write "alpha-one" (block + proseLines "alpha" 4)
    // Placed under `.claude/`, which the registry does NOT declare.
    agentAt root "beta-two" (block + proseLines "beta" 4) |> ignore

    match detectDuplication root with
    | Error e -> failwith e
    | Ok findings ->
        // Only one declared directory was scanned, so the pair never meets.
        Assert.Equal<DuplicationFinding list>([], findings)
        Assert.True(File.Exists alpha)

[<Fact>]
let ``detectDuplication skips README.md in an agent directory`` () =
    let root = scratch ()
    let block = proseLines "shared" 12
    writeFile (Path.Combine(root, ".claude", "agents", "README.md")) (sprintf "---\nname: readme\n---\n%s" block)
    agentAt root "alpha-one" (block + proseLines "alpha" 4) |> ignore

    match detectDuplication root with
    | Ok findings -> Assert.Equal<DuplicationFinding list>([], findings)
    | Error e -> failwith e

[<Fact>]
let ``detectDuplication ignores a skill directory with no SKILL.md`` () =
    let root = scratch ()

    Directory.CreateDirectory(Path.Combine(root, ".claude", "skills", "empty-skill"))
    |> ignore

    Assert.Equal(Ok([]: DuplicationFinding list), detectDuplication root)

// ---------------------------------------------------------------------------
// Skills mirror
// ---------------------------------------------------------------------------

let private mirrorConfig (extra: string) : string =
    "harness:\n"
    + "  - name: codex\n"
    + "    tier: generated\n"
    + "    skills-dir: .agents/skills\n"
    + "    skills-mirrors: .claude/skills\n"
    + extra

[<Fact>]
let ``mirrorResultEmpty is all zero`` () =
    Assert.Equal(0, mirrorResultEmpty.Copied)
    Assert.Equal(0, mirrorResultEmpty.Removed)
    Assert.Equal(0, mirrorResultEmpty.VendoredSkipped)

[<Fact>]
let ``emitSkillsMirrors is a no-op when no harness entry declares both skills-dir and skills-mirrors`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, "repo-config.yml")) "harness:\n  - { name: claude-code, tier: source }\n"

    Assert.Equal(Ok mirrorResultEmpty, emitSkillsMirrors root false)

[<Fact>]
let ``emitSkillsMirrors propagates a malformed registry as an error`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, "repo-config.yml")) "harness: [this is not a mapping list\n"

    match emitSkillsMirrors root false with
    | Ok _ -> failwith "expected the malformed registry to fail"
    | Error _ -> ()

[<Fact>]
let ``emitSkillsMirrors rejects a vendored entry with no matching ownership declaration`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, "repo-config.yml")) (mirrorConfig "    vendored: [.agents/skills/plugin]\n")
    writeFile (Path.Combine(root, ".claude", "skills", "alpha", "SKILL.md")) "body\n"

    match emitSkillsMirrors root false with
    | Ok _ -> failwith "expected the vendored/ownership disagreement to fail"
    | Error message -> Assert.Contains("no matching harness[0].ownership entry", message)

[<Fact>]
let ``emitSkillsMirrors under dryRun reports the pending copy without writing`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, "repo-config.yml")) (mirrorConfig "")
    writeFile (Path.Combine(root, ".claude", "skills", "alpha", "SKILL.md")) "body\n"

    match emitSkillsMirrors root true with
    | Error e -> failwith e
    | Ok result ->
        Assert.Equal(1, result.Copied)
        Assert.False(File.Exists(Path.Combine(root, ".agents", "skills", "alpha", "SKILL.md")))

[<Fact>]
let ``emitSkillsMirrors removes a stale mirrored file and prunes its now-empty directory`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, "repo-config.yml")) (mirrorConfig "")
    writeFile (Path.Combine(root, ".claude", "skills", "alpha", "SKILL.md")) "body\n"

    match emitSkillsMirrors root false with
    | Error e -> failwith e
    | Ok _ -> ()

    // The source skill is gone; its mirror is now an orphan.
    Directory.Delete(Path.Combine(root, ".claude", "skills", "alpha"), true)

    match emitSkillsMirrors root false with
    | Error e -> failwith e
    | Ok result ->
        Assert.Equal(1, result.Removed)
        Assert.False(File.Exists(Path.Combine(root, ".agents", "skills", "alpha", "SKILL.md")))
        Assert.False(Directory.Exists(Path.Combine(root, ".agents", "skills", "alpha")))

[<Fact>]
let ``auditSkillsMirrors does not flag a vendored directory with no source counterpart`` () =
    let root = scratch ()

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        (mirrorConfig
            "    vendored: [.agents/skills/plugin]\n    ownership:\n      - path: .agents/skills/plugin\n        class: vendored\n        reason: third-party payload\n")

    writeFile (Path.Combine(root, ".agents", "skills", "plugin", "SKILL.md")) "third-party\n"

    match auditSkillsMirrors root with
    | Error e -> failwith e
    | Ok drift -> Assert.Equal<MirrorDrift list>([], drift)

[<Fact>]
let ``emitSkillsMirrors treats a missing source directory as a no-op, not an error`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, "repo-config.yml")) (mirrorConfig "")

    Assert.Equal(Ok mirrorResultEmpty, emitSkillsMirrors root false)

[<Fact>]
let ``emitSkillsMirrors rejects a skills-dir that escapes the repository root`` () =
    let root = scratch ()

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: codex\n"
         + "    tier: generated\n"
         + "    skills-dir: ../outside\n"
         + "    skills-mirrors: .claude/skills\n")

    writeFile (Path.Combine(root, ".claude", "skills", "alpha", "SKILL.md")) "body\n"

    match emitSkillsMirrors root false with
    | Ok _ -> failwith "expected an out-of-repository skills-dir to fail"
    | Error message -> Assert.Contains("skills-dir", message)

// ---------------------------------------------------------------------------
// Agent sync — branches `agents-sync.feature`'s 8 scenarios never reach
// ---------------------------------------------------------------------------

let private writeAgent (root: string) (name: string) (frontmatterExtra: string) (body: string) : unit =
    writeFile
        (Path.Combine(root, ".claude", "agents", name + ".md"))
        (sprintf "---\nname: %s\ndescription: fixture\n%s---\n%s" name frontmatterExtra body)

[<Fact>]
let ``convertColor passes an unrecognized color through unchanged, and empty stays empty`` () =
    Assert.Equal("primary", convertColor "blue")
    Assert.Equal("mauve", convertColor "mauve")
    Assert.Equal("", convertColor "")

[<Fact>]
let ``convertPermission lower-cases, trims, and dedupes tool names`` () =
    let perm = convertPermission [ " Read "; "read"; "Write" ]
    Assert.Equal<Map<string, string>>(Map.ofList [ "read", "allow"; "write", "allow" ], perm)

[<Fact>]
let ``convertCodexModel resolves a claude alias through its grade`` () =
    let maps =
        { GradeOfAlias = Map.ofList [ "opus", "planning"; "sonnet", "execution" ]
          EffortOfGrade = Map.ofList [ "planning", "high"; "execution", "xhigh" ]
          ModelOfGrade = Map.ofList [ "planning", "vendor-planning"; "execution", "vendor-execution" ] }

    Assert.Equal("vendor-planning", convertCodexModel maps "opus")
    Assert.Equal("vendor-execution", convertCodexModel maps "sonnet")

[<Fact>]
let ``convertCodexModel yields no model when the harness declares no map`` () =
    // This is the OpenCode shape: a harness with no `model-map:` resolves every
    // grade to the empty string, and the encoder then writes no `model` key.
    let maps =
        { GradeOfAlias = Map.ofList [ "opus", "planning" ]
          EffortOfGrade = Map.ofList [ "planning", "high" ]
          ModelOfGrade = Map.empty }

    Assert.Equal("", convertCodexModel maps "opus")
    Assert.Equal("", convertCodexModel maps "inherit")

[<Fact>]
let ``parseClaudeTools accepts a YAML sequence as well as a comma-separated string`` () =
    Assert.Equal<string list>([ "Read"; "Write" ], parseClaudeTools (box "Read, Write"))
    Assert.Equal<string list>([], parseClaudeTools (box 42))

[<Fact>]
let ``convertAllAgents translates maxTurns into a steps field`` () =
    let root = scratch ()
    writeAgent root "steps-agent" "maxTurns: 7\n" "Body.\n"

    match convertAllAgents root false with
    | Error e -> failwith e
    | Ok result ->
        Assert.Equal(1, result.Converted)

        let mirror =
            File.ReadAllText(Path.Combine(root, ".opencode", "agents", "steps-agent.md"))

        Assert.Contains("steps: 7", mirror)

[<Fact>]
let ``convertAllAgents preserves a skills list into the mirror`` () =
    let root = scratch ()
    writeAgent root "skills-agent" "skills:\n  - alpha-skill\n  - beta-skill\n" "Body.\n"

    match convertAllAgents root false with
    | Error e -> failwith e
    | Ok _ ->
        let mirror =
            File.ReadAllText(Path.Combine(root, ".opencode", "agents", "skills-agent.md"))

        Assert.Contains("skills:\n  - alpha-skill\n  - beta-skill", mirror)

[<Fact>]
let ``convertAllAgents warns on an unknown field and on a DropWarn field with its own reason`` () =
    let root = scratch ()
    writeAgent root "warn-agent" "customField: value\nmcpServers: foo\n" "Body.\n"

    match convertAllAgents root false with
    | Error e -> failwith e
    | Ok result ->
        Assert.Contains(result.Warnings, fun w -> w.Field = "customField" && w.Reason = unknownFieldReason)

        Assert.Contains(
            result.Warnings,
            fun w ->
                w.Field = "mcpServers"
                && w.Reason = "OpenCode declares MCP servers at the config level"
        )

[<Fact>]
let ``convertAllAgents rebases a relative link and passes an absolute, URL, or anchor link through unchanged`` () =
    let root = scratch ()

    writeAgent
        root
        "link-agent"
        ""
        "See [other](./other-agent.md), [site](https://example.com), [here](#section), and [empty]().\n"

    writeAgent root "other-agent" "" "Body.\n"

    match convertAllAgents root false with
    | Error e -> failwith e
    | Ok _ ->
        let mirror =
            File.ReadAllText(Path.Combine(root, ".opencode", "agents", "link-agent.md"))

        Assert.Contains("[other](other-agent.md)", mirror)
        Assert.Contains("[site](https://example.com)", mirror)
        Assert.Contains("[here](#section)", mirror)
        Assert.Contains("[empty]()", mirror)

[<Fact>]
let ``validateSync fails a claude source with no frontmatter as a discovery error, not a per-agent check`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, ".claude", "agents", "broken.md")) "no frontmatter here\n"
    Directory.CreateDirectory(Path.Combine(root, ".opencode", "agents")) |> ignore

    let result = validateSync root

    Assert.Contains(
        result.Checks,
        fun c ->
            c.Name = "Agent Equivalence"
            && c.Status = "failed"
            && c.Message.Contains("Failed to read Claude agents directory")
    )

[<Fact>]
let ``validateSync reports a missing OpenCode mirror by name`` () =
    let root = scratch ()
    writeAgent root "orphan-agent" "" "Body.\n"
    writeFile (Path.Combine(root, ".opencode", "agents", "placeholder.md")) "---\ndescription: x\n---\nx\n"

    let result = validateSync root

    Assert.Contains(
        result.Checks,
        fun c ->
            c.Name = "Agent: orphan-agent"
            && c.Status = "failed"
            && c.Message.Contains("OpenCode mirror not found")
    )

[<Fact>]
let ``validateSync fails when the OpenCode mirror's own frontmatter cannot be parsed`` () =
    let root = scratch ()
    writeAgent root "bad-mirror-agent" "" "Body.\n"
    writeFile (Path.Combine(root, ".opencode", "agents", "bad-mirror-agent.md")) "no frontmatter here\n"

    let result = validateSync root

    Assert.Contains(
        result.Checks,
        fun c ->
            c.Name = "Agent: bad-mirror-agent"
            && c.Status = "failed"
            && c.Message.Contains("failed to parse OpenCode frontmatter")
    )

[<Fact>]
let ``validateSync fails a skills-list mismatch and a body mismatch`` () =
    let root = scratch ()
    writeAgent root "skills-mismatch-agent" "model: sonnet\nskills:\n  - alpha\n" "Body.\n"

    match convertAllAgents root false with
    | Error e -> failwith e
    | Ok _ -> ()

    let mirrorPath =
        Path.Combine(root, ".opencode", "agents", "skills-mismatch-agent.md")

    File.WriteAllText(mirrorPath, File.ReadAllText(mirrorPath).Replace("- alpha", "- beta"))

    let result = validateSync root

    Assert.Contains(result.Checks, fun c -> c.Name = "Agent: skills-mismatch-agent" && c.Message = "skills mismatch")

    writeAgent root "body-mismatch-agent" "model: sonnet\n" "Original body.\n"

    match convertAllAgents root false with
    | Error e -> failwith e
    | Ok _ -> ()

    let bodyMirrorPath =
        Path.Combine(root, ".opencode", "agents", "body-mismatch-agent.md")

    File.WriteAllText(bodyMirrorPath, File.ReadAllText(bodyMirrorPath).Replace("Original body.", "Edited body."))

    let bodyResult = validateSync root

    Assert.Contains(
        bodyResult.Checks,
        fun c ->
            c.Name = "Agent: body-mismatch-agent"
            && c.Message.Contains(".opencode/agents/body-mismatch-agent.md drifted from generated content")
            && c.Message.Contains("harness sync promote --from .opencode/agents/body-mismatch-agent.md")
    )

[<Fact>]
let ``syncAll with SkillsOnly is a no-op that still reports success`` () =
    let root = scratch ()
    writeAgent root "unsynced-agent" "" "Body.\n"

    let opts =
        { syncOptionsDefault root with
            SkillsOnly = true }

    match syncAll opts with
    | Error e -> failwith e
    | Ok result ->
        Assert.Equal(syncResultEmpty, result)
        Assert.False(File.Exists(Path.Combine(root, ".opencode", "agents", "unsynced-agent.md")))

// ---------------------------------------------------------------------------
// Claude Code agent/skill validation — branches
// agents-validate-claude.feature's 5 scenarios never reach
// ---------------------------------------------------------------------------

/// The grade vocabulary the validator reads from `repo-config.yml` at runtime.
/// A fixture repository without it makes the validator fail closed, so every
/// `validateClaude` scratch root carries a registry just as a real one does.
let private gradeRegistryYaml =
    String.Join(
        "\n",
        [ "model-grades:"
          "  ultra: { effort: high }"
          "  planning: { effort: high }"
          "  execution: { effort: xhigh }"
          "  fast: { effort: xhigh }"
          "harness:"
          "  - name: claude-code"
          "    tier: source"
          "    agent-dir: .claude/agents"
          "    model-map: { ultra: fable, planning: opus, execution: sonnet, fast: haiku }"
          "" ]
    )

let private claudeScratch () : string =
    let root = scratch ()
    writeFile (Path.Combine(root, "repo-config.yml")) gradeRegistryYaml
    root


let private fullOpts (root: string) : ValidateClaudeOptions =
    { RepoRoot = root
      AgentsOnly = false
      SkillsOnly = false }

let private failedCheck (result: ValidationResult) (namePart: string) : ValidationCheck option =
    result.Checks
    |> List.tryFind (fun c -> c.Status = "failed" && c.Name.Contains(namePart, StringComparison.Ordinal))

let private passedCheck (result: ValidationResult) (namePart: string) : ValidationCheck option =
    result.Checks
    |> List.tryFind (fun c -> c.Status = "passed" && c.Name.Contains(namePart, StringComparison.Ordinal))

[<Fact>]
let ``validateClaude fails an agent with an unrecognized tool`` () =
    let root = claudeScratch ()

    writeFile
        (Path.Combine(root, ".claude", "agents", "bad-tool-agent.md"))
        "---\nname: bad-tool-agent\ndescription: fixture\ntools: Nonsense\nmodel: sonnet\ncolor: blue\n---\nBody.\n"

    let result = validateClaude (fullOpts root)
    Assert.True((failedCheck result "Valid Tools").IsSome)

[<Fact>]
let ``validateClaude accepts a call-form tool entry`` () =
    let root = claudeScratch ()

    writeFile
        (Path.Combine(root, ".claude", "agents", "call-form-agent.md"))
        "---\nname: call-form-agent\ndescription: fixture\ntools: Agent(swe-typescript-dev)\nmodel: sonnet\ncolor: blue\n---\nBody.\n"

    let result = validateClaude (fullOpts root)
    Assert.True((passedCheck result "Valid Tools").IsSome)

[<Fact>]
let ``validateClaude fails an agent with an invalid model`` () =
    let root = claudeScratch ()

    writeFile
        (Path.Combine(root, ".claude", "agents", "bad-model-agent.md"))
        "---\nname: bad-model-agent\ndescription: fixture\ntools: Read\nmodel: gpt-4\ncolor: blue\n---\nBody.\n"

    let result = validateClaude (fullOpts root)
    Assert.True((failedCheck result "Valid Model").IsSome)

[<Fact>]
let ``validateClaude accepts the ultra-tier fable alias`` () =
    let root = claudeScratch ()

    writeFile
        (Path.Combine(root, ".claude", "agents", "ultra-model-agent.md"))
        "---\nname: ultra-model-agent\ndescription: fixture\ntools: Read\nmodel: fable\ncolor: blue\n---\nBody.\n"

    let result = validateClaude (fullOpts root)
    Assert.True((passedCheck result "Valid Model").IsSome)

[<Fact>]
let ``validateClaude accepts a full claude-* model id`` () =
    let root = claudeScratch ()

    writeFile
        (Path.Combine(root, ".claude", "agents", "full-model-agent.md"))
        "---\nname: full-model-agent\ndescription: fixture\ntools: Read\nmodel: claude-opus-4-7\ncolor: blue\n---\nBody.\n"

    let result = validateClaude (fullOpts root)
    Assert.True((passedCheck result "Valid Model").IsSome)

[<Fact>]
let ``validateClaude fails an agent with an invalid color`` () =
    let root = claudeScratch ()

    writeFile
        (Path.Combine(root, ".claude", "agents", "bad-color-agent.md"))
        "---\nname: bad-color-agent\ndescription: fixture\ntools: Read\nmodel: sonnet\ncolor: magenta\n---\nBody.\n"

    let result = validateClaude (fullOpts root)
    Assert.True((failedCheck result "Valid Color").IsSome)

[<Fact>]
let ``validateClaude skips the color check when color is absent`` () =
    let root = claudeScratch ()

    writeFile
        (Path.Combine(root, ".claude", "agents", "no-color-agent.md"))
        "---\nname: no-color-agent\ndescription: fixture\ntools: Read\nmodel: sonnet\n---\nBody.\n"

    let result = validateClaude (fullOpts root)
    Assert.False(result.Checks |> List.exists (fun c -> c.Name.Contains("Valid Color")))

[<Fact>]
let ``validateClaude fails an agent referencing a missing skill`` () =
    let root = claudeScratch ()

    writeFile
        (Path.Combine(root, ".claude", "agents", "missing-skill-agent.md"))
        "---\nname: missing-skill-agent\ndescription: fixture\ntools: Read\nmodel: sonnet\ncolor: blue\nskills:\n  - ghost-skill\n---\nBody.\n"

    let result = validateClaude (fullOpts root)
    Assert.True((failedCheck result "Skills Exist").IsSome)

[<Fact>]
let ``validateClaude fails an agent whose frontmatter contains a comment`` () =
    let root = claudeScratch ()

    writeFile
        (Path.Combine(root, ".claude", "agents", "commented-agent.md"))
        "---\nname: commented-agent\ndescription: fixture\n# a comment\ntools: Read\nmodel: sonnet\ncolor: blue\n---\nBody.\n"

    let result = validateClaude (fullOpts root)
    Assert.True((failedCheck result "No Comments").IsSome)

[<Fact>]
let ``validateClaude warns on an unknown agent frontmatter field and a required-after-optional order`` () =
    let root = claudeScratch ()

    writeFile
        (Path.Combine(root, ".claude", "agents", "field-order-agent.md"))
        "---\ntools: Read\nname: field-order-agent\ndescription: fixture\nbogus: yes\nmodel: sonnet\ncolor: blue\n---\nBody.\n"

    let result = validateClaude (fullOpts root)
    Assert.True((failedCheck result "Field Order").IsSome)

    Assert.True(
        result.Checks
        |> List.exists (fun c -> c.Status = "warning" && c.Name.Contains("Unknown Field: bogus"))
    )

[<Fact>]
let ``validateClaude requires Write and Bash tools for agents under generated-reports/`` () =
    let baseDir = scratch ()
    let root = Path.Combine(baseDir, "generated-reports", "case")
    Directory.CreateDirectory root |> ignore

    writeFile
        (Path.Combine(root, ".claude", "agents", "gr-agent.md"))
        "---\nname: gr-agent\ndescription: fixture\ntools: Read\nmodel: sonnet\ncolor: blue\n---\nBody.\n"

    let result = validateClaude (fullOpts root)
    Assert.True((failedCheck result "Generated Reports Tools").IsSome)

[<Fact>]
let ``validateClaude passes generated-reports/ agents that declare Write and Bash`` () =
    let baseDir = scratch ()
    let root = Path.Combine(baseDir, "generated-reports", "case")
    Directory.CreateDirectory root |> ignore

    writeFile
        (Path.Combine(root, ".claude", "agents", "gr-ok-agent.md"))
        "---\nname: gr-ok-agent\ndescription: fixture\ntools: Read, Write, Bash\nmodel: sonnet\ncolor: blue\n---\nBody.\n"

    let result = validateClaude (fullOpts root)
    Assert.True((passedCheck result "Generated Reports Tools").IsSome)

[<Fact>]
let ``validateClaude fails an agent with malformed YAML colon spacing`` () =
    let root = claudeScratch ()

    writeFile
        (Path.Combine(root, ".claude", "agents", "bad-format-agent.md"))
        "---\nname:bad-format-agent\ndescription: fixture\n---\nBody.\n"

    let result = validateClaude (fullOpts root)
    Assert.True((failedCheck result "YAML Formatting").IsSome)

[<Fact>]
let ``validateClaude fails an agent whose file is too short to contain frontmatter`` () =
    let root = claudeScratch ()
    writeFile (Path.Combine(root, ".claude", "agents", "too-short-agent.md")) "no frontmatter"

    let result = validateClaude (fullOpts root)
    Assert.True((failedCheck result "YAML Syntax").IsSome)

[<Fact>]
let ``validateClaude fails an agent with malformed YAML inside its frontmatter`` () =
    let root = claudeScratch ()
    writeFile (Path.Combine(root, ".claude", "agents", "bad-yaml-agent.md")) "---\nname: [unbalanced\n---\nBody.\n"

    let result = validateClaude (fullOpts root)
    Assert.True((failedCheck result "YAML Parse").IsSome)

[<Fact>]
let ``validateClaude fails an agent with completely empty frontmatter`` () =
    let root = claudeScratch ()
    writeFile (Path.Combine(root, ".claude", "agents", "empty-frontmatter-agent.md")) "---\n\n---\nBody.\n"

    let result = validateClaude (fullOpts root)

    match failedCheck result "Required Fields" with
    | Some c ->
        Assert.Contains("name", c.Actual)
        Assert.Contains("description", c.Actual)
        Assert.Contains("tools", c.Actual)
    | None -> failwith "expected a Required Fields failure"

[<Fact>]
let ``validateClaude fails a skill directory with no SKILL.md`` () =
    let root = claudeScratch ()

    Directory.CreateDirectory(Path.Combine(root, ".claude", "skills", "no-file-skill"))
    |> ignore

    let result = validateClaude (fullOpts root)
    Assert.True((failedCheck result "SKILL.md Exists").IsSome)

[<Fact>]
let ``validateClaude fails a skill with malformed YAML colon spacing`` () =
    let root = claudeScratch ()

    writeFile
        (Path.Combine(root, ".claude", "skills", "bad-format-skill", "SKILL.md"))
        "---\nname:bad-format-skill\ndescription: fixture\n---\nBody.\n"

    let result = validateClaude (fullOpts root)
    Assert.True((failedCheck result "YAML Formatting").IsSome)

[<Fact>]
let ``validateClaude fails a skill whose file is too short to contain frontmatter`` () =
    let root = claudeScratch ()
    writeFile (Path.Combine(root, ".claude", "skills", "too-short-skill", "SKILL.md")) "x"

    let result = validateClaude (fullOpts root)
    Assert.True((failedCheck result "YAML Syntax").IsSome)

[<Fact>]
let ``validateClaude fails a skill with malformed YAML inside its frontmatter`` () =
    let root = claudeScratch ()

    writeFile
        (Path.Combine(root, ".claude", "skills", "bad-yaml-skill", "SKILL.md"))
        "---\nname: [unbalanced\n---\nBody.\n"

    let result = validateClaude (fullOpts root)
    Assert.True((failedCheck result "YAML Parse").IsSome)

[<Fact>]
let ``validateClaude fails a skill missing its description field`` () =
    let root = claudeScratch ()

    writeFile
        (Path.Combine(root, ".claude", "skills", "no-desc-skill", "SKILL.md"))
        "---\nname: no-desc-skill\n---\nBody.\n"

    let result = validateClaude (fullOpts root)
    Assert.True((failedCheck result "Description Field Required").IsSome)

[<Fact>]
let ``validateClaude fails a skill missing its name field`` () =
    let root = claudeScratch ()

    writeFile
        (Path.Combine(root, ".claude", "skills", "no-name-skill", "SKILL.md"))
        "---\ndescription: fixture\n---\nBody.\n"

    let result = validateClaude (fullOpts root)
    Assert.True((failedCheck result "Name Field Required").IsSome)

[<Fact>]
let ``validateClaude fails a skill with an invalid name format`` () =
    let root = claudeScratch ()

    writeFile
        (Path.Combine(root, ".claude", "skills", "Bad_Name", "SKILL.md"))
        "---\nname: Bad_Name\ndescription: fixture\n---\nBody.\n"

    let result = validateClaude (fullOpts root)
    Assert.True((failedCheck result "Name Format").IsSome)

[<Fact>]
let ``validateClaude fails a skill whose name field does not match its directory`` () =
    let root = claudeScratch ()

    writeFile
        (Path.Combine(root, ".claude", "skills", "dir-name-skill", "SKILL.md"))
        "---\nname: other-name\ndescription: fixture\n---\nBody.\n"

    let result = validateClaude (fullOpts root)
    Assert.True((failedCheck result "Name Match").IsSome)

[<Fact>]
let ``validateClaude warns on an unknown skill frontmatter field`` () =
    let root = claudeScratch ()

    writeFile
        (Path.Combine(root, ".claude", "skills", "unknown-field-skill", "SKILL.md"))
        "---\nname: unknown-field-skill\ndescription: fixture\nbogus: yes\n---\nBody.\n"

    let result = validateClaude (fullOpts root)

    Assert.True(
        result.Checks
        |> List.exists (fun c -> c.Status = "warning" && c.Name.Contains("Unknown Field: bogus"))
    )

[<Fact>]
let ``validateClaude fails with a directory-not-found check when \.claude/agents is missing`` () =
    let root = claudeScratch ()
    Directory.CreateDirectory(Path.Combine(root, ".claude", "skills")) |> ignore

    let result = validateClaude (fullOpts root)
    Assert.True((failedCheck result "Read Agents Directory").IsSome)

[<Fact>]
let ``validateClaude fails with a directory-not-found check when \.claude/skills is missing`` () =
    let root = claudeScratch ()
    Directory.CreateDirectory(Path.Combine(root, ".claude", "agents")) |> ignore

    let result = validateClaude (fullOpts root)
    Assert.True((failedCheck result "Read Skills Directory").IsSome)

[<Fact>]
let ``validateYamlFormattingRaw reports every misformatted line`` () =
    let content = "---\nname:foo\ndescription: bar\n---\nBody.\n"
    let check = validateYamlFormattingRaw "X" content
    Assert.Equal("failed", check.Status)
    Assert.Contains("missing space after colon", check.Message)

// ---------------------------------------------------------------------------
// readAgentName / discoverAgentSources / stripDir / canonicalForEntry /
// driftRemediation — coverage-gap edge cases
// ---------------------------------------------------------------------------

[<Fact>]
let ``discoverAgentSources fails when an agent's frontmatter is empty (deserializes to no mapping)`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, ".claude", "agents", "empty-front.md")) "---\n---\nBody.\n"

    match discoverAgentSources (Path.Combine(root, ".claude", "agents")) with
    | Ok _ -> Assert.True(false, "expected a mapping error")
    | Error e -> Assert.Contains("frontmatter is not a mapping", e)

[<Fact>]
let ``discoverAgentSources silently skips a group directory it cannot read`` () =
    let root = scratch ()
    let claudeDir = Path.Combine(root, ".claude", "agents")
    writeFile (Path.Combine(claudeDir, "solo.md")) "---\nname: solo\ndescription: fixture\n---\nBody.\n"
    let groupDir = Path.Combine(claudeDir, "locked-group")
    Directory.CreateDirectory groupDir |> ignore

    try
        File.SetUnixFileMode(groupDir, UnixFileMode.None)

        match discoverAgentSources claudeDir with
        | Error e -> failwith e
        | Ok sources -> Assert.Equal<(string * string) list>([ (Path.Combine(claudeDir, "solo.md"), "solo") ], sources)
    finally
        File.SetUnixFileMode(groupDir, UnixFileMode.UserRead ||| UnixFileMode.UserWrite ||| UnixFileMode.UserExecute)

[<Fact>]
let ``resolveCanonical returns None for a path no harness entry's directories claim`` () =
    let root = scratch ()
    let config = registryWith [ "opencode" ]
    Assert.True((resolveCanonical root config "totally/unrelated/path.md").IsNone)

[<Fact>]
let ``resolveCanonical returns None when the declared source directory itself cannot be discovered`` () =
    let root = scratch ()

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: opencode\n"
         + "    tier: generated\n"
         + "    agent-dir: .opencode/agents\n"
         + "    mirrors: .claude/agents-missing\n")

    match RhinoCli.Application.RepoConfig.load root with
    | Error e -> failwith e
    | Ok config -> Assert.True((resolveCanonical root config ".opencode/agents/x.md").IsNone)

[<Fact>]
let ``driftRemediation names the resolved canonical source in backticks`` () =
    let root = scratch ()

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: opencode\n"
         + "    tier: generated\n"
         + "    agent-dir: .opencode/agents\n"
         + "    mirrors: .claude/agents\n")

    writeFile
        (Path.Combine(root, ".claude", "agents", "promo-agent.md"))
        "---\nname: promo-agent\ndescription: fixture\n---\nBody.\n"

    let message = driftRemediation root ".opencode/agents/promo-agent.md"
    Assert.Contains("`.claude/agents/promo-agent.md`", message)

[<Fact>]
let ``validateCodexAgentsDir fails with a read error when the directory is unreadable`` () =
    let root = scratch ()
    let dir = Path.Combine(root, ".codex", "agents")
    Directory.CreateDirectory dir |> ignore

    try
        File.SetUnixFileMode(dir, UnixFileMode.None)
        let check = validateCodexAgentsDir root
        Assert.Equal("failed", check.Status)
        Assert.Contains("failed to read", check.Message)
    finally
        File.SetUnixFileMode(dir, UnixFileMode.UserRead ||| UnixFileMode.UserWrite ||| UnixFileMode.UserExecute)

// ---------------------------------------------------------------------------
// stripFrontmatterBody / detectDuplication — coverage-gap edge cases
// ---------------------------------------------------------------------------

[<Fact>]
let ``detectDuplication fails when the default agents directory cannot be read`` () =
    let root = scratch ()
    let agentsPath = Path.Combine(root, ".claude", "agents")
    Directory.CreateDirectory agentsPath |> ignore

    try
        File.SetUnixFileMode(agentsPath, UnixFileMode.None)

        match detectDuplication root with
        | Ok _ -> Assert.True(false, "expected a read failure")
        | Error e -> Assert.Contains("read", e)
    finally
        File.SetUnixFileMode(agentsPath, UnixFileMode.UserRead ||| UnixFileMode.UserWrite ||| UnixFileMode.UserExecute)

[<Fact>]
let ``detectDuplication reports the first read failure when multiple registered agent directories are unreadable`` () =
    let root = scratch ()

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: a\n"
         + "    tier: source\n"
         + "    agent-dir: .claude/agentsA\n"
         + "  - name: b\n"
         + "    tier: source\n"
         + "    agent-dir: .claude/agentsB\n")

    let dirA = Path.Combine(root, ".claude", "agentsA")
    let dirB = Path.Combine(root, ".claude", "agentsB")
    Directory.CreateDirectory dirA |> ignore
    Directory.CreateDirectory dirB |> ignore

    try
        File.SetUnixFileMode(dirA, UnixFileMode.None)
        File.SetUnixFileMode(dirB, UnixFileMode.None)

        match detectDuplication root with
        | Ok _ -> Assert.True(false, "expected a read failure")
        | Error e -> Assert.Contains("read", e)
    finally
        File.SetUnixFileMode(dirA, UnixFileMode.UserRead ||| UnixFileMode.UserWrite ||| UnixFileMode.UserExecute)
        File.SetUnixFileMode(dirB, UnixFileMode.UserRead ||| UnixFileMode.UserWrite ||| UnixFileMode.UserExecute)

[<Fact>]
let ``detectDuplication fails when a registered skills directory cannot be read`` () =
    let root = scratch ()

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: a\n"
         + "    tier: source\n"
         + "    skills-dir: .claude/skillsX\n")

    let skillsPath = Path.Combine(root, ".claude", "skillsX")
    Directory.CreateDirectory skillsPath |> ignore

    try
        File.SetUnixFileMode(skillsPath, UnixFileMode.None)

        match detectDuplication root with
        | Ok _ -> Assert.True(false, "expected a read failure")
        | Error e -> Assert.Contains("read", e)
    finally
        File.SetUnixFileMode(skillsPath, UnixFileMode.UserRead ||| UnixFileMode.UserWrite ||| UnixFileMode.UserExecute)

[<Fact>]
let ``detectDuplication succeeds and returns no findings for a small clean fixture`` () =
    let root = scratch ()

    writeFile (Path.Combine(root, ".claude", "agents", "solo.md")) "---\nname: solo\ndescription: fixture\n---\nBody.\n"

    match detectDuplication root with
    | Error e -> failwith e
    | Ok findings -> Assert.Empty(findings)

[<Fact>]
let ``detectDuplication fails when an individual agent file cannot be read`` () =
    let root = scratch ()
    let lockedPath = Path.Combine(root, ".claude", "agents", "aaa-locked.md")
    writeFile lockedPath "---\nname: aaa-locked\ndescription: fixture\n---\nBody.\n"

    writeFile
        (Path.Combine(root, ".claude", "agents", "zzz-ok.md"))
        "---\nname: zzz-ok\ndescription: fixture\n---\nBody.\n"

    try
        File.SetUnixFileMode(lockedPath, UnixFileMode.None)

        match detectDuplication root with
        | Ok _ -> Assert.True(false, "expected a read failure")
        | Error e -> Assert.Contains("read", e)
    finally
        File.SetUnixFileMode(lockedPath, UnixFileMode.UserRead ||| UnixFileMode.UserWrite)

// ---------------------------------------------------------------------------
// mirrorJobs / jobDiff / auditSkillsMirrors / emitSkillsMirrors / pruneEmptyDirs
// — registry-validation and filesystem-failure coverage gaps
// ---------------------------------------------------------------------------

[<Fact>]
let ``auditSkillsMirrors fails when a skills-mirrors source path escapes the repository`` () =
    let root = scratch ()

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: a\n"
         + "    tier: generated\n"
         + "    skills-dir: .a-mirror/skills\n"
         + "    skills-mirrors: ../outside\n")

    match auditSkillsMirrors root with
    | Ok _ -> Assert.True(false, "expected an escaping-path error")
    | Error e -> Assert.Contains("harness a skills-mirrors", e)

[<Fact>]
let ``auditSkillsMirrors fails when a vendored declaration is malformed`` () =
    let root = scratch ()
    Directory.CreateDirectory(Path.Combine(root, ".claude", "skillsSrc")) |> ignore

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: b\n"
         + "    tier: generated\n"
         + "    skills-dir: .b-mirror/skills\n"
         + "    skills-mirrors: .claude/skillsSrc\n"
         + "    vendored:\n"
         + "      - /abs/escape\n"
         + "    ownership:\n"
         + "      - path: /abs/escape\n"
         + "        class: vendored\n"
         + "        reason: test\n")

    match auditSkillsMirrors root with
    | Ok _ -> Assert.True(false, "expected a malformed-vendored error")
    | Error e -> Assert.Contains("harness b vendored /abs/escape", e)

[<Fact>]
let ``auditSkillsMirrors propagates the first entry's registry error past a later valid entry`` () =
    let root = scratch ()
    Directory.CreateDirectory(Path.Combine(root, ".claude", "skillsSrc")) |> ignore
    Directory.CreateDirectory(Path.Combine(root, ".claude", "skillsSrc2")) |> ignore

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: b\n"
         + "    tier: generated\n"
         + "    skills-dir: .b-mirror/skills\n"
         + "    skills-mirrors: .claude/skillsSrc\n"
         + "    vendored:\n"
         + "      - /abs/escape\n"
         + "    ownership:\n"
         + "      - path: /abs/escape\n"
         + "        class: vendored\n"
         + "        reason: test\n"
         + "  - name: c\n"
         + "    tier: generated\n"
         + "    skills-dir: .c-mirror/skills\n"
         + "    skills-mirrors: .claude/skillsSrc2\n")

    match auditSkillsMirrors root with
    | Ok _ -> Assert.True(false, "expected the first entry's registry error")
    | Error e -> Assert.Contains("harness b vendored /abs/escape", e)

[<Fact>]
let ``auditSkillsMirrors fails when a source file cannot be read`` () =
    let root = scratch ()
    let lockedPath = Path.Combine(root, ".claude", "skillsSrcD", "locked.md")
    writeFile lockedPath "content"

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: d\n"
         + "    tier: generated\n"
         + "    skills-dir: .d-mirror/skills\n"
         + "    skills-mirrors: .claude/skillsSrcD\n")

    try
        File.SetUnixFileMode(lockedPath, UnixFileMode.None)

        match auditSkillsMirrors root with
        | Ok _ -> Assert.True(false, "expected a read failure")
        | Error e -> Assert.Contains("failed to read", e)
    finally
        File.SetUnixFileMode(lockedPath, UnixFileMode.UserRead ||| UnixFileMode.UserWrite)

[<Fact>]
let ``auditSkillsMirrors propagates a failing job's error past a later valid job`` () =
    let root = scratch ()
    let lockedPath = Path.Combine(root, ".claude", "skillsSrcD2", "locked.md")
    writeFile lockedPath "content"
    writeFile (Path.Combine(root, ".claude", "skillsSrcE2", "ok.md")) "content"

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: d2\n"
         + "    tier: generated\n"
         + "    skills-dir: .d2-mirror/skills\n"
         + "    skills-mirrors: .claude/skillsSrcD2\n"
         + "  - name: e2\n"
         + "    tier: generated\n"
         + "    skills-dir: .e2-mirror/skills\n"
         + "    skills-mirrors: .claude/skillsSrcE2\n")

    try
        File.SetUnixFileMode(lockedPath, UnixFileMode.None)

        match auditSkillsMirrors root with
        | Ok _ -> Assert.True(false, "expected a read failure")
        | Error e -> Assert.Contains("failed to read", e)
    finally
        File.SetUnixFileMode(lockedPath, UnixFileMode.UserRead ||| UnixFileMode.UserWrite)

[<Fact>]
let ``emitSkillsMirrors silently skips a job whose declared source directory does not exist`` () =
    let root = scratch ()
    Directory.CreateDirectory(Path.Combine(root, ".claude")) |> ignore

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: f\n"
         + "    tier: generated\n"
         + "    skills-dir: .f-mirror/skills\n"
         + "    skills-mirrors: .claude/skillsSrcF-missing\n")

    match emitSkillsMirrors root false with
    | Error e -> failwith e
    | Ok result ->
        Assert.Equal(0, result.Copied)
        Assert.Equal(0, result.Removed)

[<Fact>]
let ``emitSkillsMirrors propagates a failing job's error past a later valid, skipped job`` () =
    let root = scratch ()
    let lockedPath = Path.Combine(root, ".claude", "skillsSrcD3", "locked.md")
    writeFile lockedPath "content"
    Directory.CreateDirectory(Path.Combine(root, ".claude")) |> ignore

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: d3\n"
         + "    tier: generated\n"
         + "    skills-dir: .d3-mirror/skills\n"
         + "    skills-mirrors: .claude/skillsSrcD3\n"
         + "  - name: f3\n"
         + "    tier: generated\n"
         + "    skills-dir: .f3-mirror/skills\n"
         + "    skills-mirrors: .claude/skillsSrcF3-missing\n")

    try
        File.SetUnixFileMode(lockedPath, UnixFileMode.None)

        match emitSkillsMirrors root true with
        | Ok _ -> Assert.True(false, "expected a read failure")
        | Error e -> Assert.Contains("failed to read", e)
    finally
        File.SetUnixFileMode(lockedPath, UnixFileMode.UserRead ||| UnixFileMode.UserWrite)

[<Fact>]
let ``emitSkillsMirrors leaves a pruned directory alone when a vendored sibling keeps it non-empty`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, ".claude", "skillsSrcG", "keep.md")) "keep-content"
    let orphan = Path.Combine(root, ".g-mirror", "skills", "sub", "orphan.md")
    let sibling = Path.Combine(root, ".g-mirror", "skills", "sub", "sibling.md")
    writeFile orphan "orphan-content"
    writeFile sibling "sibling-content"

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: g\n"
         + "    tier: generated\n"
         + "    skills-dir: .g-mirror/skills\n"
         + "    skills-mirrors: .claude/skillsSrcG\n"
         + "    vendored:\n"
         + "      - .g-mirror/skills/sub/sibling.md\n"
         + "    ownership:\n"
         + "      - path: .g-mirror/skills/sub/sibling.md\n"
         + "        class: vendored\n"
         + "        reason: test\n")

    match emitSkillsMirrors root false with
    | Error e -> failwith e
    | Ok result ->
        Assert.Equal(1, result.Removed)
        Assert.Equal(1, result.VendoredSkipped)
        Assert.False(File.Exists orphan)
        Assert.True(File.Exists sibling)
        Assert.True(Directory.Exists(Path.GetDirectoryName sibling))

[<Fact>]
let ``emitSkillsMirrors ignores a directory-removal failure while pruning`` () =
    let root = scratch ()
    Directory.CreateDirectory(Path.Combine(root, ".claude", "skillsSrcH")) |> ignore
    let orphan = Path.Combine(root, ".h-mirror", "skills", "a", "b", "orphan.md")
    writeFile orphan "orphan-content"
    let targetRoot = Path.Combine(root, ".h-mirror", "skills")

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: h\n"
         + "    tier: generated\n"
         + "    skills-dir: .h-mirror/skills\n"
         + "    skills-mirrors: .claude/skillsSrcH\n")

    try
        File.SetUnixFileMode(targetRoot, UnixFileMode.UserRead ||| UnixFileMode.UserExecute)

        match emitSkillsMirrors root false with
        | Error e -> failwith e
        | Ok result ->
            Assert.Equal(1, result.Removed)
            Assert.False(File.Exists orphan)
    finally
        File.SetUnixFileMode(targetRoot, UnixFileMode.UserRead ||| UnixFileMode.UserWrite ||| UnixFileMode.UserExecute)

[<Fact>]
let ``emitSkillsMirrors fails when it cannot create the mirror's target directory`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, ".claude", "skillsSrcI", "one.md")) "content"
    let parent = Path.Combine(root, ".i-mirror")
    Directory.CreateDirectory parent |> ignore

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: i\n"
         + "    tier: generated\n"
         + "    skills-dir: .i-mirror/skills\n"
         + "    skills-mirrors: .claude/skillsSrcI\n")

    try
        File.SetUnixFileMode(parent, UnixFileMode.UserRead ||| UnixFileMode.UserExecute)

        match emitSkillsMirrors root false with
        | Ok _ -> Assert.True(false, "expected a write failure")
        | Error _ -> ()
    finally
        File.SetUnixFileMode(parent, UnixFileMode.UserRead ||| UnixFileMode.UserWrite ||| UnixFileMode.UserExecute)

// ---------------------------------------------------------------------------
// applyField / needsQuoting / convertAgent / convertAllAgents
// — coverage-gap edge cases, all driven through convertAllAgents
// ---------------------------------------------------------------------------

[<Fact>]
let ``convertAllAgents leaves steps unset when maxTurns is not a parseable integer`` () =
    let root = scratch ()

    writeFile
        (Path.Combine(root, ".claude", "agents", "unparseable-turns.md"))
        "---\nname: unparseable-turns\ndescription: fixture\nmaxTurns: notanumber\n---\nBody.\n"

    match convertAllAgents root false with
    | Error e -> failwith e
    | Ok result ->
        Assert.Equal(1, result.Converted)

        let output =
            File.ReadAllText(Path.Combine(root, ".opencode", "agents", "unparseable-turns.md"))

        Assert.DoesNotContain("steps:", output)

[<Fact>]
let ``convertAllAgents quotes a description needing it for each needs-quoting reason`` () =
    let root = scratch ()

    writeFile
        (Path.Combine(root, ".claude", "agents", "lead-dash.md"))
        "---\nname: lead-dash\ndescription: \"-leads with dash\"\n---\nBody.\n"

    writeFile
        (Path.Combine(root, ".claude", "agents", "trail-tab.md"))
        "---\nname: trail-tab\ndescription: \"trailing tab\\t\"\n---\nBody.\n"

    writeFile
        (Path.Combine(root, ".claude", "agents", "has-hash.md"))
        "---\nname: has-hash\ndescription: \"value with a space #hash\"\n---\nBody.\n"

    writeFile
        (Path.Combine(root, ".claude", "agents", "has-newline.md"))
        "---\nname: has-newline\ndescription: \"line one\\nline two\"\n---\nBody.\n"

    match convertAllAgents root false with
    | Error e -> failwith e
    | Ok result ->
        Assert.Equal(4, result.Converted)

        for name in [ "lead-dash"; "trail-tab"; "has-hash"; "has-newline" ] do
            let output =
                File.ReadAllText(Path.Combine(root, ".opencode", "agents", name + ".md"))

            let firstLine = output.Split('\n').[1]
            Assert.StartsWith("description: \"", firstLine)

[<Fact>]
let ``convertAllAgents tallies a per-file write failure without failing the whole run`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, ".claude", "agents", "x.md")) "---\nname: x\ndescription: fixture\n---\nBody.\n"
    let opencodeParent = Path.Combine(root, ".opencode")
    Directory.CreateDirectory opencodeParent |> ignore

    try
        File.SetUnixFileMode(opencodeParent, UnixFileMode.UserRead ||| UnixFileMode.UserExecute)

        match convertAllAgents root false with
        | Error e -> failwith e
        | Ok result ->
            Assert.Equal(0, result.Converted)
            Assert.Equal(1, result.Failed)
            Assert.Equal<string list>([ "x.md" ], result.FailedFiles)
    finally
        File.SetUnixFileMode(
            opencodeParent,
            UnixFileMode.UserRead ||| UnixFileMode.UserWrite ||| UnixFileMode.UserExecute
        )

// ---------------------------------------------------------------------------
// convertCodexAgent / convertAllCodexAgents / rewriteGeneratedRegion
// ---------------------------------------------------------------------------
//
/// The Codex translation the emitter reads from `repo-config.yml` at runtime.
/// Declared here so these tests assert the mapping mechanism rather than the
/// repository's current model identifiers.
let private codexGradeMaps: GradeMaps =
    { GradeOfAlias = Map.ofList [ "fable", "ultra"; "opus", "planning"; "sonnet", "execution"; "haiku", "fast" ]
      EffortOfGrade = Map.ofList [ "ultra", "high"; "planning", "high"; "execution", "xhigh"; "fast", "xhigh" ]
      ModelOfGrade =
        Map.ofList
            [ "ultra", "gpt-6-astra"
              "planning", "gpt-5.6-sol"
              "execution", "gpt-5.6-terra"
              "fast", "gpt-5.6-luna" ] }

// — coverage-gap edge cases
// ---------------------------------------------------------------------------

[<Fact>]
let ``convertCodexAgent records a warning and leaves description empty when it is not a string`` () =
    let root = scratch ()
    let inputPath = Path.Combine(root, ".claude", "agents", "seq-desc.md")
    writeFile inputPath "---\nname: seq-desc\ndescription:\n  - a\n  - b\n---\nBody.\n"

    match
        convertCodexAgent
            emptyGradeMaps
            inputPath
            (Path.Combine(root, "out.toml"))
            "seq-desc"
            (Path.GetDirectoryName inputPath)
            true
    with
    | Error e -> failwith e
    | Ok(agent, warnings) ->
        Assert.Equal("", agent.Description)

        Assert.True(
            warnings
            |> List.exists (fun w -> w.Field = "description" && w.Reason.Contains("must be a string"))
        )

[<Fact>]
let ``convertCodexAgent writes the tier model and reasoning effort into the emitted toml`` () =
    let root = scratch ()
    let claudeDir = Path.Combine(root, ".claude", "agents")
    let inputPath = Path.Combine(claudeDir, "tiered.md")
    writeFile inputPath "---\nname: tiered\ndescription: fixture\ntools: Read\nmodel: fable\neffort: high\n---\nBody.\n"
    let outputPath = Path.Combine(root, ".codex", "agents", "tiered.toml")

    match convertCodexAgent codexGradeMaps inputPath outputPath "tiered" claudeDir false with
    | Error e -> failwith e
    | Ok(_, warnings) ->
        let emitted = File.ReadAllText outputPath
        Assert.Contains("model = \"gpt-6-astra\"", emitted)
        Assert.Contains("model_reasoning_effort = \"high\"", emitted)
        Assert.DoesNotContain(warnings, fun w -> w.Field = "model" || w.Field = "effort")

[<Fact>]
let ``convertCodexAgent warns and omits the key when a model has no codex counterpart`` () =
    let root = scratch ()
    let claudeDir = Path.Combine(root, ".claude", "agents")
    let inputPath = Path.Combine(claudeDir, "pinned.md")
    writeFile inputPath "---\nname: pinned\ndescription: fixture\nmodel: claude-opus-5\n---\nBody.\n"
    let outputPath = Path.Combine(root, ".codex", "agents", "pinned.toml")

    match convertCodexAgent codexGradeMaps inputPath outputPath "pinned" claudeDir false with
    | Error e -> failwith e
    | Ok(_, warnings) ->
        Assert.DoesNotContain("model = ", File.ReadAllText outputPath)

        Assert.Contains(
            warnings,
            fun w ->
                w.Field = "model"
                && w.Reason.Contains("no codex counterpart for model claude-opus-5")
        )

[<Fact>]
let ``convertCodexAgent fails when the input has no frontmatter marker at all`` () =
    let root = scratch ()
    let inputPath = Path.Combine(root, "no-marker.md")
    writeFile inputPath "just body text, no frontmatter\n"

    match convertCodexAgent emptyGradeMaps inputPath (Path.Combine(root, "out.toml")) "no-marker" root true with
    | Ok _ -> Assert.True(false, "expected a frontmatter-extraction error")
    | Error e -> Assert.Contains("failed to extract frontmatter", e)

[<Fact>]
let ``convertCodexAgent fails when the frontmatter is empty (deserializes to no mapping)`` () =
    let root = scratch ()
    let inputPath = Path.Combine(root, "empty-front.md")
    writeFile inputPath "---\n---\nBody.\n"

    match convertCodexAgent emptyGradeMaps inputPath (Path.Combine(root, "out.toml")) "empty-front" root true with
    | Ok _ -> Assert.True(false, "expected a not-a-mapping error")
    | Error e -> Assert.Contains("frontmatter is not a mapping", e)

[<Fact>]
let ``convertCodexAgent fails when the input file does not exist`` () =
    let root = scratch ()

    match
        convertCodexAgent
            emptyGradeMaps
            (Path.Combine(root, "missing.md"))
            (Path.Combine(root, "out.toml"))
            "missing"
            root
            true
    with
    | Ok _ -> Assert.True(false, "expected a read failure")
    | Error e -> Assert.Contains("failed to convert", e)

[<Fact>]
let ``convertCodexAgent defaults the mirror directory to the current directory for a bare output filename`` () =
    let root = scratch ()
    let inputPath = Path.Combine(root, ".claude", "agents", "bare-out.md")
    writeFile inputPath "---\nname: bare-out\ndescription: fixture\n---\nBody.\n"

    match convertCodexAgent emptyGradeMaps inputPath "bare.toml" "bare-out" (Path.GetDirectoryName inputPath) true with
    | Error e -> failwith e
    | Ok(agent, _) -> Assert.Equal("bare-out", agent.Name)

[<Fact>]
let ``rewriteGeneratedRegion appends a newline before inserting into content lacking a trailing newline`` () =
    let result =
        rewriteGeneratedRegion "existing content, no trailing newline" "REGION-BODY"

    Assert.Equal("existing content, no trailing newline\n\nREGION-BODY\n", result)

[<Fact>]
let ``rewriteGeneratedRegion replaces from the end marker when the start marker is missing`` () =
    let existing = "head text\n" + generatedRegionEnd + "\ntail text"
    let result = rewriteGeneratedRegion existing "NEWREGION"
    Assert.Equal("head text\nNEWREGION\ntail text", result)
    Assert.DoesNotContain(generatedRegionEnd, result)

// ---------------------------------------------------------------------------
// validateSync — stale directory / synced skills / skills mirror / agent
// field-comparison coverage gaps
// ---------------------------------------------------------------------------

[<Fact>]
let ``validateSync fails when the stale .opencode/agent path exists as a directory`` () =
    let root = scratch ()
    Directory.CreateDirectory(Path.Combine(root, ".opencode", "agent")) |> ignore
    let result = validateSync root
    Assert.True((failedCheck result "No Stale Agent Directory").IsSome)

[<Fact>]
let ``validateSync fails when the stale .opencode/agent path exists as a file`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, ".opencode", "agent")) "stray"
    let result = validateSync root
    Assert.True((failedCheck result "No Stale Agent Directory").IsSome)

[<Fact>]
let ``validateSync fails when a Claude skill is duplicated under .opencode/skills`` () =
    let root = scratch ()

    writeFile
        (Path.Combine(root, ".claude", "skills", "dup-skill", "SKILL.md"))
        "---\nname: dup-skill\ndescription: fixture\n---\nBody.\n"

    writeFile
        (Path.Combine(root, ".opencode", "skills", "dup-skill", "SKILL.md"))
        "---\nname: dup-skill\ndescription: fixture\n---\nBody.\n"

    let result = validateSync root
    Assert.True((failedCheck result "No Synced Skill Mirror").IsSome)

[<Fact>]
let ``validateSync reports a registry error through the skills-mirror check`` () =
    let root = scratch ()

    Directory.CreateDirectory(Path.Combine(root, ".claude", "skillsSrcV4"))
    |> ignore

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: v4\n"
         + "    tier: generated\n"
         + "    skills-dir: .v4-mirror/skills\n"
         + "    skills-mirrors: .claude/skillsSrcV4\n"
         + "    vendored:\n"
         + "      - /abs/escape\n")

    let result = validateSync root
    Assert.True((failedCheck result "Skills Mirror: .agents/skills").IsSome)

[<Fact>]
let ``validateSync reports missing and undeclared skills-mirror drift`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, ".claude", "skillsSrcV5", "one.md")) "content"
    writeFile (Path.Combine(root, ".v5-mirror", "skills", "orphan.md")) "orphan"

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: v5\n"
         + "    tier: generated\n"
         + "    skills-dir: .v5-mirror/skills\n"
         + "    skills-mirrors: .claude/skillsSrcV5\n")

    let result = validateSync root

    match failedCheck result "Skills Mirror: .agents/skills" with
    | None -> Assert.True(false, "expected the skills mirror check to fail")
    | Some check ->
        Assert.Contains("missing or stale mirror", check.Actual)
        Assert.Contains("undeclared directory", check.Actual)

[<Fact>]
let ``validateSync falls back to empty defaults for absent frontmatter fields and passes a fully matching agent`` () =
    let root = scratch ()

    // agent1's mirror declares no `description`, so the comparison falls back
    // to the empty default and diverges from the source's own description.
    writeFile
        (Path.Combine(root, ".claude", "agents", "agent1.md"))
        "---\nname: agent1\ndescription: source-only-desc\n---\nBody one.\n"

    writeFile (Path.Combine(root, ".opencode", "agents", "agent1.md")) "---\nunused: true\n---\nBody one.\n"

    writeFile
        (Path.Combine(root, ".claude", "agents", "agent2.md"))
        "---\nname: agent2\ndescription: perm-desc\nmodel: whatever\ntools: Read,Write\n---\nBody two.\n"

    writeFile
        (Path.Combine(root, ".opencode", "agents", "agent2.md"))
        "---\ndescription: perm-desc\npermission:\n  read: allow\n---\nBody two.\n"

    writeFile
        (Path.Combine(root, ".claude", "agents", "agent3.md"))
        "---\nname: agent3\ndescription: same-desc\nmodel: whatever-claude-says\n---\nSame body.\n"

    writeFile (Path.Combine(root, ".opencode", "agents", "agent3.md")) "---\ndescription: same-desc\n---\nSame body.\n"

    let result = validateSync root
    Assert.True((failedCheck result "Agent: agent1").IsSome)
    Assert.True((failedCheck result "Agent: agent2").IsSome)
    Assert.True((passedCheck result "Agent: agent3").IsSome)

[<Fact>]
let ``validateSync reports a comparison failure when the OpenCode mirror cannot be read`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, ".claude", "agents", "unreadable.md")) "---\nname: unreadable\n---\nBody.\n"
    let mirrorPath = Path.Combine(root, ".opencode", "agents", "unreadable.md")
    writeFile mirrorPath "---\ndescription: fixture\n---\nBody.\n"

    try
        File.SetUnixFileMode(mirrorPath, UnixFileMode.None)
        let result = validateSync root

        match failedCheck result "Agent: unreadable" with
        | None -> Assert.True(false, "expected a comparison failure")
        | Some check -> Assert.Contains("failed to compare", check.Message)
    finally
        File.SetUnixFileMode(mirrorPath, UnixFileMode.UserRead ||| UnixFileMode.UserWrite)

[<Fact>]
let ``validateSync reports a comparison failure when the OpenCode mirror frontmatter is empty`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, ".claude", "agents", "empty-mirror.md")) "---\nname: empty-mirror\n---\nBody.\n"
    writeFile (Path.Combine(root, ".opencode", "agents", "empty-mirror.md")) "---\n---\nBody.\n"

    let result = validateSync root

    match failedCheck result "Agent: empty-mirror" with
    | None -> Assert.True(false, "expected a not-a-mapping failure")
    | Some check -> Assert.Contains("frontmatter is not a mapping", check.Message)

// ---------------------------------------------------------------------------
// expectedBindings / validateBindingFile / validateCodexConfigRegion /
// readWithSplitChildren / validateColorTierMaps / validateBindings
// ---------------------------------------------------------------------------

[<Fact>]
let ``expectedBindings returns one binding per discovered Claude agent`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, ".claude", "agents", "one.md")) "---\nname: one\ndescription: fixture\n---\nBody.\n"

    match expectedBindings root with
    | Error e -> failwith e
    | Ok bindings ->
        Assert.Equal(1, List.length bindings)
        Assert.Equal(".codex/agents/one.toml", bindings.[0].RelPath)

[<Fact>]
let ``validateBindings reports a static-binding-configuration failure when discovery fails`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, ".claude", "agents", "bad.md")) "---\nname: bad\nno closing marker\n"

    let result = validateBindings root
    Assert.True((failedCheck result "Static binding configuration").IsSome)

[<Fact>]
let ``validateBindings fails a binding check when the generated file is missing on disk`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, ".claude", "agents", "missing-bin.md")) "---\nname: missing-bin\n---\nBody.\n"

    let result = validateBindings root

    match failedCheck result "Binding: .codex/agents/missing-bin.toml" with
    | None -> Assert.True(false, "expected a missing-binding failure")
    | Some check -> Assert.Equal("file missing", check.Actual)

[<Fact>]
let ``validateBindings fails a binding check when the generated file has drifted, and reports an unreadable one`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, ".claude", "agents", "drifted.md")) "---\nname: drifted\n---\nBody.\n"
    writeFile (Path.Combine(root, ".codex", "agents", "drifted.toml")) "name = \"stale\"\n"

    writeFile (Path.Combine(root, ".claude", "agents", "unreadable-bin.md")) "---\nname: unreadable-bin\n---\nBody.\n"

    let unreadableBinding =
        Path.Combine(root, ".codex", "agents", "unreadable-bin.toml")

    writeFile unreadableBinding "name = \"whatever\"\n"

    try
        File.SetUnixFileMode(unreadableBinding, UnixFileMode.None)
        let result = validateBindings root

        match failedCheck result "Binding: .codex/agents/drifted.toml" with
        | None -> Assert.True(false, "expected a drift failure")
        | Some check -> Assert.Equal("content differs from generated bytes", check.Actual)

        match failedCheck result "Binding: .codex/agents/unreadable-bin.toml" with
        | None -> Assert.True(false, "expected a read failure")
        | Some check -> Assert.Contains("failed to read", check.Message)
    finally
        File.SetUnixFileMode(unreadableBinding, UnixFileMode.UserRead ||| UnixFileMode.UserWrite)

[<Fact>]
let ``validateBindings fails the Codex config region check when the file is unreadable`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, ".claude", "agents", "one.md")) "---\nname: one\n---\nBody.\n"
    let configPath = Path.Combine(root, ".codex", "config.toml")
    writeFile configPath "anything\n"

    try
        File.SetUnixFileMode(configPath, UnixFileMode.None)
        let result = validateBindings root

        match failedCheck result (sprintf "Codex Config Region: %s" codexConfigFile) with
        | None -> Assert.True(false, "expected a read failure")
        | Some check -> Assert.Contains("failed to read", check.Message)
    finally
        File.SetUnixFileMode(configPath, UnixFileMode.UserRead ||| UnixFileMode.UserWrite)

[<Fact>]
let ``validateBindings fails the Codex config region check when no generated region exists`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, ".claude", "agents", "one.md")) "---\nname: one\n---\nBody.\n"
    writeFile (Path.Combine(root, ".codex", "config.toml")) "no markers here at all\n"

    let result = validateBindings root

    match failedCheck result (sprintf "Codex Config Region: %s" codexConfigFile) with
    | None -> Assert.True(false, "expected a no-region failure")
    | Some check -> Assert.Equal("no generated region found", check.Actual)

[<Fact>]
let ``validateBindings fails the Codex config region check when the region has drifted`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, ".claude", "agents", "one.md")) "---\nname: one\n---\nBody.\n"

    writeFile
        (Path.Combine(root, ".codex", "config.toml"))
        (generatedRegionStart + "\nstale content\n" + generatedRegionEnd + "\n")

    let result = validateBindings root

    match failedCheck result (sprintf "Codex Config Region: %s" codexConfigFile) with
    | None -> Assert.True(false, "expected a drift failure")
    | Some check -> Assert.Equal("generated region drifted", check.Actual)

[<Fact>]
let ``validateBindings verifies color and tier values against the governance translation tables`` () =
    let root = scratch ()

    writeFile
        (Path.Combine(root, ".claude", "agents", "colored.md"))
        "---\nname: colored\ncolor: primary\nmodel: mytier\n---\nBody.\n"

    writeFile
        (Path.Combine(root, ".claude", "agents", "custom-colored.md"))
        "---\nname: custom-colored\ncolor: mytoken\n---\nBody.\n"

    let unreadableAgent = Path.Combine(root, ".claude", "agents", "unreadable-scan.md")
    writeFile unreadableAgent "---\nname: unreadable-scan\n---\nBody.\n"

    writeFile
        (Path.Combine(root, "repo-governance", "development", "agents", "ai-agents.md"))
        "the `mytoken` color maps to accent\n"

    writeFile
        (Path.Combine(root, "repo-governance", "development", "agents", "ai-agents", "extra.md"))
        "extra split content\n"

    let unreadableSplitChild =
        Path.Combine(root, "repo-governance", "development", "agents", "ai-agents", "extra.md")

    writeFile (Path.Combine(root, "repo-governance", "development", "agents", "model-selection.md")) "model: mytier\n"

    try
        File.SetUnixFileMode(unreadableAgent, UnixFileMode.None)
        File.SetUnixFileMode(unreadableSplitChild, UnixFileMode.None)

        let result = validateBindings root
        Assert.True((passedCheck result "Color translation: primary").IsSome)
        Assert.True((passedCheck result "Color translation: mytoken").IsSome)
        Assert.True((passedCheck result "Tier mapping: mytier").IsSome)
    finally
        File.SetUnixFileMode(unreadableAgent, UnixFileMode.UserRead ||| UnixFileMode.UserWrite)
        File.SetUnixFileMode(unreadableSplitChild, UnixFileMode.UserRead ||| UnixFileMode.UserWrite)

// ---------------------------------------------------------------------------
// validateYamlFormattingRaw / validateAgent / validateSkill
// — coverage-gap edge cases
// ---------------------------------------------------------------------------

[<Fact>]
let ``validateYamlFormattingRaw fails when the frontmatter does not start with ---`` () =
    let check = validateYamlFormattingRaw "X" "not frontmatter\nline2\nline3\n"
    Assert.Equal("failed", check.Status)
    Assert.Contains("does not start with ---", check.Message)

[<Fact>]
let ``validateYamlFormattingRaw fails when the closing --- is missing`` () =
    let check = validateYamlFormattingRaw "X" "---\nkey: value\nno closer here\n"
    Assert.Equal("failed", check.Status)
    Assert.Contains("closing --- not found", check.Message)

[<Fact>]
let ``validateClaude reports a read failure for an unreadable agent file`` () =
    let root = scratch ()
    let agentPath = Path.Combine(root, ".claude", "agents", "locked.md")
    writeFile agentPath "---\nname: locked\ndescription: fixture\ntools: Read\n---\nBody.\n"
    Directory.CreateDirectory(Path.Combine(root, ".claude", "skills")) |> ignore

    try
        File.SetUnixFileMode(agentPath, UnixFileMode.None)
        let result = validateClaude (fullOpts root)
        Assert.True((failedCheck result "Agent: locked.md - Read File").IsSome)
    finally
        File.SetUnixFileMode(agentPath, UnixFileMode.UserRead ||| UnixFileMode.UserWrite)

[<Fact>]
let ``validateClaude reports a read failure for an unreadable SKILL.md`` () =
    let root = scratch ()
    Directory.CreateDirectory(Path.Combine(root, ".claude", "agents")) |> ignore
    let skillPath = Path.Combine(root, ".claude", "skills", "locked-skill", "SKILL.md")
    writeFile skillPath "---\nname: locked-skill\ndescription: fixture\n---\nBody.\n"

    try
        File.SetUnixFileMode(skillPath, UnixFileMode.None)
        let result = validateClaude (fullOpts root)
        Assert.True((failedCheck result "Skill: locked-skill - Read SKILL.md").IsSome)
    finally
        File.SetUnixFileMode(skillPath, UnixFileMode.UserRead ||| UnixFileMode.UserWrite)

[<Fact>]
let ``validateClaude gracefully defaults an empty-frontmatter skill to a failed description check`` () =
    let root = scratch ()
    Directory.CreateDirectory(Path.Combine(root, ".claude", "agents")) |> ignore
    writeFile (Path.Combine(root, ".claude", "skills", "empty-front-skill", "SKILL.md")) "---\n---\nBody.\n"

    let result = validateClaude (fullOpts root)
    Assert.True((failedCheck result "Skill: empty-front-skill - Description Field Required").IsSome)

// ---------------------------------------------------------------------------
// runRepoGovernanceAuditWordBudgetCategory / repoGovernanceAuditJson /
// runHarnessAudit — coverage-gap edge cases
// ---------------------------------------------------------------------------

[<Fact>]
let ``runRepoGovernanceAuditWordBudgetCategory tolerates a malformed repo-config.yml by treating excludes as empty``
    ()
    =
    let root = scratch ()
    writeFile (Path.Combine(root, "repo-config.yml")) "not: valid: yaml: [unclosed"

    let category = runRepoGovernanceAuditWordBudgetCategory root
    Assert.True(category.Passed)
    Assert.Empty(category.Findings)

[<Fact>]
let ``repoGovernanceAuditJson serializes a real word-budget finding`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, "small.md")) "w w w w w"

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("governance-word-budget:\n"
         + "  surfaces:\n"
         + "    - glob: \"small.md\"\n"
         + "      target: 1\n"
         + "      warn: 1\n"
         + "      fail: 1\n"
         + "  resolved_tree:\n"
         + "    root: \"small.md\"\n"
         + "    target: 1\n"
         + "    warn: 1\n"
         + "    fail: 1\n")

    let json = repoGovernanceAuditJson root
    Assert.Contains("small.md", json)
    Assert.Contains("\"severity\"", json)

[<Fact>]
let ``runHarnessAudit reports PASSED when validate-claude has no failures`` () =
    let root = scratch ()
    Directory.CreateDirectory(Path.Combine(root, ".claude", "agents")) |> ignore
    Directory.CreateDirectory(Path.Combine(root, ".claude", "skills")) |> ignore

    let outcome = runHarnessAudit root
    Assert.Equal(0, outcome.ExitCode)
    Assert.Equal("HARNESS AUDIT PASSED: all validators passed\n", outcome.Output)

// ---------------------------------------------------------------------------
// renderCatalogTable / rewriteCatalogRegion / renderCatalogDocument /
// runHarnessCatalogGenerate — coverage-gap edge cases
// ---------------------------------------------------------------------------

[<Fact>]
let ``renderCatalogTable fails when a harness entry has no catalog block`` () =
    let config = registryWith [ "no-catalog" ]

    match renderCatalogTable config.Harness with
    | Ok _ -> Assert.True(false, "expected a missing catalog-block error")
    | Error e -> Assert.Contains("no-catalog", e)

[<Fact>]
let ``rewriteCatalogRegion fails when the region markers are absent`` () =
    match rewriteCatalogRegion "no markers here at all" "REGION" "doc.md" with
    | Ok _ -> Assert.True(false, "expected a missing-markers error")
    | Error e -> Assert.Contains("doc.md", e)

let private catalogHarnessYaml (name: string) : string =
    sprintf
        "  - name: %s\n    tier: source\n    catalog:\n      platform: X\n      reads-agents-md: \"yes\"\n      instruction-surface: \"-\"\n      mcp-config: \"-\"\n      agent-surface: \"-\"\n      skills-surface: \"-\"\n      status: stable\n"
        name

[<Fact>]
let ``runHarnessCatalogGenerate fails when repo-config.yml is malformed`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, "repo-config.yml")) "not: valid: yaml: [unclosed"

    let outcome = runHarnessCatalogGenerate root
    Assert.Equal(1, outcome.ExitCode)

[<Fact>]
let ``runHarnessCatalogGenerate fails when a harness entry has no catalog block`` () =
    let root = scratch ()

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness-catalog:\n"
         + "  document: CATALOG.md\n"
         + "  verified: 2026-01-01\n"
         + "harness:\n"
         + "  - name: no-catalog\n"
         + "    tier: source\n")

    let outcome = runHarnessCatalogGenerate root
    Assert.Equal(1, outcome.ExitCode)
    Assert.Contains("no-catalog", outcome.Output)

[<Fact>]
let ``runHarnessCatalogGenerate fails when the catalog document has no region markers`` () =
    let root = scratch ()

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness-catalog:\n"
         + "  document: CATALOG.md\n"
         + "  verified: 2026-01-01\n"
         + "harness:\n"
         + catalogHarnessYaml "x")

    writeFile (Path.Combine(root, "CATALOG.md")) "no markers in this document\n"

    let outcome = runHarnessCatalogGenerate root
    Assert.Equal(1, outcome.ExitCode)
    Assert.Contains("CATALOG.md", outcome.Output)

[<Fact>]
let ``runHarnessCatalogGenerate fails when the catalog document cannot be read`` () =
    let root = scratch ()

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness-catalog:\n"
         + "  document: MISSING-CATALOG.md\n"
         + "  verified: 2026-01-01\n"
         + "harness:\n"
         + catalogHarnessYaml "x")

    let outcome = runHarnessCatalogGenerate root
    Assert.Equal(1, outcome.ExitCode)
    Assert.Contains("cannot read", outcome.Output)

// ---------------------------------------------------------------------------
// bindingRoots / classifyOwnership / guardEmitterTargets / regenerateAll /
// runHarnessBindingsGenerate(Detailed) / validateOwnership
// — coverage-gap edge cases
// ---------------------------------------------------------------------------

[<Fact>]
let ``bindingRoots skips a blank root and collects agent/skills/ownership roots`` () =
    let config: RhinoCli.Application.RepoConfig.RepoConfig =
        { RhinoCli.Application.RepoConfig.empty with
            Harness =
                [ { Name = "blank-root"
                    Tier = RhinoCli.Application.RepoConfig.Tier.Source
                    AgentDir = Some ""
                    Mirrors = None
                    ForbidDir = None
                    SkillsDir = None
                    SkillsMirrors = None
                    Vendored = []
                    ModelMap = Map.empty
                    Catalog = None
                    Ownership = [] }
                  { Name = "real-root"
                    Tier = RhinoCli.Application.RepoConfig.Tier.Source
                    AgentDir = Some "agents-x"
                    Mirrors = None
                    ForbidDir = None
                    SkillsDir = Some "skills-y"
                    SkillsMirrors = None
                    Vendored = []
                    ModelMap = Map.empty
                    Catalog = None
                    Ownership =
                      [ { Path = "own-z"
                          Class = RhinoCli.Application.RepoConfig.OwnershipClass.ClassGenerated
                          Reason = None } ] } ] }

    let roots = bindingRoots config
    Assert.False(List.contains "" roots)
    Assert.True(List.contains "agents-x" roots)
    Assert.True(List.contains "skills-y" roots)
    Assert.True(List.contains "own-z" roots)

[<Fact>]
let ``classifyOwnership returns an empty report when the registry declares no binding roots`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, "repo-config.yml")) "harness: []\n"

    match classifyOwnership root with
    | Error e -> failwith e
    | Ok report ->
        Assert.Empty(report.Classified)
        Assert.Empty(report.Unclassified)

[<Fact>]
let ``classifyOwnership fails when git ls-files fails outside a git repository`` () =
    let root = scratch ()
    Directory.CreateDirectory(Path.Combine(root, "agents-real")) |> ignore

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: r\n"
         + "    tier: source\n"
         + "    agent-dir: agents-real\n")

    match classifyOwnership root with
    | Ok _ -> Assert.True(false, "expected a git ls-files failure")
    | Error e -> Assert.Contains("git ls-files failed", e)

[<Fact>]
let ``classifyOwnership fails when repo-config.yml is malformed`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, "repo-config.yml")) "not: valid: yaml: [unclosed"

    match classifyOwnership root with
    | Ok _ -> Assert.True(false, "expected a load failure")
    | Error _ -> ()

[<Fact>]
let ``guardEmitterTargets fails when repo-config.yml is malformed`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, "repo-config.yml")) "not: valid: yaml: [unclosed"

    match guardEmitterTargets root with
    | Ok() -> Assert.True(false, "expected a load failure")
    | Error _ -> ()

[<Fact>]
let ``runHarnessBindingsGenerate fails wholesale when Claude agent discovery fails`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, ".claude", "agents", "bad.md")) "---\nname: bad\nno closing marker\n"

    match runHarnessBindingsGenerate root with
    | Ok() -> Assert.True(false, "expected a discovery failure")
    | Error _ -> ()

[<Fact>]
let ``runHarnessBindingsGenerateDetailed fails when a generated-tier target is declared source`` () =
    let root = scratch ()
    Directory.CreateDirectory(Path.Combine(root, ".opencode", "agents")) |> ignore

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: opencode\n"
         + "    tier: generated\n"
         + "    agent-dir: .opencode/agents\n"
         + "    mirrors: .claude/agents\n"
         + "    ownership:\n"
         + "      - path: .opencode/agents\n"
         + "        class: source\n"
         + "        reason: mistakenly declared source\n")

    match runHarnessBindingsGenerateDetailed root with
    | Ok _ -> Assert.True(false, "expected a guard failure")
    | Error e -> Assert.Contains("refusing to generate", e)

[<Fact>]
let ``runHarnessBindingsGenerateDetailed succeeds end to end for a clean fixture`` () =
    let root = scratch ()

    writeFile (Path.Combine(root, "repo-config.yml")) "harness: []\n"

    writeFile
        (Path.Combine(root, ".claude", "agents", "clean.md"))
        "---\nname: clean\ndescription: fixture\n---\nBody.\n"

    match runHarnessBindingsGenerateDetailed root with
    | Error e -> failwith e
    | Ok outcome ->
        Assert.Equal(1, outcome.Agents.Converted)
        Assert.Equal(1, outcome.Codex.Result.Converted)

[<Fact>]
let ``validateOwnership fails the classification check when the registry cannot be loaded`` () =
    let root = scratch ()
    writeFile (Path.Combine(root, "repo-config.yml")) "not: valid: yaml: [unclosed"

    let result = validateOwnership root
    Assert.True((failedCheck result classificationCheck).IsSome)

[<Fact>]
let ``validateOwnership fails the source-guard check when a generated target is declared source`` () =
    let root = scratch ()
    Directory.CreateDirectory(Path.Combine(root, ".opencode", "agents")) |> ignore

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: opencode\n"
         + "    tier: generated\n"
         + "    agent-dir: .opencode/agents\n"
         + "    mirrors: .claude/agents\n"
         + "    ownership:\n"
         + "      - path: .opencode/agents\n"
         + "        class: source\n"
         + "        reason: mistakenly declared source\n")

    let result = validateOwnership root
    Assert.True((failedCheck result sourceGuardCheck).IsSome)

// ---------------------------------------------------------------------------
// applyField / rebaseAgentLinks / describeYamlValueKind / escapeTomlBasic /
// escapeTomlMultiline — remaining coverage-gap edge cases
// ---------------------------------------------------------------------------

[<Fact>]
let ``convertAllAgents leaves each translated field at its default when the frontmatter value has the wrong shape`` () =
    let root = scratch ()

    writeFile
        (Path.Combine(root, ".claude", "agents", "seq-description.md"))
        "---\nname: seq-description\ndescription:\n  - x\n---\nBody.\n"

    writeFile
        (Path.Combine(root, ".claude", "agents", "string-skills.md"))
        "---\nname: string-skills\ndescription: fixture\nskills: not-a-list\n---\nBody.\n"

    writeFile
        (Path.Combine(root, ".claude", "agents", "seq-color.md"))
        "---\nname: seq-color\ndescription: fixture\ncolor:\n  - x\n---\nBody.\n"

    writeFile
        (Path.Combine(root, ".claude", "agents", "seq-maxturns.md"))
        "---\nname: seq-maxturns\ndescription: fixture\nmaxTurns:\n  - x\n---\nBody.\n"

    match convertAllAgents root false with
    | Error e -> failwith e
    | Ok result ->
        Assert.Equal(4, result.Converted)

        let read name =
            File.ReadAllText(Path.Combine(root, ".opencode", "agents", name + ".md"))

        Assert.Contains("description: \"\"", read "seq-description")
        Assert.DoesNotContain("skills:", read "string-skills")
        Assert.DoesNotContain("color:", read "seq-color")
        Assert.DoesNotContain("steps:", read "seq-maxturns")

[<Fact>]
let ``convertAllAgents rebases a link to a nested group sibling and one resolving to the Claude root itself`` () =
    let root = scratch ()

    writeFile
        (Path.Combine(root, ".claude", "agents", "top.md"))
        "---\nname: top\ndescription: fixture\n---\nSee [nested](nested-group/inner.md).\n"

    writeFile
        (Path.Combine(root, ".claude", "agents", "nested-group", "inner.md"))
        "---\nname: inner\ndescription: fixture\n---\nClimb [up](..) from here.\n"

    match convertAllAgents root false with
    | Error e -> failwith e
    | Ok result ->
        Assert.Equal(2, result.Converted)

        let topOutput =
            File.ReadAllText(Path.Combine(root, ".opencode", "agents", "top.md"))

        Assert.Contains("(inner.md)", topOutput)

[<Fact>]
let ``convertCodexAgent describes a null description and a mapping description in its warning`` () =
    let root = scratch ()

    let nullPath = Path.Combine(root, ".claude", "agents", "null-desc.md")
    writeFile nullPath "---\nname: null-desc\ndescription:\n---\nBody.\n"

    match
        convertCodexAgent
            emptyGradeMaps
            nullPath
            (Path.Combine(root, "n.toml"))
            "null-desc"
            (Path.GetDirectoryName nullPath)
            true
    with
    | Error e -> failwith e
    | Ok(_, warnings) -> Assert.True(warnings |> List.exists (fun w -> w.Reason.Contains("got null")))

    let mapPath = Path.Combine(root, ".claude", "agents", "map-desc.md")
    writeFile mapPath "---\nname: map-desc\ndescription:\n  key: value\n---\nBody.\n"

    match
        convertCodexAgent
            emptyGradeMaps
            mapPath
            (Path.Combine(root, "m.toml"))
            "map-desc"
            (Path.GetDirectoryName mapPath)
            true
    with
    | Error e -> failwith e
    | Ok(_, warnings) -> Assert.True(warnings |> List.exists (fun w -> w.Reason.Contains("got a mapping")))

[<Fact>]
let ``convertAllCodexAgents escapes control characters in name, description, and body`` () =
    let root = scratch ()

    writeFile
        (Path.Combine(root, ".claude", "agents", "ctrl.md"))
        "---\nname: ctrl\ndescription: \"back\\\\slash and \\n newline and \\t tab and \\r cr\"\n---\nBody with a literal \r return.\n"

    match convertAllCodexAgents root false with
    | Error e -> failwith e
    | Ok result ->
        Assert.Equal(1, result.Result.Converted)
        let output = File.ReadAllText(Path.Combine(root, ".codex", "agents", "ctrl.toml"))
        Assert.Contains("\\\\slash", output)
        Assert.Contains("\\n newline", output)
        Assert.Contains("\\t tab", output)
        Assert.Contains("\\r", output)

// ---------------------------------------------------------------------------
// promote / triage support — git-index-backed fixtures
// ---------------------------------------------------------------------------

let private isolatePromoteGitEnv (root: string) (psi: System.Diagnostics.ProcessStartInfo) =
    psi.EnvironmentVariables.["GIT_DIR"] <- Path.Combine(root, ".git")
    psi.EnvironmentVariables.["GIT_CEILING_DIRECTORIES"] <- root
    psi.EnvironmentVariables.["GIT_CONFIG_GLOBAL"] <- "/dev/null"
    psi.EnvironmentVariables.["GIT_CONFIG_SYSTEM"] <- "/dev/null"

let private runPromoteGit (root: string) (args: string list) : unit =
    use proc = new System.Diagnostics.Process()
    proc.StartInfo.FileName <- "git"
    args |> List.iter proc.StartInfo.ArgumentList.Add
    proc.StartInfo.WorkingDirectory <- root
    proc.StartInfo.RedirectStandardOutput <- true
    proc.StartInfo.RedirectStandardError <- true
    proc.StartInfo.UseShellExecute <- false
    isolatePromoteGitEnv root proc.StartInfo
    proc.Start() |> ignore
    let stderr = proc.StandardError.ReadToEnd()
    proc.WaitForExit()

    if proc.ExitCode <> 0 then
        failwithf "git %s failed in %s: %s" (String.concat " " args) root stderr

let private initPromoteGitFixture (root: string) : unit =
    runPromoteGit root [ "init"; "-q"; "-b"; "main" ]
    runPromoteGit root [ "config"; "user.name"; "Rhino CLI Test" ]
    runPromoteGit root [ "config"; "user.email"; "rhino-cli-test@example.invalid" ]

// ---------------------------------------------------------------------------
// promote — coverage-gap edge cases
// ---------------------------------------------------------------------------

[<Fact>]
let ``promote rebases opencode mirror links, appends description, and reports at-risk fields`` () =
    let root = scratch ()
    initPromoteGitFixture root

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: opencode\n"
         + "    tier: generated\n"
         + "    agent-dir: .opencode/agents\n"
         + "    mirrors: .claude/agents\n"
         + "    ownership:\n"
         + "      - path: .opencode/agents\n"
         + "        class: generated\n"
         + "        reason: emitted from .claude/agents\n"
         + "      - path: .claude/agents\n"
         + "        class: source\n"
         + "        reason: canonical\n")

    writeFile
        (Path.Combine(root, ".claude", "agents", "promo-agent.md"))
        "---\nname: promo-agent\neffort: high\nmeta:\n  nested: value\n---\nCanonical body.\n"

    writeFile
        (Path.Combine(root, ".claude", "agents", "other-agent.md"))
        "---\nname: other-agent\ndescription: fixture\n---\nOther body.\n"

    writeFile
        (Path.Combine(root, ".opencode", "agents", "promo-agent.md"))
        ("---\ndescription: edited on the mirror\n---\n"
         + "Edited body [self](promo-agent.md) and [sibling](other-agent.md) "
         + "and [outside](../../README.md) and [docs](https://example.com/x).\n")

    runPromoteGit root [ "add"; "-A" ]

    match promote root ".opencode/agents/promo-agent.md" with
    | Error e -> failwith e
    | Ok proposal ->
        Assert.Equal(".claude/agents/promo-agent.md", proposal.Canonical)
        Assert.Equal(".opencode/agents/promo-agent.md", proposal.Mirror)
        Assert.Contains("description: edited on the mirror", proposal.Diff)
        Assert.True(proposal.AtRisk |> List.exists (fun (k, _) -> k = "effort"))
        Assert.False(proposal.AtRisk |> List.exists (fun (k, _) -> k = "meta"))

[<Fact>]
let ``promote extracts a Codex TOML mirror body regardless of the canonical's line endings`` () =
    let root = scratch ()
    initPromoteGitFixture root

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: codex\n"
         + "    tier: generated\n"
         + "    agent-dir: .codex/agents\n"
         + "    mirrors: .claude/agents\n"
         + "    ownership:\n"
         + "      - path: .codex/agents\n"
         + "        class: generated\n"
         + "        reason: emitted from .claude/agents\n"
         + "      - path: .claude/agents\n"
         + "        class: source\n"
         + "        reason: canonical\n")

    writeFile (Path.Combine(root, ".claude", "agents", "crlf-open.md")) "---\r\nname: crlf-open\r\n---\r\nBody.\r\n"

    writeFile
        (Path.Combine(root, ".codex", "agents", "crlf-open.toml"))
        "developer_instructions = \"\"\"\nTOML body one.\n\"\"\"\n"

    writeFile (Path.Combine(root, ".claude", "agents", "crlf-close.md")) "---\nname: crlf-close\r\n---\r\nBody.\r\n"

    writeFile
        (Path.Combine(root, ".codex", "agents", "crlf-close.toml"))
        "developer_instructions = \"\"\"\nTOML body two.\n\"\"\"\n"

    runPromoteGit root [ "add"; "-A" ]

    match promote root ".codex/agents/crlf-open.toml" with
    | Error e -> failwith e
    | Ok proposal -> Assert.Contains("TOML body one.", proposal.Diff)

    match promote root ".codex/agents/crlf-close.toml" with
    | Error e -> failwith e
    | Ok proposal -> Assert.Contains("TOML body two.", proposal.Diff)

[<Fact>]
let ``promote reports no at-risk fields for a harness with no field-policy table`` () =
    let root = scratch ()
    initPromoteGitFixture root

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: raw\n"
         + "    tier: generated\n"
         + "    agent-dir: .raw/agents\n"
         + "    mirrors: .claude/agents2\n"
         + "    ownership:\n"
         + "      - path: .raw/agents\n"
         + "        class: generated\n"
         + "        reason: byte-copy mirror\n"
         + "      - path: .claude/agents2\n"
         + "        class: source\n"
         + "        reason: canonical\n")

    writeFile
        (Path.Combine(root, ".claude", "agents2", "plain.md"))
        "---\nname: plain\ndescription: fixture\n---\nBody.\n"

    writeFile (Path.Combine(root, ".raw", "agents", "plain.md")) "---\ndescription: mirror desc\n---\nMirror body.\n"

    runPromoteGit root [ "add"; "-A" ]

    match promote root ".raw/agents/plain.md" with
    | Error e -> failwith e
    | Ok proposal -> Assert.Empty(proposal.AtRisk)

[<Fact>]
let ``promote strips a leading ./ from the mirror path`` () =
    let root = scratch ()
    initPromoteGitFixture root

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: opencode\n"
         + "    tier: generated\n"
         + "    agent-dir: .opencode/agents\n"
         + "    mirrors: .claude/agents\n"
         + "    ownership:\n"
         + "      - path: .opencode/agents\n"
         + "        class: generated\n"
         + "        reason: emitted from .claude/agents\n"
         + "      - path: .claude/agents\n"
         + "        class: source\n"
         + "        reason: canonical\n")

    writeFile (Path.Combine(root, ".claude", "agents", "dotslash.md")) "---\nname: dotslash\n---\nBody.\n"
    writeFile (Path.Combine(root, ".opencode", "agents", "dotslash.md")) "---\ndescription: x\n---\nBody.\n"
    runPromoteGit root [ "add"; "-A" ]

    match promote root "./.opencode/agents/dotslash.md" with
    | Error e -> failwith e
    | Ok proposal -> Assert.Equal(".opencode/agents/dotslash.md", proposal.Mirror)

[<Fact>]
let ``promote fails when repo-config.yml cannot be loaded`` () =
    let root = scratch ()
    initPromoteGitFixture root
    writeFile (Path.Combine(root, "repo-config.yml")) "not: valid: yaml: [unclosed"

    match promote root "whatever.md" with
    | Ok _ -> Assert.True(false, "expected a load failure")
    | Error _ -> ()

[<Fact>]
let ``promote fails when the mirror path is not tracked as a generated file`` () =
    let root = scratch ()
    initPromoteGitFixture root
    writeFile (Path.Combine(root, "repo-config.yml")) "harness: []\n"

    match promote root "untracked.md" with
    | Ok _ -> Assert.True(false, "expected a not-generated failure")
    | Error e -> Assert.Contains("is not a generated binding file", e)

[<Fact>]
let ``promote fails when the mirror path is tracked but classified source, not generated`` () =
    let root = scratch ()
    initPromoteGitFixture root

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: opencode\n"
         + "    tier: generated\n"
         + "    agent-dir: .opencode/agents\n"
         + "    mirrors: .claude/agents\n"
         + "    ownership:\n"
         + "      - path: .opencode/agents\n"
         + "        class: generated\n"
         + "        reason: emitted from .claude/agents\n"
         + "      - path: .claude/agents\n"
         + "        class: source\n"
         + "        reason: canonical\n")

    writeFile (Path.Combine(root, ".claude", "agents", "canonical-only.md")) "---\nname: canonical-only\n---\nBody.\n"
    runPromoteGit root [ "add"; "-A" ]

    match promote root ".claude/agents/canonical-only.md" with
    | Ok _ -> Assert.True(false, "expected a not-generated failure")
    | Error e -> Assert.Contains("is not a generated binding file", e)

[<Fact>]
let ``promote fails when no canonical source is declared for a generated file`` () =
    let root = scratch ()
    initPromoteGitFixture root

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: orphan\n"
         + "    tier: generated\n"
         + "    ownership:\n"
         + "      - path: .misc\n"
         + "        class: generated\n"
         + "        reason: generated with no declared canonical source\n")

    writeFile (Path.Combine(root, ".misc", "x.md")) "content"
    runPromoteGit root [ "add"; "-A" ]

    match promote root ".misc/x.md" with
    | Ok _ -> Assert.True(false, "expected a no-canonical-declared failure")
    | Error e -> Assert.Contains("no canonical source is declared", e)

[<Fact>]
let ``promote fails to read the canonical source when it does not exist on disk`` () =
    let root = scratch ()
    initPromoteGitFixture root

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: sk\n"
         + "    tier: generated\n"
         + "    skills-dir: .codex-skills\n"
         + "    skills-mirrors: .claude/skills\n"
         + "    ownership:\n"
         + "      - path: .codex-skills\n"
         + "        class: generated\n"
         + "        reason: byte-copy skills mirror\n"
         + "      - path: .claude/skills\n"
         + "        class: source\n"
         + "        reason: canonical skills source\n")

    writeFile (Path.Combine(root, ".codex-skills", "foo", "SKILL.md")) "mirrored content"
    runPromoteGit root [ "add"; "-A" ]

    match promote root ".codex-skills/foo/SKILL.md" with
    | Ok _ -> Assert.True(false, "expected a canonical-read failure")
    | Error e -> Assert.Contains("failed to read", e)

// ---------------------------------------------------------------------------
// formatDivergence / verdictSummary / unifiedDiff — coverage-gap edge cases
// ---------------------------------------------------------------------------

[<Fact>]
let ``formatDivergence renders nothing for an in-sync divergence`` () =
    let divergence: Divergence =
        { Mirror = "x.md"
          Canonical = Some "y.md"
          Outcome = InSync }

    Assert.Equal("", formatDivergence divergence)

[<Fact>]
let ``verdictSummary reports no divergence for an empty report`` () =
    let report: TriageReport = { Compared = 0; Divergences = [] }
    Assert.Equal("no divergence", verdictSummary report)

[<Fact>]
let ``verdictSummary escalates to a hard-stop sentence when any divergence is both-sided`` () =
    let report: TriageReport =
        { Compared = 2
          Divergences =
            [ { Mirror = "a.md"
                Canonical = Some "a-src.md"
                Outcome = OneSided SideMirror }
              { Mirror = "b.md"
                Canonical = Some "b-src.md"
                Outcome = BothDiverged } ] }

    Assert.Contains("reconcile by hand", verdictSummary report)

[<Fact>]
let ``verdictSummary reports a plain divergence count when every divergence is one-sided`` () =
    let report: TriageReport =
        { Compared = 1
          Divergences =
            [ { Mirror = "a.md"
                Canonical = Some "a-src.md"
                Outcome = OneSided SideCanonical } ] }

    Assert.Equal("1 divergence(s)", verdictSummary report)

[<Fact>]
let ``unifiedDiff renders no hunk when the only difference is a trailing newline`` () =
    Assert.Equal("", unifiedDiff "path.md" "a\nb\n" "a\nb")

// ---------------------------------------------------------------------------
// triage / differsFromHead / tryReadAllText — coverage-gap edge cases
// ---------------------------------------------------------------------------

[<Fact>]
let ``triage attributes a divergence to the canonical side when the mirror was deleted after HEAD`` () =
    let root = scratch ()
    initPromoteGitFixture root

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: opencode\n"
         + "    tier: generated\n"
         + "    agent-dir: .opencode/agents\n"
         + "    mirrors: .claude/agents\n"
         + "    ownership:\n"
         + "      - path: .opencode/agents\n"
         + "        class: generated\n"
         + "        reason: emitted from .claude/agents\n"
         + "      - path: .claude/agents\n"
         + "        class: source\n"
         + "        reason: canonical\n")

    writeFile (Path.Combine(root, ".claude", "agents", "x.md")) "---\nname: x\ndescription: canon-desc\n---\nBody.\n"
    let mirrorPath = Path.Combine(root, ".opencode", "agents", "x.md")
    writeFile mirrorPath "---\ndescription: stale-desc\n---\nBody.\n"

    runPromoteGit root [ "add"; "-A" ]
    runPromoteGit root [ "commit"; "-q"; "-m"; "initial" ]

    File.Delete mirrorPath

    match triage root with
    | Error e -> failwith e
    | Ok report ->
        Assert.Equal(1, List.length report.Divergences)
        let divergence = report.Divergences.[0]
        Assert.Equal(".opencode/agents/x.md", divergence.Mirror)
        Assert.Equal(OneSided SideCanonical, divergence.Outcome)

[<Fact>]
let ``triage fails when repo-config.yml cannot be loaded`` () =
    let root = scratch ()
    initPromoteGitFixture root
    writeFile (Path.Combine(root, "repo-config.yml")) "not: valid: yaml: [unclosed"

    match triage root with
    | Ok _ -> Assert.True(false, "expected a load failure")
    | Error _ -> ()

[<Fact>]
let ``triage fails when git ls-files fails outside a git repository`` () =
    let root = scratch ()
    Directory.CreateDirectory(Path.Combine(root, "agents-real")) |> ignore

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: r\n"
         + "    tier: source\n"
         + "    agent-dir: agents-real\n")

    match triage root with
    | Ok _ -> Assert.True(false, "expected a git ls-files failure")
    | Error e -> Assert.Contains("git ls-files failed", e)

[<Fact>]
let ``triage fails when the scratch regeneration cannot discover Claude agent sources`` () =
    let root = scratch ()
    initPromoteGitFixture root

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: opencode\n"
         + "    tier: generated\n"
         + "    agent-dir: .opencode/agents\n"
         + "    mirrors: .claude/agents\n"
         + "    ownership:\n"
         + "      - path: .opencode/agents\n"
         + "        class: generated\n"
         + "        reason: emitted from .claude/agents\n"
         + "      - path: .claude/agents\n"
         + "        class: source\n"
         + "        reason: canonical\n")

    writeFile (Path.Combine(root, ".claude", "agents", "bad.md")) "---\nname: bad\nno closing marker\n"
    writeFile (Path.Combine(root, ".opencode", "agents", "bad.md")) "---\ndescription: x\n---\nBody.\n"
    runPromoteGit root [ "add"; "-A" ]

    match triage root with
    | Ok _ -> Assert.True(false, "expected a scratch-regeneration failure")
    | Error _ -> ()

// ---------------------------------------------------------------------------
// Second coverage pass — remaining edge cases confirmed reachable via a
// dotnet fsi probe against the built DLL before being pinned here. Every
// case below was independently reproduced outside this file first; see the
// harness-developer session notes for the full unreachable-line inventory
// this pass also examined and rejected as dead code.
// ---------------------------------------------------------------------------

[<Fact>]
let ``resolveCanonical resolves a mirror path that equals the skills-dir exactly, with no suffix`` () =
    let root = scratch ()

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: a\n"
         + "    tier: generated\n"
         + "    skills-dir: .mirror/skills\n"
         + "    skills-mirrors: .claude/skills\n")

    match RhinoCli.Application.RepoConfig.load root with
    | Error e -> failwith e
    | Ok config ->
        // `mirrorRel` equals the declared `skills-dir` verbatim — `stripDir`
        // takes its `rel = dirNorm` branch (an empty suffix) rather than the
        // `StartsWith(dirNorm + "/")` branch every other skills-mirror test
        // exercises.
        Assert.Equal(Some ".claude/skills/", resolveCanonical root config ".mirror/skills")

[<Fact>]
let ``driftRemediation names the resolved canonical source when the registry declares one`` () =
    let root = scratch ()

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: a\n"
         + "    tier: generated\n"
         + "    skills-dir: .mirror/skills\n"
         + "    skills-mirrors: .claude/skills\n")

    let message = driftRemediation root ".mirror/skills/x.md"
    Assert.Contains("Edit `.claude/skills/x.md`", message)

[<Fact>]
let ``auditSkillsMirrors short-circuits the write-diff fold once an earlier source file fails to read`` () =
    let root = scratch ()

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: c\n"
         + "    tier: generated\n"
         + "    skills-dir: .mirror/skills\n"
         + "    skills-mirrors: .claude/skills-src\n")

    let srcDir = Path.Combine(root, ".claude", "skills-src")
    Directory.CreateDirectory srcDir |> ignore
    // Alphabetically bracketed by two readable files so the fold's
    // already-failed accumulator is threaded through at least one more
    // iteration after the broken symlink — `List.fold` still invokes the
    // folder for "2-ok.md" even though `acc` is already `Error`.
    File.WriteAllText(Path.Combine(srcDir, "0-ok.md"), "hello\n")

    File.CreateSymbolicLink(Path.Combine(srcDir, "1-broken-link.md"), "/nonexistent-target-xyz")
    |> ignore

    File.WriteAllText(Path.Combine(srcDir, "2-ok.md"), "world\n")

    match auditSkillsMirrors root with
    | Ok drifts -> Assert.True(false, sprintf "expected a read failure, got %A" drifts)
    | Error e -> Assert.Contains("1-broken-link.md", e)

[<Fact>]
let ``convertCodexAgent defaults the link-rebase input directory to the current directory for a bare input filename``
    ()
    =
    // `convertCodexAgent` takes `inputPath` as a raw parameter with no
    // internal `Path.Combine`, so a caller can pass a bare filename with no
    // directory component — unlike the OpenCode side, whose only caller
    // (`convertAllAgents`) always builds a fully-qualified path.
    let cwd = Directory.GetCurrentDirectory()
    let bareName = "rhino-cli-harness-unit-bare-input-probe.md"
    let fullPath = Path.Combine(cwd, bareName)
    File.WriteAllText(fullPath, "---\nname: bare-agent\ndescription: fixture\n---\nBody with no links.\n")

    try
        match
            convertCodexAgent
                emptyGradeMaps
                bareName
                (Path.Combine(cwd, "bare-input-probe-out.toml"))
                "bare-agent"
                "irrelevant"
                true
        with
        | Error e -> failwith e
        | Ok(agent, _warnings) -> Assert.Equal("fixture", agent.Description)
    finally
        File.Delete fullPath

[<Fact>]
let ``validateBindings fails the codex config region check when Claude agent discovery fails`` () =
    let root = scratch ()

    writeFile
        (Path.Combine(root, ".claude", "agents", "one.md"))
        "---\nname: dup\ndescription: fixture one\n---\nBody one.\n"

    writeFile
        (Path.Combine(root, ".claude", "agents", "two.md"))
        "---\nname: dup\ndescription: fixture two\n---\nBody two.\n"

    writeFile
        (Path.Combine(root, ".codex", "config.toml"))
        ("# >>> rhino-cli generated: codex agents - do not edit inside this region\n\n"
         + "# <<< rhino-cli generated: codex agents\n")

    let result = validateBindings root

    match failedCheck result "Codex Config Region" with
    | None -> Assert.True(false, "expected the codex config region check to fail")
    | Some check -> Assert.Contains("agent name collision", check.Message)

[<Fact>]
let ``promote rebases a mirror link carrying an anchor to a sibling agent at the same depth`` () =
    let root = scratch ()
    initPromoteGitFixture root

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: opencode\n"
         + "    tier: generated\n"
         + "    agent-dir: .opencode/agents\n"
         + "    mirrors: .claude/agents\n"
         + "    ownership:\n"
         + "      - path: .opencode/agents\n"
         + "        class: generated\n"
         + "        reason: emitted from .claude/agents\n"
         + "      - path: .claude/agents\n"
         + "        class: source\n"
         + "        reason: canonical\n")

    writeFile
        (Path.Combine(root, ".claude", "agents", "anchor-agent.md"))
        "---\nname: anchor-agent\ndescription: fixture\n---\nCanonical body.\n"

    writeFile
        (Path.Combine(root, ".claude", "agents", "other-agent.md"))
        "---\nname: other-agent\ndescription: other fixture\n---\nOther body.\n"

    writeFile
        (Path.Combine(root, ".opencode", "agents", "anchor-agent.md"))
        ("---\ndescription: mirror body\n---\n"
         + "See [section](other-agent.md#heading) for more.\n")

    runPromoteGit root [ "add"; "-A" ]

    match promote root ".opencode/agents/anchor-agent.md" with
    | Error e -> failwith e
    | Ok proposal -> Assert.Contains("(other-agent.md#heading)", proposal.Diff)

[<Fact>]
let ``promote reads a Codex mirror's single-line quoted description field`` () =
    let root = scratch ()
    initPromoteGitFixture root

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: codex\n"
         + "    tier: generated\n"
         + "    agent-dir: .codex/agents\n"
         + "    mirrors: .claude/agents\n"
         + "    ownership:\n"
         + "      - path: .codex/agents\n"
         + "        class: generated\n"
         + "        reason: emitted from .claude/agents\n"
         + "      - path: .claude/agents\n"
         + "        class: source\n"
         + "        reason: canonical\n")

    writeFile
        (Path.Combine(root, ".claude", "agents", "quoted-desc.md"))
        "---\nname: quoted-desc\ndescription: canonical desc\n---\nCanonical body.\n"

    writeFile
        (Path.Combine(root, ".codex", "agents", "quoted-desc.toml"))
        ("name = \"quoted-desc\"\n"
         + "description = \"Mirror single-line description\"\n"
         + "developer_instructions = \"\"\"\nTOML body.\n\"\"\"\n")

    runPromoteGit root [ "add"; "-A" ]

    match promote root ".codex/agents/quoted-desc.toml" with
    | Error e -> failwith e
    | Ok proposal -> Assert.Contains("description: Mirror single-line description", proposal.Diff)

[<Fact>]
let ``promote ignores a Codex mirror's unquoted description field`` () =
    let root = scratch ()
    initPromoteGitFixture root

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: codex\n"
         + "    tier: generated\n"
         + "    agent-dir: .codex/agents\n"
         + "    mirrors: .claude/agents\n"
         + "    ownership:\n"
         + "      - path: .codex/agents\n"
         + "        class: generated\n"
         + "        reason: emitted from .claude/agents\n"
         + "      - path: .claude/agents\n"
         + "        class: source\n"
         + "        reason: canonical\n")

    writeFile
        (Path.Combine(root, ".claude", "agents", "unquoted-desc.md"))
        "---\nname: unquoted-desc\ndescription: canonical desc\n---\nCanonical body.\n"

    writeFile
        (Path.Combine(root, ".codex", "agents", "unquoted-desc.toml"))
        ("name = \"unquoted-desc\"\n"
         + "description = unquoted-value\n"
         + "developer_instructions = \"\"\"\nTOML body.\n\"\"\"\n")

    runPromoteGit root [ "add"; "-A" ]

    match promote root ".codex/agents/unquoted-desc.toml" with
    | Error e -> failwith e
    | Ok proposal ->
        // The malformed (unquoted) description is unparseable, so the
        // canonical's own description line is left untouched — the diff
        // shows the unchanged line as context, never a +/- description change.
        Assert.Contains(" description: canonical desc", proposal.Diff)
        Assert.DoesNotContain("+description:", proposal.Diff)
        Assert.DoesNotContain("-description:", proposal.Diff)
        Assert.Contains("+TOML body.", proposal.Diff)

[<Fact>]
let ``unifiedDiff emits trailing deletions when the old text has more lines than the new text`` () =
    let diff = unifiedDiff "path.md" "line1\nline2\nline3\n" "line1\n"
    Assert.Contains("-line2", diff)
    Assert.Contains("-line3", diff)

[<Fact>]
let ``promote fails when generatedFiles cannot list git-tracked files outside a git repository`` () =
    let root = scratch ()
    Directory.CreateDirectory(Path.Combine(root, "agents-real")) |> ignore

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: r\n"
         + "    tier: source\n"
         + "    agent-dir: agents-real\n")

    match promote root "agents-real/x.md" with
    | Ok _ -> Assert.True(false, "expected a git ls-files failure")
    | Error e -> Assert.Contains("git ls-files failed", e)

[<Fact>]
let ``promote fails to read the mirror when it is git-tracked but missing from the working tree`` () =
    let root = scratch ()
    initPromoteGitFixture root

    writeFile
        (Path.Combine(root, "repo-config.yml"))
        ("harness:\n"
         + "  - name: opencode\n"
         + "    tier: generated\n"
         + "    agent-dir: .opencode/agents\n"
         + "    mirrors: .claude/agents\n"
         + "    ownership:\n"
         + "      - path: .opencode/agents\n"
         + "        class: generated\n"
         + "        reason: emitted from .claude/agents\n"
         + "      - path: .claude/agents\n"
         + "        class: source\n"
         + "        reason: canonical\n")

    let mirrorPath = Path.Combine(root, ".opencode", "agents", "missing-mirror.md")

    writeFile
        (Path.Combine(root, ".claude", "agents", "missing-mirror.md"))
        "---\nname: missing-mirror\ndescription: fixture\n---\nCanonical body.\n"

    writeFile mirrorPath "---\ndescription: mirror body\n---\nMirror body.\n"
    runPromoteGit root [ "add"; "-A" ]
    runPromoteGit root [ "commit"; "-q"; "-m"; "init" ]
    // Deleted from the working tree only — `git ls-files` still lists it
    // (the deletion was never staged), so `generatedFiles` still classifies
    // it, but the on-disk read fails.
    File.Delete mirrorPath

    match promote root ".opencode/agents/missing-mirror.md" with
    | Ok _ -> Assert.True(false, "expected a mirror read failure")
    | Error e -> Assert.Contains(".opencode/agents/missing-mirror.md", e)
