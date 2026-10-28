package application

import (
	"context"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/layout"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/runspec"
)

// preparedUnit holds one unit ready to execute: the checked spec, the run
// image, and the course files. Each execution materializes its own fresh
// working copy, bound at /work and recorded in work.
type preparedUnit struct {
	course string
	unit   layout.Unit
	spec   runspec.Spec
	image  string
	files  fs.FS
	work   string
}

// runUnit parses one unit spec, prepares its image and working copy, and
// executes it. Invalid specs report their findings and never execute.
func (flow *runner) runUnit(ctx context.Context, course string, sub fs.FS, unit layout.Unit) error {
	data, err := fs.ReadFile(sub, unit.Path+"/run.yaml")
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return nil
		}
		return fmt.Errorf("application: read run spec for %q: %w", unit.Path, err)
	}
	spec, specFindings := runspec.Parse(course, unit.Path, data, flow.req.Catalog)
	if len(specFindings) != 0 {
		flow.report.Findings = append(flow.report.Findings, specFindings...)
		return nil
	}
	prepared, findings, err := flow.prepareUnit(ctx, course, sub, unit, spec)
	if err != nil {
		return err
	}
	if len(findings) != 0 {
		flow.report.Findings = append(flow.report.Findings, findings...)
		return nil
	}
	return flow.executeUnit(ctx, prepared)
}

// prepareUnit resolves the run image; each execution materializes its own
// fresh working copy, so a run mutating its sources cannot poison the
// second execution and the course files stay untouched.
func (flow *runner) prepareUnit(ctx context.Context, course string, sub fs.FS, unit layout.Unit, spec runspec.Spec) (preparedUnit, []finding.Finding, error) {
	image, findings, err := flow.runImage(ctx, course, sub, unit, spec)
	if err != nil || len(findings) != 0 {
		return preparedUnit{}, findings, err
	}
	return preparedUnit{course: course, unit: unit, spec: spec, image: image, files: sub}, nil, nil
}

// runImage returns the image one unit runs in: the environment image for a
// locked unit, else the toolchain image. A failed environment build is the
// negative result ayokoding.examples.env-build-failed, so sibling units
// still run.
func (flow *runner) runImage(ctx context.Context, course string, sub fs.FS, unit layout.Unit, spec runspec.Spec) (string, []finding.Finding, error) {
	if spec.Lockfile == "" {
		entry, _ := flow.req.Catalog.Lookup(spec.Toolchain)
		return entry.Image, nil, nil
	}
	if flow.req.EnvBuilder == nil {
		return "", nil, &finding.Error{
			Code:    finding.UsageInvalidArguments,
			Message: "unit " + unit.Path + " locks dependencies but no image builder is wired",
		}
	}
	lockfile, err := fs.ReadFile(sub, spec.Lockfile)
	if err != nil {
		//nolint:nilerr // the findings slice carries unit-scoped failures so siblings still run; the error return is for command-stopping failures.
		return "", []finding.Finding{{
			Code:    CodeEnvBuildFailed,
			Course:  course,
			Path:    unit.Path + "/run.yaml",
			Line:    1,
			Message: "lockfile " + spec.Lockfile + " is missing: " + err.Error(),
		}}, nil
	}
	toolchain, _ := flow.req.Catalog.Lookup(spec.Toolchain)
	tag, err := flow.req.EnvBuilder.BuildEnvironment(ctx, flow.req.Settings, "", spec.Toolchain, toolchain.Image, path.Base(spec.Lockfile), lockfile, toolchain.Install)
	if err != nil {
		status := finding.ExitCode(err)
		if status >= 124 && status <= 130 || ctx.Err() != nil || errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
			return "", nil, fmt.Errorf("application: preflight environment build: %w", err)
		}
		return "", []finding.Finding{{
			Code:    CodeEnvBuildFailed,
			Course:  course,
			Path:    unit.Path + "/run.yaml",
			Line:    1,
			Message: "environment image build failed: " + err.Error(),
		}}, nil
	}
	return tag, nil, nil
}

// workingCopy copies one unit into a fresh temporary directory and places
// the caller links, so runs never write the repository.
func (flow *runner) workingCopy(sub fs.FS, unit layout.Unit) (string, error) {
	work, err := os.MkdirTemp("", "ayokoding-run-")
	if err != nil {
		return "", fmt.Errorf("application: create working copy: %w", err)
	}
	if err := copyUnit(sub, unit.Path, work); err != nil {
		_ = os.RemoveAll(work)
		return "", err
	}
	for _, link := range flow.req.Links {
		if err := placeLink(work, unit.Path, link); err != nil {
			_ = os.RemoveAll(work)
			return "", err
		}
	}
	return work, nil
}

// copyUnit copies every regular unit file into the working copy: the walk
// only collects names, and every filesystem write happens after it, so no
// write races a concurrent course edit mid-walk.
func copyUnit(sub fs.FS, unit, work string) error {
	var names []string
	if err := fs.WalkDir(sub, unit, func(name string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if entry.IsDir() || !entry.Type().IsRegular() {
			return nil
		}
		names = append(names, name)
		return nil
	}); err != nil {
		return fmt.Errorf("application: list unit %q: %w", unit, err)
	}
	for _, name := range names {
		if err := copyOne(sub, name, work+"/"+name); err != nil {
			return err
		}
	}
	return nil
}

// copyOne copies one course file into the working copy.
func copyOne(sub fs.FS, name, target string) error {
	data, err := fs.ReadFile(sub, name)
	if err != nil {
		return fmt.Errorf("application: read %q: %w", name, err)
	}
	if err := os.MkdirAll(path.Dir(target), 0o750); err != nil {
		return fmt.Errorf("application: create working copy dir: %w", err)
	}
	if err := os.WriteFile(target, data, 0o644); err != nil {
		return fmt.Errorf("application: write working copy for %q: %w", name, err)
	}
	return nil
}

// placeLink places one working-copy symlink, creating parent folders.
func placeLink(work, unit string, link containerplan.Link) error {
	target := work + "/" + unit + "/" + link.Name
	if err := os.MkdirAll(work+"/"+unit+"/"+path.Dir(link.Name), 0o750); err != nil {
		return fmt.Errorf("application: create link parent: %w", err)
	}
	if err := os.Symlink(link.Target, target); err != nil {
		return fmt.Errorf("application: place link %q: %w", link.Name, err)
	}
	return nil
}
