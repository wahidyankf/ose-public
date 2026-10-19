// Package finding holds the closed finding and error-code vocabulary every
// adapter renders, plus the exit-status mapping.
package finding

import (
	"context"
	"errors"
	"strconv"
)

// Finding is one closed-vocabulary result item carried in the payload.
type Finding struct {
	Code    string
	Course  string
	Path    string
	Line    int
	Message string
}

// Closed error codes used by the command-line contract.
const (
	UsageMissingSelection = "ayokoding.usage.missing-selection"
	UsageInvalidArguments = "ayokoding.usage.invalid-arguments"
	UsageMissingCommand   = "ayokoding.usage.missing-command"
	InternalPanic         = "ayokoding.internal.panic"
	EnvServiceUnready     = "ayokoding.env.service-not-ready"
	EnvRuntimeRefused     = "ayokoding.env.container-runtime-unavailable"
	EnvNotExecutable      = "ayokoding.env.container-cli-not-executable"
	EnvNotFound           = "ayokoding.env.container-cli-not-found"
	EnvGitNotFound        = "ayokoding.env.git-not-found"
)

// Closed run-spec codes: every structural and field rule in the run.yaml
// contract reports one of these, never free text.
const (
	RunspecUnknownKey         = "ayokoding.runspec.unknown-key"
	RunspecDuplicateKey       = "ayokoding.runspec.duplicate-key"
	RunspecInvalidType        = "ayokoding.runspec.invalid-type"
	RunspecMissingSchema      = "ayokoding.runspec.missing-schema"
	RunspecInvalidSchema      = "ayokoding.runspec.invalid-schema"
	RunspecMissingToolchain   = "ayokoding.runspec.missing-toolchain"
	RunspecUnknownToolchain   = "ayokoding.runspec.unknown-toolchain"
	RunspecUnknownMode        = "ayokoding.runspec.unknown-mode"
	RunspecUnknownStatic      = "ayokoding.runspec.unknown-static-reason"
	RunspecMissingStaticNote  = "ayokoding.runspec.missing-static-note"
	RunspecStaticWithServices = "ayokoding.runspec.static-with-services"
	RunspecUnknownService     = "ayokoding.runspec.unknown-service"
	RunspecMissingRuns        = "ayokoding.runspec.missing-runs"
	RunspecTooManyRuns        = "ayokoding.runspec.too-many-runs"
	RunspecDuplicateRun       = "ayokoding.runspec.duplicate-run"
	RunspecInvalidRunName     = "ayokoding.runspec.invalid-run-name"
	RunspecUnknownRunKind     = "ayokoding.runspec.unknown-run-kind"
	RunspecMissingCommand     = "ayokoding.runspec.missing-command"
	RunspecTimeoutOutOfRange  = "ayokoding.runspec.timeout-out-of-range"
	RunspecMissingExit        = "ayokoding.runspec.missing-exit"
	RunspecExitOutOfRange     = "ayokoding.runspec.exit-out-of-range"
	RunspecMissingStdout      = "ayokoding.runspec.missing-stdout"
	RunspecInvalidStderr      = "ayokoding.runspec.invalid-stderr"
	RunspecInvalidExpectFile  = "ayokoding.runspec.invalid-expected-file"
	RunspecPathEscape         = "ayokoding.runspec.path-escape"
	RunspecMemoryOutOfRange   = "ayokoding.runspec.memory-out-of-range"
	RunspecCpusOutOfRange     = "ayokoding.runspec.cpus-out-of-range"
	RunspecInvalidEnvName     = "ayokoding.runspec.invalid-env-name"
	RunspecReservedEnv        = "ayokoding.runspec.reserved-env"
	RunspecMissingInvariant   = "ayokoding.runspec.missing-invariant"
)

// Closed catalog codes: every catalog rule reports one of these.
const (
	CatalogUnknownKey     = "ayokoding.catalog.unknown-key"
	CatalogDuplicateKey   = "ayokoding.catalog.duplicate-key"
	CatalogInvalidType    = "ayokoding.catalog.invalid-type"
	CatalogMissingSchema  = "ayokoding.catalog.missing-schema"
	CatalogInvalidSchema  = "ayokoding.catalog.invalid-schema"
	CatalogMissingID      = "ayokoding.catalog.missing-id"
	CatalogDuplicateID    = "ayokoding.catalog.duplicate-toolchain"
	CatalogInvalidKind    = "ayokoding.catalog.invalid-kind"
	CatalogUnpinnedImage  = "ayokoding.catalog.unpinned-image"
	CatalogInvalidService = "ayokoding.catalog.invalid-service"
	CatalogInvalidTimeout = "ayokoding.catalog.invalid-ready-timeout"
)

// Closed layout codes: every unit-discovery and placement rule reports one
// of these.
const (
	LayoutFlatExample    = "ayokoding.layout.flat-example"
	LayoutUnplacedCode   = "ayokoding.layout.unplaced-code"
	LayoutMissingRunspec = "ayokoding.layout.missing-run-spec"
	LayoutMisplacedSpec  = "ayokoding.layout.misplaced-run-spec"
)

// Error is a coded failure. A new failure mode gets a new code, never a new
// status.
type Error struct {
	Code    string
	Message string
}

// Status is one published exit status with its meaning.
type Status struct {
	Code    int
	Name    string
	Meaning string
}

// Statuses lists the nine published exit statuses in numeric order. Help text
// and exit mapping read this same source.
func Statuses() []Status {
	return []Status{
		{0, "green", "Everything selected is green: no finding, every run passed, coverage at or above the minimum."},
		{1, "negative", "The work completed and the result is negative: a finding, a failed or timed out run, or coverage below the minimum."},
		{2, "usage", "Bad usage, bad configuration, or an internal failure, including a recovered panic."},
		{124, "service-unready", "A service did not become ready in its bounded wait."},
		{125, "runtime-refused", "The container runtime refused: daemon unavailable or pull failed."},
		{126, "not-executable", "The container CLI was found but cannot run."},
		{127, "not-found", "The container CLI, or git when --since needs it, was not found."},
		{130, "interrupted", "Interrupted; running containers and networks are removed first."},
		{141, "pipe-closed", "Standard output was closed by the reader."},
	}
}

// Error reports the coded failure.
func (e *Error) Error() string {
	return e.Code + ": " + e.Message
}

// ExitCode maps a command failure to its process status: result kinds to 0,
// 1, or 2, environment errors to 124-127, death by signal to 128+N, an
// interrupt to 130, and a closed pipe to 141.
func ExitCode(err error) int {
	if err == nil {
		return 0
	}
	if _, ok := errors.AsType[*PipeError](err); ok {
		return 141
	}
	if signal, ok := errors.AsType[*SignalError](err); ok {
		return 128 + signal.Number
	}
	if errors.Is(err, context.Canceled) {
		return 130
	}
	if coded, ok := errors.AsType[*Error](err); ok {
		switch coded.Code {
		case EnvServiceUnready:
			return 124
		case EnvRuntimeRefused:
			return 125
		case EnvNotExecutable:
			return 126
		case EnvNotFound:
			return 127
		case EnvGitNotFound:
			return 127
		default:
			return 2
		}
	}
	return 2
}

// PipeError reports a closed output pipe: the reader went away mid-payload.
type PipeError struct{}

// Error reports the closed pipe.
func (e *PipeError) Error() string {
	return "standard output was closed by the reader"
}

// SignalError reports death by signal number, for the 128+N mapping.
type SignalError struct {
	Number int
}

// Error reports the fatal signal.
func (e *SignalError) Error() string {
	return "signal " + strconv.Itoa(e.Number)
}

// ResolveColor decides whether output carries colour from the --color flag
// against NO_COLOR presence: always and never win outright, auto yields to
// any NO_COLOR value, and there is no TTY detection.
func ResolveColor(flag string, noColor bool) bool {
	switch flag {
	case "always":
		return true
	case "never":
		return false
	default:
		return !noColor
	}
}
