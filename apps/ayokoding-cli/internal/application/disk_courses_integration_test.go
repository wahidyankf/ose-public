//go:build integration

package application_test

import (
	"io/fs"
	"os"
	"path/filepath"
	"testing"
)

// writeDiskCourse materializes course files under a temporary directory
// for the record tests, which need a writable content root. Content reads
// go through the directory filesystem so permission failures stay
// observable.
func writeDiskCourse(t *testing.T, files map[string]string) (fs.FS, string) {
	t.Helper()
	root := t.TempDir()
	for name, body := range files {
		path := filepath.Join(root, filepath.FromSlash(name))
		if err := os.MkdirAll(filepath.Dir(path), 0o750); err != nil {
			t.Fatalf("mkdir %q: %v", path, err)
		}
		if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
			t.Fatalf("write %q: %v", path, err)
		}
	}
	return os.DirFS(root), root
}

// chmodCourse changes one fixture file mode for the permission tests.
func chmodCourse(t *testing.T, root, name string, mode os.FileMode) {
	t.Helper()
	if err := os.Chmod(filepath.Join(root, filepath.FromSlash(name)), mode); err != nil {
		t.Fatalf("chmod %q: %v", name, err)
	}
}
