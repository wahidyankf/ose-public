package agents

import (
	"os"
	"path/filepath"
	"testing"
)

func TestValidateAgentCount(t *testing.T) {
	tmpDir := t.TempDir()

	// Create matching counts
	claudeDir := filepath.Join(tmpDir, ".claude", "agents")
	opencodeDir := filepath.Join(tmpDir, OpenCodeAgentDir)

	if err := os.MkdirAll(claudeDir, 0755); err != nil {
		t.Fatalf("Failed to create claude dir: %v", err)
	}
	if err := os.MkdirAll(opencodeDir, 0755); err != nil {
		t.Fatalf("Failed to create opencode dir: %v", err)
	}

	// Create agent files
	for i := 1; i <= 3; i++ {
		filename := filepath.Join(claudeDir, "agent-"+string(rune('0'+i))+".md")
		if err := os.WriteFile(filename, []byte("test"), 0644); err != nil {
			t.Fatalf("Failed to create claude agent: %v", err)
		}

		filename = filepath.Join(opencodeDir, "agent-"+string(rune('0'+i))+".md")
		if err := os.WriteFile(filename, []byte("test"), 0644); err != nil {
			t.Fatalf("Failed to create opencode agent: %v", err)
		}
	}

	// Create README.md (should be ignored)
	if err := os.WriteFile(filepath.Join(claudeDir, "README.md"), []byte("readme"), 0644); err != nil {
		t.Fatalf("Failed to create README: %v", err)
	}

	check := validateAgentCount(tmpDir)

	if check.Status != "passed" {
		t.Errorf("Expected status 'passed', got '%s'", check.Status)
	}
}

func TestValidateAgentCountMismatch(t *testing.T) {
	tmpDir := t.TempDir()

	// Create mismatched counts
	claudeDir := filepath.Join(tmpDir, ".claude", "agents")
	opencodeDir := filepath.Join(tmpDir, OpenCodeAgentDir)

	if err := os.MkdirAll(claudeDir, 0755); err != nil {
		t.Fatalf("Failed to create claude dir: %v", err)
	}
	if err := os.MkdirAll(opencodeDir, 0755); err != nil {
		t.Fatalf("Failed to create opencode dir: %v", err)
	}

	// Claude has 3 agents
	for i := 1; i <= 3; i++ {
		filename := filepath.Join(claudeDir, "agent-"+string(rune('0'+i))+".md")
		if err := os.WriteFile(filename, []byte("test"), 0644); err != nil {
			t.Fatalf("Failed to create claude agent: %v", err)
		}
	}

	// OpenCode has 2 agents
	for i := 1; i <= 2; i++ {
		filename := filepath.Join(opencodeDir, "agent-"+string(rune('0'+i))+".md")
		if err := os.WriteFile(filename, []byte("test"), 0644); err != nil {
			t.Fatalf("Failed to create opencode agent: %v", err)
		}
	}

	check := validateAgentCount(tmpDir)

	if check.Status != "failed" {
		t.Errorf("Expected status 'failed', got '%s'", check.Status)
	}
}

func TestValidateSkillCount(t *testing.T) {
	tmpDir := t.TempDir()

	// Create skill directories
	claudeSkillsDir := filepath.Join(tmpDir, ".claude", "skills")
	opencodeSkillDir := filepath.Join(tmpDir, ".opencode", "skill")

	skill1Dir := filepath.Join(claudeSkillsDir, "skill-1")
	skill2Dir := filepath.Join(claudeSkillsDir, "skill-2")

	if err := os.MkdirAll(skill1Dir, 0755); err != nil {
		t.Fatalf("Failed to create skill1 dir: %v", err)
	}
	if err := os.MkdirAll(skill2Dir, 0755); err != nil {
		t.Fatalf("Failed to create skill2 dir: %v", err)
	}
	if err := os.MkdirAll(opencodeSkillDir, 0755); err != nil {
		t.Fatalf("Failed to create opencode skill dir: %v", err)
	}

	// Create SKILL.md files in Claude
	if err := os.WriteFile(filepath.Join(skill1Dir, "SKILL.md"), []byte("skill1"), 0644); err != nil {
		t.Fatalf("Failed to create skill1 SKILL.md: %v", err)
	}
	if err := os.WriteFile(filepath.Join(skill2Dir, "SKILL.md"), []byte("skill2"), 0644); err != nil {
		t.Fatalf("Failed to create skill2 SKILL.md: %v", err)
	}

	// Create corresponding files in OpenCode (directory structure: {name}/SKILL.md)
	if err := os.MkdirAll(filepath.Join(opencodeSkillDir, "skill-1"), 0755); err != nil {
		t.Fatalf("Failed to create opencode skill-1 dir: %v", err)
	}
	if err := os.WriteFile(filepath.Join(opencodeSkillDir, "skill-1", "SKILL.md"), []byte("skill1"), 0644); err != nil {
		t.Fatalf("Failed to create opencode skill-1/SKILL.md: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(opencodeSkillDir, "skill-2"), 0755); err != nil {
		t.Fatalf("Failed to create opencode skill-2 dir: %v", err)
	}
	if err := os.WriteFile(filepath.Join(opencodeSkillDir, "skill-2", "SKILL.md"), []byte("skill2"), 0644); err != nil {
		t.Fatalf("Failed to create opencode skill-2/SKILL.md: %v", err)
	}

	check := validateSkillCount(tmpDir)

	if check.Status != "passed" {
		t.Errorf("Expected status 'passed', got '%s'", check.Status)
	}
}

func TestValidateSkillFile(t *testing.T) {
	tmpDir := t.TempDir()

	// Create identical skill files
	skillContent := "# Test Skill\n\nThis is a test skill."

	claudePath := filepath.Join(tmpDir, "claude-skill.md")
	opencodePath := filepath.Join(tmpDir, "opencode-skill.md")

	if err := os.WriteFile(claudePath, []byte(skillContent), 0644); err != nil {
		t.Fatalf("Failed to create claude skill: %v", err)
	}
	if err := os.WriteFile(opencodePath, []byte(skillContent), 0644); err != nil {
		t.Fatalf("Failed to create opencode skill: %v", err)
	}

	check := validateSkillFile("test-skill", claudePath, opencodePath)

	if check.Status != "passed" {
		t.Errorf("Expected status 'passed', got '%s'", check.Status)
	}
}

func TestValidateSkillFileMismatch(t *testing.T) {
	tmpDir := t.TempDir()

	// Create different skill files
	claudePath := filepath.Join(tmpDir, "claude-skill.md")
	opencodePath := filepath.Join(tmpDir, "opencode-skill.md")

	if err := os.WriteFile(claudePath, []byte("Claude content"), 0644); err != nil {
		t.Fatalf("Failed to create claude skill: %v", err)
	}
	if err := os.WriteFile(opencodePath, []byte("OpenCode content"), 0644); err != nil {
		t.Fatalf("Failed to create opencode skill: %v", err)
	}

	check := validateSkillFile("test-skill", claudePath, opencodePath)

	if check.Status != "failed" {
		t.Errorf("Expected status 'failed', got '%s'", check.Status)
	}
}

func TestToolsMatch(t *testing.T) {
	tests := []struct {
		name     string
		a        map[string]bool
		b        map[string]bool
		expected bool
	}{
		{
			name:     "matching tools",
			a:        map[string]bool{"read": true, "write": true},
			b:        map[string]bool{"read": true, "write": true},
			expected: true,
		},
		{
			name:     "different tools",
			a:        map[string]bool{"read": true, "write": true},
			b:        map[string]bool{"read": true, "edit": true},
			expected: false,
		},
		{
			name:     "different lengths",
			a:        map[string]bool{"read": true},
			b:        map[string]bool{"read": true, "write": true},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := toolsMatch(tt.a, tt.b)
			if result != tt.expected {
				t.Errorf("toolsMatch() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestSkillsMatch(t *testing.T) {
	tests := []struct {
		name     string
		a        []string
		b        []string
		expected bool
	}{
		{
			name:     "matching skills",
			a:        []string{"skill-1", "skill-2"},
			b:        []string{"skill-1", "skill-2"},
			expected: true,
		},
		{
			name:     "different skills",
			a:        []string{"skill-1", "skill-2"},
			b:        []string{"skill-1", "skill-3"},
			expected: false,
		},
		{
			name:     "different lengths",
			a:        []string{"skill-1"},
			b:        []string{"skill-1", "skill-2"},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := skillsMatch(tt.a, tt.b)
			if result != tt.expected {
				t.Errorf("skillsMatch() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestCountMarkdownFiles(t *testing.T) {
	tmpDir := t.TempDir()

	// Create test files
	if err := os.WriteFile(filepath.Join(tmpDir, "file1.md"), []byte("test"), 0644); err != nil {
		t.Fatalf("Failed to create file1.md: %v", err)
	}
	if err := os.WriteFile(filepath.Join(tmpDir, "file2.md"), []byte("test"), 0644); err != nil {
		t.Fatalf("Failed to create file2.md: %v", err)
	}
	if err := os.WriteFile(filepath.Join(tmpDir, "README.md"), []byte("readme"), 0644); err != nil {
		t.Fatalf("Failed to create README.md: %v", err)
	}
	if err := os.WriteFile(filepath.Join(tmpDir, "other.txt"), []byte("test"), 0644); err != nil {
		t.Fatalf("Failed to create other.txt: %v", err)
	}

	count := countMarkdownFiles(tmpDir)

	// Should count file1.md and file2.md, but not README.md or other.txt
	if count != 2 {
		t.Errorf("Expected count 2, got %d", count)
	}
}

func TestSortedKeys(t *testing.T) {
	m := map[string]bool{
		"write": true,
		"read":  true,
		"bash":  true,
	}
	keys := sortedKeys(m)
	expected := []string{"bash", "read", "write"}
	if len(keys) != len(expected) {
		t.Fatalf("expected %d keys, got %d: %v", len(expected), len(keys), keys)
	}
	for i, k := range keys {
		if k != expected[i] {
			t.Errorf("keys[%d] = %q, want %q", i, k, expected[i])
		}
	}
}

func TestValidateAgentEquivalence_EmptyDir(t *testing.T) {
	tmpDir := t.TempDir()
	claudeDir := filepath.Join(tmpDir, ".claude", "agents")
	if err := os.MkdirAll(claudeDir, 0755); err != nil {
		t.Fatalf("failed to create claude dir: %v", err)
	}
	checks := validateAgentEquivalence(tmpDir)
	if len(checks) != 0 {
		t.Errorf("expected 0 checks for empty dir, got %d", len(checks))
	}
}

func TestValidateAgentEquivalence_InvalidClaudeDir(t *testing.T) {
	tmpDir := t.TempDir()
	// Don't create .claude/agents — should return one failed check
	checks := validateAgentEquivalence(tmpDir)
	if len(checks) != 1 || checks[0].Status != "failed" {
		t.Errorf("expected 1 failed check for missing dir, got %v", checks)
	}
}

func TestValidateAgentFile_Success(t *testing.T) {
	tmpDir := t.TempDir()

	claudeAgentPath := filepath.Join(tmpDir, "test-agent.md")
	claudeContent := "---\nname: test-agent\ndescription: A test agent\ntools:\n  - Read\n  - Write\nmodel: sonnet\n---\n\nBody.\n"
	if err := os.WriteFile(claudeAgentPath, []byte(claudeContent), 0644); err != nil {
		t.Fatalf("failed to create claude agent: %v", err)
	}

	opencodeAgentPath := filepath.Join(tmpDir, "test-agent-opencode.md")
	if _, err := ConvertAgent(claudeAgentPath, opencodeAgentPath, false); err != nil {
		t.Fatalf("ConvertAgent() failed: %v", err)
	}

	check := validateAgentFile("test-agent.md", claudeAgentPath, opencodeAgentPath)
	if check.Status != "passed" {
		t.Errorf("expected 'passed', got %q: %s", check.Status, check.Message)
	}
}

func TestValidateAgentFile_MissingOpenCode(t *testing.T) {
	tmpDir := t.TempDir()

	claudeAgentPath := filepath.Join(tmpDir, "test-agent.md")
	claudeContent := "---\nname: test\ndescription: Test\ntools:\n  - Read\nmodel: sonnet\n---\n\nBody.\n"
	if err := os.WriteFile(claudeAgentPath, []byte(claudeContent), 0644); err != nil {
		t.Fatalf("failed to create claude agent: %v", err)
	}

	check := validateAgentFile("test-agent.md", claudeAgentPath, filepath.Join(tmpDir, "nonexistent.md"))
	if check.Status != "failed" {
		t.Errorf("expected 'failed' for missing opencode file, got %q", check.Status)
	}
}

func TestValidateAgentFile_MissingClaude(t *testing.T) {
	tmpDir := t.TempDir()
	check := validateAgentFile("test.md", filepath.Join(tmpDir, "nonexistent.md"), filepath.Join(tmpDir, "nonexistent2.md"))
	if check.Status != "failed" {
		t.Errorf("expected 'failed' for missing claude file, got %q", check.Status)
	}
}

func TestValidateAgentFile_InvalidFrontmatter(t *testing.T) {
	tmpDir := t.TempDir()

	claudePath := filepath.Join(tmpDir, "bad.md")
	opencodePath := filepath.Join(tmpDir, "bad-opencode.md")
	if err := os.WriteFile(claudePath, []byte("no frontmatter here"), 0644); err != nil {
		t.Fatalf("failed to create file: %v", err)
	}
	if err := os.WriteFile(opencodePath, []byte("no frontmatter here"), 0644); err != nil {
		t.Fatalf("failed to create file: %v", err)
	}

	check := validateAgentFile("bad.md", claudePath, opencodePath)
	if check.Status != "failed" {
		t.Errorf("expected 'failed' for invalid frontmatter, got %q", check.Status)
	}
}

func TestValidateSkillIdentity_Success(t *testing.T) {
	tmpDir := t.TempDir()

	claudeSkillsDir := filepath.Join(tmpDir, ".claude", "skills")
	opencodeSkillDir := filepath.Join(tmpDir, ".opencode", "skill")
	skill1Claude := filepath.Join(claudeSkillsDir, "my-skill")
	skill1Opencode := filepath.Join(opencodeSkillDir, "my-skill")

	for _, d := range []string{skill1Claude, skill1Opencode} {
		if err := os.MkdirAll(d, 0755); err != nil {
			t.Fatalf("failed to create dir: %v", err)
		}
	}

	skillContent := "# My Skill\n\nSkill content."
	if err := os.WriteFile(filepath.Join(skill1Claude, "SKILL.md"), []byte(skillContent), 0644); err != nil {
		t.Fatalf("failed to create claude skill: %v", err)
	}
	if err := os.WriteFile(filepath.Join(skill1Opencode, "SKILL.md"), []byte(skillContent), 0644); err != nil {
		t.Fatalf("failed to create opencode skill: %v", err)
	}

	checks := validateSkillIdentity(tmpDir)
	if len(checks) != 1 || checks[0].Status != "passed" {
		t.Errorf("expected 1 passed check, got %v", checks)
	}
}

func TestValidateSkillIdentity_InvalidClaudeDir(t *testing.T) {
	tmpDir := t.TempDir()
	checks := validateSkillIdentity(tmpDir)
	if len(checks) != 1 || checks[0].Status != "failed" {
		t.Errorf("expected 1 failed check for missing dir, got %v", checks)
	}
}

func TestValidateSync_AllPass(t *testing.T) {
	tmpDir := t.TempDir()

	claudeAgentsDir := filepath.Join(tmpDir, ".claude", "agents")
	opencodeAgentDir := filepath.Join(tmpDir, OpenCodeAgentDir)
	skill1Claude := filepath.Join(tmpDir, ".claude", "skills", "skill-1")
	skill1Opencode := filepath.Join(tmpDir, ".opencode", "skill", "skill-1")

	for _, d := range []string{claudeAgentsDir, opencodeAgentDir, skill1Claude, skill1Opencode} {
		if err := os.MkdirAll(d, 0755); err != nil {
			t.Fatalf("failed to create dir: %v", err)
		}
	}

	// Create and convert agent
	claudeContent := "---\nname: test\ndescription: Test\ntools:\n  - Read\nmodel: sonnet\n---\n\nBody.\n"
	claudeAgentPath := filepath.Join(claudeAgentsDir, "test.md")
	if err := os.WriteFile(claudeAgentPath, []byte(claudeContent), 0644); err != nil {
		t.Fatalf("failed to create claude agent: %v", err)
	}
	opencodeAgentPath := filepath.Join(opencodeAgentDir, "test.md")
	if _, err := ConvertAgent(claudeAgentPath, opencodeAgentPath, false); err != nil {
		t.Fatalf("failed to convert agent: %v", err)
	}

	// Create matching skills
	skillContent := "# Skill"
	if err := os.WriteFile(filepath.Join(skill1Claude, "SKILL.md"), []byte(skillContent), 0644); err != nil {
		t.Fatalf("failed to create claude skill: %v", err)
	}
	if err := os.WriteFile(filepath.Join(skill1Opencode, "SKILL.md"), []byte(skillContent), 0644); err != nil {
		t.Fatalf("failed to create opencode skill: %v", err)
	}

	result, err := ValidateSync(tmpDir)
	if err != nil {
		t.Fatalf("ValidateSync() error: %v", err)
	}
	if result.TotalChecks == 0 {
		t.Error("expected non-zero total checks")
	}
	for _, check := range result.Checks {
		if check.Status == "failed" {
			t.Errorf("unexpected failed check: %s - %s", check.Name, check.Message)
		}
	}
}

func TestValidateSync_EmptyRepo(t *testing.T) {
	tmpDir := t.TempDir()

	// Create empty .claude and .opencode dirs
	for _, d := range []string{
		filepath.Join(tmpDir, ".claude", "agents"),
		filepath.Join(tmpDir, OpenCodeAgentDir),
		filepath.Join(tmpDir, ".claude", "skills"),
		filepath.Join(tmpDir, ".opencode", "skill"),
	} {
		if err := os.MkdirAll(d, 0755); err != nil {
			t.Fatalf("failed to create dir: %v", err)
		}
	}

	result, err := ValidateSync(tmpDir)
	if err != nil {
		t.Fatalf("ValidateSync() error: %v", err)
	}
	// Should succeed with all empty (0 agents, 0 skills)
	if result.FailedChecks > 0 {
		for _, check := range result.Checks {
			if check.Status == "failed" {
				t.Logf("failed check: %s - %s", check.Name, check.Message)
			}
		}
		t.Errorf("expected 0 failed checks for empty repo, got %d", result.FailedChecks)
	}
}

func TestValidateSkillCount_Mismatch(t *testing.T) {
	tmpDir := t.TempDir()

	// Claude has 2 skills, OpenCode has 1
	claudeSkillsDir := filepath.Join(tmpDir, ".claude", "skills")
	opencodeSkillDir := filepath.Join(tmpDir, ".opencode", "skill")

	for _, d := range []string{
		filepath.Join(claudeSkillsDir, "skill-1"),
		filepath.Join(claudeSkillsDir, "skill-2"),
		filepath.Join(opencodeSkillDir, "skill-1"),
	} {
		if err := os.MkdirAll(d, 0755); err != nil {
			t.Fatalf("failed to create dir: %v", err)
		}
	}

	for _, p := range []string{
		filepath.Join(claudeSkillsDir, "skill-1", "SKILL.md"),
		filepath.Join(claudeSkillsDir, "skill-2", "SKILL.md"),
		filepath.Join(opencodeSkillDir, "skill-1", "SKILL.md"),
	} {
		if err := os.WriteFile(p, []byte("content"), 0644); err != nil {
			t.Fatalf("failed to create file: %v", err)
		}
	}

	check := validateSkillCount(tmpDir)
	if check.Status != "failed" {
		t.Errorf("expected 'failed' for skill count mismatch, got %q", check.Status)
	}
}

func TestValidateSkillIdentity_NonDirEntry(t *testing.T) {
	tmpDir := t.TempDir()

	// Create a regular file (not dir) in .claude/skills
	claudeSkillsDir := filepath.Join(tmpDir, ".claude", "skills")
	if err := os.MkdirAll(claudeSkillsDir, 0755); err != nil {
		t.Fatalf("failed to create dir: %v", err)
	}
	if err := os.WriteFile(filepath.Join(claudeSkillsDir, "some-file.md"), []byte("content"), 0644); err != nil {
		t.Fatalf("failed to create file: %v", err)
	}

	// Should return no checks (regular files are skipped)
	checks := validateSkillIdentity(tmpDir)
	if len(checks) != 0 {
		t.Errorf("expected 0 checks when skills dir has only files (no dirs), got %d", len(checks))
	}
}

func TestValidateSkillIdentity_DirWithoutSkillMd(t *testing.T) {
	tmpDir := t.TempDir()

	// Create a skill dir without SKILL.md
	claudeSkillsDir := filepath.Join(tmpDir, ".claude", "skills")
	emptySkillDir := filepath.Join(claudeSkillsDir, "empty-skill")
	if err := os.MkdirAll(emptySkillDir, 0755); err != nil {
		t.Fatalf("failed to create dir: %v", err)
	}

	// Should return no checks (dirs without SKILL.md are skipped)
	checks := validateSkillIdentity(tmpDir)
	if len(checks) != 0 {
		t.Errorf("expected 0 checks when skill dir has no SKILL.md, got %d", len(checks))
	}
}

func TestValidateSkillFile_ClaudeMissing(t *testing.T) {
	tmpDir := t.TempDir()

	check := validateSkillFile("missing-skill",
		filepath.Join(tmpDir, "nonexistent-claude.md"),
		filepath.Join(tmpDir, "opencode.md"))

	if check.Status != "failed" {
		t.Errorf("expected 'failed' when claude skill missing, got %q", check.Status)
	}
	if check.Name != "Skill: missing-skill" {
		t.Errorf("expected skill name in check, got %q", check.Name)
	}
}

func TestValidateSkillFile_OpenCodeMissing(t *testing.T) {
	tmpDir := t.TempDir()

	claudePath := filepath.Join(tmpDir, "claude-skill.md")
	if err := os.WriteFile(claudePath, []byte("skill content"), 0644); err != nil {
		t.Fatalf("failed to create claude skill: %v", err)
	}

	check := validateSkillFile("my-skill",
		claudePath,
		filepath.Join(tmpDir, "nonexistent-opencode.md"))

	if check.Status != "failed" {
		t.Errorf("expected 'failed' when opencode skill missing, got %q", check.Status)
	}
}

func TestCountMarkdownFiles_NonExistentDir(t *testing.T) {
	count := countMarkdownFiles("/nonexistent/directory/that/does/not/exist")
	if count != 0 {
		t.Errorf("expected 0 for non-existent dir, got %d", count)
	}
}

func TestValidateAgentEquivalence_WithReadmeMd(t *testing.T) {
	tmpDir := t.TempDir()

	claudeDir := filepath.Join(tmpDir, ".claude", "agents")
	if err := os.MkdirAll(claudeDir, 0755); err != nil {
		t.Fatalf("failed to create dir: %v", err)
	}

	// Create README.md — should be skipped
	if err := os.WriteFile(filepath.Join(claudeDir, "README.md"), []byte("# README"), 0644); err != nil {
		t.Fatalf("failed to create README.md: %v", err)
	}
	// Create a subdirectory — should be skipped
	subDir := filepath.Join(claudeDir, "subdir")
	if err := os.MkdirAll(subDir, 0755); err != nil {
		t.Fatalf("failed to create subdir: %v", err)
	}

	checks := validateAgentEquivalence(tmpDir)
	if len(checks) != 0 {
		t.Errorf("expected 0 checks when only README.md and dirs exist, got %d: %v", len(checks), checks)
	}
}

func TestValidateAgentFile_DescriptionMismatch(t *testing.T) {
	tmpDir := t.TempDir()

	claudePath := filepath.Join(tmpDir, "agent.md")
	opencodePath := filepath.Join(tmpDir, "agent-opencode.md")

	claudeContent := "---\nname: agent\ndescription: Claude description\ntools:\n  - Read\nmodel: sonnet\n---\n\nBody.\n"
	if err := os.WriteFile(claudePath, []byte(claudeContent), 0644); err != nil {
		t.Fatalf("failed to create claude agent: %v", err)
	}

	// Write opencode file with different description
	opencodeContent := "---\ndescription: Different description\ntools:\n  read: true\nmodel: zai-coding-plan/glm-5.1\nskills: []\n---\n\nBody.\n"
	if err := os.WriteFile(opencodePath, []byte(opencodeContent), 0644); err != nil {
		t.Fatalf("failed to create opencode agent: %v", err)
	}

	check := validateAgentFile("agent.md", claudePath, opencodePath)
	if check.Status != "failed" {
		t.Errorf("expected 'failed' for description mismatch, got %q: %s", check.Status, check.Message)
	}
}

func TestValidateAgentFile_OpenCodeInvalidFrontmatter(t *testing.T) {
	tmpDir := t.TempDir()

	claudePath := filepath.Join(tmpDir, "agent.md")
	opencodePath := filepath.Join(tmpDir, "agent-opencode.md")

	// Claude has valid frontmatter
	claudeContent := "---\nname: agent\ndescription: Test\ntools:\n  - Read\nmodel: sonnet\n---\n\nBody.\n"
	if err := os.WriteFile(claudePath, []byte(claudeContent), 0644); err != nil {
		t.Fatalf("failed to create claude agent: %v", err)
	}

	// OpenCode has no frontmatter (no --- delimiter)
	if err := os.WriteFile(opencodePath, []byte("no frontmatter here"), 0644); err != nil {
		t.Fatalf("failed to create opencode agent: %v", err)
	}

	check := validateAgentFile("agent.md", claudePath, opencodePath)
	if check.Status != "failed" {
		t.Errorf("expected 'failed' for opencode invalid frontmatter, got %q: %s", check.Status, check.Message)
	}
}

func TestValidateAgentFile_ModelMismatch(t *testing.T) {
	tmpDir := t.TempDir()

	claudePath := filepath.Join(tmpDir, "agent.md")
	opencodePath := filepath.Join(tmpDir, "agent-opencode.md")

	// Claude uses "sonnet" → should convert to "zai-coding-plan/glm-5.1"
	claudeContent := "---\nname: agent\ndescription: Same desc\ntools:\n  - Read\nmodel: sonnet\n---\n\nBody.\n"
	if err := os.WriteFile(claudePath, []byte(claudeContent), 0644); err != nil {
		t.Fatalf("failed to create claude agent: %v", err)
	}

	// OpenCode has wrong model (description matches but model doesn't)
	opencodeContent := "---\ndescription: Same desc\ntools:\n  read: true\nmodel: wrong-model\nskills: []\n---\n\nBody.\n"
	if err := os.WriteFile(opencodePath, []byte(opencodeContent), 0644); err != nil {
		t.Fatalf("failed to create opencode agent: %v", err)
	}

	check := validateAgentFile("agent.md", claudePath, opencodePath)
	if check.Status != "failed" {
		t.Errorf("expected 'failed' for model mismatch, got %q: %s", check.Status, check.Message)
	}
	if check.Message != "Model mismatch" {
		t.Errorf("expected 'Model mismatch' message, got %q", check.Message)
	}
}

func TestValidateAgentFile_ToolsMismatch(t *testing.T) {
	tmpDir := t.TempDir()

	claudePath := filepath.Join(tmpDir, "agent.md")
	opencodePath := filepath.Join(tmpDir, "agent-opencode.md")

	// Claude has Read tool
	claudeContent := "---\nname: agent\ndescription: Same desc\ntools:\n  - Read\nmodel: sonnet\n---\n\nBody.\n"
	if err := os.WriteFile(claudePath, []byte(claudeContent), 0644); err != nil {
		t.Fatalf("failed to create claude agent: %v", err)
	}

	// OpenCode has matching description and model but different tools
	opencodeContent := "---\ndescription: Same desc\ntools:\n  write: true\nmodel: zai-coding-plan/glm-5.1\nskills: []\n---\n\nBody.\n"
	if err := os.WriteFile(opencodePath, []byte(opencodeContent), 0644); err != nil {
		t.Fatalf("failed to create opencode agent: %v", err)
	}

	check := validateAgentFile("agent.md", claudePath, opencodePath)
	if check.Status != "failed" {
		t.Errorf("expected 'failed' for tools mismatch, got %q: %s", check.Status, check.Message)
	}
	if check.Message != "Tools mismatch" {
		t.Errorf("expected 'Tools mismatch' message, got %q", check.Message)
	}
}

func TestValidateAgentFile_BodyMismatch(t *testing.T) {
	tmpDir := t.TempDir()

	claudePath := filepath.Join(tmpDir, "agent.md")
	opencodePath := filepath.Join(tmpDir, "agent-opencode.md")

	// Claude agent
	claudeContent := "---\nname: agent\ndescription: Same desc\ntools:\n  - Read\nmodel: sonnet\n---\n\nOriginal body.\n"
	if err := os.WriteFile(claudePath, []byte(claudeContent), 0644); err != nil {
		t.Fatalf("failed to create claude agent: %v", err)
	}

	// OpenCode has matching description, model, tools but different body
	opencodeContent := "---\ndescription: Same desc\ntools:\n  read: true\nmodel: zai-coding-plan/glm-5.1\nskills: []\n---\n\nDifferent body.\n"
	if err := os.WriteFile(opencodePath, []byte(opencodeContent), 0644); err != nil {
		t.Fatalf("failed to create opencode agent: %v", err)
	}

	check := validateAgentFile("agent.md", claudePath, opencodePath)
	if check.Status != "failed" {
		t.Errorf("expected 'failed' for body mismatch, got %q: %s", check.Status, check.Message)
	}
	if check.Message != "Body mismatch" {
		t.Errorf("expected 'Body mismatch' message, got %q", check.Message)
	}
}

func TestValidateAgentFile_SkillsMismatch(t *testing.T) {
	tmpDir := t.TempDir()

	claudePath := filepath.Join(tmpDir, "agent.md")
	opencodePath := filepath.Join(tmpDir, "agent-opencode.md")

	// Claude has skills listed
	claudeContent := "---\nname: agent\ndescription: Same desc\ntools:\n  - Read\nmodel: sonnet\nskills:\n  - my-skill\n---\n\nBody.\n"
	if err := os.WriteFile(claudePath, []byte(claudeContent), 0644); err != nil {
		t.Fatalf("failed to create claude agent: %v", err)
	}

	// OpenCode has matching description, model, tools but no skills
	opencodeContent := "---\ndescription: Same desc\ntools:\n  read: true\nmodel: zai-coding-plan/glm-5.1\nskills: []\n---\n\nBody.\n"
	if err := os.WriteFile(opencodePath, []byte(opencodeContent), 0644); err != nil {
		t.Fatalf("failed to create opencode agent: %v", err)
	}

	check := validateAgentFile("agent.md", claudePath, opencodePath)
	if check.Status != "failed" {
		t.Errorf("expected 'failed' for skills mismatch, got %q: %s", check.Status, check.Message)
	}
	if check.Message != "Skills mismatch" {
		t.Errorf("expected 'Skills mismatch' message, got %q", check.Message)
	}
}

func TestValidateSync_WithMismatches(t *testing.T) {
	tmpDir := t.TempDir()

	// Claude has 2 agents, OpenCode has 1 → count mismatch → FailedChecks gets incremented
	claudeAgentsDir := filepath.Join(tmpDir, ".claude", "agents")
	opencodeAgentDir := filepath.Join(tmpDir, OpenCodeAgentDir)

	for _, d := range []string{claudeAgentsDir, opencodeAgentDir} {
		if err := os.MkdirAll(d, 0755); err != nil {
			t.Fatalf("failed to create dir: %v", err)
		}
	}

	// Create 2 claude agents, 1 opencode agent
	claudeContent := "---\nname: agent-a\ndescription: Agent A\ntools:\n  - Read\nmodel: sonnet\n---\n\nBody A.\n"
	if err := os.WriteFile(filepath.Join(claudeAgentsDir, "agent-a.md"), []byte(claudeContent), 0644); err != nil {
		t.Fatalf("failed to create claude agent-a: %v", err)
	}
	if err := os.WriteFile(filepath.Join(claudeAgentsDir, "agent-b.md"), []byte(claudeContent), 0644); err != nil {
		t.Fatalf("failed to create claude agent-b: %v", err)
	}
	if err := os.WriteFile(filepath.Join(opencodeAgentDir, "agent-a.md"), []byte("---\ndescription: Agent A\ntools:\n  read: true\nmodel: zai-coding-plan/glm-5.1\nskills: []\n---\n\nBody A.\n"), 0644); err != nil {
		t.Fatalf("failed to create opencode agent: %v", err)
	}

	// No skills dirs
	for _, d := range []string{
		filepath.Join(tmpDir, ".claude", "skills"),
		filepath.Join(tmpDir, ".opencode", "skill"),
	} {
		if err := os.MkdirAll(d, 0755); err != nil {
			t.Fatalf("failed to create skills dir: %v", err)
		}
	}

	result, err := ValidateSync(tmpDir)
	if err != nil {
		t.Fatalf("ValidateSync() unexpected error: %v", err)
	}
	if result.FailedChecks == 0 {
		t.Error("expected at least one failed check for agent count mismatch")
	}
	if result.TotalChecks == 0 {
		t.Error("expected non-zero total checks")
	}
}

func TestValidateSync_WithSkillMismatch(t *testing.T) {
	tmpDir := t.TempDir()

	// Equal agent counts (0 each) but mismatched skills
	for _, d := range []string{
		filepath.Join(tmpDir, ".claude", "agents"),
		filepath.Join(tmpDir, OpenCodeAgentDir),
	} {
		if err := os.MkdirAll(d, 0755); err != nil {
			t.Fatalf("failed to create agent dir: %v", err)
		}
	}

	// Claude has 2 skills, OpenCode has 1 → skill count mismatch → FailedChecks++ for skill count
	claudeSkillsDir := filepath.Join(tmpDir, ".claude", "skills")
	opencodeSkillDir := filepath.Join(tmpDir, ".opencode", "skill")

	for _, d := range []string{
		filepath.Join(claudeSkillsDir, "skill-a"),
		filepath.Join(claudeSkillsDir, "skill-b"),
		filepath.Join(opencodeSkillDir, "skill-a"),
	} {
		if err := os.MkdirAll(d, 0755); err != nil {
			t.Fatalf("failed to create dir: %v", err)
		}
	}

	for _, p := range []string{
		filepath.Join(claudeSkillsDir, "skill-a", "SKILL.md"),
		filepath.Join(claudeSkillsDir, "skill-b", "SKILL.md"),
		filepath.Join(opencodeSkillDir, "skill-a", "SKILL.md"),
	} {
		if err := os.WriteFile(p, []byte("# Skill"), 0644); err != nil {
			t.Fatalf("failed to create file: %v", err)
		}
	}

	result, err := ValidateSync(tmpDir)
	if err != nil {
		t.Fatalf("ValidateSync() unexpected error: %v", err)
	}
	// Skill count mismatch should cause FailedChecks > 0
	if result.FailedChecks == 0 {
		t.Error("expected at least one failed check for skill count mismatch")
	}
}

func TestValidateSync_WithSkillContentMismatch(t *testing.T) {
	tmpDir := t.TempDir()

	// Equal agent counts (0 each)
	for _, d := range []string{
		filepath.Join(tmpDir, ".claude", "agents"),
		filepath.Join(tmpDir, OpenCodeAgentDir),
	} {
		if err := os.MkdirAll(d, 0755); err != nil {
			t.Fatalf("failed to create dir: %v", err)
		}
	}

	// Same skill count but different content → skill identity mismatch → FailedChecks++ for identity
	claudeSkillsDir := filepath.Join(tmpDir, ".claude", "skills")
	opencodeSkillDir := filepath.Join(tmpDir, ".opencode", "skill")

	for _, d := range []string{
		filepath.Join(claudeSkillsDir, "skill-x"),
		filepath.Join(opencodeSkillDir, "skill-x"),
	} {
		if err := os.MkdirAll(d, 0755); err != nil {
			t.Fatalf("failed to create dir: %v", err)
		}
	}

	if err := os.WriteFile(filepath.Join(claudeSkillsDir, "skill-x", "SKILL.md"), []byte("Claude content"), 0644); err != nil {
		t.Fatalf("failed to create claude skill: %v", err)
	}
	if err := os.WriteFile(filepath.Join(opencodeSkillDir, "skill-x", "SKILL.md"), []byte("OpenCode different content"), 0644); err != nil {
		t.Fatalf("failed to create opencode skill: %v", err)
	}

	result, err := ValidateSync(tmpDir)
	if err != nil {
		t.Fatalf("ValidateSync() unexpected error: %v", err)
	}
	// Skill identity mismatch should cause FailedChecks > 0
	if result.FailedChecks == 0 {
		t.Error("expected at least one failed check for skill content mismatch")
	}
}

func TestValidateAgentFile_ClaudeYAMLUnmarshalError(t *testing.T) {
	// Tests sync_validator.go:173-179 — yaml.Unmarshal(claudeFront, &claudeData) error
	// Need Claude frontmatter that extracts OK but has YAML that fails to unmarshal
	// into map[string]interface{} (e.g., {unclosed brace).
	tmpDir := t.TempDir()

	claudePath := filepath.Join(tmpDir, "agent.md")
	opencodePath := filepath.Join(tmpDir, "opencode.md")

	// Valid frontmatter markers but invalid YAML inside (unclosed flow mapping)
	claudeContent := "---\n{unclosed brace\n---\n\nBody.\n"
	if err := os.WriteFile(claudePath, []byte(claudeContent), 0644); err != nil {
		t.Fatalf("failed to create claude agent: %v", err)
	}
	// OpenCode file doesn't matter since we fail before reading it
	opencodeContent := "---\ndescription: test\nmodel: zai-coding-plan/glm-5.1\n---\n\nBody.\n"
	if err := os.WriteFile(opencodePath, []byte(opencodeContent), 0644); err != nil {
		t.Fatalf("failed to create opencode agent: %v", err)
	}

	check := validateAgentFile("agent.md", claudePath, opencodePath)
	if check.Status != "failed" {
		t.Errorf("expected 'failed' for Claude YAML unmarshal error, got %q: %s", check.Status, check.Message)
	}
}

func TestValidateAgentFile_OpenCodeYAMLUnmarshalError(t *testing.T) {
	// Tests sync_validator.go:182-188 — yaml.Unmarshal(opencodeFront, &opencodeAgent) error
	// Need Claude frontmatter that extracts AND unmarshals OK, but OpenCode frontmatter
	// that fails to unmarshal into OpenCodeAgent (tools must be map[string]bool,
	// so providing "tools: just-a-string" will cause unmarshal failure).
	tmpDir := t.TempDir()

	claudePath := filepath.Join(tmpDir, "agent.md")
	opencodePath := filepath.Join(tmpDir, "opencode.md")

	// Valid Claude frontmatter
	claudeContent := "---\nname: test\ndescription: Test\ntools:\n  - Read\nmodel: sonnet\n---\n\nBody.\n"
	if err := os.WriteFile(claudePath, []byte(claudeContent), 0644); err != nil {
		t.Fatalf("failed to create claude agent: %v", err)
	}

	// OpenCode frontmatter where tools is a plain string (incompatible with map[string]bool)
	opencodeContent := "---\ndescription: Test\nmodel: zai-coding-plan/glm-5.1\ntools: read,write\n---\n\nBody.\n"
	if err := os.WriteFile(opencodePath, []byte(opencodeContent), 0644); err != nil {
		t.Fatalf("failed to create opencode agent: %v", err)
	}

	check := validateAgentFile("agent.md", claudePath, opencodePath)
	if check.Status != "failed" {
		t.Errorf("expected 'failed' for OpenCode YAML unmarshal error, got %q: %s", check.Status, check.Message)
	}
}
