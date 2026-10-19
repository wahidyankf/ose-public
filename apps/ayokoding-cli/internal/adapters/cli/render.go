package cli

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// Output modes selected by the persistent --output flag.
const (
	outputText = "text"
	outputJSON = "json"
)

// errorDocument is the machine-readable error body written to standard error
// under --output json. It carries no durations, timestamps, or absolute
// paths, so the same inputs give the same bytes.
type errorDocument struct {
	SchemaVersion int         `json:"schemaVersion"`
	Error         errorDetail `json:"error"`
}

// errorDetail names one coded failure.
type errorDetail struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// outputMode scans raw arguments for the persistent --output flag, so error
// rendering knows the mode even when flag parsing itself failed.
func outputMode(args []string) string {
	for index, arg := range args {
		if arg == "--output" && index+1 < len(args) {
			if args[index+1] == outputJSON {
				return outputJSON
			}
			return outputText
		}
		if value, ok := strings.CutPrefix(arg, "--output="); ok {
			if value == outputJSON {
				return outputJSON
			}
			return outputText
		}
	}
	return outputText
}

// codedError converts any command failure into the closed vocabulary. Flag
// parsing failures keep the parser message under a usage code.
func codedError(err error) *finding.Error {
	if coded, ok := errors.AsType[*finding.Error](err); ok {
		return coded
	}
	return &finding.Error{Code: finding.UsageInvalidArguments, Message: err.Error()}
}

// findingPayload is one machine-readable finding in field order: code,
// course, path, line, message.
type findingPayload struct {
	Code    string `json:"code"`
	Course  string `json:"course"`
	Path    string `json:"path"`
	Line    int    `json:"line"`
	Message string `json:"message"`
}

// findingsDocument is the machine-readable validate payload. It carries no
// durations, timestamps, or absolute paths, so the same inputs give the same
// bytes.
type findingsDocument struct {
	SchemaVersion int              `json:"schemaVersion"`
	Findings      []findingPayload `json:"findings"`
}

// toolchainPayload is one machine-readable catalog entry.
type toolchainPayload struct {
	ID      string `json:"id"`
	Kind    string `json:"kind"`
	Version string `json:"version"`
	Image   string `json:"image"`
}

// toolchainsDocument is the machine-readable list payload.
type toolchainsDocument struct {
	SchemaVersion int                `json:"schemaVersion"`
	Toolchains    []toolchainPayload `json:"toolchains"`
}

// renderFindings writes every finding to standard output: one line per
// finding as text, or one JSON document under --output json.
func renderFindings(out io.Writer, mode string, findings []finding.Finding) error {
	if mode == outputJSON {
		document := findingsDocument{SchemaVersion: 1, Findings: []findingPayload{}}
		for _, found := range findings {
			document.Findings = append(document.Findings, findingPayload{
				Code:    found.Code,
				Course:  found.Course,
				Path:    found.Path,
				Line:    found.Line,
				Message: found.Message,
			})
		}
		body, err := json.Marshal(document)
		if err != nil {
			return fmt.Errorf("cli: marshal findings: %w", err)
		}
		if _, err := fmt.Fprintln(out, string(body)); err != nil {
			return &finding.PipeError{}
		}
		return nil
	}
	for _, found := range findings {
		if _, err := fmt.Fprintf(out, "%s %s:%d: %s: %s\n",
			found.Course, found.Path, found.Line, found.Code, found.Message); err != nil {
			return &finding.PipeError{}
		}
	}
	return nil
}

// renderToolchains writes every catalog entry to standard output: one line
// per id as text, or one JSON document under --output json.
func renderToolchains(out io.Writer, mode string, entries []catalog.Toolchain) error {
	if mode == outputJSON {
		document := toolchainsDocument{SchemaVersion: 1, Toolchains: []toolchainPayload{}}
		for _, entry := range entries {
			document.Toolchains = append(document.Toolchains, toolchainPayload{
				ID:      entry.ID,
				Kind:    string(entry.Kind),
				Version: entry.Version,
				Image:   entry.Image,
			})
		}
		body, err := json.Marshal(document)
		if err != nil {
			return fmt.Errorf("cli: marshal toolchains: %w", err)
		}
		if _, err := fmt.Fprintln(out, string(body)); err != nil {
			return &finding.PipeError{}
		}
		return nil
	}
	for _, entry := range entries {
		if _, err := fmt.Fprintf(out, "%s %s %s %s\n",
			entry.ID, entry.Kind, entry.Version, entry.Image); err != nil {
			return &finding.PipeError{}
		}
	}
	return nil
}

// renderError writes one failure to standard error: a text diagnostic with
// the usage for usage errors, or a single JSON document under --output json.
// Standard output stays empty on every failure path.
func renderError(stderr io.Writer, cmd *cobra.Command, err error, mode string) {
	coded := codedError(err)
	if mode == outputJSON {
		body, marshalErr := json.Marshal(errorDocument{
			SchemaVersion: 1,
			Error:         errorDetail{Code: coded.Code, Message: coded.Message},
		})
		if marshalErr != nil {
			_, _ = fmt.Fprintln(stderr, `{"schemaVersion":1,"error":{"code":"`+finding.InternalPanic+`"}}`)
			return
		}
		_, _ = fmt.Fprintln(stderr, string(body))
		return
	}
	_, _ = fmt.Fprintln(stderr, "Error: "+coded.Code+": "+coded.Message)
	if coded.Code != finding.InternalPanic && cmd != nil {
		_, _ = fmt.Fprintln(stderr, cmd.UsageString())
	}
}
