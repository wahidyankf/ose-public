// Package git reads course selections from a git working tree: the files
// changed between a base revision and HEAD.
package git

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// timeout bounds every git child process: selection reads local history
// and never waits on the network.
const timeout = 60 * time.Second

// ContentPrefix returns dir as a repo-relative slash path, so changed
// files map onto courses below it: "courses" for <root>/courses, and ""
// at the repository root.
func ContentPrefix(ctx context.Context, dir string) (string, error) {
	top, err := gitOutput(ctx, dir, "rev-parse", "--show-toplevel")
	if err != nil {
		return "", err
	}
	top = strings.TrimSpace(top)
	if resolved, err := filepath.EvalSymlinks(top); err == nil {
		top = resolved
	}
	relative, err := filepath.Rel(top, dir)
	if err != nil {
		return "", fmt.Errorf("git: relativize content: %w", err)
	}
	if relative == "." || relative == ".." || strings.HasPrefix(relative, ".."+string(filepath.Separator)) {
		return "", nil
	}
	return filepath.ToSlash(relative), nil
}

// ChangedFiles lists the repo-relative files changed between the merge
// base of rev and HEAD: `git diff --name-only <merge-base>...HEAD`. It
// runs git with every GIT_* variable cleared, so the caller's environment
// never redirects the repository.
func ChangedFiles(ctx context.Context, repoDir, rev string) ([]string, error) {
	base, err := gitOutput(ctx, repoDir, "merge-base", rev, "HEAD")
	if err != nil {
		return nil, err
	}
	out, err := gitOutput(ctx, repoDir, "diff", "--name-only", strings.TrimSpace(base)+"...HEAD")
	if err != nil {
		return nil, err
	}
	var files []string
	for line := range strings.SplitSeq(out, "\n") {
		if trimmed := strings.TrimSpace(line); trimmed != "" {
			files = append(files, trimmed)
		}
	}
	return files, nil
}

// gitOutput runs one git command inside dir with the GIT_* variables
// cleared and returns its standard output.
func gitOutput(ctx context.Context, repoDir string, args ...string) (string, error) {
	cli, err := exec.LookPath("git")
	if err != nil {
		return "", &finding.Error{Code: finding.EnvGitNotFound, Message: "git was not found on PATH"}
	}
	ctx, stop := context.WithTimeout(ctx, timeout)
	defer stop()
	cmd := exec.CommandContext(ctx, cli, args...)
	cmd.Dir = repoDir
	cmd.Env = cleanEnv()
	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("git: %s: %w", strings.Join(args, " "), err)
	}
	return string(output), nil
}

// cleanEnv returns the process environment with every GIT_* variable
// cleared, so GIT_DIR and its siblings never redirect the child.
func cleanEnv() []string {
	var kept []string
	for _, variable := range os.Environ() {
		if key, _, _ := strings.Cut(variable, "="); !strings.HasPrefix(key, "GIT_") {
			kept = append(kept, variable)
		}
	}
	return kept
}
