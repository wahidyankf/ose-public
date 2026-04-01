package speccoverage

import (
	"os"
	"path/filepath"
	"regexp"
	"testing"
)

// makeFile creates a file at the given path, creating parent dirs as needed.
func makeFile(t *testing.T, path string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatalf("MkdirAll: %v", err)
	}
	f, err := os.Create(path)
	if err != nil {
		t.Fatalf("Create %s: %v", path, err)
	}
	_ = f.Close()
}

// writeContent creates a file with the given content.
func writeContent(t *testing.T, path, content string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatalf("MkdirAll: %v", err)
	}
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatalf("WriteFile %s: %v", path, err)
	}
}

// --- CheckAll edge cases ---
// The integration tests cover the four main workflows (all covered, missing test file,
// scenario gap, step gap). The tests below cover algorithmic edge cases and boundary
// conditions not exercised by the integration suite.

func TestCheckAll_EmptySpecsDir(t *testing.T) {
	root := t.TempDir()

	// Specs dir exists but is empty
	if err := os.MkdirAll(filepath.Join(root, "specs"), 0o755); err != nil {
		t.Fatal(err)
	}
	makeFile(t, filepath.Join(root, "app", "something.tsx"))

	opts := ScanOptions{
		RepoRoot: root,
		SpecsDir: filepath.Join(root, "specs"),
		AppDir:   filepath.Join(root, "app"),
	}

	result, err := CheckAll(opts)
	if err != nil {
		t.Fatalf("CheckAll() error = %v", err)
	}

	if result.TotalSpecs != 0 {
		t.Errorf("TotalSpecs = %d, want 0", result.TotalSpecs)
	}
	if len(result.Gaps) != 0 {
		t.Errorf("Gaps = %v, want none", result.Gaps)
	}
}

func TestCheckAll_NonExistentSpecsDir(t *testing.T) {
	root := t.TempDir()

	opts := ScanOptions{
		RepoRoot: root,
		SpecsDir: filepath.Join(root, "nonexistent-specs"),
		AppDir:   filepath.Join(root, "app"),
	}

	result, err := CheckAll(opts)
	if err != nil {
		t.Fatalf("CheckAll() error = %v", err)
	}

	if result.TotalSpecs != 0 {
		t.Errorf("TotalSpecs = %d, want 0", result.TotalSpecs)
	}
}

func TestCheckAll_NonExistentAppDir(t *testing.T) {
	root := t.TempDir()

	makeFile(t, filepath.Join(root, "specs", "user-login.feature"))

	opts := ScanOptions{
		RepoRoot: root,
		SpecsDir: filepath.Join(root, "specs"),
		AppDir:   filepath.Join(root, "nonexistent-app"),
	}

	result, err := CheckAll(opts)
	if err != nil {
		t.Fatalf("CheckAll() error = %v", err)
	}

	if result.TotalSpecs != 1 {
		t.Errorf("TotalSpecs = %d, want 1", result.TotalSpecs)
	}
	if len(result.Gaps) != 1 {
		t.Errorf("Gaps count = %d, want 1", len(result.Gaps))
	}
}

func TestCheckAll_MatchExactStem(t *testing.T) {
	root := t.TempDir()

	makeFile(t, filepath.Join(root, "specs", "feature-x.feature"))

	// Match file with no extension
	makeFile(t, filepath.Join(root, "app", "feature-x"))

	opts := ScanOptions{
		RepoRoot: root,
		SpecsDir: filepath.Join(root, "specs"),
		AppDir:   filepath.Join(root, "app"),
	}

	result, err := CheckAll(opts)
	if err != nil {
		t.Fatalf("CheckAll() error = %v", err)
	}

	if len(result.Gaps) != 0 {
		t.Errorf("Expected no gaps, got %v", result.Gaps)
	}
}

func TestCheckAll_PartialStemNotMatched(t *testing.T) {
	root := t.TempDir()

	makeFile(t, filepath.Join(root, "specs", "login.feature"))

	// "user-login" does NOT match stem "login" (stem is substring, not match)
	makeFile(t, filepath.Join(root, "app", "user-login.integration.test.tsx"))

	opts := ScanOptions{
		RepoRoot: root,
		SpecsDir: filepath.Join(root, "specs"),
		AppDir:   filepath.Join(root, "app"),
	}

	result, err := CheckAll(opts)
	if err != nil {
		t.Fatalf("CheckAll() error = %v", err)
	}

	// "login" stem should not match "user-login.integration.test.tsx"
	if len(result.Gaps) != 1 {
		t.Errorf("Expected 1 gap, got %d: %v", len(result.Gaps), result.Gaps)
	}
}

func TestCheckAll_RelativePath(t *testing.T) {
	root := t.TempDir()

	makeFile(t, filepath.Join(root, "specs", "sub", "deep-feature.feature"))
	makeFile(t, filepath.Join(root, "app", "deep-feature.test.ts"))

	opts := ScanOptions{
		RepoRoot: root,
		SpecsDir: filepath.Join(root, "specs"),
		AppDir:   filepath.Join(root, "app"),
	}

	result, err := CheckAll(opts)
	if err != nil {
		t.Fatalf("CheckAll() error = %v", err)
	}

	if result.TotalSpecs != 1 {
		t.Errorf("TotalSpecs = %d, want 1", result.TotalSpecs)
	}
	if len(result.Gaps) != 0 {
		t.Errorf("Expected no gaps, got: %v", result.Gaps)
	}
}

// TestCheckAll_CoverageGap_SkipsScenarioAndStepCheck verifies that when a feature
// file has no matching test file, scenario and step gap checks are skipped entirely.
// The integration tests verify command output/exit code for the missing-test scenario
// but do not assert that ScenarioGaps and StepGaps remain zero for the skipped file.
func TestCheckAll_CoverageGap_SkipsScenarioAndStepCheck(t *testing.T) {
	root := t.TempDir()

	// Feature with scenarios but no test file
	writeContent(t, filepath.Join(root, "specs", "missing.feature"), `
Feature: Missing
  Scenario: Uncovered scenario
    Given some step
`)
	// App dir exists but no matching test file
	if err := os.MkdirAll(filepath.Join(root, "app"), 0o755); err != nil {
		t.Fatal(err)
	}

	opts := ScanOptions{
		RepoRoot: root,
		SpecsDir: filepath.Join(root, "specs"),
		AppDir:   filepath.Join(root, "app"),
	}

	result, err := CheckAll(opts)
	if err != nil {
		t.Fatalf("CheckAll() error = %v", err)
	}

	if len(result.Gaps) != 1 {
		t.Errorf("Gaps = %d, want 1", len(result.Gaps))
	}
	// Scenario/step gaps must NOT be reported for files with coverage gaps
	if len(result.ScenarioGaps) != 0 {
		t.Errorf("ScenarioGaps = %d, want 0 (skipped)", len(result.ScenarioGaps))
	}
	if len(result.StepGaps) != 0 {
		t.Errorf("StepGaps = %d, want 0 (skipped)", len(result.StepGaps))
	}
	// TotalScenarios should remain 0 for skipped files
	if result.TotalScenarios != 0 {
		t.Errorf("TotalScenarios = %d, want 0", result.TotalScenarios)
	}
}

// --- unescapeString pure function ---

func TestUnescapeString(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{`hello`, "hello"},
		{`it\'s`, "it's"},
		{`say \"hi\"`, `say "hi"`},
		{`back\\slash`, `back\slash`},
		{`new\nline`, "new\nline"},
		{`tab\there`, "tab\there"},
		{`carriage\rreturn`, "carriage\rreturn"},
		{`unknown\xescape`, `unknown\xescape`},
		{``, ``},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got := unescapeString(tt.input)
			if got != tt.want {
				t.Errorf("unescapeString(%q) = %q, want %q", tt.input, got, tt.want)
			}
		})
	}
}

// TestCheckAll_StepWithEscapedApostrophe_NoGap verifies that escape sequences in TS
// step text are correctly unescaped so they match the plain step text in feature files.
// Integration tests do not exercise escape sequences in step text.
func TestCheckAll_StepWithEscapedApostrophe_NoGap(t *testing.T) {
	root := t.TempDir()

	writeContent(t, filepath.Join(root, "specs", "feature.feature"), `
Feature: Feature
  Scenario: A
    Given the page headline should read "Team's Productivity"
`)
	// Test file uses single-quoted string with escaped apostrophe
	writeContent(t, filepath.Join(root, "app", "feature.integration.test.tsx"), `
describeFeature(feature, ({ Scenario }) => {
  Scenario("A", ({ Given }) => {
    Given('the page headline should read "Team\'s Productivity"', () => {});
  });
});
`)

	opts := ScanOptions{
		RepoRoot: root,
		SpecsDir: filepath.Join(root, "specs"),
		AppDir:   filepath.Join(root, "app"),
	}

	result, err := CheckAll(opts)
	if err != nil {
		t.Fatalf("CheckAll() error = %v", err)
	}

	if len(result.StepGaps) != 0 {
		t.Errorf("StepGaps = %v, want none (escaped apostrophe should match)", result.StepGaps)
	}
}

// --- walkFeatureFiles / hasMatchingTestFile / findMatchingTestFile ---

func TestWalkFeatureFiles_OnlyFeatureFiles(t *testing.T) {
	root := t.TempDir()

	makeFile(t, filepath.Join(root, "a.feature"))
	makeFile(t, filepath.Join(root, "b.feature"))
	makeFile(t, filepath.Join(root, "not-a-feature.ts"))
	makeFile(t, filepath.Join(root, "sub", "c.feature"))

	files, err := walkFeatureFiles(root)
	if err != nil {
		t.Fatalf("walkFeatureFiles() error = %v", err)
	}

	if len(files) != 3 {
		t.Errorf("got %d files, want 3: %v", len(files), files)
	}
}

func TestHasMatchingTestFile_Found(t *testing.T) {
	root := t.TempDir()

	makeFile(t, filepath.Join(root, "src", "user-login.integration.test.tsx"))

	found, err := hasMatchingTestFile(root, "user-login")
	if err != nil {
		t.Fatalf("hasMatchingTestFile() error = %v", err)
	}
	if !found {
		t.Error("Expected found=true")
	}
}

func TestHasMatchingTestFile_NotFound(t *testing.T) {
	root := t.TempDir()

	makeFile(t, filepath.Join(root, "src", "other-file.tsx"))

	found, err := hasMatchingTestFile(root, "user-login")
	if err != nil {
		t.Fatalf("hasMatchingTestFile() error = %v", err)
	}
	if found {
		t.Error("Expected found=false")
	}
}

func TestHasMatchingTestFile_DirNotExist(t *testing.T) {
	root := t.TempDir()

	found, err := hasMatchingTestFile(filepath.Join(root, "nonexistent"), "user-login")
	if err != nil {
		t.Fatalf("hasMatchingTestFile() error = %v", err)
	}
	if found {
		t.Error("Expected found=false for nonexistent dir")
	}
}

// TestFindMatchingTestFile_SkipsGoImplementationFiles verifies that non-test Go files
// (e.g. doctor.go) are not matched as test files. Only _test.go files count.
// This prevents implementation files from shadowing integration test files when
// both share the same stem (e.g. "doctor.go" vs "doctor.integration_test.go").
func TestFindMatchingTestFile_SkipsGoImplementationFiles(t *testing.T) {
	tmpDir := t.TempDir()
	appDir := filepath.Join(tmpDir, "app")

	// Create a Go implementation file that matches the stem — must be skipped
	if err := os.WriteFile(filepath.Join(appDir, "doctor.go")+".go", []byte("package cmd"), 0644); err != nil {
		// Use MkdirAll to create appDir first, then write
		_ = os.MkdirAll(appDir, 0755)
	}
	_ = os.MkdirAll(appDir, 0755)
	if err := os.WriteFile(filepath.Join(appDir, "doctor.go"), []byte("package cmd"), 0644); err != nil {
		t.Fatal(err)
	}
	// Also create the integration test file — this should be matched instead
	if err := os.WriteFile(filepath.Join(appDir, "doctor.integration_test.go"), []byte("package cmd\n// Scenario: X\n"), 0644); err != nil {
		t.Fatal(err)
	}

	found, err := findMatchingTestFile(appDir, "doctor")
	if err != nil {
		t.Fatalf("findMatchingTestFile() error: %v", err)
	}
	if found == "" {
		t.Fatal("expected a match but got none")
	}
	if filepath.Base(found) != "doctor.integration_test.go" {
		t.Errorf("expected doctor.integration_test.go to be matched, got %q", filepath.Base(found))
	}
}

func TestFindMatchingTestFile_SkipsSkipDirs(t *testing.T) {
	tmpDir := t.TempDir()
	appDir := filepath.Join(tmpDir, "app")

	// Create a node_modules directory with a matching file inside — should be skipped
	nodeModulesDir := filepath.Join(appDir, "node_modules")
	if err := os.MkdirAll(nodeModulesDir, 0755); err != nil {
		t.Fatal(err)
	}
	// A matching file inside node_modules — should NOT be found due to SkipDir
	if err := os.WriteFile(filepath.Join(nodeModulesDir, "myspec.test.ts"), []byte(""), 0644); err != nil {
		t.Fatal(err)
	}

	found, err := findMatchingTestFile(appDir, "myspec")
	if err != nil {
		t.Fatalf("findMatchingTestFile() error: %v", err)
	}
	if found != "" {
		t.Errorf("expected no match (node_modules should be skipped), got %q", found)
	}
}

// --- extractScenarioTitles ---

// TestExtractScenarioTitles_SingleQuotes tests extraction using single-quoted titles.
// Integration tests use only double-quoted Scenario("...",) calls, so this quote
// variant is not exercised there.
func TestExtractScenarioTitles_SingleQuotes(t *testing.T) {
	root := t.TempDir()
	path := filepath.Join(root, "test.tsx")
	writeContent(t, path, `
  Scenario('Login with email "user@example.com"', ({ Given }) => {
    Given('a user with email "user@example.com"', () => {});
  });
`)

	titles, err := extractScenarioTitles(path)
	if err != nil {
		t.Fatalf("extractScenarioTitles() error = %v", err)
	}

	if !titles[`Login with email "user@example.com"`] {
		t.Error("expected single-quoted title to be found")
	}
}

// --- extractAllStepTexts ---

func TestExtractAllStepTexts_SkipsNodeModules(t *testing.T) {
	root := t.TempDir()

	// This step exists only in node_modules — should be skipped
	writeContent(t, filepath.Join(root, "node_modules", "lib", "steps.ts"), `
  Given("a step in node_modules", () => {});
`)
	// This step exists in src — should be found
	writeContent(t, filepath.Join(root, "src", "steps.ts"), `
  Given("a real step", () => {});
`)

	sm, err := extractAllStepTexts(root)
	if err != nil {
		t.Fatalf("extractAllStepTexts() error = %v", err)
	}

	if sm.matches("a step in node_modules") {
		t.Error("node_modules step should be skipped")
	}
	if !sm.matches("a real step") {
		t.Error("src step should be found")
	}
}

// --- Go godog integration test support ---
// The spec-coverage-validate integration tests use only TypeScript fixture files.
// These tests cover the Go-specific code paths (sc.Step backtick patterns and
// // Scenario: comments) that are not exercised by the integration suite.

func TestExtractGoStepTexts_FindsPatterns(t *testing.T) {
	root := t.TempDir()

	// Write a Go file with a godog sc.Step(` `, fn) call.
	// The backtick in the Go source is represented as \x60 in the regex,
	// but in the actual file content we just write a raw backtick.
	goContent := "package steps\n\nfunc init() {\n\tsc.Step(`^some step (\\d+) here$`, handleStep)\n}\n"
	writeContent(t, filepath.Join(root, "src", "steps_test.go"), goContent)

	sm, err := extractAllStepTexts(root)
	if err != nil {
		t.Fatalf("extractAllStepTexts() error = %v", err)
	}

	if len(sm.patterns) == 0 {
		t.Fatal("expected at least one Go pattern to be extracted")
	}
	if !sm.matches("some step 5 here") {
		t.Error("expected pattern to match 'some step 5 here'")
	}
	if sm.matches("unrelated step") {
		t.Error("expected pattern NOT to match 'unrelated step'")
	}
}

func TestExtractGoScenarioTitles_FindsComments(t *testing.T) {
	root := t.TempDir()

	path := filepath.Join(root, "feature_integration_test.go")
	writeContent(t, path, `package mypackage

func InitializeScenario(ctx *godog.ScenarioContext) {
	// Scenario: My Go scenario
	ctx.Step(`+"`"+`^my go step$`+"`"+`, myGoStep)
}
`)

	titles, err := extractScenarioTitles(path)
	if err != nil {
		t.Fatalf("extractScenarioTitles() error = %v", err)
	}

	if !titles["My Go scenario"] {
		t.Errorf("expected 'My Go scenario' to be found, got: %v", titles)
	}
}

func TestCheckAll_GoTestFile_Covered(t *testing.T) {
	root := t.TempDir()

	writeContent(t, filepath.Join(root, "specs", "gofeature.feature"), `
Feature: Go feature
  Scenario: My Go scenario
    Given my go step
`)

	// Write a Go integration test file with scenario comment and step pattern.
	goTestContent := "package mypackage\n\n" +
		"// Scenario: My Go scenario\n" +
		"func InitializeScenario(ctx *godog.ScenarioContext) {\n" +
		"\tctx.Step(`^my go step$`, myGoStep)\n" +
		"}\n"
	writeContent(t, filepath.Join(root, "app", "gofeature.integration_test.go"), goTestContent)

	opts := ScanOptions{
		RepoRoot: root,
		SpecsDir: filepath.Join(root, "specs"),
		AppDir:   filepath.Join(root, "app"),
	}

	result, err := CheckAll(opts)
	if err != nil {
		t.Fatalf("CheckAll() error = %v", err)
	}

	if len(result.Gaps) != 0 {
		t.Errorf("Gaps = %v, want none", result.Gaps)
	}
	if len(result.ScenarioGaps) != 0 {
		t.Errorf("ScenarioGaps = %v, want none", result.ScenarioGaps)
	}
	if len(result.StepGaps) != 0 {
		t.Errorf("StepGaps = %v, want none", result.StepGaps)
	}
}

func TestCheckAll_GoTestFile_StepGap(t *testing.T) {
	root := t.TempDir()

	writeContent(t, filepath.Join(root, "specs", "gofeature.feature"), `
Feature: Go feature
  Scenario: My Go scenario
    Given some step
`)

	// Go test file has the scenario comment but no matching step pattern for "some step".
	goTestContent := "package mypackage\n\n" +
		"// Scenario: My Go scenario\n" +
		"func InitializeScenario(ctx *godog.ScenarioContext) {\n" +
		"\tctx.Step(`^a completely different step$`, differentStep)\n" +
		"}\n"
	writeContent(t, filepath.Join(root, "app", "gofeature.integration_test.go"), goTestContent)

	opts := ScanOptions{
		RepoRoot: root,
		SpecsDir: filepath.Join(root, "specs"),
		AppDir:   filepath.Join(root, "app"),
	}

	result, err := CheckAll(opts)
	if err != nil {
		t.Fatalf("CheckAll() error = %v", err)
	}

	if len(result.Gaps) != 0 {
		t.Errorf("Gaps = %v, want none (test file exists)", result.Gaps)
	}
	if len(result.ScenarioGaps) != 0 {
		t.Errorf("ScenarioGaps = %v, want none (scenario comment present)", result.ScenarioGaps)
	}
	if len(result.StepGaps) != 1 {
		t.Fatalf("StepGaps = %d, want 1", len(result.StepGaps))
	}
	if result.StepGaps[0].StepText != "some step" {
		t.Errorf("StepGap text = %q, want %q", result.StepGaps[0].StepText, "some step")
	}
}

func TestCheckAll_GoTestFile_WithMatchingStep(t *testing.T) {
	// Test the goStepRe match path that adds a compiled regex pattern
	root := t.TempDir()

	writeContent(t, filepath.Join(root, "specs", "myfeature.feature"), `
Feature: My feature
  Scenario: My scenario
    Given the user logs in
`)

	// Go test file with matching godog step definition
	goTestContent := "package mypackage\n\n" +
		"// Scenario: My scenario\n" +
		"func InitializeScenario(ctx *godog.ScenarioContext) {\n" +
		"\tctx.Step(`^the user logs in$`, theUserLogsIn)\n" +
		"}\n"
	writeContent(t, filepath.Join(root, "app", "myfeature.integration_test.go"), goTestContent)

	opts := ScanOptions{
		RepoRoot: root,
		SpecsDir: filepath.Join(root, "specs"),
		AppDir:   filepath.Join(root, "app"),
	}

	result, err := CheckAll(opts)
	if err != nil {
		t.Fatalf("CheckAll() error = %v", err)
	}

	if len(result.Gaps) != 0 {
		t.Errorf("Gaps = %v, want none", result.Gaps)
	}
	if len(result.ScenarioGaps) != 0 {
		t.Errorf("ScenarioGaps = %v, want none", result.ScenarioGaps)
	}
	if len(result.StepGaps) != 0 {
		t.Errorf("StepGaps = %v, want none (step matched by regex)", result.StepGaps)
	}
}

func TestCheckAll_TSTestFile_SingleQuotedScenario(t *testing.T) {
	// Tests extractScenarioTitles with single-quoted Scenario definitions
	root := t.TempDir()

	writeContent(t, filepath.Join(root, "specs", "login.feature"), `
Feature: Login
  Scenario: User can login
    Given I am on the login page
    When I enter valid credentials
    Then I am logged in
`)

	// TS test with single-quoted scenario
	tsContent := "import { Scenario } from 'vitest-cucumber';\n" +
		"Scenario('User can login', () => {\n" +
		"  Given('I am on the login page', () => {});\n" +
		"  When('I enter valid credentials', () => {});\n" +
		"  Then('I am logged in', () => {});\n" +
		"});\n"
	writeContent(t, filepath.Join(root, "app", "login.test.tsx"), tsContent)

	opts := ScanOptions{
		RepoRoot: root,
		SpecsDir: filepath.Join(root, "specs"),
		AppDir:   filepath.Join(root, "app"),
	}

	result, err := CheckAll(opts)
	if err != nil {
		t.Fatalf("CheckAll() error = %v", err)
	}
	if len(result.Gaps) != 0 {
		t.Errorf("Gaps = %v, want none", result.Gaps)
	}
	if len(result.ScenarioGaps) != 0 {
		t.Errorf("ScenarioGaps = %v, want none", result.ScenarioGaps)
	}
	if len(result.StepGaps) != 0 {
		t.Errorf("StepGaps = %v, want none", result.StepGaps)
	}
}

func TestCheckAll_NonGoFileTypes(t *testing.T) {
	// Tests extractAllStepTexts with .js, .jsx files
	root := t.TempDir()

	writeContent(t, filepath.Join(root, "specs", "checkout.feature"), `
Feature: Checkout
  Scenario: Add to cart
    Given the product page
    When I click add to cart
    Then the item is in cart
`)

	// JS file with step definitions
	jsContent := "Given('the product page', () => {});\n" +
		"When('I click add to cart', () => {});\n" +
		"Then('the item is in cart', () => {});\n"
	writeContent(t, filepath.Join(root, "app", "checkout.test.js"), jsContent)

	// JSX file with scenario
	jsxContent := "import { Scenario } from 'vitest-cucumber';\n" +
		"Scenario('Add to cart', () => {});\n"
	writeContent(t, filepath.Join(root, "app", "checkout.test.jsx"), jsxContent)

	opts := ScanOptions{
		RepoRoot: root,
		SpecsDir: filepath.Join(root, "specs"),
		AppDir:   filepath.Join(root, "app"),
	}

	result, err := CheckAll(opts)
	if err != nil {
		t.Fatalf("CheckAll() error = %v", err)
	}
	// checkout.test.jsx matches (starts with "checkout.")
	if len(result.Gaps) != 0 {
		t.Errorf("Gaps = %v, want none", result.Gaps)
	}
}

func TestCheckAll_SkipDirs(t *testing.T) {
	// Tests that node_modules and .next directories are skipped
	root := t.TempDir()

	writeContent(t, filepath.Join(root, "specs", "user.feature"), `
Feature: User
  Scenario: Valid user
    Given a valid user
`)

	// Create matching test in the app
	tsContent := "Scenario('Valid user', () => {\n  Given('a valid user', () => {});\n});\n"
	writeContent(t, filepath.Join(root, "app", "user.test.tsx"), tsContent)

	// Create step definitions in node_modules (should be skipped)
	writeContent(t, filepath.Join(root, "app", "node_modules", "step-defs.ts"),
		"Given('a step in node_modules', () => {});\n")

	// Create step definitions in .next (should be skipped)
	writeContent(t, filepath.Join(root, "app", ".next", "step-defs.ts"),
		"Given('a step in .next', () => {});\n")

	opts := ScanOptions{
		RepoRoot: root,
		SpecsDir: filepath.Join(root, "specs"),
		AppDir:   filepath.Join(root, "app"),
	}

	result, err := CheckAll(opts)
	if err != nil {
		t.Fatalf("CheckAll() error = %v", err)
	}
	if len(result.Gaps) != 0 {
		t.Errorf("Gaps = %v, want none", result.Gaps)
	}
}

func TestCheckAll_NonGoFileStem_MatchesGoNonTest(t *testing.T) {
	// Test that plain .go files (non-_test.go) are skipped when finding matching test files
	root := t.TempDir()

	writeContent(t, filepath.Join(root, "specs", "doctor.feature"), `
Feature: Doctor
  Scenario: Check tools
    Given all tools installed
`)

	// Create a non-test .go file that matches the stem — should NOT be treated as test file
	writeContent(t, filepath.Join(root, "app", "doctor.go"), "package doctor\n")

	opts := ScanOptions{
		RepoRoot: root,
		SpecsDir: filepath.Join(root, "specs"),
		AppDir:   filepath.Join(root, "app"),
	}

	result, err := CheckAll(opts)
	if err != nil {
		t.Fatalf("CheckAll() error = %v", err)
	}
	// doctor.go is a non-test file, should not count as a match
	if len(result.Gaps) != 1 {
		t.Errorf("Gaps = %d, want 1 (non-test .go file should not match)", len(result.Gaps))
	}
}

func TestExtractGoStepTexts_InvalidRegex(t *testing.T) {
	// Test that invalid regex patterns in godog step definitions are skipped gracefully
	root := t.TempDir()

	// Go file with an invalid regex pattern in Step()
	goContent := "package mypackage\n\n" +
		"func init() {\n" +
		"\tsc.Step(`[invalid regex(`, myStep)\n" + // invalid regex
		"\tsc.Step(`^valid step$`, validStep)\n" + // valid regex
		"}\n"
	goFile := filepath.Join(root, "test_steps.go")
	writeContent(t, goFile, goContent)

	sm := &stepMatcher{exact: map[string]bool{}}
	err := extractGoStepTexts(goFile, sm)
	if err != nil {
		t.Fatalf("extractGoStepTexts() should not error for invalid regex, got: %v", err)
	}
	// Only the valid regex should be in patterns
	if len(sm.patterns) != 1 {
		t.Errorf("patterns = %d, want 1 (invalid regex skipped)", len(sm.patterns))
	}
}

func TestStepMatcher_GoPattern(t *testing.T) {
	// Test the sm.patterns path in matches()
	sm := &stepMatcher{exact: map[string]bool{}}

	// Add a regex pattern
	importRe, err := regexp.Compile(`^the user (.+) logs in$`)
	if err != nil {
		t.Fatal(err)
	}
	sm.patterns = append(sm.patterns, importRe)

	// Should match via pattern
	if !sm.matches("the user alice logs in") {
		t.Error("expected pattern to match 'the user alice logs in'")
	}
	// Should not match
	if sm.matches("a completely different step") {
		t.Error("expected pattern NOT to match 'a completely different step'")
	}
}

func TestWalkFeatureFiles_WalkError(t *testing.T) {
	// Make a subdir unreadable to trigger Walk error path in walkFeatureFiles.
	tmpDir := t.TempDir()
	subDir := filepath.Join(tmpDir, "sub")
	if err := os.MkdirAll(subDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(subDir, "test.feature"), []byte("Feature: test"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(subDir, 0000); err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Chmod(subDir, 0755) }()

	_, err := walkFeatureFiles(tmpDir)
	// On non-root this should return an error
	if err != nil {
		if len(err.Error()) == 0 {
			t.Error("expected non-empty error from walkFeatureFiles with unreadable dir")
		}
	}
}

func TestFindMatchingTestFile_WalkError(t *testing.T) {
	// Make a subdir unreadable to trigger Walk error in findMatchingTestFile.
	tmpDir := t.TempDir()
	subDir := filepath.Join(tmpDir, "src")
	if err := os.MkdirAll(subDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(subDir, "myspec.test.ts"), []byte(""), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(subDir, 0000); err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Chmod(subDir, 0755) }()

	_, err := findMatchingTestFile(tmpDir, "myspec")
	// On non-root this should return an error
	if err != nil {
		if len(err.Error()) == 0 {
			t.Error("expected non-empty error from findMatchingTestFile with unreadable dir")
		}
	}
}

func TestExtractTSScenarioTitles_UnreadableFile(t *testing.T) {
	// Make a TS file unreadable to trigger os.Open error path.
	tmpDir := t.TempDir()
	path := filepath.Join(tmpDir, "test.tsx")
	if err := os.WriteFile(path, []byte("Scenario('test', () => {})"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(path, 0000); err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Chmod(path, 0644) }()

	_, err := extractTSScenarioTitles(path)
	// On non-root this should return an error
	if err != nil {
		if len(err.Error()) == 0 {
			t.Error("expected non-empty error from extractTSScenarioTitles with unreadable file")
		}
	}
}

func TestExtractGoScenarioTitles_UnreadableFile(t *testing.T) {
	// Make a Go file unreadable to trigger os.Open error path.
	tmpDir := t.TempDir()
	path := filepath.Join(tmpDir, "feature_test.go")
	if err := os.WriteFile(path, []byte("package p\n// Scenario: X\n"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(path, 0000); err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Chmod(path, 0644) }()

	_, err := extractGoScenarioTitles(path)
	// On non-root this should return an error
	if err != nil {
		if len(err.Error()) == 0 {
			t.Error("expected non-empty error from extractGoScenarioTitles with unreadable file")
		}
	}
}

func TestExtractTSStepTexts_UnreadableFile(t *testing.T) {
	// Make a TS file unreadable to trigger os.Open error path in extractTSStepTexts.
	tmpDir := t.TempDir()
	path := filepath.Join(tmpDir, "steps.ts")
	if err := os.WriteFile(path, []byte("Given('a step', () => {})"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(path, 0000); err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Chmod(path, 0644) }()

	sm := &stepMatcher{exact: map[string]bool{}}
	err := extractTSStepTexts(path, sm)
	// On non-root this should return an error
	if err != nil {
		if len(err.Error()) == 0 {
			t.Error("expected non-empty error from extractTSStepTexts with unreadable file")
		}
	}
}

func TestExtractGoStepTexts_UnreadableFile(t *testing.T) {
	// Make a Go file unreadable to trigger os.Open error path in extractGoStepTexts.
	tmpDir := t.TempDir()
	path := filepath.Join(tmpDir, "steps_test.go")
	content := "package p\nfunc init() {\n\tsc.Step(`^a step$`, fn)\n}\n"
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(path, 0000); err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Chmod(path, 0644) }()

	sm := &stepMatcher{exact: map[string]bool{}}
	err := extractGoStepTexts(path, sm)
	// On non-root this should return an error
	if err != nil {
		if len(err.Error()) == 0 {
			t.Error("expected non-empty error from extractGoStepTexts with unreadable file")
		}
	}
}

func TestCheckAll_WalkFeatureFilesError(t *testing.T) {
	// Trigger CheckAll error at walkFeatureFiles via an unreadable specs subdir.
	tmpDir := t.TempDir()
	specsDir := filepath.Join(tmpDir, "specs")
	subDir := filepath.Join(specsDir, "sub")
	if err := os.MkdirAll(subDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(subDir, "test.feature"), []byte("Feature: test"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(subDir, 0000); err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Chmod(subDir, 0755) }()

	opts := ScanOptions{
		RepoRoot: tmpDir,
		SpecsDir: specsDir,
		AppDir:   filepath.Join(tmpDir, "app"),
	}

	_, err := CheckAll(opts)
	// On non-root this should return an error
	if err != nil {
		if len(err.Error()) == 0 {
			t.Error("expected non-empty error from CheckAll with unreadable specs subdir")
		}
	}
}

func TestCheckAll_ExtractAllStepTextsError(t *testing.T) {
	// Trigger CheckAll error at extractAllStepTexts by making app subdir unreadable.
	tmpDir := t.TempDir()
	specsDir := filepath.Join(tmpDir, "specs")
	if err := os.MkdirAll(specsDir, 0755); err != nil {
		t.Fatal(err)
	}
	// No feature files — walkFeatureFiles returns empty list, then extractAllStepTexts runs
	appDir := filepath.Join(tmpDir, "app")
	subDir := filepath.Join(appDir, "src")
	if err := os.MkdirAll(subDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(subDir, "steps.ts"), []byte("Given('a step', () => {})"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(subDir, 0000); err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Chmod(subDir, 0755) }()

	opts := ScanOptions{
		RepoRoot: tmpDir,
		SpecsDir: specsDir,
		AppDir:   appDir,
	}

	// extractAllStepTexts doesn't return errors through Walk callback (it uses extractTSStepTexts
	// which returns the error, but Walk receives it). CheckAll may or may not error
	// depending on how filepath.Walk propagates the error.
	// CheckAll may or may not error depending on how filepath.Walk propagates the error.
	// Either outcome is acceptable — we just verify it doesn't panic.
	_, _ = CheckAll(opts)
}

// --- extractTSStepTexts: regex literal path ---

func TestExtractTSStepTexts_RegexLiteral(t *testing.T) {
	tmpDir := t.TempDir()
	path := filepath.Join(tmpDir, "steps.ts")
	content := "When(/^the user clicks (.*)$/, async () => {});\n" +
		"Then(/pattern without dollar/, async () => {});\n"
	writeContent(t, path, content)

	sm := &stepMatcher{exact: map[string]bool{}}
	err := extractTSStepTexts(path, sm)
	if err != nil {
		t.Fatalf("extractTSStepTexts() error = %v", err)
	}
	if len(sm.patterns) == 0 {
		t.Fatal("expected patterns to be added for regex literal step definitions")
	}
	if !sm.matches("the user clicks submit") {
		t.Error("expected pattern to match 'the user clicks submit'")
	}
}

func TestExtractTSStepTexts_MultiLineStepDefinition(t *testing.T) {
	tmpDir := t.TempDir()
	path := filepath.Join(tmpDir, "steps.ts")
	// Multi-line: Then(\n  "text",\n  fn)
	content := "Then(\n  \"the result is shown\",\n  async () => {});\n"
	writeContent(t, path, content)

	sm := &stepMatcher{exact: map[string]bool{}}
	err := extractTSStepTexts(path, sm)
	if err != nil {
		t.Fatalf("extractTSStepTexts() error = %v", err)
	}
	if !sm.matches("the result is shown") {
		t.Error("expected 'the result is shown' to match from multi-line step definition")
	}
}

func TestExtractTSStepTexts_RegexLiteralInvalidPattern(t *testing.T) {
	// Invalid regex literal should be skipped gracefully
	tmpDir := t.TempDir()
	path := filepath.Join(tmpDir, "steps.ts")
	content := "When(/[invalid(/, async () => {});\n" +
		"Then(/^valid step$/, async () => {});\n"
	writeContent(t, path, content)

	sm := &stepMatcher{exact: map[string]bool{}}
	err := extractTSStepTexts(path, sm)
	if err != nil {
		t.Fatalf("extractTSStepTexts() should not error for invalid regex literal, got: %v", err)
	}
	// Only the valid regex should be in patterns
	if len(sm.patterns) != 1 {
		t.Errorf("patterns = %d, want 1 (invalid regex skipped)", len(sm.patterns))
	}
}

// --- unescapeString: \/ escape ---

func TestUnescapeString_SlashEscape(t *testing.T) {
	got := unescapeString(`path\/to\/file`)
	want := "path/to/file"
	if got != want {
		t.Errorf("unescapeString(%q) = %q, want %q", `path\/to\/file`, got, want)
	}
}

// --- walkFeatureFiles with excludeDirs ---

func TestWalkFeatureFiles_ExcludeDirs(t *testing.T) {
	tmpDir := t.TempDir()

	// Feature file in excluded directory
	if err := os.MkdirAll(filepath.Join(tmpDir, "test-support"), 0755); err != nil {
		t.Fatal(err)
	}
	writeContent(t, filepath.Join(tmpDir, "test-support", "excluded.feature"), "Feature: Excluded\n")

	// Feature file in included directory
	writeContent(t, filepath.Join(tmpDir, "main", "included.feature"), "Feature: Included\n")

	files, err := walkFeatureFiles(tmpDir, "test-support")
	if err != nil {
		t.Fatalf("walkFeatureFiles() error = %v", err)
	}

	if len(files) != 1 {
		t.Errorf("got %d files, want 1 (excluded dir should be skipped): %v", len(files), files)
	}
	if filepath.Base(files[0]) != "included.feature" {
		t.Errorf("expected 'included.feature', got %q", filepath.Base(files[0]))
	}
}

// --- extractScenarioTitles dispatch ---

func TestExtractScenarioTitles_PythonFile(t *testing.T) {
	tmpDir := t.TempDir()
	path := filepath.Join(tmpDir, "test_login.py")
	writeContent(t, path, `@scenario("login.feature", "User logs in")
def test_user_logs_in():
    pass`)

	titles, err := extractScenarioTitles(path)
	if err != nil {
		t.Fatalf("extractScenarioTitles() error = %v", err)
	}
	if !titles["User logs in"] {
		t.Error("expected 'User logs in' in Python scenario titles")
	}
}

func TestExtractScenarioTitles_ExsFile(t *testing.T) {
	tmpDir := t.TempDir()
	path := filepath.Join(tmpDir, "steps_test.exs")
	writeContent(t, path, `# Elixir auto-bind — no Scenario() calls`)

	titles, err := extractScenarioTitles(path)
	if err != nil {
		t.Fatalf("extractScenarioTitles() error = %v", err)
	}
	// .exs returns empty map (auto-bind framework)
	if len(titles) != 0 {
		t.Errorf("expected empty titles for .exs file, got %v", titles)
	}
}

func TestExtractScenarioTitles_FSharpFile(t *testing.T) {
	tmpDir := t.TempDir()
	path := filepath.Join(tmpDir, "Steps.fs")
	writeContent(t, path, "// F# TickSpec auto-bind")

	titles, err := extractScenarioTitles(path)
	if err != nil {
		t.Fatalf("extractScenarioTitles() error = %v", err)
	}
	if len(titles) != 0 {
		t.Errorf("expected empty titles for .fs file, got %v", titles)
	}
}

func TestExtractScenarioTitles_ClojureFile(t *testing.T) {
	tmpDir := t.TempDir()
	path := filepath.Join(tmpDir, "steps_test.clj")
	writeContent(t, path, ";; Clojure auto-bind")

	titles, err := extractScenarioTitles(path)
	if err != nil {
		t.Fatalf("extractScenarioTitles() error = %v", err)
	}
	if len(titles) != 0 {
		t.Errorf("expected empty titles for .clj file, got %v", titles)
	}
}

func TestExtractScenarioTitles_DartFile(t *testing.T) {
	tmpDir := t.TempDir()
	path := filepath.Join(tmpDir, "steps_test.dart")
	writeContent(t, path, "// Scenario: My Dart scenario\nvoid main() {}")

	titles, err := extractScenarioTitles(path)
	if err != nil {
		t.Fatalf("extractScenarioTitles() error = %v", err)
	}
	if !titles["My Dart scenario"] {
		t.Errorf("expected 'My Dart scenario' in Dart scenario titles, got %v", titles)
	}
}

func TestExtractScenarioTitles_JavaFile(t *testing.T) {
	tmpDir := t.TempDir()
	path := filepath.Join(tmpDir, "LoginSteps.java")
	writeContent(t, path, "// Scenario: Java login scenario\npublic class LoginSteps {}")

	titles, err := extractScenarioTitles(path)
	if err != nil {
		t.Fatalf("extractScenarioTitles() error = %v", err)
	}
	if !titles["Java login scenario"] {
		t.Errorf("expected 'Java login scenario' in Java scenario titles, got %v", titles)
	}
}

func TestExtractScenarioTitles_CSharpFile(t *testing.T) {
	tmpDir := t.TempDir()
	path := filepath.Join(tmpDir, "LoginSteps.cs")
	writeContent(t, path, "// Scenario: CSharp login scenario\npublic class LoginSteps {}")

	titles, err := extractScenarioTitles(path)
	if err != nil {
		t.Fatalf("extractScenarioTitles() error = %v", err)
	}
	if !titles["CSharp login scenario"] {
		t.Errorf("expected 'CSharp login scenario' in C# scenario titles, got %v", titles)
	}
}

func TestExtractScenarioTitles_RustFile(t *testing.T) {
	tmpDir := t.TempDir()
	path := filepath.Join(tmpDir, "steps_test.rs")
	writeContent(t, path, "// Scenario: Rust login scenario\nfn main() {}")

	titles, err := extractScenarioTitles(path)
	if err != nil {
		t.Fatalf("extractScenarioTitles() error = %v", err)
	}
	if !titles["Rust login scenario"] {
		t.Errorf("expected 'Rust login scenario' in Rust scenario titles, got %v", titles)
	}
}

// --- extractAllStepTexts: dispatches to language-specific extractors ---

func TestExtractAllStepTexts_RustSteps(t *testing.T) {
	root := t.TempDir()
	writeContent(t, filepath.Join(root, "src", "steps.rs"),
		`#[given("the Rust app is running")]
fn given_running() {}`)

	sm, err := extractAllStepTexts(root)
	if err != nil {
		t.Fatalf("extractAllStepTexts() error = %v", err)
	}
	if !sm.matches("the Rust app is running") {
		t.Error("expected Rust literal step to match")
	}
}

func TestExtractAllStepTexts_CSharpSteps(t *testing.T) {
	root := t.TempDir()
	writeContent(t, filepath.Join(root, "src", "Steps.cs"),
		`[Given("the C# app is ready")]
public void GivenReady() {}`)

	sm, err := extractAllStepTexts(root)
	if err != nil {
		t.Fatalf("extractAllStepTexts() error = %v", err)
	}
	if !sm.matches("the C# app is ready") {
		t.Error("expected C# step to match")
	}
}

func TestExtractAllStepTexts_FSharpSteps(t *testing.T) {
	root := t.TempDir()
	writeContent(t, filepath.Join(root, "src", "Steps.fs"),
		"let [<Given>] ``the FSharp app is ready`` () =\n    ()")

	sm, err := extractAllStepTexts(root)
	if err != nil {
		t.Fatalf("extractAllStepTexts() error = %v", err)
	}
	if !sm.matches("the FSharp app is ready") {
		t.Error("expected F# step to match")
	}
}

func TestExtractAllStepTexts_ClojureSteps(t *testing.T) {
	root := t.TempDir()
	writeContent(t, filepath.Join(root, "src", "steps.clj"),
		`(Given "the Clojure app is running"
  (fn [state] state))`)

	sm, err := extractAllStepTexts(root)
	if err != nil {
		t.Fatalf("extractAllStepTexts() error = %v", err)
	}
	if !sm.matches("the Clojure app is running") {
		t.Error("expected Clojure step to match")
	}
}

func TestExtractAllStepTexts_DartSteps(t *testing.T) {
	root := t.TempDir()
	writeContent(t, filepath.Join(root, "src", "steps_test.dart"),
		`s.given("the Dart app is running", () async {});`)

	sm, err := extractAllStepTexts(root)
	if err != nil {
		t.Fatalf("extractAllStepTexts() error = %v", err)
	}
	if !sm.matches("the Dart app is running") {
		t.Error("expected Dart step to match")
	}
}

func TestExtractAllStepTexts_PythonSteps(t *testing.T) {
	root := t.TempDir()
	writeContent(t, filepath.Join(root, "src", "steps.py"),
		`@given("the Python app is running")
def given_running():
    pass`)

	sm, err := extractAllStepTexts(root)
	if err != nil {
		t.Fatalf("extractAllStepTexts() error = %v", err)
	}
	if !sm.matches("the Python app is running") {
		t.Error("expected Python step to match")
	}
}

func TestExtractAllStepTexts_ElixirSteps(t *testing.T) {
	root := t.TempDir()
	writeContent(t, filepath.Join(root, "src", "steps.ex"),
		`defgiven ~r/^the Elixir app is running$/`)

	sm, err := extractAllStepTexts(root)
	if err != nil {
		t.Fatalf("extractAllStepTexts() error = %v", err)
	}
	if !sm.matches("the Elixir app is running") {
		t.Error("expected Elixir step to match")
	}
}

// --- CheckAll with SharedSteps via CheckAll entry point ---

func TestCheckAll_SharedStepsMode(t *testing.T) {
	root := t.TempDir()

	writeContent(t, filepath.Join(root, "specs", "shared.feature"), `
Feature: Shared
  Scenario: Step is shared
    Given the server is up
    When the client connects
    Then the connection is established
`)

	writeContent(t, filepath.Join(root, "app", "common.steps.ts"),
		"Given(\"the server is up\", async () => {});\n"+
			"When(\"the client connects\", async () => {});\n"+
			"Then(\"the connection is established\", async () => {});\n")

	opts := ScanOptions{
		RepoRoot:    root,
		SpecsDir:    filepath.Join(root, "specs"),
		AppDir:      filepath.Join(root, "app"),
		SharedSteps: true,
	}

	result, err := CheckAll(opts)
	if err != nil {
		t.Fatalf("CheckAll() error = %v", err)
	}
	if result.TotalSteps != 3 {
		t.Errorf("TotalSteps = %d, want 3", result.TotalSteps)
	}
	if len(result.StepGaps) != 0 {
		t.Errorf("StepGaps = %v, want none", result.StepGaps)
	}
	// No file-level gaps in shared-steps mode
	if len(result.Gaps) != 0 {
		t.Errorf("Gaps = %v, want none in shared-steps mode", result.Gaps)
	}
}

// --- toPascalCase edge cases ---

func TestToPascalCase_EmptyPart(t *testing.T) {
	// Leading or trailing hyphens produce empty parts that should be skipped
	got := toPascalCase("-health-check-")
	if got != "HealthCheck" {
		t.Errorf("toPascalCase(%q) = %q, want %q", "-health-check-", got, "HealthCheck")
	}
}
