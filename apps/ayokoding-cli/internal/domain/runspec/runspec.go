// Package runspec decodes run.yaml files with strict decoding and checks
// every field rule of the run contract, returning a checked Spec or closed
// findings. Only lexical path rules apply here: symlink resolution needs the
// real filesystem and is enforced where units run, not in static validation.
// Expected-file existence is a run-time concern for the same reason.
package runspec

import (
	"time"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// Schema versions, modes, kinds, and static reasons in the closed vocabulary.
const (
	schemaV1 = "ayokoding.run/v1"

	modeReal   = "real"
	modeStatic = "static"

	kindExample = "example"
	kindTest    = "test"
	kindCheck   = "check"

	defaultTimeout = 60 * time.Second
	minTimeout     = 1 * time.Second
	maxTimeout     = 600 * time.Second

	defaultMemoryBytes int64 = 1073741824
	minMemoryBytes     int64 = 268435456
	maxMemoryBytes     int64 = 4294967296
	defaultCPUs              = 2

	maxRuns = 20

	// defaultCheckInvariant states what a test or check run ignoring stdout
	// proves, so only example runs must state their own invariant.
	defaultCheckInvariant = "the runner exits 0 only when every check passes"
)

// Expectation is one run's checked expected outcome.
type Expectation struct {
	Exit      int
	Stdout    string
	Stderr    string
	Invariant string
}

// Run is one checked run entry.
type Run struct {
	Name       string
	Kind       string
	Command    []string
	Workdir    string
	Stdin      string
	Env        map[string]string
	Timeout    time.Duration
	Simulation bool
	Expect     Expectation
}

// Spec is one checked run.yaml.
type Spec struct {
	Schema       string
	Toolchain    string
	Mode         string
	StaticReason string
	StaticNote   string
	Services     []string
	Lockfile     string
	MemoryBytes  int64
	CPUs         int
	Runs         []Run
}

// Parse decodes data and checks every field rule, returning either a checked
// Spec or findings. Structural findings stop decoding; semantic rules run in
// field order so output is deterministic.
func Parse(course, unit string, data []byte, cat catalog.Catalog) (Spec, []finding.Finding) {
	checker := &checker{course: course, path: unit + "/run.yaml", catalog: cat}
	raw, positions, ok := decodeStrict(checker, data)
	if !ok {
		var empty Spec
		return empty, checker.findings
	}
	spec, valid := checker.check(raw, positions)
	if !valid {
		var empty Spec
		return empty, checker.findings
	}
	return spec, nil
}
