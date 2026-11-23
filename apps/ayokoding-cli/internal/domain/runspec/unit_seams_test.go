package runspec_test

import (
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/runspec"
)

// TestParseRejectsUnparsableSpec requires invalid YAML and non-mappings
// to fail with the invalid type code.
func TestParseRejectsUnparsableSpec(t *testing.T) {
	for _, doc := range []string{"runs: [unclosed\n", "just a string\n"} {
		_, findings := runspec.Parse("demo", "learning/code/ex-01-hello", []byte(doc), testCatalog())
		if len(findings) != 1 || findings[0].Code != finding.RunspecInvalidType {
			t.Fatalf("doc=%q findings=%v, want one invalid type", doc, findings)
		}
	}
}

// TestParseRejectsDuplicateKeys requires a doubled mapping key to fail
// with the duplicate code.
func TestParseRejectsDuplicateKeys(t *testing.T) {
	yaml := "schema: ayokoding.run/v1\ntoolchain: python\ntoolchain: node\n" + validRuns
	_, findings := runspec.Parse("demo", "learning/code/ex-01-hello", []byte(yaml), testCatalog())
	found := false
	for _, fd := range findings {
		if fd.Code == finding.RunspecDuplicateKey {
			found = true
		}
	}
	if !found {
		t.Fatalf("findings=%v, want the duplicate key", findings)
	}
}

// TestParseClassifiesDecodeErrors requires decoder-only failures to
// map onto the closed vocabulary.
func TestParseClassifiesDecodeErrors(t *testing.T) {
	duplicated := "schema: ayokoding.run/v1\ntoolchain: python\nruns:\n" +
		"  - name: main\n    command: [python3, example.py]\n" +
		"    env: {A: \"1\", A: \"2\"}\n" +
		"    expect:\n      exit: 0\n      stdout: expected/main.stdout.txt\n"
	_, findings := runspec.Parse("demo", "learning/code/ex-01-hello", []byte(duplicated), testCatalog())
	found := false
	for _, fd := range findings {
		if fd.Code == finding.RunspecDuplicateKey {
			found = true
		}
	}
	if !found {
		t.Fatalf("findings=%v, want the decoder duplicate key", findings)
	}
}

// TestParseChecksRunRules requires duplicate names, workdirs, env
// defaults, and stderr shapes to resolve.
func TestParseChecksRunRules(t *testing.T) {
	base := "schema: ayokoding.run/v1\ntoolchain: python\n"
	t.Run("duplicate run names fail", func(t *testing.T) {
		yaml := base + "runs:\n" +
			"  - name: main\n    command: [python3, example.py]\n    expect:\n      exit: 0\n      stdout: expected/main.stdout.txt\n" +
			"  - name: main\n    command: [python3, example.py]\n    expect:\n      exit: 0\n      stdout: expected/main.stdout.txt\n"
		_, findings := runspec.Parse("demo", "learning/code/ex-01-hello", []byte(yaml), testCatalog())
		if len(findings) != 1 || findings[0].Code != finding.RunspecDuplicateRun {
			t.Fatalf("findings=%v, want one duplicate run", findings)
		}
	})
	t.Run("paired duplicates name the second", func(t *testing.T) {
		yaml := base + "runs:\n" +
			"  - name: main\n    command: [python3, example.py]\n    expect:\n      exit: 0\n      stdout: expected/main.stdout.txt\n" +
			"  - name: other\n    command: [python3, example.py]\n    expect:\n      exit: 0\n      stdout: expected/main.stdout.txt\n" +
			"  - name: main\n    command: [python3, example.py]\n    expect:\n      exit: 0\n      stdout: expected/main.stdout.txt\n"
		_, findings := runspec.Parse("demo", "learning/code/ex-01-hello", []byte(yaml), testCatalog())
		if len(findings) != 1 || findings[0].Code != finding.RunspecDuplicateRun {
			t.Fatalf("findings=%v, want one duplicate run", findings)
		}
	})
	t.Run("valid workdir and env pass", func(t *testing.T) {
		yaml := base + "runs:\n" +
			"  - name: main\n    command: [python3, example.py]\n    workdir: subdir\n" +
			"    env: {FROB: \"1\"}\n    expect:\n      exit: 0\n      stdout: expected/main.stdout.txt\n"
		spec, findings := runspec.Parse("demo", "learning/code/ex-01-hello", []byte(yaml), testCatalog())
		if len(findings) != 0 {
			t.Fatalf("findings=%v, want none", findings)
		}
		if spec.Runs[0].Workdir != "subdir" || spec.Runs[0].Env["FROB"] != "1" {
			t.Fatalf("run=%+v, want the workdir and env", spec.Runs[0])
		}
	})
	t.Run("stderr shapes fail closed", func(t *testing.T) {
		for _, stderr := range []string{"../evil.txt", "word", "dir/file.log"} {
			yaml := base + "runs:\n" +
				"  - name: main\n    command: [python3, example.py]\n    expect:\n      exit: 0\n      stdout: expected/main.stdout.txt\n      stderr: " + stderr + "\n"
			_, findings := runspec.Parse("demo", "learning/code/ex-01-hello", []byte(yaml), testCatalog())
			if len(findings) != 1 {
				t.Fatalf("stderr=%q findings=%v, want one finding", stderr, findings)
			}
		}
	})
}

// TestParseChecksResources requires memory and cpu bounds to resolve.
func TestParseChecksResources(t *testing.T) {
	base := "schema: ayokoding.run/v1\ntoolchain: python\nresources:\n"
	runs := "runs:\n  - name: main\n    command: [python3, example.py]\n    expect:\n      exit: 0\n      stdout: expected/main.stdout.txt\n"
	t.Run("valid memory and cpus pass", func(t *testing.T) {
		yaml := base + "  memory: 256m\n  cpus: 2\n" + runs
		spec, findings := runspec.Parse("demo", "learning/code/ex-01-hello", []byte(yaml), testCatalog())
		if len(findings) != 0 {
			t.Fatalf("findings=%v, want none", findings)
		}
		if spec.MemoryBytes != 256*1048576 || spec.CPUs != 2 {
			t.Fatalf("spec=%+v, want 256m and 2 cpus", spec)
		}
	})
	t.Run("megabyte suffix resolves", func(t *testing.T) {
		yaml := base + "  memory: 1024M\n" + runs
		spec, findings := runspec.Parse("demo", "learning/code/ex-01-hello", []byte(yaml), testCatalog())
		if len(findings) != 0 {
			t.Fatalf("findings=%v, want none", findings)
		}
		if spec.MemoryBytes != 1024*1048576 {
			t.Fatalf("memory=%d, want 1024M", spec.MemoryBytes)
		}
	})
	t.Run("overflowing memory fails", func(t *testing.T) {
		yaml := base + "  memory: 99999999999999999999m\n" + runs
		_, findings := runspec.Parse("demo", "learning/code/ex-01-hello", []byte(yaml), testCatalog())
		if len(findings) == 0 {
			t.Fatal("findings empty, want the memory failure")
		}
	})
	t.Run("unparsable memory fails", func(t *testing.T) {
		yaml := base + "  memory: huge\n" + runs
		_, findings := runspec.Parse("demo", "learning/code/ex-01-hello", []byte(yaml), testCatalog())
		if len(findings) == 0 {
			t.Fatal("findings empty, want the memory failure")
		}
		if !strings.Contains(findings[0].Message, "huge") {
			t.Fatalf("findings=%v, want the memory named", findings)
		}
	})
}
