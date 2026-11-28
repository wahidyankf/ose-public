package web

import (
	"fmt"
	"io/fs"
	"path"
	"strings"
)

// Corpus names the two source roots a default start reads.
type Corpus struct {
	ContentDir   string
	ManifestsDir string
}

// repoMarker names the repository root: the nearest ancestor of the working
// directory that holds it.
const repoMarker = "repo-config.yml"

// contentCandidates and manifestsCandidates list the default roots relative to
// the repository root. The first existing candidate wins, so a move of the
// content into apps/ayokoding-web needs no code change.
var (
	contentCandidates   = []string{"apps/ayokoding-web/content", "apps/ayokoding-www/content"}
	manifestsCandidates = []string{"apps/ayokoding-web/manifests", "apps/ayokoding-www/src/features/course-paths/manifests"}
)

// ResolveCorpus resolves both default source roots. Each root is the variable
// the launcher names when it is set, else the first existing default candidate
// under the nearest repository root. Either root must be readable, or startup
// is refused.
func ResolveCorpus(sources Sources) (Corpus, error) {
	content, err := resolveRoot(sources, envContentDir, contentCandidates)
	if err != nil {
		return Corpus{}, err
	}
	manifests, err := resolveRoot(sources, envManifestsDir, manifestsCandidates)
	if err != nil {
		return Corpus{}, err
	}
	return Corpus{ContentDir: content, ManifestsDir: manifests}, nil
}

// resolveRoot returns the root the variable names, or else the first candidate
// that exists under the repository root, after checking that it is readable.
func resolveRoot(sources Sources, variable string, candidates []string) (string, error) {
	if value, ok := sources.Environment(variable); ok && strings.TrimSpace(value) != "" {
		return readableRoot(sources, variable, strings.TrimSpace(value))
	}
	repo, err := repositoryRoot(sources)
	if err != nil {
		return "", fmt.Errorf("%s is unset and no default root can be found: %w", variable, err)
	}
	for _, relative := range candidates {
		dir := path.Join(repo, relative)
		if info, err := fs.Stat(sources.Root(dir), "."); err == nil && info.IsDir() {
			return readableRoot(sources, variable, dir)
		}
	}
	return "", fmt.Errorf("%s is unset and no default root exists under %s (tried %s)", variable, repo, strings.Join(candidates, ", "))
}

// repositoryRoot walks up from the working directory to the nearest directory
// that holds the repository marker.
func repositoryRoot(sources Sources) (string, error) {
	if sources.Working == "" {
		return "", fmt.Errorf("the working directory is unknown")
	}
	dir := sources.Working
	for {
		if _, err := fs.Stat(sources.Root(dir), repoMarker); err == nil {
			return dir, nil
		}
		parent := path.Dir(dir)
		if parent == dir {
			return "", fmt.Errorf("no %s holds or contains %s", repoMarker, sources.Working)
		}
		dir = parent
	}
}

// readableRoot checks that the root's directory listing can be read.
func readableRoot(sources Sources, variable, dir string) (string, error) {
	if _, err := fs.ReadDir(sources.Root(dir), "."); err != nil {
		return "", fmt.Errorf("%s root %q cannot be read: %w", variable, dir, err)
	}
	return dir, nil
}
