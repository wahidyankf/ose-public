package governance

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// --- scanLines unit tests ---

func TestScanLines_DetectsForbiddenTermInProse(t *testing.T) {
	content := "# Section\n\nThis document describes Claude Code usage.\n"
	findings := scanLines("governance/foo.md", content)
	if len(findings) == 0 {
		t.Fatal("expected at least one finding for 'Claude Code' in prose, got none")
	}
	found := false
	for _, f := range findings {
		if f.Match == "Claude Code" {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("expected a finding for 'Claude Code', got: %+v", findings)
	}
}

func TestScanLines_ExemptsCodeFenceContent(t *testing.T) {
	content := "# Section\n\n```bash\necho Claude Code\n```\n\nclean prose\n"
	findings := scanLines("governance/foo.md", content)
	if len(findings) != 0 {
		t.Errorf("expected zero findings when term is inside code fence, got: %+v", findings)
	}
}

func TestScanLines_ExemptsBindingExampleFenceContent(t *testing.T) {
	content := "# Section\n\n```binding-example\nClaude Code integration\n```\n\nclean prose\n"
	findings := scanLines("governance/foo.md", content)
	if len(findings) != 0 {
		t.Errorf("expected zero findings for binding-example fence, got: %+v", findings)
	}
}

func TestScanLines_ExemptsPlatformBindingExamplesSection(t *testing.T) {
	content := "# Doc\n\n## Platform Binding Examples\n\nClaude Code is used here.\n\n## Other Section\n\nclean\n"
	findings := scanLines("governance/foo.md", content)
	if len(findings) != 0 {
		t.Errorf("expected zero findings under Platform Binding Examples heading, got: %+v", findings)
	}
}

func TestScanLines_ExemptsInlineBacktickCode(t *testing.T) {
	content := "Run `Claude Code` to perform the action.\n"
	findings := scanLines("governance/foo.md", content)
	if len(findings) != 0 {
		t.Errorf("expected zero findings for term in inline code, got: %+v", findings)
	}
}

func TestScanLines_ExemptsLinkURLPortion(t *testing.T) {
	content := "See the [documentation](https://claude.ai/code/Claude Code/reference) for details.\n"
	findings := scanLines("governance/foo.md", content)
	if len(findings) != 0 {
		t.Errorf("expected zero findings for term in link URL, got: %+v", findings)
	}
}

func TestScanLines_ReturnsNoFindingsForCleanFile(t *testing.T) {
	content := "# Governance\n\nThis section describes the execution-grade model tier.\n\nUse the primary binding directory for agent definitions.\n"
	findings := scanLines("governance/clean.md", content)
	if len(findings) != 0 {
		t.Errorf("expected zero findings for clean file, got: %+v", findings)
	}
}

func TestScanLines_ReturnsCorrectLineNumber(t *testing.T) {
	content := "# Section\n\nLine two\n\nThis uses Claude Code in prose.\n"
	findings := scanLines("governance/foo.md", content)
	if len(findings) == 0 {
		t.Fatal("expected finding, got none")
	}
	if findings[0].Line != 5 {
		t.Errorf("expected line 5, got %d", findings[0].Line)
	}
}

func TestScanLines_MultipleForbiddenTermsSameLine(t *testing.T) {
	// A line with two different forbidden terms should produce two findings.
	content := "Use Claude Code with the Anthropic API.\n"
	findings := scanLines("governance/foo.md", content)
	if len(findings) < 2 {
		t.Errorf("expected at least 2 findings for two terms, got: %+v", findings)
	}
}

func TestScanLines_ExemptsHTMLComment(t *testing.T) {
	content := "<!-- Claude Code is mentioned here -->\n\nclean prose\n"
	findings := scanLines("governance/foo.md", content)
	if len(findings) != 0 {
		t.Errorf("expected zero findings for term in HTML comment, got: %+v", findings)
	}
}

func TestScanLines_DetectsDotClaudeSlash(t *testing.T) {
	content := "Platform bindings live in .claude/ directory.\n"
	findings := scanLines("governance/foo.md", content)
	found := false
	for _, f := range findings {
		if f.Match == ".claude/" {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("expected finding for '.claude/', got: %+v", findings)
	}
}

func TestScanLines_DetectsModelTierTerms(t *testing.T) {
	tests := []struct {
		name  string
		input string
		term  string
	}{
		{"Sonnet", "Use the Sonnet model for this task.\n", "Sonnet"},
		{"Opus", "Opus is used for planning tasks.\n", "Opus"},
		{"Haiku", "Haiku handles fast responses.\n", "Haiku"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			findings := scanLines("governance/foo.md", tt.input)
			found := false
			for _, f := range findings {
				if f.Match == tt.term {
					found = true
					break
				}
			}
			if !found {
				t.Errorf("expected finding for %q, got: %+v", tt.term, findings)
			}
		})
	}
}

func TestScanLines_DetectsExpandedHarnessAndVendorTerms(t *testing.T) {
	// Each table entry asserts that the named term is detected when used in
	// plain prose. The replacement text is not asserted; that lives in the
	// scanner's forbiddenTerms slice.
	tests := []struct {
		name  string
		input string
		term  string
	}{
		{"Cursor harness", "Use Cursor for inline edits.\n", "Cursor"},
		{"Windsurf harness", "Windsurf flows replace cascading agents.\n", "Windsurf"},
		{"Codeium legacy", "Codeium is the legacy brand for Windsurf.\n", "Codeium"},
		{"Copilot harness", "Configure Copilot via the binding directory.\n", "Copilot"},
		{"Aider harness", "Aider runs in the terminal.\n", "Aider"},
		{"Cline harness", "Cline integrates with VS Code.\n", "Cline"},
		{"Devin agent", "Devin is the cloud-based coding agent.\n", "Devin"},
		{"OpenAI vendor", "OpenAI ships GPT models.\n", "OpenAI"},
		{"xAI vendor", "xAI publishes Grok variants.\n", "xAI"},
		{"GPT model family", "Use GPT for completion.\n", "GPT"},
		{"Gemini model family", "Gemini handles long context well.\n", "Gemini"},
		{"DeepSeek model family", "DeepSeek released a new checkpoint.\n", "DeepSeek"},
		{"Qwen model family", "Qwen is competitive on coding benchmarks.\n", "Qwen"},
		{"Llama model family", "Llama is open-weight.\n", "Llama"},
		{"Mistral model family", "Mistral releases European-built models.\n", "Mistral"},
		{"Grok model family", "Grok runs on xAI infrastructure.\n", "Grok"},
		{".cursor/ path", "The .cursor/ directory is generated.\n", ".cursor/"},
		{".windsurf/ path", "Look in .windsurf/ for the workspace config.\n", ".windsurf/"},
		{".continue/ path", "Settings live under .continue/ at repo root.\n", ".continue/"},
		{".clinerules/ path", "Project lives in .clinerules/ for agent rules.\n", ".clinerules/"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			findings := scanLines("governance/foo.md", tt.input)
			found := false
			for _, f := range findings {
				if f.Match == tt.term {
					found = true
					break
				}
			}
			if !found {
				t.Errorf("expected finding for %q, got: %+v", tt.term, findings)
			}
		})
	}
}

func TestScanLines_DetectsCapitalizedSkillsTerm(t *testing.T) {
	t.Run("capitalized branded Skills is detected", func(t *testing.T) {
		content := "Use Skills to delegate work to specialized agents.\n"
		findings := scanLines("governance/foo.md", content)
		found := false
		for _, f := range findings {
			if f.Match == "Skills" {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("expected finding for capitalized 'Skills', got: %+v", findings)
		}
	})

	t.Run("lowercase agent skills is allowed", func(t *testing.T) {
		content := "Use agent skills to delegate work to specialized agents.\n"
		findings := scanLines("governance/foo.md", content)
		for _, f := range findings {
			if f.Match == "Skills" {
				t.Errorf("did not expect a Skills finding for lowercase prose, got: %+v", f)
			}
		}
	})

	t.Run("Skills inside a code fence is exempt", func(t *testing.T) {
		content := "# Section\n\n```bash\necho Skills\n```\n\nclean prose\n"
		findings := scanLines("governance/foo.md", content)
		if len(findings) != 0 {
			t.Errorf("expected zero findings when Skills is inside a code fence, got: %+v", findings)
		}
	})
}

func TestScanLines_PlatformBindingExamplesHeadingCaseInsensitive(t *testing.T) {
	content := "# Doc\n\n## PLATFORM BINDING EXAMPLES\n\nClaude Code used here.\n"
	findings := scanLines("governance/foo.md", content)
	if len(findings) != 0 {
		t.Errorf("expected zero findings with uppercase heading, got: %+v", findings)
	}
}

func TestScanLines_PlatformBindingExamplesSectionEndsAtSameLevelHeading(t *testing.T) {
	content := "# Doc\n\n## Platform Binding Examples\n\nClaude Code here.\n\n## Next Section\n\nClaude Code here too.\n"
	findings := scanLines("governance/foo.md", content)
	// Should find exactly one violation in "Next Section", not in the platform binding section.
	if len(findings) != 1 {
		t.Errorf("expected 1 finding (in Next Section), got %d: %+v", len(findings), findings)
	}
	if findings[0].Line != 9 {
		t.Errorf("expected violation on line 9 (Next Section), got line %d", findings[0].Line)
	}
}

func TestScanLines_PlatformBindingExamplesSectionEndsAtHigherLevelHeading(t *testing.T) {
	// H3 under H2 Platform Binding Examples should still be exempt.
	// An H1 heading should close the section.
	content := "## Platform Binding Examples\n\n### Sub\n\nClaude Code here.\n\n# New Top Level\n\nClaude Code here.\n"
	findings := scanLines("governance/foo.md", content)
	if len(findings) != 1 {
		t.Errorf("expected 1 finding after H1, got %d: %+v", len(findings), findings)
	}
}

// --- ScanFile unit tests ---

func TestScanFile_DetectsForbiddenTerm(t *testing.T) {
	tmp := t.TempDir()
	f := filepath.Join(tmp, "test.md")
	if err := os.WriteFile(f, []byte("# Test\n\nClaude Code is mentioned.\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	findings, err := ScanFile(f)
	if err != nil {
		t.Fatalf("ScanFile: %v", err)
	}
	if len(findings) == 0 {
		t.Error("expected findings, got none")
	}
}

func TestScanFile_ReturnsErrorForMissingFile(t *testing.T) {
	_, err := ScanFile("/nonexistent/path/file.md")
	if err == nil {
		t.Error("expected error for missing file, got nil")
	}
}

func TestScanFile_CleanFileReturnsNoFindings(t *testing.T) {
	tmp := t.TempDir()
	f := filepath.Join(tmp, "clean.md")
	if err := os.WriteFile(f, []byte("# Clean\n\nNo violations here.\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	findings, err := ScanFile(f)
	if err != nil {
		t.Fatalf("ScanFile: %v", err)
	}
	if len(findings) != 0 {
		t.Errorf("expected zero findings for clean file, got: %+v", findings)
	}
}

// --- Walk unit tests ---

func TestWalk_SkipsGovernanceVendorIndependenceFile(t *testing.T) {
	tmp := t.TempDir()
	// Create the convention file with a forbidden term — it must be skipped.
	convPath := filepath.Join(tmp, "governance", "conventions", "structure")
	if err := os.MkdirAll(convPath, 0o755); err != nil {
		t.Fatal(err)
	}
	convFile := filepath.Join(convPath, "governance-vendor-independence.md")
	if err := os.WriteFile(convFile, []byte("# Convention\n\nClaude Code is the term.\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	findings, err := Walk(tmp)
	if err != nil {
		t.Fatalf("Walk: %v", err)
	}
	for _, f := range findings {
		if strings.HasSuffix(filepath.ToSlash(f.Path), forbiddenConvention) {
			t.Errorf("convention file should be skipped, but got finding: %+v", f)
		}
	}
}

func TestWalk_MissingRootReturnsEmpty(t *testing.T) {
	findings, err := Walk("/nonexistent/path")
	if err != nil {
		t.Fatalf("Walk: expected nil error for missing root, got: %v", err)
	}
	if len(findings) != 0 {
		t.Errorf("expected zero findings for missing root, got %d", len(findings))
	}
}

func TestWalk_SkipsNonMarkdownFiles(t *testing.T) {
	tmp := t.TempDir()
	if err := os.WriteFile(filepath.Join(tmp, "script.sh"), []byte("echo Claude Code"), 0o644); err != nil {
		t.Fatal(err)
	}
	findings, err := Walk(tmp)
	if err != nil {
		t.Fatalf("Walk: %v", err)
	}
	if len(findings) != 0 {
		t.Errorf("expected zero findings for non-md file, got: %+v", findings)
	}
}

func TestWalk_FindsViolationsInMarkdownFiles(t *testing.T) {
	tmp := t.TempDir()
	if err := os.WriteFile(filepath.Join(tmp, "doc.md"), []byte("# Doc\n\nClaude Code usage.\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	findings, err := Walk(tmp)
	if err != nil {
		t.Fatalf("Walk: %v", err)
	}
	if len(findings) == 0 {
		t.Error("expected findings, got none")
	}
}

// --- parseHeading unit tests ---

func TestParseHeading(t *testing.T) {
	tests := []struct {
		line      string
		wantLevel int
		wantOK    bool
	}{
		{"# Title", 1, true},
		{"## Section", 2, true},
		{"### Sub", 3, true},
		{"###### Deep", 6, true},
		{"####### Too deep", 0, false},
		{"##NoSpace", 0, false},
		{"plain text", 0, false},
		{"", 0, false},
		{"  ## Indented heading", 2, true},
	}
	for _, tt := range tests {
		t.Run(tt.line, func(t *testing.T) {
			level, ok := parseHeading(tt.line)
			if ok != tt.wantOK {
				t.Errorf("parseHeading(%q): ok=%v want %v", tt.line, ok, tt.wantOK)
			}
			if level != tt.wantLevel {
				t.Errorf("parseHeading(%q): level=%d want %d", tt.line, level, tt.wantLevel)
			}
		})
	}
}

// --- stripNonProse unit tests ---

func TestStripNonProse_RemovesInlineCode(t *testing.T) {
	line := "Run `Claude Code` for this."
	got := stripNonProse(line)
	if strings.Contains(got, "Claude Code") {
		t.Errorf("expected inline code stripped, got: %q", got)
	}
}

func TestStripNonProse_RemovesLinkURL(t *testing.T) {
	line := "See [docs](https://claude.ai/Claude Code/ref) here."
	got := stripNonProse(line)
	if strings.Contains(got, "Claude Code") {
		t.Errorf("expected link URL stripped, got: %q", got)
	}
	if !strings.Contains(got, "[docs]") {
		t.Errorf("expected link text preserved, got: %q", got)
	}
}

func TestStripNonProse_RemovesHTMLComment(t *testing.T) {
	line := "<!-- Claude Code --> clean text"
	got := stripNonProse(line)
	if strings.Contains(got, "Claude Code") {
		t.Errorf("expected HTML comment stripped, got: %q", got)
	}
	if !strings.Contains(got, "clean text") {
		t.Errorf("expected non-comment text preserved, got: %q", got)
	}
}

// --- fenceLineLen unit tests ---

func TestFenceLineLen(t *testing.T) {
	tests := []struct {
		line string
		want int
	}{
		{"```", 3},
		{"```go", 3},
		{"````markdown", 4},
		{"  ```bash  ", 3},
		{"``", 0},
		{"plain text", 0},
		{"", 0},
	}
	for _, tt := range tests {
		t.Run(tt.line, func(t *testing.T) {
			got := fenceLineLen(tt.line)
			if got != tt.want {
				t.Errorf("fenceLineLen(%q) = %d, want %d", tt.line, got, tt.want)
			}
		})
	}
}

func TestScanLines_ExemptsNestedCodeFenceContent(t *testing.T) {
	// A 4-backtick outer fence containing an inner 3-backtick mermaid block.
	// OpenCode inside the mermaid block must NOT be reported.
	content := "# Doc\n\n````markdown\n```mermaid\ngraph TD\n    A[OpenCode- Main Agent]\n```\n````\n\nclean prose\n"
	findings := scanLines("governance/foo.md", content)
	if len(findings) != 0 {
		t.Errorf("expected zero findings inside nested code fence, got: %+v", findings)
	}
}

func TestScanLines_ExemptsMultiLineHTMLComment(t *testing.T) {
	content := "# Doc\n\n<!--\nClaude Code is mentioned in this comment.\n.claude/ path here.\n-->\n\nclean prose\n"
	findings := scanLines("governance/foo.md", content)
	if len(findings) != 0 {
		t.Errorf("expected zero findings inside multi-line HTML comment, got: %+v", findings)
	}
}

func TestScanLines_ExemptsYAMLFrontmatter(t *testing.T) {
	content := "---\ntitle: something\ndescription: agent structure for .claude/agents and .opencode/agents\npattern: .claude/skills/some-skill/SKILL.md\n---\n\n# Doc\n\nclean prose\n"
	findings := scanLines("governance/foo.md", content)
	if len(findings) != 0 {
		t.Errorf("expected zero findings inside YAML frontmatter, got: %+v", findings)
	}
}

func TestScanLines_ScansProseBelowFrontmatter(t *testing.T) {
	content := "---\ntitle: something\n---\n\nClaude Code is mentioned here.\n"
	findings := scanLines("governance/foo.md", content)
	if len(findings) == 0 {
		t.Error("expected findings below frontmatter, got none")
	}
}

func TestScanLines_DetectsViolationBeforeMultiLineHTMLComment(t *testing.T) {
	// Forbidden term appears before <!-- on same line that opens a multi-line comment.
	content := "# Doc\n\nClaude Code mentioned here <!-- start of\nmulti-line comment\n-->\n\nclean prose\n"
	findings := scanLines("governance/foo.md", content)
	if len(findings) == 0 {
		t.Error("expected finding for term before multi-line HTML comment, got none")
	}
	if findings[0].Line != 3 {
		t.Errorf("expected violation on line 3, got line %d", findings[0].Line)
	}
}

func TestScanLines_NoViolationBeforeEmptyMultiLineHTMLComment(t *testing.T) {
	// Line that opens a multi-line comment has nothing before <!--.
	content := "# Doc\n\n<!--\nClaude Code in comment\n-->\n\nclean prose\n"
	findings := scanLines("governance/foo.md", content)
	if len(findings) != 0 {
		t.Errorf("expected zero findings, got: %+v", findings)
	}
}
