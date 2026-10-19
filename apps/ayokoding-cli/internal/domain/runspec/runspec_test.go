package runspec_test

import (
	"strings"
	"testing"
	"time"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/runspec"
)

// specCase is one field-rule case: YAML bytes in, finding codes out. A row
// for a new behaviour is a new RED/GREEN cycle.
type specCase struct {
	name      string
	yaml      string
	wantCodes []string
	wantLine  int
}

// validRuns is the canonical valid run block every row builds on.
const validRuns = `runs:
  - name: main
    command: [python3, example.py]
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
`

// testCatalog is the pinned catalog every spec is checked against: one
// language and one service.
func testCatalog() catalog.Catalog {
	python := catalog.Toolchain{
		ID:      "python",
		Kind:    catalog.KindLanguage,
		Version: "3.15.0",
		Image:   "docker.io/library/python:3.15.0@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		Env: map[string]string{
			"PYTHONDONTWRITEBYTECODE": "1",
		},
		Install: catalog.Install{
			Lockfiles: []string{"requirements.lock"},
			Command:   []string{"pip", "install", "-r", "/deps/lock/requirements.lock"},
			Env: map[string]string{
				"PYTHONPATH": "/deps/python",
			},
		},
		Build:        "",
		Platform:     "",
		Ready:        nil,
		ReadyTimeout: "",
		Connect:      nil,
	}
	postgres := catalog.Toolchain{
		ID:      "postgres",
		Kind:    catalog.KindService,
		Version: "18.6",
		Image:   "docker.io/library/postgres:18.6@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
		Env: map[string]string{
			"POSTGRES_HOST_AUTH_METHOD": "trust",
		},
		Install:      catalog.Install{},
		Build:        "",
		Platform:     "",
		Ready:        []string{"pg_isready", "-h", "127.0.0.1", "-U", "postgres"},
		ReadyTimeout: "60s",
		Connect: map[string]string{
			"PGHOST":     "postgres",
			"PGUSER":     "postgres",
			"PGDATABASE": "postgres",
		},
	}
	return catalog.Catalog{Toolchains: []catalog.Toolchain{python, postgres}}
}

// specCases holds one row per field rule in the run.yaml contract.
func specCases() []specCase {
	cases := append(specStructureCases(), specStaticCases()...)
	cases = append(cases, specToolchainCases()...)
	cases = append(cases, specOutputCases()...)
	cases = append(cases, specTimeoutResourceCases()...)
	cases = append(cases, specRunsCases()...)
	cases = append(cases, specExpectCases()...)
	cases = append(cases, specPathCases()...)
	return cases
}

func specStructureCases() []specCase {
	return []specCase{
		{
			name: "unknown key is rejected with its line",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"expected_output: out.txt\n" +
				validRuns,
			wantCodes: []string{finding.RunspecUnknownKey},
			wantLine:  3,
		},
		{
			name: "duplicate key is rejected at its second line",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"toolchain: python\n" +
				validRuns,
			wantCodes: []string{finding.RunspecDuplicateKey},
			wantLine:  3,
		},
		{
			name: "missing schema is rejected",
			yaml: "toolchain: python\n" +
				validRuns,
			wantCodes: []string{finding.RunspecMissingSchema},
			wantLine:  1,
		},
		{
			name: "wrong schema value is rejected",
			yaml: "schema: ayokoding.run/v9\n" +
				"toolchain: python\n" +
				validRuns,
			wantCodes: []string{finding.RunspecInvalidSchema},
			wantLine:  1,
		},
		{
			name: "wrong type is rejected with its line",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"runs: nope\n",
			wantCodes: []string{finding.RunspecInvalidType},
			wantLine:  3,
		},
		{
			name: "string command is rejected as a wrong type",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"runs:\n" +
				"  - name: main\n" +
				"    command: python3 example.py\n" +
				"    expect:\n" +
				"      exit: 0\n" +
				"      stdout: expected/main.stdout.txt\n",
			wantCodes: []string{finding.RunspecInvalidType},
			wantLine:  5,
		},
	}
}

func specStaticCases() []specCase {
	return []specCase{
		{
			name: "unknown mode is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"mode: dream\n" +
				validRuns,
			wantCodes: []string{finding.RunspecUnknownMode},
			wantLine:  3,
		},
		{
			name: "static without a reason is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"mode: static\n" +
				"static:\n" +
				"  note: Parses only.\n" +
				validRuns,
			wantCodes: []string{finding.RunspecUnknownStatic},
			wantLine:  4,
		},
		{
			name: "static with an unknown reason is rejected at the reason",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"mode: static\n" +
				"static:\n" +
				"  reason: desktop\n" +
				"  note: Needs a desktop shell.\n" +
				validRuns,
			wantCodes: []string{finding.RunspecUnknownStatic},
			wantLine:  5,
		},
		{
			name: "static without a note is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"mode: static\n" +
				"static:\n" +
				"  reason: ios\n" +
				validRuns,
			wantCodes: []string{finding.RunspecMissingStaticNote},
			wantLine:  4,
		},
		{
			name: "static with services is rejected at the services key",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"mode: static\n" +
				"static:\n" +
				"  reason: ios\n" +
				"  note: Parses without the Apple SDK.\n" +
				"services: [postgres]\n" +
				validRuns,
			wantCodes: []string{finding.RunspecStaticWithServices},
			wantLine:  7,
		},
	}
}

func specToolchainCases() []specCase {
	return []specCase{
		{
			name: "missing toolchain is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				validRuns,
			wantCodes: []string{finding.RunspecMissingToolchain},
			wantLine:  1,
		},
		{
			name: "unknown toolchain is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: cobol\n" +
				validRuns,
			wantCodes: []string{finding.RunspecUnknownToolchain},
			wantLine:  2,
		},
		{
			name: "service toolchain is rejected for a unit",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: postgres\n" +
				validRuns,
			wantCodes: []string{finding.RunspecUnknownToolchain},
			wantLine:  2,
		},
		{
			name: "unknown service is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"services: [mysql]\n" +
				validRuns,
			wantCodes: []string{finding.RunspecUnknownService},
			wantLine:  3,
		},
		{
			name: "language toolchain as a service is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"services: [python]\n" +
				validRuns,
			wantCodes: []string{finding.RunspecUnknownService},
			wantLine:  3,
		},
	}
}

func specOutputCases() []specCase {
	return []specCase{
		{
			name: "path escape in expected output is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"runs:\n" +
				"  - name: main\n" +
				"    command: [python3, example.py]\n" +
				"    expect:\n" +
				"      exit: 0\n" +
				"      stdout: ../shared/out.txt\n",
			wantCodes: []string{finding.RunspecPathEscape},
			wantLine:  8,
		},
		{
			name: "absolute expected path is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"runs:\n" +
				"  - name: main\n" +
				"    command: [python3, example.py]\n" +
				"    expect:\n" +
				"      exit: 0\n" +
				"      stdout: /tmp/out.txt\n",
			wantCodes: []string{finding.RunspecPathEscape},
			wantLine:  8,
		},
		{
			name: "non-txt expected file is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"runs:\n" +
				"  - name: main\n" +
				"    command: [python3, example.py]\n" +
				"    expect:\n" +
				"      exit: 0\n" +
				"      stdout: expected/out.dat\n",
			wantCodes: []string{finding.RunspecInvalidExpectFile},
			wantLine:  8,
		},
		{
			name: "stderr word outside the vocabulary is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"runs:\n" +
				"  - name: main\n" +
				"    command: [python3, example.py]\n" +
				"    expect:\n" +
				"      exit: 0\n" +
				"      stdout: expected/main.stdout.txt\n" +
				"      stderr: maybe\n",
			wantCodes: []string{finding.RunspecInvalidStderr},
			wantLine:  9,
		},
	}
}

func specTimeoutResourceCases() []specCase {
	return []specCase{
		{
			name: "timeout above the maximum is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"runs:\n" +
				"  - name: main\n" +
				"    command: [python3, example.py]\n" +
				"    timeout: 601s\n" +
				"    expect:\n" +
				"      exit: 0\n" +
				"      stdout: expected/main.stdout.txt\n",
			wantCodes: []string{finding.RunspecTimeoutOutOfRange},
			wantLine:  6,
		},
		{
			name: "unparsable timeout is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"runs:\n" +
				"  - name: main\n" +
				"    command: [python3, example.py]\n" +
				"    timeout: soon\n" +
				"    expect:\n" +
				"      exit: 0\n" +
				"      stdout: expected/main.stdout.txt\n",
			wantCodes: []string{finding.RunspecTimeoutOutOfRange},
			wantLine:  6,
		},
		{
			name: "memory above the maximum is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"resources:\n" +
				"  memory: 5g\n" +
				validRuns,
			wantCodes: []string{finding.RunspecMemoryOutOfRange},
			wantLine:  4,
		},
		{
			name: "unparsable memory is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"resources:\n" +
				"  memory: soon\n" +
				validRuns,
			wantCodes: []string{finding.RunspecMemoryOutOfRange},
			wantLine:  4,
		},
		{
			name: "cpu count outside one or two is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"resources:\n" +
				"  cpus: 4\n" +
				validRuns,
			wantCodes: []string{finding.RunspecCpusOutOfRange},
			wantLine:  4,
		},
	}
}

func specRunsCases() []specCase {
	return []specCase{
		{
			name: "missing runs are rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n",
			wantCodes: []string{finding.RunspecMissingRuns},
			wantLine:  1,
		},
		{
			name: "empty runs are rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"runs: []\n",
			wantCodes: []string{finding.RunspecMissingRuns},
			wantLine:  3,
		},
		{
			name: "duplicate run names are rejected at the second name",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"runs:\n" +
				"  - name: main\n" +
				"    command: [python3, example.py]\n" +
				"    expect:\n" +
				"      exit: 0\n" +
				"      stdout: expected/main.stdout.txt\n" +
				"  - name: main\n" +
				"    command: [python3, other.py]\n" +
				"    expect:\n" +
				"      exit: 0\n" +
				"      stdout: expected/other.stdout.txt\n",
			wantCodes: []string{finding.RunspecDuplicateRun},
			wantLine:  9,
		},
		{
			name: "run name outside the pattern is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"runs:\n" +
				"  - name: Bad Name\n" +
				"    command: [python3, example.py]\n" +
				"    expect:\n" +
				"      exit: 0\n" +
				"      stdout: expected/main.stdout.txt\n",
			wantCodes: []string{finding.RunspecInvalidRunName},
			wantLine:  4,
		},
		{
			name: "unknown run kind is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"runs:\n" +
				"  - name: main\n" +
				"    kind: boss\n" +
				"    command: [python3, example.py]\n" +
				"    expect:\n" +
				"      exit: 0\n" +
				"      stdout: expected/main.stdout.txt\n",
			wantCodes: []string{finding.RunspecUnknownRunKind},
			wantLine:  5,
		},
		{
			name: "missing command is rejected at the run name",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"runs:\n" +
				"  - name: main\n" +
				"    expect:\n" +
				"      exit: 0\n" +
				"      stdout: expected/main.stdout.txt\n",
			wantCodes: []string{finding.RunspecMissingCommand},
			wantLine:  4,
		},
		{
			name: "missing expect block reports exit and stdout",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"runs:\n" +
				"  - name: main\n" +
				"    command: [python3, example.py]\n",
			wantCodes: []string{finding.RunspecMissingExit, finding.RunspecMissingStdout},
			wantLine:  4,
		},
	}
}

func specExpectCases() []specCase {
	return []specCase{
		{
			name: "missing exit is rejected at the expect key",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"runs:\n" +
				"  - name: main\n" +
				"    command: [python3, example.py]\n" +
				"    expect:\n" +
				"      stdout: expected/main.stdout.txt\n",
			wantCodes: []string{finding.RunspecMissingExit},
			wantLine:  6,
		},
		{
			name: "exit above 255 is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"runs:\n" +
				"  - name: main\n" +
				"    command: [python3, example.py]\n" +
				"    expect:\n" +
				"      exit: 300\n" +
				"      stdout: expected/main.stdout.txt\n",
			wantCodes: []string{finding.RunspecExitOutOfRange},
			wantLine:  7,
		},
		{
			name: "missing stdout is rejected at the expect key",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"runs:\n" +
				"  - name: main\n" +
				"    command: [python3, example.py]\n" +
				"    expect:\n" +
				"      exit: 0\n",
			wantCodes: []string{finding.RunspecMissingStdout},
			wantLine:  6,
		},
		{
			name: "reserved env key is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"runs:\n" +
				"  - name: main\n" +
				"    command: [python3, example.py]\n" +
				"    env:\n" +
				"      PATH: /x\n" +
				"    expect:\n" +
				"      exit: 0\n" +
				"      stdout: expected/main.stdout.txt\n",
			wantCodes: []string{finding.RunspecReservedEnv},
			wantLine:  7,
		},
		{
			name: "reserved AYOKODING env prefix is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"runs:\n" +
				"  - name: main\n" +
				"    command: [python3, example.py]\n" +
				"    env:\n" +
				"      AYOKODING_FOO: bar\n" +
				"    expect:\n" +
				"      exit: 0\n" +
				"      stdout: expected/main.stdout.txt\n",
			wantCodes: []string{finding.RunspecReservedEnv},
			wantLine:  7,
		},
		{
			name: "lowercase env key is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"runs:\n" +
				"  - name: main\n" +
				"    command: [python3, example.py]\n" +
				"    env:\n" +
				"      path: /x\n" +
				"    expect:\n" +
				"      exit: 0\n" +
				"      stdout: expected/main.stdout.txt\n",
			wantCodes: []string{finding.RunspecInvalidEnvName},
			wantLine:  7,
		},
		{
			name: "ignored example output without an invariant is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"runs:\n" +
				"  - name: main\n" +
				"    command: [python3, example.py]\n" +
				"    expect:\n" +
				"      exit: 0\n" +
				"      stdout: ignore\n",
			wantCodes: []string{finding.RunspecMissingInvariant},
			wantLine:  8,
		},
	}
}

func specPathCases() []specCase {
	return []specCase{
		{
			name: "absolute lockfile is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"dependencies:\n" +
				"  lockfile: /course.lock\n" +
				validRuns,
			wantCodes: []string{finding.RunspecPathEscape},
			wantLine:  4,
		},
		{
			name: "workdir escape is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"runs:\n" +
				"  - name: main\n" +
				"    command: [python3, example.py]\n" +
				"    workdir: ../shared\n" +
				"    expect:\n" +
				"      exit: 0\n" +
				"      stdout: expected/main.stdout.txt\n",
			wantCodes: []string{finding.RunspecPathEscape},
			wantLine:  6,
		},
		{
			name: "absolute stdin is rejected",
			yaml: "schema: ayokoding.run/v1\n" +
				"toolchain: python\n" +
				"runs:\n" +
				"  - name: main\n" +
				"    command: [python3, example.py]\n" +
				"    stdin: /dev/null\n" +
				"    expect:\n" +
				"      exit: 0\n" +
				"      stdout: expected/main.stdout.txt\n",
			wantCodes: []string{finding.RunspecPathEscape},
			wantLine:  6,
		},
	}
}

// tooManyRunsYAML builds a spec with twenty-one runs: one over the limit.
func tooManyRunsYAML() string {
	var text strings.Builder
	text.WriteString("schema: ayokoding.run/v1\ntoolchain: python\nruns:\n")
	for i := 1; i <= 21; i++ {
		text.WriteString("  - name: run-")
		text.WriteByte(byte('0' + i/10))
		text.WriteByte(byte('0' + i%10))
		text.WriteString("\n    command: [python3, example.py]\n    expect:\n      exit: 0\n      stdout: expected/main.stdout.txt\n")
	}
	return text.String()
}

// TestParseChecksEveryFieldRule runs one YAML slice per contract rule and
// requires the closed code and the offending line.
func TestParseChecksEveryFieldRule(t *testing.T) {
	catalog := testCatalog()
	for _, row := range specCases() {
		t.Run(row.name, func(t *testing.T) {
			_, findings := runspec.Parse("demo", "learning/code/ex-01-hello", []byte(row.yaml), catalog)
			if len(findings) != len(row.wantCodes) {
				codes := make([]string, 0, len(findings))
				for _, found := range findings {
					codes = append(codes, found.Code)
				}
				t.Fatalf("codes=%q, want %q", codes, row.wantCodes)
			}
			for i, want := range row.wantCodes {
				if findings[i].Code != want {
					t.Fatalf("finding %d code=%q, want %q", i, findings[i].Code, want)
				}
			}
			first := findings[0]
			if first.Course != "demo" {
				t.Fatalf("course=%q, want demo", first.Course)
			}
			if first.Path != "learning/code/ex-01-hello/run.yaml" {
				t.Fatalf("path=%q, want the unit run.yaml", first.Path)
			}
			if first.Line != row.wantLine {
				t.Fatalf("line=%d, want %d (code=%q)", first.Line, row.wantLine, first.Code)
			}
			if first.Message == "" {
				t.Fatalf("finding %q carries no message", first.Code)
			}
		})
	}
}

// TestParseRejectsTwentyOneRuns counts the boundary above twenty runs.
func TestParseRejectsTwentyOneRuns(t *testing.T) {
	_, findings := runspec.Parse("demo", "learning/code/ex-01-hello", []byte(tooManyRunsYAML()), testCatalog())
	if len(findings) != 1 || findings[0].Code != finding.RunspecTooManyRuns {
		t.Fatalf("findings=%+v, want one too-many-runs", findings)
	}
	if findings[0].Line != 3 {
		t.Fatalf("line=%d, want 3", findings[0].Line)
	}
}

// TestParseAcceptsCompleteSpec requires a full spec to validate with every
// default resolved.
func TestParseAcceptsCompleteSpec(t *testing.T) {
	spec, findings := runspec.Parse("demo", "learning/code/ex-01-hello",
		[]byte("schema: ayokoding.run/v1\ntoolchain: python\n"+validRuns), testCatalog())
	if len(findings) != 0 {
		t.Fatalf("findings=%+v, want none", findings)
	}
	if spec.Toolchain != "python" || len(spec.Runs) != 1 {
		t.Fatalf("spec=%+v, want one python run", spec)
	}
	run := spec.Runs[0]
	if run.Name != "main" || run.Kind != "example" {
		t.Fatalf("run=%+v, want main example", run)
	}
	if run.Timeout != 60*time.Second {
		t.Fatalf("timeout=%v, want 60s", run.Timeout)
	}
	if run.Workdir != "." {
		t.Fatalf("workdir=%q, want .", run.Workdir)
	}
	if spec.MemoryBytes != 1073741824 || spec.CPUs != 2 {
		t.Fatalf("resources=%d/%d, want 1g/2", spec.MemoryBytes, spec.CPUs)
	}
	if run.Expect.Stderr != "empty" {
		t.Fatalf("stderr=%q, want empty", run.Expect.Stderr)
	}
}

// TestParseDefaultsTestInvariant requires a test run ignoring stdout to
// validate with the default invariant.
func TestParseDefaultsTestInvariant(t *testing.T) {
	spec, findings := runspec.Parse("demo", "learning/code/ex-01-hello", []byte(
		"schema: ayokoding.run/v1\n"+
			"toolchain: python\n"+
			"runs:\n"+
			"  - name: tests\n"+
			"    kind: test\n"+
			"    command: [python3, -m, pytest]\n"+
			"    expect:\n"+
			"      exit: 0\n"+
			"      stdout: ignore\n"), testCatalog())
	if len(findings) != 0 {
		t.Fatalf("findings=%+v, want none", findings)
	}
	if spec.Runs[0].Expect.Invariant == "" {
		t.Fatalf("test run carries no default invariant")
	}
}

// TestParseAcceptsStaticSpec requires a static spec with a known reason and
// a note to validate.
func TestParseAcceptsStaticSpec(t *testing.T) {
	_, findings := runspec.Parse("demo", "learning/code/ex-09-static", []byte(
		"schema: ayokoding.run/v1\n"+
			"toolchain: python\n"+
			"mode: static\n"+
			"static:\n"+
			"  reason: ios\n"+
			"  note: Parses without the Apple SDK.\n"+
			validRuns), testCatalog())
	if len(findings) != 0 {
		t.Fatalf("findings=%+v, want none", findings)
	}
}
