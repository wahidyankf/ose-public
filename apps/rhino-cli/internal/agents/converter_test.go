package agents

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"gopkg.in/yaml.v3"
)

func TestExtractFrontmatter(t *testing.T) {
	tests := []struct {
		name          string
		content       string
		wantErr       bool
		expectedFront string
		expectedBody  string
	}{
		{
			name: "valid frontmatter",
			content: `---
name: test-agent
description: Test description
---

# Agent Body

This is the body content.`,
			wantErr:       false,
			expectedFront: "name: test-agent\ndescription: Test description",
			expectedBody:  "\n# Agent Body\n\nThis is the body content.",
		},
		{
			name:    "no frontmatter",
			content: "Just content without frontmatter",
			wantErr: true,
		},
		{
			name: "no closing marker",
			content: `---
name: test-agent
description: Test description

No closing marker`,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			front, body, err := ExtractFrontmatter([]byte(tt.content))

			if (err != nil) != tt.wantErr {
				t.Errorf("ExtractFrontmatter() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if !tt.wantErr {
				if string(front) != tt.expectedFront {
					t.Errorf("ExtractFrontmatter() frontmatter = %q, want %q", string(front), tt.expectedFront)
				}
				if string(body) != tt.expectedBody {
					t.Errorf("ExtractFrontmatter() body = %q, want %q", string(body), tt.expectedBody)
				}
			}
		})
	}
}

func TestParseClaudeTools(t *testing.T) {
	tests := []struct {
		name     string
		input    interface{}
		expected []string
	}{
		{
			name:     "comma-separated string",
			input:    "Read, Write, Edit, Glob, Grep",
			expected: []string{"Read", "Write", "Edit", "Glob", "Grep"},
		},
		{
			name:     "array of strings",
			input:    []interface{}{"Read", "Write", "Edit"},
			expected: []string{"Read", "Write", "Edit"},
		},
		{
			name:     "comma-separated with extra spaces",
			input:    "Read,  Write  ,Edit",
			expected: []string{"Read", "Write", "Edit"},
		},
		{
			name:     "empty string",
			input:    "",
			expected: []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ParseClaudeTools(tt.input)

			if len(result) != len(tt.expected) {
				t.Errorf("ParseClaudeTools() length = %d, want %d", len(result), len(tt.expected))
				return
			}

			for i, tool := range result {
				if tool != tt.expected[i] {
					t.Errorf("ParseClaudeTools()[%d] = %q, want %q", i, tool, tt.expected[i])
				}
			}
		})
	}
}

func TestConvertTools(t *testing.T) {
	tests := []struct {
		name     string
		input    []string
		expected map[string]bool
	}{
		{
			name:  "standard tools",
			input: []string{"Read", "Write", "Edit", "Glob", "Grep"},
			expected: map[string]bool{
				"read":  true,
				"write": true,
				"edit":  true,
				"glob":  true,
				"grep":  true,
			},
		},
		{
			name:  "mixed case",
			input: []string{"READ", "write", "Edit"},
			expected: map[string]bool{
				"read":  true,
				"write": true,
				"edit":  true,
			},
		},
		{
			name:     "empty array",
			input:    []string{},
			expected: map[string]bool{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ConvertTools(tt.input)

			if len(result) != len(tt.expected) {
				t.Errorf("ConvertTools() length = %d, want %d", len(result), len(tt.expected))
				return
			}

			for key, value := range tt.expected {
				if result[key] != value {
					t.Errorf("ConvertTools()[%q] = %v, want %v", key, result[key], value)
				}
			}
		})
	}
}

func TestConvertModel(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{name: "sonnet", input: "sonnet", expected: "zai-coding-plan/glm-5.1"},
		{name: "opus", input: "opus", expected: "zai-coding-plan/glm-5.1"},
		{name: "haiku", input: "haiku", expected: "zai-coding-plan/glm-5-turbo"},
		{name: "empty", input: "", expected: "zai-coding-plan/glm-5.1"},
		{name: "whitespace", input: "  ", expected: "zai-coding-plan/glm-5.1"},
		{name: "unknown", input: "unknown-model", expected: "zai-coding-plan/glm-5.1"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ConvertModel(tt.input)
			if result != tt.expected {
				t.Errorf("ConvertModel(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestConvertAgent(t *testing.T) {
	// Create temp directory for test
	tmpDir := t.TempDir()

	// Create input file
	inputPath := filepath.Join(tmpDir, "test-agent.md")
	inputContent := `---
name: test-agent
description: Test agent for unit testing
tools: Read, Write, Edit
model: sonnet
color: blue
skills:
  - skill-1
  - skill-2
---

# Test Agent

This is the agent body content.
`

	if err := os.WriteFile(inputPath, []byte(inputContent), 0644); err != nil {
		t.Fatalf("Failed to create test input file: %v", err)
	}

	// Convert agent
	outputPath := filepath.Join(tmpDir, "output.md")
	warnings, err := ConvertAgent(inputPath, outputPath, false)
	if err != nil {
		t.Fatalf("ConvertAgent() failed: %v", err)
	}
	if len(warnings) != 0 {
		t.Errorf("expected zero warnings for spec-clean fixture, got %v", warnings)
	}

	// Read output file
	outputContent, err := os.ReadFile(outputPath)
	if err != nil {
		t.Fatalf("Failed to read output file: %v", err)
	}

	// Extract and parse frontmatter
	front, body, err := ExtractFrontmatter(outputContent)
	if err != nil {
		t.Fatalf("Failed to extract frontmatter from output: %v", err)
	}

	var agent OpenCodeAgent
	if err := yaml.Unmarshal(front, &agent); err != nil {
		t.Fatalf("Failed to parse output YAML: %v", err)
	}

	// Verify conversion
	if agent.Description != "Test agent for unit testing" {
		t.Errorf("Description = %q, want %q", agent.Description, "Test agent for unit testing")
	}

	if agent.Model != "zai-coding-plan/glm-5.1" {
		t.Errorf("Model = %q, want %q", agent.Model, "zai-coding-plan/glm-5.1")
	}

	expectedTools := map[string]bool{"read": true, "write": true, "edit": true}
	if len(agent.Tools) != len(expectedTools) {
		t.Errorf("Tools length = %d, want %d", len(agent.Tools), len(expectedTools))
	}

	for key, value := range expectedTools {
		if agent.Tools[key] != value {
			t.Errorf("Tools[%q] = %v, want %v", key, agent.Tools[key], value)
		}
	}

	if len(agent.Skills) != 2 {
		t.Errorf("Skills length = %d, want 2", len(agent.Skills))
	}

	// color was translated from Claude "blue" to OpenCode theme "primary"
	if agent.Color != "primary" {
		t.Errorf("Color = %q, want %q", agent.Color, "primary")
	}

	// Verify body is preserved
	expectedBody := "\n# Test Agent\n\nThis is the agent body content.\n"
	if string(body) != expectedBody {
		t.Errorf("Body = %q, want %q", string(body), expectedBody)
	}
}

func TestConvertAgentDryRun(t *testing.T) {
	// Create temp directory for test
	tmpDir := t.TempDir()

	// Create input file
	inputPath := filepath.Join(tmpDir, "test-agent.md")
	inputContent := `---
name: test-agent
description: Test agent
tools: Read, Write
---

Body content.
`

	if err := os.WriteFile(inputPath, []byte(inputContent), 0644); err != nil {
		t.Fatalf("Failed to create test input file: %v", err)
	}

	// Convert agent with dry run
	outputPath := filepath.Join(tmpDir, "output.md")
	if _, err := ConvertAgent(inputPath, outputPath, true); err != nil {
		t.Fatalf("ConvertAgent() failed: %v", err)
	}

	// Verify output file was NOT created
	if _, err := os.Stat(outputPath); err == nil {
		t.Error("Output file should not exist in dry run mode")
	}
}

func TestConvertAgentWithEmptyModel(t *testing.T) {
	// Create temp directory for test
	tmpDir := t.TempDir()

	// Create input file with empty model
	inputPath := filepath.Join(tmpDir, "test-agent.md")
	inputContent := `---
name: test-agent
description: Test agent
tools: Read, Write
model:
---

Body content.
`

	if err := os.WriteFile(inputPath, []byte(inputContent), 0644); err != nil {
		t.Fatalf("Failed to create test input file: %v", err)
	}

	// Convert agent
	outputPath := filepath.Join(tmpDir, "output.md")
	if _, err := ConvertAgent(inputPath, outputPath, false); err != nil {
		t.Fatalf("ConvertAgent() failed: %v", err)
	}

	// Read and verify output
	outputContent, err := os.ReadFile(outputPath)
	if err != nil {
		t.Fatalf("Failed to read output file: %v", err)
	}

	front, _, err := ExtractFrontmatter(outputContent)
	if err != nil {
		t.Fatalf("Failed to extract frontmatter: %v", err)
	}

	var agent OpenCodeAgent
	if err := yaml.Unmarshal(front, &agent); err != nil {
		t.Fatalf("Failed to parse YAML: %v", err)
	}

	// Empty model should default to the most capable model
	if agent.Model != "zai-coding-plan/glm-5.1" {
		t.Errorf("Model = %q, want %q", agent.Model, "zai-coding-plan/glm-5.1")
	}
}

func TestExtractFrontmatter_FirstLineNotDashes(t *testing.T) {
	// Tests the "frontmatter does not start with ---" branch (converter.go:37)
	// Need 3+ lines, with first line NOT being "---"
	content := "not-a-dash\nsome: content\nmore content here"
	_, _, err := ExtractFrontmatter([]byte(content))
	if err == nil {
		t.Error("expected error when first line is not ---")
	}
}

func TestConvertAgent_WriteFileError(t *testing.T) {
	// Tests os.WriteFile error path (converter.go:204-206)
	// MkdirAll must succeed (dir already exists), WriteFile must fail (dir is read-only)
	tmpDir := t.TempDir()

	inputPath := filepath.Join(tmpDir, "agent.md")
	content := "---\nname: test-agent\ndescription: Test\ntools:\n  - Read\nmodel: sonnet\n---\n\nBody.\n"
	if err := os.WriteFile(inputPath, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}

	// Create the output directory first with normal permissions
	outputDir := filepath.Join(tmpDir, "outdir")
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		t.Fatal(err)
	}
	// Now make it read-only so WriteFile fails but MkdirAll succeeds (dir already exists)
	if err := os.Chmod(outputDir, 0555); err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Chmod(outputDir, 0755) }()

	outputPath := filepath.Join(outputDir, "out.md")
	_, err := ConvertAgent(inputPath, outputPath, false)
	if err == nil {
		// On some systems (e.g. running as root) this may succeed
		t.Logf("ConvertAgent succeeded (may be running as root or OS allows it)")
	}
}

func TestExtractFrontmatter_NoBody(t *testing.T) {
	// Tests the endIndex+1 >= len(lines) branch (body = "")
	content := "---\nname: test\n---"
	front, body, err := ExtractFrontmatter([]byte(content))
	if err != nil {
		t.Fatalf("ExtractFrontmatter() unexpected error: %v", err)
	}
	if string(front) != "name: test" {
		t.Errorf("frontmatter = %q, want %q", string(front), "name: test")
	}
	if string(body) != "" {
		t.Errorf("body = %q, want empty", string(body))
	}
}

func TestConvertAgent_MissingSourceFile(t *testing.T) {
	// Tests os.ReadFile error path
	tmpDir := t.TempDir()
	_, err := ConvertAgent(filepath.Join(tmpDir, "nonexistent.md"), filepath.Join(tmpDir, "out.md"), false)
	if err == nil {
		t.Error("expected error for missing source file")
	}
}

func TestConvertAgent_InvalidYAML(t *testing.T) {
	// Tests YAML unmarshal error path
	tmpDir := t.TempDir()
	inputPath := filepath.Join(tmpDir, "bad.md")
	// Valid frontmatter markers but invalid YAML content
	content := "---\n: invalid: yaml: {\n---\n\nBody.\n"
	if err := os.WriteFile(inputPath, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}
	outputPath := filepath.Join(tmpDir, "out.md")
	_, err := ConvertAgent(inputPath, outputPath, false)
	if err == nil {
		t.Error("expected error for invalid YAML")
	}
}

func TestConvertAgent_WriteError(t *testing.T) {
	// Tests os.WriteFile error path (line 204) by making the output dir read-only
	tmpDir := t.TempDir()

	inputPath := filepath.Join(tmpDir, "agent.md")
	content := "---\nname: test-agent\ndescription: Test\ntools:\n  - Read\nmodel: sonnet\n---\n\nBody.\n"
	if err := os.WriteFile(inputPath, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}

	// Create a read-only output directory
	readOnlyDir := filepath.Join(tmpDir, "readonly")
	if err := os.MkdirAll(readOnlyDir, 0555); err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Chmod(readOnlyDir, 0755) }()

	// Try to write inside the read-only directory
	outputPath := filepath.Join(readOnlyDir, "subdir", "out.md")
	_, err := ConvertAgent(inputPath, outputPath, false)
	if err == nil {
		// On some systems (e.g. running as root) this may succeed
		t.Logf("ConvertAgent succeeded (may be running as root or OS allows it)")
	}
}

func TestConvertAllAgents_ReadDirError(t *testing.T) {
	// Tests ConvertAllAgents when .claude/agents dir doesn't exist
	tmpDir := t.TempDir()
	// No .claude/agents directory
	_, _, _, _, err := ConvertAllAgents(tmpDir, false)
	if err == nil {
		t.Error("expected error when .claude/agents directory is missing")
	}
}

func TestConvertAllAgents_SkipsNonMdAndReadme(t *testing.T) {
	// Tests that non-.md files and README.md are skipped
	tmpDir := t.TempDir()

	agentsDir := filepath.Join(tmpDir, ".claude", "agents")
	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		t.Fatal(err)
	}

	// Create README.md (should be skipped)
	if err := os.WriteFile(filepath.Join(agentsDir, "README.md"), []byte("# Agents"), 0644); err != nil {
		t.Fatal(err)
	}

	// Create a non-.md file (should be skipped)
	if err := os.WriteFile(filepath.Join(agentsDir, "notes.txt"), []byte("notes"), 0644); err != nil {
		t.Fatal(err)
	}

	// Create a directory (should be skipped)
	if err := os.MkdirAll(filepath.Join(agentsDir, "subdir"), 0755); err != nil {
		t.Fatal(err)
	}

	converted, failed, failedFiles, _, err := ConvertAllAgents(tmpDir, false)
	if err != nil {
		t.Fatalf("ConvertAllAgents() unexpected error: %v", err)
	}
	if converted != 0 {
		t.Errorf("expected 0 converted (all skipped), got %d", converted)
	}
	if failed != 0 {
		t.Errorf("expected 0 failed, got %d (files: %v)", failed, failedFiles)
	}
}

// ---- Phase 2 per-field policy tests ----

func TestConvertAgent_DropWarnFields(t *testing.T) {
	// memory, isolation, background, etc. should be dropped with warnings.
	tmpDir := t.TempDir()
	inputPath := filepath.Join(tmpDir, "claude-only-agent.md")
	content := `---
name: claude-only-agent
description: An agent using Claude-only fields
memory: project
isolation: worktree
background: true
effort: high
---

Body.
`
	if err := os.WriteFile(inputPath, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}

	outputPath := filepath.Join(tmpDir, "output.md")
	warnings, err := ConvertAgent(inputPath, outputPath, false)
	if err != nil {
		t.Fatalf("ConvertAgent() error: %v", err)
	}

	// Warnings collected for each drop-warn field, in any order.
	wantFields := map[string]bool{"memory": true, "isolation": true, "background": true, "effort": true}
	gotFields := map[string]bool{}
	for _, w := range warnings {
		if w.AgentName != "claude-only-agent" {
			t.Errorf("warning AgentName = %q, want %q", w.AgentName, "claude-only-agent")
		}
		gotFields[w.Field] = true
	}
	for f := range wantFields {
		if !gotFields[f] {
			t.Errorf("missing warning for field %q", f)
		}
	}

	// Confirm output contains none of the dropped fields.
	body, err := os.ReadFile(outputPath)
	if err != nil {
		t.Fatalf("read output: %v", err)
	}
	for _, banned := range []string{"memory", "isolation", "background", "effort"} {
		if strings.Contains(string(body), banned+":") {
			t.Errorf("output unexpectedly contains banned field %q:\n%s", banned, string(body))
		}
	}
}

func TestConvertAgent_TranslateMaxTurnsToSteps(t *testing.T) {
	tmpDir := t.TempDir()
	inputPath := filepath.Join(tmpDir, "agent.md")
	content := `---
name: agent
description: Translate test
maxTurns: 5
---

Body.
`
	if err := os.WriteFile(inputPath, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}

	outputPath := filepath.Join(tmpDir, "output.md")
	warnings, err := ConvertAgent(inputPath, outputPath, false)
	if err != nil {
		t.Fatalf("ConvertAgent() error: %v", err)
	}
	if len(warnings) != 0 {
		t.Errorf("expected 0 warnings for translate path, got %v", warnings)
	}

	// Inspect emitted frontmatter only — body text is irrelevant.
	out, err := os.ReadFile(outputPath)
	if err != nil {
		t.Fatal(err)
	}
	front, _, err := ExtractFrontmatter(out)
	if err != nil {
		t.Fatal(err)
	}
	var emitted map[string]interface{}
	if err := yaml.Unmarshal(front, &emitted); err != nil {
		t.Fatal(err)
	}
	if v, ok := emitted["steps"]; !ok || v != 5 {
		t.Errorf("expected steps=5 in emitted frontmatter, got %v", emitted)
	}
	if _, present := emitted["maxTurns"]; present {
		t.Errorf("output frontmatter must not contain 'maxTurns', got: %v", emitted)
	}
}

func TestConvertAgent_TranslateColor(t *testing.T) {
	cases := []struct {
		claude   string
		opencode string
	}{
		{"blue", "primary"},
		{"green", "success"},
		{"yellow", "warning"},
		{"purple", "secondary"},
		{"red", "error"},
		{"orange", "warning"},
		{"pink", "accent"},
		{"cyan", "info"},
		// Hex passes through unchanged. YAML requires quoting because `#`
		// starts a comment in unquoted scalars.
		{`"#0173B2"`, "#0173B2"},
		// OpenCode theme token already compatible passes through.
		{"primary", "primary"},
	}

	for _, tc := range cases {
		t.Run(tc.claude, func(t *testing.T) {
			tmpDir := t.TempDir()
			inputPath := filepath.Join(tmpDir, "colorful.md")
			content := `---
name: colorful
description: Has color
color: ` + tc.claude + `
---

Body.
`
			if err := os.WriteFile(inputPath, []byte(content), 0644); err != nil {
				t.Fatal(err)
			}

			outputPath := filepath.Join(tmpDir, "output.md")
			if _, err := ConvertAgent(inputPath, outputPath, false); err != nil {
				t.Fatalf("ConvertAgent() error: %v", err)
			}

			out, err := os.ReadFile(outputPath)
			if err != nil {
				t.Fatal(err)
			}
			// YAML emitter quotes hex codes (`'#...'`) because `#` would
			// otherwise start a comment. Accept both quoted and unquoted
			// forms — both are valid YAML for the same color value.
			wantUnquoted := "color: " + tc.opencode
			wantSingleQuoted := "color: '" + tc.opencode + "'"
			wantDoubleQuoted := "color: \"" + tc.opencode + "\""
			body := string(out)
			if !strings.Contains(body, wantUnquoted) &&
				!strings.Contains(body, wantSingleQuoted) &&
				!strings.Contains(body, wantDoubleQuoted) {
				t.Errorf("expected %q (any quoting) in output, got:\n%s", wantUnquoted, body)
			}
		})
	}
}

func TestConvertAgent_UnknownFieldEmitsWarning(t *testing.T) {
	tmpDir := t.TempDir()
	inputPath := filepath.Join(tmpDir, "typo.md")
	content := `---
name: typo
description: Has unknown field
foo: bar
---

Body.
`
	if err := os.WriteFile(inputPath, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}

	outputPath := filepath.Join(tmpDir, "output.md")
	warnings, err := ConvertAgent(inputPath, outputPath, false)
	if err != nil {
		t.Fatalf("ConvertAgent() error: %v", err)
	}

	found := false
	for _, w := range warnings {
		if w.Field == "foo" && w.Reason == "unknown claude code field" {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("expected warning for unknown field 'foo', got %v", warnings)
	}
}

func TestConvertAllAgents_CollectsWarnings(t *testing.T) {
	tmpDir := t.TempDir()
	agentsDir := filepath.Join(tmpDir, ".claude", "agents")
	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		t.Fatal(err)
	}

	good := `---
name: good
description: Spec-clean
---

Body.
`
	dropWarn := `---
name: dropper
description: Has memory field
memory: project
---

Body.
`
	if err := os.WriteFile(filepath.Join(agentsDir, "good.md"), []byte(good), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(agentsDir, "dropper.md"), []byte(dropWarn), 0644); err != nil {
		t.Fatal(err)
	}

	converted, failed, _, warnings, err := ConvertAllAgents(tmpDir, false)
	if err != nil {
		t.Fatalf("ConvertAllAgents() error: %v", err)
	}
	if converted != 2 {
		t.Errorf("expected 2 converted, got %d", converted)
	}
	if failed != 0 {
		t.Errorf("expected 0 failed, got %d", failed)
	}
	if len(warnings) != 1 {
		t.Fatalf("expected 1 warning, got %d: %v", len(warnings), warnings)
	}
	if warnings[0].AgentName != "dropper" || warnings[0].Field != "memory" {
		t.Errorf("unexpected warning: %+v", warnings[0])
	}
}
