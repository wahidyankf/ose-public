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
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/bcregistry"
)

var specsDirIntegBcValidate = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino/cli/gherkin")
}()

type bcValidateIntegSteps struct {
	originalWd string
	tmpDir     string
	cmdErr     error
	cmdOutput  string
}

func (s *bcValidateIntegSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	s.originalWd, _ = os.Getwd()
	var err error
	s.tmpDir, err = os.MkdirTemp("", "bc-validate-*")
	if err != nil {
		return nil, err
	}
	_ = os.MkdirAll(filepath.Join(s.tmpDir, ".git"), 0755)
	verbose = false
	quiet = false
	output = "text"
	bcSeverity = ""
	bcValidateAllFn = bcregistry.ValidateAll
	_ = os.Unsetenv("ORGANICLEVER_RHINO_DDD_SEVERITY")
	_ = os.Chdir(s.tmpDir)
	return context.Background(), nil
}

func (s *bcValidateIntegSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	_ = os.Chdir(s.originalWd)
	_ = os.RemoveAll(s.tmpDir)
	_ = os.Unsetenv("ORGANICLEVER_RHINO_DDD_SEVERITY")
	return context.Background(), nil
}

// writeRegistryWithOneContext writes a minimal one-context registry and all its artefacts.
func (s *bcValidateIntegSteps) writeRegistryWithOneContext(contextName string, layers []string) error {
	layersYAML := ""
	for _, l := range layers {
		layersYAML += fmt.Sprintf("      - %s\n", l)
	}
	registry := fmt.Sprintf(`version: 1
app: organiclever
contexts:
  - name: %s
    summary: test context
    layers:
%s    code: apps/organiclever-web/src/contexts/%s
    glossary: specs/apps/organiclever/ubiquitous-language/%s.md
    gherkin: specs/apps/organiclever/fe/gherkin/%s
    relationships: []
`, contextName, layersYAML, contextName, contextName, contextName)

	regDir := filepath.Join(s.tmpDir, "specs", "apps", "organiclever")
	if err := os.MkdirAll(regDir, 0755); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(regDir, "bounded-contexts.yaml"), []byte(registry), 0644); err != nil {
		return err
	}

	// Create code directory with layer subdirs.
	for _, l := range layers {
		layerDir := filepath.Join(s.tmpDir, "apps", "organiclever-web", "src", "contexts", contextName, l)
		if err := os.MkdirAll(layerDir, 0755); err != nil {
			return err
		}
	}

	// Create glossary file.
	glossaryDir := filepath.Join(s.tmpDir, "specs", "apps", "organiclever", "ubiquitous-language")
	if err := os.MkdirAll(glossaryDir, 0755); err != nil {
		return err
	}
	glossaryContent := fmt.Sprintf("# Ubiquitous Language — %s\n\n**Bounded context**: `%s`\n**Maintainer**: test\n**Last reviewed**: 2026-01-01\n\n## Terms\n\n| Term | Definition | Code identifier(s) | Used in features |\n| --- | --- | --- | --- |\n", contextName, contextName)
	if err := os.WriteFile(filepath.Join(glossaryDir, contextName+".md"), []byte(glossaryContent), 0644); err != nil {
		return err
	}

	// Create gherkin dir with one feature file.
	gherkinDir := filepath.Join(s.tmpDir, "specs", "apps", "organiclever", "fe", "gherkin", contextName)
	if err := os.MkdirAll(gherkinDir, 0755); err != nil {
		return err
	}
	featureContent := fmt.Sprintf("@%s\nFeature: %s test\n\n  Scenario: smoke\n    Given smoke\n", contextName, contextName)
	return os.WriteFile(filepath.Join(gherkinDir, contextName+".feature"), []byte(featureContent), 0644)
}

func (s *bcValidateIntegSteps) registryOneContextClean() error {
	return s.writeRegistryWithOneContext("journal", []string{"domain", "application", "infrastructure", "presentation"})
}

func (s *bcValidateIntegSteps) glossaryExists() error { return nil }
func (s *bcValidateIntegSteps) gherkinExists() error  { return nil }
func (s *bcValidateIntegSteps) layersExact() error    { return nil }

func (s *bcValidateIntegSteps) registryNoPhantom() error {
	return s.writeRegistryWithOneContext("journal", []string{"domain", "application", "infrastructure", "presentation"})
}

func (s *bcValidateIntegSteps) createPhantomFolder() error {
	return os.MkdirAll(filepath.Join(s.tmpDir, "apps", "organiclever-web", "src", "contexts", "phantom"), 0755)
}

func (s *bcValidateIntegSteps) registryMissingGlossary() error {
	if err := s.writeRegistryWithOneContext("journal", []string{"domain", "application", "infrastructure", "presentation"}); err != nil {
		return err
	}
	// Remove glossary file.
	return os.Remove(filepath.Join(s.tmpDir, "specs", "apps", "organiclever", "ubiquitous-language", "journal.md"))
}

func (s *bcValidateIntegSteps) glossaryRemoved() error { return nil }

func (s *bcValidateIntegSteps) registryMissingLayer() error {
	if err := s.writeRegistryWithOneContext("journal", []string{"domain", "application", "infrastructure", "presentation"}); err != nil {
		return err
	}
	// Remove infrastructure dir.
	return os.RemoveAll(filepath.Join(s.tmpDir, "apps", "organiclever-web", "src", "contexts", "journal", "infrastructure"))
}

func (s *bcValidateIntegSteps) infraRemoved() error { return nil }

func (s *bcValidateIntegSteps) registryWithOrphanForWarnFlag() error {
	if err := s.writeRegistryWithOneContext("journal", []string{"domain", "application", "infrastructure", "presentation"}); err != nil {
		return err
	}
	return os.MkdirAll(filepath.Join(s.tmpDir, "apps", "organiclever-web", "src", "contexts", "phantom"), 0755)
}

func (s *bcValidateIntegSteps) run() error {
	buf := new(bytes.Buffer)
	bcValidateCmd.SetOut(buf)
	bcValidateCmd.SetErr(buf)
	s.cmdErr = bcValidateCmd.RunE(bcValidateCmd, []string{"organiclever"})
	s.cmdOutput = buf.String()
	return nil
}

func (s *bcValidateIntegSteps) runWithWarnFlag() error {
	buf := new(bytes.Buffer)
	bcValidateCmd.SetOut(buf)
	bcValidateCmd.SetErr(buf)
	bcSeverity = "warn"
	s.cmdErr = bcValidateCmd.RunE(bcValidateCmd, []string{"organiclever"})
	s.cmdOutput = buf.String()
	return nil
}

func (s *bcValidateIntegSteps) exitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *bcValidateIntegSteps) exitsWithFailure() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected failure but succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *bcValidateIntegSteps) noFindings() error {
	lc := strings.ToLower(s.cmdOutput)
	if strings.Contains(lc, "error:") || strings.Contains(lc, "warning:") {
		return fmt.Errorf("expected no findings but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *bcValidateIntegSteps) mentionsOrphan() error {
	if !strings.Contains(strings.ToLower(s.cmdOutput), "orphan") {
		return fmt.Errorf("expected 'orphan' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *bcValidateIntegSteps) mentionsPhantom() error {
	if !strings.Contains(strings.ToLower(s.cmdOutput), "phantom") {
		return fmt.Errorf("expected 'phantom' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *bcValidateIntegSteps) mentionsMissingGlossary() error {
	if !strings.Contains(strings.ToLower(s.cmdOutput), "missing glossary") {
		return fmt.Errorf("expected 'missing glossary' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *bcValidateIntegSteps) mentionsJournal() error {
	if !strings.Contains(strings.ToLower(s.cmdOutput), "journal") {
		return fmt.Errorf("expected 'journal' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *bcValidateIntegSteps) mentionsMissingLayer() error {
	if !strings.Contains(strings.ToLower(s.cmdOutput), "missing layer") {
		return fmt.Errorf("expected 'missing layer' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *bcValidateIntegSteps) mentionsInfrastructure() error {
	if !strings.Contains(strings.ToLower(s.cmdOutput), "infrastructure") {
		return fmt.Errorf("expected 'infrastructure' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *bcValidateIntegSteps) outputContainsWarning() error {
	lc := strings.ToLower(s.cmdOutput)
	if !strings.Contains(lc, "warning") && !strings.Contains(lc, "warn") {
		return fmt.Errorf("expected 'warning' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func TestIntegrationBcValidate(t *testing.T) {
	s := &bcValidateIntegSteps{}
	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Before(s.before)
			sc.After(s.after)
			sc.Step(stepBcRegistryOneContextClean, s.registryOneContextClean)
			sc.Step(stepBcGlossaryFileExistsAtPath, s.glossaryExists)
			sc.Step(stepBcGherkinFolderWithFeatureFile, s.gherkinExists)
			sc.Step(stepBcCodeFolderContainsDeclaredLayers, s.layersExact)
			sc.Step(stepBcRegistryNotListingPhantom, s.registryNoPhantom)
			sc.Step(stepBcPhantomFolderExists, s.createPhantomFolder)
			sc.Step(stepBcRegistryWithMissingGlossary, s.registryMissingGlossary)
			sc.Step(stepBcGlossaryFileDoesNotExist, s.glossaryRemoved)
			sc.Step(stepBcRegistryWithMissingLayer, s.registryMissingLayer)
			sc.Step(stepBcCodeFolderMissingInfrastructure, s.infraRemoved)
			sc.Step(stepBcRegistryWithOrphanAndWarnFlag, s.registryWithOrphanForWarnFlag)
			sc.Step(stepBcRunValidateOrganiclever, s.run)
			sc.Step(stepBcRunWithWarnFlag, s.runWithWarnFlag)
			sc.Step(stepExitsSuccessfully, s.exitsSuccessfully)
			sc.Step(stepExitsWithFailure, s.exitsWithFailure)
			sc.Step(stepBcNoFindingsInOutput, s.noFindings)
			sc.Step(stepBcOutputMentionsOrphan, s.mentionsOrphan)
			sc.Step(stepBcOutputMentionsPhantom, s.mentionsPhantom)
			sc.Step(stepBcOutputMentionsMissingGlossary, s.mentionsMissingGlossary)
			sc.Step(stepBcOutputMentionsJournal, s.mentionsJournal)
			sc.Step(stepBcOutputMentionsMissingLayer, s.mentionsMissingLayer)
			sc.Step(stepBcOutputMentionsInfrastructure, s.mentionsInfrastructure)
			sc.Step(stepBcOutputContainsWarning, s.outputContainsWarning)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDirIntegBcValidate},
			TestingT: t,
			Tags:     "bc-validate",
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run integration feature tests")
	}
}
