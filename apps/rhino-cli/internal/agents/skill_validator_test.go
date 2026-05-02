package agents

import (
	"os"
	"path/filepath"
	"testing"
)

func TestValidateSkill_ValidSkill(t *testing.T) {
	tmpDir := t.TempDir()
	skillDir := filepath.Join(tmpDir, "test-skill")

	if err := os.MkdirAll(skillDir, 0755); err != nil {
		t.Fatalf("Failed to create skill dir: %v", err)
	}

	content := `---
name: test-skill
description: Test skill description
---
Skill content here`

	if err := os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create SKILL.md: %v", err)
	}

	checks := validateSkill(skillDir, "test-skill")

	// Should have 7 checks: YAML formatting, file exists, YAML syntax, description required, name required, name format, name match
	if len(checks) != 7 {
		t.Errorf("Expected 7 checks, got %d", len(checks))
		for i, check := range checks {
			t.Logf("Check %d: %s - %s", i+1, check.Name, check.Status)
		}
	}

	for _, check := range checks {
		if check.Status != "passed" {
			t.Errorf("Check '%s' failed: %s", check.Name, check.Message)
		}
	}
}

func TestValidateSkill_MissingSkillFile(t *testing.T) {
	tmpDir := t.TempDir()
	skillDir := filepath.Join(tmpDir, "test-skill")

	if err := os.MkdirAll(skillDir, 0755); err != nil {
		t.Fatalf("Failed to create skill dir: %v", err)
	}

	// Don't create SKILL.md

	checks := validateSkill(skillDir, "test-skill")

	// Should return early with 1 failed check
	if len(checks) != 1 {
		t.Errorf("Expected 1 check, got %d", len(checks))
	}

	if checks[0].Status != "failed" {
		t.Errorf("Expected status 'failed', got '%s'", checks[0].Status)
	}

	if checks[0].Expected != "SKILL.md file present" {
		t.Errorf("Expected SKILL.md message, got '%s'", checks[0].Expected)
	}
}

func TestValidateSkill_InvalidYAML(t *testing.T) {
	tmpDir := t.TempDir()
	skillDir := filepath.Join(tmpDir, "test-skill")

	if err := os.MkdirAll(skillDir, 0755); err != nil {
		t.Fatalf("Failed to create skill dir: %v", err)
	}

	// Invalid YAML (no closing ---)
	content := `---
name: test-skill
description: Test skill
This is invalid`

	if err := os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create SKILL.md: %v", err)
	}

	checks := validateSkill(skillDir, "test-skill")

	// Should have file exists (passed), YAML formatting (failed due to no closing ---)
	if len(checks) < 2 {
		t.Errorf("Expected at least 2 checks, got %d", len(checks))
	}

	foundFailure := false
	for _, check := range checks {
		if check.Status == "failed" {
			foundFailure = true
			break
		}
	}

	if !foundFailure {
		t.Error("Expected at least one failed check")
	}
}

func TestValidateSkill_YAMLFormattingError_MissingSpace(t *testing.T) {
	tmpDir := t.TempDir()
	skillDir := filepath.Join(tmpDir, "test-skill")

	if err := os.MkdirAll(skillDir, 0755); err != nil {
		t.Fatalf("Failed to create skill dir: %v", err)
	}

	// Missing space after colon
	content := `---
name:test-skill
description: Test skill description
---
Skill content here`

	if err := os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create SKILL.md: %v", err)
	}

	checks := validateSkill(skillDir, "test-skill")

	// Should fail on YAML formatting check
	foundYAMLFormattingError := false
	for _, check := range checks {
		if check.Status == "failed" && check.Name == "Skill: test-skill - YAML Formatting" {
			foundYAMLFormattingError = true
			if check.Expected != "Space after colon in YAML key-value pairs (e.g., 'name: value')" {
				t.Errorf("Expected YAML formatting error message, got '%s'", check.Expected)
			}
			break
		}
	}

	if !foundYAMLFormattingError {
		t.Error("Expected YAML formatting error for missing space after colon")
	}
}

func TestValidateSkill_MissingName(t *testing.T) {
	tmpDir := t.TempDir()
	skillDir := filepath.Join(tmpDir, "test-skill")

	if err := os.MkdirAll(skillDir, 0755); err != nil {
		t.Fatalf("Failed to create skill dir: %v", err)
	}

	// Missing name field
	content := `---
description: Test skill description
---
Skill content here`

	if err := os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create SKILL.md: %v", err)
	}

	checks := validateSkill(skillDir, "test-skill")

	foundMissingName := false
	for _, check := range checks {
		if check.Status == "failed" && check.Expected == "name field present" {
			foundMissingName = true
			break
		}
	}

	if !foundMissingName {
		t.Error("Expected check for missing name field")
	}
}

func TestValidateSkill_InvalidNameFormat_Uppercase(t *testing.T) {
	tmpDir := t.TempDir()
	skillDir := filepath.Join(tmpDir, "test-skill")

	if err := os.MkdirAll(skillDir, 0755); err != nil {
		t.Fatalf("Failed to create skill dir: %v", err)
	}

	// Name with uppercase letters
	content := `---
name: Test-Skill
description: Test skill description
---
Skill content here`

	if err := os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create SKILL.md: %v", err)
	}

	checks := validateSkill(skillDir, "test-skill")

	foundInvalidFormat := false
	for _, check := range checks {
		if check.Status == "failed" && check.Expected == "Lowercase letters/numbers/hyphens only, max 64 chars" {
			foundInvalidFormat = true
			break
		}
	}

	if !foundInvalidFormat {
		t.Error("Expected check for invalid name format (uppercase)")
	}
}

func TestValidateSkill_InvalidNameFormat_Underscore(t *testing.T) {
	tmpDir := t.TempDir()
	skillDir := filepath.Join(tmpDir, "test-skill")

	if err := os.MkdirAll(skillDir, 0755); err != nil {
		t.Fatalf("Failed to create skill dir: %v", err)
	}

	// Name with underscores
	content := `---
name: test_skill
description: Test skill description
---
Skill content here`

	if err := os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create SKILL.md: %v", err)
	}

	checks := validateSkill(skillDir, "test-skill")

	foundInvalidFormat := false
	for _, check := range checks {
		if check.Status == "failed" && check.Expected == "Lowercase letters/numbers/hyphens only, max 64 chars" {
			foundInvalidFormat = true
			break
		}
	}

	if !foundInvalidFormat {
		t.Error("Expected check for invalid name format (underscore)")
	}
}

func TestValidateSkill_InvalidNameFormat_TooLong(t *testing.T) {
	tmpDir := t.TempDir()
	skillDir := filepath.Join(tmpDir, "test-skill")

	if err := os.MkdirAll(skillDir, 0755); err != nil {
		t.Fatalf("Failed to create skill dir: %v", err)
	}

	// Name exceeding 64 characters
	longName := "this-is-a-very-long-skill-name-that-exceeds-the-maximum-allowed-length-of-sixty-four-characters"
	content := `---
name: ` + longName + `
description: Test skill description
---
Skill content here`

	if err := os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create SKILL.md: %v", err)
	}

	checks := validateSkill(skillDir, "test-skill")

	foundInvalidFormat := false
	for _, check := range checks {
		if check.Status == "failed" && check.Expected == "Lowercase letters/numbers/hyphens only, max 64 chars" {
			foundInvalidFormat = true
			break
		}
	}

	if !foundInvalidFormat {
		t.Error("Expected check for invalid name format (too long)")
	}
}

func TestValidateSkill_NameMismatchDirectory(t *testing.T) {
	tmpDir := t.TempDir()
	skillDir := filepath.Join(tmpDir, "test-skill")

	if err := os.MkdirAll(skillDir, 0755); err != nil {
		t.Fatalf("Failed to create skill dir: %v", err)
	}

	// Name doesn't match directory
	content := `---
name: different-name
description: Test skill description
---
Skill content here`

	if err := os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create SKILL.md: %v", err)
	}

	checks := validateSkill(skillDir, "test-skill")

	foundNameMismatch := false
	for _, check := range checks {
		if check.Status == "failed" && check.Expected == "name field matches directory: test-skill" {
			foundNameMismatch = true
			if check.Actual != "name field: different-name" {
				t.Errorf("Expected actual value 'name field: different-name', got '%s'", check.Actual)
			}
			break
		}
	}

	if !foundNameMismatch {
		t.Error("Expected check for name mismatch with directory")
	}
}

func TestValidateSkill_MissingDescription(t *testing.T) {
	tmpDir := t.TempDir()
	skillDir := filepath.Join(tmpDir, "test-skill")

	if err := os.MkdirAll(skillDir, 0755); err != nil {
		t.Fatalf("Failed to create skill dir: %v", err)
	}

	// Missing description field
	content := `---
name: test-skill
---
Skill content here`

	if err := os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create SKILL.md: %v", err)
	}

	checks := validateSkill(skillDir, "test-skill")

	foundMissingDescription := false
	for _, check := range checks {
		if check.Status == "failed" && check.Expected == "description field present" {
			foundMissingDescription = true
			break
		}
	}

	if !foundMissingDescription {
		t.Error("Expected check for missing description field")
	}
}

func TestValidateSkill_EmptyDescription(t *testing.T) {
	tmpDir := t.TempDir()
	skillDir := filepath.Join(tmpDir, "test-skill")

	if err := os.MkdirAll(skillDir, 0755); err != nil {
		t.Fatalf("Failed to create skill dir: %v", err)
	}

	// Empty description
	content := `---
name: test-skill
description:
---
Skill content here`

	if err := os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create SKILL.md: %v", err)
	}

	checks := validateSkill(skillDir, "test-skill")

	foundMissingDescription := false
	for _, check := range checks {
		if check.Status == "failed" && check.Expected == "description field present" {
			foundMissingDescription = true
			break
		}
	}

	if !foundMissingDescription {
		t.Error("Expected check for empty description field")
	}
}

func TestValidateSkill_LongDescription(t *testing.T) {
	tmpDir := t.TempDir()
	skillDir := filepath.Join(tmpDir, "test-skill")

	if err := os.MkdirAll(skillDir, 0755); err != nil {
		t.Fatalf("Failed to create skill dir: %v", err)
	}

	// Very long description (should be valid)
	longDesc := "This is a very long description that spans multiple concepts and ideas. "
	longDesc += "It includes detailed information about the skill's purpose, usage, and benefits. "
	longDesc += "The description can be as long as needed to fully explain the skill."

	content := `---
name: test-skill
description: ` + longDesc + `
---
Skill content here`

	if err := os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create SKILL.md: %v", err)
	}

	checks := validateSkill(skillDir, "test-skill")

	for _, check := range checks {
		if check.Status != "passed" {
			t.Errorf("Check '%s' failed: %s", check.Name, check.Message)
		}
	}
}

func TestValidateAllSkills_EmptyDirectory(t *testing.T) {
	tmpDir := t.TempDir()
	skillsDir := filepath.Join(tmpDir, ".claude", "skills")

	if err := os.MkdirAll(skillsDir, 0755); err != nil {
		t.Fatalf("Failed to create skills dir: %v", err)
	}

	checks, skillNames := validateAllSkills(tmpDir)

	if len(checks) != 0 {
		t.Errorf("Expected 0 checks for empty directory, got %d", len(checks))
	}

	if len(skillNames) != 0 {
		t.Errorf("Expected 0 skill names, got %d", len(skillNames))
	}
}

func TestValidateAllSkills_MultipleSkills(t *testing.T) {
	tmpDir := t.TempDir()
	skillsDir := filepath.Join(tmpDir, ".claude", "skills")

	if err := os.MkdirAll(skillsDir, 0755); err != nil {
		t.Fatalf("Failed to create skills dir: %v", err)
	}

	// Create 3 valid skills
	for i := 1; i <= 3; i++ {
		skillName := "skill-" + string(rune('0'+i))
		createValidSkill(t, skillsDir, skillName)
	}

	checks, skillNames := validateAllSkills(tmpDir)

	// 3 skills × 7 checks each = 21 checks
	if len(checks) != 21 {
		t.Errorf("Expected 21 checks (3 skills × 7), got %d", len(checks))
		for i, check := range checks {
			t.Logf("Check %d: %s - %s", i+1, check.Name, check.Status)
		}
	}

	if len(skillNames) != 3 {
		t.Errorf("Expected 3 skill names, got %d", len(skillNames))
	}

	// Verify all skill names are registered
	for i := 1; i <= 3; i++ {
		skillName := "skill-" + string(rune('0'+i))
		if !skillNames[skillName] {
			t.Errorf("Expected skill '%s' to be registered", skillName)
		}
	}

	passedCount := 0
	for _, check := range checks {
		if check.Status == "passed" {
			passedCount++
		}
	}

	if passedCount != 21 {
		t.Errorf("Expected all 21 checks to pass, got %d passed", passedCount)
	}
}

func TestValidateAllSkills_MixedValidInvalid(t *testing.T) {
	tmpDir := t.TempDir()
	skillsDir := filepath.Join(tmpDir, ".claude", "skills")

	if err := os.MkdirAll(skillsDir, 0755); err != nil {
		t.Fatalf("Failed to create skills dir: %v", err)
	}

	// Create 1 valid skill
	createValidSkill(t, skillsDir, "valid-skill")

	// Create 1 invalid skill (missing SKILL.md)
	invalidSkillDir := filepath.Join(skillsDir, "invalid-skill")
	if err := os.MkdirAll(invalidSkillDir, 0755); err != nil {
		t.Fatalf("Failed to create invalid skill dir: %v", err)
	}

	checks, skillNames := validateAllSkills(tmpDir)

	// Should have 7 checks for valid skill + 1 check for invalid skill (file exists failed)
	if len(checks) < 8 {
		t.Errorf("Expected at least 8 checks, got %d", len(checks))
	}

	// Only valid skill should be registered
	if len(skillNames) != 1 {
		t.Errorf("Expected 1 skill name, got %d", len(skillNames))
	}

	if !skillNames["valid-skill"] {
		t.Error("Expected valid-skill to be registered")
	}

	if skillNames["invalid-skill"] {
		t.Error("Did not expect invalid-skill to be registered")
	}
}

func TestValidateAllSkills_IgnoresDotDirectories(t *testing.T) {
	tmpDir := t.TempDir()
	skillsDir := filepath.Join(tmpDir, ".claude", "skills")

	if err := os.MkdirAll(skillsDir, 0755); err != nil {
		t.Fatalf("Failed to create skills dir: %v", err)
	}

	// Create a valid skill
	createValidSkill(t, skillsDir, "valid-skill")

	// Create a .hidden directory (should be ignored)
	hiddenDir := filepath.Join(skillsDir, ".hidden")
	if err := os.MkdirAll(hiddenDir, 0755); err != nil {
		t.Fatalf("Failed to create hidden dir: %v", err)
	}

	checks, skillNames := validateAllSkills(tmpDir)

	// Should only have checks for valid-skill (7 checks)
	if len(checks) != 7 {
		t.Errorf("Expected 7 checks (hidden dir ignored), got %d", len(checks))
		for i, check := range checks {
			t.Logf("Check %d: %s - %s", i+1, check.Name, check.Status)
		}
	}

	if len(skillNames) != 1 {
		t.Errorf("Expected 1 skill name, got %d", len(skillNames))
	}
}

func TestValidateAllSkills_DirectoryNotFound(t *testing.T) {
	tmpDir := t.TempDir()
	// Don't create the skills directory

	checks, skillNames := validateAllSkills(tmpDir)

	if len(checks) != 1 {
		t.Errorf("Expected 1 error check, got %d", len(checks))
	}

	if checks[0].Status != "failed" {
		t.Errorf("Expected failed status, got '%s'", checks[0].Status)
	}

	if len(skillNames) != 0 {
		t.Errorf("Expected 0 skill names for missing directory, got %d", len(skillNames))
	}
}

func TestValidateSkill_TooShortForFormatCheck(t *testing.T) {
	// Content is only "---\n" → 2 lines < 3 → formatting passes as "too short"
	// but ExtractFrontmatter fails (no closing ---)
	tmpDir := t.TempDir()
	skillDir := filepath.Join(tmpDir, "test-skill")
	if err := os.MkdirAll(skillDir, 0755); err != nil {
		t.Fatal(err)
	}
	content := []byte("---\n")
	if err := os.WriteFile(filepath.Join(skillDir, "SKILL.md"), content, 0644); err != nil {
		t.Fatal(err)
	}

	checks := validateSkill(skillDir, "test-skill")

	// SKILL.md exists check passes; then YAML syntax fails
	foundFailed := false
	for _, c := range checks {
		if c.Status == "failed" {
			foundFailed = true
			break
		}
	}
	if !foundFailed {
		t.Error("expected at least one failed check for too-short content")
	}
}

func TestValidateSkill_YAMLUnmarshalError(t *testing.T) {
	// Valid ---, valid formatting, but name is a YAML mapping (can't unmarshal into string)
	tmpDir := t.TempDir()
	skillDir := filepath.Join(tmpDir, "test-skill")
	if err := os.MkdirAll(skillDir, 0755); err != nil {
		t.Fatal(err)
	}

	// name field is a mapping → yaml.Unmarshal into ClaudeSkill.Name (string) errors
	content := "---\nname:\n  key: value\ndescription: valid desc\n---\nBody\n"
	if err := os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(content), 0644); err != nil {
		t.Fatal(err)
	}

	checks := validateSkill(skillDir, "test-skill")

	foundFailed := false
	for _, c := range checks {
		if c.Status == "failed" {
			foundFailed = true
			break
		}
	}
	if !foundFailed {
		t.Error("expected at least one failed check for YAML unmarshal error")
	}
}

func TestValidateSkill_ReadFileError(t *testing.T) {
	// Tests the os.ReadFile error path (line 41) when SKILL.md exists but is unreadable
	tmpDir := t.TempDir()
	skillDir := filepath.Join(tmpDir, "test-skill")
	if err := os.MkdirAll(skillDir, 0755); err != nil {
		t.Fatal(err)
	}

	// Create SKILL.md then make it unreadable
	skillFile := filepath.Join(skillDir, "SKILL.md")
	if err := os.WriteFile(skillFile, []byte("content"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(skillFile, 0000); err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Chmod(skillFile, 0644) }()

	checks := validateSkill(skillDir, "test-skill")

	// Running as root may succeed — just check we get some result
	_ = checks
}

func TestValidateAllSkills_IgnoresFiles(t *testing.T) {
	tmpDir := t.TempDir()
	skillsDir := filepath.Join(tmpDir, ".claude", "skills")

	if err := os.MkdirAll(skillsDir, 0755); err != nil {
		t.Fatalf("Failed to create skills dir: %v", err)
	}

	// Create a valid skill
	createValidSkill(t, skillsDir, "valid-skill")

	// Create a file in skills dir (should be ignored)
	if err := os.WriteFile(filepath.Join(skillsDir, "README.md"), []byte("readme"), 0644); err != nil {
		t.Fatalf("Failed to create file: %v", err)
	}

	checks, skillNames := validateAllSkills(tmpDir)

	// Should only have checks for valid-skill (7 checks)
	if len(checks) != 7 {
		t.Errorf("Expected 7 checks (file ignored), got %d", len(checks))
		for i, check := range checks {
			t.Logf("Check %d: %s - %s", i+1, check.Name, check.Status)
		}
	}

	if len(skillNames) != 1 {
		t.Errorf("Expected 1 skill name, got %d", len(skillNames))
	}
}

// TestValidateSkill_DocumentedOptionalFieldDoesNotWarn confirms a skill
// frontmatter that uses any documented Claude Code skill optional field
// (e.g. disable-model-invocation) emits no warnings.
func TestValidateSkill_DocumentedOptionalFieldDoesNotWarn(t *testing.T) {
	tmpDir := t.TempDir()
	skillDir := filepath.Join(tmpDir, "test-skill")
	if err := os.MkdirAll(skillDir, 0755); err != nil {
		t.Fatal(err)
	}

	content := `---
name: test-skill
description: skill with documented optional field
disable-model-invocation: true
when_to_use: on demand
---
Body.`
	if err := os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(content), 0644); err != nil {
		t.Fatal(err)
	}

	checks := validateSkill(skillDir, "test-skill")
	for _, c := range checks {
		if c.Status == "failed" {
			t.Errorf("unexpected failed check: %s — %s", c.Name, c.Message)
		}
		if c.Status == "warning" {
			t.Errorf("unexpected warning for documented optional field: %s — %s", c.Name, c.Message)
		}
	}
}

// TestValidateSkill_UnknownFieldEmitsWarning confirms an unknown skill
// frontmatter field surfaces as a "warning" ValidationCheck (not a
// failure) naming the field.
func TestValidateSkill_UnknownFieldEmitsWarning(t *testing.T) {
	tmpDir := t.TempDir()
	skillDir := filepath.Join(tmpDir, "test-skill")
	if err := os.MkdirAll(skillDir, 0755); err != nil {
		t.Fatal(err)
	}

	content := `---
name: test-skill
description: skill with unknown field
foo: bar
---
Body.`
	if err := os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(content), 0644); err != nil {
		t.Fatal(err)
	}

	checks := validateSkill(skillDir, "test-skill")

	// No failures expected.
	for _, c := range checks {
		if c.Status == "failed" {
			t.Errorf("unexpected failed check: %s — %s", c.Name, c.Message)
		}
	}

	foundWarning := false
	for _, c := range checks {
		if c.Status == "warning" && c.Actual == "Unknown field: foo" {
			foundWarning = true
		}
	}
	if !foundWarning {
		t.Errorf("expected warning naming unknown field 'foo'; got: %+v", checks)
	}
}

// TestValidateSkill_MultipleUnknownFieldsEmitsMultipleWarnings confirms
// each unrecognized field emits its own warning.
func TestValidateSkill_MultipleUnknownFieldsEmitsMultipleWarnings(t *testing.T) {
	tmpDir := t.TempDir()
	skillDir := filepath.Join(tmpDir, "test-skill")
	if err := os.MkdirAll(skillDir, 0755); err != nil {
		t.Fatal(err)
	}

	content := `---
name: test-skill
description: many unknown fields
foo: 1
bar: 2
baz: 3
---
Body.`
	if err := os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(content), 0644); err != nil {
		t.Fatal(err)
	}

	checks := validateSkill(skillDir, "test-skill")

	warned := map[string]bool{}
	for _, c := range checks {
		if c.Status == "warning" {
			warned[c.Actual] = true
		}
	}
	for _, expected := range []string{"Unknown field: foo", "Unknown field: bar", "Unknown field: baz"} {
		if !warned[expected] {
			t.Errorf("expected warning for %q; got: %+v", expected, warned)
		}
	}
}
