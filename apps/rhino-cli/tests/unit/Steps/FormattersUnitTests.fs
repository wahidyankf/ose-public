/// Plain xunit tests for `RhinoCli.Cli.Formatters` — the per-format
/// renderers and `Finding.Message`-parsing adapters that recover Rust's
/// structured `LicenseFinding` fields for JSON/Markdown
/// output. `shadow-diff.sh` already proves these byte-match the real Rust
/// binary against live repo data; these tests pin that behaviour at the
/// unit level and cover the malformed-message guard clauses shadow-diff's
/// real-data run never exercises.
module RhinoCli.Tests.Unit.Steps.FormattersUnitTests

open Xunit
open RhinoCli.Domain.Types
open RhinoCli.Cli.Formatters

let private licenseFinding (message: string) (path: string) : Finding =
    { Severity = Severity.Blocking
      Message = message
      Path = Some path }

// ---- toLicenseFindingJson ----

[<Fact>]
let ``toLicenseFindingJson recovers kind, path, and message`` () =
    let f =
        licenseFinding "[missing-license] apps/foo — required directory \"apps/foo\" has no LICENSE file" "apps/foo"

    let json = toLicenseFindingJson f
    Assert.Equal("missing-license", json.kind)
    Assert.Equal("apps/foo", json.path)
    Assert.Equal("required directory \"apps/foo\" has no LICENSE file", json.message)

[<Fact>]
let ``toLicenseFindingJson defaults path to empty when Finding.Path is None`` () =
    let f =
        { Severity = Severity.Blocking
          Message = "[missing-license] apps/foo — msg"
          Path = None }

    let json = toLicenseFindingJson f
    Assert.Equal("", json.path)

[<Fact>]
let ``toLicenseFindingJson throws when the message has no closing bracket`` () =
    let f = licenseFinding "missing-license apps/foo msg" "apps/foo"

    Assert.Throws<System.Exception>(fun () -> toLicenseFindingJson f |> ignore)
    |> ignore

[<Fact>]
let ``toLicenseFindingJson throws when the message has no em-dash separator`` () =
    let f = licenseFinding "[missing-license] apps/foo msg" "apps/foo"

    Assert.Throws<System.Exception>(fun () -> toLicenseFindingJson f |> ignore)
    |> ignore

// ---- licenseText / licenseJson / licenseMarkdown ----

[<Fact>]
let ``licenseText reports PASSED when there are no findings`` () =
    Assert.Equal("LICENSE AUDIT PASSED: no findings\n", licenseText [])

[<Fact>]
let ``licenseText reports FAILED with each finding's message`` () =
    let s = licenseText [ licenseFinding "[missing-license] apps/foo — msg" "apps/foo" ]
    Assert.Equal("LICENSE AUDIT FAILED: 1 finding(s)\n  [missing-license] apps/foo — msg\n", s)

[<Fact>]
let ``licenseJson renders a passed envelope for an empty finding list`` () =
    let expected =
        "{\n  \"schema\": \"rhino-cli/license-audit/v1\",\n  \"status\": \"passed\",\n  \"result\": {\n    \"total_findings\": 0,\n    \"findings\": []\n  }\n}\n"

    Assert.Equal(expected, licenseJson [])

[<Fact>]
let ``licenseJson renders a failed envelope with one finding`` () =
    let s = licenseJson [ licenseFinding "[missing-license] apps/foo — msg" "apps/foo" ]
    Assert.Contains("\"status\": \"failed\"", s)
    Assert.Contains("\"total_findings\": 1", s)
    Assert.Contains("\"kind\": \"missing-license\"", s)

[<Fact>]
let ``licenseMarkdown renders PASSED when there are no findings`` () =
    Assert.Equal("## License Audit\n\n**PASSED**: no findings\n", licenseMarkdown [])

[<Fact>]
let ``licenseMarkdown renders a table row per finding`` () =
    let s =
        licenseMarkdown [ licenseFinding "[missing-license] apps/foo — msg" "apps/foo" ]

    Assert.Contains("**FAILED**: 1 finding(s)", s)
    Assert.Contains("| missing-license | `apps/foo` | msg |", s)

// ---- render ----

[<Fact>]
let ``render dispatches to the matching format's thunk`` () =
    let asText () = "text"
    let asJson () = "json"
    let asMarkdown () = "markdown"
    Assert.Equal("text", render Text asText asJson asMarkdown)
    Assert.Equal("json", render Json asText asJson asMarkdown)
    Assert.Equal("markdown", render Markdown asText asJson asMarkdown)

// ---- test-boundary renderers ----

let private boundaryFinding kind severity : RhinoCli.Application.TestBoundary.TestBoundaryFinding =
    { Project = "ose-be"
      Path = "apps/ose-be/tests/integration/HttpTests.fs"
      Line = 3
      Severity = severity
      Kind = kind
      Message = "reaches the network" }

[<Fact>]
let ``testBoundaryText delegates to the audit's own renderer`` () =
    Assert.Equal(RhinoCli.Application.TestBoundary.formatText [], testBoundaryText [])

[<Fact>]
let ``testBoundaryJson reports passed with no findings`` () =
    let json = testBoundaryJson []
    Assert.Contains("\"schema\": \"rhino-cli/test-boundary/v1\"", json, System.StringComparison.Ordinal)
    Assert.Contains("\"status\": \"passed\"", json, System.StringComparison.Ordinal)
    Assert.Contains("\"count\": 0", json, System.StringComparison.Ordinal)

[<Fact>]
let ``testBoundaryJson reports failed and carries every finding field`` () =
    let json =
        testBoundaryJson [ boundaryFinding "unallowlisted-network-use" "blocking" ]

    Assert.Contains("\"status\": \"failed\"", json, System.StringComparison.Ordinal)
    Assert.Contains("\"project\": \"ose-be\"", json, System.StringComparison.Ordinal)
    Assert.Contains("\"path\": \"apps/ose-be/tests/integration/HttpTests.fs\"", json, System.StringComparison.Ordinal)
    Assert.Contains("\"line\": 3", json, System.StringComparison.Ordinal)
    Assert.Contains("\"severity\": \"blocking\"", json, System.StringComparison.Ordinal)
    Assert.Contains("\"kind\": \"unallowlisted-network-use\"", json, System.StringComparison.Ordinal)
    Assert.Contains("\"message\": \"reaches the network\"", json, System.StringComparison.Ordinal)

[<Fact>]
let ``testBoundaryJson stays passed when every finding is a warning`` () =
    Assert.Contains(
        "\"status\": \"passed\"",
        testBoundaryJson [ boundaryFinding "stale-allowlist-entry" "warning" ],
        System.StringComparison.Ordinal
    )

[<Fact>]
let ``testBoundaryMarkdown renders the zero-finding heading`` () =
    Assert.Equal("## Integration Test Network Boundary Audit\n\n**PASSED**: zero findings\n", testBoundaryMarkdown [])

[<Fact>]
let ``testBoundaryMarkdown renders a FAILED table for a blocking finding`` () =
    let markdown =
        testBoundaryMarkdown [ boundaryFinding "unallowlisted-network-use" "blocking" ]

    Assert.Contains("**FAILED**: 1 finding(s) reported", markdown, System.StringComparison.Ordinal)
    Assert.Contains("| Project | Path | Line | Severity | Kind | Message |", markdown, System.StringComparison.Ordinal)

    Assert.Contains(
        "| ose-be | apps/ose-be/tests/integration/HttpTests.fs | 3 | blocking | unallowlisted-network-use | reaches the network |",
        markdown,
        System.StringComparison.Ordinal
    )

[<Fact>]
let ``testBoundaryMarkdown renders a PASSED table when only warnings are present`` () =
    Assert.Contains(
        "**PASSED**: 1 finding(s) reported",
        testBoundaryMarkdown [ boundaryFinding "stale-allowlist-entry" "warning" ],
        System.StringComparison.Ordinal
    )
