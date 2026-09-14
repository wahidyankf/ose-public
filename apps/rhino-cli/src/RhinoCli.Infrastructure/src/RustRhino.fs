/// Hands the rhino-cli validators that RHINO provides to the repository's
/// pinned `./rhino`. The child inherits standard input, output, error and the
/// environment, runs in the repository root, and its exit code comes back
/// unchanged. F# never re-checks the RHINO digest: `./rhino` verifies
/// `rhino.lock` before exec and exits 78 on a mismatch.
module RhinoCli.Infrastructure.RustRhino

open System
open System.ComponentModel
open System.Diagnostics
open System.Diagnostics.CodeAnalysis
open System.IO

/// A usage or configuration refusal; RHINO was not started.
[<Literal>]
let UsageFailure = 2

/// `./rhino` could not be started.
[<Literal>]
let ExecutionFailure = 3

/// How a rhino-cli command reaches RHINO. A `stay` command has no compiled row:
/// it exists only as a keep list in `repo-config.yml`.
type DelegationClass =
    /// RHINO runs the whole command.
    | Delegate
    /// RHINO runs first; the F# remainder runs only when RHINO completed.
    | Split

/// One compiled delegation row, keyed by the rhino-cli command words.
type Delegation =
    {
        Command: string
        Class: DelegationClass
        /// RHINO's own command words.
        Rhino: string
        /// The `repo-config.yml` section that holds RHINO's policy for this command.
        Section: string
        /// Flags whose policy moved into `Section`, each optionally with the one retired value.
        Retired: (string * string option) list
    }

let delegations: Delegation list =
    [ { Command = "repo-config validate"
        Class = Split
        Rhino = "repo-config validate"
        Section = "repo-config"
        Retired = [] }
      { Command = "md naming validate"
        Class = Delegate
        Rhino = "md naming validate"
        Section = "md-naming"
        Retired = [ "--exempt", None ] }
      { Command = "md heading-hierarchy validate"
        Class = Delegate
        Rhino = "md heading-hierarchy validate"
        Section = "md-heading-hierarchy"
        Retired = [ "--exclude", None ] }
      { Command = "md frontmatter validate"
        Class = Split
        Rhino = "md frontmatter validate"
        Section = "md-frontmatter"
        Retired = [] }
      { Command = "md frontmatter-dates validate"
        Class = Split
        Rhino = "md frontmatter validate"
        Section = "md-frontmatter"
        Retired = [] }
      { Command = "md links validate"
        Class = Split
        Rhino = "md internal-link validate"
        Section = "md-internal-link"
        Retired = [ "--exclude", None ] }
      { Command = "convention emoji validate"
        Class = Delegate
        Rhino = "convention emoji validate"
        Section = "convention-emoji"
        Retired = [] }
      { Command = "governance word-budget validate"
        Class = Split
        Rhino = "governance word-budget validate"
        Section = "governance-word-budget"
        Retired = [ "--exclude", None ] }
      { Command = "governance readme-index validate"
        Class = Split
        Rhino = "md readme-index validate"
        Section = "md-readme-index"
        Retired = [ "--fail-kinds", Some "missing" ] }
      { Command = "harness bindings validate"
        Class = Split
        Rhino = "harness parity validate"
        Section = "harness-parity"
        Retired = [] }
      { Command = "harness claude validate"
        Class = Split
        Rhino = "harness parity validate"
        Section = "harness-parity"
        Retired = [] }
      { Command = "harness ownership validate"
        Class = Split
        Rhino = "harness parity validate"
        Section = "harness-parity"
        Retired = [] }
      { Command = "harness catalog validate"
        Class = Split
        Rhino = "harness parity validate"
        Section = "harness-parity"
        Retired = [] }
      { Command = "harness duplication validate"
        Class = Split
        Rhino = "harness parity validate"
        Section = "harness-parity"
        Retired = [] }
      { Command = "md mermaid validate"
        Class = Split
        Rhino = "md mermaid validate"
        Section = "md-mermaid"
        Retired = [] } ]

let tryFind (command: string) : Delegation option =
    delegations |> List.tryFind (fun delegation -> delegation.Command = command)

/// Split commands whose RHINO half checks only the files the F# half selects,
/// each passed as `--file`, instead of walking RHINO's declared surface. A gate
/// runs them on the files its scope selects.
let fileScoped: string list = [ "md mermaid validate" ]

let private words (text: string) : string list =
    text.Split(' ', StringSplitOptions.RemoveEmptyEntries) |> List.ofArray

let private presentationFlag (flag: string) : string option =
    match flag with
    | "-q"
    | "--quiet" -> Some "--quiet"
    | "-v"
    | "--verbose" -> Some "--verbose"
    | "--no-color" -> Some "--no-color"
    | _ -> None

/// Splits `--flag=value` into its name and inline value.
let private splitInline (arg: string) : string * string option =
    match arg.IndexOf '=' with
    | index when arg.StartsWith("--", StringComparison.Ordinal) && index > 2 ->
        arg.Substring(0, index), Some(arg.Substring(index + 1))
    | _ -> arg, None

/// RHINO's argument vector for a rhino-cli invocation: RHINO's words, then
/// `--output text|json`, then the presentation flags in the order given. A
/// refusal names what to do instead and never starts RHINO.
let rhinoArgv (delegation: Delegation) (rawArgs: string list) : Result<string list, string> =
    let refuse (reason: string) =
        Error(sprintf "rhino-cli %s: %s" delegation.Command reason)

    let sectionHint = sprintf "the %s section of repo-config.yml" delegation.Section

    let rec loop (args: string list) (output: string option) (flags: string list) =
        match args with
        | [] ->
            let outputArgs =
                output
                |> Option.map (fun value -> [ "--output"; value ])
                |> Option.defaultValue []

            Ok(words delegation.Rhino @ outputArgs @ List.rev flags)
        | arg :: rest ->
            let name, inlineValue = splitInline arg

            let value, afterValue =
                match inlineValue, rest with
                | Some inlineText, _ -> Some inlineText, rest
                | None, next :: remaining -> Some next, remaining
                | None, [] -> None, rest

            match delegation.Retired |> List.tryFind (fun (flag, _) -> flag = name) with
            | Some(flag, None) -> refuse (sprintf "%s is retired; its policy lives in %s" flag sectionHint)
            | Some(flag, Some retiredValue) when
                value
                |> Option.exists (fun text -> text.Split(',') |> Array.exists (fun part -> part.Trim() = retiredValue))
                ->
                refuse (sprintf "%s %s is retired; its policy lives in %s" flag retiredValue sectionHint)
            | Some _ -> loop afterValue output flags
            | None ->
                match name, presentationFlag name with
                | ("-o" | "--output"), _ ->
                    match value with
                    | Some "text" -> loop afterValue (Some "text") flags
                    | Some "json" when delegation.Class = Split ->
                        refuse (
                            sprintf
                                "--output json is not available for a split command; run ./rhino %s --output json for RHINO's part"
                                delegation.Rhino
                        )
                    | Some "json" -> loop afterValue (Some "json") flags
                    | Some other -> refuse (sprintf "--output %s is not available; RHINO writes text or json" other)
                    | None -> refuse "--output needs a value: text or json"
                | _, Some flag -> loop rest output (flag :: flags)
                | _ when delegation.Class = Split -> loop rest output flags
                | _ when arg.StartsWith("-", StringComparison.Ordinal) ->
                    refuse (sprintf "%s is not a RHINO option; RHINO reads its policy from %s" arg sectionHint)
                | _ ->
                    refuse (
                        sprintf "RHINO walks the surface declared in %s; remove the path argument %s" sectionHint arg
                    )

    loop rawArgs None []

/// How RHINO is started; tests replace both members.
type Launcher =
    { CanExecute: string -> bool
      Start: ProcessStartInfo -> int }

/// The repository's pinned RHINO. Never `PATH`, never a download.
let resolve (repoRoot: string) : string = Path.Combine(repoRoot, "rhino")

/// Starts `./rhino` with no shell and no redirection, so the child inherits
/// this process's standard streams and environment.
let startInfo (repoRoot: string) (argv: string list) : ProcessStartInfo =
    let info =
        ProcessStartInfo(FileName = resolve repoRoot, WorkingDirectory = repoRoot, UseShellExecute = false)

    argv |> List.iter info.ArgumentList.Add
    info

let runWith (launcher: Launcher) (error: string -> unit) (repoRoot: string) (argv: string list) : int =
    if not (launcher.CanExecute(resolve repoRoot)) then
        error "rhino-cli: ./rhino is missing or not executable at the repository root"
        ExecutionFailure
    else
        try
            launcher.Start(startInfo repoRoot argv)
        with :? Win32Exception as ex ->
            error (sprintf "rhino-cli: ./rhino could not be started: %s" (ex.Message.ReplaceLineEndings " "))
            ExecutionFailure

let private isExecutable (path: string) : bool =
    File.Exists path
    && (File.GetUnixFileMode path
        &&& (UnixFileMode.UserExecute
             ||| UnixFileMode.GroupExecute
             ||| UnixFileMode.OtherExecute))
       <> UnixFileMode.None

[<ExcludeFromCodeCoverage>]
let private start (info: ProcessStartInfo) : int =
    Console.Out.Flush()
    use proc = Process.Start info
    proc.WaitForExit()
    proc.ExitCode

/// Runs the repository's pinned RHINO and returns its exit code unchanged.
[<ExcludeFromCodeCoverage>]
let run (repoRoot: string) (argv: string list) : int =
    runWith
        { CanExecute = isExecutable
          Start = start }
        (fun line -> eprintfn "%s" line)
        repoRoot
        argv

let private delegationFor (command: string) : Delegation =
    match tryFind command with
    | Some delegation -> delegation
    | None -> invalidArg (nameof command) (sprintf "no compiled delegation row for %s" command)

/// A split command's exit: RHINO's when it did not complete, then the
/// remainder's when it did not complete, otherwise the larger of the two.
let combine (rhinoExit: int) (remainder: unit -> int) : int =
    if rhinoExit <> 0 && rhinoExit <> 1 then
        rhinoExit
    else
        match remainder () with
        | remainderExit when remainderExit <> 0 && remainderExit <> 1 -> remainderExit
        | remainderExit -> max rhinoExit remainderExit

let runDelegated (runner: string list -> int) (error: string -> unit) (command: string) (rawArgs: string list) : int =
    match rhinoArgv (delegationFor command) rawArgs with
    | Error message ->
        error message
        UsageFailure
    | Ok argv -> runner argv

let runSplit
    (runner: string list -> int)
    (error: string -> unit)
    (command: string)
    (rawArgs: string list)
    (remainder: unit -> int)
    : int =
    match rhinoArgv (delegationFor command) rawArgs with
    | Error message ->
        error message
        UsageFailure
    | Ok argv -> combine (runner argv) remainder

/// A file-scoped split command: RHINO checks only `files`, one `--file` each,
/// then the F# remainder runs only when RHINO completed. An empty selection
/// never starts RHINO.
let runSplitOnFiles
    (runner: string list -> int)
    (error: string -> unit)
    (command: string)
    (rawArgs: string list)
    (files: string list)
    (remainder: unit -> int)
    : int =
    match rhinoArgv (delegationFor command) rawArgs with
    | Error message ->
        error message
        UsageFailure
    | Ok _ when List.isEmpty files -> combine 0 remainder
    | Ok argv -> combine (runner (argv @ (files |> List.collect (fun file -> [ "--file"; file ])))) remainder
