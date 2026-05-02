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
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/naming"
)

var specsDirUnitValidateNaming = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino/cli/gherkin")
}()

type validateAgentsNamingUnitSteps struct {
	cmdErr    error
	cmdOutput string
}

func (s *validateAgentsNamingUnitSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	verbose = false
	quiet = false
	output = "text"
	s.cmdErr = nil
	s.cmdOutput = ""

	// Mock findGitRoot to always succeed.
	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}

	// Default: all compliant.
	agentsValidateNamingFn = func(_ string) ([]naming.Violation, error) {
		return nil, nil
	}
	return context.Background(), nil
}

func (s *validateAgentsNamingUnitSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	agentsValidateNamingFn = agentsValidateNaming
	osGetwd = os.Getwd
	osStat = os.Stat
	return context.Background(), nil
}

func (s *validateAgentsNamingUnitSteps) treeAllConform() error {
	agentsValidateNamingFn = func(_ string) ([]naming.Violation, error) { return nil, nil }
	return nil
}

func (s *validateAgentsNamingUnitSteps) treeUnknownSuffix() error {
	agentsValidateNamingFn = func(_ string) ([]naming.Violation, error) {
		return []naming.Violation{{
			Path:    "/mock-repo/.claude/agents/web-researcher.md",
			Kind:    "role-suffix",
			Message: `filename "web-researcher" does not end with any allowed suffix (maker, checker, fixer, dev, deployer, manager)`,
		}}, nil
	}
	return nil
}

func (s *validateAgentsNamingUnitSteps) treeFrontmatterMismatch() error {
	agentsValidateNamingFn = func(_ string) ([]naming.Violation, error) {
		return []naming.Violation{{
			Path:    "/mock-repo/.claude/agents/plan-maker.md",
			Kind:    "frontmatter-mismatch",
			Message: `frontmatter name "something-else" does not match filename "plan-maker"`,
		}}, nil
	}
	return nil
}

func (s *validateAgentsNamingUnitSteps) treeMirrorDrift() error {
	agentsValidateNamingFn = func(_ string) ([]naming.Violation, error) {
		return []naming.Violation{{
			Path:    "/mock-repo/.claude/agents/orphan-maker.md",
			Kind:    "mirror-drift",
			Message: "orphan-maker.md exists in .claude/agents/ but not in .opencode/agents/",
		}}, nil
	}
	return nil
}

func (s *validateAgentsNamingUnitSteps) run() error {
	buf := new(bytes.Buffer)
	agentsValidateNamingCmd.SetOut(buf)
	agentsValidateNamingCmd.SetErr(buf)
	s.cmdErr = agentsValidateNamingCmd.RunE(agentsValidateNamingCmd, []string{})
	s.cmdOutput = buf.String()
	return nil
}

func (s *validateAgentsNamingUnitSteps) exitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *validateAgentsNamingUnitSteps) exitsWithFailure() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected failure but succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateAgentsNamingUnitSteps) zeroViolations() error {
	if !strings.Contains(s.cmdOutput, "VALIDATION PASSED") {
		return fmt.Errorf("expected VALIDATION PASSED, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateAgentsNamingUnitSteps) identifiesUnknownSuffix() error {
	lc := strings.ToLower(s.cmdOutput)
	if !strings.Contains(lc, "role-suffix") || !strings.Contains(lc, "web-researcher") {
		return fmt.Errorf("expected role-suffix + offending filename, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateAgentsNamingUnitSteps) identifiesFrontmatterMismatch() error {
	lc := strings.ToLower(s.cmdOutput)
	if !strings.Contains(lc, "frontmatter-mismatch") {
		return fmt.Errorf("expected frontmatter-mismatch, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateAgentsNamingUnitSteps) identifiesMirrorDrift() error {
	lc := strings.ToLower(s.cmdOutput)
	if !strings.Contains(lc, "mirror-drift") {
		return fmt.Errorf("expected mirror-drift, got: %s", s.cmdOutput)
	}
	return nil
}

func TestUnitValidateAgentsNaming(t *testing.T) {
	s := &validateAgentsNamingUnitSteps{}
	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Before(s.before)
			sc.After(s.after)
			sc.Step(stepAgentsTreeAllConform, s.treeAllConform)
			sc.Step(stepAgentsTreeUnknownSuffix, s.treeUnknownSuffix)
			sc.Step(stepAgentsTreeFrontmatterMismatch, s.treeFrontmatterMismatch)
			sc.Step(stepAgentsTreeMirrorDrift, s.treeMirrorDrift)
			sc.Step(stepDeveloperRunsAgentsValidateNaming, s.run)
			sc.Step(stepExitsSuccessfully, s.exitsSuccessfully)
			sc.Step(stepExitsWithFailure, s.exitsWithFailure)
			sc.Step(stepOutputZeroNamingViolations, s.zeroViolations)
			sc.Step(stepOutputIdentifiesAgentUnknownSuffix, s.identifiesUnknownSuffix)
			sc.Step(stepOutputIdentifiesFrontmatterMismatch, s.identifiesFrontmatterMismatch)
			sc.Step(stepOutputIdentifiesMirrorDrift, s.identifiesMirrorDrift)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDirUnitValidateNaming},
			TestingT: t,
			Tags:     "agents-validate-naming",
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run unit feature tests")
	}
}

// TestValidateAgentsNaming_MissingGitRoot exercises the git-root lookup
// path, which is not covered by the BDD scenarios (they mock findGitRoot).
func TestValidateAgentsNaming_MissingGitRoot(t *testing.T) {
	origGetwd := osGetwd
	origStat := osStat
	defer func() {
		osGetwd = origGetwd
		osStat = origStat
	}()

	osGetwd = func() (string, error) { return "/no-git-here", nil }
	osStat = func(_ string) (os.FileInfo, error) { return nil, os.ErrNotExist }

	buf := new(bytes.Buffer)
	agentsValidateNamingCmd.SetOut(buf)
	agentsValidateNamingCmd.SetErr(buf)

	err := agentsValidateNamingCmd.RunE(agentsValidateNamingCmd, []string{})
	if err == nil || !strings.Contains(err.Error(), "git") {
		t.Fatalf("expected git-root error, got: %v", err)
	}
}

// TestAgentsValidateNaming_RealTree exercises the real filesystem walker
// against a small tmp fixture. The BDD scenarios mock the walker via
// agentsValidateNamingFn; this test drives the actual implementation so the
// coverage counter reflects the walk logic too.
func TestAgentsValidateNaming_RealTree(t *testing.T) {
	tmp := t.TempDir()
	claudeDir := filepath.Join(tmp, ".claude", "agents")
	opencodeDir := filepath.Join(tmp, ".opencode", "agent")
	if err := os.MkdirAll(claudeDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(opencodeDir, 0755); err != nil {
		t.Fatal(err)
	}

	// Conforming pair.
	writeFile := func(path, content string) {
		if err := os.WriteFile(path, []byte(content), 0644); err != nil {
			t.Fatal(err)
		}
	}
	writeFile(filepath.Join(claudeDir, "README.md"), "# index\n") // must be skipped
	writeFile(filepath.Join(claudeDir, "plan-maker.md"),
		"---\nname: plan-maker\n---\nbody\n")
	writeFile(filepath.Join(opencodeDir, "plan-maker.md"),
		"---\ndescription: x\n---\nbody\n")

	// Offenders: bad suffix, frontmatter mismatch, mirror drift.
	writeFile(filepath.Join(claudeDir, "web-researcher.md"),
		"---\nname: web-researcher\n---\nbody\n")
	writeFile(filepath.Join(opencodeDir, "web-researcher.md"),
		"---\ndescription: x\n---\nbody\n")
	writeFile(filepath.Join(claudeDir, "plan-wrong.md"),
		"---\nname: not-plan-wrong\n---\nbody\n")
	// plan-wrong has invalid suffix; frontmatter mismatch applies regardless.
	writeFile(filepath.Join(opencodeDir, "plan-wrong.md"),
		"---\ndescription: x\n---\nbody\n")
	writeFile(filepath.Join(claudeDir, "orphan-maker.md"),
		"---\nname: orphan-maker\n---\nbody\n")

	got, err := agentsValidateNaming(tmp)
	if err != nil {
		t.Fatalf("agentsValidateNaming: %v", err)
	}
	if len(got) == 0 {
		t.Fatalf("expected violations, got none")
	}

	kinds := map[string]int{}
	for _, v := range got {
		kinds[v.Kind]++
	}
	if kinds["role-suffix"] < 2 { // web-researcher + plan-wrong (claude + opencode each)
		t.Errorf("expected at least 2 role-suffix violations, got kinds=%v", kinds)
	}
	if kinds["frontmatter-mismatch"] != 1 {
		t.Errorf("expected 1 frontmatter-mismatch, got kinds=%v", kinds)
	}
	if kinds["mirror-drift"] != 1 {
		t.Errorf("expected 1 mirror-drift, got kinds=%v", kinds)
	}
}

// TestAgentsValidateNaming_MissingDirs verifies that the validator treats
// missing .claude/agents/ and .opencode/agents/ as empty (not as an error).
func TestAgentsValidateNaming_MissingDirs(t *testing.T) {
	tmp := t.TempDir()
	got, err := agentsValidateNaming(tmp)
	if err != nil {
		t.Fatalf("agentsValidateNaming: %v", err)
	}
	if len(got) != 0 {
		t.Fatalf("expected zero violations for empty tree, got %+v", got)
	}
}

// TestListAgentFiles_NotDirectory ensures a read error surfaces when the
// target is a file rather than a directory.
func TestListAgentFiles_NotDirectory(t *testing.T) {
	tmp := t.TempDir()
	bogus := filepath.Join(tmp, "not-a-dir")
	if err := os.WriteFile(bogus, []byte("x"), 0644); err != nil {
		t.Fatal(err)
	}
	if _, err := listAgentFiles(bogus); err == nil {
		t.Errorf("expected error reading non-directory, got nil")
	}
}

// TestAgentsNaming_OutputFormats exercises json + markdown branches.
func TestAgentsNaming_OutputFormats(t *testing.T) {
	origGetwd := osGetwd
	origStat := osStat
	origFn := agentsValidateNamingFn
	defer func() {
		osGetwd = origGetwd
		osStat = origStat
		agentsValidateNamingFn = origFn
	}()

	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}
	agentsValidateNamingFn = func(_ string) ([]naming.Violation, error) {
		return []naming.Violation{{Path: "/x/y.md", Kind: "role-suffix", Message: "m"}}, nil
	}

	for _, format := range []string{"json", "markdown", "text"} {
		t.Run(format, func(t *testing.T) {
			buf := new(bytes.Buffer)
			agentsValidateNamingCmd.SetOut(buf)
			agentsValidateNamingCmd.SetErr(buf)
			output = format
			verbose = format == "text"
			quiet = false
			_ = agentsValidateNamingCmd.RunE(agentsValidateNamingCmd, []string{})
			if buf.Len() == 0 {
				t.Errorf("format %s produced no output", format)
			}
		})
	}
	output = "text"
	verbose = false
}
