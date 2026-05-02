package agents

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

// validateSkillYAMLFormatting checks YAML has proper formatting
func validateSkillYAMLFormatting(skillName string, content []byte) ValidationCheck {
	return validateYAMLFormattingRaw(fmt.Sprintf("Skill: %s - YAML Formatting", skillName), content)
}

// validateSkill performs all 7 validation rules for a single skill
func validateSkill(skillPath string, skillName string) []ValidationCheck {
	var checks []ValidationCheck

	// Rule 1: SKILL.md file exists in subdirectory
	skillFile := filepath.Join(skillPath, "SKILL.md")
	if _, err := os.Stat(skillFile); os.IsNotExist(err) {
		checks = append(checks, ValidationCheck{
			Name:     fmt.Sprintf("Skill: %s - SKILL.md Exists", skillName),
			Status:   "failed",
			Expected: "SKILL.md file present",
			Actual:   "SKILL.md file not found",
			Message:  "SKILL.md file missing",
		})
		return checks
	}
	checks = append(checks, ValidationCheck{
		Name:    fmt.Sprintf("Skill: %s - SKILL.md Exists", skillName),
		Status:  "passed",
		Message: "SKILL.md file exists",
	})

	// Read SKILL.md file
	content, err := os.ReadFile(skillFile)
	if err != nil {
		checks = append(checks, ValidationCheck{
			Name:    fmt.Sprintf("Skill: %s - Read SKILL.md", skillName),
			Status:  "failed",
			Message: fmt.Sprintf("Failed to read SKILL.md: %v", err),
		})
		return checks
	}

	// Rule 0: YAML formatting (check BEFORE normalization)
	formattingCheck := validateSkillYAMLFormatting(skillName, content)
	checks = append(checks, formattingCheck)
	if formattingCheck.Status == "failed" {
		return checks
	}

	// Rule 3: YAML syntax validity
	frontmatter, _, err := ExtractFrontmatter(content)
	if err != nil {
		checks = append(checks, ValidationCheck{
			Name:    fmt.Sprintf("Skill: %s - YAML Syntax", skillName),
			Status:  "failed",
			Message: fmt.Sprintf("Invalid frontmatter: %v", err),
		})
		return checks
	}
	checks = append(checks, ValidationCheck{
		Name:    fmt.Sprintf("Skill: %s - YAML Syntax", skillName),
		Status:  "passed",
		Message: "Valid YAML frontmatter",
	})

	// Parse YAML into ClaudeSkill
	var skill ClaudeSkill
	if err := yaml.Unmarshal(frontmatter, &skill); err != nil {
		checks = append(checks, ValidationCheck{
			Name:    fmt.Sprintf("Skill: %s - YAML Parse", skillName),
			Status:  "failed",
			Message: fmt.Sprintf("Failed to parse YAML: %v", err),
		})
		return checks
	}

	// Rule 2: Required frontmatter field: description
	if skill.Description == "" {
		checks = append(checks, ValidationCheck{
			Name:     fmt.Sprintf("Skill: %s - Description Field Required", skillName),
			Status:   "failed",
			Expected: "description field present",
			Actual:   "description field missing or empty",
			Message:  "Required description field missing",
		})
		return checks
	}
	checks = append(checks, ValidationCheck{
		Name:    fmt.Sprintf("Skill: %s - Description Field Required", skillName),
		Status:  "passed",
		Message: "Required description field present",
	})

	// Rule 4: Required frontmatter field: name
	if skill.Name == "" {
		checks = append(checks, ValidationCheck{
			Name:     fmt.Sprintf("Skill: %s - Name Field Required", skillName),
			Status:   "failed",
			Expected: "name field present",
			Actual:   "name field missing or empty",
			Message:  "Required name field missing",
		})
		return checks
	}
	checks = append(checks, ValidationCheck{
		Name:    fmt.Sprintf("Skill: %s - Name Field Required", skillName),
		Status:  "passed",
		Message: "Required name field present",
	})

	// Rule 5: Name format (lowercase, hyphens, max 64 chars)
	if !ValidSkillNamePattern.MatchString(skill.Name) {
		checks = append(checks, ValidationCheck{
			Name:     fmt.Sprintf("Skill: %s - Name Format", skillName),
			Status:   "failed",
			Expected: "Lowercase letters/numbers/hyphens only, max 64 chars",
			Actual:   fmt.Sprintf("Name: %s", skill.Name),
			Message:  "Invalid skill name format",
		})
		return checks
	}
	checks = append(checks, ValidationCheck{
		Name:    fmt.Sprintf("Skill: %s - Name Format", skillName),
		Status:  "passed",
		Message: "Name format valid",
	})

	// Rule 6: Name matches directory name
	if skill.Name != skillName {
		checks = append(checks, ValidationCheck{
			Name:     fmt.Sprintf("Skill: %s - Name Match", skillName),
			Status:   "failed",
			Expected: fmt.Sprintf("name field matches directory: %s", skillName),
			Actual:   fmt.Sprintf("name field: %s", skill.Name),
			Message:  "Skill name must match directory name",
		})
		return checks
	}
	checks = append(checks, ValidationCheck{
		Name:    fmt.Sprintf("Skill: %s - Name Match", skillName),
		Status:  "passed",
		Message: "Name matches directory name",
	})

	// Rule 7: Unknown frontmatter fields surface as warnings, not failures.
	// Re-parse the frontmatter into a generic map and walk the keys against
	// the documented Claude Code skill field allow-list.
	var generic map[string]interface{}
	if err := yaml.Unmarshal(frontmatter, &generic); err == nil {
		for key := range generic {
			if !ValidClaudeSkillFields[key] {
				checks = append(checks, ValidationCheck{
					Name:     fmt.Sprintf("Skill: %s - Unknown Field: %s", skillName, key),
					Status:   "warning",
					Expected: "Field listed in ValidClaudeSkillFields",
					Actual:   fmt.Sprintf("Unknown field: %s", key),
					Message:  fmt.Sprintf("Field %q is not in the documented Claude Code skill field set; verify it is intentional", key),
				})
			}
		}
	}

	return checks
}

// validateAllSkills validates all skills and returns skill names map
func validateAllSkills(repoRoot string) ([]ValidationCheck, map[string]bool) {
	skillsDir := filepath.Join(repoRoot, ".claude", "skills")

	entries, err := os.ReadDir(skillsDir)
	if err != nil {
		return []ValidationCheck{{
			Name:    "Read Skills Directory",
			Status:  "failed",
			Message: fmt.Sprintf("Failed to read skills directory: %v", err),
		}}, make(map[string]bool)
	}

	skillNames := make(map[string]bool)
	var allChecks []ValidationCheck

	// Validate each skill
	for _, entry := range entries {
		if !entry.IsDir() || strings.HasPrefix(entry.Name(), ".") {
			continue
		}

		skillPath := filepath.Join(skillsDir, entry.Name())
		checks := validateSkill(skillPath, entry.Name())
		allChecks = append(allChecks, checks...)

		// Add to skill names if validation passed
		allPassed := true
		for _, check := range checks {
			if check.Status == "failed" {
				allPassed = false
				break
			}
		}
		if allPassed {
			skillNames[entry.Name()] = true
		}
	}

	return allChecks, skillNames
}
