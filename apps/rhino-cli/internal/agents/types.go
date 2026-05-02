package agents

import (
	"regexp"
	"time"
)

// ---- Sync types (from former internal/sync) ----

// ClaudeAgent represents Claude Code format agent configuration
type ClaudeAgent struct {
	Name        string   `yaml:"name"`
	Description string   `yaml:"description"`
	Tools       []string `yaml:"tools"` // Can be array or comma-separated
	Model       string   `yaml:"model,omitempty"`
	Color       string   `yaml:"color,omitempty"`
	Skills      []string `yaml:"skills,omitempty"`
}

// OpenCodeAgent represents OpenCode format agent configuration.
//
// Field set is the subset of OpenCode-recognized agent fields that
// rhino-cli emits, per the per-field policy table in
// converter.go (claudeAgentFieldPolicy). Phase 2 of the
// validate-claude-opencode-sync-correctness plan added Color (preserved
// from Claude `color`) and Steps (translated from Claude `maxTurns`).
type OpenCodeAgent struct {
	Description string          `yaml:"description"`
	Model       string          `yaml:"model"`           // "zai-coding-plan/glm-5.1" | "zai-coding-plan/glm-5-turbo"
	Tools       map[string]bool `yaml:"tools"`           // read: true, write: true, etc.
	Color       string          `yaml:"color,omitempty"` // pass-through from Claude `color`
	Steps       int             `yaml:"steps,omitempty"` // translated from Claude `maxTurns`
	Skills      []string        `yaml:"skills,omitempty"`
}

// SyncOptions configures sync behavior
type SyncOptions struct {
	RepoRoot   string
	DryRun     bool
	AgentsOnly bool
	SkillsOnly bool
	Verbose    bool
	Quiet      bool
}

// SyncResult contains operation results.
//
// Warnings is the (possibly empty) list of ConversionWarning entries
// emitted by ConvertAgent during the run — one entry per dropped or
// translated-with-loss frontmatter field. Warnings are advisory and do
// NOT change the success exit code; sync still completes successfully
// when fields are dropped per the documented per-field policy.
type SyncResult struct {
	AgentsConverted int
	AgentsFailed    int
	SkillsCopied    int
	SkillsFailed    int
	FailedFiles     []string
	Warnings        []ConversionWarning
	Duration        time.Duration
}

// ValidationResult contains validation results.
//
// Tri-state semantics (Phase 1 of validate-claude-opencode-sync-correctness plan):
// PassedChecks + WarningChecks + FailedChecks == TotalChecks. Warnings are
// informational signals (e.g. unknown frontmatter field) that do not fail
// validation; FailedChecks is the only count that should drive a non-zero
// exit code.
type ValidationResult struct {
	TotalChecks   int
	PassedChecks  int
	WarningChecks int
	FailedChecks  int
	Checks        []ValidationCheck
	Duration      time.Duration
}

// ValidationCheck represents a single validation check.
//
// Status values:
//   - "passed"  — the check evaluated affirmatively.
//   - "warning" — the check surfaced an advisory finding (e.g. unknown
//     frontmatter field) that does not fail validation but should be
//     reviewed by a maintainer.
//   - "failed"  — the check evaluated negatively and contributes to a
//     non-zero exit code.
type ValidationCheck struct {
	Name     string
	Status   string // "passed" | "warning" | "failed"
	Expected string
	Actual   string
	Message  string
}

// ---- Claude validation types (from former internal/claude) ----

// ClaudeAgentFull represents a complete Claude Code agent with all required fields.
//
// Tools is parsed from either a comma-separated YAML scalar or a YAML
// sequence — see UnmarshalYAML below — and exposed as []string. This
// resolves the long-standing inconsistency where ClaudeAgent.Tools was
// []string while ClaudeAgentFull.Tools was string.
type ClaudeAgentFull struct {
	Name        string   `yaml:"name"`
	Description string   `yaml:"description"`
	Tools       []string `yaml:"tools"`
	Model       string   `yaml:"model"` // empty | sonnet | opus | haiku | inherit | claude-* ID
	Color       string   `yaml:"color"` // see ValidColors
	Skills      []string `yaml:"skills,omitempty"`
}

// claudeAgentFullRaw mirrors ClaudeAgentFull but accepts the YAML-shape
// flexibility for tools (string or sequence). It is used internally by
// UnmarshalYAML to normalize tools into []string before populating the
// public struct.
type claudeAgentFullRaw struct {
	Name        string      `yaml:"name"`
	Description string      `yaml:"description"`
	Tools       interface{} `yaml:"tools"`
	Model       string      `yaml:"model"`
	Color       string      `yaml:"color"`
	Skills      []string    `yaml:"skills,omitempty"`
}

// UnmarshalYAML implements custom YAML unmarshalling for ClaudeAgentFull
// so that the `tools` field accepts either a comma-separated string or a
// YAML sequence; both shapes are normalized to []string. Strings are split
// on `,` and trimmed.
func (a *ClaudeAgentFull) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var raw claudeAgentFullRaw
	if err := unmarshal(&raw); err != nil {
		return err
	}

	a.Name = raw.Name
	a.Description = raw.Description
	a.Model = raw.Model
	a.Color = raw.Color
	a.Skills = raw.Skills

	if raw.Tools != nil {
		a.Tools = ParseClaudeTools(raw.Tools)
	}

	return nil
}

// ClaudeSkill represents a Claude Code skill configuration
type ClaudeSkill struct {
	Name        string `yaml:"name"`
	Description string `yaml:"description"`
}

// ValidationError represents a validation error with detailed information
type ValidationError struct {
	AgentName string
	SkillName string
	Rule      string
	Message   string
	Expected  string
	Actual    string
}

// ValidateClaudeOptions configures validation behavior
type ValidateClaudeOptions struct {
	RepoRoot   string
	AgentsOnly bool
	SkillsOnly bool
}

// ValidTools lists all recognized tool names in Claude Code agent frontmatter.
// Updated 2026-05-02 to cover the current Claude Code tool surface, including
// Agent (renamed from Task; Task remains an alias) and the parameterized
// Agent(<sub-agent-name>) form, which is matched separately by stripping
// the parenthesized argument before lookup.
var ValidTools = map[string]bool{
	// Core file & shell tools
	"Read":         true,
	"Write":        true,
	"Edit":         true,
	"Glob":         true,
	"Grep":         true,
	"Bash":         true,
	"BashOutput":   true,
	"KillShell":    true,
	"NotebookEdit": true,
	"TodoWrite":    true,
	// Web tools
	"WebFetch":  true,
	"WebSearch": true,
	// Agent / orchestration tools
	"Agent":         true,
	"Task":          true, // Legacy alias for Agent
	"SlashCommand":  true,
	"ExitPlanMode":  true,
	"EnterPlanMode": true,
	// MCP-related tools
	"ListMcpResourcesTool": true,
	"ReadMcpResourceTool":  true,
	// Other
	"AskUserQuestion": true,
}

// ValidModels lists the recognized model alias values in Claude Code agent
// frontmatter. Full model IDs (e.g. claude-opus-4-7) are accepted via regex
// and not enumerated here; see validateModel in agent_validator.go.
//
// Retained for backwards compatibility with any external caller.
var ValidModels = map[string]bool{
	"":        true, // Empty is valid (inherits)
	"sonnet":  true,
	"opus":    true,
	"haiku":   true,
	"inherit": true,
}

// ValidColors lists all recognized color values in Claude Code agent
// frontmatter. Updated 2026-05-02 to the current Claude Code spec:
// red, blue, green, yellow, purple, orange, pink, cyan.
var ValidColors = map[string]bool{
	"red":    true,
	"blue":   true,
	"green":  true,
	"yellow": true,
	"purple": true,
	"orange": true,
	"pink":   true,
	"cyan":   true,
}

// ValidSkillNamePattern validates skill name format
// Lowercase letters, numbers, hyphens only, max 64 characters
var ValidSkillNamePattern = regexp.MustCompile(`^[a-z0-9-]{1,64}$`)

// RequiredFields names the agent frontmatter fields that MUST be present.
// Per the Claude Code sub-agents spec (verified 2026-05-02), only `name`
// and `description` are mandatory; all other fields are optional.
var RequiredFields = []string{"name", "description"}

// RequiredFieldOrder defines the legacy strict ordering of fields in agent
// frontmatter.
//
// Deprecated: Phase 1 of the validate-claude-opencode-sync-correctness plan
// relaxed field-order enforcement to a two-tier rule: required fields first,
// optional fields in any order, and unknown fields surface as warnings.
// See validateFieldOrder in agent_validator.go.
var RequiredFieldOrder = []string{
	"name",
	"description",
	"tools",
	"model",
	"color",
	"skills",
}

// ValidClaudeAgentFields lists the documented Claude Code sub-agent
// frontmatter fields recognized by the validator. Verified against
// code.claude.com/docs/en/sub-agents on 2026-05-02. Unknown fields produce
// a "warning" ValidationCheck rather than a failure (FR-3 of the
// validate-claude-opencode-sync-correctness plan).
var ValidClaudeAgentFields = map[string]bool{
	// Required
	"name":        true,
	"description": true,
	// Tooling and behaviour
	"tools":           true,
	"disallowedTools": true,
	"model":           true,
	"permissionMode":  true,
	"maxTurns":        true,
	"skills":          true,
	"mcpServers":      true,
	"hooks":           true,
	"memory":          true,
	"background":      true,
	"effort":          true,
	"isolation":       true,
	"color":           true,
	"initialPrompt":   true,
}

// ValidClaudeSkillFields lists the recognized Claude Code skill (and
// SKILL.md) frontmatter fields. Includes both the OpenCode-recognized
// fields (name, description, license, compatibility, metadata) and the
// Claude Code skill extensions documented at code.claude.com. Unknown
// fields produce a "warning" ValidationCheck rather than a failure.
var ValidClaudeSkillFields = map[string]bool{
	// Required
	"name":        true,
	"description": true,
	// Documented optional fields
	"license":                  true,
	"compatibility":            true,
	"metadata":                 true,
	"when_to_use":              true,
	"argument-hint":            true,
	"arguments":                true,
	"disable-model-invocation": true,
	"user-invocable":           true,
	"allowed-tools":            true,
	"model":                    true,
	"effort":                   true,
	"context":                  true,
	"agent":                    true,
	"hooks":                    true,
	"paths":                    true,
	"shell":                    true,
}
