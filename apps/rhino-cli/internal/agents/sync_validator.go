package agents

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

// ValidateSync validates that .claude/ and .opencode/ are in sync
func ValidateSync(repoRoot string) (*ValidationResult, error) {
	startTime := time.Now()
	result := &ValidationResult{
		Checks: []ValidationCheck{},
	}

	// 1. Validate agent count
	countCheck := validateAgentCount(repoRoot)
	result.Checks = append(result.Checks, countCheck)
	if countCheck.Status == "passed" {
		result.PassedChecks++
	} else {
		result.FailedChecks++
	}
	result.TotalChecks++

	// 2. Validate agent equivalence
	equivalenceChecks := validateAgentEquivalence(repoRoot)
	for _, check := range equivalenceChecks {
		result.Checks = append(result.Checks, check)
		if check.Status == "passed" {
			result.PassedChecks++
		} else {
			result.FailedChecks++
		}
		result.TotalChecks++
	}

	// 3. Validate skills count
	skillCountCheck := validateSkillCount(repoRoot)
	result.Checks = append(result.Checks, skillCountCheck)
	if skillCountCheck.Status == "passed" {
		result.PassedChecks++
	} else {
		result.FailedChecks++
	}
	result.TotalChecks++

	// 4. Validate skill identity (byte-for-byte match)
	skillChecks := validateSkillIdentity(repoRoot)
	for _, check := range skillChecks {
		result.Checks = append(result.Checks, check)
		if check.Status == "passed" {
			result.PassedChecks++
		} else {
			result.FailedChecks++
		}
		result.TotalChecks++
	}

	result.Duration = time.Since(startTime)

	return result, nil
}

// validateAgentCount checks that agent counts match
func validateAgentCount(repoRoot string) ValidationCheck {
	claudeDir := filepath.Join(repoRoot, ".claude", "agents")
	opencodeDir := filepath.Join(repoRoot, OpenCodeAgentDir)

	claudeCount := countMarkdownFiles(claudeDir)
	opencodeCount := countMarkdownFiles(opencodeDir)

	if claudeCount == opencodeCount {
		return ValidationCheck{
			Name:     "Agent Count",
			Status:   "passed",
			Expected: fmt.Sprintf("%d agents", claudeCount),
			Actual:   fmt.Sprintf("%d agents", opencodeCount),
			Message:  "Agent counts match",
		}
	}

	return ValidationCheck{
		Name:     "Agent Count",
		Status:   "failed",
		Expected: fmt.Sprintf("%d agents", claudeCount),
		Actual:   fmt.Sprintf("%d agents", opencodeCount),
		Message:  "Agent counts do not match",
	}
}

// validateAgentEquivalence checks semantic equivalence of agents
func validateAgentEquivalence(repoRoot string) []ValidationCheck {
	var checks []ValidationCheck

	claudeDir := filepath.Join(repoRoot, ".claude", "agents")
	opencodeDir := filepath.Join(repoRoot, OpenCodeAgentDir)

	entries, err := os.ReadDir(claudeDir)
	if err != nil {
		checks = append(checks, ValidationCheck{
			Name:    "Agent Equivalence",
			Status:  "failed",
			Message: fmt.Sprintf("Failed to read Claude agents directory: %v", err),
		})
		return checks
	}

	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".md") || entry.Name() == "README.md" {
			continue
		}

		claudePath := filepath.Join(claudeDir, entry.Name())
		opencodePath := filepath.Join(opencodeDir, entry.Name())

		check := validateAgentFile(entry.Name(), claudePath, opencodePath)
		checks = append(checks, check)
	}

	return checks
}

// validateAgentFile checks if a single agent file is semantically equivalent
func validateAgentFile(name, claudePath, opencodePath string) ValidationCheck {
	// Read Claude agent
	claudeContent, err := os.ReadFile(claudePath)
	if err != nil {
		return ValidationCheck{
			Name:    fmt.Sprintf("Agent: %s", name),
			Status:  "failed",
			Message: fmt.Sprintf("Failed to read Claude agent: %v", err),
		}
	}

	// Read OpenCode agent
	opencodeContent, err := os.ReadFile(opencodePath)
	if err != nil {
		return ValidationCheck{
			Name:    fmt.Sprintf("Agent: %s", name),
			Status:  "failed",
			Message: fmt.Sprintf("Failed to read OpenCode agent: %v", err),
		}
	}

	// Parse both
	claudeFront, claudeBody, err := ExtractFrontmatter(claudeContent)
	if err != nil {
		return ValidationCheck{
			Name:    fmt.Sprintf("Agent: %s", name),
			Status:  "failed",
			Message: fmt.Sprintf("Failed to parse Claude frontmatter: %v", err),
		}
	}

	opencodeFront, opencodeBody, err := ExtractFrontmatter(opencodeContent)
	if err != nil {
		return ValidationCheck{
			Name:    fmt.Sprintf("Agent: %s", name),
			Status:  "failed",
			Message: fmt.Sprintf("Failed to parse OpenCode frontmatter: %v", err),
		}
	}

	// Parse YAML
	var claudeData map[string]interface{}
	if err := yaml.Unmarshal(claudeFront, &claudeData); err != nil {
		return ValidationCheck{
			Name:    fmt.Sprintf("Agent: %s", name),
			Status:  "failed",
			Message: fmt.Sprintf("Failed to parse Claude YAML: %v", err),
		}
	}

	var opencodeAgent OpenCodeAgent
	if err := yaml.Unmarshal(opencodeFront, &opencodeAgent); err != nil {
		return ValidationCheck{
			Name:    fmt.Sprintf("Agent: %s", name),
			Status:  "failed",
			Message: fmt.Sprintf("Failed to parse OpenCode YAML: %v", err),
		}
	}

	// Check description
	claudeDesc := ""
	if desc, ok := claudeData["description"].(string); ok {
		claudeDesc = desc
	}

	if claudeDesc != opencodeAgent.Description {
		return ValidationCheck{
			Name:     fmt.Sprintf("Agent: %s", name),
			Status:   "failed",
			Expected: "Matching descriptions",
			Actual:   "Descriptions differ",
			Message:  "Description mismatch",
		}
	}

	// Check model conversion
	claudeModel := ""
	if m, ok := claudeData["model"].(string); ok {
		claudeModel = m
	}
	expectedModel := ConvertModel(claudeModel)

	if expectedModel != opencodeAgent.Model {
		return ValidationCheck{
			Name:     fmt.Sprintf("Agent: %s", name),
			Status:   "failed",
			Expected: fmt.Sprintf("Model: %s", expectedModel),
			Actual:   fmt.Sprintf("Model: %s", opencodeAgent.Model),
			Message:  "Model mismatch",
		}
	}

	// Check tools
	var claudeTools []string
	if toolsRaw, ok := claudeData["tools"]; ok {
		claudeTools = ParseClaudeTools(toolsRaw)
	}
	expectedTools := ConvertTools(claudeTools)

	if !toolsMatch(expectedTools, opencodeAgent.Tools) {
		return ValidationCheck{
			Name:     fmt.Sprintf("Agent: %s", name),
			Status:   "failed",
			Expected: fmt.Sprintf("Tools: %v", sortedKeys(expectedTools)),
			Actual:   fmt.Sprintf("Tools: %v", sortedKeys(opencodeAgent.Tools)),
			Message:  "Tools mismatch",
		}
	}

	// Check skills
	var claudeSkills []string
	if skillsRaw, ok := claudeData["skills"].([]interface{}); ok {
		for _, skill := range skillsRaw {
			if skillStr, ok := skill.(string); ok {
				claudeSkills = append(claudeSkills, skillStr)
			}
		}
	}

	if !skillsMatch(claudeSkills, opencodeAgent.Skills) {
		return ValidationCheck{
			Name:     fmt.Sprintf("Agent: %s", name),
			Status:   "failed",
			Expected: fmt.Sprintf("Skills: %v", claudeSkills),
			Actual:   fmt.Sprintf("Skills: %v", opencodeAgent.Skills),
			Message:  "Skills mismatch",
		}
	}

	// Check body
	if !bytes.Equal(claudeBody, opencodeBody) {
		return ValidationCheck{
			Name:     fmt.Sprintf("Agent: %s", name),
			Status:   "failed",
			Expected: "Matching body content",
			Actual:   "Body content differs",
			Message:  "Body mismatch",
		}
	}

	return ValidationCheck{
		Name:    fmt.Sprintf("Agent: %s", name),
		Status:  "passed",
		Message: "Agent is semantically equivalent",
	}
}

// validateSkillCount checks that skill counts match
func validateSkillCount(repoRoot string) ValidationCheck {
	claudeDir := filepath.Join(repoRoot, ".claude", "skills")
	opencodeDir := filepath.Join(repoRoot, ".opencode", "skill")

	// Count skills in .claude/skills (directories with SKILL.md)
	claudeCount := 0
	if entries, err := os.ReadDir(claudeDir); err == nil {
		for _, entry := range entries {
			if entry.IsDir() {
				skillFile := filepath.Join(claudeDir, entry.Name(), "SKILL.md")
				if _, err := os.Stat(skillFile); err == nil {
					claudeCount++
				}
			}
		}
	}

	// Count skills in .opencode/skill (directories with SKILL.md)
	opencodeCount := 0
	if entries, err := os.ReadDir(opencodeDir); err == nil {
		for _, entry := range entries {
			if entry.IsDir() {
				skillFile := filepath.Join(opencodeDir, entry.Name(), "SKILL.md")
				if _, err := os.Stat(skillFile); err == nil {
					opencodeCount++
				}
			}
		}
	}

	if claudeCount == opencodeCount {
		return ValidationCheck{
			Name:     "Skill Count",
			Status:   "passed",
			Expected: fmt.Sprintf("%d skills", claudeCount),
			Actual:   fmt.Sprintf("%d skills", opencodeCount),
			Message:  "Skill counts match",
		}
	}

	return ValidationCheck{
		Name:     "Skill Count",
		Status:   "failed",
		Expected: fmt.Sprintf("%d skills", claudeCount),
		Actual:   fmt.Sprintf("%d skills", opencodeCount),
		Message:  "Skill counts do not match",
	}
}

// validateSkillIdentity checks that skills are byte-for-byte identical
func validateSkillIdentity(repoRoot string) []ValidationCheck {
	var checks []ValidationCheck

	claudeDir := filepath.Join(repoRoot, ".claude", "skills")
	opencodeDir := filepath.Join(repoRoot, ".opencode", "skill")

	entries, err := os.ReadDir(claudeDir)
	if err != nil {
		checks = append(checks, ValidationCheck{
			Name:    "Skill Identity",
			Status:  "failed",
			Message: fmt.Sprintf("Failed to read Claude skills directory: %v", err),
		})
		return checks
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		skillFile := filepath.Join(claudeDir, entry.Name(), "SKILL.md")
		if _, err := os.Stat(skillFile); os.IsNotExist(err) {
			continue
		}

		// OpenCode skills are also in folders with SKILL.md
		opencodeFile := filepath.Join(opencodeDir, entry.Name(), "SKILL.md")

		check := validateSkillFile(entry.Name(), skillFile, opencodeFile)
		checks = append(checks, check)
	}

	return checks
}

// validateSkillFile checks if a skill file is byte-for-byte identical
func validateSkillFile(name, claudePath, opencodePath string) ValidationCheck {
	claudeContent, err := os.ReadFile(claudePath)
	if err != nil {
		return ValidationCheck{
			Name:    fmt.Sprintf("Skill: %s", name),
			Status:  "failed",
			Message: fmt.Sprintf("Failed to read Claude skill: %v", err),
		}
	}

	opencodeContent, err := os.ReadFile(opencodePath)
	if err != nil {
		return ValidationCheck{
			Name:    fmt.Sprintf("Skill: %s", name),
			Status:  "failed",
			Message: fmt.Sprintf("Failed to read OpenCode skill: %v", err),
		}
	}

	if bytes.Equal(claudeContent, opencodeContent) {
		return ValidationCheck{
			Name:    fmt.Sprintf("Skill: %s", name),
			Status:  "passed",
			Message: "Skill content is identical",
		}
	}

	return ValidationCheck{
		Name:     fmt.Sprintf("Skill: %s", name),
		Status:   "failed",
		Expected: "Identical content",
		Actual:   "Content differs",
		Message:  "Skill content mismatch",
	}
}

// Helper functions

func countMarkdownFiles(dir string) int {
	count := 0
	entries, err := os.ReadDir(dir)
	if err != nil {
		return 0
	}

	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".md") && entry.Name() != "README.md" {
			count++
		}
	}

	return count
}

func toolsMatch(a, b map[string]bool) bool {
	if len(a) != len(b) {
		return false
	}

	for key, val := range a {
		if b[key] != val {
			return false
		}
	}

	return true
}

func skillsMatch(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}

	for i, skill := range a {
		if skill != b[i] {
			return false
		}
	}

	return true
}

func sortedKeys(m map[string]bool) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return keys
}
