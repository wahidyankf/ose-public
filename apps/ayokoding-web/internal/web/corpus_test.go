package web_test

import (
	"io/fs"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/web"
)

// corpusRepo is the in-memory repository a default start discovers: the
// marker, the real content root, and the real manifests root.
func corpusRepo() map[string]fs.FS {
	return map[string]fs.FS{
		"/repo": fstest.MapFS{
			"repo-config.yml": seedFile("# marker\n"),
			"apps/ayokoding-www/content/en/learn/courses/just-enough-python/learning/beginner.md": seedFile("---\ntitle: Beginner\n---\n\n# Beginner\n"),
			"apps/ayokoding-www/src/features/course-paths/manifests/careers/backend.json":         seedFile("{}"),
		},
	}
}

func TestResolveCorpusRefusesAMissingManifestsRoot(t *testing.T) {
	trees := map[string]fs.FS{
		"/repo": fstest.MapFS{
			"repo-config.yml":                          seedFile("# marker\n"),
			"apps/ayokoding-www/content/en/learn/x.md": seedFile("---\ntitle: X\n---\n"),
		},
	}
	_, err := web.ResolveCorpus(repoSources("/repo/apps/ayokoding-web", nil, trees))
	if err == nil {
		t.Fatal("ResolveCorpus accepted a repository with no manifests root")
	}
	if !strings.Contains(err.Error(), "AYOKODING_WEB_MANIFESTS_DIR") {
		t.Fatalf("error = %q, want the manifests setting named", err)
	}
}

func TestResolveCorpusNeedsAKnownWorkingDirectory(t *testing.T) {
	_, err := web.ResolveCorpus(repoSources("", nil, corpusRepo()))
	if err == nil {
		t.Fatal("ResolveCorpus resolved roots without a working directory")
	}
}

// noLauncher reports every launcher variable as unset.
func noLauncher(string) (string, bool) { return "", false }

func repoSources(working string, env map[string]string, trees map[string]fs.FS) web.Sources {
	return web.Sources{
		Environment: func(key string) (string, bool) {
			value, ok := env[key]
			return value, ok
		},
		Root: func(dir string) fs.FS {
			for root, tree := range trees {
				if dir == root {
					return tree
				}
				if rest, ok := strings.CutPrefix(dir, root+"/"); ok {
					if sub, err := fs.Sub(tree, rest); err == nil {
						return sub
					}
				}
			}
			return unreadableFS{}
		},
		Working: working,
	}
}

func TestResolveCorpusDiscoversRealRootsFromTheWorkingDirectory(t *testing.T) {
	sources := repoSources("/repo/apps/ayokoding-web", nil, corpusRepo())
	corpus, err := web.ResolveCorpus(sources)
	if err != nil {
		t.Fatalf("ResolveCorpus: %v", err)
	}
	if corpus.ContentDir != "/repo/apps/ayokoding-www/content" {
		t.Fatalf("content root = %q, want the real ayokoding-www content root", corpus.ContentDir)
	}
	if corpus.ManifestsDir != "/repo/apps/ayokoding-www/src/features/course-paths/manifests" {
		t.Fatalf("manifests root = %q, want the real ayokoding-www manifests root", corpus.ManifestsDir)
	}
}

func TestResolveCorpusPrefersTheMovedContentCandidate(t *testing.T) {
	trees := corpusRepo()
	trees["/repo"] = fstest.MapFS{
		"repo-config.yml": seedFile("# marker\n"),
		"apps/ayokoding-web/content/en/learn/courses/just-enough-python/learning/beginner.md": seedFile("---\ntitle: Beginner\n---\n"),
		"apps/ayokoding-www/content/en/learn/courses/just-enough-python/learning/beginner.md": seedFile("---\ntitle: Beginner\n---\n"),
		"apps/ayokoding-web/manifests/careers/backend.json":                                   seedFile("{}"),
	}
	corpus, err := web.ResolveCorpus(repoSources("/repo/apps/ayokoding-web", nil, trees))
	if err != nil {
		t.Fatalf("ResolveCorpus: %v", err)
	}
	if corpus.ContentDir != "/repo/apps/ayokoding-web/content" {
		t.Fatalf("content root = %q, want the first candidate", corpus.ContentDir)
	}
}

func TestResolveCorpusRefusesAWorkingDirectoryOutsideARepository(t *testing.T) {
	if _, err := web.ResolveCorpus(repoSources("/elsewhere", nil, corpusRepo())); err == nil {
		t.Fatal("a working directory with no repo-config.yml above it must refuse the default corpus")
	}
}

func TestResolveCorpusRefusesAnUnreadableNamedRoot(t *testing.T) {
	env := map[string]string{"AYOKODING_WEB_CONTENT_DIR": "/missing-root"}
	_, err := web.ResolveCorpus(repoSources("/repo/apps/ayokoding-web", env, corpusRepo()))
	if err == nil {
		t.Fatal("an unreadable AYOKODING_WEB_CONTENT_DIR must refuse startup")
	}
	if got := err.Error(); !strings.Contains(got, "AYOKODING_WEB_CONTENT_DIR") {
		t.Fatalf("diagnostic %q must name AYOKODING_WEB_CONTENT_DIR", got)
	}
}

func TestSeedDepsDefaultServesTheRealCorpus(t *testing.T) {
	cfg, err := web.ResolveConfig(nil, noLauncher)
	if err != nil {
		t.Fatalf("ResolveConfig: %v", err)
	}
	deps, err := web.SeedDeps(cfg, repoSources("/repo/apps/ayokoding-web", nil, corpusRepo()))
	if err != nil {
		t.Fatalf("SeedDeps: %v", err)
	}
	if _, ok := deps.Content.Find("en", "just-enough-python", "beginner"); !ok {
		t.Fatal("the default start must serve the real lesson just-enough-python/beginner")
	}
	if _, ok := deps.Content.Find("en", "go-basics", "hello-world"); ok {
		t.Fatal("the default start must not serve the fixture-only lesson go-basics/hello-world")
	}
}

func TestSeedDepsStopsStartupOnAnUnreadableDefaultRoot(t *testing.T) {
	trees := map[string]fs.FS{"/repo": fstest.MapFS{"repo-config.yml": seedFile("# marker\n")}}
	cfg, err := web.ResolveConfig(nil, noLauncher)
	if err != nil {
		t.Fatalf("ResolveConfig: %v", err)
	}
	if _, err := web.SeedDeps(cfg, repoSources("/repo/apps/ayokoding-web", nil, trees)); err == nil {
		t.Fatal("a repository with no readable corpus root must stop startup")
	}
}

func TestSeedDepsFixtureSelectionServesTheCannedCorpus(t *testing.T) {
	cfg, err := web.ResolveConfig([]string{"--fixture", "parity"}, noLauncher)
	if err != nil {
		t.Fatalf("ResolveConfig: %v", err)
	}
	deps, err := web.SeedDeps(cfg, repoSources("/repo/apps/ayokoding-web", nil, corpusRepo()))
	if err != nil {
		t.Fatalf("SeedDeps: %v", err)
	}
	if _, ok := deps.Content.Find("en", "go-basics", "hello-world"); !ok {
		t.Fatal("a selected parity fixture must serve the canned lesson go-basics/hello-world")
	}
}
