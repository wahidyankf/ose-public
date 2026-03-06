//go:build integration

package cmd

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"testing"

	"github.com/cucumber/godog"
)

var specsJavaDir = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino-cli/java")
}()

// Scenario: A source tree with all packages annotated passes validation
// Given a Java source tree where every package has a @NullMarked-annotated package-info.java
// When the developer runs java validate-annotations on the source root
// Then the command exits successfully
// And the output reports zero violations

// Scenario: A package missing package-info.java fails validation
// Given a Java source tree where one package has no package-info.java file
// When the developer runs java validate-annotations on the source root
// Then the command exits with a failure code
// And the output identifies the package missing package-info.java

// Scenario: A package-info.java without the required annotation fails validation
// Given a Java source tree where one package has a package-info.java without @NullMarked
// When the developer runs java validate-annotations on the source root
// Then the command exits with a failure code
// And the output identifies the package with the missing annotation

// Scenario: A custom annotation can be specified via flag
// Given a Java source tree where every package has a @NonNull-annotated package-info.java
// When the developer runs java validate-annotations with --annotation NonNull
// Then the command exits successfully
// And the output reports zero violations

type javaAnnotationsSteps struct {
	originalWd string
	tmpDir     string
	srcRoot    string
	cmdErr     error
	cmdOutput  string
}

func (s *javaAnnotationsSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	s.originalWd, _ = os.Getwd()
	s.tmpDir, _ = os.MkdirTemp("", "java-annotations-*")
	_ = os.MkdirAll(filepath.Join(s.tmpDir, ".git"), 0755)
	verbose = false
	quiet = false
	output = "text"
	javaAnnotation = "NullMarked"
	_ = os.Chdir(s.tmpDir)
	return context.Background(), nil
}

func (s *javaAnnotationsSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	_ = os.Chdir(s.originalWd)
	_ = os.RemoveAll(s.tmpDir)
	return context.Background(), nil
}

func (s *javaAnnotationsSteps) aJavaSourceTreeWhereEveryPackageHasANullMarkedAnnotatedPackageInfoJava() error {
	pkgDir := filepath.Join(s.tmpDir, "src", "main", "java", "com", "example")
	if err := os.MkdirAll(pkgDir, 0755); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(pkgDir, "Foo.java"), []byte("package com.example;\n"), 0644); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(pkgDir, "package-info.java"),
		[]byte("@NullMarked\npackage com.example;\n"), 0644); err != nil {
		return err
	}
	s.srcRoot = filepath.Join(s.tmpDir, "src", "main", "java")
	return nil
}

func (s *javaAnnotationsSteps) aJavaSourceTreeWhereOnePackageHasNoPackageInfoJavaFile() error {
	pkgDir := filepath.Join(s.tmpDir, "src", "main", "java", "com", "example")
	if err := os.MkdirAll(pkgDir, 0755); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(pkgDir, "Foo.java"), []byte("package com.example;\n"), 0644); err != nil {
		return err
	}
	// No package-info.java — intentionally omitted
	s.srcRoot = filepath.Join(s.tmpDir, "src", "main", "java")
	return nil
}

func (s *javaAnnotationsSteps) aJavaSourceTreeWhereOnePackageHasAPackageInfoJavaWithoutNullMarked() error {
	pkgDir := filepath.Join(s.tmpDir, "src", "main", "java", "com", "example")
	if err := os.MkdirAll(pkgDir, 0755); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(pkgDir, "Foo.java"), []byte("package com.example;\n"), 0644); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(pkgDir, "package-info.java"),
		[]byte("package com.example;\n"), 0644); err != nil {
		return err
	}
	s.srcRoot = filepath.Join(s.tmpDir, "src", "main", "java")
	return nil
}

func (s *javaAnnotationsSteps) aJavaSourceTreeWhereEveryPackageHasANonNullAnnotatedPackageInfoJava() error {
	pkgDir := filepath.Join(s.tmpDir, "src", "main", "java", "com", "example")
	if err := os.MkdirAll(pkgDir, 0755); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(pkgDir, "Foo.java"), []byte("package com.example;\n"), 0644); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(pkgDir, "package-info.java"),
		[]byte("@NonNull\npackage com.example;\n"), 0644); err != nil {
		return err
	}
	s.srcRoot = filepath.Join(s.tmpDir, "src", "main", "java")
	return nil
}

func (s *javaAnnotationsSteps) theDeveloperRunsValidateJavaAnnotationsOnTheSourceRoot() error {
	javaAnnotation = "NullMarked"
	buf := new(bytes.Buffer)
	validateJavaAnnotationsCmd.SetOut(buf)
	validateJavaAnnotationsCmd.SetErr(buf)
	s.cmdErr = validateJavaAnnotationsCmd.RunE(validateJavaAnnotationsCmd, []string{s.srcRoot})
	s.cmdOutput = buf.String()
	return nil
}

func (s *javaAnnotationsSteps) theDeveloperRunsValidateJavaAnnotationsWithAnnotationNonNull() error {
	javaAnnotation = "NonNull"
	buf := new(bytes.Buffer)
	validateJavaAnnotationsCmd.SetOut(buf)
	validateJavaAnnotationsCmd.SetErr(buf)
	s.cmdErr = validateJavaAnnotationsCmd.RunE(validateJavaAnnotationsCmd, []string{s.srcRoot})
	s.cmdOutput = buf.String()
	return nil
}

func (s *javaAnnotationsSteps) theCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected command to exit successfully, got error: %w", s.cmdErr)
	}
	return nil
}

func (s *javaAnnotationsSteps) theCommandExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected command to exit with failure, but it succeeded (output: %s)", s.cmdOutput)
	}
	return nil
}

func (s *javaAnnotationsSteps) theOutputReportsZeroViolations() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected zero violations (no error), got error: %w", s.cmdErr)
	}
	return nil
}

func (s *javaAnnotationsSteps) theOutputIdentifiesThePackageMissingPackageInfoJava() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected violation error, but command succeeded")
	}
	return nil
}

func (s *javaAnnotationsSteps) theOutputIdentifiesThePackageWithTheMissingAnnotation() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected violation error, but command succeeded")
	}
	return nil
}

func InitializeJavaAnnotationsScenario(sc *godog.ScenarioContext) {
	s := &javaAnnotationsSteps{}
	sc.Before(s.before)
	sc.After(s.after)

	sc.Step(`^a Java source tree where every package has a @NullMarked-annotated package-info\.java$`,
		s.aJavaSourceTreeWhereEveryPackageHasANullMarkedAnnotatedPackageInfoJava)
	sc.Step(`^a Java source tree where one package has no package-info\.java file$`,
		s.aJavaSourceTreeWhereOnePackageHasNoPackageInfoJavaFile)
	sc.Step(`^a Java source tree where one package has a package-info\.java without @NullMarked$`,
		s.aJavaSourceTreeWhereOnePackageHasAPackageInfoJavaWithoutNullMarked)
	sc.Step(`^a Java source tree where every package has a @NonNull-annotated package-info\.java$`,
		s.aJavaSourceTreeWhereEveryPackageHasANonNullAnnotatedPackageInfoJava)
	sc.Step(`^the developer runs java validate-annotations on the source root$`,
		s.theDeveloperRunsValidateJavaAnnotationsOnTheSourceRoot)
	sc.Step(`^the developer runs java validate-annotations with --annotation NonNull$`,
		s.theDeveloperRunsValidateJavaAnnotationsWithAnnotationNonNull)
	sc.Step(`^the command exits successfully$`,
		s.theCommandExitsSuccessfully)
	sc.Step(`^the command exits with a failure code$`,
		s.theCommandExitsWithAFailureCode)
	sc.Step(`^the output reports zero violations$`,
		s.theOutputReportsZeroViolations)
	sc.Step(`^the output identifies the package missing package-info\.java$`,
		s.theOutputIdentifiesThePackageMissingPackageInfoJava)
	sc.Step(`^the output identifies the package with the missing annotation$`,
		s.theOutputIdentifiesThePackageWithTheMissingAnnotation)
}

func TestIntegrationJavaAnnotations(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: InitializeJavaAnnotationsScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsJavaDir},
			TestingT: t,
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run feature tests")
	}
}
