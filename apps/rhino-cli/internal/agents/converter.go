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

// OpenCodeAgentDir is the canonical relative path (from repo root) where
// rhino-cli writes converted OpenCode agent files. Plural form per the
// opencode.ai/docs/agents/ docs (verified 2026-05-02 — see
// local-temp/opencode-docs-snapshot-2026-05-02.md). Phase 2 of the
// validate-claude-opencode-sync-correctness plan introduces the constant
// in code; the on-disk filesystem move from the legacy singular
// `.opencode/agents/` directory happens in Phase 3 as a single atomic commit.
const OpenCodeAgentDir = ".opencode/agents"

// ConversionWarning describes a Claude Code frontmatter field that was
// dropped (or otherwise modified-with-loss) during conversion to the
// OpenCode format. Warnings are surfaced in --verbose output and JSON /
// markdown reports but never cause sync to fail — the sync still succeeds
// when fields are dropped per the documented per-field policy. See
// claudeAgentFieldPolicy below for the full policy table.
type ConversionWarning struct {
	AgentName string
	Field     string
	Reason    string
}

// fieldPolicy describes how a single Claude Code agent frontmatter field
// is handled during conversion to OpenCode format.
//
//   - action == "preserve": copy the value into the OpenCode output as-is.
//   - action == "translate": apply a per-field transform (see ConvertAgent
//     for the dispatch); `target` names the corresponding OpenCode field.
//   - action == "drop": omit silently (no warning; the field carries no
//     useful information in OpenCode, e.g. `name` because the filename
//     supplies the agent identifier).
//   - action == "drop-warn": omit and emit a ConversionWarning with the
//     given `reason`.
type fieldPolicy struct {
	action string // "preserve" | "translate" | "drop" | "drop-warn"
	target string // for "translate", the target field name in OpenCode
	reason string // for "drop-warn"
}

// claudeAgentFieldPolicy is the authoritative per-field policy table for
// converting Claude Code agent frontmatter to OpenCode format. Source list
// of Claude Code fields is verified against
// code.claude.com/docs/en/sub-agents on 2026-05-02 (snapshot in
// local-temp/opencode-docs-snapshot-2026-05-02.md). Keep this table in sync
// with ValidClaudeAgentFields in types.go — the same upstream spec drives
// both. Spec drift is caught by spec_fidelity_test.go's
// TestEveryClaudeFieldIsPolicied which fails if any field appearing in
// ValidClaudeAgentFields lacks a policy entry here.
//
// Policy decisions per FR-5 of the plan
// (`plans/in-progress/2026-05-02__validate-claude-opencode-sync-correctness/`):
var claudeAgentFieldPolicy = map[string]fieldPolicy{
	// Required fields
	"name":        {action: "drop", reason: "filename carries name"},
	"description": {action: "preserve"},
	// Tooling and behaviour
	"tools": {action: "translate", target: "tools"},
	"model": {action: "translate", target: "model"},
	// TODO(plan-followup): per Phase 0 spec snapshot, OpenCode `color` accepts
	// hex codes or theme tokens (primary/secondary/accent/success/warning/
	// error/info), NOT the Claude Code color names (red/blue/green/yellow/
	// purple/orange/pink/cyan). The plan policy says "preserve" with the
	// (incorrect) note "named values map 1:1". OpenCode docs state "unknown
	// fields are ignored" so preservation is harmless today, but if OpenCode
	// later rejects unknown color values, a Claude→OpenCode color translation
	// map (e.g. red→error, green→success, yellow→warning) will be needed in
	// a future plan. spec_fidelity_test.go's TestNoUnknownFieldInOpenCodeOutput
	// will surface the mismatch via OpenCode-recognized field check.
	"color":  {action: "preserve"},
	"skills": {action: "preserve"},
	// Drop-with-warning: documented Claude-only fields with no OpenCode
	// equivalent today. tools→permission migration is a separate followup
	// plan; mcpServers and hooks are documented in plan §"Out-of-Scope".
	"disallowedTools": {action: "drop-warn", reason: "no opencode equivalent"},
	"permissionMode":  {action: "drop-warn", reason: "use opencode permission block"},
	"maxTurns":        {action: "translate", target: "steps"},
	"effort":          {action: "drop-warn", reason: "claude-only"},
	"memory":          {action: "drop-warn", reason: "claude-only"},
	"isolation":       {action: "drop-warn", reason: "claude-only"},
	"background":      {action: "drop-warn", reason: "claude-only"},
	"initialPrompt":   {action: "drop-warn", reason: "claude-only"},
	"mcpServers":      {action: "drop-warn", reason: "opencode declares mcp at config level"},
	"hooks":           {action: "drop-warn", reason: "no opencode equivalent"},
}

// normalizeYAML fixes common YAML formatting issues in Claude agent files
// Specifically, adds spaces after colons where missing (e.g., "name:value" -> "name: value")
func normalizeYAML(content []byte) []byte {
	// Pattern: word character or hyphen followed by colon, then non-whitespace
	// This matches "name:value" but not "name: value" or "  - item"
	re := regexp.MustCompile(`(?m)^([a-zA-Z0-9_-]+):([^\s])`)

	// Replace with space after colon
	normalized := re.ReplaceAll(content, []byte("$1: $2"))

	return normalized
}

// ExtractFrontmatter extracts YAML frontmatter and body from markdown content
func ExtractFrontmatter(content []byte) (frontmatter []byte, body []byte, err error) {
	// Look for frontmatter between --- markers
	lines := bytes.Split(content, []byte("\n"))

	if len(lines) < 3 {
		return nil, content, fmt.Errorf("file too short to contain frontmatter")
	}

	// First line should be ---
	if !bytes.Equal(bytes.TrimSpace(lines[0]), []byte("---")) {
		return nil, content, fmt.Errorf("frontmatter does not start with ---")
	}

	// Find the closing ---
	endIndex := -1
	for i := 1; i < len(lines); i++ {
		if bytes.Equal(bytes.TrimSpace(lines[i]), []byte("---")) {
			endIndex = i
			break
		}
	}

	if endIndex == -1 {
		return nil, content, fmt.Errorf("frontmatter closing --- not found")
	}

	// Extract frontmatter (without the --- markers)
	frontmatter = bytes.Join(lines[1:endIndex], []byte("\n"))

	// Normalize YAML (fix formatting issues like missing spaces after colons)
	frontmatter = normalizeYAML(frontmatter)

	// Extract body (everything after closing ---)
	if endIndex+1 < len(lines) {
		body = bytes.Join(lines[endIndex+1:], []byte("\n"))
	} else {
		body = []byte("")
	}

	return frontmatter, body, nil
}

// ParseClaudeTools parses tools from Claude format (comma-separated or array)
func ParseClaudeTools(toolsRaw interface{}) []string {
	var tools []string

	switch v := toolsRaw.(type) {
	case []interface{}:
		// Already an array
		for _, tool := range v {
			if toolStr, ok := tool.(string); ok {
				tools = append(tools, toolStr)
			}
		}
	case string:
		// Comma-separated string
		parts := strings.Split(v, ",")
		for _, part := range parts {
			trimmed := strings.TrimSpace(part)
			if trimmed != "" {
				tools = append(tools, trimmed)
			}
		}
	}

	return tools
}

// ConvertTools converts Claude tools array to OpenCode tools map
func ConvertTools(claudeTools []string) map[string]bool {
	tools := make(map[string]bool)

	for _, tool := range claudeTools {
		toolLower := strings.ToLower(strings.TrimSpace(tool))
		if toolLower != "" {
			tools[toolLower] = true
		}
	}

	return tools
}

// ConvertModel converts Claude model to OpenCode model
func ConvertModel(claudeModel string) string {
	model := strings.TrimSpace(claudeModel)

	switch model {
	case "sonnet", "opus":
		return "zai-coding-plan/glm-5.1"
	case "haiku":
		return "zai-coding-plan/glm-5-turbo"
	default:
		// Default to the most capable model.
		// "inherit" is not a valid OpenCode model value and causes
		// ProviderModelNotFoundError, so we use an explicit model ID.
		return "zai-coding-plan/glm-5.1"
	}
}

// agentNameFromPath returns the bare agent name (filename without .md
// extension) used as the AgentName field on ConversionWarning entries.
func agentNameFromPath(p string) string {
	base := filepath.Base(p)
	return strings.TrimSuffix(base, ".md")
}

// ConvertAgent converts a Claude agent to OpenCode format.
//
// Returns a slice of ConversionWarning describing any fields dropped or
// otherwise lost during conversion (per claudeAgentFieldPolicy). Warnings
// are advisory only — the conversion still succeeds. The error return is
// reserved for genuine I/O / parse failures.
func ConvertAgent(inputPath, outputPath string, dryRun bool) ([]ConversionWarning, error) {
	// 1. Read file
	content, err := os.ReadFile(inputPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	// 2. Extract frontmatter and body
	frontmatterBytes, body, err := ExtractFrontmatter(content)
	if err != nil {
		return nil, fmt.Errorf("failed to extract frontmatter: %w", err)
	}

	// 3. Parse Claude YAML as generic map so we can walk fields by key.
	var claudeData map[string]interface{}
	if err := yaml.Unmarshal(frontmatterBytes, &claudeData); err != nil {
		return nil, fmt.Errorf("failed to parse YAML: %w", err)
	}

	agentName := agentNameFromPath(inputPath)
	warnings := make([]ConversionWarning, 0)

	// 4. Walk every key in the parsed Claude frontmatter and dispatch on
	//    policy. Build the OpenCode agent struct alongside.
	out := OpenCodeAgent{}
	for key, value := range claudeData {
		policy, known := claudeAgentFieldPolicy[key]
		if !known {
			// Unknown to the Claude Code spec (per the policy map). This
			// catches typos and forward-compat gaps. Drop with warning.
			warnings = append(warnings, ConversionWarning{
				AgentName: agentName,
				Field:     key,
				Reason:    "unknown claude code field",
			})
			continue
		}

		switch policy.action {
		case "drop":
			// Silently omit (e.g. `name` — filename carries it).
			continue
		case "drop-warn":
			warnings = append(warnings, ConversionWarning{
				AgentName: agentName,
				Field:     key,
				Reason:    policy.reason,
			})
			continue
		case "preserve":
			applyPreserve(&out, key, value)
		case "translate":
			applyTranslate(&out, key, value)
		}
	}

	// 5. Marshal to YAML with 2-space indentation (Prettier standard).
	//    OpenCodeAgent's struct field order and yaml tags drive deterministic
	//    output; map iteration on claudeData above does NOT affect output
	//    ordering because we write into a typed struct.
	var buf bytes.Buffer
	encoder := yaml.NewEncoder(&buf)
	encoder.SetIndent(2)
	if err := encoder.Encode(out); err != nil {
		return warnings, fmt.Errorf("failed to marshal YAML: %w", err)
	}
	if err := encoder.Close(); err != nil {
		return warnings, fmt.Errorf("failed to close YAML encoder: %w", err)
	}
	newFrontmatter := buf.Bytes()

	// 6. Reconstruct markdown
	var output bytes.Buffer
	output.WriteString("---\n")
	output.Write(newFrontmatter)
	output.WriteString("---\n")
	output.Write(body)

	// 7. Write (if not dry run)
	if !dryRun {
		// Ensure output directory exists
		if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
			return warnings, fmt.Errorf("failed to create output directory: %w", err)
		}

		if err := os.WriteFile(outputPath, output.Bytes(), 0644); err != nil {
			return warnings, fmt.Errorf("failed to write file: %w", err)
		}
	}

	return warnings, nil
}

// applyPreserve copies a Claude frontmatter field's value verbatim into
// the OpenCode agent struct. Caller is responsible for providing only
// fields whose policy.action == "preserve".
func applyPreserve(out *OpenCodeAgent, key string, value interface{}) {
	switch key {
	case "description":
		if s, ok := value.(string); ok {
			out.Description = s
		}
	case "color":
		if s, ok := value.(string); ok {
			out.Color = s
		}
	case "skills":
		if seq, ok := value.([]interface{}); ok {
			skills := make([]string, 0, len(seq))
			for _, s := range seq {
				if str, ok := s.(string); ok {
					skills = append(skills, str)
				}
			}
			out.Skills = skills
		}
	}
}

// applyTranslate applies the per-field transform for fields whose
// policy.action == "translate". The transform set is small and explicit;
// adding a new translation requires both a policy entry above and a case
// in this switch.
func applyTranslate(out *OpenCodeAgent, key string, value interface{}) {
	switch key {
	case "tools":
		out.Tools = ConvertTools(ParseClaudeTools(value))
	case "model":
		if s, ok := value.(string); ok {
			out.Model = ConvertModel(s)
		} else {
			// Empty / non-string model → ConvertModel("") → default.
			out.Model = ConvertModel("")
		}
	case "maxTurns":
		// Accept int or YAML's default int decoding.
		switch v := value.(type) {
		case int:
			out.Steps = v
		case int64:
			out.Steps = int(v)
		case float64:
			out.Steps = int(v)
		}
	}
}

// ConvertAllAgents converts all agents from .claude/agents/ to the
// canonical OpenCode plural directory (.opencode/agents/). Returns
// per-conversion warnings so callers (notably SyncAll → SyncResult) can
// surface them in the verbose / JSON / markdown reports.
func ConvertAllAgents(repoRoot string, dryRun bool) (converted int, failed int, failedFiles []string, warnings []ConversionWarning, err error) {
	claudeAgentsDir := filepath.Join(repoRoot, ".claude", "agents")
	opencodeAgentDir := filepath.Join(repoRoot, OpenCodeAgentDir)

	// Read all agent files
	entries, err := os.ReadDir(claudeAgentsDir)
	if err != nil {
		return 0, 0, nil, nil, fmt.Errorf("failed to read .claude/agents directory: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".md") {
			continue
		}

		// Skip README.md
		if entry.Name() == "README.md" {
			continue
		}

		inputPath := filepath.Join(claudeAgentsDir, entry.Name())
		outputPath := filepath.Join(opencodeAgentDir, entry.Name())

		convertWarnings, convErr := ConvertAgent(inputPath, outputPath, dryRun)
		warnings = append(warnings, convertWarnings...)
		if convErr != nil {
			failed++
			failedFiles = append(failedFiles, entry.Name())
		} else {
			converted++
		}
	}

	return converted, failed, failedFiles, warnings, nil
}
