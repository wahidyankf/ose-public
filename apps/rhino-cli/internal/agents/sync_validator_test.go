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

func TestValidateAgentCount_OpenCodeExtrasAllowed(t *testing.T) {
	tmpDir := t.TempDir()

	claudeDir := filepath.Join(tmpDir, ".claude", "agents")
	opencodeDir := filepath.Join(tmpDir, OpenCodeAgentDir)

	if err := os.MkdirAll(claudeDir, 0755); err != nil {
		t.Fatalf("Failed to create claude dir: %v", err)
	}
	if err := os.MkdirAll(opencodeDir, 0755); err != nil {
		t.Fatalf("Failed to create opencode dir: %v", err)
	}

	// Claude has 2 agents
	for i := 1; i <= 2; i++ {
		filename := filepath.Join(claudeDir, "agent-"+string(rune('0'+i))+".md")
		if err := os.WriteFile(filename, []byte("test"), 0644); err != nil {
			t.Fatalf("Failed to create claude agent: %v", err)
		}
	}

	// OpenCode has 3 agents (1 OpenCode-only Nx-generated extra)
	for i := 1; i <= 3; i++ {
		filename := filepath.Join(opencodeDir, "agent-"+string(rune('0'+i))+".md")
		if err := os.WriteFile(filename, []byte("test"), 0644); err != nil {
			t.Fatalf("Failed to create opencode agent: %v", err)
		}
	}

	check := validateAgentCount(tmpDir)

	if check.Status != "passed" {
		t.Errorf("Expected status 'passed' when OpenCode has more agents than Claude (Nx-generated extras allowed), got '%s': %s",
			check.Status, check.Message)
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

func TestValidateNoStaleAgentDir_NotPresent(t *testing.T) {
	tmpDir := t.TempDir()
	// Do not create .opencode/agent/ at all.
	check := validateNoStaleAgentDir(tmpDir)
	if check.Status != "passed" {
		t.Errorf("expected 'passed' when .opencode/agent/ does not exist, got %q: %s", check.Status, check.Message)
	}
}

func TestValidateNoStaleAgentDir_DirExists(t *testing.T) {
	tmpDir := t.TempDir()
	staleDir := filepath.Join(tmpDir, ".opencode", "agent")
	if err := os.MkdirAll(staleDir, 0755); err != nil {
		t.Fatalf("failed to create stale agent dir: %v", err)
	}
	check := validateNoStaleAgentDir(tmpDir)
	if check.Status != "failed" {
		t.Errorf("expected 'failed' when .opencode/agent/ exists as a directory, got %q", check.Status)
	}
	// The message should name the stale path so the developer knows where to clean up.
	if check.Actual == "" {
		t.Errorf("expected non-empty Actual describing the stale path, got empty")
	}
}

func TestValidateNoStaleAgentDir_FileEntry(t *testing.T) {
	tmpDir := t.TempDir()
	opencodeDir := filepath.Join(tmpDir, ".opencode")
	if err := os.MkdirAll(opencodeDir, 0755); err != nil {
		t.Fatalf("failed to create .opencode dir: %v", err)
	}
	// Create .opencode/agent as a regular file (non-directory entry).
	if err := os.WriteFile(filepath.Join(opencodeDir, "agent"), []byte("stale"), 0644); err != nil {
		t.Fatalf("failed to create stale agent file: %v", err)
	}
	check := validateNoStaleAgentDir(tmpDir)
	if check.Status != "failed" {
		t.Errorf("expected 'failed' when .opencode/agent exists as a file, got %q", check.Status)
	}
}

func TestValidateNoSyncedSkills_BothEmpty(t *testing.T) {
	tmpDir := t.TempDir()
	// No .claude/skills, no .opencode/skill, no .opencode/skills.
	check := validateNoSyncedSkills(tmpDir)
	if check.Status != "passed" {
		t.Errorf("expected 'passed' when no skill mirrors exist, got %q: %s", check.Status, check.Message)
	}
}

func TestValidateNoSyncedSkills_PluralMirrorOfClaudeSkill(t *testing.T) {
	tmpDir := t.TempDir()

	claudeSkill := filepath.Join(tmpDir, ".claude", "skills", "shared-skill")
	pluralMirror := filepath.Join(tmpDir, ".opencode", "skills", "shared-skill")

	for _, d := range []string{claudeSkill, pluralMirror} {
		if err := os.MkdirAll(d, 0755); err != nil {
			t.Fatalf("failed to create dir: %v", err)
		}
	}
	if err := os.WriteFile(filepath.Join(claudeSkill, "SKILL.md"), []byte("# Skill"), 0644); err != nil {
		t.Fatalf("failed to create claude skill: %v", err)
	}
	if err := os.WriteFile(filepath.Join(pluralMirror, "SKILL.md"), []byte("# Skill"), 0644); err != nil {
		t.Fatalf("failed to create opencode plural mirror: %v", err)
	}

	check := validateNoSyncedSkills(tmpDir)
	if check.Status != "failed" {
		t.Errorf("expected 'failed' for plural mirror of claude skill, got %q: %s", check.Status, check.Message)
	}
	// Offender list should name the offending path so the developer knows where to clean up.
	if check.Actual == "" {
		t.Errorf("expected non-empty Actual naming the offender, got empty")
	}
}

func TestValidateNoSyncedSkills_SingularMirror(t *testing.T) {
	tmpDir := t.TempDir()

	claudeSkill := filepath.Join(tmpDir, ".claude", "skills", "shared-skill")
	singularMirror := filepath.Join(tmpDir, ".opencode", "skill", "shared-skill")

	for _, d := range []string{claudeSkill, singularMirror} {
		if err := os.MkdirAll(d, 0755); err != nil {
			t.Fatalf("failed to create dir: %v", err)
		}
	}
	if err := os.WriteFile(filepath.Join(claudeSkill, "SKILL.md"), []byte("# Skill"), 0644); err != nil {
		t.Fatalf("failed to create claude skill: %v", err)
	}
	if err := os.WriteFile(filepath.Join(singularMirror, "SKILL.md"), []byte("# Skill"), 0644); err != nil {
		t.Fatalf("failed to create opencode singular mirror: %v", err)
	}

	check := validateNoSyncedSkills(tmpDir)
	if check.Status != "failed" {
		t.Errorf("expected 'failed' for singular mirror of claude skill, got %q: %s", check.Status, check.Message)
	}
}

func TestValidateNoSyncedSkills_NxOnlyEntry(t *testing.T) {
	tmpDir := t.TempDir()

	// Claude has no .claude/skills/<name> for "nx-only-skill".
	// .opencode/skills/nx-only-skill/SKILL.md exists (e.g. authored by an Nx generator).
	// This is tolerated and must NOT trigger a failure.
	nxOnlySkill := filepath.Join(tmpDir, ".opencode", "skills", "nx-only-skill")
	if err := os.MkdirAll(nxOnlySkill, 0755); err != nil {
		t.Fatalf("failed to create nx-only skill dir: %v", err)
	}
	if err := os.WriteFile(filepath.Join(nxOnlySkill, "SKILL.md"), []byte("# Nx only"), 0644); err != nil {
		t.Fatalf("failed to create nx-only SKILL.md: %v", err)
	}

	// Sanity: another skill exists under .claude/skills but has NO mirror — must not be flagged.
	claudeOnlySkill := filepath.Join(tmpDir, ".claude", "skills", "claude-only-skill")
	if err := os.MkdirAll(claudeOnlySkill, 0755); err != nil {
		t.Fatalf("failed to create claude-only skill dir: %v", err)
	}
	if err := os.WriteFile(filepath.Join(claudeOnlySkill, "SKILL.md"), []byte("# Claude only"), 0644); err != nil {
		t.Fatalf("failed to create claude-only SKILL.md: %v", err)
	}

	check := validateNoSyncedSkills(tmpDir)
	if check.Status != "passed" {
		t.Errorf("expected 'passed' for nx-only entry with no .claude/skills counterpart, got %q: %s", check.Status, check.Message)
	}
}

func TestValidateSync_AllPass(t *testing.T) {
	tmpDir := t.TempDir()

	claudeAgentsDir := filepath.Join(tmpDir, ".claude", "agents")
	opencodeAgentDir := filepath.Join(tmpDir, OpenCodeAgentDir)
	// .claude/skills/<name>/SKILL.md is read natively by OpenCode; no mirror is created.
	claudeSkillDir := filepath.Join(tmpDir, ".claude", "skills", "skill-1")

	for _, d := range []string{claudeAgentsDir, opencodeAgentDir, claudeSkillDir} {
		if err := os.MkdirAll(d, 0755); err != nil {
			t.Fatalf("failed to create dir: %v", err)
		}
	}

	// Create and convert one Claude agent into the canonical .opencode/agents/ path.
	claudeContent := "---\nname: test\ndescription: Test\ntools:\n  - Read\nmodel: sonnet\n---\n\nBody.\n"
	claudeAgentPath := filepath.Join(claudeAgentsDir, "test.md")
	if err := os.WriteFile(claudeAgentPath, []byte(claudeContent), 0644); err != nil {
		t.Fatalf("failed to create claude agent: %v", err)
	}
	opencodeAgentPath := filepath.Join(opencodeAgentDir, "test.md")
	if _, err := ConvertAgent(claudeAgentPath, opencodeAgentPath, false); err != nil {
		t.Fatalf("failed to convert agent: %v", err)
	}

	// Claude-side skill exists; deliberately NO .opencode/skill or .opencode/skills mirror.
	if err := os.WriteFile(filepath.Join(claudeSkillDir, "SKILL.md"), []byte("# Skill"), 0644); err != nil {
		t.Fatalf("failed to create claude skill: %v", err)
	}

	result, err := ValidateSync(tmpDir)
	if err != nil {
		t.Fatalf("ValidateSync() error: %v", err)
	}

	// New check set: noStaleAgentDir + agentCount + 1 per-agent equivalence + noSyncedSkillMirror = 4.
	if result.TotalChecks != 4 {
		t.Errorf("expected 4 total checks, got %d", result.TotalChecks)
	}
	if result.PassedChecks != 4 {
		t.Errorf("expected 4 passed checks, got %d", result.PassedChecks)
	}
	if result.FailedChecks != 0 {
		t.Errorf("expected 0 failed checks, got %d", result.FailedChecks)
	}
	for _, check := range result.Checks {
		if check.Status == "failed" {
			t.Errorf("unexpected failed check: %s - %s", check.Name, check.Message)
		}
	}
}

func TestValidateSync_EmptyRepo(t *testing.T) {
	tmpDir := t.TempDir()

	// Create only the Claude- and OpenCode-side agent directories (empty).
	// Deliberately NO .opencode/skill, NO .opencode/skills, NO .opencode/agent (singular).
	for _, d := range []string{
		filepath.Join(tmpDir, ".claude", "agents"),
		filepath.Join(tmpDir, OpenCodeAgentDir),
		filepath.Join(tmpDir, ".claude", "skills"),
	} {
		if err := os.MkdirAll(d, 0755); err != nil {
			t.Fatalf("failed to create dir: %v", err)
		}
	}

	result, err := ValidateSync(tmpDir)
	if err != nil {
		t.Fatalf("ValidateSync() error: %v", err)
	}

	// New check set with 0 agents: noStaleAgentDir + agentCount + noSyncedSkillMirror = 3.
	if result.TotalChecks != 3 {
		t.Errorf("expected 3 total checks for empty repo, got %d", result.TotalChecks)
	}
	if result.FailedChecks > 0 {
		for _, check := range result.Checks {
			if check.Status == "failed" {
				t.Logf("failed check: %s - %s", check.Name, check.Message)
			}
		}
		t.Errorf("expected 0 failed checks for empty repo, got %d", result.FailedChecks)
	}
	if result.PassedChecks != 3 {
		t.Errorf("expected 3 passed checks for empty repo, got %d", result.PassedChecks)
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
	opencodeContent := "---\ndescription: Different description\ntools:\n  read: true\nmodel: opencode-go/minimax-m2.7\nskills: []\n---\n\nBody.\n"
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

	// Claude uses "sonnet" → should convert to "opencode-go/minimax-m2.7"
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
	opencodeContent := "---\ndescription: Same desc\ntools:\n  write: true\nmodel: opencode-go/minimax-m2.7\nskills: []\n---\n\nBody.\n"
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
	opencodeContent := "---\ndescription: Same desc\ntools:\n  read: true\nmodel: opencode-go/minimax-m2.7\nskills: []\n---\n\nDifferent body.\n"
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
	opencodeContent := "---\ndescription: Same desc\ntools:\n  read: true\nmodel: opencode-go/minimax-m2.7\nskills: []\n---\n\nBody.\n"
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
	if err := os.WriteFile(filepath.Join(opencodeAgentDir, "agent-a.md"), []byte("---\ndescription: Agent A\ntools:\n  read: true\nmodel: opencode-go/minimax-m2.7\nskills: []\n---\n\nBody A.\n"), 0644); err != nil {
		t.Fatalf("failed to create opencode agent: %v", err)
	}

	// No skills dirs anywhere — noSyncedSkillMirror should still pass.
	if err := os.MkdirAll(filepath.Join(tmpDir, ".claude", "skills"), 0755); err != nil {
		t.Fatalf("failed to create claude skills dir: %v", err)
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

func TestValidateSync_WithSkillMirrorOffender(t *testing.T) {
	tmpDir := t.TempDir()

	// Equal agent counts (0 each), but a synced skill mirror exists under
	// .opencode/skills/<name> for a name also present under .claude/skills/<name>.
	// noSyncedSkillMirror should report this as a failure.
	for _, d := range []string{
		filepath.Join(tmpDir, ".claude", "agents"),
		filepath.Join(tmpDir, OpenCodeAgentDir),
		filepath.Join(tmpDir, ".claude", "skills", "shared-skill"),
		filepath.Join(tmpDir, ".opencode", "skills", "shared-skill"),
	} {
		if err := os.MkdirAll(d, 0755); err != nil {
			t.Fatalf("failed to create dir: %v", err)
		}
	}

	if err := os.WriteFile(filepath.Join(tmpDir, ".claude", "skills", "shared-skill", "SKILL.md"), []byte("# Skill"), 0644); err != nil {
		t.Fatalf("failed to create claude skill: %v", err)
	}
	if err := os.WriteFile(filepath.Join(tmpDir, ".opencode", "skills", "shared-skill", "SKILL.md"), []byte("# Skill"), 0644); err != nil {
		t.Fatalf("failed to create opencode mirror: %v", err)
	}

	result, err := ValidateSync(tmpDir)
	if err != nil {
		t.Fatalf("ValidateSync() unexpected error: %v", err)
	}
	if result.FailedChecks == 0 {
		t.Error("expected at least one failed check for synced-skill mirror offender")
	}
	// One of the failed checks must be the noSyncedSkillMirror check.
	var found bool
	for _, c := range result.Checks {
		if c.Name == "No Synced Skill Mirror" && c.Status == "failed" {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("expected 'No Synced Skill Mirror' check to be the failure, got checks: %v", result.Checks)
	}
}

func TestValidateSync_WithStaleAgentDir(t *testing.T) {
	tmpDir := t.TempDir()

	// Create the stale singular .opencode/agent/ directory along with an empty
	// canonical .opencode/agents/ — noStaleAgentDir should fail.
	for _, d := range []string{
		filepath.Join(tmpDir, ".claude", "agents"),
		filepath.Join(tmpDir, OpenCodeAgentDir),
		filepath.Join(tmpDir, ".opencode", "agent"),
	} {
		if err := os.MkdirAll(d, 0755); err != nil {
			t.Fatalf("failed to create dir: %v", err)
		}
	}

	result, err := ValidateSync(tmpDir)
	if err != nil {
		t.Fatalf("ValidateSync() unexpected error: %v", err)
	}
	if result.FailedChecks == 0 {
		t.Error("expected at least one failed check for stale .opencode/agent/ directory")
	}
	var found bool
	for _, c := range result.Checks {
		if c.Name == "No Stale Agent Directory" && c.Status == "failed" {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("expected 'No Stale Agent Directory' check to be the failure, got checks: %v", result.Checks)
	}
}

func TestCountMarkdownFiles_NonExistentDir(t *testing.T) {
	count := countMarkdownFiles("/nonexistent/directory/that/does/not/exist")
	if count != 0 {
		t.Errorf("expected 0 for non-existent dir, got %d", count)
	}
}

func TestValidateAgentFile_ClaudeYAMLUnmarshalError(t *testing.T) {
	// Tests sync_validator.go yaml.Unmarshal(claudeFront, &claudeData) error
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
	opencodeContent := "---\ndescription: test\nmodel: opencode-go/minimax-m2.7\n---\n\nBody.\n"
	if err := os.WriteFile(opencodePath, []byte(opencodeContent), 0644); err != nil {
		t.Fatalf("failed to create opencode agent: %v", err)
	}

	check := validateAgentFile("agent.md", claudePath, opencodePath)
	if check.Status != "failed" {
		t.Errorf("expected 'failed' for Claude YAML unmarshal error, got %q: %s", check.Status, check.Message)
	}
}

func TestValidateAgentFile_OpenCodeYAMLUnmarshalError(t *testing.T) {
	// Tests sync_validator.go yaml.Unmarshal(opencodeFront, &opencodeAgent) error
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
	opencodeContent := "---\ndescription: Test\nmodel: opencode-go/minimax-m2.7\ntools: read,write\n---\n\nBody.\n"
	if err := os.WriteFile(opencodePath, []byte(opencodeContent), 0644); err != nil {
		t.Fatalf("failed to create opencode agent: %v", err)
	}

	check := validateAgentFile("agent.md", claudePath, opencodePath)
	if check.Status != "failed" {
		t.Errorf("expected 'failed' for OpenCode YAML unmarshal error, got %q: %s", check.Status, check.Message)
	}
}
