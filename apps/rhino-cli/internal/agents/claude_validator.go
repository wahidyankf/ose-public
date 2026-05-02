package agents

import (
	"time"
)

// ValidateClaude validates .claude/ directory format
func ValidateClaude(opts ValidateClaudeOptions) (*ValidationResult, error) {
	startTime := time.Now()
	result := &ValidationResult{
		Checks: []ValidationCheck{},
	}

	var skillNames map[string]bool

	// Validate skills first (needed for agent validation)
	if !opts.AgentsOnly {
		skillChecks, names := validateAllSkills(opts.RepoRoot)
		skillNames = names
		for _, check := range skillChecks {
			tallyCheck(result, check)
		}
	} else {
		// If agents-only, still need to build skill names for validation
		_, skillNames = validateAllSkills(opts.RepoRoot)
	}

	// Validate agents
	if !opts.SkillsOnly {
		agentChecks := validateAllAgents(opts.RepoRoot, skillNames)
		for _, check := range agentChecks {
			tallyCheck(result, check)
		}
	}

	result.Duration = time.Since(startTime)

	return result, nil
}

// tallyCheck appends a ValidationCheck to result.Checks and increments the
// matching tri-state counter (PassedChecks, WarningChecks, FailedChecks).
// Unknown statuses fall through to FailedChecks defensively so that any
// regression in check construction does not silently inflate the passed
// count.
func tallyCheck(result *ValidationResult, check ValidationCheck) {
	result.Checks = append(result.Checks, check)
	switch check.Status {
	case "passed":
		result.PassedChecks++
	case "warning":
		result.WarningChecks++
	default:
		result.FailedChecks++
	}
	result.TotalChecks++
}
