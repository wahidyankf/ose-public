//go:build integration

package architecture

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// ProductionFiles walks the production roots and returns every non-test Go
// file with its module-relative virtual path. It reads the real tree, so it
// belongs to the integration level.
func ProductionFiles(root string) (map[string]string, error) {
	files := map[string]string{}
	for _, dir := range []string{"cmd", "internal"} {
		walkErr := filepath.Walk(filepath.Join(root, dir), func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return fmt.Errorf("architecture: walk production tree: %w", err)
			}
			if info.IsDir() || !strings.HasSuffix(path, ".go") || strings.HasSuffix(path, "_test.go") {
				return nil
			}
			virtual, relErr := filepath.Rel(root, path)
			if relErr != nil {
				return fmt.Errorf("architecture: relativize production path: %w", relErr)
			}
			files[filepath.ToSlash(virtual)] = path
			return nil
		})
		if walkErr != nil {
			return nil, fmt.Errorf("architecture: walk production tree: %w", walkErr)
		}
	}
	return files, nil
}
