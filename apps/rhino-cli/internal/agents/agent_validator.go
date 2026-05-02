package agents

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"gopkg.in/yaml.v3"
)

// validModelAlias enumerates the short-form model aliases accepted in
// Claude Code agent frontmatter. The empty string means "inherit from the
// parent session" (legacy behaviour); "inherit" is the explicit form added
// to the spec in 2026.
var validModelAlias = map[string]bool{
	"":        true,
	"sonnet":  true,
	"opus":    true,
	"haiku":   true,
	"inherit": true,
}

// validModelIDPattern matches full Claude model identifiers such as
// claude-opus-4-7, claude-sonnet-4-6, claude-haiku-4-5, claude-3-5-sonnet, etc.
// The regex is intentionally permissive on minor punctuation (lowercase
// letters, digits, hyphens, dots) so new Claude releases do not break the
// validator until the spec snapshot is refreshed.
var validModelIDPattern = regexp.MustCompile(`^claude-[a-z0-9.-]+$`)

// agentToolPattern matches an Agent(...) parameterized tool reference. The
// captured group is the base tool name (always "Agent"); any trailing
// (subagent) argument is stripped before allow-list lookup.
var agentToolPattern = regexp.MustCompile(`^([A-Za-z][A-Za-z0-9_]*)\(.*\)$`)

// validateAgent performs all validation rules for a single agent.
//
// Returns a slice of ValidationCheck values. Status may be "passed",
// "warning", or "failed"; only "failed" should drive a non-zero exit code.
func validateAgent(
	agentPath string,
	filename string,
	agentNames map[string]bool,
	skillNames map[string]bool,
) []ValidationCheck {
	var checks []ValidationCheck

	// Read agent file
	content, err := os.ReadFile(agentPath)
	if err != nil {
		checks = append(checks, ValidationCheck{
			Name:    fmt.Sprintf("Agent: %s - Read File", filename),
			Status:  "failed",
			Message: fmt.Sprintf("Failed to read file: %v", err),
		})
		return checks
	}

	// Rule 0: YAML formatting (check BEFORE normalization)
	formattingCheck := validateYAMLFormatting(filename, content)
	checks = append(checks, formattingCheck)
	if formattingCheck.Status == "failed" {
		return checks
	}

	// Rule 1: YAML frontmatter syntax validity
	frontmatter, _, err := ExtractFrontmatter(content)
	if err != nil {
		checks = append(checks, ValidationCheck{
			Name:    fmt.Sprintf("Agent: %s - YAML Syntax", filename),
			Status:  "failed",
			Message: fmt.Sprintf("Invalid frontmatter: %v", err),
		})
		return checks
	}
	checks = append(checks, ValidationCheck{
		Name:    fmt.Sprintf("Agent: %s - YAML Syntax", filename),
		Status:  "passed",
		Message: "Valid YAML frontmatter",
	})

	// Parse YAML into ClaudeAgentFull (custom UnmarshalYAML normalizes
	// tools into []string regardless of source shape).
	var agent ClaudeAgentFull
	if err := yaml.Unmarshal(frontmatter, &agent); err != nil {
		checks = append(checks, ValidationCheck{
			Name:    fmt.Sprintf("Agent: %s - YAML Parse", filename),
			Status:  "failed",
			Message: fmt.Sprintf("Failed to parse YAML: %v", err),
		})
		return checks
	}

	// Rule 2: Required fields present (only name + description per spec)
	requiredFieldsCheck := validateRequiredFields(filename, agent)
	checks = append(checks, requiredFieldsCheck)
	if requiredFieldsCheck.Status == "failed" {
		return checks
	}

	// Rule 3: Field order (relaxed) — required-first FAIL, unknown WARN.
	checks = append(checks, validateFieldOrder(filename, frontmatter)...)

	// Rule 4: Valid tool names
	toolsCheck := validateTools(filename, agent.Tools)
	checks = append(checks, toolsCheck)

	// Rule 5: Valid model names
	modelCheck := validateModel(filename, agent.Model)
	checks = append(checks, modelCheck)

	// Rule 6: Valid colors (only enforced when color is set; color is
	// optional per the relaxed spec).
	if agent.Color != "" {
		colorCheck := validateColor(filename, agent.Color)
		checks = append(checks, colorCheck)
	}

	// Rule 7: Filename matches name field
	filenameCheck := validateFilename(filename, agent.Name)
	checks = append(checks, filenameCheck)

	// Rule 8: Agent name uniqueness
	uniquenessCheck := validateUniqueness(filename, agent.Name, agentNames)
	checks = append(checks, uniquenessCheck)
	if uniquenessCheck.Status == "passed" {
		agentNames[agent.Name] = true
	}

	// Rule 9: Skills references exist
	skillsCheck := validateSkillsExist(filename, agent.Skills, skillNames)
	checks = append(checks, skillsCheck)

	// Rule 10: No YAML comments in frontmatter
	commentsCheck := validateNoComments(filename, frontmatter)
	checks = append(checks, commentsCheck)

	// Rule 11: Special rule for generated-reports/ agents
	if strings.Contains(agentPath, "generated-reports") {
		reportsCheck := validateGeneratedReportsTools(filename, agent.Tools)
		checks = append(checks, reportsCheck)
	}

	return checks
}

// validateRequiredFields checks that all required fields (name, description)
// are present. Tools and color are NOT required per the Claude Code spec
// — they are optional fields and their absence is acceptable.
func validateRequiredFields(filename string, agent ClaudeAgentFull) ValidationCheck {
	missing := []string{}

	if agent.Name == "" {
		missing = append(missing, "name")
	}
	if agent.Description == "" {
		missing = append(missing, "description")
	}

	if len(missing) > 0 {
		return ValidationCheck{
			Name:     fmt.Sprintf("Agent: %s - Required Fields", filename),
			Status:   "failed",
			Expected: "All required fields present",
			Actual:   fmt.Sprintf("Missing: %v", missing),
			Message:  "Required fields missing",
		}
	}

	return ValidationCheck{
		Name:    fmt.Sprintf("Agent: %s - Required Fields", filename),
		Status:  "passed",
		Message: "All required fields present",
	}
}

// validateFieldOrder enforces a two-tier rule:
//
//  1. Required fields (name, description) MUST appear before any optional
//     field. A required-after-optional ordering is a FAIL.
//  2. Optional fields may appear in any order.
//  3. Any field NOT in the documented Claude Code field set produces a
//     "warning" ValidationCheck (one per unknown field) rather than a
//     failure.
//
// The function returns a slice of ValidationCheck values: at most one
// "Field Order" check (passed or failed), plus zero or more "Unknown Field"
// warnings.
func validateFieldOrder(filename string, frontmatter []byte) []ValidationCheck {
	// Parse as generic YAML to get field order
	var data yaml.Node
	if err := yaml.Unmarshal(frontmatter, &data); err != nil {
		return []ValidationCheck{{
			Name:    fmt.Sprintf("Agent: %s - Field Order", filename),
			Status:  "failed",
			Message: fmt.Sprintf("Failed to parse YAML for order check: %v", err),
		}}
	}

	// Extract field names in order
	var fieldNames []string
	if data.Kind == yaml.DocumentNode && len(data.Content) > 0 {
		content := data.Content[0]
		if content.Kind == yaml.MappingNode {
			for i := 0; i < len(content.Content); i += 2 {
				if content.Content[i].Kind == yaml.ScalarNode {
					fieldNames = append(fieldNames, content.Content[i].Value)
				}
			}
		}
	}

	requiredSet := make(map[string]bool, len(RequiredFields))
	for _, f := range RequiredFields {
		requiredSet[f] = true
	}

	// Required-first check: once any optional field is seen, no further
	// required field may appear.
	sawOptional := false
	var outOfOrder []string
	for _, field := range fieldNames {
		if requiredSet[field] {
			if sawOptional {
				outOfOrder = append(outOfOrder, field)
			}
		} else {
			sawOptional = true
		}
	}

	var checks []ValidationCheck
	if len(outOfOrder) > 0 {
		checks = append(checks, ValidationCheck{
			Name:     fmt.Sprintf("Agent: %s - Field Order", filename),
			Status:   "failed",
			Expected: fmt.Sprintf("Required fields %v appear before any optional field", RequiredFields),
			Actual:   fmt.Sprintf("Required field(s) appear after optional field: %v", outOfOrder),
			Message:  "Required fields must appear before optional fields",
		})
	} else {
		checks = append(checks, ValidationCheck{
			Name:    fmt.Sprintf("Agent: %s - Field Order", filename),
			Status:  "passed",
			Message: "Required fields appear before optional fields",
		})
	}

	// Unknown-field warnings: one per unrecognized field name.
	for _, field := range fieldNames {
		if !ValidClaudeAgentFields[field] {
			checks = append(checks, ValidationCheck{
				Name:     fmt.Sprintf("Agent: %s - Unknown Field: %s", filename, field),
				Status:   "warning",
				Expected: "Field listed in ValidClaudeAgentFields",
				Actual:   fmt.Sprintf("Unknown field: %s", field),
				Message:  fmt.Sprintf("Field %q is not in the documented Claude Code agent field set; verify it is intentional", field),
			})
		}
	}

	return checks
}

// validateTools checks that all tools are valid Claude Code tool names.
//
// Accepts the normalized []string shape (the YAML-shape variance — string
// vs sequence — is resolved upstream by ClaudeAgentFull.UnmarshalYAML and
// ParseClaudeTools). Each entry is matched against ValidTools; the
// parameterized form Agent(<sub>) is stripped to its base name before
// lookup.
//
// Unknown tool names remain a FAIL (not a warning), because a typo in a
// tool name silently disables the tool at runtime — that is a real bug,
// not an advisory.
func validateTools(filename string, tools []string) ValidationCheck {
	invalid := []string{}

	for _, tool := range tools {
		tool = strings.TrimSpace(tool)
		if tool == "" {
			continue
		}
		base := tool
		if m := agentToolPattern.FindStringSubmatch(tool); m != nil {
			base = m[1]
		}
		if !ValidTools[base] {
			invalid = append(invalid, tool)
		}
	}

	if len(invalid) > 0 {
		validToolsList := make([]string, 0, len(ValidTools))
		for t := range ValidTools {
			validToolsList = append(validToolsList, t)
		}
		return ValidationCheck{
			Name:     fmt.Sprintf("Agent: %s - Valid Tools", filename),
			Status:   "failed",
			Expected: fmt.Sprintf("Valid tools: %v", validToolsList),
			Actual:   fmt.Sprintf("Invalid tools: %v", invalid),
			Message:  "Invalid tool names",
		}
	}

	return ValidationCheck{
		Name:    fmt.Sprintf("Agent: %s - Valid Tools", filename),
		Status:  "passed",
		Message: "All tools valid",
	}
}

// validateModel checks that the model is a recognized alias OR a
// well-formed Claude model identifier (e.g. claude-opus-4-7).
func validateModel(filename string, model string) ValidationCheck {
	if validModelAlias[model] || validModelIDPattern.MatchString(model) {
		return ValidationCheck{
			Name:    fmt.Sprintf("Agent: %s - Valid Model", filename),
			Status:  "passed",
			Message: "Model valid",
		}
	}

	return ValidationCheck{
		Name:     fmt.Sprintf("Agent: %s - Valid Model", filename),
		Status:   "failed",
		Expected: "<empty>|sonnet|opus|haiku|inherit|claude-*",
		Actual:   fmt.Sprintf("Model: %s", model),
		Message:  "Invalid model",
	}
}

// validateColor checks that the color is valid
func validateColor(filename string, color string) ValidationCheck {
	if !ValidColors[color] {
		validColors := []string{"red", "blue", "green", "yellow", "purple", "orange", "pink", "cyan"}
		return ValidationCheck{
			Name:     fmt.Sprintf("Agent: %s - Valid Color", filename),
			Status:   "failed",
			Expected: fmt.Sprintf("Valid colors: %v", validColors),
			Actual:   fmt.Sprintf("Color: %s", color),
			Message:  "Invalid color",
		}
	}

	return ValidationCheck{
		Name:    fmt.Sprintf("Agent: %s - Valid Color", filename),
		Status:  "passed",
		Message: "Color valid",
	}
}

// validateFilename checks that filename matches name field
func validateFilename(filename string, name string) ValidationCheck {
	expectedFilename := name + ".md"
	if filename != expectedFilename {
		return ValidationCheck{
			Name:     fmt.Sprintf("Agent: %s - Filename Match", filename),
			Status:   "failed",
			Expected: fmt.Sprintf("Filename: %s", expectedFilename),
			Actual:   fmt.Sprintf("Filename: %s", filename),
			Message:  "Filename does not match name field",
		}
	}

	return ValidationCheck{
		Name:    fmt.Sprintf("Agent: %s - Filename Match", filename),
		Status:  "passed",
		Message: "Filename matches name",
	}
}

// validateUniqueness checks that agent name is unique
func validateUniqueness(filename string, name string, agentNames map[string]bool) ValidationCheck {
	if agentNames[name] {
		return ValidationCheck{
			Name:     fmt.Sprintf("Agent: %s - Name Uniqueness", filename),
			Status:   "failed",
			Expected: "Unique agent name",
			Actual:   fmt.Sprintf("Duplicate name: %s", name),
			Message:  "Agent name already used",
		}
	}

	return ValidationCheck{
		Name:    fmt.Sprintf("Agent: %s - Name Uniqueness", filename),
		Status:  "passed",
		Message: "Agent name unique",
	}
}

// validateSkillsExist checks that all referenced skills exist
func validateSkillsExist(filename string, skills []string, skillNames map[string]bool) ValidationCheck {
	missing := []string{}

	for _, skill := range skills {
		if !skillNames[skill] {
			missing = append(missing, skill)
		}
	}

	if len(missing) > 0 {
		return ValidationCheck{
			Name:     fmt.Sprintf("Agent: %s - Skills Exist", filename),
			Status:   "failed",
			Expected: "All skills exist",
			Actual:   fmt.Sprintf("Missing skills: %v", missing),
			Message:  "Referenced skills not found",
		}
	}

	return ValidationCheck{
		Name:    fmt.Sprintf("Agent: %s - Skills Exist", filename),
		Status:  "passed",
		Message: "All skills exist",
	}
}

// validateNoComments checks that frontmatter has no YAML comments
func validateNoComments(filename string, frontmatter []byte) ValidationCheck {
	lines := bytes.Split(frontmatter, []byte("\n"))
	for _, line := range lines {
		trimmed := bytes.TrimSpace(line)
		if bytes.HasPrefix(trimmed, []byte("#")) {
			return ValidationCheck{
				Name:     fmt.Sprintf("Agent: %s - No Comments", filename),
				Status:   "failed",
				Expected: "No YAML comments",
				Actual:   "Comments found",
				Message:  "YAML comments not allowed in frontmatter",
			}
		}
	}

	return ValidationCheck{
		Name:    fmt.Sprintf("Agent: %s - No Comments", filename),
		Status:  "passed",
		Message: "No YAML comments",
	}
}

// validateYAMLFormatting checks that YAML has proper formatting (space after colons)
// This check runs BEFORE normalization to catch formatting issues
func validateYAMLFormatting(filename string, content []byte) ValidationCheck {
	return validateYAMLFormattingRaw(fmt.Sprintf("Agent: %s - YAML Formatting", filename), content)
}

// validateGeneratedReportsTools checks that generated-reports agents have Write AND Bash.
//
// Accepts the normalized []string tools form. Trims whitespace from each
// entry; entries with parameterized syntax (Agent(...)) are matched on
// the base name.
func validateGeneratedReportsTools(filename string, tools []string) ValidationCheck {
	hasWrite := false
	hasBash := false

	for _, tool := range tools {
		tool = strings.TrimSpace(tool)
		base := tool
		if m := agentToolPattern.FindStringSubmatch(tool); m != nil {
			base = m[1]
		}
		if base == "Write" {
			hasWrite = true
		}
		if base == "Bash" {
			hasBash = true
		}
	}

	if !hasWrite || !hasBash {
		return ValidationCheck{
			Name:     fmt.Sprintf("Agent: %s - Generated Reports Tools", filename),
			Status:   "failed",
			Expected: "Tools must include: Write, Bash",
			Actual:   fmt.Sprintf("Has Write: %v, Has Bash: %v", hasWrite, hasBash),
			Message:  "generated-reports/ agents must have Write AND Bash tools",
		}
	}

	return ValidationCheck{
		Name:    fmt.Sprintf("Agent: %s - Generated Reports Tools", filename),
		Status:  "passed",
		Message: "Has required Write and Bash tools",
	}
}

// validateAllAgents validates all agents in parallel
func validateAllAgents(repoRoot string, skillNames map[string]bool) []ValidationCheck {
	agentsDir := filepath.Join(repoRoot, ".claude", "agents")

	entries, err := os.ReadDir(agentsDir)
	if err != nil {
		return []ValidationCheck{{
			Name:    "Read Agents Directory",
			Status:  "failed",
			Message: fmt.Sprintf("Failed to read agents directory: %v", err),
		}}
	}

	agentNames := make(map[string]bool)
	var allChecks []ValidationCheck

	// Validate each agent
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".md") || entry.Name() == "README.md" {
			continue
		}

		agentPath := filepath.Join(agentsDir, entry.Name())
		checks := validateAgent(agentPath, entry.Name(), agentNames, skillNames)
		allChecks = append(allChecks, checks...)
	}

	return allChecks
}
