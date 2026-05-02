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

var specsDirAgentsValidateNaming = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino/cli/gherkin")
}()

type validateAgentsNamingIntegSteps struct {
	originalWd string
	tmpDir     string
	cmdErr     error
	cmdOutput  string
}

func (s *validateAgentsNamingIntegSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	s.originalWd, _ = os.Getwd()
	s.tmpDir, _ = os.MkdirTemp("", "validate-naming-agents-*")
	_ = os.MkdirAll(filepath.Join(s.tmpDir, ".git"), 0755)
	_ = os.MkdirAll(filepath.Join(s.tmpDir, ".claude", "agents"), 0755)
	_ = os.MkdirAll(filepath.Join(s.tmpDir, ".opencode", "agents"), 0755)
	verbose = false
	quiet = false
	output = "text"
	_ = os.Chdir(s.tmpDir)
	return context.Background(), nil
}

func (s *validateAgentsNamingIntegSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	_ = os.Chdir(s.originalWd)
	_ = os.RemoveAll(s.tmpDir)
	return context.Background(), nil
}

func (s *validateAgentsNamingIntegSteps) writeClaudeAgent(name, frontmatterName string) error {
	content := fmt.Sprintf("---\nname: %s\ndescription: test\ntools: Read\nmodel: sonnet\ncolor: blue\nskills:\n---\nbody\n", frontmatterName)
	path := filepath.Join(s.tmpDir, ".claude", "agents", name+".md")
	return os.WriteFile(path, []byte(content), 0644)
}

func (s *validateAgentsNamingIntegSteps) writeOpencodeAgent(name string) error {
	content := "---\ndescription: test\nmodel: zai-coding-plan/glm-5.1\ntools:\n  read: true\n---\nbody\n"
	path := filepath.Join(s.tmpDir, ".opencode", "agents", name+".md")
	return os.WriteFile(path, []byte(content), 0644)
}

func (s *validateAgentsNamingIntegSteps) treeAllConform() error {
	if err := s.writeClaudeAgent("plan-maker", "plan-maker"); err != nil {
		return err
	}
	return s.writeOpencodeAgent("plan-maker")
}

func (s *validateAgentsNamingIntegSteps) treeUnknownSuffix() error {
	// "web-researcher" has no known role suffix.
	if err := s.writeClaudeAgent("web-researcher", "web-researcher"); err != nil {
		return err
	}
	return s.writeOpencodeAgent("web-researcher")
}

func (s *validateAgentsNamingIntegSteps) treeFrontmatterMismatch() error {
	// Valid suffix but frontmatter name disagrees with filename.
	if err := s.writeClaudeAgent("plan-maker", "something-else"); err != nil {
		return err
	}
	return s.writeOpencodeAgent("plan-maker")
}

func (s *validateAgentsNamingIntegSteps) treeMirrorDrift() error {
	// Only .claude/agents/ has the file — no .opencode/ mirror.
	return s.writeClaudeAgent("orphan-maker", "orphan-maker")
}

func (s *validateAgentsNamingIntegSteps) run() error {
	buf := new(bytes.Buffer)
	agentsValidateNamingCmd.SetOut(buf)
	agentsValidateNamingCmd.SetErr(buf)
	s.cmdErr = agentsValidateNamingCmd.RunE(agentsValidateNamingCmd, []string{})
	s.cmdOutput = buf.String()
	return nil
}

func (s *validateAgentsNamingIntegSteps) exitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success, got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *validateAgentsNamingIntegSteps) exitsWithFailure() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected failure, output: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateAgentsNamingIntegSteps) zeroViolations() error {
	if !strings.Contains(s.cmdOutput, "VALIDATION PASSED") {
		return fmt.Errorf("expected VALIDATION PASSED, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateAgentsNamingIntegSteps) identifiesUnknownSuffix() error {
	lc := strings.ToLower(s.cmdOutput)
	if !strings.Contains(lc, "role-suffix") || !strings.Contains(lc, "web-researcher") {
		return fmt.Errorf("expected role-suffix violation naming web-researcher, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateAgentsNamingIntegSteps) identifiesFrontmatterMismatch() error {
	lc := strings.ToLower(s.cmdOutput)
	if !strings.Contains(lc, "frontmatter-mismatch") {
		return fmt.Errorf("expected frontmatter-mismatch, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateAgentsNamingIntegSteps) identifiesMirrorDrift() error {
	lc := strings.ToLower(s.cmdOutput)
	if !strings.Contains(lc, "mirror-drift") {
		return fmt.Errorf("expected mirror-drift, got: %s", s.cmdOutput)
	}
	return nil
}

func InitializeValidateAgentsNamingScenario(sc *godog.ScenarioContext) {
	s := &validateAgentsNamingIntegSteps{}
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
}

func TestIntegrationValidateAgentsNaming(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: InitializeValidateAgentsNamingScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDirAgentsValidateNaming},
			Tags:     "agents-validate-naming",
			TestingT: t,
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run integration feature tests")
	}
}
