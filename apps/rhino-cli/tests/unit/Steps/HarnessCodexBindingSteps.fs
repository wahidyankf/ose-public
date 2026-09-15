module RhinoCli.Tests.Unit.Steps.HarnessCodexBindingSteps

open RhinoCli.Application.Harness
open TickSpec
open Xunit

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/harness/codex-binding.feature" ]

let private agentContent name description =
    $"---\nname: {name}\ndescription: {description}\ntools: Read\nmodel: sonnet\n---\nInstructions for {name}.\n"

/// The grade translation the emitter reads from `repo-config.yml` at runtime,
/// declared here so a unit test exercises the mapping without depending on the
/// repository's own registry.
let private testGradeMaps: GradeMaps =
    { GradeOfAlias = Map.ofList [ "fable", "ultra"; "opus", "planning"; "sonnet", "execution"; "haiku", "fast" ]
      EffortOfGrade = Map.ofList [ "ultra", "high"; "planning", "high"; "execution", "xhigh"; "fast", "xhigh" ]
      ModelOfGrade =
        Map.ofList
            [ "ultra", "gpt-6-astra"
              "planning", "gpt-5.6-sol"
              "execution", "gpt-5.6-terra"
              "fast", "gpt-5.6-luna" ] }

let private tieredAgentContent name model effort =
    $"---\nname: {name}\ndescription: {name} agent\ntools: Read\nmodel: {model}\neffort: {effort}\n---\nInstructions for {name}.\n"

/// One agent per grade of the four-grade tier vocabulary, paired with the
/// Codex model and reasoning effort the mirror must carry.
let private tierFixtures =
    [ "ultra-agent", "fable", "high", "gpt-6-astra", "high"
      "planning-agent", "opus", "high", "gpt-5.6-sol", "high"
      "execution-agent", "sonnet", "xhigh", "gpt-5.6-terra", "xhigh"
      "fast-agent", "haiku", "max", "gpt-5.6-luna", "xhigh" ]

type HarnessCodexBindingSteps() =
    let mutable sources: (string * string * string) list = []
    let mutable emitted: (CodexAgent * string) list = []
    let mutable configBefore = ""
    let mutable configAfterFirst = ""
    let mutable configAfterSecond = ""

    [<Given>]
    member _.``a repository whose \.claude/agents/ directory holds one agent under a role subfolder``() =
        sources <- [ ".claude/agents/roles/reviewer.md", "reviewer", agentContent "reviewer" "Reviews code" ]

    [<Given>]
    member _.``a repository whose \.claude/agents/ holds one agent per model tier``() =
        sources <-
            tierFixtures
            |> List.map (fun (name, model, effort, _, _) ->
                $".claude/agents/roles/{name}.md", name, tieredAgentContent name model effort)

    [<Given>]
    member _.``a repository whose \.claude/agents/ holds one agent declaring model inherit``() =
        sources <-
            [ ".claude/agents/roles/inheriting.md", "inheriting", tieredAgentContent "inheriting" "inherit" "high" ]

    [<Given>]
    member _.``a repository whose \.claude/agents/ holds two agents in different role subfolders whose name frontmatter differs from their filename``
        ()
        =
        sources <-
            [ ".claude/agents/roles/first.md", "alpha", agentContent "alpha" "Alpha agent"
              ".claude/agents/teams/second.md", "beta", agentContent "beta" "Beta agent" ]

    [<Given>]
    member _.``a repository whose \.codex/config\.toml carries hand-maintained mcp_servers, features, and ci-monitor-subagent tables``
        ()
        =
        sources <- [ ".claude/agents/roles/reviewer.md", "reviewer", agentContent "reviewer" "Reviews code" ]

        configBefore <-
            "[mcp_servers.demo]\ncommand = \"demo\"\n\n[features]\nflag = true\n\n[agents.ci-monitor-subagent]\ndescription = \"manual\"\n"

    [<When>]
    member _.``the developer runs harness bindings generate``() =
        emitted <-
            sources
            |> List.map (fun (path, name, content) ->
                let agent, rendered, _ =
                    convertCodexAgentContent testGradeMaps path name ".claude/agents" ".codex/agents" content
                    |> Result.defaultWith failwith

                agent, rendered)

    [<When>]
    member this.``the developer runs harness bindings generate twice``() =
        this.``the developer runs harness bindings generate`` ()

        let region =
            emitted
            |> List.map (fun (agent, _) ->
                { Name = agent.Name
                  Description = agent.Description }
                : EmittedCodexAgent)
            |> renderGeneratedRegion

        configAfterFirst <- rewriteGeneratedRegion configBefore region
        configAfterSecond <- rewriteGeneratedRegion configAfterFirst region

    [<Then>]
    member _.``the command exits successfully``() =
        Assert.Equal(sources.Length, emitted.Length)

    [<Then>]
    member _.``\.codex/agents/ holds exactly one TOML file named for that agent``() =
        Assert.Equal("reviewer", (fst emitted.Head).Name)
        Assert.EndsWith(".toml", "reviewer." + codexAgentExtension)

    [<Then>]
    member _.``the emitted Codex agent declares name, description, and developer_instructions``() =
        let _, rendered = emitted.Head
        Assert.Contains("name = \"reviewer\"", rendered)
        Assert.Contains("description = \"Reviews code\"", rendered)
        Assert.Contains("developer_instructions = \"\"\"", rendered)

    [<Then>]
    member _.``the emitted Codex agent declares no model field``() =
        Assert.DoesNotContain("model =", snd emitted.Head)

    [<Then>]
    member _.``each emitted Codex agent declares the Codex model at the same tier``() =
        let expected = tierFixtures |> List.map (fun (_, _, _, codexModel, _) -> codexModel)
        Assert.Equal<string list>(expected, emitted |> List.map (fst >> fun agent -> agent.Model))

        for (_, rendered), codexModel in List.zip emitted expected do
            Assert.Contains($"model = \"{codexModel}\"", rendered)

    [<Then>]
    member _.``each emitted Codex agent declares model_reasoning_effort matching its Claude effort``() =
        let expected =
            tierFixtures |> List.map (fun (_, _, _, _, codexEffort) -> codexEffort)

        Assert.Equal<string list>(expected, emitted |> List.map (fst >> fun agent -> agent.ModelReasoningEffort))

        for (_, rendered), codexEffort in List.zip emitted expected do
            Assert.Contains($"model_reasoning_effort = \"{codexEffort}\"", rendered)

    [<Then>]
    member _.``\.codex/agents/ holds one flat TOML file per agent keyed on the name frontmatter``() =
        Assert.Equal<string list>([ "alpha"; "beta" ], emitted |> List.map (fst >> fun agent -> agent.Name))

    [<Then>]
    member _.``no emitted filename repeats a role subfolder name``() =
        let names = emitted |> List.map (fst >> fun agent -> agent.Name)
        Assert.DoesNotContain("roles", names)
        Assert.DoesNotContain("teams", names)

    [<Then>]
    member _.``\.codex/config\.toml declares a generated agents table for the fixture agent``() =
        Assert.Contains("[agents.reviewer]", configAfterFirst)

    [<Then>]
    member _.``the hand-maintained mcp_servers, features, and ci-monitor-subagent tables are unchanged``() =
        Assert.Contains("[mcp_servers.demo]\ncommand = \"demo\"", configAfterFirst)
        Assert.Contains("[features]\nflag = true", configAfterFirst)
        Assert.Contains("[agents.ci-monitor-subagent]\ndescription = \"manual\"", configAfterFirst)

    [<Then>]
    member _.``the second run left \.codex/config\.toml byte-identical to the first``() =
        Assert.Equal(configAfterFirst, configAfterSecond)

[<Fact>]
let ``role-subfolder agent emits flat Codex TOML`` () =
    let steps = HarnessCodexBindingSteps()
    steps.``a repository whose \.claude/agents/ directory holds one agent under a role subfolder`` ()
    steps.``the developer runs harness bindings generate`` ()
    steps.``the command exits successfully`` ()
    steps.``\.codex/agents/ holds exactly one TOML file named for that agent`` ()
    steps.``the emitted Codex agent declares name, description, and developer_instructions`` ()

[<Fact>]
let ``model and effort tiers reach the Codex mirror`` () =
    let steps = HarnessCodexBindingSteps()
    steps.``a repository whose \.claude/agents/ holds one agent per model tier`` ()
    steps.``the developer runs harness bindings generate`` ()
    steps.``the command exits successfully`` ()
    steps.``each emitted Codex agent declares the Codex model at the same tier`` ()
    steps.``each emitted Codex agent declares model_reasoning_effort matching its Claude effort`` ()

[<Fact>]
let ``inherited model has no Codex counterpart`` () =
    let steps = HarnessCodexBindingSteps()
    steps.``a repository whose \.claude/agents/ holds one agent declaring model inherit`` ()
    steps.``the developer runs harness bindings generate`` ()
    steps.``the command exits successfully`` ()
    steps.``the emitted Codex agent declares no model field`` ()

[<Fact>]
let ``frontmatter names determine flat Codex files`` () =
    let steps = HarnessCodexBindingSteps()

    steps.``a repository whose \.claude/agents/ holds two agents in different role subfolders whose name frontmatter differs from their filename`` ()

    steps.``the developer runs harness bindings generate`` ()
    steps.``the command exits successfully`` ()
    steps.``\.codex/agents/ holds one flat TOML file per agent keyed on the name frontmatter`` ()
    steps.``no emitted filename repeats a role subfolder name`` ()

[<Fact>]
let ``Codex config rewrite preserves manual tables and is idempotent`` () =
    let steps = HarnessCodexBindingSteps()

    steps.``a repository whose \.codex/config\.toml carries hand-maintained mcp_servers, features, and ci-monitor-subagent tables`` ()

    steps.``the developer runs harness bindings generate twice`` ()
    steps.``the command exits successfully`` ()
    steps.``\.codex/config\.toml declares a generated agents table for the fixture agent`` ()
    steps.``the hand-maintained mcp_servers, features, and ci-monitor-subagent tables are unchanged`` ()
    steps.``the second run left \.codex/config\.toml byte-identical to the first`` ()
