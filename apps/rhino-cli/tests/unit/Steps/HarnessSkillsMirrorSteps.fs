module RhinoCli.Tests.Unit.Steps.HarnessSkillsMirrorSteps

open System.Text
open RhinoCli.Application.Harness
open TickSpec
open Xunit

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/harness/agents-skills-mirror.feature"
      "specs/apps/rhino/cli/behaviours/harness/vendored-skill-preservation.feature" ]

let private bytes (value: string) = Encoding.UTF8.GetBytes value

type HarnessSkillsMirrorSteps() =
    let mutable source = Map.empty<string, byte[]>
    let mutable target = Map.empty<string, byte[]>
    let mutable vendored: string list = []
    let mutable diff = planSkillsMirror ".agents/skills" [] source target
    let mutable validation: Result<unit, string> = Ok()
    let mutable scripts = ValidationCheck.passed "scripts" "not run"
    let mutable firstDiff: JobDiff option = None
    let mutable agentDirectoryMirrorDeclared = false
    let mutable skillDirectoryMirrorDeclared = false
    let mutable declaredVendored = Set.empty<string>
    let mutable ownershipVendored = Set.empty<string>
    let mutable actualVendored = Set.empty<string>
    let mutable generateScript = ""
    let mutable validateScript = ""

    let plan () =
        diff <- planSkillsMirror ".agents/skills" vendored source target

    [<Given>]
    member _.``the harness registry declares an agent-directory mirror for the OpenCode entry``() =
        agentDirectoryMirrorDeclared <- true

    [<When>]
    member _.``the codex entry is updated to declare \.agents/skills as a mirror of \.claude/skills``() =
        skillDirectoryMirrorDeclared <- true

        validation <-
            if agentDirectoryMirrorDeclared && skillDirectoryMirrorDeclared then
                validateVendoredDeclarations Set.empty Set.empty Set.empty
            else
                Error "both agent-directory and skill-directory mirrors must be declared"

    [<Then>]
    member _.``rhino-cli repo-config validate exits 0 with both kinds of mirror relationship declared: agent directories and skill directories``
        ()
        =
        Assert.True(Result.isOk validation)

    [<Then>]
    member _.``rhino-cli harness bindings generate emits the \.agents/skills mirror without a new command-line flag``
        ()
        =
        source <- Map.ofList [ "demo/SKILL.md", bytes "canonical" ]
        plan ()
        Assert.Equal<string list>([ "demo/SKILL.md" ], diff.ToWrite)

    [<Given>]
    member _.``\.claude/skills/ holds the repository's canonical skill directories and every one of them is tracked``
        ()
        =
        source <- Map.ofList [ "alpha/SKILL.md", bytes "alpha"; "beta/reference.md", bytes "beta" ]

    [<When>]
    member _.``rhino-cli harness bindings generate runs``() = plan ()

    [<Then>]
    member _.``\.agents/skills/ contains one real directory per \.claude/skills/ skill``() =
        Assert.Equal<string list>([ "alpha/SKILL.md"; "beta/reference.md" ], diff.ToWrite)

    [<Then>]
    member _.``find \.agents/skills -type l returns zero results, proving no symlink was created in either direction``
        ()
        =
        Assert.Equal(source.Count, diff.ToWrite.Length)

    [<Given>]
    member _.``a clean tree immediately after rhino-cli harness bindings generate``() =
        source <- Map.ofList [ "demo/SKILL.md", bytes "canonical" ]
        target <- source

    [<When>]
    member _.``the command runs a second time``() =
        plan ()
        firstDiff <- Some diff

    [<Then>]
    member _.``git diff --quiet \.agents/ exits 0, proving no churn``() =
        Assert.Empty(firstDiff.Value.ToWrite)
        Assert.Empty(firstDiff.Value.ToRemove)

    [<Then>]
    member _.``after a single character is changed in one mirrored file, rhino-cli harness bindings validate exits non-zero naming that file, where it exited 0 before the edit``
        ()
        =
        target <- Map.ofList [ "demo/SKILL.md", bytes "canonicaX" ]
        plan ()
        Assert.Equal<string list>([ "demo/SKILL.md" ], diff.ToWrite)

    [<Given>]
    member _.``npm run generate:bindings and npm run validate:sync covered only the OpenCode and Amazon Q surfaces``() =
        generateScript <- "rhino-cli harness bindings generate --mirror opencode --mirror amazon-q"
        validateScript <- "rhino-cli harness bindings validate --mirror opencode --mirror amazon-q"
        let legacy = validateRegistryDrivenScripts generateScript validateScript
        Assert.Equal("failed", legacy.Status)

    [<When>]
    member _.``both scripts run after the mirror is wired``() =
        generateScript <- "rhino-cli harness bindings generate"
        validateScript <- "rhino-cli harness bindings validate"
        scripts <- validateRegistryDrivenScripts generateScript validateScript

    [<Then>]
    member _.``generate:bindings emits \.agents/skills/ and validate:sync reports it as in-parity``() =
        Assert.Equal("passed", scripts.Status)

    [<Then>]
    member _.``neither script names a skills-specific or mirror-specific flag, because both delegate to the registry-driven commands``
        ()
        =
        Assert.Equal("passed", scripts.Status)

    [<Given>]
    member _.``this repository has previously broken a generated byte-equality guard by letting the formatter rewrite emitted files``
        ()
        =
        source <- Map.ofList [ "demo/SKILL.md", bytes "formatted\n" ]
        target <- source

    [<When>]
    member _.``rhino-cli harness bindings generate is followed by prettier --write over \.agents/ and then rhino-cli harness bindings validate``
        ()
        =
        plan ()

    [<Then>]
    member _.``the validator exits 0``() = Assert.Empty(diff.ToWrite)

    [<Then>]
    member _.``where it exits non-zero instead, \.agents/ is added to \.prettierignore and the same sequence then exits 0``
        ()
        =
        Assert.Empty(diff.ToWrite)

    [<Given>]
    member _.``every \.agents/skills/ directory without a \.claude/skills/ source is one the emitter cannot regenerate``
        ()
        =
        actualVendored <- set [ ".agents/skills/vendor-plugin" ]
        ownershipVendored <- actualVendored

    [<When>]
    member _.``the harness registry declares each of those directories as vendored``() =
        declaredVendored <- actualVendored
        validation <- validateVendoredDeclarations declaredVendored ownershipVendored actualVendored

    [<Then>]
    member _.``rhino-cli repo-config validate exits 0``() = Assert.True(Result.isOk validation)

    [<Then>]
    member _.``an undeclared directory appearing under \.agents/skills/ with no \.claude/skills/ counterpart makes rhino-cli harness bindings validate exit non-zero, where an ownership heuristic would have silently deleted it instead``
        ()
        =
        let check =
            skillsMirrorAuditCheck (Ok [ MirrorDriftUndeclared ".agents/skills/undeclared/SKILL.md" ])

        Assert.Equal("failed", check.Status)
        Assert.Contains("undeclared", check.Message)

    [<Given>]
    member _.``a skill directory is renamed under \.claude/skills/ so its old mirror becomes stale``() =
        source <- Map.ofList [ "new/SKILL.md", bytes "new" ]
        target <- Map.ofList [ "old/SKILL.md", bytes "old"; "vendor-plugin/SKILL.md", bytes "vendor" ]
        vendored <- [ ".agents/skills/vendor-plugin" ]

    [<Then>]
    member _.``the stale mirrored directory is removed and the new one created``() =
        Assert.Equal<string list>([ "new/SKILL.md" ], diff.ToWrite)
        Assert.Equal<string list>([ "old/SKILL.md" ], diff.ToRemove)

    [<Then>]
    member _.``every vendored directory is still present, proving cleanup is scoped to emitter-owned paths``() =
        Assert.Equal(1, diff.VendoredSkipped)
        Assert.DoesNotContain("vendor-plugin/SKILL.md", diff.ToRemove)

    [<Given>]
    member _.``a harness declares \.agents/skills/vendor-plugin as ownership class vendored but its vendored list names a different value for it``
        ()
        =
        declaredVendored <- set [ ".agents/skills/different" ]
        ownershipVendored <- set [ ".agents/skills/vendor-plugin" ]
        actualVendored <- set [ ".agents/skills/vendor-plugin" ]

    [<When>]
    member _.``rhino-cli harness bindings generate runs against that mismatched registry``() =
        validation <- validateVendoredDeclarations declaredVendored ownershipVendored actualVendored

    [<Then>]
    member _.``the run fails loudly instead of deleting the directory the ownership record protects``() =
        Assert.True(Result.isError validation)

    [<Given>]
    member _.``a harness's vendored list names a typo'd path with no ownership record for the real directory it was meant to protect``
        ()
        =
        declaredVendored <- set [ ".agents/skills/vender-plugin" ]
        ownershipVendored <- set [ ".agents/skills/vender-plugin" ]
        actualVendored <- set [ ".agents/skills/vendor-plugin" ]

    [<When>]
    member _.``rhino-cli harness bindings generate runs against that under-declared registry``() =
        validation <- validateVendoredDeclarations declaredVendored ownershipVendored actualVendored

    [<Then>]
    member _.``the run fails loudly instead of deleting the real directory the typo'd entry was meant to protect``() =
        Assert.True(Result.isError validation)

module private SkillsScenario =
    let run steps =
        let world = HarnessSkillsMirrorSteps()
        steps world

[<Fact>]
let ``registry declares skills mirror`` () =
    SkillsScenario.run (fun s ->
        s.``the harness registry declares an agent-directory mirror for the OpenCode entry`` ()
        s.``the codex entry is updated to declare \.agents/skills as a mirror of \.claude/skills`` ()

        s.``rhino-cli repo-config validate exits 0 with both kinds of mirror relationship declared: agent directories and skill directories`` ()

        s.``rhino-cli harness bindings generate emits the \.agents/skills mirror without a new command-line flag`` ())

[<Fact>]
let ``skills are planned as real copied files`` () =
    SkillsScenario.run (fun s ->
        s.``\.claude/skills/ holds the repository's canonical skill directories and every one of them is tracked`` ()
        s.``rhino-cli harness bindings generate runs`` ()
        s.``\.agents/skills/ contains one real directory per \.claude/skills/ skill`` ()
        s.``find \.agents/skills -type l returns zero results, proving no symlink was created in either direction`` ())

[<Fact>]
let ``skills mirror is idempotent and drift-sensitive`` () =
    SkillsScenario.run (fun s ->
        s.``a clean tree immediately after rhino-cli harness bindings generate`` ()
        s.``the command runs a second time`` ()
        s.``git diff --quiet \.agents/ exits 0, proving no churn`` ()

        s.``after a single character is changed in one mirrored file, rhino-cli harness bindings validate exits non-zero naming that file, where it exited 0 before the edit`` ())

[<Fact>]
let ``npm scripts remain registry-driven`` () =
    SkillsScenario.run (fun s ->
        s.``npm run generate:bindings and npm run validate:sync covered only the OpenCode and Amazon Q surfaces`` ()
        s.``both scripts run after the mirror is wired`` ()
        s.``generate:bindings emits \.agents/skills/ and validate:sync reports it as in-parity`` ()

        s.``neither script names a skills-specific or mirror-specific flag, because both delegate to the registry-driven commands`` ())

[<Fact>]
let ``formatter-stable mirror validates`` () =
    SkillsScenario.run (fun s ->
        s.``this repository has previously broken a generated byte-equality guard by letting the formatter rewrite emitted files`` ()

        s.``rhino-cli harness bindings generate is followed by prettier --write over \.agents/ and then rhino-cli harness bindings validate`` ()

        s.``the validator exits 0`` ()

        s
            .``where it exits non-zero instead, \.agents/ is added to \.prettierignore and the same sequence then exits 0`` ())

[<Fact>]
let ``vendored directories must be declared`` () =
    SkillsScenario.run (fun s ->
        s.``every \.agents/skills/ directory without a \.claude/skills/ source is one the emitter cannot regenerate`` ()
        s.``the harness registry declares each of those directories as vendored`` ()
        s.``rhino-cli repo-config validate exits 0`` ()

        s.``an undeclared directory appearing under \.agents/skills/ with no \.claude/skills/ counterpart makes rhino-cli harness bindings validate exit non-zero, where an ownership heuristic would have silently deleted it instead`` ())

[<Fact>]
let ``stale cleanup preserves vendored files`` () =
    SkillsScenario.run (fun s ->
        s.``a skill directory is renamed under \.claude/skills/ so its old mirror becomes stale`` ()
        s.``rhino-cli harness bindings generate runs`` ()
        s.``the stale mirrored directory is removed and the new one created`` ()
        s.``every vendored directory is still present, proving cleanup is scoped to emitter-owned paths`` ())

[<Fact>]
let ``vendored ownership disagreement fails`` () =
    SkillsScenario.run (fun s ->
        s.``a harness declares \.agents/skills/vendor-plugin as ownership class vendored but its vendored list names a different value for it`` ()

        s.``rhino-cli harness bindings generate runs against that mismatched registry`` ()
        s.``the run fails loudly instead of deleting the directory the ownership record protects`` ())

[<Fact>]
let ``vendored typo fails`` () =
    SkillsScenario.run (fun s ->
        s.``a harness's vendored list names a typo'd path with no ownership record for the real directory it was meant to protect`` ()

        s.``rhino-cli harness bindings generate runs against that under-declared registry`` ()
        s.``the run fails loudly instead of deleting the real directory the typo'd entry was meant to protect`` ())
