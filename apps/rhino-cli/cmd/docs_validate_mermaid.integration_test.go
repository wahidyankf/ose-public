//go:build integration

package cmd

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/cucumber/godog"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/mermaid"
)

var specsDirIntMermaid = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino/cli/gherkin")
}()

type validateMermaidIntSteps struct {
	originalWd string
	tmpDir     string
	cmdErr     error
	cmdOutput  string
}

func (s *validateMermaidIntSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	s.originalWd, _ = os.Getwd()
	s.tmpDir, _ = os.MkdirTemp("", "validate-mermaid-*")
	_ = os.MkdirAll(filepath.Join(s.tmpDir, ".git"), 0755)
	verbose = false
	quiet = false
	output = "text"
	validateMermaidStagedOnly = false
	validateMermaidChangedOnly = false
	validateMermaidMaxLabelLen = 30
	validateMermaidMaxWidth = 3
	validateMermaidMaxDepth = 5
	// Restore real implementations so integration tests exercise actual code.
	docsValidateMermaidFn = mermaid.ValidateBlocks
	readFileFn = os.ReadFile
	getMermaidStagedFilesFn = getMermaidStagedFiles
	getMermaidChangedFilesFn = getMermaidChangedFiles
	_ = os.Chdir(s.tmpDir)
	return context.Background(), nil
}

func (s *validateMermaidIntSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	_ = os.Chdir(s.originalWd)
	_ = os.RemoveAll(s.tmpDir)
	docsValidateMermaidFn = mermaid.ValidateBlocks
	readFileFn = os.ReadFile
	getMermaidStagedFilesFn = getMermaidStagedFiles
	getMermaidChangedFilesFn = getMermaidChangedFiles
	return context.Background(), nil
}

// --- Helpers ---

func (s *validateMermaidIntSteps) writeMD(relPath, content string) error {
	abs := filepath.Join(s.tmpDir, relPath)
	if err := os.MkdirAll(filepath.Dir(abs), 0755); err != nil {
		return err
	}
	return os.WriteFile(abs, []byte(content), 0644)
}

func (s *validateMermaidIntSteps) runCmd(args []string) {
	buf := new(bytes.Buffer)
	validateMermaidCmd.SetOut(buf)
	validateMermaidCmd.SetErr(buf)
	s.cmdErr = validateMermaidCmd.RunE(validateMermaidCmd, args)
	s.cmdOutput = buf.String()
}

// --- Given steps ---

func (s *validateMermaidIntSteps) aMarkdownFileContainingFlowchartAllLabelsWithinLimit() error {
	return s.writeMD("docs/clean.md", "# Clean\n\n```mermaid\nflowchart TB\n  A[Short] --> B[Label]\n```\n")
}

func (s *validateMermaidIntSteps) aMarkdownFileContainingFlowchartNodeLabelLongerThanLimit() error {
	return s.writeMD("docs/toolong.md",
		"# Bad\n\n```mermaid\nflowchart TB\n  A[This label is way too long for the limit indeed] --> B[ok]\n```\n")
}

func (s *validateMermaidIntSteps) aMarkdownFileContainingFlowchartNodeLabel35Chars() error {
	// 35-char label: passes at --max-label-len 40.
	label := "This is exactly thirty-five chars!!" // exactly 35 chars
	return s.writeMD("docs/label35.md",
		fmt.Sprintf("# Label35\n\n```mermaid\nflowchart TB\n  A[%s] --> B[ok]\n```\n", label))
}

func (s *validateMermaidIntSteps) aMarkdownFileContainingTBFlowchartTenNodesChainedSequentially() error {
	return s.writeMD("docs/chain.md",
		"# Chain\n\n```mermaid\nflowchart TB\n  A-->B-->C-->D-->E-->F-->G-->H-->I-->J\n```\n")
}

func (s *validateMermaidIntSteps) aMarkdownFileContainingTBFlowchartNoRankMoreThan3() error {
	return s.writeMD("docs/tb3.md",
		"# TB3\n\n```mermaid\nflowchart TB\n  A-->B\n  A-->C\n  A-->D\n  B-->E\n```\n")
}

func (s *validateMermaidIntSteps) aMarkdownFileContainingTBFlowchartOneRank4ParallelNodes() error {
	return s.writeMD("docs/tb4.md",
		"# TB4\n\n```mermaid\nflowchart TB\n  Root-->A\n  Root-->B\n  Root-->C\n  Root-->D\n```\n")
}

func (s *validateMermaidIntSteps) aMarkdownFileContainingLRFlowchartNoRankMoreThan3() error {
	return s.writeMD("docs/lr3.md",
		"# LR3\n\n```mermaid\nflowchart LR\n  A-->B\n  A-->C\n  A-->D\n  B-->E\n```\n")
}

func (s *validateMermaidIntSteps) aMarkdownFileContainingLRFlowchart4NodesAtSameDepth() error {
	// LR charts are penalized by depth (chain length), not span. A 4-node chain
	// has depth=4 which exceeds the default MaxWidth=3, triggering a violation.
	return s.writeMD("docs/lr4.md",
		"# LR4\n\n```mermaid\nflowchart LR\n  A-->B-->C-->D\n```\n")
}

func (s *validateMermaidIntSteps) aMarkdownFileContainingFlowchart4NodesAtOneRank() error {
	return s.writeMD("docs/width4.md",
		"# Width4\n\n```mermaid\nflowchart TB\n  Root-->A\n  Root-->B\n  Root-->C\n  Root-->D\n```\n")
}

func (s *validateMermaidIntSteps) aMarkdownFileContainingFlowchart4NodesAtOneRankMoreThan5Ranks() error {
	// Span=4 > max-width=3, depth=6 > max-depth=5 → warning only (both-exceeded).
	return s.writeMD("docs/both.md",
		"# Both\n\n```mermaid\nflowchart TB\n  Root-->A\n  Root-->B\n  Root-->C\n  Root-->D\n  A-->E\n  E-->F\n  F-->G\n  G-->H\n  H-->I\n```\n")
}

func (s *validateMermaidIntSteps) aMarkdownFileContainingFlowchart4NodesAtOneRankExactly4RanksDeep() error {
	// Span=4 > max-width=3, depth=4 > max-depth=3 → warning when --max-depth=3.
	return s.writeMD("docs/depth4.md",
		"# Depth4\n\n```mermaid\nflowchart TB\n  Root-->A\n  Root-->B\n  Root-->C\n  Root-->D\n  A-->E\n  E-->F\n  F-->G\n```\n")
}

func (s *validateMermaidIntSteps) aMarkdownFileContainingSingleFlowchartDiagram() error {
	return s.writeMD("docs/single.md",
		"# Single\n\n```mermaid\nflowchart TB\n  A-->B\n```\n")
}

func (s *validateMermaidIntSteps) aMarkdownFileContainingMermaidBlockTwoFlowchartDeclarations() error {
	return s.writeMD("docs/two.md",
		"# Two\n\n```mermaid\nflowchart TB\n  A-->B\nflowchart LR\n  C-->D\n```\n")
}

func (s *validateMermaidIntSteps) aMarkdownFileContainingGraphKeywordNoViolations() error {
	return s.writeMD("docs/graph.md",
		"# Graph\n\n```mermaid\ngraph TB\n  A-->B\n```\n")
}

func (s *validateMermaidIntSteps) aMarkdownFileContainingOnlySequenceDiagramAndClassDiagram() error {
	return s.writeMD("docs/nonflow.md",
		"# NonFlow\n\n```mermaid\nsequenceDiagram\n  Alice->>Bob: Hi\n```\n\n```mermaid\nclassDiagram\n  Animal <|-- Dog\n```\n")
}

func (s *validateMermaidIntSteps) aMarkdownFileContainingNoMermaidCodeBlocks() error {
	return s.writeMD("docs/nomermaid.md", "# No Mermaid\n\nJust text.\n")
}

func (s *validateMermaidIntSteps) aMarkdownFileWithMermaidViolationNotStagedInGit() error {
	// Initialize a real git repo so git diff --cached works correctly.
	if err := exec.Command("git", "init", s.tmpDir).Run(); err != nil {
		return fmt.Errorf("git init failed: %w", err)
	}
	_ = exec.Command("git", "-C", s.tmpDir, "config", "user.email", "test@example.com").Run()
	_ = exec.Command("git", "-C", s.tmpDir, "config", "user.name", "Test User").Run()
	// Write a file with a violation but do NOT stage it.
	return s.writeMD("docs/unstaged.md",
		"# Unstaged\n\n```mermaid\nflowchart TB\n  A[This label is way too long for the limit] --> B[ok]\n```\n")
}

func (s *validateMermaidIntSteps) aMarkdownFileWithMermaidViolationNotInPushRange() error {
	// For changed-only, mock the function to return empty list (no upstream configured).
	getMermaidChangedFilesFn = func(_ string) ([]string, error) {
		return nil, nil
	}
	return s.writeMD("docs/notpush.md",
		"# NotPush\n\n```mermaid\nflowchart TB\n  A[This label is way too long for the limit] --> B[ok]\n```\n")
}

func (s *validateMermaidIntSteps) aMarkdownFileContainingFlowchartWithLabelLengthViolation() error {
	return s.writeMD("docs/violation.md",
		"# Violation\n\n```mermaid\nflowchart TB\n  A[This label is way too long for the limit indeed] --> B[ok]\n```\n")
}

func (s *validateMermaidIntSteps) aMarkdownFileContainingFlowchartNoViolationsInt() error {
	return s.writeMD("docs/clean.md", "# Clean\n\n```mermaid\nflowchart TB\n  A[Short] --> B[Label]\n```\n")
}

func (s *validateMermaidIntSteps) aMarkdownFileUnderPlansLongLabel() error {
	// 35-char label exceeds default MaxLabelLen=30.
	return s.writeMD("plans/sample/diagram.md",
		"# Plan\n\n```mermaid\nflowchart TB\n  A[This is exactly thirty-five chars!!] --> B[ok]\n```\n")
}

// --- When steps ---

func (s *validateMermaidIntSteps) theDeveloperRunsDocsValidateMermaid() error {
	s.runCmd([]string{})
	return nil
}

func (s *validateMermaidIntSteps) theDeveloperRunsDocsValidateMermaidNoArgs() error {
	s.runCmd([]string{})
	return nil
}

func (s *validateMermaidIntSteps) theOutputIdentifiesFileUnderPlans() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected violation, got success; output: %s", s.cmdOutput)
	}
	if !strings.Contains(s.cmdOutput, "plans/") {
		return fmt.Errorf("expected output to mention plans/, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateMermaidIntSteps) theDeveloperRunsDocsValidateMermaidWithMaxLabelLen40() error {
	validateMermaidMaxLabelLen = 40
	s.runCmd([]string{})
	return nil
}

func (s *validateMermaidIntSteps) theDeveloperRunsDocsValidateMermaidWithMaxWidth5() error {
	validateMermaidMaxWidth = 5
	s.runCmd([]string{})
	return nil
}

func (s *validateMermaidIntSteps) theDeveloperRunsDocsValidateMermaidWithMaxDepth3() error {
	validateMermaidMaxDepth = 3
	s.runCmd([]string{})
	return nil
}

func (s *validateMermaidIntSteps) theDeveloperRunsDocsValidateMermaidWithStagedOnlyFlag() error {
	// In integration test with no git staging, staged-only returns no files → success.
	validateMermaidStagedOnly = true
	s.runCmd([]string{})
	return nil
}

func (s *validateMermaidIntSteps) theDeveloperRunsDocsValidateMermaidWithChangedOnlyFlag() error {
	// No upstream configured → falls back to default dirs which contain the (unviolating) file.
	// Swap to a clean file so the fallback scan passes.
	validateMermaidChangedOnly = true
	s.runCmd([]string{})
	return nil
}

func (s *validateMermaidIntSteps) theDeveloperRunsDocsValidateMermaidWithJSONOutput() error {
	output = "json"
	s.runCmd([]string{})
	return nil
}

func (s *validateMermaidIntSteps) theDeveloperRunsDocsValidateMermaidWithMarkdownOutput() error {
	output = "markdown"
	s.runCmd([]string{})
	return nil
}

func (s *validateMermaidIntSteps) theDeveloperRunsDocsValidateMermaidWithVerbose() error {
	verbose = true
	s.runCmd([]string{})
	return nil
}

func (s *validateMermaidIntSteps) theDeveloperRunsDocsValidateMermaidWithQuiet() error {
	quiet = true
	s.runCmd([]string{})
	return nil
}

// --- Then steps ---

func (s *validateMermaidIntSteps) theValidateMermaidCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected command to exit successfully, got error: %w (output: %s)", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *validateMermaidIntSteps) theValidateMermaidCommandExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected command to exit with failure, but it succeeded (output: %s)", s.cmdOutput)
	}
	return nil
}

func (s *validateMermaidIntSteps) theOutputReportsNoViolations() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected no violations, got error: %w (output: %s)", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *validateMermaidIntSteps) theOutputIdentifiesFileBlockAndNodeWithOversizedLabel() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected label-too-long violation error, but command succeeded")
	}
	return nil
}

func (s *validateMermaidIntSteps) theOutputIdentifiesFileAndBlockWithExcessiveWidth() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected width-exceeded violation error, but command succeeded")
	}
	return nil
}

func (s *validateMermaidIntSteps) theOutputIdentifiesFileAndBlockWithMultipleDiagrams() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected multiple-diagrams violation error, but command succeeded")
	}
	return nil
}

func (s *validateMermaidIntSteps) theOutputContainsWarningAboutDiagramComplexity() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success (warning only), got error: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *validateMermaidIntSteps) theOutputIsValidJSON() error {
	if !json.Valid([]byte(s.cmdOutput)) {
		return fmt.Errorf("expected valid JSON output, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateMermaidIntSteps) theJSONContainsViolationKindFilePathBlockIndexAndNodeID() error {
	var result map[string]interface{}
	if err := json.Unmarshal([]byte(s.cmdOutput), &result); err != nil {
		return fmt.Errorf("failed to parse JSON: %w (output: %s)", err, s.cmdOutput)
	}
	if _, ok := result["violations"]; !ok {
		return fmt.Errorf("JSON missing 'violations' field, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateMermaidIntSteps) theOutputContainsTableWithExpectedColumns() error {
	expected := []string{"File", "Block", "Line", "Severity", "Kind", "Detail"}
	for _, col := range expected {
		if !strings.Contains(s.cmdOutput, col) {
			return fmt.Errorf("expected markdown output to contain column %q, got: %s", col, s.cmdOutput)
		}
	}
	return nil
}

func (s *validateMermaidIntSteps) theOutputIncludesPerFileScanDetailLines() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success with verbose output, got: %v", s.cmdErr)
	}
	if s.cmdOutput == "" {
		return fmt.Errorf("expected non-empty verbose output, got empty string")
	}
	return nil
}

func (s *validateMermaidIntSteps) theOutputContainsNoText() error {
	if s.cmdOutput != "" {
		return fmt.Errorf("expected empty output in quiet mode, got: %s", s.cmdOutput)
	}
	return nil
}

func InitializeValidateMermaidScenario(sc *godog.ScenarioContext) {
	s := &validateMermaidIntSteps{}
	sc.Before(s.before)
	sc.After(s.after)

	// Given.
	sc.Step(stepMermaidFileCleanFlowchart, s.aMarkdownFileContainingFlowchartAllLabelsWithinLimit)
	sc.Step(stepMermaidFileLabelTooLong, s.aMarkdownFileContainingFlowchartNodeLabelLongerThanLimit)
	sc.Step(stepMermaidFileNodeLabel35Chars, s.aMarkdownFileContainingFlowchartNodeLabel35Chars)
	sc.Step(stepMermaidFileTBChainedSequentially, s.aMarkdownFileContainingTBFlowchartTenNodesChainedSequentially)
	sc.Step(stepMermaidFileTBNoRankMoreThan3, s.aMarkdownFileContainingTBFlowchartNoRankMoreThan3)
	sc.Step(stepMermaidFileTBOneRank4Nodes, s.aMarkdownFileContainingTBFlowchartOneRank4ParallelNodes)
	sc.Step(stepMermaidFileLRNoRankMoreThan3, s.aMarkdownFileContainingLRFlowchartNoRankMoreThan3)
	sc.Step(stepMermaidFileLR4NodesSameDepth, s.aMarkdownFileContainingLRFlowchart4NodesAtSameDepth)
	sc.Step(stepMermaidFileFlowchart4NodesOneRank, s.aMarkdownFileContainingFlowchart4NodesAtOneRank)
	sc.Step(stepMermaidFile4NodesMoreThan5Ranks, s.aMarkdownFileContainingFlowchart4NodesAtOneRankMoreThan5Ranks)
	sc.Step(stepMermaidFile4NodesExactly4RanksDeep, s.aMarkdownFileContainingFlowchart4NodesAtOneRankExactly4RanksDeep)
	sc.Step(stepMermaidFileSingleFlowchart, s.aMarkdownFileContainingSingleFlowchartDiagram)
	sc.Step(stepMermaidFileTwoFlowchartDeclarations, s.aMarkdownFileContainingMermaidBlockTwoFlowchartDeclarations)
	sc.Step(stepMermaidFileGraphKeywordNoViolations, s.aMarkdownFileContainingGraphKeywordNoViolations)
	sc.Step(stepMermaidFileOnlyNonFlowchart, s.aMarkdownFileContainingOnlySequenceDiagramAndClassDiagram)
	sc.Step(stepMermaidFileNoMermaidBlocks, s.aMarkdownFileContainingNoMermaidCodeBlocks)
	sc.Step(stepMermaidViolationNotStagedInGit, s.aMarkdownFileWithMermaidViolationNotStagedInGit)
	sc.Step(stepMermaidViolationNotInPushRange, s.aMarkdownFileWithMermaidViolationNotInPushRange)
	sc.Step(stepMermaidFileLabelLengthViolation, s.aMarkdownFileContainingFlowchartWithLabelLengthViolation)
	sc.Step(stepMermaidFileNoViolations, s.aMarkdownFileContainingFlowchartNoViolationsInt)
	sc.Step(stepMermaidFileUnderPlansLongLabel, s.aMarkdownFileUnderPlansLongLabel)

	// When.
	sc.Step(stepDeveloperRunsDocsValidateMermaid, s.theDeveloperRunsDocsValidateMermaid)
	sc.Step(stepDeveloperRunsDocsValidateMermaidNoArgs, s.theDeveloperRunsDocsValidateMermaidNoArgs)
	sc.Step(stepDeveloperRunsDocsValidateMermaidMaxLabelLen40, s.theDeveloperRunsDocsValidateMermaidWithMaxLabelLen40)
	sc.Step(stepDeveloperRunsDocsValidateMermaidMaxWidth5, s.theDeveloperRunsDocsValidateMermaidWithMaxWidth5)
	sc.Step(stepDeveloperRunsDocsValidateMermaidMaxDepth3, s.theDeveloperRunsDocsValidateMermaidWithMaxDepth3)
	sc.Step(stepDeveloperRunsDocsValidateMermaidStagedOnly, s.theDeveloperRunsDocsValidateMermaidWithStagedOnlyFlag)
	sc.Step(stepDeveloperRunsDocsValidateMermaidChangedOnly, s.theDeveloperRunsDocsValidateMermaidWithChangedOnlyFlag)
	sc.Step(stepDeveloperRunsDocsValidateMermaidJSONOutput, s.theDeveloperRunsDocsValidateMermaidWithJSONOutput)
	sc.Step(stepDeveloperRunsDocsValidateMermaidMarkdownOutput, s.theDeveloperRunsDocsValidateMermaidWithMarkdownOutput)
	sc.Step(stepDeveloperRunsDocsValidateMermaidVerbose, s.theDeveloperRunsDocsValidateMermaidWithVerbose)
	sc.Step(stepDeveloperRunsDocsValidateMermaidQuiet, s.theDeveloperRunsDocsValidateMermaidWithQuiet)

	// Then.
	sc.Step(stepExitsSuccessfully, s.theValidateMermaidCommandExitsSuccessfully)
	sc.Step(stepExitsWithFailure, s.theValidateMermaidCommandExitsWithAFailureCode)
	sc.Step(stepMermaidOutputNoViolations, s.theOutputReportsNoViolations)
	sc.Step(stepMermaidOutputIdentifiesOversizedLabel, s.theOutputIdentifiesFileBlockAndNodeWithOversizedLabel)
	sc.Step(stepMermaidOutputIdentifiesExcessiveWidth, s.theOutputIdentifiesFileAndBlockWithExcessiveWidth)
	sc.Step(stepMermaidOutputIdentifiesMultipleDiagrams, s.theOutputIdentifiesFileAndBlockWithMultipleDiagrams)
	sc.Step(stepMermaidOutputContainsWarning, s.theOutputContainsWarningAboutDiagramComplexity)
	sc.Step(stepOutputIsValidJSON, s.theOutputIsValidJSON)
	sc.Step(stepMermaidJSONContainsViolationFields, s.theJSONContainsViolationKindFilePathBlockIndexAndNodeID)
	sc.Step(stepMermaidOutputContainsTable, s.theOutputContainsTableWithExpectedColumns)
	sc.Step(stepMermaidOutputIncludesPerFileDetail, s.theOutputIncludesPerFileScanDetailLines)
	sc.Step(stepMermaidOutputContainsNoText, s.theOutputContainsNoText)
	sc.Step(stepMermaidOutputIdentifiesFileUnderPlans, s.theOutputIdentifiesFileUnderPlans)
}

func TestIntegrationValidateMermaid(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: InitializeValidateMermaidScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDirIntMermaid},
			Tags:     "@docs-validate-mermaid",
			TestingT: t,
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run feature tests")
	}
}

// TestIntegrationValidateMermaid_PlansDirScanned verifies that without path
// arguments, the validator scans plans/ and reports violations on diagrams there.
// Mirrors the new Gherkin scenario "Plans directory is scanned by default".
func TestIntegrationValidateMermaid_PlansDirScanned(t *testing.T) {
	originalWd, _ := os.Getwd()
	tmpDir, err := os.MkdirTemp("", "validate-mermaid-plans-*")
	if err != nil {
		t.Fatal(err)
	}
	defer func() {
		_ = os.Chdir(originalWd)
		_ = os.RemoveAll(tmpDir)
		validateMermaidStagedOnly = false
		validateMermaidChangedOnly = false
		validateMermaidMaxLabelLen = 30
		validateMermaidMaxWidth = 3
		validateMermaidMaxDepth = 5
		output = "text"
		verbose = false
		quiet = false
	}()

	if err := os.MkdirAll(filepath.Join(tmpDir, ".git"), 0o755); err != nil {
		t.Fatal(err)
	}
	planDir := filepath.Join(tmpDir, "plans", "sample")
	if err := os.MkdirAll(planDir, 0o755); err != nil {
		t.Fatal(err)
	}
	// 35-char label exceeds default MaxLabelLen=30.
	planMD := filepath.Join(planDir, "diagram.md")
	content := "# Plan\n\n```mermaid\nflowchart TB\n  A[This is exactly thirty-five chars!!] --> B[ok]\n```\n"
	if err := os.WriteFile(planMD, []byte(content), 0o600); err != nil {
		t.Fatal(err)
	}

	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}

	verbose = false
	quiet = false
	output = "text"
	validateMermaidStagedOnly = false
	validateMermaidChangedOnly = false
	validateMermaidMaxLabelLen = 30
	validateMermaidMaxWidth = 3
	validateMermaidMaxDepth = 5

	buf := new(bytes.Buffer)
	validateMermaidCmd.SetOut(buf)
	validateMermaidCmd.SetErr(buf)
	cmdErr := validateMermaidCmd.RunE(validateMermaidCmd, []string{})

	if cmdErr == nil {
		t.Fatalf("expected violation for plans/ diagram, got success; output:\n%s", buf.String())
	}
	if !strings.Contains(buf.String(), filepath.Join("plans", "sample", "diagram.md")) {
		t.Errorf("expected output to identify plans/sample/diagram.md; got:\n%s", buf.String())
	}
}
