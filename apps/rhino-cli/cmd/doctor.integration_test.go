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
)

var specsDoctorDir = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino-cli/doctor")
}()

// Scenario: All required tools are installed and versions match
// Scenario: A required tool is missing from the environment
// Scenario: A tool is installed but its version does not match the requirement
// Scenario: JSON output lists all tool check results

type doctorSteps struct {
	originalWd   string
	tmpDir       string
	originalPath string
	cmdErr       error
	cmdOutput    string
}

func (s *doctorSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	s.originalWd, _ = os.Getwd()
	s.tmpDir, _ = os.MkdirTemp("", "doctor-*")
	_ = os.MkdirAll(filepath.Join(s.tmpDir, ".git"), 0755)
	s.originalPath = os.Getenv("PATH")
	verbose = false
	quiet = false
	output = "text"
	_ = os.Chdir(s.tmpDir)
	return context.Background(), nil
}

func (s *doctorSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	_ = os.Chdir(s.originalWd)
	_ = os.RemoveAll(s.tmpDir)
	if s.originalPath != "" {
		_ = os.Setenv("PATH", s.originalPath)
	}
	return context.Background(), nil
}

// runToolVersion runs a binary with args and returns trimmed stdout or stderr output.
// Returns empty string if the binary is not found.
func runToolVersion(binary string, args ...string) string {
	cmd := exec.Command(binary, args...)
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out
	if err := cmd.Run(); err != nil {
		if _, lookErr := exec.LookPath(binary); lookErr != nil {
			return ""
		}
	}
	return strings.TrimSpace(out.String())
}

// detectNodeVersion returns the installed Node.js version (without the leading "v").
func detectNodeVersion() string {
	raw := runToolVersion("node", "--version")
	return strings.TrimPrefix(raw, "v")
}

// detectNpmVersion returns the installed npm version.
func detectNpmVersion() string {
	return runToolVersion("npm", "--version")
}

// detectJavaMajorVersion returns the installed Java major version (e.g. "21").
func detectJavaMajorVersion() string {
	// java -version writes to stderr
	cmd := exec.Command("java", "-version")
	var errBuf bytes.Buffer
	cmd.Stderr = &errBuf
	_ = cmd.Run()
	raw := errBuf.String()
	for _, line := range strings.Split(raw, "\n") {
		if strings.Contains(line, "version") {
			start := strings.Index(line, "\"")
			end := strings.LastIndex(line, "\"")
			if start != -1 && end != -1 && start != end {
				ver := line[start+1 : end]
				parts := strings.Split(ver, ".")
				if len(parts) > 0 && parts[0] != "" {
					if parts[0] == "1" && len(parts) > 1 {
						return parts[1]
					}
					return parts[0]
				}
			}
		}
	}
	return ""
}

// detectGoVersion returns the installed Go version (e.g. "1.24.2").
func detectGoVersion() string {
	raw := runToolVersion("go", "version")
	// "go version go1.24.2 linux/amd64"
	fields := strings.Fields(raw)
	for _, f := range fields {
		if strings.HasPrefix(f, "go") && len(f) > 2 {
			return strings.TrimPrefix(f, "go")
		}
	}
	return ""
}

// writeDoctorConfigFiles writes package.json, pom.xml, and go.mod into tmpDir
// using the provided version strings.
func writeDoctorConfigFiles(tmpDir, nodeVer, npmVer, javaMajor, goVer string) error {
	packageJSON := fmt.Sprintf(`{"name":"test","volta":{"node":%q,"npm":%q}}`, nodeVer, npmVer)
	if err := os.WriteFile(filepath.Join(tmpDir, "package.json"), []byte(packageJSON), 0644); err != nil {
		return fmt.Errorf("write package.json: %w", err)
	}

	if err := os.MkdirAll(filepath.Join(tmpDir, "apps", "organiclever-be"), 0755); err != nil {
		return fmt.Errorf("mkdir organiclever-be: %w", err)
	}
	pomXML := fmt.Sprintf(`<project><properties><java.version>%s</java.version></properties></project>`, javaMajor)
	if err := os.WriteFile(filepath.Join(tmpDir, "apps", "organiclever-be", "pom.xml"), []byte(pomXML), 0644); err != nil {
		return fmt.Errorf("write pom.xml: %w", err)
	}

	if err := os.MkdirAll(filepath.Join(tmpDir, "apps", "rhino-cli"), 0755); err != nil {
		return fmt.Errorf("mkdir rhino-cli: %w", err)
	}
	goMod := fmt.Sprintf("module foo\n\ngo %s\n", goVer)
	if err := os.WriteFile(filepath.Join(tmpDir, "apps", "rhino-cli", "go.mod"), []byte(goMod), 0644); err != nil {
		return fmt.Errorf("write go.mod: %w", err)
	}

	return nil
}

func (s *doctorSteps) allRequiredDevelopmentToolsArePresentWithMatchingVersions(t *testing.T) error {
	nodeVer := detectNodeVersion()
	npmVer := detectNpmVersion()
	javaMajor := detectJavaMajorVersion()
	goVer := detectGoVersion()

	if nodeVer == "" || npmVer == "" || javaMajor == "" || goVer == "" {
		t.Skip("one or more required tools not available in PATH — skipping scenario")
	}

	return writeDoctorConfigFiles(s.tmpDir, nodeVer, npmVer, javaMajor, goVer)
}

func (s *doctorSteps) aRequiredDevelopmentToolIsNotFoundInTheSystemPATH() error {
	// Create an empty bin dir so PATH resolution finds nothing
	emptyBin, err := os.MkdirTemp("", "empty-bin-*")
	if err != nil {
		return fmt.Errorf("create empty bin dir: %w", err)
	}
	_ = os.Setenv("PATH", emptyBin)

	// Write config files with dummy versions (tools won't be found anyway)
	return writeDoctorConfigFiles(s.tmpDir, "24.0.0", "11.0.0", "21", "1.24.0")
}

func (s *doctorSteps) aRequiredDevelopmentToolIsInstalledWithANonMatchingVersion() error {
	npmVer := detectNpmVersion()
	if npmVer == "" {
		npmVer = "11.0.0"
	}
	javaMajor := detectJavaMajorVersion()
	if javaMajor == "" {
		javaMajor = "21"
	}
	goVer := detectGoVersion()
	if goVer == "" {
		goVer = "1.24.0"
	}

	// Override node requirement to "1.0.0" — guaranteed mismatch regardless of installed version
	packageJSON := fmt.Sprintf(`{"name":"test","volta":{"node":"1.0.0","npm":%q}}`, npmVer)
	if err := os.WriteFile(filepath.Join(s.tmpDir, "package.json"), []byte(packageJSON), 0644); err != nil {
		return fmt.Errorf("write package.json: %w", err)
	}

	if err := os.MkdirAll(filepath.Join(s.tmpDir, "apps", "organiclever-be"), 0755); err != nil {
		return fmt.Errorf("mkdir organiclever-be: %w", err)
	}
	pomXML := fmt.Sprintf(`<project><properties><java.version>%s</java.version></properties></project>`, javaMajor)
	if err := os.WriteFile(filepath.Join(s.tmpDir, "apps", "organiclever-be", "pom.xml"), []byte(pomXML), 0644); err != nil {
		return fmt.Errorf("write pom.xml: %w", err)
	}

	if err := os.MkdirAll(filepath.Join(s.tmpDir, "apps", "rhino-cli"), 0755); err != nil {
		return fmt.Errorf("mkdir rhino-cli: %w", err)
	}
	goMod := fmt.Sprintf("module foo\n\ngo %s\n", goVer)
	if err := os.WriteFile(filepath.Join(s.tmpDir, "apps", "rhino-cli", "go.mod"), []byte(goMod), 0644); err != nil {
		return fmt.Errorf("write go.mod: %w", err)
	}

	return nil
}

func (s *doctorSteps) theDeveloperRunsTheDoctorCommand() error {
	buf := new(bytes.Buffer)
	doctorCmd.SetOut(buf)
	doctorCmd.SetErr(buf)
	s.cmdErr = doctorCmd.RunE(doctorCmd, []string{})
	s.cmdOutput = buf.String()
	return nil
}

func (s *doctorSteps) theDeveloperRunsTheDoctorCommandWithJSONOutput() error {
	output = "json"
	buf := new(bytes.Buffer)
	doctorCmd.SetOut(buf)
	doctorCmd.SetErr(buf)
	s.cmdErr = doctorCmd.RunE(doctorCmd, []string{})
	s.cmdOutput = buf.String()
	return nil
}

func (s *doctorSteps) theCommandDoctorExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected command to succeed but got error: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *doctorSteps) theCommandDoctorExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected command to fail but it succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *doctorSteps) theOutputReportsEachToolAsPassing() error {
	if !strings.Contains(s.cmdOutput, "Doctor Report") {
		return fmt.Errorf("expected output to contain 'Doctor Report' but got: %s", s.cmdOutput)
	}
	if strings.Contains(s.cmdOutput, "✗") {
		return fmt.Errorf("expected no missing tools (✗) in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *doctorSteps) theOutputIdentifiesTheMissingTool() error {
	if !strings.Contains(s.cmdOutput, "✗") && !strings.Contains(strings.ToLower(s.cmdOutput), "missing") {
		return fmt.Errorf("expected output to identify missing tool (✗ or 'missing') but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *doctorSteps) theOutputReportsTheToolAsAWarningRatherThanAFailure() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected command to exit successfully (warnings don't fail) but got: %v", s.cmdErr)
	}
	if !strings.Contains(s.cmdOutput, "⚠") && !strings.Contains(strings.ToLower(s.cmdOutput), "warning") {
		return fmt.Errorf("expected output to contain warning indicator (⚠ or 'warning') but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *doctorSteps) theOutputIsValidDoctorJSON() error {
	var parsed map[string]any
	if err := json.Unmarshal([]byte(s.cmdOutput), &parsed); err != nil {
		return fmt.Errorf("output is not valid JSON: %v\nOutput: %s", err, s.cmdOutput)
	}
	return nil
}

func (s *doctorSteps) theJSONListsEveryCheckedToolWithItsStatus() error {
	var parsed map[string]any
	if err := json.Unmarshal([]byte(s.cmdOutput), &parsed); err != nil {
		return fmt.Errorf("output is not valid JSON: %v\nOutput: %s", err, s.cmdOutput)
	}
	tools, ok := parsed["tools"].([]any)
	if !ok {
		return fmt.Errorf("expected 'tools' array in JSON but got: %s", s.cmdOutput)
	}
	if len(tools) != 7 {
		return fmt.Errorf("expected 7 tools in JSON output, got %d\nOutput: %s", len(tools), s.cmdOutput)
	}
	return nil
}

// InitializeDoctorScenario registers all step definitions.
func InitializeDoctorScenario(sc *godog.ScenarioContext) {
	s := &doctorSteps{}
	sc.Before(s.before)
	sc.After(s.after)

	// The step "all required development tools are present with matching versions"
	// needs access to *testing.T for t.Skip. godog passes the scenario context;
	// we use a closure that captures t from the TestIntegrationDoctor runner.
	// godog does not expose *testing.T in step funcs, so we use a workaround:
	// register the step as a no-op here and override it inside the test function.
	sc.Step(`^all required development tools are present with matching versions$`,
		func(ctx context.Context) (context.Context, error) {
			// This placeholder is overridden below via the tWrapper approach.
			// Returning an error here would fail every scenario — so we return nil
			// and rely on the test-level registration to replace it.
			return ctx, nil
		})
	sc.Step(`^a required development tool is not found in the system PATH$`, s.aRequiredDevelopmentToolIsNotFoundInTheSystemPATH)
	sc.Step(`^a required development tool is installed with a non-matching version$`, s.aRequiredDevelopmentToolIsInstalledWithANonMatchingVersion)
	sc.Step(`^the developer runs the doctor command$`, s.theDeveloperRunsTheDoctorCommand)
	sc.Step(`^the developer runs the doctor command with JSON output$`, s.theDeveloperRunsTheDoctorCommandWithJSONOutput)
	sc.Step(`^the command exits successfully$`, s.theCommandDoctorExitsSuccessfully)
	sc.Step(`^the command exits with a failure code$`, s.theCommandDoctorExitsWithAFailureCode)
	sc.Step(`^the output reports each tool as passing$`, s.theOutputReportsEachToolAsPassing)
	sc.Step(`^the output identifies the missing tool$`, s.theOutputIdentifiesTheMissingTool)
	sc.Step(`^the output reports the tool as a warning rather than a failure$`, s.theOutputReportsTheToolAsAWarningRatherThanAFailure)
	sc.Step(`^the output is valid JSON$`, s.theOutputIsValidDoctorJSON)
	sc.Step(`^the JSON lists every checked tool with its status$`, s.theJSONListsEveryCheckedToolWithItsStatus)
}

func TestIntegrationDoctor(t *testing.T) {
	s := &doctorSteps{}

	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Before(s.before)
			sc.After(s.after)

			sc.Step(`^all required development tools are present with matching versions$`,
				func() error {
					return s.allRequiredDevelopmentToolsArePresentWithMatchingVersions(t)
				})
			sc.Step(`^a required development tool is not found in the system PATH$`, s.aRequiredDevelopmentToolIsNotFoundInTheSystemPATH)
			sc.Step(`^a required development tool is installed with a non-matching version$`, s.aRequiredDevelopmentToolIsInstalledWithANonMatchingVersion)
			sc.Step(`^the developer runs the doctor command$`, s.theDeveloperRunsTheDoctorCommand)
			sc.Step(`^the developer runs the doctor command with JSON output$`, s.theDeveloperRunsTheDoctorCommandWithJSONOutput)
			sc.Step(`^the command exits successfully$`, s.theCommandDoctorExitsSuccessfully)
			sc.Step(`^the command exits with a failure code$`, s.theCommandDoctorExitsWithAFailureCode)
			sc.Step(`^the output reports each tool as passing$`, s.theOutputReportsEachToolAsPassing)
			sc.Step(`^the output identifies the missing tool$`, s.theOutputIdentifiesTheMissingTool)
			sc.Step(`^the output reports the tool as a warning rather than a failure$`, s.theOutputReportsTheToolAsAWarningRatherThanAFailure)
			sc.Step(`^the output is valid JSON$`, s.theOutputIsValidDoctorJSON)
			sc.Step(`^the JSON lists every checked tool with its status$`, s.theJSONListsEveryCheckedToolWithItsStatus)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDoctorDir},
			TestingT: t,
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run feature tests")
	}
}
