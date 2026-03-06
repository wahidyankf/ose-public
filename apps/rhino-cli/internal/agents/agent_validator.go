package agents

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

// validateAgent performs all 12 validation rules for a single agent
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

	// Parse YAML into ClaudeAgentFull
	var agent ClaudeAgentFull
	if err := yaml.Unmarshal(frontmatter, &agent); err != nil {
		checks = append(checks, ValidationCheck{
			Name:    fmt.Sprintf("Agent: %s - YAML Parse", filename),
			Status:  "failed",
			Message: fmt.Sprintf("Failed to parse YAML: %v", err),
		})
		return checks
	}

	// Rule 2: Required fields present
	requiredFieldsCheck := validateRequiredFields(filename, agent)
	checks = append(checks, requiredFieldsCheck)
	if requiredFieldsCheck.Status == "failed" {
		return checks
	}

	// Rule 3: Field order matches spec
	fieldOrderCheck := validateFieldOrder(filename, frontmatter)
	checks = append(checks, fieldOrderCheck)

	// Rule 4: Valid tool names
	toolsCheck := validateTools(filename, agent.Tools)
	checks = append(checks, toolsCheck)

	// Rule 5: Valid model names
	modelCheck := validateModel(filename, agent.Model)
	checks = append(checks, modelCheck)

	// Rule 6: Valid colors
	colorCheck := validateColor(filename, agent.Color)
	checks = append(checks, colorCheck)

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

// validateRequiredFields checks that all required fields are present
func validateRequiredFields(filename string, agent ClaudeAgentFull) ValidationCheck {
	missing := []string{}

	if agent.Name == "" {
		missing = append(missing, "name")
	}
	if agent.Description == "" {
		missing = append(missing, "description")
	}
	if agent.Tools == "" {
		missing = append(missing, "tools")
	}
	// model can be empty (valid)
	if agent.Color == "" {
		missing = append(missing, "color")
	}
	// skills can be empty (valid)

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

// validateFieldOrder checks that fields are in the correct order
func validateFieldOrder(filename string, frontmatter []byte) ValidationCheck {
	// Parse as generic YAML to get field order
	var data yaml.Node
	if err := yaml.Unmarshal(frontmatter, &data); err != nil {
		return ValidationCheck{
			Name:    fmt.Sprintf("Agent: %s - Field Order", filename),
			Status:  "failed",
			Message: fmt.Sprintf("Failed to parse YAML for order check: %v", err),
		}
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

	// Check order against required order
	expectedOrder := RequiredFieldOrder
	if len(fieldNames) > len(expectedOrder) {
		return ValidationCheck{
			Name:     fmt.Sprintf("Agent: %s - Field Order", filename),
			Status:   "failed",
			Expected: fmt.Sprintf("Fields: %v", expectedOrder),
			Actual:   fmt.Sprintf("Fields: %v", fieldNames),
			Message:  "Extra fields present",
		}
	}

	for i, field := range fieldNames {
		if i >= len(expectedOrder) || field != expectedOrder[i] {
			return ValidationCheck{
				Name:     fmt.Sprintf("Agent: %s - Field Order", filename),
				Status:   "failed",
				Expected: fmt.Sprintf("Order: %v", expectedOrder[:len(fieldNames)]),
				Actual:   fmt.Sprintf("Order: %v", fieldNames),
				Message:  "Field order incorrect",
			}
		}
	}

	return ValidationCheck{
		Name:    fmt.Sprintf("Agent: %s - Field Order", filename),
		Status:  "passed",
		Message: "Field order correct",
	}
}

// validateTools checks that all tools are valid
func validateTools(filename string, toolsStr string) ValidationCheck {
	// Parse tools (comma-separated)
	tools := strings.Split(toolsStr, ",")
	invalid := []string{}

	for _, tool := range tools {
		tool = strings.TrimSpace(tool)
		if tool == "" {
			continue
		}
		if !ValidTools[tool] {
			invalid = append(invalid, tool)
		}
	}

	if len(invalid) > 0 {
		validToolsList := []string{}
		for tool := range ValidTools {
			validToolsList = append(validToolsList, tool)
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

// validateModel checks that the model is valid
func validateModel(filename string, model string) ValidationCheck {
	if !ValidModels[model] {
		validModels := []string{"(empty)", "sonnet", "opus", "haiku"}
		return ValidationCheck{
			Name:     fmt.Sprintf("Agent: %s - Valid Model", filename),
			Status:   "failed",
			Expected: fmt.Sprintf("Valid models: %v", validModels),
			Actual:   fmt.Sprintf("Model: %s", model),
			Message:  "Invalid model",
		}
	}

	return ValidationCheck{
		Name:    fmt.Sprintf("Agent: %s - Valid Model", filename),
		Status:  "passed",
		Message: "Model valid",
	}
}

// validateColor checks that the color is valid
func validateColor(filename string, color string) ValidationCheck {
	if !ValidColors[color] {
		validColors := []string{"blue", "green", "yellow", "purple"}
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

// validateGeneratedReportsTools checks that generated-reports agents have Write AND Bash
func validateGeneratedReportsTools(filename string, toolsStr string) ValidationCheck {
	tools := strings.Split(toolsStr, ",")
	hasWrite := false
	hasBash := false

	for _, tool := range tools {
		tool = strings.TrimSpace(tool)
		if tool == "Write" {
			hasWrite = true
		}
		if tool == "Bash" {
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
