// Package git orchestrates all pre-commit hook steps.
package git

import (
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
	"strings"
	"time"

	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/agents"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/docs"
)

const (
	// stepTimeout is the maximum duration allowed for a single pre-commit step.
	stepTimeout = 30 * time.Second
	// totalTimeout is the maximum duration allowed for the entire pre-commit run.
	totalTimeout = 120 * time.Second
)

// Deps holds all injectable dependencies for full testability.
type Deps struct {
	// GetStagedFiles returns the list of files currently staged (git diff --cached --name-only).
	GetStagedFiles func(gitRoot string) ([]string, error)
	// ExecCommand creates a command for external tool invocations (default: exec.Command).
	ExecCommand func(name string, args ...string) *exec.Cmd

	// Internal Go function injections — no subprocess round-trips.
	ValidateClaude func(agents.ValidateClaudeOptions) (*agents.ValidationResult, error)
	SyncAll        func(agents.SyncOptions) (*agents.SyncResult, error)
	ValidateSync   func(repoRoot string) (*agents.ValidationResult, error)
	ValidateLinks  func(docs.ScanOptions) (*docs.LinkValidationResult, error)

	Stdout io.Writer
	Stderr io.Writer
}

// DefaultDeps returns production-ready dependencies.
func DefaultDeps() Deps {
	return Deps{
		GetStagedFiles: defaultGetStagedFiles,
		ExecCommand:    exec.Command,
		ValidateClaude: agents.ValidateClaude,
		SyncAll:        agents.SyncAll,
		ValidateSync:   agents.ValidateSync,
		ValidateLinks:  docs.ValidateAllLinks,
		Stdout:         os.Stdout,
		Stderr:         os.Stderr,
	}
}

// runWithStepTimeout runs fn within stepTimeout. If the deadline is exceeded
// it logs a warning to deps.Stdout and returns nil so the commit is not
// blocked. The totalCtx is checked before each step; if it has already
// expired, no further steps are run and a warning is printed.
func runWithStepTimeout(totalCtx context.Context, name string, deps Deps, fn func() error) error {
	if err := totalCtx.Err(); err != nil {
		_, _ = fmt.Fprintf(deps.Stdout, "⚠️  Total pre-commit timeout reached — skipping remaining steps (including %s)\n", name)
		return nil
	}

	stepCtx, cancel := context.WithTimeout(totalCtx, stepTimeout)
	defer cancel()

	type result struct{ err error }
	ch := make(chan result, 1)
	go func() { ch <- result{fn()} }()

	select {
	case r := <-ch:
		return r.err
	case <-stepCtx.Done():
		_, _ = fmt.Fprintf(deps.Stdout, "⚠️  Step %q timed out after %s — skipping\n", name, stepTimeout)
		return nil
	}
}

// Run executes all pre-commit steps in order, failing fast on the first error.
// Each step is bounded by stepTimeout (30s); the entire run is bounded by
// totalTimeout (120s). A timed-out step logs a warning and is skipped rather
// than blocking the commit.
func Run(gitRoot string, deps Deps) error {
	totalCtx, totalCancel := context.WithTimeout(context.Background(), totalTimeout)
	defer totalCancel()

	staged, err := deps.GetStagedFiles(gitRoot)
	if err != nil {
		return fmt.Errorf("failed to get staged files: %w", err)
	}

	if err := runWithStepTimeout(totalCtx, "step1Config", deps, func() error {
		return step1Config(gitRoot, staged, deps)
	}); err != nil {
		return err
	}
	if err := runWithStepTimeout(totalCtx, "step2DockerCompose", deps, func() error {
		return step2DockerCompose(gitRoot, staged, deps)
	}); err != nil {
		return err
	}
	if err := runWithStepTimeout(totalCtx, "step3NxPreCommit", deps, func() error {
		step3NxPreCommit(gitRoot, deps)
		return nil
	}); err != nil {
		return err
	}
	if err := runWithStepTimeout(totalCtx, "step4StageAyokoding", deps, func() error {
		step4StageAyokoding(gitRoot, deps)
		return nil
	}); err != nil {
		return err
	}
	if err := runWithStepTimeout(totalCtx, "step5LintStaged", deps, func() error {
		return step5LintStaged(gitRoot, deps)
	}); err != nil {
		return err
	}
	if err := runWithStepTimeout(totalCtx, "step5bSyncLockfiles", deps, func() error {
		return step5bSyncLockfiles(gitRoot, staged, deps)
	}); err != nil {
		return err
	}
	if err := runWithStepTimeout(totalCtx, "step7ValidateLinks", deps, func() error {
		return step7ValidateLinks(gitRoot, deps)
	}); err != nil {
		return err
	}
	return runWithStepTimeout(totalCtx, "step8LintMarkdown", deps, func() error {
		return step8LintMarkdown(gitRoot, deps)
	})
}

// defaultGetStagedFiles returns staged files via git diff --cached --name-only.
func defaultGetStagedFiles(gitRoot string) ([]string, error) {
	cmd := exec.Command("git", "diff", "--cached", "--name-only")
	cmd.Dir = gitRoot
	out, err := cmd.Output()
	if err != nil {
		return nil, err
	}
	raw := strings.TrimSpace(string(out))
	if raw == "" {
		return nil, nil
	}
	return strings.Split(raw, "\n"), nil
}

// hasMatch returns true if any staged file satisfies the predicate.
func hasMatch(staged []string, pred func(string) bool) bool {
	return slices.ContainsFunc(staged, pred)
}

// step1Config validates .claude/ and .opencode/ configuration if any config files are staged.
func step1Config(gitRoot string, staged []string, deps Deps) error {
	hasConfig := hasMatch(staged, func(f string) bool {
		return strings.HasPrefix(f, ".claude/") || strings.HasPrefix(f, ".opencode/")
	})
	if !hasConfig {
		_, _ = fmt.Fprintln(deps.Stdout, "⏭️  Skipping config validation (no .claude/ or .opencode/ changes in staged files)")
		return nil
	}

	_, _ = fmt.Fprintln(deps.Stdout, "🔍 Validating .claude/ and .opencode/ configuration...")

	result, err := deps.ValidateClaude(agents.ValidateClaudeOptions{RepoRoot: gitRoot})
	if err != nil {
		_, _ = fmt.Fprintln(deps.Stdout, "❌ Configuration validation failed. Fix errors above before committing.")
		return err
	}
	if result.FailedChecks > 0 {
		_, _ = fmt.Fprintln(deps.Stdout, "❌ Configuration validation failed. Fix errors above before committing.")
		return fmt.Errorf("validation failed: %d checks failed", result.FailedChecks)
	}

	if _, err := deps.SyncAll(agents.SyncOptions{RepoRoot: gitRoot}); err != nil {
		_, _ = fmt.Fprintln(deps.Stdout, "❌ Configuration sync failed. Fix errors above before committing.")
		return err
	}

	syncResult, err := deps.ValidateSync(gitRoot)
	if err != nil {
		_, _ = fmt.Fprintln(deps.Stdout, "❌ Configuration validation failed. Fix errors above before committing.")
		return err
	}
	if syncResult.FailedChecks > 0 {
		_, _ = fmt.Fprintln(deps.Stdout, "❌ Configuration validation failed. Fix errors above before committing.")
		return fmt.Errorf("sync validation failed: %d checks failed", syncResult.FailedChecks)
	}

	_, _ = fmt.Fprintln(deps.Stdout, "✅ Configuration validation passed")
	return nil
}

// step2DockerCompose validates staged docker-compose files.
func step2DockerCompose(gitRoot string, staged []string, deps Deps) error {
	var composeFiles []string
	for _, f := range staged {
		if strings.HasSuffix(f, "docker-compose.yml") || strings.HasSuffix(f, "docker-compose.yaml") {
			composeFiles = append(composeFiles, f)
		}
	}
	if len(composeFiles) == 0 {
		_, _ = fmt.Fprintln(deps.Stdout, "⏭️  Skipping docker-compose validation (no docker-compose.yml changes in staged files)")
		return nil
	}

	_, _ = fmt.Fprintln(deps.Stdout, "🔍 Validating docker-compose.yml files...")
	for _, f := range composeFiles {
		absFile := filepath.Join(gitRoot, f)
		if _, err := os.Stat(absFile); os.IsNotExist(err) {
			continue
		}
		_, _ = fmt.Fprintf(deps.Stdout, "  Checking %s...\n", f)
		cmd := deps.ExecCommand("docker", "compose", "-f", f, "config")
		cmd.Dir = gitRoot
		if err := cmd.Run(); err != nil {
			_, _ = fmt.Fprintf(deps.Stdout, "❌ Docker Compose validation failed for %s\n", f)
			_, _ = fmt.Fprintf(deps.Stdout, "   Run: docker compose -f %s config\n", f)
			return fmt.Errorf("docker compose validation failed for %s", f)
		}
		_, _ = fmt.Fprintf(deps.Stdout, "  ✅ %s is valid\n", f)
	}
	_, _ = fmt.Fprintln(deps.Stdout, "✅ All docker-compose files validated")
	return nil
}

// step3NxPreCommit runs nx affected run-pre-commit; failure is a warning only.
func step3NxPreCommit(gitRoot string, deps Deps) {
	cmd := deps.ExecCommand("nx", "affected", "-t", "run-pre-commit", "--skip-nx-cache")
	cmd.Dir = gitRoot
	cmd.Stdout = deps.Stdout
	cmd.Stderr = deps.Stderr
	if err := cmd.Run(); err != nil {
		_, _ = fmt.Fprintln(deps.Stdout, "⚠️  Skipping run-pre-commit (not affected or binary missing)")
	}
}

// step4StageAyokoding auto-stages ayokoding-web content changes so they are
// included in the current commit. The ayokoding-web content directory may be
// modified by content-generation scripts or tooling that runs outside of the
// normal edit-stage workflow. This step ensures those modifications are not
// silently left unstaged and forgotten. Errors are intentionally ignored
// because the step is best-effort: if git add fails (e.g. no changes), the
// commit should still proceed normally.
func step4StageAyokoding(gitRoot string, deps Deps) {
	cmd := deps.ExecCommand("git", "add", "apps/ayokoding-web/content/")
	cmd.Dir = gitRoot
	_ = cmd.Run()
}

// step5LintStaged runs npx lint-staged.
func step5LintStaged(gitRoot string, deps Deps) error {
	cmd := deps.ExecCommand("npx", "lint-staged")
	cmd.Dir = gitRoot
	cmd.Stdout = deps.Stdout
	cmd.Stderr = deps.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("lint-staged failed: %w", err)
	}
	return nil
}

// step5bSyncLockfiles regenerates app-level package-lock.json when package.json is staged.
//
// Some apps (e.g. a-demo-be-ts-effect, organiclever-fe) have their own package-lock.json
// used by Dockerfile for `npm ci`. If package.json is updated but the lockfile is not
// regenerated, `npm ci` fails in Docker builds (EUSAGE: lockfile out of sync).
//
// This step detects staged package.json files in app directories that have a sibling
// package-lock.json, regenerates the lockfile, and auto-stages it.
func step5bSyncLockfiles(gitRoot string, staged []string, deps Deps) error {
	var appsToSync []string

	for _, f := range staged {
		// Match apps/*/package.json (exactly two path segments under apps/).
		if !strings.HasPrefix(f, "apps/") || !strings.HasSuffix(f, "/package.json") {
			continue
		}
		// Ensure it's a direct child of apps/ (e.g. apps/a-demo-be-ts-effect/package.json),
		// not a nested path like apps/foo/bar/package.json.
		parts := strings.Split(f, "/")
		if len(parts) != 3 {
			continue
		}
		appDir := filepath.Join(gitRoot, filepath.Dir(f))
		lockfile := filepath.Join(appDir, "package-lock.json")
		if _, err := os.Stat(lockfile); err == nil {
			appsToSync = append(appsToSync, filepath.Dir(f))
		}
	}

	if len(appsToSync) == 0 {
		return nil
	}

	_, _ = fmt.Fprintln(deps.Stdout, "🔒 Syncing app-level package-lock.json files...")

	for _, appRel := range appsToSync {
		appDir := filepath.Join(gitRoot, appRel)
		_, _ = fmt.Fprintf(deps.Stdout, "  Regenerating %s/package-lock.json...\n", appRel)

		cmd := deps.ExecCommand("npm", "install", "--package-lock-only")
		cmd.Dir = appDir
		cmd.Stdout = deps.Stdout
		cmd.Stderr = deps.Stderr
		if err := cmd.Run(); err != nil {
			return fmt.Errorf("failed to regenerate package-lock.json in %s: %w", appRel, err)
		}

		// Auto-stage the regenerated lockfile.
		lockRel := filepath.Join(appRel, "package-lock.json")
		addCmd := deps.ExecCommand("git", "add", lockRel)
		addCmd.Dir = gitRoot
		_ = addCmd.Run()

		_, _ = fmt.Fprintf(deps.Stdout, "  ✅ %s/package-lock.json synced and staged\n", appRel)
	}

	_, _ = fmt.Fprintln(deps.Stdout, "✅ All app lockfiles synced")
	return nil
}

// step7ValidateLinks validates markdown links in staged files.
func step7ValidateLinks(gitRoot string, deps Deps) error {
	result, err := deps.ValidateLinks(docs.ScanOptions{
		RepoRoot:   gitRoot,
		StagedOnly: true,
		SkipPaths:  []string{".claude/worktrees/"},
	})
	if err != nil {
		return err
	}
	if len(result.BrokenLinks) > 0 {
		_, _ = fmt.Fprint(deps.Stderr, docs.FormatLinkText(result, false, false))
		_, _ = fmt.Fprintf(deps.Stderr, "\n❌ Found %d broken links\n", len(result.BrokenLinks))
		return fmt.Errorf("found %d broken links", len(result.BrokenLinks))
	}
	return nil
}

// step8LintMarkdown runs npm run lint:md to validate all markdown files.
func step8LintMarkdown(gitRoot string, deps Deps) error {
	cmd := deps.ExecCommand("npm", "run", "lint:md")
	cmd.Dir = gitRoot
	cmd.Stdout = deps.Stdout
	cmd.Stderr = deps.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("markdown linting failed: %w", err)
	}
	return nil
}
