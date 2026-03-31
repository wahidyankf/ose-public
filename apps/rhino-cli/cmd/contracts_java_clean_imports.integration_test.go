//go:build integration

package cmd

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/cucumber/godog"
)

var specsContractsDir = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino-cli/cli/gherkin")
}()

type javaCleanImportsSteps struct {
	tmpDir      string
	srcDir      string
	cmdErr      error
	cmdOutput   string
	originalWd  string
	fileContent string // original content for unchanged check
}

func (s *javaCleanImportsSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	s.originalWd, _ = os.Getwd()
	s.tmpDir, _ = os.MkdirTemp("", "java-clean-imports-*")
	_ = os.MkdirAll(filepath.Join(s.tmpDir, ".git"), 0755)
	verbose = false
	quiet = false
	output = "text"
	_ = os.Chdir(s.tmpDir)
	return context.Background(), nil
}

func (s *javaCleanImportsSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	_ = os.Chdir(s.originalWd)
	_ = os.RemoveAll(s.tmpDir)
	return context.Background(), nil
}

func (s *javaCleanImportsSteps) aGeneratedContractsDirWithUnusedImports() error {
	s.srcDir = filepath.Join(s.tmpDir, "generated-contracts")
	if err := os.MkdirAll(s.srcDir, 0755); err != nil {
		return err
	}
	content := "package com.example;\n\nimport com.other.UsedClass;\nimport com.other.UnusedClass;\n\npublic class Foo {\n    UsedClass x;\n}\n"
	return os.WriteFile(filepath.Join(s.srcDir, "Foo.java"), []byte(content), 0644)
}

func (s *javaCleanImportsSteps) aGeneratedContractsDirWithSamePackageImports() error {
	s.srcDir = filepath.Join(s.tmpDir, "generated-contracts")
	if err := os.MkdirAll(s.srcDir, 0755); err != nil {
		return err
	}
	content := "package com.example;\n\nimport com.example.Bar;\n\npublic class Foo {\n    Bar x;\n}\n"
	return os.WriteFile(filepath.Join(s.srcDir, "Foo.java"), []byte(content), 0644)
}

func (s *javaCleanImportsSteps) aGeneratedContractsDirWithDuplicateImports() error {
	s.srcDir = filepath.Join(s.tmpDir, "generated-contracts")
	if err := os.MkdirAll(s.srcDir, 0755); err != nil {
		return err
	}
	content := "package com.example;\n\nimport com.other.UsedClass;\nimport com.other.UsedClass;\n\npublic class Foo {\n    UsedClass x;\n}\n"
	return os.WriteFile(filepath.Join(s.srcDir, "Foo.java"), []byte(content), 0644)
}

func (s *javaCleanImportsSteps) aGeneratedContractsDirWithOnlyRequiredImports() error {
	s.srcDir = filepath.Join(s.tmpDir, "generated-contracts")
	if err := os.MkdirAll(s.srcDir, 0755); err != nil {
		return err
	}
	content := "package com.example;\n\nimport com.other.UsedClass;\n\npublic class Foo {\n    UsedClass x;\n}\n"
	if err := os.WriteFile(filepath.Join(s.srcDir, "Foo.java"), []byte(content), 0644); err != nil {
		return err
	}
	s.fileContent = content
	return nil
}

func (s *javaCleanImportsSteps) anEmptyGeneratedContractsDirectory() error {
	s.srcDir = filepath.Join(s.tmpDir, "generated-contracts")
	return os.MkdirAll(s.srcDir, 0755)
}

func (s *javaCleanImportsSteps) theDeveloperRunsContractsJavaCleanImports() error {
	buf := new(bytes.Buffer)
	contractsJavaCleanImportsCmd.SetOut(buf)
	contractsJavaCleanImportsCmd.SetErr(buf)
	s.cmdErr = contractsJavaCleanImportsCmd.RunE(contractsJavaCleanImportsCmd, []string{s.srcDir})
	s.cmdOutput = buf.String()
	return nil
}

func (s *javaCleanImportsSteps) theCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected command to exit successfully, got error: %w", s.cmdErr)
	}
	return nil
}

func (s *javaCleanImportsSteps) unusedImportsAreRemovedFromJavaFiles() error {
	data, err := os.ReadFile(filepath.Join(s.srcDir, "Foo.java"))
	if err != nil {
		return fmt.Errorf("reading Foo.java: %w", err)
	}
	if strings.Contains(string(data), "UnusedClass") {
		return fmt.Errorf("expected UnusedClass import to be removed, but it is still present")
	}
	return nil
}

func (s *javaCleanImportsSteps) samePackageImportsAreRemovedFromJavaFiles() error {
	data, err := os.ReadFile(filepath.Join(s.srcDir, "Foo.java"))
	if err != nil {
		return fmt.Errorf("reading Foo.java: %w", err)
	}
	if strings.Contains(string(data), "import com.example.Bar;") {
		return fmt.Errorf("expected same-package import to be removed, but it is still present")
	}
	return nil
}

func (s *javaCleanImportsSteps) onlyOneCopyOfEachImportRemains() error {
	data, err := os.ReadFile(filepath.Join(s.srcDir, "Foo.java"))
	if err != nil {
		return fmt.Errorf("reading Foo.java: %w", err)
	}
	content := string(data)
	firstIdx := strings.Index(content, "import com.other.UsedClass;")
	lastIdx := strings.LastIndex(content, "import com.other.UsedClass;")
	if firstIdx != lastIdx {
		return fmt.Errorf("expected exactly one copy of import, but found duplicates")
	}
	return nil
}

func (s *javaCleanImportsSteps) theJavaFilesAreUnchanged() error {
	data, err := os.ReadFile(filepath.Join(s.srcDir, "Foo.java"))
	if err != nil {
		return fmt.Errorf("reading Foo.java: %w", err)
	}
	if string(data) != s.fileContent {
		return fmt.Errorf("expected file to be unchanged, but content differs:\ngot: %s\nwant: %s",
			string(data), s.fileContent)
	}
	return nil
}

func (s *javaCleanImportsSteps) theCommandReportsNoFilesModified() error {
	if strings.Contains(s.cmdOutput, "modified:") {
		return fmt.Errorf("expected no files modified in output, but found 'modified:' in: %s", s.cmdOutput)
	}
	return nil
}

func InitializeJavaCleanImportsScenario(sc *godog.ScenarioContext) {
	s := &javaCleanImportsSteps{}
	sc.Before(s.before)
	sc.After(s.after)

	sc.Step(`^a generated-contracts directory with Java files containing unused imports$`,
		s.aGeneratedContractsDirWithUnusedImports)
	sc.Step(`^a generated-contracts directory with Java files containing same-package imports$`,
		s.aGeneratedContractsDirWithSamePackageImports)
	sc.Step(`^a generated-contracts directory with Java files containing duplicate imports$`,
		s.aGeneratedContractsDirWithDuplicateImports)
	sc.Step(`^a generated-contracts directory with Java files having only required imports$`,
		s.aGeneratedContractsDirWithOnlyRequiredImports)
	sc.Step(`^an empty generated-contracts directory$`,
		s.anEmptyGeneratedContractsDirectory)
	sc.Step(`^the developer runs contracts java-clean-imports on the directory$`,
		s.theDeveloperRunsContractsJavaCleanImports)
	sc.Step(`^the command exits successfully$`,
		s.theCommandExitsSuccessfully)
	sc.Step(`^unused imports are removed from the Java files$`,
		s.unusedImportsAreRemovedFromJavaFiles)
	sc.Step(`^same-package imports are removed from the Java files$`,
		s.samePackageImportsAreRemovedFromJavaFiles)
	sc.Step(`^only one copy of each import remains$`,
		s.onlyOneCopyOfEachImportRemains)
	sc.Step(`^the Java files are unchanged$`,
		s.theJavaFilesAreUnchanged)
	sc.Step(`^the command reports no files modified$`,
		s.theCommandReportsNoFilesModified)
}

func TestIntegrationContractsJavaCleanImports(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: InitializeJavaCleanImportsScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsContractsDir},
			TestingT: t,
			Tags:     "@contracts-java-clean-imports",
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run feature tests")
	}
}
