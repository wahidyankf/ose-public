package cmd

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// makeJavaSourceRoot creates a temp directory with Java package fixtures.
// Returns (sourceRoot, validPkgDir, invalidPkgDir).
func makeJavaSourceRoot(t *testing.T) string {
	t.Helper()
	src := t.TempDir()

	// Valid package: has package-info.java with @NullMarked
	validPkg := filepath.Join(src, "com", "example")
	if err := os.MkdirAll(validPkg, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(validPkg, "Foo.java"), []byte("class Foo {}"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(validPkg, "package-info.java"),
		[]byte("@NullMarked\npackage com.example;"), 0644); err != nil {
		t.Fatal(err)
	}

	// Invalid package: missing package-info.java
	invalidPkg := filepath.Join(src, "com", "example", "service")
	if err := os.MkdirAll(invalidPkg, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(invalidPkg, "Bar.java"), []byte("class Bar {}"), 0644); err != nil {
		t.Fatal(err)
	}

	return src
}

func TestValidateJavaAnnotationsCmd_NoArgs(t *testing.T) {
	// Cobra's ExactArgs(1) is enforced before RunE; test the Args validator directly.
	err := validateJavaAnnotationsCmd.Args(validateJavaAnnotationsCmd, []string{})
	if err == nil {
		t.Error("expected error when no args provided")
	}
}

func TestValidateJavaAnnotationsCmd_ValidSourceRoot_NoViolations(t *testing.T) {
	src := t.TempDir()

	// Single valid package
	pkgDir := filepath.Join(src, "com", "example")
	if err := os.MkdirAll(pkgDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(pkgDir, "Foo.java"), []byte("class Foo {}"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(pkgDir, "package-info.java"),
		[]byte("@NullMarked\npackage com.example;"), 0644); err != nil {
		t.Fatal(err)
	}

	cmd := validateJavaAnnotationsCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	// Reset flags
	javaAnnotation = "NullMarked"
	output = "text"
	verbose = false
	quiet = false

	err := cmd.RunE(cmd, []string{src})
	if err != nil {
		t.Errorf("expected no error for valid source root, got: %v", err)
	}

	got := buf.String()
	if !strings.Contains(got, "0 violations found") {
		t.Errorf("expected '0 violations found' in output, got: %s", got)
	}
}

func TestValidateJavaAnnotationsCmd_WithViolations(t *testing.T) {
	src := makeJavaSourceRoot(t)

	cmd := validateJavaAnnotationsCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	javaAnnotation = "NullMarked"
	output = "text"
	verbose = false
	quiet = false

	err := cmd.RunE(cmd, []string{src})
	if err == nil {
		t.Error("expected error when violations found")
	}

	got := buf.String()
	if !strings.Contains(got, "✗") {
		t.Errorf("expected ✗ marker in output, got: %s", got)
	}
	if !strings.Contains(got, "violation") {
		t.Errorf("expected violation count in output, got: %s", got)
	}
}

func TestValidateJavaAnnotationsCmd_JSONOutput(t *testing.T) {
	src := makeJavaSourceRoot(t)

	cmd := validateJavaAnnotationsCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	javaAnnotation = "NullMarked"
	output = "json"
	verbose = false
	quiet = false

	_ = cmd.RunE(cmd, []string{src})

	got := buf.String()
	if !strings.Contains(got, `"status"`) {
		t.Errorf("expected 'status' field in JSON output, got: %s", got)
	}
	if !strings.Contains(got, `"total_packages"`) {
		t.Errorf("expected 'total_packages' field in JSON output, got: %s", got)
	}
	if !strings.Contains(got, `"violations"`) {
		t.Errorf("expected 'violations' field in JSON output, got: %s", got)
	}
}

func TestValidateJavaAnnotationsCmd_MarkdownOutput(t *testing.T) {
	src := makeJavaSourceRoot(t)

	cmd := validateJavaAnnotationsCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	javaAnnotation = "NullMarked"
	output = "markdown"
	verbose = false
	quiet = false

	_ = cmd.RunE(cmd, []string{src})

	got := buf.String()
	if !strings.Contains(got, "# Java Null Safety Validation Report") {
		t.Errorf("expected markdown heading in output, got: %s", got)
	}
}

func TestValidateJavaAnnotationsCmd_QuietMode(t *testing.T) {
	src := t.TempDir()

	// Single valid package
	pkgDir := filepath.Join(src, "com", "example")
	if err := os.MkdirAll(pkgDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(pkgDir, "Foo.java"), []byte("class Foo {}"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(pkgDir, "package-info.java"),
		[]byte("@NullMarked\npackage com.example;"), 0644); err != nil {
		t.Fatal(err)
	}

	cmd := validateJavaAnnotationsCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	javaAnnotation = "NullMarked"
	output = "text"
	verbose = false
	quiet = true

	err := cmd.RunE(cmd, []string{src})
	if err != nil {
		t.Errorf("expected no error, got: %v", err)
	}

	got := buf.String()
	if strings.Contains(got, "0 violations found") {
		t.Error("quiet mode should suppress '0 violations found' message")
	}
}

func TestValidateJavaAnnotationsCmd_AnnotationFlag(t *testing.T) {
	src := t.TempDir()

	// Package with @NonNull annotation (not @NullMarked)
	pkgDir := filepath.Join(src, "com", "example")
	if err := os.MkdirAll(pkgDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(pkgDir, "Foo.java"), []byte("class Foo {}"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(pkgDir, "package-info.java"),
		[]byte("@NonNull\npackage com.example;"), 0644); err != nil {
		t.Fatal(err)
	}

	cmd := validateJavaAnnotationsCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	// Use @NonNull annotation — should pass
	javaAnnotation = "NonNull"
	output = "text"
	verbose = false
	quiet = false

	err := cmd.RunE(cmd, []string{src})
	if err != nil {
		t.Errorf("expected no error with --annotation NonNull, got: %v", err)
	}

	got := buf.String()
	if !strings.Contains(got, "0 violations found") {
		t.Errorf("expected '0 violations found' for custom annotation, got: %s", got)
	}
}

func TestValidateJavaAnnotationsCmd_EmptySourceRoot(t *testing.T) {
	src := t.TempDir() // No Java files

	cmd := validateJavaAnnotationsCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	javaAnnotation = "NullMarked"
	output = "text"
	verbose = false
	quiet = false

	err := cmd.RunE(cmd, []string{src})
	if err != nil {
		t.Errorf("expected no error for empty source root, got: %v", err)
	}
}

func TestValidateJavaAnnotationsCmd_VerboseMode(t *testing.T) {
	src := t.TempDir()

	pkgDir := filepath.Join(src, "com", "example")
	if err := os.MkdirAll(pkgDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(pkgDir, "Foo.java"), []byte("class Foo {}"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(pkgDir, "package-info.java"),
		[]byte("@NullMarked\npackage com.example;"), 0644); err != nil {
		t.Fatal(err)
	}

	cmd := validateJavaAnnotationsCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	javaAnnotation = "NullMarked"
	output = "text"
	verbose = true
	quiet = false

	err := cmd.RunE(cmd, []string{src})
	if err != nil {
		t.Errorf("expected no error, got: %v", err)
	}

	got := buf.String()
	if !strings.Contains(got, "✓") {
		t.Errorf("expected ✓ marker for valid package in verbose mode, got: %s", got)
	}
}
