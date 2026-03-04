package speccoverage

import (
	"os"
	"path/filepath"
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

func TestCheckAll_AllCovered(t *testing.T) {
	root := t.TempDir()

	// Create specs
	makeFile(t, filepath.Join(root, "specs", "user-login.feature"))
	makeFile(t, filepath.Join(root, "specs", "auth", "route-protection.feature"))

	// Create matching test files
	makeFile(t, filepath.Join(root, "app", "src", "user-login.integration.test.tsx"))
	makeFile(t, filepath.Join(root, "app", "src", "route-protection.integration.test.tsx"))

	opts := ScanOptions{
		RepoRoot: root,
		SpecsDir: filepath.Join(root, "specs"),
		AppDir:   filepath.Join(root, "app"),
	}

	result, err := CheckAll(opts)
	if err != nil {
		t.Fatalf("CheckAll() error = %v", err)
	}

	if result.TotalSpecs != 2 {
		t.Errorf("TotalSpecs = %d, want 2", result.TotalSpecs)
	}
	if len(result.Gaps) != 0 {
		t.Errorf("Gaps = %v, want none", result.Gaps)
	}
	if result.Duration <= 0 {
		t.Error("Duration should be positive")
	}
}

func TestCheckAll_MissingTest(t *testing.T) {
	root := t.TempDir()

	// Create specs
	makeFile(t, filepath.Join(root, "specs", "user-login.feature"))
	makeFile(t, filepath.Join(root, "specs", "dashboard.feature"))

	// Only one matching test file
	makeFile(t, filepath.Join(root, "app", "src", "user-login.integration.test.tsx"))

	opts := ScanOptions{
		RepoRoot: root,
		SpecsDir: filepath.Join(root, "specs"),
		AppDir:   filepath.Join(root, "app"),
	}

	result, err := CheckAll(opts)
	if err != nil {
		t.Fatalf("CheckAll() error = %v", err)
	}

	if result.TotalSpecs != 2 {
		t.Errorf("TotalSpecs = %d, want 2", result.TotalSpecs)
	}
	if len(result.Gaps) != 1 {
		t.Fatalf("Gaps count = %d, want 1", len(result.Gaps))
	}
	if result.Gaps[0].Stem != "dashboard" {
		t.Errorf("Gap stem = %q, want %q", result.Gaps[0].Stem, "dashboard")
	}
	if result.Gaps[0].SpecFile == "" {
		t.Error("Gap SpecFile should not be empty")
	}
}

func TestCheckAll_AllMissing(t *testing.T) {
	root := t.TempDir()

	makeFile(t, filepath.Join(root, "specs", "feature-a.feature"))
	makeFile(t, filepath.Join(root, "specs", "sub", "feature-b.feature"))

	// App dir exists but no matching test files
	makeFile(t, filepath.Join(root, "app", "unrelated.tsx"))

	opts := ScanOptions{
		RepoRoot: root,
		SpecsDir: filepath.Join(root, "specs"),
		AppDir:   filepath.Join(root, "app"),
	}

	result, err := CheckAll(opts)
	if err != nil {
		t.Fatalf("CheckAll() error = %v", err)
	}

	if result.TotalSpecs != 2 {
		t.Errorf("TotalSpecs = %d, want 2", result.TotalSpecs)
	}
	if len(result.Gaps) != 2 {
		t.Errorf("Gaps count = %d, want 2", len(result.Gaps))
	}
}

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

// --- Scenario gap tests ---

func TestCheckAll_ScenarioPresent_NoGap(t *testing.T) {
	root := t.TempDir()

	writeContent(t, filepath.Join(root, "specs", "login.feature"), `
Feature: Login
  Scenario: Successful login
    Given a user
    When they log in
    Then they see the dashboard
`)
	writeContent(t, filepath.Join(root, "app", "login.integration.test.tsx"), `
describeFeature(feature, ({ Scenario }) => {
  Scenario("Successful login", ({ Given, When, Then }) => {
    Given("a user", () => {});
    When("they log in", () => {});
    Then("they see the dashboard", () => {});
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

	if len(result.ScenarioGaps) != 0 {
		t.Errorf("ScenarioGaps = %v, want none", result.ScenarioGaps)
	}
}

func TestCheckAll_ScenarioMissing_ScenarioGap(t *testing.T) {
	root := t.TempDir()

	writeContent(t, filepath.Join(root, "specs", "login.feature"), `
Feature: Login
  Scenario: Successful login
    Given a user
    When they log in
    Then they see the dashboard

  Scenario: Failed login
    Given a wrong password
    When they log in
    Then they see an error
`)
	// Test file only has "Successful login"
	writeContent(t, filepath.Join(root, "app", "login.integration.test.tsx"), `
describeFeature(feature, ({ Scenario }) => {
  Scenario("Successful login", ({ Given, When, Then }) => {
    Given("a user", () => {});
    When("they log in", () => {});
    Then("they see the dashboard", () => {});
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

	if len(result.ScenarioGaps) != 1 {
		t.Fatalf("ScenarioGaps = %d, want 1", len(result.ScenarioGaps))
	}
	if result.ScenarioGaps[0].ScenarioTitle != "Failed login" {
		t.Errorf("ScenarioGap title = %q, want %q", result.ScenarioGaps[0].ScenarioTitle, "Failed login")
	}
}

func TestCheckAll_TotalScenarios_Counted(t *testing.T) {
	root := t.TempDir()

	writeContent(t, filepath.Join(root, "specs", "login.feature"), `
Feature: Login
  Scenario: A
    Given step a
  Scenario: B
    Given step b
  Scenario: C
    Given step c
`)
	writeContent(t, filepath.Join(root, "app", "login.integration.test.tsx"), `
describeFeature(feature, ({ Scenario }) => {
  Scenario("A", ({ Given }) => { Given("step a", () => {}); });
  Scenario("B", ({ Given }) => { Given("step b", () => {}); });
  Scenario("C", ({ Given }) => { Given("step c", () => {}); });
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

	if result.TotalScenarios != 3 {
		t.Errorf("TotalScenarios = %d, want 3", result.TotalScenarios)
	}
}

// --- Step gap tests ---

func TestCheckAll_StepPresent_NoStepGap(t *testing.T) {
	root := t.TempDir()

	writeContent(t, filepath.Join(root, "specs", "login.feature"), `
Feature: Login
  Scenario: Login
    Given a registered user
    When they submit credentials
    Then they are redirected
`)
	writeContent(t, filepath.Join(root, "app", "login.integration.test.tsx"), `
describeFeature(feature, ({ Scenario }) => {
  Scenario("Login", ({ Given, When, Then }) => {
    Given("a registered user", () => {});
    When("they submit credentials", () => {});
    Then("they are redirected", () => {});
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
		t.Errorf("StepGaps = %v, want none", result.StepGaps)
	}
}

func TestCheckAll_StepMissing_StepGap(t *testing.T) {
	root := t.TempDir()

	writeContent(t, filepath.Join(root, "specs", "login.feature"), `
Feature: Login
  Scenario: Login
    Given a registered user
    When they submit credentials
    Then they are redirected
    And a session is active
`)
	// Test file missing "And a session is active"
	writeContent(t, filepath.Join(root, "app", "login.integration.test.tsx"), `
describeFeature(feature, ({ Scenario }) => {
  Scenario("Login", ({ Given, When, Then }) => {
    Given("a registered user", () => {});
    When("they submit credentials", () => {});
    Then("they are redirected", () => {});
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

	if len(result.StepGaps) != 1 {
		t.Fatalf("StepGaps = %d, want 1", len(result.StepGaps))
	}
	if result.StepGaps[0].StepText != "a session is active" {
		t.Errorf("StepGap text = %q, want %q", result.StepGaps[0].StepText, "a session is active")
	}
	if result.StepGaps[0].StepKeyword != "And" {
		t.Errorf("StepGap keyword = %q, want %q", result.StepGaps[0].StepKeyword, "And")
	}
}

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
	// Scenario/step gaps should NOT be reported for files with coverage gaps
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

func TestCheckAll_TotalSteps_Counted(t *testing.T) {
	root := t.TempDir()

	writeContent(t, filepath.Join(root, "specs", "feature.feature"), `
Feature: Feature
  Scenario: A
    Given step one
    When step two
    Then step three
    And step four
`)
	writeContent(t, filepath.Join(root, "app", "feature.integration.test.tsx"), `
describeFeature(feature, ({ Scenario }) => {
  Scenario("A", ({ Given, When, Then, And }) => {
    Given("step one", () => {});
    When("step two", () => {});
    Then("step three", () => {});
    And("step four", () => {});
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

	if result.TotalSteps != 4 {
		t.Errorf("TotalSteps = %d, want 4", result.TotalSteps)
	}
	if len(result.StepGaps) != 0 {
		t.Errorf("StepGaps = %v, want none", result.StepGaps)
	}
}

// --- extractScenarioTitles tests ---

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

func TestExtractScenarioTitles_DoubleQuotes(t *testing.T) {
	root := t.TempDir()
	path := filepath.Join(root, "test.tsx")
	writeContent(t, path, `
  Scenario("Successful login", ({ Given }) => {});
`)

	titles, err := extractScenarioTitles(path)
	if err != nil {
		t.Fatalf("extractScenarioTitles() error = %v", err)
	}

	if !titles["Successful login"] {
		t.Error("expected double-quoted title to be found")
	}
}

// --- unescapeString tests ---

func TestUnescapeString_EscapedApostrophe(t *testing.T) {
	// Simulates: 'the page headline should read "Team\'s Productivity"'
	input := `the page headline should read "Team\'s Productivity"`
	want := `the page headline should read "Team's Productivity"`
	got := unescapeString(input)
	if got != want {
		t.Errorf("unescapeString = %q, want %q", got, want)
	}
}

func TestUnescapeString_NoEscapes(t *testing.T) {
	input := "a plain step text"
	got := unescapeString(input)
	if got != input {
		t.Errorf("unescapeString = %q, want %q", got, input)
	}
}

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

// --- extractAllStepTexts tests ---

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

	texts, err := extractAllStepTexts(root)
	if err != nil {
		t.Fatalf("extractAllStepTexts() error = %v", err)
	}

	if texts["a step in node_modules"] {
		t.Error("node_modules step should be skipped")
	}
	if !texts["a real step"] {
		t.Error("src step should be found")
	}
}
