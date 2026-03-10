// Package precommit orchestrates all pre-commit hook steps.
package precommit

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
	"strings"

	"github.com/wahidyankf/open-sharia-enterprise/apps/rhino-cli/internal/agents"
	"github.com/wahidyankf/open-sharia-enterprise/apps/rhino-cli/internal/docs"
)

// Deps holds all injectable dependencies for full testability.
type Deps struct {
	// GetStagedFiles returns the list of files currently staged (git diff --cached --name-only).
	GetStagedFiles func(gitRoot string) ([]string, error)
	// ExecCommand creates a command for external tool invocations (default: exec.Command).
	ExecCommand func(name string, args ...string) *exec.Cmd
	// FindMixRoot walks up from a file path to find the nearest mix.exs project root.
	// Returns the path relative to gitRoot and true if found.
	FindMixRoot func(file, gitRoot string) (string, bool)
	// LookPath reports whether a binary is available on PATH (default: exec.LookPath).
	LookPath func(file string) (string, error)

	// Internal Go function injections — no subprocess round-trips.
	ValidateClaude func(agents.ValidateClaudeOptions) (*agents.ValidationResult, error)
	SyncAll        func(agents.SyncOptions) (*agents.SyncResult, error)
	ValidateSync   func(repoRoot string) (*agents.ValidationResult, error)
	ValidateNaming func(docs.ValidationOptions) (*docs.ValidationResult, error)
	FixNaming      func(*docs.ValidationResult, docs.FixOptions) (*docs.FixResult, error)
	ValidateLinks  func(docs.ScanOptions) (*docs.LinkValidationResult, error)

	Stdout io.Writer
	Stderr io.Writer
}

// DefaultDeps returns production-ready dependencies.
func DefaultDeps() Deps {
	return Deps{
		GetStagedFiles: defaultGetStagedFiles,
		ExecCommand:    exec.Command,
		FindMixRoot:    findMixRootDefault,
		LookPath:       exec.LookPath,
		ValidateClaude: agents.ValidateClaude,
		SyncAll:        agents.SyncAll,
		ValidateSync:   agents.ValidateSync,
		ValidateNaming: docs.ValidateAll,
		FixNaming:      docs.Fix,
		ValidateLinks:  docs.ValidateAllLinks,
		Stdout:         os.Stdout,
		Stderr:         os.Stderr,
	}
}

// Run executes all pre-commit steps in order, failing fast on the first error.
func Run(gitRoot string, deps Deps) error {
	staged, err := deps.GetStagedFiles(gitRoot)
	if err != nil {
		return fmt.Errorf("failed to get staged files: %w", err)
	}

	if err := step1Config(gitRoot, staged, deps); err != nil {
		return err
	}
	if err := step2DockerCompose(gitRoot, staged, deps); err != nil {
		return err
	}
	step3NxPreCommit(gitRoot, deps)
	step4StageAyokoding(gitRoot, deps)
	if err := step5LintStaged(gitRoot, deps); err != nil {
		return err
	}
	if err := step6ElixirFormat(gitRoot, staged, deps); err != nil {
		return err
	}
	if err := step7DocsNaming(gitRoot, staged, deps); err != nil {
		return err
	}
	if err := step8ValidateLinks(gitRoot, deps); err != nil {
		return err
	}
	return step9LintMarkdown(gitRoot, deps)
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

// step4StageAyokoding stages ayokoding-web content changes; errors are ignored.
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

// step6ElixirFormat auto-formats staged Elixir files, grouped by Mix project root.
func step6ElixirFormat(gitRoot string, staged []string, deps Deps) error {
	var elixirFiles []string
	for _, f := range staged {
		if !strings.HasSuffix(f, ".ex") && !strings.HasSuffix(f, ".exs") {
			continue
		}
		if strings.Contains(f, "/deps/") || strings.Contains(f, "/_build/") {
			continue
		}
		elixirFiles = append(elixirFiles, f)
	}
	if len(elixirFiles) == 0 {
		_, _ = fmt.Fprintln(deps.Stdout, "⏭️  Skipping Elixir formatting (no .ex/.exs files staged)")
		return nil
	}

	// Use path check rather than error check to avoid nilerr lint violation.
	// LookPath returns ("", err) when binary not found.
	mixPath, _ := deps.LookPath("mix")
	if mixPath == "" {
		_, _ = fmt.Fprintln(deps.Stdout, "⚠️  mix not found, skipping Elixir formatting")
		return nil
	}

	_, _ = fmt.Fprintln(deps.Stdout, "🔧 Formatting Elixir files...")

	// Group files by their Mix project root.
	rootToFiles := make(map[string][]string)
	for _, f := range elixirFiles {
		root, ok := deps.FindMixRoot(f, gitRoot)
		if !ok {
			continue
		}
		rootToFiles[root] = append(rootToFiles[root], f)
	}

	for root, files := range rootToFiles {
		var relFiles []string
		for _, f := range files {
			rel, err := filepath.Rel(root, f)
			if err != nil {
				rel = strings.TrimPrefix(f, root+"/")
			}
			relFiles = append(relFiles, rel)
		}
		args := append([]string{"format"}, relFiles...)
		cmd := deps.ExecCommand("mix", args...)
		cmd.Dir = filepath.Join(gitRoot, root)
		cmd.Stdout = deps.Stdout
		cmd.Stderr = deps.Stderr
		if err := cmd.Run(); err != nil {
			return fmt.Errorf("mix format failed in %s: %w", root, err)
		}
	}

	// Re-stage all formatted Elixir files.
	gitAddArgs := append([]string{"add"}, elixirFiles...)
	addCmd := deps.ExecCommand("git", gitAddArgs...)
	addCmd.Dir = gitRoot
	_ = addCmd.Run()

	_, _ = fmt.Fprintln(deps.Stdout, "✅ Elixir files formatted")
	return nil
}

// step7DocsNaming validates and auto-fixes docs file naming if any docs/ files are staged.
func step7DocsNaming(gitRoot string, staged []string, deps Deps) error {
	hasDocsStagedFile := hasMatch(staged, func(f string) bool {
		return strings.HasPrefix(f, "docs/")
	})
	if !hasDocsStagedFile {
		_, _ = fmt.Fprintln(deps.Stdout, "⏭️  Skipping docs naming validation (no docs/ changes in staged files)")
		return nil
	}

	_, _ = fmt.Fprintln(deps.Stdout, "🔍 Validating and fixing documentation file naming...")

	result, err := deps.ValidateNaming(docs.ValidationOptions{
		RepoRoot:   gitRoot,
		StagedOnly: true,
	})
	if err != nil {
		return err
	}

	if len(result.Violations) > 0 {
		fixResult, err := deps.FixNaming(result, docs.FixOptions{
			RepoRoot:    gitRoot,
			DryRun:      false,
			UpdateLinks: true,
		})
		if err != nil {
			return err
		}
		if len(fixResult.Errors) > 0 {
			return fmt.Errorf("docs naming fix errors: %s", strings.Join(fixResult.Errors, "; "))
		}
	}

	// Stage any files modified by link updates and renames.
	gitAdd := deps.ExecCommand("git", "add", "docs/", "governance/", ".claude/")
	gitAdd.Dir = gitRoot
	_ = gitAdd.Run()

	_, _ = fmt.Fprintln(deps.Stdout, "✅ Documentation naming validation passed")
	return nil
}

// step8ValidateLinks validates markdown links in staged files.
func step8ValidateLinks(gitRoot string, deps Deps) error {
	result, err := deps.ValidateLinks(docs.ScanOptions{
		RepoRoot:   gitRoot,
		StagedOnly: true,
		SkipPaths:  []string{".opencode/skill/"},
	})
	if err != nil {
		return err
	}
	if len(result.BrokenLinks) > 0 {
		_, _ = fmt.Fprintf(deps.Stderr, "❌ Found %d broken links\n", len(result.BrokenLinks))
		return fmt.Errorf("found %d broken links", len(result.BrokenLinks))
	}
	return nil
}

// step9LintMarkdown runs npm run lint:md to validate all markdown files.
func step9LintMarkdown(gitRoot string, deps Deps) error {
	cmd := deps.ExecCommand("npm", "run", "lint:md")
	cmd.Dir = gitRoot
	cmd.Stdout = deps.Stdout
	cmd.Stderr = deps.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("markdown linting failed: %w", err)
	}
	return nil
}

// findMixRootDefault walks up from the file's directory to find the nearest mix.exs.
// The file argument is a path relative to gitRoot (e.g. "apps/organiclever-be-exph/lib/foo.ex").
// Returns the directory relative to gitRoot (e.g. "apps/organiclever-be-exph") and true if found.
func findMixRootDefault(file, gitRoot string) (string, bool) {
	dir := filepath.Dir(file)
	for {
		mixFile := filepath.Join(gitRoot, dir, "mix.exs")
		if _, err := os.Stat(mixFile); err == nil {
			return dir, true
		}
		parent := filepath.Dir(dir)
		if parent == dir || dir == "." {
			return "", false
		}
		dir = parent
	}
}
