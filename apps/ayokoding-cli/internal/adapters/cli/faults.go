package cli

import (
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// faultLines is the spam volume: large enough to overflow any pipe buffer, so
// a reader that closes early always wins, and small enough to finish at once
// on an open pipe.
const faultLines = 20000

// statusError carries a non-error result status out of a leaf: the payload is
// already on standard output, so the error only selects the status.
type statusError struct {
	status int
}

// Error reports the carried status.
func (e *statusError) Error() string {
	return "exit status " + strconv.Itoa(e.status)
}

// failedRun is one canned failing run behind the failing-run fault.
type failedRun struct {
	name    string
	message string
}

// resultEntry is one JSON result item.
type resultEntry struct {
	Name    string `json:"name"`
	Status  string `json:"status"`
	Message string `json:"message"`
}

// resultsDocument is the machine-readable results payload.
type resultsDocument struct {
	SchemaVersion int           `json:"schemaVersion"`
	Results       []resultEntry `json:"results"`
}

// paint wraps text in red when colour is on. Status travels in words, never
// by colour alone.
func paint(text string, color bool) string {
	if !color {
		return text
	}
	return "\x1b[31m" + text + "\x1b[0m"
}

// cannedFailures is the fixed failing-run set the test seam renders.
func cannedFailures() []failedRun {
	return []failedRun{
		{name: "demo/unit-one", message: "invariant violated"},
		{name: "demo/unit-two", message: "timed out"},
	}
}

// renderFailures writes the canned failing runs as text lines or one JSON
// document. The payload carries no time, duration, or absolute path.
func renderFailures(cmd *cobra.Command, color bool, mode string) error {
	out := cmd.OutOrStdout()
	if mode == outputJSON {
		document := resultsDocument{SchemaVersion: 1}
		for _, run := range cannedFailures() {
			document.Results = append(document.Results, resultEntry{
				Name:    run.name,
				Status:  "failed",
				Message: run.message,
			})
		}
		body, err := json.Marshal(document)
		if err != nil {
			return fmt.Errorf("cli: marshal failing runs: %w", err)
		}
		if _, err := fmt.Fprintln(out, string(body)); err != nil {
			return &finding.PipeError{}
		}
		return nil
	}
	for _, run := range cannedFailures() {
		if _, err := fmt.Fprintln(out, paint("failed", color)+" "+run.name+": "+run.message); err != nil {
			return &finding.PipeError{}
		}
	}
	return nil
}

// hang blocks until the command context ends, printing one line first so a
// supervisor knows the process is inside the wait.
func hang(cmd *cobra.Command) error {
	_, _ = fmt.Fprintln(cmd.ErrOrStderr(), "waiting for interrupt")
	<-cmd.Context().Done()
	if err := cmd.Context().Err(); err != nil {
		return fmt.Errorf("cli: interrupted: %w", err)
	}
	return nil
}

// spam writes a large payload so a reader that closes early always lands a
// write error, which maps to 141.
func spam(cmd *cobra.Command) error {
	out := cmd.OutOrStdout()
	for range faultLines {
		if _, err := fmt.Fprintln(out, "filler line"); err != nil {
			return &finding.PipeError{}
		}
	}
	return nil
}

// flagValue reads one parsed flag, wrapping the programmer error.
func flagValue(cmd *cobra.Command, name string) (string, error) {
	value, err := cmd.Flags().GetString(name)
	if err != nil {
		return "", fmt.Errorf("cli: read --%s: %w", name, err)
	}
	return value, nil
}

// dispatchFault runs the AYOKODING_FAULT test seam and returns nil when no
// fault fires, so leaves proceed to their contract errors.
func dispatchFault(cmd *cobra.Command, opts Options) error {
	switch opts.Fault {
	case "":
		return nil
	case "panic":
		panic("ayokoding fault panicked")
	case "hang":
		return hang(cmd)
	case "spam":
		return spam(cmd)
	case "failing-run":
		return failingRun(cmd, opts)
	default:
		return nil
	}
}

// failingRun renders the canned failing runs and exits 1: the work completed
// and the result is negative.
func failingRun(cmd *cobra.Command, opts Options) error {
	colorFlag, err := flagValue(cmd, "color")
	if err != nil {
		return err
	}
	modeFlag, err := flagValue(cmd, "output")
	if err != nil {
		return err
	}
	if err := renderFailures(cmd, finding.ResolveColor(colorFlag, opts.NoColor), modeFlag); err != nil {
		return err
	}
	return &statusError{status: 1}
}
