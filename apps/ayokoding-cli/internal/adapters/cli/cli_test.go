package cli_test

import (
	"bytes"
	"context"
	"encoding/json"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/cli"
)

// contractRow is one command-line contract case: arguments in, streams and
// status out.
type contractRow struct {
	name         string
	args         []string
	wantStatus   int
	wantStdout   []string
	wantEmptyOut bool
	wantStderr   []string
}

// TestCommandLineContract runs the root command in process with in-memory
// streams and pins help, version, bare invocation, usage errors, and JSON
// error bodies.
func TestCommandLineContract(t *testing.T) {
	rows := []contractRow{
		{
			name:       "help lists both commands and all nine statuses",
			args:       []string{"--help"},
			wantStatus: 0,
			wantStdout: []string{
				"examples",
				"toolchains",
				"Exit statuses",
				"  0 ",
				"  1 ",
				"  2 ",
				"  124 ",
				"  125 ",
				"  126 ",
				"  127 ",
				"  130 ",
				"  141 ",
			},
		},
		{
			name:       "no arguments exits 2 with usage on stderr",
			args:       []string{},
			wantStatus: 2,
			wantStderr: []string{"Usage:"},
		},
		{
			name:       "version names the build",
			args:       []string{"--version"},
			wantStatus: 0,
			wantStdout: []string{"ayokoding-cli dev (commit unknown, catalog unpinned)\n"},
		},
		{
			name:         "unknown flag exits 2 with stdout empty",
			args:         []string{"--no-such-flag"},
			wantStatus:   2,
			wantEmptyOut: true,
			wantStderr:   []string{"unknown flag"},
		},
		{
			name:         "JSON run without selection carries missing-selection",
			args:         []string{"examples", "run", "--output", "json"},
			wantStatus:   2,
			wantEmptyOut: true,
		},
	}
	for _, row := range rows {
		t.Run(row.name, func(t *testing.T) {
			var stdout, stderr bytes.Buffer
			status := cli.Execute(context.Background(), row.args, cli.Options{
				Stdout:  &stdout,
				Stderr:  &stderr,
				Version: "dev",
				Commit:  "unknown",
				Catalog: "unpinned",
			})
			if status != row.wantStatus {
				t.Fatalf("status=%d, want %d (stdout=%q stderr=%q)",
					status, row.wantStatus, stdout.String(), stderr.String())
			}
			for _, want := range row.wantStdout {
				if !strings.Contains(stdout.String(), want) {
					t.Fatalf("stdout missing %q (stdout=%q)", want, stdout.String())
				}
			}
			if row.wantEmptyOut && stdout.Len() != 0 {
				t.Fatalf("stdout not empty (stdout=%q)", stdout.String())
			}
			for _, want := range row.wantStderr {
				if !strings.Contains(stderr.String(), want) {
					t.Fatalf("stderr missing %q (stderr=%q)", want, stderr.String())
				}
			}
		})
	}
}

// TestJSONMissingSelectionBody requires the JSON error on stderr to be one
// document carrying ayokoding.usage.missing-selection.
func TestJSONMissingSelectionBody(t *testing.T) {
	var stdout, stderr bytes.Buffer
	status := cli.Execute(context.Background(), []string{"examples", "run", "--output", "json"}, cli.Options{
		Stdout: &stdout,
		Stderr: &stderr,
	})
	if status != 2 {
		t.Fatalf("status=%d, want 2", status)
	}
	if stdout.Len() != 0 {
		t.Fatalf("stdout not empty (stdout=%q)", stdout.String())
	}
	var body struct {
		SchemaVersion int `json:"schemaVersion"`
		Error         struct {
			Code    string `json:"code"`
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.Unmarshal(bytes.TrimSpace(stderr.Bytes()), &body); err != nil {
		t.Fatalf("stderr is not one JSON document: %v (stderr=%q)", err, stderr.String())
	}
	if body.SchemaVersion != 1 {
		t.Fatalf("schemaVersion=%d, want 1", body.SchemaVersion)
	}
	if body.Error.Code != "ayokoding.usage.missing-selection" {
		t.Fatalf("code=%q, want ayokoding.usage.missing-selection", body.Error.Code)
	}
	if strings.Count(strings.TrimSpace(stderr.String()), "\n") != 0 {
		t.Fatalf("stderr holds more than one document (stderr=%q)", stderr.String())
	}
}
