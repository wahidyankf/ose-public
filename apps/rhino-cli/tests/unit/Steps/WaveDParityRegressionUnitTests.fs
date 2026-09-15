/// Regression tests for two Wave D parity defects that `shadow-diff.sh`
/// caught only against the private sibling's corpus — neither reproduces on
/// `ose-public` data, so both would have shipped had the wave been verified
/// in one repo alone.
module RhinoCli.Tests.Unit.Steps.WaveDParityRegressionUnitTests

open Xunit
open RhinoCli.Application
open RhinoCli.Cli.Formatters

/// The label that exposed the defect, from the private sibling's
/// `plans/done/2026-07-27__harden-onprem-nic-resilience/tech-docs.md`.
/// U+1F4DD is one Unicode scalar but two UTF-16 code units, so the old
/// `String.Length` measured 31 against a `--max-label-len` of 30 and emitted
/// a `label_too_long` violation the Rust binary never produced.
[<Fact>]
let ``effectiveMermaidLabelLen counts an astral char as one scalar, not two UTF-16 units`` () =
    Assert.Equal(30, Md.effectiveMermaidLabelLen "\U0001F4DD Log recovery via link-bounce")

[<Fact>]
let ``effectiveMermaidLabelLen still counts a genuinely over-long ASCII label`` () =
    Assert.Equal(31, Md.effectiveMermaidLabelLen (String.replicate 31 "a"))

[<Fact>]
let ``effectiveMermaidLabelLen takes the longest line across break tokens`` () =
    Assert.Equal(3, Md.effectiveMermaidLabelLen "ab<br/>cde")

let private wordBudgetFinding: Governance.WordBudgetFinding =
    { Path = "repo-governance/workflows/plan/plan-execution/README.md"
      Size = 901UL
      Target = 900UL
      Warn = 1000UL
      Fail = 1000UL
      Severity = Governance.WordBudgetSeverity.Warn
      Message = "repo-governance/workflows/plan/plan-execution/README.md is 901 words (over 900-word target)" }

/// Rust emits four columns with `| --- |` separators and a backticked path
/// [Repo-grounded — `governance_validate_word_budget.rs`]. The F# port had
/// drifted to a seven-column table, which stayed invisible in `ose-public`
/// because no surface there is over budget, so the table never rendered.
[<Fact>]
let ``wordBudgetMarkdown renders Rust's four-column table with a backticked path`` () =
    let rendered = wordBudgetMarkdown [ wordBudgetFinding ]

    Assert.Contains("| Path | Size (words) | Severity | Message |\n| --- | --- | --- | --- |\n", rendered)

    Assert.Contains(
        "| `repo-governance/workflows/plan/plan-execution/README.md` | 901 | warn | repo-governance/workflows/plan/plan-execution/README.md is 901 words (over 900-word target) |",
        rendered
    )

    Assert.DoesNotContain("| Target | Warn | Fail |", rendered)

[<Fact>]
let ``wordBudgetMarkdown reports the passing shape when there are no findings`` () =
    Assert.Equal("## Word Budget Audit\n\n**PASSED**: all surfaces within budget\n", wordBudgetMarkdown [])
