package agents

import (
	"bytes"
	"os"
	"path/filepath"
	"sort"
	"testing"

	"gopkg.in/yaml.v3"
)

// documentedClaudeAgentFields is the frozen Phase 0 spec snapshot of
// Claude Code agent frontmatter fields (verified 2026-05-02 against
// code.claude.com/docs/en/sub-agents — see
// local-temp/opencode-docs-snapshot-2026-05-02.md). It must stay in lock-step
// with ValidClaudeAgentFields in types.go and claudeAgentFieldPolicy in
// converter.go — both derive from the same upstream spec.
//
// TestEveryClaudeFieldIsPolicied below is the cross-check: every name in
// this list MUST have a matching policy entry in claudeAgentFieldPolicy.
// If you add a name here, update the policy map; if you add to the policy
// map, update this list. Spec drift surfaces as a failing test rather than
// silent conversion divergence.
var documentedClaudeAgentFields = []string{
	"name",
	"description",
	"tools",
	"disallowedTools",
	"model",
	"permissionMode",
	"maxTurns",
	"skills",
	"mcpServers",
	"hooks",
	"memory",
	"background",
	"effort",
	"isolation",
	"color",
	"initialPrompt",
}

// openCodeRecognizedAgentFields is the set of OpenCode-documented agent
// frontmatter fields per opencode.ai/docs/agents/ (verified 2026-05-02 —
// snapshot in local-temp/opencode-docs-snapshot-2026-05-02.md). The
// `tools` field is documented as deprecated but still recognized.
//
// TestNoUnknownFieldInOpenCodeOutput uses this set to detect any leak of
// an unrecognized key into the OpenCode output: every key emitted in the
// output frontmatter MUST be in this set.
var openCodeRecognizedAgentFields = map[string]bool{
	"description": true,
	"mode":        true,
	"model":       true,
	"prompt":      true,
	"temperature": true,
	"top_p":       true,
	"steps":       true,
	"disable":     true,
	"permission":  true,
	"hidden":      true,
	"color":       true,
	"tools":       true,
	"skills":      true,
}

// TestEveryClaudeFieldIsPolicied (P2.5.1) cross-checks the frozen
// documented field list against claudeAgentFieldPolicy. Every documented
// Claude Code field MUST have an explicit policy entry — no silent
// fall-through. Catches the failure mode "spec adds a field, policy map
// lags, conversion silently passes the field through OR drops it".
func TestEveryClaudeFieldIsPolicied(t *testing.T) {
	for _, field := range documentedClaudeAgentFields {
		policy, ok := claudeAgentFieldPolicy[field]
		if !ok {
			t.Errorf("documented Claude Code field %q has no entry in claudeAgentFieldPolicy", field)
			continue
		}
		if policy.action == "" {
			t.Errorf("documented Claude Code field %q has empty action in claudeAgentFieldPolicy", field)
		}
	}
}

// specFixtures returns the absolute path to every fixture file under
// testdata/spec/. Used by P2.5.2 and P2.5.4.
func specFixtures(t *testing.T) []string {
	t.Helper()
	dir := filepath.Join("testdata", "spec")
	entries, err := os.ReadDir(dir)
	if err != nil {
		t.Fatalf("failed to read fixtures dir %q: %v", dir, err)
	}
	var paths []string
	for _, e := range entries {
		if e.IsDir() || filepath.Ext(e.Name()) != ".md" {
			continue
		}
		paths = append(paths, filepath.Join(dir, e.Name()))
	}
	sort.Strings(paths)
	if len(paths) == 0 {
		t.Fatalf("no fixtures found under %q", dir)
	}
	return paths
}

// TestNoUnknownFieldInOpenCodeOutput (P2.5.2) sweeps every fixture under
// testdata/spec/, runs the converter, parses the emitted frontmatter as a
// generic map, and asserts every key is in openCodeRecognizedAgentFields.
// An unrecognized key indicates a converter bug that leaked a Claude-only
// field into the OpenCode output.
func TestNoUnknownFieldInOpenCodeOutput(t *testing.T) {
	tmpDir := t.TempDir()
	for _, fix := range specFixtures(t) {
		fix := fix
		t.Run(filepath.Base(fix), func(t *testing.T) {
			outPath := filepath.Join(tmpDir, filepath.Base(fix))
			if _, err := ConvertAgent(fix, outPath, false); err != nil {
				t.Fatalf("ConvertAgent(%s) failed: %v", fix, err)
			}

			out, err := os.ReadFile(outPath)
			if err != nil {
				t.Fatalf("read output: %v", err)
			}
			front, _, err := ExtractFrontmatter(out)
			if err != nil {
				t.Fatalf("ExtractFrontmatter(%s) failed: %v", outPath, err)
			}

			var emitted map[string]interface{}
			if err := yaml.Unmarshal(front, &emitted); err != nil {
				t.Fatalf("yaml.Unmarshal(%s) failed: %v", outPath, err)
			}

			for key := range emitted {
				if !openCodeRecognizedAgentFields[key] {
					t.Errorf("fixture %s produced output with unrecognized OpenCode key %q", fix, key)
				}
			}
		})
	}
}

// TestRoundTripPreservesSemantics (P2.5.3) takes a fully-populated
// synthetic Claude agent (every preserve / translate field set), converts
// it, re-parses the output, and asserts:
//
//   - description: byte-equal to source
//   - tools: equals ConvertTools(source.tools)
//   - color: translated via ConvertColor (Claude name → OpenCode theme)
//   - skills: order preserved
//
// All drop+warn fields (memory, isolation, etc.) MUST NOT appear in the
// output frontmatter at all.
func TestRoundTripPreservesSemantics(t *testing.T) {
	tmpDir := t.TempDir()
	inputPath := filepath.Join(tmpDir, "round-trip.md")
	src := `---
name: round-trip
description: A fully-loaded round-trip fixture
tools:
  - Read
  - Write
  - Bash
model: sonnet
color: orange
skills:
  - alpha
  - beta
  - gamma
memory: project
isolation: worktree
background: true
effort: high
---

Body.
`
	if err := os.WriteFile(inputPath, []byte(src), 0644); err != nil {
		t.Fatal(err)
	}

	outPath := filepath.Join(tmpDir, "out.md")
	warnings, err := ConvertAgent(inputPath, outPath, false)
	if err != nil {
		t.Fatalf("ConvertAgent error: %v", err)
	}

	// Drop+warn fields must produce a warning per field.
	wantDropWarn := map[string]bool{"memory": true, "isolation": true, "background": true, "effort": true}
	for _, w := range warnings {
		delete(wantDropWarn, w.Field)
	}
	if len(wantDropWarn) != 0 {
		t.Errorf("missing drop-warn warnings for fields: %v", keysOf(wantDropWarn))
	}

	out, err := os.ReadFile(outPath)
	if err != nil {
		t.Fatal(err)
	}
	front, _, err := ExtractFrontmatter(out)
	if err != nil {
		t.Fatalf("ExtractFrontmatter: %v", err)
	}

	var agent OpenCodeAgent
	if err := yaml.Unmarshal(front, &agent); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	if agent.Description != "A fully-loaded round-trip fixture" {
		t.Errorf("description not preserved byte-equal: %q", agent.Description)
	}

	expectedTools := ConvertTools([]string{"Read", "Write", "Bash"})
	if len(agent.Tools) != len(expectedTools) {
		t.Errorf("tools length mismatch: got %d want %d", len(agent.Tools), len(expectedTools))
	}
	for k, v := range expectedTools {
		if agent.Tools[k] != v {
			t.Errorf("tools[%q] = %v, want %v", k, agent.Tools[k], v)
		}
	}

	if agent.Color != "warning" {
		t.Errorf("color not translated to OpenCode theme token: got %q want %q", agent.Color, "warning")
	}

	wantSkills := []string{"alpha", "beta", "gamma"}
	if len(agent.Skills) != len(wantSkills) {
		t.Fatalf("skills length: got %d want %d", len(agent.Skills), len(wantSkills))
	}
	for i, s := range wantSkills {
		if agent.Skills[i] != s {
			t.Errorf("skills[%d] = %q, want %q (order matters)", i, agent.Skills[i], s)
		}
	}

	// Generic-map parse to assert drop-warn fields are absent from the
	// emitted YAML, regardless of struct field shape.
	var emitted map[string]interface{}
	if err := yaml.Unmarshal(front, &emitted); err != nil {
		t.Fatalf("generic unmarshal: %v", err)
	}
	for _, banned := range []string{"memory", "isolation", "background", "effort", "name"} {
		if _, present := emitted[banned]; present {
			t.Errorf("dropped/banned field %q unexpectedly present in OpenCode output", banned)
		}
	}
}

// TestSyncIsIdempotent (P2.5.4) runs the converter twice against every
// fixture and asserts byte-equal output. Catches map-iteration
// non-determinism in YAML emission — the OpenCode output MUST be stable
// across runs so reviewers see no diff when nothing meaningful changed.
func TestSyncIsIdempotent(t *testing.T) {
	dir1 := t.TempDir()
	dir2 := t.TempDir()
	for _, fix := range specFixtures(t) {
		fix := fix
		t.Run(filepath.Base(fix), func(t *testing.T) {
			out1 := filepath.Join(dir1, filepath.Base(fix))
			out2 := filepath.Join(dir2, filepath.Base(fix))
			if _, err := ConvertAgent(fix, out1, false); err != nil {
				t.Fatalf("first ConvertAgent: %v", err)
			}
			if _, err := ConvertAgent(fix, out2, false); err != nil {
				t.Fatalf("second ConvertAgent: %v", err)
			}
			b1, err := os.ReadFile(out1)
			if err != nil {
				t.Fatal(err)
			}
			b2, err := os.ReadFile(out2)
			if err != nil {
				t.Fatal(err)
			}
			if !bytes.Equal(b1, b2) {
				t.Errorf("sync non-deterministic for %s:\nrun 1:\n%s\nrun 2:\n%s",
					fix, string(b1), string(b2))
			}
		})
	}
}

// keysOf is a small helper for stable error messages on map[string]bool.
func keysOf(m map[string]bool) []string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	sort.Strings(out)
	return out
}
