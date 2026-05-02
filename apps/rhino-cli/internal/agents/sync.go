// Package agents provides agent configuration management across Claude Code and OpenCode,
// including format validation, sync orchestration, and conversion.
package agents

import (
	"time"
)

// SyncAll performs the complete sync operation
func SyncAll(opts SyncOptions) (*SyncResult, error) {
	startTime := time.Now()
	result := &SyncResult{
		FailedFiles: []string{},
		Warnings:    []ConversionWarning{},
	}

	// Sync agents (unless skills-only)
	if !opts.SkillsOnly {
		agentsConverted, agentsFailed, agentFailedFiles, agentWarnings, err := ConvertAllAgents(opts.RepoRoot, opts.DryRun)
		if err != nil {
			return nil, err
		}
		result.AgentsConverted = agentsConverted
		result.AgentsFailed = agentsFailed
		result.FailedFiles = append(result.FailedFiles, agentFailedFiles...)
		result.Warnings = append(result.Warnings, agentWarnings...)
	}

	// Sync skills (unless agents-only)
	if !opts.AgentsOnly {
		skillsCopied, skillsFailed, skillFailedFiles, err := CopyAllSkills(opts.RepoRoot, opts.DryRun)
		if err != nil {
			return nil, err
		}
		result.SkillsCopied = skillsCopied
		result.SkillsFailed = skillsFailed
		result.FailedFiles = append(result.FailedFiles, skillFailedFiles...)
	}

	result.Duration = time.Since(startTime)

	return result, nil
}
