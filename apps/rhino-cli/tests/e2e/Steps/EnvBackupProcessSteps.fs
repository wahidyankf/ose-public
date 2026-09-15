module RhinoCli.Tests.E2E.Steps.EnvBackupProcessSteps

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/env/env-backup.feature" ]

open System
open System.Diagnostics
open System.IO
open System.Text.Json
open TickSpec
open Xunit

let private repositoryRoot =
    Path.GetFullPath(Path.Combine(__SOURCE_DIRECTORY__, "..", "..", "..", "..", ".."))

let private executable =
    Path.Combine(repositoryRoot, "apps", "rhino-cli", "src", "dist", "rhino-cli-fsharp")

type EnvBackupProcessSteps() =
    let fixture =
        Path.Combine(Path.GetTempPath(), "rhino-cli-env-backup-e2e-" + Guid.NewGuid().ToString("N"))

    let mutable root = Path.Combine(fixture, "repository")
    let backup = Path.Combine(fixture, "backup")
    let mutable expected: string list = []
    let mutable output = ""
    let mutable exitCode = 0
    let mutable answer: string option = None

    let initRoot name =
        root <- Path.Combine(fixture, name)
        Directory.CreateDirectory root |> ignore

        let info =
            ProcessStartInfo(FileName = "git", WorkingDirectory = root, UseShellExecute = false)

        info.ArgumentList.Add("init")
        info.ArgumentList.Add("-q")
        use proc = Process.Start info
        proc.WaitForExit()
        Assert.Equal(0, proc.ExitCode)

    do initRoot "repository"

    let write (baseDir: string) (relative: string) (content: string) =
        let path = Path.Combine(baseDir, relative)
        Directory.CreateDirectory(Path.GetDirectoryName path) |> ignore
        File.WriteAllText(path, content)

    let invoke globalArgs commandArgs =
        let info =
            ProcessStartInfo(
                FileName = executable,
                WorkingDirectory = root,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                RedirectStandardInput = true
            )

        globalArgs @ [ "env"; "backup"; "--dir"; backup ] @ commandArgs
        |> List.iter info.ArgumentList.Add

        use proc = Process.Start info

        answer
        |> Option.iter (fun value ->
            proc.StandardInput.WriteLine(value)
            proc.StandardInput.Close())

        output <- proc.StandardOutput.ReadToEnd() + proc.StandardError.ReadToEnd()
        proc.WaitForExit()
        exitCode <- proc.ExitCode

    let backed relative =
        File.Exists(Path.Combine(backup, relative))

    [<Given>]
    member _.``a git repository containing .env files at the root and in app subdirectories``() =
        expected <- [ ".env"; "apps/web/.env"; "apps/api/.env" ]
        expected |> List.iter (fun path -> write root path "key=value")

    [<Given>]
    member _.``a git repository containing a .env file at the root``() = write root ".env" "k=v"

    [<Given>]
    member _.``the backup directory already contains a backed-up .env file``() = write backup ".env" "old-backup"

    [<Given>]
    member _.``the backup directory is empty``() =
        Directory.CreateDirectory backup |> ignore

    [<Given>]
    member _.``a git repository containing a symlinked .env file, a .env file larger than 1 MB, and a regular .env file``
        ()
        =
        write root "target.txt" "target"

        File.CreateSymbolicLink(Path.Combine(root, ".env.symlink"), Path.Combine(root, "target.txt"))
        |> ignore

        File.WriteAllBytes(Path.Combine(root, ".env.large"), Array.zeroCreate<byte>(1024 * 1024 + 1))
        write root ".env" "regular=1"

    [<Given>]
    member _.``a git repository containing no .env files``() = write root "README.md" "nothing"

    [<Given>]
    member _.``a git repository containing .env files inside node_modules, dist, build, .next, __pycache__, target, vendor, coverage, and generated-contracts directories``
        ()
        =
        [ "node_modules"
          "dist"
          "build"
          ".next"
          "__pycache__"
          "target"
          "vendor"
          "coverage"
          "generated-contracts" ]
        |> List.iter (fun dir -> write root (dir + "/.env") "skip=1")

    [<Given>]
    member _.``a git repository where apps/web/node_modules contains a .env file and apps/web contains a .env.local file``
        ()
        =
        write root "apps/web/node_modules/.env" "skip=1"
        write root "apps/web/.env.local" "keep=1"

    [<Given>]
    member _.``a git worktree containing a .env file at its root``() = write root ".env" "k=v"

    [<Given>]
    member _.``a git worktree named "(.*)" containing a .env file at its root``(name: string) =
        initRoot name
        write root ".env" "k=v"

    [<Given>]
    member _.``the main git repository named "(.*)" containing a .env file at its root``(name: string) =
        initRoot name
        write root ".env" "k=v"

    [<Given>]
    member _.``a git repository containing a .env file and a .claude/settings.local.json file``() =
        write root ".env" "k=v"
        write root ".claude/settings.local.json" "{}"

    [<Given>]
    member _.``a git repository containing a .env file but no known config files``() = write root ".env" "k=v"

    [<Given>]
    member _.``a git repository containing a secrets.json file at the root``() = write root "secrets.json" "{}"

    [<Given>]
    member _.``a git repository containing a cert.pem file at the root``() = write root "cert.pem" "certificate"

    [<Given>]
    member _.``a git repository containing a .secrets/notes.md file``() = write root ".secrets/notes.md" "notes"

    [<Given>]
    member _.``a git repository containing a .env file and a secrets.json file``() =
        write root ".env" "k=v"
        write root "secrets.json" "{}"
        write root ".git/config-test" "never"

    [<When>]
    member _.``the developer runs rhino-cli env backup``() = invoke [] []

    [<When>]
    member _.``the developer runs rhino-cli env backup with --dir pointing to a directory outside the repository``() =
        invoke [] []

    [<When>]
    member _.``the developer runs rhino-cli env backup with --dir pointing to a path inside the git root``() =
        let inside = Path.Combine(root, "inside-backup")

        let info =
            ProcessStartInfo(
                FileName = executable,
                WorkingDirectory = root,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            )

        [ "env"; "backup"; "--dir"; inside ] |> List.iter info.ArgumentList.Add
        use proc = Process.Start info
        output <- proc.StandardOutput.ReadToEnd() + proc.StandardError.ReadToEnd()
        proc.WaitForExit()
        exitCode <- proc.ExitCode

    [<When>]
    member _.``the developer runs rhino-cli env backup with --output json``() = invoke [] [ "-o"; "json" ]

    [<When>]
    member _.``the developer runs rhino-cli env backup with --worktree-aware``() = invoke [] [ "--worktree-aware" ]

    [<When>]
    member _.``the developer runs rhino-cli env backup and confirms the overwrite``() =
        answer <- Some "y"
        invoke [] []

    [<When>]
    member _.``the developer runs rhino-cli env backup and declines the overwrite``() =
        answer <- Some "n"
        invoke [] []

    [<When>]
    member _.``the developer runs rhino-cli env backup with --force``() = invoke [] [ "--force" ]

    [<When>]
    member _.``the developer runs rhino-cli env backup with --include-config and --force``() =
        invoke [] [ "--include-config"; "--force" ]

    [<When>]
    member _.``the developer runs rhino-cli env backup with --dry-run``() = invoke [] [ "--dry-run" ]

    [<Then>]
    member _.``the command exits successfully``() = Assert.Equal(0, exitCode)

    [<Then>]
    member _.``the command exits with a failure code``() = Assert.NotEqual(0, exitCode)

    [<Then>]
    member _.``each .env file is copied to the backup directory preserving its relative path``() =
        expected |> List.iter (fun path -> Assert.True(backed path, path))

    [<Then>]
    member _.``the output lists each backed-up file``() =
        expected |> List.iter (fun path -> Assert.Contains(path, output))

    [<Then>]
    member _.``the .env file is copied to the specified directory preserving its relative path``() =
        Assert.True(backed ".env")

    [<Then>]
    member _.``the output warns that the backup directory must be outside the repository``() =
        Assert.Contains("outside the repo", output)

    [<Then>]
    member _.``the symlinked .env file is skipped with a warning``() =
        Assert.False(backed ".env.symlink")
        Assert.Contains("symlink", output)

    [<Then>]
    member _.``the oversized .env file is skipped with a warning``() =
        Assert.False(backed ".env.large")
        Assert.Contains("exceeds", output)

    [<Then>]
    member _.``the regular .env file is copied to the backup directory``() = Assert.True(backed ".env")

    [<Then>]
    member _.``the output reports that zero files were backed up``() = Assert.Contains("0 file(s)", output)

    [<Then>]
    member _.``the output is valid JSON``() =
        use _doc = JsonDocument.Parse(output)
        ()

    [<Then>]
    member _.``the JSON includes the direction, backup directory, list of files, copied count, and skipped count``() =
        [ "direction"; "dir"; "files"; "copied"; "skipped" ]
        |> List.iter (fun key -> Assert.Contains(key, output))

    [<Then>]
    member _.``none of the .env files inside auto-generated directories are backed up``() =
        if Directory.Exists backup then
            Assert.Empty(Directory.EnumerateFiles(backup, ".env", SearchOption.AllDirectories))

    [<Then>]
    member _.``only apps/web/.env.local is copied to the backup directory``() =
        Assert.True(backed "apps/web/.env.local")

    [<Then>]
    member _.``the .env file inside apps/web/node_modules is not backed up``() =
        Assert.False(backed "apps/web/node_modules/.env")

    [<Then>]
    member _.``the .env file is copied to the backup directory with a flat structure``() = Assert.True(backed ".env")

    [<Then>]
    member _.``the .env file is copied under a feature-branch subdirectory inside the backup directory``() =
        Assert.True(backed "feature-branch/.env")

    [<Then>]
    member _.``the .env file is copied under an open-sharia-enterprise subdirectory inside the backup directory``() =
        Assert.True(backed "open-sharia-enterprise/.env")

    [<Then>]
    member _.``the .env file is overwritten in the backup directory``() =
        Assert.Equal("k=v", File.ReadAllText(Path.Combine(backup, ".env")))

    [<Then>]
    member _.``the output reports that backup was cancelled``() =
        Assert.Contains("cancelled", output, StringComparison.OrdinalIgnoreCase)

    [<Then>]
    member _.``the existing backup file is unchanged``() =
        Assert.Equal("old-backup", File.ReadAllText(Path.Combine(backup, ".env")))

    [<Then>]
    member _.``the .env file is overwritten in the backup directory without prompting``() =
        Assert.Equal("k=v", File.ReadAllText(Path.Combine(backup, ".env")))
        Assert.DoesNotContain("Overwrite?", output)

    [<Then>]
    member _.``no confirmation prompt is shown``() =
        Assert.DoesNotContain("Overwrite?", output)

    [<Then>]
    member _.``the .env file is copied to the backup directory``() = Assert.True(backed ".env")

    [<Then>]
    member _.``the .claude/settings.local.json is copied to the backup directory preserving its relative path``() =
        Assert.True(backed ".claude/settings.local.json")

    [<Then>]
    member _.``the .claude/settings.local.json is not copied to the backup directory``() =
        Assert.False(backed ".claude/settings.local.json")

    [<Then>]
    member _.``only the .env file is copied to the backup directory``() =
        Assert.True(backed ".env")
        Assert.Equal(1, Directory.EnumerateFiles(backup, "*", SearchOption.AllDirectories) |> Seq.length)

    [<Then>]
    member _.``secrets.json is copied to the backup directory``() = Assert.True(backed "secrets.json")

    [<Then>]
    member _.``cert.pem is copied to the backup directory``() = Assert.True(backed "cert.pem")

    [<Then>]
    member _.``.secrets/notes.md is copied to the backup directory preserving its relative path``() =
        Assert.True(backed ".secrets/notes.md")

    [<Then>]
    member _.``no files from the .git directory are backed up``() =
        Assert.False(Directory.Exists(Path.Combine(backup, ".git")))

    [<Then>]
    member _.``no files are written to the backup directory``() =
        if Directory.Exists backup then
            Assert.Empty(Directory.EnumerateFileSystemEntries backup)

    [<Then>]
    member _.``the output lists the files that would be backed up``() =
        Assert.Contains("WOULD", output)
        Assert.Contains("secrets.json", output)

    [<AfterScenario>]
    member _.Cleanup() =
        if Directory.Exists fixture then
            Directory.Delete(fixture, true)

module private FeatureRunner =
    let run title =
        let path =
            Path.Combine(repositoryRoot, "specs/apps/rhino/cli/behaviours/env/env-backup.feature")

        let lines = File.ReadAllLines path

        let featureLine =
            lines |> Array.find (fun line -> line.TrimStart().StartsWith("Feature:"))

        let startIndex =
            lines |> Array.findIndex (fun line -> line.Trim() = "Scenario: " + title)

        let endIndex =
            lines
            |> Array.skip (startIndex + 1)
            |> Array.tryFindIndex (fun line ->
                line.TrimStart().StartsWith("Scenario:") || line.TrimStart().StartsWith("@"))
            |> Option.map (fun offset -> startIndex + 1 + offset)
            |> Option.defaultValue lines.Length

        let definitions = StepDefinitions([| typeof<EnvBackupProcessSteps> |])

        let feature =
            definitions.GenerateFeature(path, Array.append [| featureLine; "" |] lines.[startIndex .. endIndex - 1])

        (Seq.exactlyOne feature.Scenarios).Action.Invoke()

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
let ``backup crosses the published CLI boundary`` title = FeatureRunner.run title
