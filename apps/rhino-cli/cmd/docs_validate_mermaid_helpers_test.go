package cmd

import (
	"os"
	"path/filepath"
	"testing"
)

func TestFilterMDPaths_KeepsMDOnly(t *testing.T) {
	paths := []string{"docs/a.md", "src/main.go", "README.md", "", "notes.txt"}
	result := filterMDPaths("/repo", paths)
	if len(result) != 2 {
		t.Errorf("expected 2 md files, got %d: %v", len(result), result)
	}
	for _, p := range result {
		if filepath.Ext(p) != ".md" {
			t.Errorf("non-md file in result: %s", p)
		}
	}
}

func TestFilterMDPaths_AbsolutePaths(t *testing.T) {
	paths := []string{"subdir/file.md"}
	result := filterMDPaths("/root", paths)
	if len(result) != 1 || result[0] != "/root/subdir/file.md" {
		t.Errorf("expected absolute path, got: %v", result)
	}
}

func TestWalkMDFiles_FindsMDFiles(t *testing.T) {
	dir := t.TempDir()
	// Create a few files.
	if err := os.WriteFile(filepath.Join(dir, "a.md"), []byte("# hello"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "b.go"), []byte("package x"), 0o600); err != nil {
		t.Fatal(err)
	}
	sub := filepath.Join(dir, "sub")
	if err := os.MkdirAll(sub, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(sub, "c.md"), []byte("# sub"), 0o600); err != nil {
		t.Fatal(err)
	}

	files, err := walkMDFiles(dir)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(files) != 2 {
		t.Errorf("expected 2 md files, got %d: %v", len(files), files)
	}
}

func TestWalkMDFiles_NonexistentDir(t *testing.T) {
	// walkMDFiles tolerates nonexistent dirs (walk function suppresses errors).
	files, err := walkMDFiles("/nonexistent-dir-xyz")
	if err != nil {
		t.Errorf("expected nil error for nonexistent dir (tolerant design), got: %v", err)
	}
	if len(files) != 0 {
		t.Errorf("expected empty result for nonexistent dir, got: %v", files)
	}
}

func TestWalkMDFiles_SkipsBuildArtifactDirs(t *testing.T) {
	dir := t.TempDir()
	// md file at root — should be found
	if err := os.WriteFile(filepath.Join(dir, "root.md"), []byte("# root"), 0o600); err != nil {
		t.Fatal(err)
	}
	// .next dir — should be skipped entirely
	nextDir := filepath.Join(dir, ".next")
	if err := os.MkdirAll(nextDir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(nextDir, "build.md"), []byte("# build"), 0o600); err != nil {
		t.Fatal(err)
	}
	// node_modules dir — should be skipped entirely
	nmDir := filepath.Join(dir, "node_modules")
	if err := os.MkdirAll(nmDir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(nmDir, "pkg.md"), []byte("# pkg"), 0o600); err != nil {
		t.Fatal(err)
	}

	files, err := walkMDFiles(dir)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(files) != 1 {
		t.Errorf("expected only root.md (skip dirs excluded), got %d: %v", len(files), files)
	}
}

func TestCollectMDFiles_WithAbsPath(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "x.md"), []byte("# x"), 0o600); err != nil {
		t.Fatal(err)
	}
	files, err := collectMDFiles("/repo", []string{dir})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(files) != 1 {
		t.Errorf("expected 1 file, got %d", len(files))
	}
}

func TestCollectMDFiles_WithRelPath(t *testing.T) {
	// A non-existent relative path returns empty (tolerant walk).
	files, err := collectMDFiles("/nonexistent-repo", []string{"docs"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(files) != 0 {
		t.Errorf("expected empty result for nonexistent path, got: %v", files)
	}
}

func TestCollectMDDefaultDirs_ReturnsNoErrorOnMissingDirs(t *testing.T) {
	// Using a temp dir that has none of the default subdirectories.
	dir := t.TempDir()
	files, err := collectMDDefaultDirs(dir)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// No docs/, governance/, .claude/ subdirs and no root *.md → empty result.
	if len(files) != 0 {
		t.Errorf("expected 0 files, got %d", len(files))
	}
}

func TestRunValidateMermaid_WithPositionalArgs(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "clean.md"), []byte("# no mermaid\n"), 0o600); err != nil {
		t.Fatal(err)
	}

	origGetwd := osGetwd
	origStat := osStat
	origReadFile := readFileFn
	defer func() {
		osGetwd = origGetwd
		osStat = origStat
		readFileFn = origReadFile
		validateMermaidStagedOnly = false
		validateMermaidChangedOnly = false
		validateMermaidMaxLabelLen = 30
		validateMermaidMaxWidth = 3
		validateMermaidMaxDepth = 5
		output = "text"
		verbose = false
		quiet = false
	}()

	osGetwd = func() (string, error) { return dir, nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == filepath.Join(dir, ".git") {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}
	readFileFn = os.ReadFile

	validateMermaidStagedOnly = false
	validateMermaidChangedOnly = false
	output = "text"
	verbose = false
	quiet = false

	buf := &writableBuffer{}
	validateMermaidCmd.SetOut(buf)
	validateMermaidCmd.SetErr(buf)

	err := validateMermaidCmd.RunE(validateMermaidCmd, []string{filepath.Join(dir, "clean.md")})
	if err != nil {
		t.Errorf("expected success for clean file, got: %v", err)
	}
}

// writableBuffer is a bytes.Buffer that implements io.Writer for use with cobra.
type writableBuffer struct {
	data []byte
}

func (b *writableBuffer) Write(p []byte) (int, error) {
	b.data = append(b.data, p...)
	return len(p), nil
}

func (b *writableBuffer) String() string {
	return string(b.data)
}
