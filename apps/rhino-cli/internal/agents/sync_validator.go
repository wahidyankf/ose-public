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

	// 0. Validate no stale singular agent directory exists
	staleCheck := validateNoStaleAgentDir(repoRoot)
	result.Checks = append(result.Checks, staleCheck)
	if staleCheck.Status == "passed" {
		result.PassedChecks++
	} else {
		result.FailedChecks++
	}
	result.TotalChecks++

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

	// 3. Validate no synced skill mirror exists. OpenCode reads
	// .claude/skills/ natively per opencode.ai/docs/skills/, so any
	// rhino-cli-generated skill copy under .opencode/skill/ or
	// .opencode/skills/ is non-canonical and should be removed.
	noSkillCheck := validateNoSyncedSkills(repoRoot)
	result.Checks = append(result.Checks, noSkillCheck)
	if noSkillCheck.Status == "passed" {
		result.PassedChecks++
	} else {
		result.FailedChecks++
	}
	result.TotalChecks++

	result.Duration = time.Since(startTime)

	return result, nil
}

// validateNoStaleAgentDir asserts the legacy singular .opencode/agent/
// directory does not exist. The Phase 3 atomic move from singular to
// plural removed it; this guard catches accidental resurrection
// (e.g. a stale Nx generator config or a hand-created file). Failure
// names the path so the developer knows where to clean up.
func validateNoStaleAgentDir(repoRoot string) ValidationCheck {
	staleDir := filepath.Join(repoRoot, ".opencode", "agent")
	info, err := os.Stat(staleDir)
	if os.IsNotExist(err) {
		return ValidationCheck{
			Name:    "No Stale Agent Directory",
			Status:  "passed",
			Message: "Legacy singular .opencode/agent/ does not exist",
		}
	}
	if err != nil {
		return ValidationCheck{
			Name:    "No Stale Agent Directory",
			Status:  "failed",
			Message: fmt.Sprintf("Failed to stat .opencode/agent/: %v", err),
		}
	}
	if info.IsDir() {
		return ValidationCheck{
			Name:     "No Stale Agent Directory",
			Status:   "failed",
			Expected: ".opencode/agent/ does not exist",
			Actual:   ".opencode/agent/ exists as a directory",
			Message:  "Stale singular .opencode/agent/ reappeared; canonical OpenCode path is .opencode/agents/ (plural). Remove the stale directory.",
		}
	}
	return ValidationCheck{
		Name:     "No Stale Agent Directory",
		Status:   "failed",
		Expected: ".opencode/agent/ does not exist",
		Actual:   ".opencode/agent/ exists",
		Message:  "Stale .opencode/agent/ entry reappeared; canonical OpenCode path is .opencode/agents/ (plural). Remove the stale entry.",
	}
}

// validateAgentCount checks that every Claude agent has a corresponding
// OpenCode agent. The check is one-directional (claude ⊆ opencode):
// OpenCode-only agents (e.g. Nx-generated subagents like
// ci-monitor-subagent) have no Claude source and are tolerated as extras.
// validateAgentEquivalence performs the per-agent semantic check on the
// Claude-side set.
func validateAgentCount(repoRoot string) ValidationCheck {
	claudeDir := filepath.Join(repoRoot, ".claude", "agents")
	opencodeDir := filepath.Join(repoRoot, OpenCodeAgentDir)

	claudeCount := countMarkdownFiles(claudeDir)
	opencodeCount := countMarkdownFiles(opencodeDir)

	if opencodeCount >= claudeCount {
		return ValidationCheck{
			Name:     "Agent Count",
			Status:   "passed",
			Expected: fmt.Sprintf(">= %d agents", claudeCount),
			Actual:   fmt.Sprintf("%d agents", opencodeCount),
			Message:  "OpenCode agents directory contains every Claude agent",
		}
	}

	return ValidationCheck{
		Name:     "Agent Count",
		Status:   "failed",
		Expected: fmt.Sprintf(">= %d agents", claudeCount),
		Actual:   fmt.Sprintf("%d agents", opencodeCount),
		Message:  "OpenCode agents directory missing one or more Claude agents",
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

// validateNoSyncedSkills asserts that no rhino-cli-managed skill mirror
// exists. OpenCode reads .claude/skills/<name>/SKILL.md natively per
// opencode.ai/docs/skills/, so any copy under .opencode/skill/
// (singular) or .opencode/skills/ (plural) that mirrors a
// .claude/skills/ entry is non-canonical and should be removed.
//
// Note: third-party tooling (e.g. an Nx generator) MAY populate
// .opencode/skills/<other-name>/SKILL.md with skills that have NO
// .claude/skills/ counterpart. Those are tolerated. This check fails
// only when a mirror directory contains an entry whose name appears
// under .claude/skills/.
func validateNoSyncedSkills(repoRoot string) ValidationCheck {
	claudeDir := filepath.Join(repoRoot, ".claude", "skills")
	claudeNames := map[string]bool{}
	if entries, err := os.ReadDir(claudeDir); err == nil {
		for _, entry := range entries {
			if entry.IsDir() {
				skillFile := filepath.Join(claudeDir, entry.Name(), "SKILL.md")
				if _, err := os.Stat(skillFile); err == nil {
					claudeNames[entry.Name()] = true
				}
			}
		}
	}

	mirrorDirs := []string{
		filepath.Join(repoRoot, ".opencode", "skill"),
		filepath.Join(repoRoot, ".opencode", "skills"),
	}

	var offenders []string
	for _, dir := range mirrorDirs {
		entries, err := os.ReadDir(dir)
		if err != nil {
			continue
		}
		for _, entry := range entries {
			if entry.IsDir() && claudeNames[entry.Name()] {
				skillFile := filepath.Join(dir, entry.Name(), "SKILL.md")
				if _, err := os.Stat(skillFile); err == nil {
					offenders = append(offenders, filepath.Join(dir, entry.Name()))
				}
			}
		}
	}

	if len(offenders) == 0 {
		return ValidationCheck{
			Name:    "No Synced Skill Mirror",
			Status:  "passed",
			Message: "No rhino-cli-managed skill copies under .opencode/skill or .opencode/skills",
		}
	}

	return ValidationCheck{
		Name:     "No Synced Skill Mirror",
		Status:   "failed",
		Expected: "No skill copy mirroring .claude/skills/<name>",
		Actual:   fmt.Sprintf("Found %d mirrored skill dir(s): %v", len(offenders), offenders),
		Message:  "OpenCode reads .claude/skills/ natively; remove the mirror copies",
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
