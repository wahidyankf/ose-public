// Package containers executes the image builds containerplan plans,
// through the Docker command-line interface (decision D4).
package containers

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// envBuildFailed is the closed result code a failed image build carries.
// The wiring commit registers it beside the sibling ayokoding.examples
// codes; the literal keeps this package free of an out-of-set edit.
const envBuildFailed = "ayokoding.examples.env-build-failed"

// logLinesKept bounds a failed build diagnosis to its tail.
const logLinesKept = 40

// Builder executes image builds with a cancellable context.
type Builder struct {
	// Exec runs one container CLI call and returns its combined output.
	// A nil Exec runs the real CLI through os/exec.
	Exec func(ctx context.Context, cli string, args []string) (string, error)
}

// BuildDerived builds one derived image from its embedded Dockerfile and
// returns its content-hash tag.
func (b Builder) BuildDerived(ctx context.Context, settings containerplan.Settings, contextParent, toolID, baseRef string, dockerfile []byte, args []string) (string, error) {
	parent, err := materializeParent(contextParent)
	if err != nil {
		return "", fmt.Errorf("containers: build derived image for %s: %w", toolID, err)
	}
	planned, err := containerplan.Derived(settings, parent, toolID, baseRef, dockerfile, args)
	if err != nil {
		return "", fmt.Errorf("containers: build derived image for %s: %w", toolID, err)
	}
	if err := writeFiles(parent, planned.Files); err != nil {
		return "", fmt.Errorf("containers: build derived image for %s: %w", toolID, err)
	}
	if err := b.run(ctx, planned.Invoke); err != nil {
		return "", err
	}
	return planned.Tag, nil
}

// BuildEnvironment builds one environment image for a toolchain lockfile
// and returns its content-hash tag.
func (b Builder) BuildEnvironment(ctx context.Context, settings containerplan.Settings, contextParent, toolchain, imageRef, lockfileName string, lockfile []byte, install catalog.Install) (string, error) {
	parent, err := materializeParent(contextParent)
	if err != nil {
		return "", fmt.Errorf("containers: build environment image for %s: %w", toolchain, err)
	}
	planned := containerplan.Environment(settings, parent, toolchain, imageRef, lockfileName, lockfile, install)
	if err := writeFiles(parent, planned.Files); err != nil {
		return "", fmt.Errorf("containers: build environment image for %s: %w", toolchain, err)
	}
	if err := b.run(ctx, planned.Invoke); err != nil {
		return "", err
	}
	return planned.Tag, nil
}

// Present reports whether the image reference exists locally.
func (b Builder) Present(ctx context.Context, cli, ref string) bool {
	probe := containerplan.Inspect(cli, ref)
	_, err := b.runner()(ctx, probe.Binary, probe.Args)
	return err == nil
}

// run executes one planned invocation and maps a failure to the closed
// environment-build code with the last 40 log lines.
func (b Builder) run(ctx context.Context, invoke containerplan.Invocation) error {
	output, err := b.runner()(ctx, invoke.Binary, invoke.Args)
	if err == nil {
		return nil
	}
	return &finding.Error{
		Code:    envBuildFailed,
		Message: "build failed: " + lastLines(output, logLinesKept),
	}
}

// runner selects the injected fake or the real container CLI runner.
func (b Builder) runner() func(ctx context.Context, cli string, args []string) (string, error) {
	if b.Exec != nil {
		return b.Exec
	}
	return realExec
}

// realExec runs the container CLI and returns its combined output. The
// caller context cancels the child, so interrupts stop the build.
func realExec(ctx context.Context, cli string, args []string) (string, error) {
	cmd := exec.CommandContext(ctx, cli, args...)
	combined, err := cmd.CombinedOutput()
	if err != nil {
		return string(combined), fmt.Errorf("containers: run %s: %w", cli, err)
	}
	return string(combined), nil
}

// materializeParent creates a fresh build context directory.
func materializeParent(parent string) (string, error) {
	dir, err := os.MkdirTemp(parent, "ayokoding-build-")
	if err != nil {
		return "", fmt.Errorf("containers: create build context: %w", err)
	}
	return dir, nil
}

// writeFiles places the planned context files beside the Dockerfile.
func writeFiles(dir string, files map[string][]byte) error {
	for name, content := range files {
		if err := os.WriteFile(filepath.Join(dir, name), content, 0o600); err != nil {
			return fmt.Errorf("containers: write build context: %w", err)
		}
	}
	return nil
}

// lastLines keeps the tail of a build log for the failure diagnosis.
func lastLines(output string, keep int) string {
	lines := strings.Split(strings.TrimSuffix(output, "\n"), "\n")
	if len(lines) > keep {
		lines = lines[len(lines)-keep:]
	}
	return strings.Join(lines, "\n")
}
