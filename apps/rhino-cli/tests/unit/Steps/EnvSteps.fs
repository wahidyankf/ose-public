module RhinoCli.Tests.Unit.Steps.EnvSteps

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/env/env-backup.feature" ]

open System
open System.Text.Json
open TickSpec
open Xunit
open RhinoCli.Application.Env

let private entry path skipped reason source =
    { RelPath = path
      AbsPath = path
      Size = 1L
      Skipped = skipped
      Reason = reason
      Source = source }

type EnvSteps() =
    let mutable entries: EnvFileEntry list = []
    let mutable existing: string list = []
    let mutable expected: string list = []
    let mutable worktreeName = ""
    let mutable force = false
    let mutable includeConfig = false
    let mutable dryRun = false
    let mutable insideRepo = false
    let mutable confirmation: bool option = None
    let mutable confirmationCalls = 0
    let mutable result: EnvOperationResult option = None
    let mutable error: string option = None
    let mutable copied: string list = []

    let add path =
        entries <- entries @ [ entry path false "" "env" ]

    let confirm () =
        confirmationCalls <- confirmationCalls + 1
        confirmation |> Option.defaultValue false

    let outcome () =
        result |> Option.defaultWith (fun () -> failwith "backup did not run")

    let run () =
        if insideRepo then
            error <- Some "backup directory must be outside the repo"
        else
            let selected =
                entries |> List.filter (fun item -> includeConfig || item.Source <> "config")

            let planned =
                planEnvOperation "backup" "/backup" selected existing force dryRun worktreeName confirm

            result <- Some planned

            if not planned.Cancelled && not planned.DryRun then
                copied <-
                    selected
                    |> List.filter (fun item -> not item.Skipped)
                    |> List.map (fun item ->
                        if worktreeName = "" then
                            item.RelPath
                        else
                            worktreeName + "/" + item.RelPath)

    [<Given>]
    member _.``a git repository containing .env files at the root and in app subdirectories``() =
        expected <- [ ".env"; "apps/web/.env"; "apps/api/.env" ]
        expected |> List.iter add

    [<Given>]
    member _.``a git repository containing a .env file at the root``() = add ".env"

    [<Given>]
    member _.``the backup directory already contains a backed-up .env file``() = existing <- [ ".env" ]

    [<Given>]
    member _.``the backup directory is empty``() = existing <- []

    [<Given>]
    member _.``a git repository containing a symlinked .env file, a .env file larger than 1 MB, and a regular .env file``
        ()
        =
        entries <-
            [ entry ".env.symlink" true "symlink" "env"
              entry ".env.large" true "size exceeds maximum" "env"
              entry ".env" false "" "env" ]

    [<Given>]
    member _.``a git repository containing no .env files``() = entries <- []

    [<Given>]
    member _.``a git repository containing .env files inside node_modules, dist, build, .next, __pycache__, target, vendor, coverage, and generated-contracts directories``
        ()
        =
        entries <- []

    [<Given>]
    member _.``a git repository where apps/web/node_modules contains a .env file and apps/web contains a .env.local file``
        ()
        =
        add "apps/web/.env.local"

    [<Given>]
    member _.``a git worktree containing a .env file at its root``() = add ".env"

    [<Given>]
    member _.``a git worktree named "(.*)" containing a .env file at its root``(name: string) =
        worktreeName <- name
        add ".env"

    [<Given>]
    member _.``the main git repository named "(.*)" containing a .env file at its root``(name: string) =
        worktreeName <- name
        add ".env"

    [<Given>]
    member _.``a git repository containing a .env file and a .claude/settings.local.json file``() =
        add ".env"
        entries <- entries @ [ entry ".claude/settings.local.json" false "" "config" ]

    [<Given>]
    member _.``a git repository containing a .env file but no known config files``() = add ".env"

    [<Given>]
    member _.``a git repository containing a secrets.json file at the root``() = add "secrets.json"

    [<Given>]
    member _.``a git repository containing a cert.pem file at the root``() = add "cert.pem"

    [<Given>]
    member _.``a git repository containing a .secrets/notes.md file``() = add ".secrets/notes.md"

    [<Given>]
    member _.``a git repository containing a .env file and a secrets.json file``() =
        add ".env"
        add "secrets.json"

    [<When>]
    member _.``the developer runs rhino-cli env backup``() = run ()

    [<When>]
    member _.``the developer runs rhino-cli env backup with --dir pointing to a directory outside the repository``() =
        run ()

    [<When>]
    member _.``the developer runs rhino-cli env backup with --dir pointing to a path inside the git root``() =
        insideRepo <- true
        run ()

    [<When>]
    member _.``the developer runs rhino-cli env backup with --output json``() =
        force <- true
        run ()

    [<When>]
    member _.``the developer runs rhino-cli env backup with --worktree-aware``() = run ()

    [<When>]
    member _.``the developer runs rhino-cli env backup and confirms the overwrite``() =
        confirmation <- Some true
        run ()

    [<When>]
    member _.``the developer runs rhino-cli env backup and declines the overwrite``() =
        confirmation <- Some false
        run ()

    [<When>]
    member _.``the developer runs rhino-cli env backup with --force``() =
        force <- true
        run ()

    [<When>]
    member _.``the developer runs rhino-cli env backup with --include-config and --force``() =
        force <- true
        includeConfig <- true
        run ()

    [<When>]
    member _.``the developer runs rhino-cli env backup with --dry-run``() =
        dryRun <- true
        run ()

    [<Then>]
    member _.``the command exits successfully``() = Assert.True(error.IsNone)

    [<Then>]
    member _.``the command exits with a failure code``() = Assert.True(error.IsSome)

    [<Then>]
    member _.``each .env file is copied to the backup directory preserving its relative path``() =
        expected |> List.iter (fun path -> Assert.Contains(path, copied))

    [<Then>]
    member _.``the output lists each backed-up file``() =
        expected
        |> List.iter (fun path -> Assert.Contains(path, formatText (outcome ()) false false))

    [<Then>]
    member _.``the .env file is copied to the specified directory preserving its relative path``() =
        Assert.Contains(".env", copied)

    [<Then>]
    member _.``the output warns that the backup directory must be outside the repository``() =
        Assert.Contains("outside the repo", error.Value)

    [<Then>]
    member _.``the symlinked .env file is skipped with a warning``() =
        Assert.Contains((outcome ()).Files, fun item -> item.RelPath = ".env.symlink" && item.Skipped)

    [<Then>]
    member _.``the oversized .env file is skipped with a warning``() =
        Assert.Contains((outcome ()).Files, fun item -> item.RelPath = ".env.large" && item.Skipped)

    [<Then>]
    member _.``the regular .env file is copied to the backup directory``() = Assert.Contains(".env", copied)

    [<Then>]
    member _.``the output reports that zero files were backed up``() = Assert.Equal(0, (outcome ()).Copied)

    [<Then>]
    member _.``the output is valid JSON``() =
        use _doc = JsonDocument.Parse(formatJson (outcome ()))
        ()

    [<Then>]
    member _.``the JSON includes the direction, backup directory, list of files, copied count, and skipped count``() =
        let json = formatJson (outcome ())

        [ "direction"; "dir"; "files"; "copied"; "skipped" ]
        |> List.iter (fun key -> Assert.Contains(key, json))

    [<Then>]
    member _.``none of the .env files inside auto-generated directories are backed up``() = Assert.Empty copied

    [<Then>]
    member _.``only apps/web/.env.local is copied to the backup directory``() =
        Assert.Equal<string list>([ "apps/web/.env.local" ], copied)

    [<Then>]
    member _.``the .env file inside apps/web/node_modules is not backed up``() =
        Assert.DoesNotContain("apps/web/node_modules/.env", copied)

    [<Then>]
    member _.``the .env file is copied to the backup directory with a flat structure``() =
        Assert.Contains(".env", copied)

    [<Then>]
    member _.``the .env file is copied under a feature-branch subdirectory inside the backup directory``() =
        Assert.Contains("feature-branch/.env", copied)

    [<Then>]
    member _.``the .env file is copied under an open-sharia-enterprise subdirectory inside the backup directory``() =
        Assert.Contains("open-sharia-enterprise/.env", copied)

    [<Then>]
    member _.``the .env file is overwritten in the backup directory``() =
        Assert.Contains(".env", copied)
        Assert.Equal(1, confirmationCalls)

    [<Then>]
    member _.``the output reports that backup was cancelled``() = Assert.True((outcome ()).Cancelled)

    [<Then>]
    member _.``the existing backup file is unchanged``() =
        Assert.Empty copied
        Assert.Equal(1, confirmationCalls)

    [<Then>]
    member _.``the .env file is overwritten in the backup directory without prompting``() =
        Assert.Contains(".env", copied)
        Assert.Equal(0, confirmationCalls)

    [<Then>]
    member _.``no confirmation prompt is shown``() = Assert.Equal(0, confirmationCalls)

    [<Then>]
    member _.``the .env file is copied to the backup directory``() = Assert.Contains(".env", copied)

    [<Then>]
    member _.``the .claude/settings.local.json is copied to the backup directory preserving its relative path``() =
        Assert.Contains(".claude/settings.local.json", copied)

    [<Then>]
    member _.``the .claude/settings.local.json is not copied to the backup directory``() =
        Assert.DoesNotContain(".claude/settings.local.json", copied)

    [<Then>]
    member _.``only the .env file is copied to the backup directory``() =
        Assert.Equal<string list>([ ".env" ], copied)

    [<Then>]
    member _.``secrets.json is copied to the backup directory``() = Assert.Contains("secrets.json", copied)

    [<Then>]
    member _.``cert.pem is copied to the backup directory``() = Assert.Contains("cert.pem", copied)

    [<Then>]
    member _.``.secrets/notes.md is copied to the backup directory preserving its relative path``() =
        Assert.Contains(".secrets/notes.md", copied)

    [<Then>]
    member _.``no files from the .git directory are backed up``() =
        Assert.DoesNotContain(copied, fun path -> path.StartsWith(".git/"))

    [<Then>]
    member _.``no files are written to the backup directory``() = Assert.Empty copied

    [<Then>]
    member _.``the output lists the files that would be backed up``() =
        let text = formatText (outcome ()) false false
        Assert.Contains("WOULD", text)
        Assert.Contains("secrets.json", text)

[<Fact>]
let ``backup policy copies discovered env paths`` () =
    let steps = EnvSteps()
    steps.``a git repository containing .env files at the root and in app subdirectories`` ()
    steps.``the developer runs rhino-cli env backup`` ()
    steps.``each .env file is copied to the backup directory preserving its relative path`` ()
    steps.``the output lists each backed-up file`` ()

[<Fact>]
let ``backup policy declines a real conflict`` () =
    let steps = EnvSteps()
    steps.``a git repository containing a .env file at the root`` ()
    steps.``the backup directory already contains a backed-up .env file`` ()
    steps.``the developer runs rhino-cli env backup and declines the overwrite`` ()
    steps.``the output reports that backup was cancelled`` ()
    steps.``the existing backup file is unchanged`` ()

[<Fact>]
let ``backup force bypasses confirmation`` () =
    let steps = EnvSteps()
    steps.``a git repository containing a .env file at the root`` ()
    steps.``the backup directory already contains a backed-up .env file`` ()
    steps.``the developer runs rhino-cli env backup with --force`` ()
    steps.``the .env file is overwritten in the backup directory without prompting`` ()

[<Theory>]
[<InlineData("Backup discovers and copies all .env files")>]
[<InlineData("Backup with custom directory")>]
[<InlineData("Backup rejects a directory inside the repository")>]
[<InlineData("Symlinks and oversized files are skipped")>]
[<InlineData("Backup with zero .env files")>]
[<InlineData("JSON output for backup")>]
[<InlineData("Env files inside auto-generated directories are not discovered")>]
[<InlineData("Env files inside nested auto-generated directories are not discovered")>]
[<InlineData("Backup works in a git worktree")>]
[<InlineData("Worktree-aware backup namespaces by worktree name")>]
[<InlineData("Main repo with worktree-aware uses repository directory name")>]
[<InlineData("Backup prompts when destination files already exist")>]
[<InlineData("Backup aborts when user declines overwrite")>]
[<InlineData("Backup with --force skips confirmation")>]
[<InlineData("Backup proceeds without prompt when no conflicts exist")>]
[<InlineData("Backup includes config files with --include-config")>]
[<InlineData("Backup without --include-config ignores config files")>]
[<InlineData("Backup with --include-config and no config files found")>]
[<InlineData("Backup discovers common secret file patterns")>]
[<InlineData("The .git directory itself is never backed up")>]
[<InlineData("Dry-run backup previews without writing files")>]
let ``every backup behaviour has in-process Unit proof`` title =
    let s = EnvSteps()

    match title with
    | "Backup discovers and copies all .env files" ->
        s.``a git repository containing .env files at the root and in app subdirectories`` ()
        s.``the developer runs rhino-cli env backup`` ()
        s.``the command exits successfully`` ()
        s.``each .env file is copied to the backup directory preserving its relative path`` ()
        s.``the output lists each backed-up file`` ()
    | "Backup with custom directory" ->
        s.``a git repository containing a .env file at the root`` ()
        s.``the developer runs rhino-cli env backup with --dir pointing to a directory outside the repository`` ()
        s.``the command exits successfully`` ()
        s.``the .env file is copied to the specified directory preserving its relative path`` ()
    | "Backup rejects a directory inside the repository" ->
        s.``a git repository containing a .env file at the root`` ()
        s.``the developer runs rhino-cli env backup with --dir pointing to a path inside the git root`` ()
        s.``the command exits with a failure code`` ()
        s.``the output warns that the backup directory must be outside the repository`` ()
    | "Symlinks and oversized files are skipped" ->
        s.``a git repository containing a symlinked .env file, a .env file larger than 1 MB, and a regular .env file`` ()
        s.``the developer runs rhino-cli env backup`` ()
        s.``the command exits successfully`` ()
        s.``the symlinked .env file is skipped with a warning`` ()
        s.``the oversized .env file is skipped with a warning`` ()
        s.``the regular .env file is copied to the backup directory`` ()
    | "Backup with zero .env files" ->
        s.``a git repository containing no .env files`` ()
        s.``the developer runs rhino-cli env backup`` ()
        s.``the command exits successfully`` ()
        s.``the output reports that zero files were backed up`` ()
    | "JSON output for backup" ->
        s.``a git repository containing a .env file at the root`` ()
        s.``the developer runs rhino-cli env backup with --output json`` ()
        s.``the command exits successfully`` ()
        s.``the output is valid JSON`` ()
        s.``the JSON includes the direction, backup directory, list of files, copied count, and skipped count`` ()
    | "Env files inside auto-generated directories are not discovered" ->
        s.``a git repository containing .env files inside node_modules, dist, build, .next, __pycache__, target, vendor, coverage, and generated-contracts directories`` ()

        s.``the developer runs rhino-cli env backup`` ()
        s.``the command exits successfully`` ()
        s.``none of the .env files inside auto-generated directories are backed up`` ()
    | "Env files inside nested auto-generated directories are not discovered" ->
        s.``a git repository where apps/web/node_modules contains a .env file and apps/web contains a .env.local file`` ()
        s.``the developer runs rhino-cli env backup`` ()
        s.``the command exits successfully`` ()
        s.``only apps/web/.env.local is copied to the backup directory`` ()
        s.``the .env file inside apps/web/node_modules is not backed up`` ()
    | "Backup works in a git worktree" ->
        s.``a git worktree containing a .env file at its root`` ()
        s.``the developer runs rhino-cli env backup`` ()
        s.``the command exits successfully`` ()
        s.``the .env file is copied to the backup directory with a flat structure`` ()
    | "Worktree-aware backup namespaces by worktree name" ->
        s.``a git worktree named "(.*)" containing a .env file at its root`` ("feature-branch")
        s.``the developer runs rhino-cli env backup with --worktree-aware`` ()
        s.``the command exits successfully`` ()
        s.``the .env file is copied under a feature-branch subdirectory inside the backup directory`` ()
    | "Main repo with worktree-aware uses repository directory name" ->
        s.``the main git repository named "(.*)" containing a .env file at its root`` ("open-sharia-enterprise")
        s.``the developer runs rhino-cli env backup with --worktree-aware`` ()
        s.``the command exits successfully`` ()
        s.``the .env file is copied under an open-sharia-enterprise subdirectory inside the backup directory`` ()
    | "Backup prompts when destination files already exist" ->
        s.``a git repository containing a .env file at the root`` ()
        s.``the backup directory already contains a backed-up .env file`` ()
        s.``the developer runs rhino-cli env backup and confirms the overwrite`` ()
        s.``the command exits successfully`` ()
        s.``the .env file is overwritten in the backup directory`` ()
    | "Backup aborts when user declines overwrite" ->
        s.``a git repository containing a .env file at the root`` ()
        s.``the backup directory already contains a backed-up .env file`` ()
        s.``the developer runs rhino-cli env backup and declines the overwrite`` ()
        s.``the command exits successfully`` ()
        s.``the output reports that backup was cancelled`` ()
        s.``the existing backup file is unchanged`` ()
    | "Backup with --force skips confirmation" ->
        s.``a git repository containing a .env file at the root`` ()
        s.``the backup directory already contains a backed-up .env file`` ()
        s.``the developer runs rhino-cli env backup with --force`` ()
        s.``the command exits successfully`` ()
        s.``the .env file is overwritten in the backup directory without prompting`` ()
    | "Backup proceeds without prompt when no conflicts exist" ->
        s.``a git repository containing a .env file at the root`` ()
        s.``the backup directory is empty`` ()
        s.``the developer runs rhino-cli env backup`` ()
        s.``the command exits successfully`` ()
        s.``no confirmation prompt is shown`` ()
        s.``the .env file is copied to the backup directory`` ()
    | "Backup includes config files with --include-config" ->
        s.``a git repository containing a .env file and a .claude/settings.local.json file`` ()
        s.``the developer runs rhino-cli env backup with --include-config and --force`` ()
        s.``the command exits successfully`` ()
        s.``the .env file is copied to the backup directory`` ()
        s.``the .claude/settings.local.json is copied to the backup directory preserving its relative path`` ()
    | "Backup without --include-config ignores config files" ->
        s.``a git repository containing a .env file and a .claude/settings.local.json file`` ()
        s.``the developer runs rhino-cli env backup with --force`` ()
        s.``the command exits successfully`` ()
        s.``the .env file is copied to the backup directory`` ()
        s.``the .claude/settings.local.json is not copied to the backup directory`` ()
    | "Backup with --include-config and no config files found" ->
        s.``a git repository containing a .env file but no known config files`` ()
        s.``the developer runs rhino-cli env backup with --include-config and --force`` ()
        s.``the command exits successfully`` ()
        s.``only the .env file is copied to the backup directory`` ()
    | "Backup discovers common secret file patterns" ->
        s.``a git repository containing a secrets.json file at the root`` ()
        s.``a git repository containing a cert.pem file at the root`` ()
        s.``a git repository containing a .secrets/notes.md file`` ()
        s.``the developer runs rhino-cli env backup`` ()
        s.``the command exits successfully`` ()
        s.``secrets.json is copied to the backup directory`` ()
        s.``cert.pem is copied to the backup directory`` ()
        s.``.secrets/notes.md is copied to the backup directory preserving its relative path`` ()
    | "The .git directory itself is never backed up" ->
        s.``a git repository containing a .env file and a secrets.json file`` ()
        s.``the developer runs rhino-cli env backup`` ()
        s.``the command exits successfully`` ()
        s.``no files from the .git directory are backed up`` ()
    | "Dry-run backup previews without writing files" ->
        s.``a git repository containing a secrets.json file at the root`` ()
        s.``a git repository containing a cert.pem file at the root`` ()
        s.``a git repository containing a .secrets/notes.md file`` ()
        s.``the developer runs rhino-cli env backup with --dry-run`` ()
        s.``no files are written to the backup directory`` ()
        s.``the output lists the files that would be backed up`` ()
    | other -> Assert.Fail(sprintf "unmapped backup scenario: %s" other)

[<Fact>]
let ``backup dry run previews without copying`` () =
    let steps = EnvSteps()
    steps.``a git repository containing a .env file and a secrets.json file`` ()
    steps.``the developer runs rhino-cli env backup with --dry-run`` ()
    steps.``no files are written to the backup directory`` ()
    steps.``the output lists the files that would be backed up`` ()
