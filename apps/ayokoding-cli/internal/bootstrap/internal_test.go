package bootstrap

import (
	"bytes"
	"strings"
	"testing"
)

// TestRunReportsStatusesWithoutExiting requires the wired tree to answer
// help, version, and usage errors in process with the published statuses.
func TestRunReportsStatusesWithoutExiting(t *testing.T) {
	rows := []struct {
		name    string
		args    []string
		status  int
		contain string
	}{
		{name: "help names the command", args: []string{"--help"}, status: 0, contain: "ayokoding-cli"},
		{name: "version names the binary", args: []string{"--version"}, status: 0, contain: "ayokoding-cli"},
		{name: "bare invocation is usage", args: nil, status: 2},
		{name: "unknown command is usage", args: []string{"no-such-command"}, status: 2},
	}
	for _, row := range rows {
		t.Run(row.name, func(t *testing.T) {
			var stdout, stderr bytes.Buffer
			status := run(row.args, &stdout, &stderr)
			if status != row.status {
				t.Fatalf("status=%d, want %d (stdout=%q stderr=%q)", status, row.status, stdout.String(), stderr.String())
			}
			if row.contain != "" && !strings.Contains(stdout.String(), row.contain) {
				t.Fatalf("stdout=%q, want %q", stdout.String(), row.contain)
			}
		})
	}
}
