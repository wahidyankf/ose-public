/// The single top-level help text `-h`/`--help` prints regardless of which
/// subcommand it appears on [Repo-grounded — `apps/rhino-cli/src/cli.rs`'s
/// `disable_help_flag = true` plus its manual `cli.help` check: clap's
/// per-subcommand contextual help is disabled in favor of one canonical
/// message everywhere, captured verbatim from
/// `apps/rhino-cli/target/gate/rhino-cli --help`].
module RhinoCli.Cli.HelpText

/// Verbatim, byte-for-byte copy of the Rust binary's `--help` output,
/// including its trailing blank line, plus the `plan` command added after the
/// Rust binary retired.
[<Literal>]
let Text =
    "CLI tools for repository management\n\nUsage: rhino-cli [OPTIONS] [COMMAND]\n\nCommands:\n  test-coverage    Test coverage commands (validate)\n  repo-governance  Repository governance audits and validators\n  md               Markdown validators (links, mermaid, heading-hierarchy, naming, frontmatter, etc.)\n  convention       Convention validators (emoji, license)\n  harness          Harness (agent binding) validators and generators\n  governance       Cross-cutting governance gates (word budget, README index/completeness)\n  specs            Spec tree validators and contract codegen helpers\n  repo-config      Repository configuration (`repo-config.yml`) schema-parity validator\n  plan             Plan structure validator (validate)\n  env              Environment file helpers (init, backup, restore, validate, staged-guard)\n  gate             Gate-registry commands\n  git              Git workflow helpers\n  parity           Rhino CLI byte-identity boundary helpers\n  doctor           Check required tool versions are installed and correct\n  help             Print this message or the help of the given subcommand(s)\n\nOptions:\n  -v, --verbose          verbose output with timestamps\n  -q, --quiet            quiet mode (errors only)\n  -o, --output <OUTPUT>  output format: text, json, markdown [default: text]\n      --no-color         disable colored output\n      --say <SAY>        echo a message to stdout [default: \"\"]\n  -h, --help             Print help\n  -V, --version          Print version\n\n"
