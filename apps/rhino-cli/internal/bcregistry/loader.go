package bcregistry

import (
	"fmt"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

// osReadFileFn is injectable for unit tests.
var osReadFileFn = func(path string) ([]byte, error) { return os.ReadFile(path) } //nolint:gosec

// Load reads and parses the bounded-context registry at
// specs/apps/<app>/bounded-contexts.yaml relative to repoRoot.
func Load(repoRoot, app string) (*Registry, error) {
	path := filepath.Join(repoRoot, "specs", "apps", app, "bounded-contexts.yaml")
	data, err := osReadFileFn(path)
	if err != nil {
		return nil, fmt.Errorf("registry not found for app %q at %s: %w", app, path, err)
	}
	var reg Registry
	if err := yaml.Unmarshal(data, &reg); err != nil {
		return nil, fmt.Errorf("failed to parse registry for app %q: %w", app, err)
	}
	return &reg, nil
}
