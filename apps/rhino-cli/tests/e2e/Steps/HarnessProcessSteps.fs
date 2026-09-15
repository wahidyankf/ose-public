module RhinoCli.Tests.E2E.Steps.HarnessProcessSteps

open System
open System.Diagnostics
open System.IO
open TickSpec
open Xunit

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/harness/agents-bindings.feature"
      "specs/apps/rhino/cli/behaviours/harness/agents-detect-duplication.feature"
      "specs/apps/rhino/cli/behaviours/harness/agents-skills-mirror.feature"
      "specs/apps/rhino/cli/behaviours/harness/agents-sync.feature"
      "specs/apps/rhino/cli/behaviours/harness/agents-validate-claude.feature"
      "specs/apps/rhino/cli/behaviours/harness/codex-binding.feature"
      "specs/apps/rhino/cli/behaviours/harness/governance-word-budget-rule.feature"
      "specs/apps/rhino/cli/behaviours/harness/harness-audit.feature"
      "specs/apps/rhino/cli/behaviours/harness/harness-catalog.feature"
      "specs/apps/rhino/cli/behaviours/harness/harness-ownership.feature"
      "specs/apps/rhino/cli/behaviours/harness/harness-sync-triage.feature"
      "specs/apps/rhino/cli/behaviours/harness/vendored-skill-preservation.feature" ]

let private repositoryRoot =
    Path.GetFullPath(Path.Combine(__SOURCE_DIRECTORY__, "..", "..", "..", "..", ".."))

let private executable =
    Path.Combine(repositoryRoot, "apps", "rhino-cli", "src", "dist", "rhino-cli-fsharp")

/// `repo-config validate` is a split command that starts `./rhino` in the temp
/// repository before its F# remainder; this no-op stand-in lets the harness
/// scenarios exercise that remainder.
let private stubRhino (root: string) =
    let path = Path.Combine(root, "rhino")
    File.WriteAllText(path, "#!/bin/sh\nexit 0\n")

    File.SetUnixFileMode(
        path,
        UnixFileMode.UserRead
        ||| UnixFileMode.UserWrite
        ||| UnixFileMode.UserExecute
        ||| UnixFileMode.GroupRead
        ||| UnixFileMode.GroupExecute
        ||| UnixFileMode.OtherRead
        ||| UnixFileMode.OtherExecute
    )

type HarnessProcessSteps() =
    let root =
        Path.Combine(Path.GetTempPath(), "rhino-harness-e2e-" + Guid.NewGuid().ToString("N"))

    let mutable exitCode = -1
    let mutable output = ""
    let mutable catalogBefore = ""
    let mutable codexAgentNames: string list = []
    let mutable roleSubfolders: string list = []

    /// One agent per grade of the four-grade vocabulary, paired with the Codex
    /// model and reasoning effort its mirror must carry.
    let mutable codexTiers: (string * string * string) list = []
    let mutable claudeRejectedAgent = ""
    let mutable claudeRejectedModel = ""
    let mutable firstConfig = ""
    let mutable secondConfig = ""
    let mutable mirrorSnapshot: (string * string) list = []
    let mutable sourceSnapshot = ""
    let mutable commandRoot = root
    let mutable cloneRoot = ""

    let write (relative: string) (body: string) =
        let path = Path.Combine(root, relative)
        Directory.CreateDirectory(Path.GetDirectoryName(path)) |> ignore
        File.WriteAllText(path, body)

    let prose prefix count =
        [ 1..count ]
        |> List.map (fun index -> sprintf "%s substantive line %02d" prefix index)
        |> String.concat "\n"

    let agent name body =
        write
            (Path.Combine(".claude", "agents", name + ".md"))
            (sprintf "---\nname: %s\ndescription: %s agent.\n---\n%s\n" name name body)

    let skill name body =
        write
            (Path.Combine(".claude", "skills", name, "SKILL.md"))
            (sprintf "---\nname: %s\ndescription: %s skill.\n---\n%s\n" name name body)

    /// The block the AI Agents Convention requires in every agent body. A
    /// fixture that omitted it would fail validation on that ground alone,
    /// masking whatever its scenario is actually about.
    let justifiedBodyFor (model: string) =
        sprintf "**Model Selection Justification**: `model: %s` — fixture.\n" model

    let justifiedBody = justifiedBodyFor "sonnet"

    let validatedAgent name =
        write
            (Path.Combine(".claude", "agents", name + ".md"))
            // `sonnet` is the execution grade, whose declared effort is `xhigh`;
            // a fixture that omitted it would contradict its own grade.
            (sprintf
                "---\nname: %s\ndescription: fixture agent\ntools: Read, Write\nmodel: sonnet\neffort: xhigh\ncolor: blue\n---\n%s"
                name
                justifiedBody)

    let validatedSkill name =
        write
            (Path.Combine(".claude", "skills", name, "SKILL.md"))
            (sprintf "---\nname: %s\ndescription: fixture skill\n---\nBody.\n" name)

    /// `harness bindings validate` resolves every agent `color:` and `model:`
    /// against a governance map, so a fixture that materializes a real agent
    /// needs both docs or it fails for an unrelated reason.
    let writeGovernanceMaps () =
        write
            (Path.Combine("repo-governance", "development", "agents", "ai-agents.md"))
            "# AI Agents\n\nColor translation: `blue`\n"

        write
            (Path.Combine("repo-governance", "development", "agents", "model-selection.md"))
            "# Model Selection\n\nCapability tiers: `sonnet`, `haiku`, `opus`\n"

    let writeBindingRegistry () =
        write
            "repo-config.yml"
            """model-grades:
  ultra: { effort: high }
  planning: { effort: high }
  execution: { effort: xhigh }
  fast: { effort: xhigh }
harness:
  - name: claude-code
    tier: source
    agent-dir: .claude/agents
    model-map: { ultra: fable, planning: opus, execution: sonnet, fast: haiku }
  - name: opencode
    tier: generated
    agent-dir: .opencode/agents
    mirrors: .claude/agents
  - name: codex
    tier: generated
    agent-dir: .codex/agents
    mirrors: .claude/agents
    config: .codex/config.toml
    model-map: { ultra: gpt-6-astra, planning: gpt-5.6-sol, execution: gpt-5.6-terra, fast: gpt-5.6-luna }
coverage:
  projects: []
"""

    /// The same registry, with the codex entry declaring one file inside its
    /// generated agent directory as `vendored` — the shape a real repository
    /// uses for a hand-maintained tooling agent that has no `.claude/agents/`
    /// source and never will.
    let writeBindingRegistryWithVendoredMirror () =
        write
            "repo-config.yml"
            """model-grades:
  ultra: { effort: high }
  planning: { effort: high }
  execution: { effort: xhigh }
  fast: { effort: xhigh }
harness:
  - name: claude-code
    tier: source
    agent-dir: .claude/agents
    model-map: { ultra: fable, planning: opus, execution: sonnet, fast: haiku }
  - name: opencode
    tier: generated
    agent-dir: .opencode/agents
    mirrors: .claude/agents
  - name: codex
    tier: generated
    agent-dir: .codex/agents
    mirrors: .claude/agents
    config: .codex/config.toml
    model-map: { ultra: gpt-6-astra, planning: gpt-5.6-sol, execution: gpt-5.6-terra, fast: gpt-5.6-luna }
    ownership:
      - { path: .codex/agents/vendored-probe.toml, class: vendored, reason: hand-maintained tooling agent }
coverage:
  projects: []
"""

    /// The grade vocabulary the Claude validator reads from `repo-config.yml`
    /// at runtime. A fixture repository without it makes the validator fail
    /// closed, so every validate-claude scenario seeds one just as a real
    /// repository carries one.
    let writeGradeRegistry () =
        write
            "repo-config.yml"
            """model-grades:
  ultra: { effort: high }
  planning: { effort: high }
  execution: { effort: xhigh }
  fast: { effort: xhigh }
harness:
  - name: claude-code
    tier: source
    agent-dir: .claude/agents
    model-map: { ultra: fable, planning: opus, execution: sonnet, fast: haiku }
"""

    let writeSkillsRegistry () =
        write
            "repo-config.yml"
            """harness:
  - { name: claude-code, tier: source, agent-dir: .claude/agents, skills-dir: .claude/skills }
  - name: opencode
    tier: generated
    agent-dir: .opencode/agents
    mirrors: .claude/agents
  - name: codex
    tier: generated
    agent-dir: .codex/agents
    mirrors: .claude/agents
    skills-dir: .agents/skills
    skills-mirrors: .claude/skills
coverage:
  projects: []
"""

    let codexAgent subfolder fileStem name description body =
        write
            (Path.Combine(".claude", "agents", subfolder, fileStem + ".md"))
            (sprintf "---\nname: %s\ndescription: %s\n---\n%s" name description body)

    /// As `codexAgent`, plus the `model` and `effort` frontmatter the Codex
    /// mirror translates onto `model` and `model_reasoning_effort`.
    let tieredCodexAgent subfolder name model effort =
        write
            (Path.Combine(".claude", "agents", subfolder, name + ".md"))
            (sprintf
                "---\nname: %s\ndescription: %s fixture\nmodel: %s\neffort: %s\n---\nBody.\n"
                name
                name
                model
                effort)

    let writeCatalog directories =
        write
            (Path.Combine("docs", "reference", "platform-bindings.md"))
            ("# Platform Bindings\n\n"
             + (directories |> List.map (sprintf "- `%s` row") |> String.concat "\n")
             + "\n")

    let emptyMirrorPair () =
        Directory.CreateDirectory(Path.Combine(root, ".claude", "agents")) |> ignore
        Directory.CreateDirectory(Path.Combine(root, ".opencode", "agents")) |> ignore

    let writeVendoredRegistry vendoredPath ownershipPath =
        write
            "repo-config.yml"
            (sprintf
                """harness:
  - name: claude-code
    tier: source
    agent-dir: .claude/agents
    skills-dir: .claude/skills
    ownership:
      - { path: .claude/, class: source, reason: canonical source }
  - name: codex
    tier: generated
    agent-dir: .codex/agents
    mirrors: .claude/agents
    skills-dir: .agents/skills
    skills-mirrors: .claude/skills
    vendored:
      - %s
    ownership:
      - { path: .codex/agents, class: generated, reason: generated agents }
      - { path: .agents/skills, class: generated, reason: mirrored skills }
      - { path: %s, class: vendored, reason: external plugin }
coverage:
  projects: []
"""
                vendoredPath
                ownershipPath)

        emptyMirrorPair ()

        write
            (Path.Combine(".agents", "skills", "vendor-plugin", "SKILL.md"))
            "---\nname: vendor-plugin\ndescription: external plugin\n---\nVendored.\n"

    let writeOwnershipRegistry emitterIsSource =
        let opencodeClass = if emitterIsSource then "source" else "generated"

        write
            "repo-config.yml"
            (sprintf
                """harness:
  - name: claude-code
    tier: source
    agent-dir: .claude/agents
    skills-dir: .claude/skills
    ownership:
      - { path: .claude/, class: source, reason: canonical source }
  - name: opencode
    tier: generated
    agent-dir: .opencode/agents
    mirrors: .claude/agents
    ownership:
      - { path: .opencode/agents, class: %s, reason: emitted agents }
  - name: codex
    tier: generated
    agent-dir: .codex/agents
    mirrors: .claude/agents
    skills-dir: .agents/skills
    skills-mirrors: .claude/skills
    vendored:
      - .agents/skills/vendor-plugin
    ownership:
      - { path: .codex/agents, class: generated, reason: emitted agents }
      - { path: .codex/config.toml, class: generated, reason: emitted configuration }
      - { path: .agents/skills, class: generated, reason: mirrored skills }
      - { path: .agents/skills/vendor-plugin, class: vendored, reason: external plugin }
coverage:
  projects: []
"""
                opencodeClass)

    let runAt workingDirectory args =
        let info =
            ProcessStartInfo(
                FileName = executable,
                WorkingDirectory = workingDirectory,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            )

        args |> List.iter info.ArgumentList.Add
        use proc = Process.Start(info)
        let stdout = proc.StandardOutput.ReadToEnd()
        let stderr = proc.StandardError.ReadToEnd()
        proc.WaitForExit()
        exitCode <- proc.ExitCode
        output <- stdout + "\n" + stderr

    let run args = runAt root args

    let gitAt workingDirectory args =
        let info =
            ProcessStartInfo(
                FileName = "git",
                WorkingDirectory = workingDirectory,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            )

        args |> List.iter info.ArgumentList.Add
        info.Environment.["GIT_CONFIG_GLOBAL"] <- "/dev/null"
        info.Environment.["GIT_CONFIG_SYSTEM"] <- "/dev/null"
        use proc = Process.Start(info)
        proc.StandardOutput.ReadToEnd() |> ignore
        let error = proc.StandardError.ReadToEnd()
        proc.WaitForExit()

        if proc.ExitCode <> 0 then
            failwithf "git %s failed: %s" (String.concat " " args) error

    let git args = gitAt root args

    let initialiseGit () =
        let info =
            ProcessStartInfo(
                FileName = "git",
                WorkingDirectory = root,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            )

        [ "init"; "-q"; "-b"; "main" ] |> List.iter info.ArgumentList.Add
        info.Environment.["GIT_CONFIG_GLOBAL"] <- "/dev/null"
        info.Environment.["GIT_CONFIG_SYSTEM"] <- "/dev/null"
        use proc = Process.Start(info)
        proc.StandardOutput.ReadToEnd() |> ignore
        let error = proc.StandardError.ReadToEnd()
        proc.WaitForExit()

        if proc.ExitCode <> 0 then
            failwithf "git init failed: %s" error

    do
        Directory.CreateDirectory(root) |> ignore
        initialiseGit ()
        stubRhino root

    let buildOwnershipFixture () =
        writeOwnershipRegistry false
        validatedAgent "alpha"
        validatedSkill "beta"

        write
            (Path.Combine("repo-governance", "development", "agents", "ai-agents.md"))
            "# AI Agents\n\nColor translation: `blue`\n"

        write
            (Path.Combine("repo-governance", "development", "agents", "model-selection.md"))
            "# Model Selection\n\nCapability tiers: `sonnet`, `haiku`, `opus`\n"

        write
            (Path.Combine(".agents", "skills", "vendor-plugin", "SKILL.md"))
            "---\nname: vendor-plugin\ndescription: external plugin\n---\nVendored.\n"

        writeCatalog [ ".claude"; ".opencode"; ".codex"; ".agents"; ".github" ]
        run [ "harness"; "bindings"; "generate" ]
        Assert.True((exitCode = 0), output)
        git [ "add"; "-A" ]

    let buildTriageFixture () =
        writeOwnershipRegistry false
        validatedAgent "alpha"

        write
            (Path.Combine(".claude", "agents", "rich.md"))
            "---\nname: rich\ndescription: Agent rich.\ntools: Read, Write\nmodel: sonnet\ncolor: blue\npermissionMode: acceptEdits\nisolation: worktree\n---\n# Body\n"

        validatedSkill "beta"

        write
            (Path.Combine(".agents", "skills", "vendor-plugin", "SKILL.md"))
            "---\nname: vendor-plugin\ndescription: external plugin\n---\nVendored.\n"

        write
            (Path.Combine("repo-governance", "development", "agents", "ai-agents.md"))
            "# AI Agents\n\nColor translation: `blue`\n"

        write
            (Path.Combine("repo-governance", "development", "agents", "model-selection.md"))
            "# Model Selection\n\nCapability tiers: `sonnet`, `haiku`, `opus`\n"

        writeCatalog [ ".claude"; ".opencode"; ".codex"; ".agents"; ".github" ]
        run [ "harness"; "bindings"; "generate" ]
        Assert.True((exitCode = 0), output)
        git [ "config"; "user.name"; "Rhino CLI E2E" ]
        git [ "config"; "user.email"; "rhino-e2e@example.invalid" ]
        git [ "add"; "-A" ]
        git [ "commit"; "-q"; "-m"; "fixture" ]

    let writeSyncAgent name description model =
        write
            (Path.Combine(".claude", "agents", name + ".md"))
            (sprintf
                "---\nname: %s\ndescription: %s\ntools: Read, Write\nmodel: %s\ncolor: blue\n---\nAgent body.\n"
                name
                description
                model)

    let prepareSyncFixture includeSkill =
        writeSkillsRegistry ()
        writeSyncAgent "fixture" "fixture" "sonnet"

        if includeSkill then
            validatedSkill "fixture-skill"

    [<Given>]
    member _.``a repository with agent and skill files whose bodies share no (\d+)-line verbatim windows``(_: int) =
        agent "alpha" (prose "alpha" 12)
        skill "beta" (prose "beta" 12)

    [<Given>]
    member _.``a repository with two agent files that share (\d+) consecutive lines verbatim``(count: int) =
        let shared = prose "shared" count
        agent "alpha" (shared + "\n" + prose "alpha" 3)
        agent "beta" (shared + "\n" + prose "beta" 3)

    [<Given>]
    member _.``a repository with an agent file whose body matches (\d+) consecutive lines of a SKILL\.md``(count: int) =
        let shared = prose "shared" count
        agent "alpha" (shared + "\n" + prose "alpha" 3)
        skill "beta" (shared + "\n" + prose "beta" 3)

    [<Given>]
    member _.``a repository where two agent files share a (\d+)-line window composed only of headings or blank lines``
        (count: int)
        =
        let shared =
            [ 1 .. count / 2 ]
            |> List.map (fun index -> sprintf "## Shared heading %d\n" index)
            |> String.concat "\n"

        agent "alpha" (shared + prose "alpha" 12)
        agent "beta" (shared + prose "beta" 12)

    [<When>]
    member _.``the developer runs agents detect-duplication``() =
        run [ "harness"; "duplication"; "validate" ]

    [<Then>]
    member _.``the command exits successfully``() = Assert.Equal(0, exitCode)

    [<Then>]
    member _.``the command exits with a failure code``() = Assert.NotEqual(0, exitCode)

    [<Then>]
    member _.``the output reports zero duplication clusters``() = Assert.Contains("0 clusters", output)

    [<Then>]
    member _.``the output identifies the duplicated cluster across both agents``() =
        Assert.Contains("alpha.md", output)
        Assert.Contains("beta.md", output)

    [<Then>]
    member _.``the output identifies the duplicated cluster across the agent and the skill``() =
        Assert.Contains("alpha.md", output)
        Assert.Contains("SKILL.md", output)

    [<Given>]
    member _.``a \.claude/ directory where all agents and skills are valid``() =
        writeGradeRegistry ()
        validatedAgent "valid-agent"
        validatedSkill "valid-skill"

    [<Given>]
    member _.``a \.claude/ directory where one agent is missing the required "description" field``() =
        writeGradeRegistry ()

        write
            (Path.Combine(".claude", "agents", "missing-description.md"))
            "---\nname: missing-description\ntools: Read\nmodel: sonnet\ncolor: blue\n---\nBody.\n"

    [<Given>]
    member _.``a \.claude/ directory where one agent declares the "fable" model alias``() =
        writeGradeRegistry ()
        validatedSkill "valid-skill"

        write
            (Path.Combine(".claude", "agents", "ultra-agent.md"))
            ("---\nname: ultra-agent\ndescription: ultra fixture\ntools: Read\nmodel: fable\neffort: high\ncolor: blue\n---\n"
             + justifiedBodyFor "fable")

    [<Given>]
    member _.``a \.claude/ directory where one agent declares the "gpt-4" model alias``() =
        writeGradeRegistry ()
        claudeRejectedAgent <- "foreign-model-agent"
        claudeRejectedModel <- "gpt-4"

        write
            (Path.Combine(".claude", "agents", "foreign-model-agent.md"))
            "---\nname: foreign-model-agent\ndescription: foreign fixture\ntools: Read\nmodel: gpt-4\ncolor: blue\n---\nBody.\n"

    /// The fixture is deliberately INVALID: a passing result would be
    /// indistinguishable from the file never having been discovered, which is
    /// exactly the false zero the recursive walk fixes.
    [<Given>]
    member _.``a \.claude/ directory where the only agent sits in a role subfolder``() =
        writeGradeRegistry ()
        claudeRejectedAgent <- "nested-agent"
        claudeRejectedModel <- "gpt-4"

        write
            (Path.Combine(".claude", "agents", "swe", "nested-agent.md"))
            "---\nname: nested-agent\ndescription: nested fixture\ntools: Read\nmodel: gpt-4\ncolor: blue\n---\nBody.\n"

    [<Given>]
    member _.``a \.claude/ directory where one agent declares no model field``() =
        writeGradeRegistry ()
        claudeRejectedAgent <- "no-model-agent"
        claudeRejectedModel <- ""

        write
            (Path.Combine(".claude", "agents", "no-model-agent.md"))
            "---\nname: no-model-agent\ndescription: no-model fixture\ntools: Read\ncolor: blue\n---\nBody.\n"

    [<Given>]
    member _.``a \.claude/ directory where one agent declares an effort its grade does not``() =
        writeGradeRegistry ()

        // `sonnet` is the execution grade, whose declared effort is `xhigh`.
        write
            (Path.Combine(".claude", "agents", "wrong-effort-agent.md"))
            "---\nname: wrong-effort-agent\ndescription: effort fixture\ntools: Read\nmodel: sonnet\neffort: low\ncolor: blue\n---\nBody.\n"

    /// A registry whose claude-code entry declares no `model-map` leaves the
    /// validator with an empty vocabulary — the state it must refuse rather
    /// than wave through.
    [<Given>]
    member _.``a \.claude/ directory whose repo-config\.yml declares no model-map for claude-code``() =
        write "repo-config.yml" "harness:\n  - { name: claude-code, tier: source, agent-dir: .claude/agents }\n"
        validatedAgent "no-vocabulary-agent"

    [<Given>]
    member _.``a \.claude/ directory where one agent's body states no model selection justification``() =
        writeGradeRegistry ()

        // Conforming frontmatter, a body that argues nothing.
        write
            (Path.Combine(".claude", "agents", "unargued-agent.md"))
            "---\nname: unargued-agent\ndescription: unargued fixture\ntools: Read\nmodel: sonnet\neffort: xhigh\ncolor: blue\n---\nBody.\n"

    [<Given>]
    member _.``a \.claude/ directory where one agent's justification names a grade its frontmatter does not``() =
        writeGradeRegistry ()

        // Conforming frontmatter, a block arguing for a grade it does not declare.
        write
            (Path.Combine(".claude", "agents", "drifted-agent.md"))
            ("---\nname: drifted-agent\ndescription: drifted fixture\ntools: Read\nmodel: opus\neffort: high\ncolor: blue\n---\n"
             + justifiedBodyFor "sonnet")

    [<Given>]
    member _.``a \.claude/ directory containing two agent files declaring the same name``() =
        writeGradeRegistry ()

        for suffix in [ "a"; "b" ] do
            write
                (Path.Combine(".claude", "agents", "duplicate-" + suffix + ".md"))
                "---\nname: duplicate-name\ndescription: duplicate fixture\ntools: Read\nmodel: sonnet\ncolor: blue\n---\nBody.\n"

    [<Given>]
    member _.``a \.claude/ directory where agents are valid but skills have issues``() =
        writeGradeRegistry ()
        validatedAgent "valid-agent"

        Directory.CreateDirectory(Path.Combine(root, ".claude", "skills", "broken-skill"))
        |> ignore

    [<Given>]
    member _.``a \.claude/ directory where skills are valid but agents have issues``() =
        writeGradeRegistry ()
        validatedSkill "valid-skill"

        write
            (Path.Combine(".claude", "agents", "broken-agent.md"))
            "---\nname: broken-agent\ntools: Read\nmodel: sonnet\ncolor: blue\n---\nBody.\n"

    [<When>]
    member _.``the developer runs agents validate-claude``() = run [ "harness"; "claude"; "validate" ]

    [<When>]
    member _.``the developer runs agents validate-claude with the --agents-only flag``() =
        run [ "harness"; "claude"; "validate"; "--agents-only" ]

    [<When>]
    member _.``the developer runs agents validate-claude with the --skills-only flag``() =
        run [ "harness"; "claude"; "validate"; "--skills-only" ]

    [<Then>]
    member _.``the output reports all checks as passing``() = Assert.Contains("PASSED", output)

    [<Then>]
    member _.``the output identifies the agent and the missing field``() =
        Assert.Contains("missing-description", output)
        Assert.Contains("description", output)

    [<Then>]
    member _.``the output reports the rejected model value``() =
        Assert.Contains(claudeRejectedAgent, output)
        Assert.Contains("Valid Model", output)

        if claudeRejectedModel <> "" then
            Assert.Contains(claudeRejectedModel, output)

    [<Then>]
    member _.``the output identifies the nested agent``() = Assert.Contains("nested-agent", output)

    [<Then>]
    member _.``the output reports the effort the grade declares``() =
        Assert.Contains("wrong-effort-agent", output)
        Assert.Contains("effort: xhigh (the execution grade)", output)

    [<Then>]
    member _.``the output reports the grade the justification argues for``() =
        Assert.Contains("drifted-agent", output)
        Assert.Contains("argues for `sonnet`", output)

    [<Then>]
    member _.``the output reports the missing justification block``() =
        Assert.Contains("unargued-agent", output)
        Assert.Contains("no justification block", output)

    [<Then>]
    member _.``the output reports that no grade vocabulary is declared``() =
        Assert.Contains("no grade vocabulary declared", output)

    [<Then>]
    member _.``the output reports the duplicate agent name``() =
        Assert.Contains("duplicate-name", output)

    [<Given>]
    member _.``a repository with no \.claude or \.opencode agent directories``() =
        Assert.False(Directory.Exists(Path.Combine(root, ".claude", "agents")))
        Assert.False(Directory.Exists(Path.Combine(root, ".opencode", "agents")))

    [<When>]
    member _.``the developer runs "rhino-cli harness audit"``() = run [ "harness"; "audit" ]

    [<Then>]
    member _.``the output names the failing "validate-claude" harness validator``() =
        Assert.Contains("validate-claude", output)

    [<Given>]
    member _.``each harness entry in repo-config.yml carries catalog fields including display name, instruction surfaces, agent surface, skills surface, and status``
        ()
        =
        write
            "repo-config.yml"
            """harness-catalog:
  document: docs/reference/platform-bindings.md
  verified: 2026-09-05
harness:
  - name: alpha
    tier: source
    agent-dir: .alpha/agents
    catalog:
      platform: Alpha
      reads-agents-md: Yes
      instruction-surface: ALPHA.md
      mcp-config: alpha.json
      agent-surface: .alpha/agents
      skills-surface: .alpha/skills
      status: Active
  - name: beta
    tier: generated
    agent-dir: .beta/agents
    mirrors: .alpha/agents
    catalog:
      platform: Beta
      reads-agents-md: Yes
      instruction-surface: BETA.md
      mcp-config: beta.json
      agent-surface: .beta/agents
      skills-surface: .beta/skills
      status: Active
coverage:
  projects: []
"""

        catalogBefore <-
            "# Catalog\n\nProse before.\n<!-- >>> rhino-cli generated: harness catalog - do not edit inside this region -->\n<!-- <<< rhino-cli generated: harness catalog -->\n\nProse after.\n"

        write (Path.Combine("docs", "reference", "platform-bindings.md")) catalogBefore

    [<Given>]
    member this.``a freshly generated catalog with a clean git diff``() =
        this.``each harness entry in repo-config.yml carries catalog fields including display name, instruction surfaces, agent surface, skills surface, and status`` ()

        run [ "harness"; "catalog"; "generate" ]
        Assert.Equal(0, exitCode)

    [<When>]
    member _.``rhino-cli harness catalog generate runs``() =
        run [ "harness"; "catalog"; "generate" ]

    [<When>]
    member _.``one cell inside the generated region is edited by hand``() =
        let path = Path.Combine(root, "docs", "reference", "platform-bindings.md")
        File.WriteAllText(path, File.ReadAllText(path).Replace("| Alpha", "| Hand edit"))
        run [ "harness"; "catalog"; "validate" ]

    [<Then>]
    member _.``docs/reference/platform-bindings.md contains one table row per registry entry between the generated-region markers``
        ()
        =
        let body =
            File.ReadAllText(Path.Combine(root, "docs", "reference", "platform-bindings.md"))

        Assert.Contains("| Alpha", body)
        Assert.Contains("| Beta", body)

    [<Then>]
    member _.``prose outside those markers is byte-identical to its pre-run content``() =
        let body =
            File.ReadAllText(Path.Combine(root, "docs", "reference", "platform-bindings.md"))

        Assert.Contains("Prose before.", body)
        Assert.Contains("Prose after.", body)

    [<Then>]
    member _.``rhino-cli harness catalog validate exits non-zero naming the drifted region``() =
        Assert.NotEqual(0, exitCode)
        Assert.Contains("catalog", output, StringComparison.OrdinalIgnoreCase)

    [<Then>]
    member _.``it exits 0 after rhino-cli harness catalog generate is re-run``() =
        run [ "harness"; "catalog"; "generate" ]
        Assert.Equal(0, exitCode)

    [<Given>]
    member _.``a repository whose \.claude/agents/ directory holds one agent under a role subfolder``() =
        writeBindingRegistry ()
        codexAgent "reviewers" "role-agent" "role-agent" "Role fixture agent." "Body instructions.\n"
        codexAgentNames <- [ "role-agent" ]

    [<Given>]
    member _.``a repository whose \.claude/agents/ holds two agents in different role subfolders whose name frontmatter differs from their filename``
        ()
        =
        writeBindingRegistry ()
        codexAgent "reviewers" "reviewer-file" "reviewer-identity" "Reviewer fixture." "Reviewer body.\n"
        codexAgent "makers" "maker-file" "maker-identity" "Maker fixture." "Maker body.\n"
        codexAgentNames <- [ "reviewer-identity"; "maker-identity" ]
        roleSubfolders <- [ "reviewers"; "makers" ]

    [<Given>]
    member _.``a repository whose \.claude/agents/ holds one agent per model tier``() =
        writeBindingRegistry ()

        let tiers =
            [ "ultra-agent", "fable", "high", "gpt-6-astra", "high"
              "planning-agent", "opus", "high", "gpt-5.6-sol", "high"
              "execution-agent", "sonnet", "xhigh", "gpt-5.6-terra", "xhigh"
              "fast-agent", "haiku", "max", "gpt-5.6-luna", "xhigh" ]

        for name, model, effort, _, _ in tiers do
            tieredCodexAgent "roles" name model effort

        codexAgentNames <- tiers |> List.map (fun (name, _, _, _, _) -> name)

        codexTiers <-
            tiers
            |> List.map (fun (name, _, _, codexModel, codexEffort) -> name, codexModel, codexEffort)

    [<Given>]
    member _.``a repository whose \.claude/agents/ holds one agent declaring model inherit``() =
        writeBindingRegistry ()
        tieredCodexAgent "roles" "inheriting" "inherit" "high"
        codexAgentNames <- [ "inheriting" ]

    [<Given>]
    member _.``a repository whose \.codex/config\.toml carries hand-maintained mcp_servers, features, and ci-monitor-subagent tables``
        ()
        =
        writeBindingRegistry ()
        codexAgent "makers" "fixture-agent" "fixture-agent" "Fixture agent." "Body.\n"
        codexAgentNames <- [ "fixture-agent" ]

        write
            (Path.Combine(".codex", "config.toml"))
            "[mcp_servers.example]\ncommand = \"example-server\"\n\n[features]\nmulti_agent = true\n\n[ci-monitor-subagent]\nenabled = true\n"

    [<When>]
    member _.``the developer runs harness bindings generate``() =
        run [ "harness"; "bindings"; "generate" ]

    [<When>]
    member _.``the developer runs harness bindings generate twice``() =
        run [ "harness"; "bindings"; "generate" ]
        firstConfig <- File.ReadAllText(Path.Combine(root, ".codex", "config.toml"))
        run [ "harness"; "bindings"; "generate" ]
        secondConfig <- File.ReadAllText(Path.Combine(root, ".codex", "config.toml"))

    [<Then>]
    member _.``\.codex/agents/ holds exactly one TOML file named for that agent``() =
        let files =
            Directory.GetFiles(Path.Combine(root, ".codex", "agents"))
            |> Array.map Path.GetFileName

        Assert.Equal<string[]>([| codexAgentNames.Head + ".toml" |], files)

    [<Then>]
    member _.``the emitted Codex agent declares name, description, and developer_instructions``() =
        let body =
            File.ReadAllText(Path.Combine(root, ".codex", "agents", codexAgentNames.Head + ".toml"))

        Assert.Contains("name = \"", body)
        Assert.Contains("description = \"", body)
        Assert.Contains("developer_instructions = \"\"\"", body)

    [<Then>]
    member _.``the emitted Codex agent declares no model field``() =
        let body =
            File.ReadAllText(Path.Combine(root, ".codex", "agents", codexAgentNames.Head + ".toml"))

        Assert.DoesNotContain("model = ", body)

    [<Then>]
    member _.``each emitted Codex agent declares the Codex model at the same tier``() =
        for name, codexModel, _ in codexTiers do
            let body = File.ReadAllText(Path.Combine(root, ".codex", "agents", name + ".toml"))

            Assert.Contains(sprintf "model = \"%s\"" codexModel, body)

    [<Then>]
    member _.``each emitted Codex agent declares model_reasoning_effort matching its Claude effort``() =
        for name, _, codexEffort in codexTiers do
            let body = File.ReadAllText(Path.Combine(root, ".codex", "agents", name + ".toml"))

            Assert.Contains(sprintf "model_reasoning_effort = \"%s\"" codexEffort, body)

    [<Then>]
    member _.``\.codex/agents/ holds one flat TOML file per agent keyed on the name frontmatter``() =
        let files =
            Directory.GetFiles(Path.Combine(root, ".codex", "agents"))
            |> Array.map Path.GetFileName
            |> Array.sort

        let expected =
            codexAgentNames
            |> List.map (fun name -> name + ".toml")
            |> List.sort
            |> Array.ofList

        Assert.Equal<string[]>(expected, files)

    [<Then>]
    member _.``no emitted filename repeats a role subfolder name``() =
        let files =
            Directory.GetFiles(Path.Combine(root, ".codex", "agents"))
            |> Array.map Path.GetFileName

        roleSubfolders
        |> List.iter (fun role -> Assert.DoesNotContain(role + ".toml", files))

    [<Then>]
    member _.``\.codex/config\.toml declares a generated agents table for the fixture agent``() =
        Assert.Contains(sprintf "[agents.%s]" codexAgentNames.Head, secondConfig)

    [<Then>]
    member _.``the hand-maintained mcp_servers, features, and ci-monitor-subagent tables are unchanged``() =
        Assert.Contains("[mcp_servers.example]", secondConfig)
        Assert.Contains("[features]", secondConfig)
        Assert.Contains("[ci-monitor-subagent]", secondConfig)

    [<Then>]
    member _.``the second run left \.codex/config\.toml byte-identical to the first``() =
        Assert.Equal(firstConfig, secondConfig)

    [<Given>]
    member _.``a repo with instruction files within the configured budgets``() =
        write
            "repo-config.yml"
            """governance-word-budget:
  surfaces:
    - { glob: AGENTS.md, target: 100, warn: 120, fail: 140 }
  resolved-tree: { root: CLAUDE.md, target: 200, warn: 220, fail: 240 }
coverage:
  projects: []
"""

        write "AGENTS.md" "# Fixture instructions\n\nKeep the boundary small.\n"
        write "CLAUDE.md" "# Fixture import\n"

    [<When>]
    member _.``the developer runs "rhino-cli repo-governance audit" with JSON output``() =
        run [ "repo-governance"; "audit"; "--output"; "json" ]

    [<Then>]
    member _.``the envelope schema is "rhino-cli/repo-governance-audit/v1"``() =
        Assert.Contains("rhino-cli/repo-governance-audit/v1", output)

    [<Then>]
    member _.``"result.categories" contains a category named "governance-word-budget"``() =
        Assert.Contains("governance-word-budget", output)

    [<Given>]
    member _.``the repo-config.yml harness registry declares codex``() = writeBindingRegistry ()

    [<Given>]
    member _.``the repo-config.yml harness registry does not declare cursor``() = writeBindingRegistry ()

    [<When>]
    member _.``the developer runs harness bindings generate for codex``() =
        run [ "harness"; "bindings"; "generate"; "--harness"; "codex" ]

    [<When>]
    member _.``the developer runs harness bindings generate for cursor``() =
        run [ "harness"; "bindings"; "generate"; "--harness"; "cursor" ]

    [<Then>]
    member _.``the harness name is not rejected as unknown``() =
        Assert.DoesNotContain("unknown harness", output, StringComparison.OrdinalIgnoreCase)

    [<Then>]
    member _.``the error names the registry-derived accepted set``() =
        Assert.Contains("claude-code", output)
        Assert.Contains("codex", output)

    [<Given>]
    member _.``a repository whose generated binding files match the generated content``() =
        writeBindingRegistry ()
        emptyMirrorPair ()
        Directory.CreateDirectory(Path.Combine(root, ".github")) |> ignore
        Directory.CreateDirectory(Path.Combine(root, ".codex")) |> ignore

    [<Given>]
    member _.``the platform-bindings catalog references every present binding directory``() =
        writeCatalog [ ".claude"; ".opencode"; ".codex"; ".agents"; ".github" ]

    [<Given>]
    member _.``a repository with a known binding directory that the platform-bindings catalog does not reference``() =
        writeBindingRegistry ()
        emptyMirrorPair ()
        Directory.CreateDirectory(Path.Combine(root, ".github")) |> ignore
        writeCatalog [ ".claude"; ".opencode" ]

    [<Given>]
    member _.``a repository where some known binding directories do not exist on disk``() =
        writeBindingRegistry ()
        emptyMirrorPair ()
        writeCatalog [ ".claude"; ".opencode" ]

    [<When>]
    member _.``the developer runs harness bindings validate``() =
        run [ "harness"; "bindings"; "validate" ]

    [<Then>]
    member _.``the output reports all binding checks as passing``() = Assert.Contains("PASSED", output)

    [<Then>]
    member _.``the output identifies the binding directory missing a catalog row``() =
        Assert.Contains(".github", output)
        Assert.Contains("catalog", output, StringComparison.OrdinalIgnoreCase)

    [<Then>]
    member _.``no catalog row is required for the absent binding directories``() = Assert.Equal(0, exitCode)

    /// The `.toml` mirror is the published binary's own output for a real
    /// source agent rather than a stub: since the orphan check landed, a mirror
    /// with no `.claude/agents/` source fails validation.
    [<Given>]
    member _.``a repository whose \.codex/agents directory holds a standalone \.toml agent file``() =
        writeBindingRegistry ()
        emptyMirrorPair ()
        Directory.CreateDirectory(Path.Combine(root, ".github")) |> ignore
        writeCatalog [ ".claude"; ".opencode"; ".codex"; ".agents"; ".github" ]
        writeGovernanceMaps ()
        validatedAgent "probe-maker"
        run [ "harness"; "bindings"; "generate" ] |> ignore

    /// The `.md` file shares a real source agent's stem, so it is a wrong
    /// extension rather than an orphan.
    [<Given>]
    member _.``a repository whose \.codex/agents directory holds a \.md agent file``() =
        writeBindingRegistry ()
        emptyMirrorPair ()
        Directory.CreateDirectory(Path.Combine(root, ".github")) |> ignore
        writeCatalog [ ".claude"; ".opencode"; ".codex"; ".agents"; ".github" ]
        writeGovernanceMaps ()
        validatedAgent "probe-maker"
        run [ "harness"; "bindings"; "generate" ] |> ignore
        write (Path.Combine(".codex", "agents", "probe-maker.md")) "# probe\n"

    [<Given>]
    member _.``a repository whose generated agent directory holds a mirror with no source agent``() =
        writeBindingRegistry ()
        emptyMirrorPair ()
        Directory.CreateDirectory(Path.Combine(root, ".github")) |> ignore
        writeCatalog [ ".claude"; ".opencode"; ".codex"; ".agents"; ".github" ]
        writeGovernanceMaps ()
        validatedAgent "probe-maker"
        run [ "harness"; "bindings"; "generate" ] |> ignore

        let generated =
            File.ReadAllText(Path.Combine(root, ".codex", "agents", "probe-maker.toml"))

        write (Path.Combine(".codex", "agents", "repo-probe-maker.toml")) generated

    [<Given>]
    member _.``a repository whose generated agent mirrors each have a source agent``() =
        writeBindingRegistry ()
        emptyMirrorPair ()
        Directory.CreateDirectory(Path.Combine(root, ".github")) |> ignore
        writeCatalog [ ".claude"; ".opencode"; ".codex"; ".agents"; ".github" ]
        writeGovernanceMaps ()
        validatedAgent "probe-maker"
        run [ "harness"; "bindings"; "generate" ] |> ignore

    /// The vendored file carries a stem no source agent has, so it would be
    /// reported as an orphan if the declaration were ignored.
    [<Given>]
    member _.``a repository whose generated agent directory holds a vendored mirror with no source agent``() =
        writeBindingRegistryWithVendoredMirror ()
        emptyMirrorPair ()
        Directory.CreateDirectory(Path.Combine(root, ".github")) |> ignore
        writeCatalog [ ".claude"; ".opencode"; ".codex"; ".agents"; ".github" ]
        writeGovernanceMaps ()
        validatedAgent "probe-maker"
        run [ "harness"; "bindings"; "generate" ] |> ignore

        let generated =
            File.ReadAllText(Path.Combine(root, ".codex", "agents", "probe-maker.toml"))

        write (Path.Combine(".codex", "agents", "vendored-probe.toml")) generated

    [<Then>]
    member _.``the output names the orphaned mirror and the source that no longer exists``() =
        Assert.Contains("Mirror Orphans: .codex/agents", output)
        Assert.Contains("repo-probe-maker.toml", output)
        Assert.Contains("no .claude/agents/ source explains it", output)

    [<Then>]
    member _.``the output names \.toml as the officially-correct extension``() =
        Assert.Contains("probe-maker.md", output)
        Assert.Contains(".toml", output)

    [<Given>]
    member _.``the harness registry declares an agent-directory mirror for the OpenCode entry``() =
        writeBindingRegistry ()

    [<When>]
    member _.``the codex entry is updated to declare \.agents/skills as a mirror of \.claude/skills``() =
        writeSkillsRegistry ()
        run [ "repo-config"; "validate" ]

    [<Then>]
    member _.``rhino-cli repo-config validate exits 0 with both kinds of mirror relationship declared: agent directories and skill directories``
        ()
        =
        Assert.Equal(0, exitCode)

    [<Then>]
    member _.``rhino-cli harness bindings generate emits the \.agents/skills mirror without a new command-line flag``
        ()
        =
        validatedSkill "fixture-skill"
        emptyMirrorPair ()
        run [ "harness"; "bindings"; "generate" ]
        Assert.True((exitCode = 0), output)
        Assert.True(File.Exists(Path.Combine(root, ".agents", "skills", "fixture-skill", "SKILL.md")))

    [<Given>]
    member _.``\.claude/skills/ holds the repository's canonical skill directories and every one of them is tracked``
        ()
        =
        writeSkillsRegistry ()
        emptyMirrorPair ()
        validatedSkill "alpha-skill"
        validatedSkill "beta-skill"

    [<When>]
    member _.``rhino-cli harness bindings generate runs``() =
        run [ "harness"; "bindings"; "generate" ]

    [<Then>]
    member _.``\.agents/skills/ contains one real directory per \.claude/skills/ skill``() =
        for name in [ "alpha-skill"; "beta-skill" ] do
            Assert.True(File.Exists(Path.Combine(root, ".agents", "skills", name, "SKILL.md")))

    [<Then>]
    member _.``find \.agents/skills -type l returns zero results, proving no symlink was created in either direction``
        ()
        =
        let entries =
            Directory.GetFileSystemEntries(Path.Combine(root, ".agents", "skills"), "*", SearchOption.AllDirectories)

        Assert.All(
            entries,
            fun path ->
                let info: FileSystemInfo =
                    if Directory.Exists(path) then
                        DirectoryInfo(path)
                    else
                        FileInfo(path)

                Assert.Null(info.LinkTarget)
        )

    [<Given>]
    member _.``a clean tree immediately after rhino-cli harness bindings generate``() =
        writeSkillsRegistry ()
        emptyMirrorPair ()
        validatedSkill "alpha-skill"
        writeCatalog [ ".claude"; ".opencode"; ".codex"; ".agents"; ".github" ]
        run [ "harness"; "bindings"; "generate" ]

        mirrorSnapshot <-
            Directory.GetFiles(Path.Combine(root, ".agents", "skills"), "*", SearchOption.AllDirectories)
            |> Array.map (fun path -> Path.GetRelativePath(root, path), File.ReadAllText(path))
            |> Array.toList

    [<When>]
    member _.``the command runs a second time``() =
        run [ "harness"; "bindings"; "generate" ]

    [<Then>]
    member _.``git diff --quiet \.agents/ exits 0, proving no churn``() =
        let after =
            Directory.GetFiles(Path.Combine(root, ".agents", "skills"), "*", SearchOption.AllDirectories)
            |> Array.map (fun path -> Path.GetRelativePath(root, path), File.ReadAllText(path))
            |> Array.toList

        Assert.Equal<(string * string) list>(mirrorSnapshot, after)

    [<Then>]
    member _.``after a single character is changed in one mirrored file, rhino-cli harness bindings validate exits non-zero naming that file, where it exited 0 before the edit``
        ()
        =
        let path = Path.Combine(root, ".agents", "skills", "alpha-skill", "SKILL.md")
        File.AppendAllText(path, "hand edit\n")
        run [ "harness"; "bindings"; "validate" ]
        Assert.NotEqual(0, exitCode)
        Assert.Contains("alpha-skill", output)

    [<Given>]
    member _.``every \.agents/skills/ directory without a \.claude/skills/ source is one the emitter cannot regenerate``
        ()
        =
        writeVendoredRegistry ".agents/skills/vendor-plugin" ".agents/skills/vendor-plugin"
        Directory.CreateDirectory(Path.Combine(root, ".claude", "skills")) |> ignore
        writeCatalog [ ".claude"; ".opencode"; ".agents" ]

    [<When>]
    member _.``the harness registry declares each of those directories as vendored``() =
        run [ "repo-config"; "validate" ]

    [<Then>]
    member _.``rhino-cli repo-config validate exits 0``() = Assert.Equal(0, exitCode)

    [<Then>]
    member _.``an undeclared directory appearing under \.agents/skills/ with no \.claude/skills/ counterpart makes rhino-cli harness bindings validate exit non-zero, where an ownership heuristic would have silently deleted it instead``
        ()
        =
        write
            (Path.Combine(".agents", "skills", "undeclared", "SKILL.md"))
            "---\nname: undeclared\ndescription: undeclared fixture\n---\nBody.\n"

        run [ "harness"; "bindings"; "validate" ]
        Assert.NotEqual(0, exitCode)
        Assert.True(output.Contains("undeclared", StringComparison.Ordinal), output)

    [<Given>]
    member _.``a skill directory is renamed under \.claude/skills/ so its old mirror becomes stale``() =
        writeVendoredRegistry ".agents/skills/vendor-plugin" ".agents/skills/vendor-plugin"
        validatedSkill "new-skill"

        write
            (Path.Combine(".agents", "skills", "old-skill", "SKILL.md"))
            "---\nname: old-skill\ndescription: stale mirror\n---\nOld.\n"

    [<Then>]
    member _.``the stale mirrored directory is removed and the new one created``() =
        Assert.False(Directory.Exists(Path.Combine(root, ".agents", "skills", "old-skill")))
        Assert.True(File.Exists(Path.Combine(root, ".agents", "skills", "new-skill", "SKILL.md")))

    [<Then>]
    member _.``every vendored directory is still present, proving cleanup is scoped to emitter-owned paths``() =
        Assert.True(File.Exists(Path.Combine(root, ".agents", "skills", "vendor-plugin", "SKILL.md")))

    [<Given>]
    member _.``a harness declares \.agents/skills/vendor-plugin as ownership class vendored but its vendored list names a different value for it``
        ()
        =
        writeVendoredRegistry ".agents/skills/different" ".agents/skills/vendor-plugin"

    [<When>]
    member _.``rhino-cli harness bindings generate runs against that mismatched registry``() =
        run [ "harness"; "bindings"; "generate" ]

    [<Then>]
    member _.``the run fails loudly instead of deleting the directory the ownership record protects``() =
        Assert.NotEqual(0, exitCode)
        Assert.True(Directory.Exists(Path.Combine(root, ".agents", "skills", "vendor-plugin")))

    [<Given>]
    member _.``a harness's vendored list names a typo'd path with no ownership record for the real directory it was meant to protect``
        ()
        =
        writeVendoredRegistry ".agents/skills/vender-plugin" ".agents/skills/vender-plugin"

    [<When>]
    member _.``rhino-cli harness bindings generate runs against that under-declared registry``() =
        run [ "harness"; "bindings"; "generate" ]

    [<Then>]
    member _.``the run fails loudly instead of deleting the real directory the typo'd entry was meant to protect``() =
        Assert.NotEqual(0, exitCode)
        Assert.True(Directory.Exists(Path.Combine(root, ".agents", "skills", "vendor-plugin")))

    [<Given>]
    member _.``a fixture repository whose binding files are all declared generated, vendored, or source``() =
        buildOwnershipFixture ()

    [<When>]
    member _.``a tracked file with no declared class is introduced under a binding directory``() =
        write (Path.Combine(".opencode", "probe-unowned.md")) "unclassified\n"
        git [ "add"; ".opencode/probe-unowned.md" ]
        run [ "harness"; "ownership"; "validate" ]

    [<Then>]
    member _.``rhino-cli harness ownership validate exits non-zero naming that exact file as unclassified``() =
        Assert.NotEqual(0, exitCode)
        Assert.Contains(".opencode/probe-unowned.md", output)

    [<Then>]
    member _.``it exits 0 once the file is removed, proving the check is falsifiable in both directions rather than always-green``
        ()
        =
        git [ "rm"; "-q"; "-f"; ".opencode/probe-unowned.md" ]
        run [ "harness"; "ownership"; "validate" ]
        Assert.True((exitCode = 0), output)

    [<Given>]
    member _.``a fixture repository whose mirror trees are declared generated``() = buildOwnershipFixture ()

    [<When>]
    member _.``one emitted file is hand-edited``() =
        File.AppendAllText(Path.Combine(root, ".opencode", "agents", "alpha.md"), "hand edit\n")
        run [ "harness"; "ownership"; "validate" ]

    [<Then>]
    member _.``rhino-cli harness ownership validate exits non-zero naming the drifted generated file``() =
        Assert.NotEqual(0, exitCode)
        Assert.Contains("alpha", output)

    [<Then>]
    member _.``it exits 0 after regeneration restores the canonical bytes``() =
        run [ "harness"; "bindings"; "generate" ]
        run [ "harness"; "ownership"; "validate" ]
        Assert.True((exitCode = 0), output)

    [<Given>]
    member _.``a fixture repository declaring one vendored skill directory with a recorded reason``() =
        buildOwnershipFixture ()

    [<When>]
    member _.``the vendored file is hand-edited``() =
        File.AppendAllText(Path.Combine(root, ".agents", "skills", "vendor-plugin", "SKILL.md"), "external edit\n")
        run [ "harness"; "ownership"; "validate" ]

    [<Then>]
    member _.``rhino-cli harness ownership validate still exits 0, because a vendored path has no in-repo source to compare against``
        ()
        =
        Assert.True((exitCode = 0), output)

    [<Then>]
    member _.``the vendored file is still present, so nothing deleted it in passing``() =
        Assert.True(File.Exists(Path.Combine(root, ".agents", "skills", "vendor-plugin", "SKILL.md")))

    [<Given>]
    member _.``a fixture repository declaring the \.claude tree as source``() =
        buildOwnershipFixture ()
        sourceSnapshot <- File.ReadAllText(Path.Combine(root, ".claude", "agents", "alpha.md"))

    [<Then>]
    member _.``every declared source path is byte-identical to what it was before the run``() =
        Assert.Equal(sourceSnapshot, File.ReadAllText(Path.Combine(root, ".claude", "agents", "alpha.md")))

    [<Then>]
    member _.``a registry declaring an emitter output directory as source makes the generator refuse rather than silently succeed``
        ()
        =
        writeOwnershipRegistry true
        run [ "harness"; "bindings"; "generate" ]
        Assert.NotEqual(0, exitCode)
        Assert.Contains("source", output)

    [<Given>]
    member _.``this repository's registry declares an ownership class for every binding path``() =
        runAt repositoryRoot [ "harness"; "ownership"; "validate"; "--verbose" ]
        Assert.True((exitCode = 0), output)

    [<When>]
    member _.``rhino-cli harness ownership validate runs against it``() =
        runAt repositoryRoot [ "harness"; "ownership"; "validate"; "--verbose" ]

    [<Then>]
    member _.``it exits 0``() = Assert.True((exitCode = 0), output)

    [<Then>]
    member _.``it reports a per-class count that sums to the total tracked binding-file count``() =
        Assert.Contains("tracked binding file", output)

    [<Given>]
    member _.``every generated mirror matches what the generator produces from canonical source``() =
        buildTriageFixture ()

    [<Given>]
    member _.``a fixture repository cloned fresh, so every file's modification time is its checkout time and carries no information``
        ()
        =
        buildTriageFixture ()
        cloneRoot <- root + "-clone"
        gitAt repositoryRoot [ "clone"; "-q"; root; cloneRoot ]
        commandRoot <- cloneRoot

    [<Given>]
    member _.``a tree that reported zero divergences and then had exactly one generated mirror hand-edited``() =
        buildTriageFixture ()
        File.AppendAllText(Path.Combine(root, ".opencode", "agents", "alpha.md"), "mirror edit\n")

    [<Given>]
    member _.``a canonical source agent was hand-edited and the generator has not been run since``() =
        buildTriageFixture ()
        File.AppendAllText(Path.Combine(root, ".claude", "agents", "alpha.md"), "canonical edit\n")

    [<Given>]
    member _.``a canonical source file and its corresponding generated mirror have both been hand-edited``() =
        buildTriageFixture ()
        sourceSnapshot <- File.ReadAllText(Path.Combine(root, ".claude", "agents", "alpha.md"))
        File.AppendAllText(Path.Combine(root, ".claude", "agents", "alpha.md"), "canonical edit\n")
        File.AppendAllText(Path.Combine(root, ".opencode", "agents", "alpha.md"), "mirror edit\n")

    [<Given>]
    member _.``a generated OpenCode mirror carries a hand edit worth keeping``() =
        buildTriageFixture ()
        sourceSnapshot <- File.ReadAllText(Path.Combine(root, ".claude", "agents", "alpha.md"))
        File.AppendAllText(Path.Combine(root, ".opencode", "agents", "alpha.md"), "review me\n")

    [<Given>]
    member _.``a canonical agent carrying fields the editing harness's field policy drops with a warning``() =
        buildTriageFixture ()
        File.AppendAllText(Path.Combine(root, ".opencode", "agents", "rich.md"), "review me\n")

    [<Given>]
    member _.``a generated skills mirror carries a hand edit``() =
        buildTriageFixture ()
        File.AppendAllText(Path.Combine(root, ".agents", "skills", "beta", "SKILL.md"), "review me\n")

    [<Given>]
    member _.``a vendored skill directory declared in the registry and a generated mirror file beside it``() =
        buildTriageFixture ()

    [<Given>]
    member _.``a generated mirror carries a hand edit``() =
        buildTriageFixture ()
        File.AppendAllText(Path.Combine(root, ".opencode", "agents", "alpha.md"), "mirror edit\n")

    [<Given>]
    member _.``this repository's generated mirrors were produced by the current generator``() =
        runAt repositoryRoot [ "harness"; "bindings"; "validate" ]
        Assert.True((exitCode = 0), output)

    [<When>]
    member _.``rhino-cli harness sync triage runs``() =
        runAt commandRoot [ "harness"; "sync"; "triage" ]

    [<When>]
    member _.``rhino-cli harness sync triage runs against it``() =
        runAt repositoryRoot [ "harness"; "sync"; "triage" ]

    [<When>]
    member _.``rhino-cli harness sync promote runs against that mirror``() =
        run [ "harness"; "sync"; "promote"; "--from"; ".opencode/agents/alpha.md" ]

    [<When>]
    member _.``rhino-cli harness sync promote runs against that harness's mirror``() =
        run [ "harness"; "sync"; "promote"; "--from"; ".opencode/agents/rich.md" ]

    [<When>]
    member _.``rhino-cli harness sync promote runs against that mirror, without triage having run first``() =
        run [ "harness"; "sync"; "promote"; "--from"; ".opencode/agents/alpha.md" ]

    [<When>]
    member _.``rhino-cli harness sync promote runs against that skills mirror``() =
        run [ "harness"; "sync"; "promote"; "--from"; ".agents/skills/beta/SKILL.md" ]

    [<When>]
    member _.``the vendored file is hand-edited and rhino-cli harness sync triage runs``() =
        File.AppendAllText(Path.Combine(root, ".agents", "skills", "vendor-plugin", "SKILL.md"), "external edit\n")
        run [ "harness"; "sync"; "triage" ]

    [<When>]
    member _.``rhino-cli harness bindings validate runs without triage``() =
        run [ "harness"; "bindings"; "validate" ]

    [<Then>]
    member _.``it exits 0 reporting zero divergences``() =
        Assert.Equal(0, exitCode)
        Assert.Contains("0 divergence", output)

    [<Then>]
    member _.``it exits 0 reporting zero divergences, because detection compares content and never a clock``() =
        Assert.Equal(0, exitCode)
        Assert.Contains("0 divergence", output)

    [<Then>]
    member _.``no clock-reading call appears anywhere on the detection path``() =
        Assert.DoesNotContain("timestamp", output, StringComparison.OrdinalIgnoreCase)

    [<Then>]
    member _.``it exits non-zero naming that mirror as the hand-edited side and naming the promote command``() =
        Assert.NotEqual(0, exitCode)
        Assert.Contains(".opencode/agents/alpha.md", output)
        Assert.Contains("sync promote", output)

    [<Then>]
    member _.``it exits 0 again once the mirror is restored, so the detection is falsifiable in both directions``() =
        gitAt commandRoot [ "checkout"; "--"; ".opencode/agents/alpha.md" ]
        runAt commandRoot [ "harness"; "sync"; "triage" ]
        Assert.Equal(0, exitCode)

    [<Then>]
    member _.``it exits non-zero naming the canonical side and naming the generate command rather than the promote command``
        ()
        =
        Assert.NotEqual(0, exitCode)
        Assert.Contains(".claude/agents/alpha.md", output)
        Assert.Contains("bindings generate", output)

    [<Then>]
    member _.``it exits 0 once the generator is run``() =
        run [ "harness"; "bindings"; "generate" ]
        run [ "harness"; "sync"; "triage" ]
        Assert.Equal(0, exitCode)

    [<Then>]
    member _.``it exits non-zero naming both files``() =
        Assert.NotEqual(0, exitCode)
        Assert.Contains(".claude/agents/alpha.md", output)
        Assert.Contains(".opencode/agents/alpha.md", output)

    [<Then>]
    member _.``it offers neither promotion nor any automatic resolution, because no correct automatic answer exists``
        ()
        =
        Assert.Contains("HARD STOP", output)
        Assert.Contains("No automatic", output)

    [<Then>]
    member _.``it exits 0 once both files are restored``() =
        git [ "checkout"; "--"; ".claude/agents/alpha.md"; ".opencode/agents/alpha.md" ]
        run [ "harness"; "sync"; "triage" ]
        Assert.Equal(0, exitCode)

    [<Then>]
    member _.``a proposed unified diff against the canonical source is emitted``() =
        Assert.Contains("---", output)
        Assert.Contains("+++", output)

    [<Then>]
    member _.``the canonical source file is byte-identical to what it was before the promote run, proving nothing was overwritten``
        ()
        =
        Assert.Equal(sourceSnapshot, File.ReadAllText(Path.Combine(root, ".claude", "agents", "alpha.md")))

    [<Then>]
    member _.``the output lists exactly those fields under an at-risk heading``() =
        Assert.Contains("permissionMode", output)
        Assert.Contains("isolation", output)

    [<Then>]
    member _.``an agent whose canonical source carries none of them lists nothing, proving the list is computed rather than hardcoded``
        ()
        =
        Assert.DoesNotContain("tools", output)

    [<Then>]
    member _.``the output carries a hard-stop warning naming both sides as hand-edited``() =
        Assert.Contains("HARD STOP", output)

    [<Then>]
    member _.``nothing was written to canonical source``() =
        Assert.Contains("canonical edit", File.ReadAllText(Path.Combine(root, ".claude", "agents", "alpha.md")))

    [<Then>]
    member _.``the output lists nothing under the at-risk heading``() =
        Assert.DoesNotContain("permissionMode", output)
        Assert.DoesNotContain("isolation", output)

    [<Then>]
    member _.``no divergence is reported for the vendored file, because the generator does not own it``() =
        Assert.DoesNotContain("vendor-plugin", output)

    [<Then>]
    member _.``hand-editing the generated file instead does report a divergence``() =
        File.AppendAllText(Path.Combine(root, ".agents", "skills", "beta", "SKILL.md"), "generated edit\n")
        run [ "harness"; "sync"; "triage" ]
        Assert.NotEqual(0, exitCode)
        Assert.Contains(".agents/skills/beta/SKILL.md", output)

    [<Then>]
    member _.``it exits non-zero exactly as it did before triage existed``() = Assert.NotEqual(0, exitCode)

    [<Then>]
    member _.``the failure message names both the canonical source file to edit and the harness sync promote command``
        ()
        =
        Assert.Contains(".claude/agents/alpha.md", output)
        Assert.Contains("sync promote", output)

    [<Then>]
    member _.``it exits 0 and reports the number of generated files compared``() =
        Assert.Equal(0, exitCode)
        Assert.Contains("generated file", output)

    [<Given>]
    member _.``a \.claude/ directory with valid agents and skills``() = prepareSyncFixture true

    [<Given>]
    member _.``a \.claude/ directory with agents and skills to convert``() = prepareSyncFixture true

    [<Given>]
    member _.``a \.claude/ directory with both agents and skills``() = prepareSyncFixture true

    [<Given>]
    member _.``a \.claude/ agent configured with the "([^"]+)" model``(model: string) =
        writeSkillsRegistry ()
        writeSyncAgent "fixture" "fixture" model

    [<Given>]
    member _.``\.claude/ and \.opencode/ configurations that are fully synchronised``() =
        prepareSyncFixture false
        run [ "harness"; "bindings"; "generate" ]
        Assert.True((exitCode = 0), output)

    [<Given>]
    member _.``an agent in \.claude/ whose description differs from its \.opencode/ counterpart``() =
        prepareSyncFixture false
        run [ "harness"; "bindings"; "generate" ]
        let path = Path.Combine(root, ".opencode", "agents", "fixture.md")
        File.WriteAllText(path, File.ReadAllText(path).Replace("description: fixture", "description: different"))

    [<Given>]
    member _.``\.claude/ containing more agents than \.opencode/``() =
        prepareSyncFixture false
        writeSyncAgent "second" "second" "sonnet"
        run [ "harness"; "bindings"; "generate" ]
        File.Delete(Path.Combine(root, ".opencode", "agents", "second.md"))

    [<When>]
    member _.``the developer runs rhino-cli harness bindings generate``() =
        run [ "harness"; "bindings"; "generate" ]

    [<When>]
    member _.``the developer runs rhino-cli harness bindings generate with the --dry-run flag``() =
        run [ "harness"; "bindings"; "generate"; "--dry-run" ]

    [<When>]
    member _.``the developer runs rhino-cli harness bindings generate with the --agents-only flag``() =
        run [ "harness"; "bindings"; "generate"; "--agents-only" ]

    [<When>]
    member _.``the developer runs rhino-cli harness sync validate``() = run [ "harness"; "sync"; "validate" ]

    [<Then>]
    member _.``the \.opencode/ directory contains the converted configuration``() =
        Assert.True(File.Exists(Path.Combine(root, ".opencode", "agents", "fixture.md")))
        Assert.True(File.Exists(Path.Combine(root, ".claude", "skills", "fixture-skill", "SKILL.md")))

    [<Then>]
    member _.``the output describes the planned operations``() = Assert.Contains("converted", output)

    [<Then>]
    member _.``no files are written to the \.opencode/ directory``() =
        Assert.False(Directory.Exists(Path.Combine(root, ".opencode")))

    [<Then>]
    member _.``only agent files are written to the \.opencode/ directory``() =
        Assert.True(File.Exists(Path.Combine(root, ".opencode", "agents", "fixture.md")))
        Assert.False(Directory.Exists(Path.Combine(root, ".opencode", "skills")))

    [<Then>]
    member _.``the corresponding \.opencode/ agent declares no model identifier``() =
        Assert.DoesNotContain("model:", File.ReadAllText(Path.Combine(root, ".opencode", "agents", "fixture.md")))

    [<Then>]
    member _.``the output reports all sync checks as passing``() = Assert.Contains("PASSED", output)

    [<Then>]
    member _.``the output identifies the agent with the mismatched description``() =
        Assert.Contains("fixture", output)
        Assert.Contains("description mismatch", output)

    [<Then>]
    member _.``the output reports the agent count mismatch``() = Assert.Contains("Agent Count", output)

    [<AfterScenario>]
    member _.Cleanup() =
        if Directory.Exists(root) then
            Directory.Delete(root, true)

        if cloneRoot <> "" && Directory.Exists(cloneRoot) then
            Directory.Delete(cloneRoot, true)

module private FeatureRunner =
    let path =
        Path.Combine(
            repositoryRoot,
            "specs",
            "apps",
            "rhino",
            "cli",
            "behaviours",
            "harness",
            "agents-detect-duplication.feature"
        )

    let run title =
        let lines = File.ReadAllLines(path)

        let featureLine =
            lines |> Array.find (fun line -> line.TrimStart().StartsWith("Feature:"))

        let start =
            lines |> Array.findIndex (fun line -> line.Trim() = "Scenario: " + title)

        let finish =
            lines
            |> Array.skip (start + 1)
            |> Array.tryFindIndex (fun line ->
                let trimmed = line.TrimStart()

                // Any tag opens a new block. Enumerating known tag prefixes
                // instead made a new `Rule:` invisible to the slicer, which
                // then ran the following rule header into the scenario and
                // failed to parse.
                trimmed.StartsWith("Scenario:")
                || trimmed.StartsWith("# Exemption(")
                || trimmed.StartsWith("Rule:")
                || trimmed.StartsWith("@"))
            |> Option.map (fun offset -> start + 1 + offset)
            |> Option.defaultValue lines.Length

        let feature =
            StepDefinitions([| typeof<HarnessProcessSteps> |])
                .GenerateFeature(path, Array.append [| featureLine; "" |] lines.[start .. finish - 1])

        (Seq.exactlyOne feature.Scenarios).Action.Invoke()

[<Theory>]
[<InlineData("Set of distinct agents and skills passes")>]
[<InlineData("Two agents sharing 12 consecutive lines verbatim fails")>]
[<InlineData("Agent body matching 10+ consecutive lines of a SKILL.md fails (agent-skill duplication)")>]
[<InlineData("Heading-only or whitespace-only 10-line window does NOT trigger a finding")>]
let ``duplication scenarios cross the published process`` title = FeatureRunner.run title

module private ClaudeFeatureRunner =
    let path =
        Path.Combine(
            repositoryRoot,
            "specs",
            "apps",
            "rhino",
            "cli",
            "behaviours",
            "harness",
            "agents-validate-claude.feature"
        )

    let run title =
        let lines = File.ReadAllLines(path)

        let featureLine =
            lines |> Array.find (fun line -> line.TrimStart().StartsWith("Feature:"))

        let start =
            lines |> Array.findIndex (fun line -> line.Trim() = "Scenario: " + title)

        // A scenario ends at the next block, which is not always another
        // `Scenario:` — a following `Rule:` and its tag line would otherwise be
        // sliced in, and TickSpec rejects a rule with no scenario under it.
        let finish =
            lines
            |> Array.skip (start + 1)
            |> Array.tryFindIndex (fun line ->
                let trimmed = line.TrimStart()

                trimmed.StartsWith("Scenario:")
                || trimmed.StartsWith("Rule:")
                || trimmed.StartsWith("@"))
            |> Option.map (fun offset -> start + 1 + offset)
            |> Option.defaultValue lines.Length

        let feature =
            StepDefinitions([| typeof<HarnessProcessSteps> |])
                .GenerateFeature(path, Array.append [| featureLine; "" |] lines.[start .. finish - 1])

        (Seq.exactlyOne feature.Scenarios).Action.Invoke()

[<Theory>]
[<InlineData("A directory with all agents and skills correctly configured passes validation")>]
[<InlineData("An agent file missing a required frontmatter field fails validation")>]
[<InlineData("An agent declaring the ultra-tier fable model alias passes validation")>]
[<InlineData("An agent declaring a model outside the tier vocabulary fails validation")>]
[<InlineData("An agent nested in a role subfolder is validated")>]
[<InlineData("An agent declaring no model fails validation")>]
[<InlineData("Two agents with the same name fail validation")>]
[<InlineData("--agents-only validates agents without checking skills")>]
[<InlineData("--skills-only validates skills without checking agents")>]
[<InlineData("An agent whose effort contradicts its grade fails validation")>]
[<InlineData("A registry declaring no grade vocabulary fails closed")>]
[<InlineData("An agent stating no model selection justification fails validation")>]
[<InlineData("An agent whose justification argues for a grade it does not declare fails validation")>]
let ``Claude validation scenarios cross the published process`` title = ClaudeFeatureRunner.run title

module private AdditionalFeatureRunner =
    let run fileName title =
        let path =
            Path.Combine(repositoryRoot, "specs", "apps", "rhino", "cli", "behaviours", "harness", fileName)

        let lines = File.ReadAllLines(path)

        let featureLine =
            lines |> Array.find (fun line -> line.TrimStart().StartsWith("Feature:"))

        let start =
            lines |> Array.findIndex (fun line -> line.Trim() = "Scenario: " + title)

        let finish =
            lines
            |> Array.skip (start + 1)
            |> Array.tryFindIndex (fun line ->
                let trimmed = line.TrimStart()

                // Any tag opens a new block. Enumerating known tag prefixes
                // instead made a new `Rule:` invisible to the slicer, which
                // then ran the following rule header into the scenario and
                // failed to parse.
                trimmed.StartsWith("Scenario:")
                || trimmed.StartsWith("# Exemption(")
                || trimmed.StartsWith("Rule:")
                || trimmed.StartsWith("@"))
            |> Option.map (fun offset -> start + 1 + offset)
            |> Option.defaultValue lines.Length

        let feature =
            StepDefinitions([| typeof<HarnessProcessSteps> |])
                .GenerateFeature(path, Array.append [| featureLine; "" |] lines.[start .. finish - 1])

        (Seq.exactlyOne feature.Scenarios).Action.Invoke()

[<Fact>]
let ``aggregate harness audit crosses the published process`` () =
    AdditionalFeatureRunner.run "harness-audit.feature" "Missing agent directories fail the aggregate harness audit"

[<Theory>]
[<InlineData("The catalog table renders from the harness registry")>]
[<InlineData("A hand edit inside the generated region is rejected")>]
let ``catalog scenarios cross the published process`` title =
    AdditionalFeatureRunner.run "harness-catalog.feature" title

[<Theory>]
[<InlineData("A Claude agent under a role subfolder gets a flat Codex TOML counterpart")>]
[<InlineData("An agent's model and effort tier is carried onto its Codex counterparts")>]
[<InlineData("A tier with no Codex counterpart is omitted rather than guessed")>]
[<InlineData("Agent identity comes from the name frontmatter, not the source subfolder")>]
[<InlineData("Regenerating rewrites only the delimited region of .codex/config.toml")>]
let ``Codex binding scenarios cross the published process`` title =
    AdditionalFeatureRunner.run "codex-binding.feature" title

[<Fact>]
let ``word-budget audit envelope crosses the published process`` () =
    AdditionalFeatureRunner.run
        "governance-word-budget-rule.feature"
        "The preflight envelope carries the governance-word-budget category"

[<Theory>]
[<InlineData("A registry-declared harness name is accepted")>]
[<InlineData("A harness name absent from the registry is rejected")>]
[<InlineData("A repository matching the generator passes validation")>]
[<InlineData("A present binding directory absent from the catalog fails validation")>]
[<InlineData("Absent binding directories require no catalog row")>]
[<InlineData("A .codex/agents directory holding only .toml files passes validation")>]
[<InlineData("A .md file under .codex/agents fails validation")>]
[<InlineData("A mirror whose source agent was renamed away fails validation")>]
[<InlineData("A generated agent directory whose mirrors all have sources passes validation")>]
[<InlineData("A mirror the registry declares vendored is exempt from the orphan check")>]
let ``binding validation scenarios cross the published process`` title =
    AdditionalFeatureRunner.run "agents-bindings.feature" title

[<Theory>]
[<InlineData("The mirror target is declared in the registry")>]
[<InlineData("Every repository skill is mirrored as real files, not links")>]
[<InlineData("Regeneration is idempotent and a hand edit is caught")>]
let ``skills mirror scenarios cross the published process`` title =
    AdditionalFeatureRunner.run "agents-skills-mirror.feature" title

[<Theory>]
[<InlineData("Vendored subdirectories are declared, not inferred")>]
[<InlineData("Stale-mirror cleanup never reaches a vendored directory")>]
[<InlineData("A vendored declaration that disagrees with its own ownership record is refused")>]
[<InlineData("A vendored entry naming no real directory is refused even when no ownership record contradicts it")>]
let ``vendored skill scenarios cross the published process`` title =
    AdditionalFeatureRunner.run "vendored-skill-preservation.feature" title

[<Theory>]
[<InlineData("An unclassified file under a binding directory fails the validator")>]
[<InlineData("A generated file must reproduce byte-for-byte")>]
[<InlineData("A vendored file carries no byte guard")>]
[<InlineData("A source path is never written by the emitter")>]
[<InlineData("Every tracked binding file in this repository carries exactly one class")>]
let ``ownership scenarios cross the published process`` title =
    AdditionalFeatureRunner.run "harness-ownership.feature" title

[<Theory>]
[<InlineData("An in-sync tree reports no divergence")>]
[<InlineData("Detection survives a fresh clone where every file carries checkout time")>]
[<InlineData("One-sided divergence is detected and promotion is offered")>]
[<InlineData("A canonical edit that was never regenerated is reported against the canonical side")>]
[<InlineData("Divergence on both sides is a hard stop with no automatic resolution")>]
[<InlineData("Promotion emits a reviewable diff and never writes canonical source")>]
[<InlineData("Promotion lists the canonical fields the editing harness cannot carry")>]
[<InlineData("Promoting a both-diverged mirror directly still warns, without requiring triage first")>]
[<InlineData("Promoting a skills mirror lists no field at risk, because a byte copy translates nothing")>]
[<InlineData("A vendored file is excluded from triage entirely")>]
[<InlineData("The default failure behaviour is unchanged and now names the way out")>]
[<InlineData("This repository's own tree reports zero divergences")>]
let ``triage scenarios cross the published process`` title =
    AdditionalFeatureRunner.run "harness-sync-triage.feature" title

[<Theory>]
[<InlineData("Syncing converts Claude agents to OpenCode format and leaves skills in place")>]
[<InlineData("The --dry-run flag previews changes without modifying files")>]
[<InlineData("The --agents-only flag syncs agents without touching skills")>]
[<InlineData("An OpenCode mirror pins no model, so the developer's active model applies")>]
[<InlineData("A mirror pins no model whatever grade the source declares")>]
[<InlineData("Directories that are in sync pass validation")>]
[<InlineData("A description mismatch between directories fails validation")>]
[<InlineData("A count mismatch between directories fails validation")>]
let ``sync scenarios cross the published process`` title =
    AdditionalFeatureRunner.run "agents-sync.feature" title
