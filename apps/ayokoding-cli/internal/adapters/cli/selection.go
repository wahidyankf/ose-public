package cli

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/git"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
)

// changedFiles resolves --since through git: the repo-relative changed
// paths with the repo-relative content root they map through. Without
// --since both are empty.
func changedFiles(ctx context.Context, contentDir, since string) ([]string, string, error) {
	if since == "" {
		return nil, "", nil
	}
	absolute, err := filepath.Abs(contentDir)
	if err != nil {
		return nil, "", fmt.Errorf("cli: resolve content: %w", err)
	}
	if resolved, err := filepath.EvalSymlinks(absolute); err == nil {
		absolute = resolved
	}
	changed, err := git.ChangedFiles(ctx, absolute, since)
	if err != nil {
		return nil, "", fmt.Errorf("cli: read changed files: %w", err)
	}
	prefix, err := git.ContentPrefix(ctx, absolute)
	if err != nil {
		return nil, "", fmt.Errorf("cli: locate content: %w", err)
	}
	return changed, prefix, nil
}

// resolveSince resolves --since and --shard to explicit courses for
// commands that run the selection themselves.
func resolveSince(
	ctx context.Context,
	contentDir string,
	courses []string,
	since string,
	all bool,
	shard string,
) ([]string, error) {
	changed, prefix, err := changedFiles(ctx, contentDir, since)
	if err != nil {
		return nil, err
	}
	resolved, err := application.Affected(application.AffectedRequest{
		Content:       os.DirFS(contentDir),
		Courses:       courses,
		All:           all,
		Since:         since,
		Shard:         shard,
		ChangedFiles:  changed,
		ContentPrefix: prefix,
	})
	if err != nil {
		return nil, fmt.Errorf("cli: resolve selection: %w", err)
	}
	return resolved.Courses, nil
}
