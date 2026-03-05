package docs

import (
	"encoding/json"
	"strings"
	"testing"
	"time"
)

func TestFormatLinkText_NoBrokenLinks(t *testing.T) {
	result := &LinkValidationResult{
		TotalFiles:       10,
		TotalLinks:       100,
		BrokenLinks:      []BrokenLink{},
		BrokenByCategory: make(map[string][]BrokenLink),
		ScanDuration:     100 * time.Millisecond,
	}

	output := FormatLinkText(result, false, false)

	if !strings.Contains(output, "✓ All links valid!") {
		t.Errorf("Expected success message, got: %s", output)
	}
}

func TestFormatLinkText_WithBrokenLinks(t *testing.T) {
	brokenLinks := []BrokenLink{
		{
			LineNumber: 10,
			SourceFile: "docs/file1.md",
			LinkText:   "../missing.md",
			TargetPath: "/path/to/missing.md",
			Category:   "General/other paths",
		},
		{
			LineNumber: 20,
			SourceFile: "docs/file2.md",
			LinkText:   "./ex-ru-old.md",
			TargetPath: "/path/to/ex-ru-old.md",
			Category:   "Old ex-ru-* prefixes",
		},
	}

	byCategory := map[string][]BrokenLink{
		"General/other paths":  {brokenLinks[0]},
		"Old ex-ru-* prefixes": {brokenLinks[1]},
	}

	result := &LinkValidationResult{
		TotalFiles:       10,
		TotalLinks:       100,
		BrokenLinks:      brokenLinks,
		BrokenByCategory: byCategory,
		ScanDuration:     100 * time.Millisecond,
	}

	output := FormatLinkText(result, false, false)

	// Check for expected elements
	expectedStrings := []string{
		"# Broken Links Report",
		"**Total broken links**: 2",
		"## Old ex-ru-* prefixes (1 links)",
		"## General/other paths (1 links)",
		"### docs/file1.md",
		"### docs/file2.md",
		"- Line 10: `../missing.md`",
		"- Line 20: `./ex-ru-old.md`",
	}

	for _, expected := range expectedStrings {
		if !strings.Contains(output, expected) {
			t.Errorf("Expected output to contain %q, but it didn't.\nOutput:\n%s", expected, output)
		}
	}
}

func TestFormatLinkJSON(t *testing.T) {
	brokenLinks := []BrokenLink{
		{
			LineNumber: 10,
			SourceFile: "docs/file.md",
			LinkText:   "../missing.md",
			TargetPath: "/path/to/missing.md",
			Category:   "General/other paths",
		},
	}

	byCategory := map[string][]BrokenLink{
		"General/other paths": {brokenLinks[0]},
	}

	result := &LinkValidationResult{
		TotalFiles:       10,
		TotalLinks:       100,
		BrokenLinks:      brokenLinks,
		BrokenByCategory: byCategory,
		ScanDuration:     123 * time.Millisecond,
	}

	jsonStr, err := FormatLinkJSON(result)
	if err != nil {
		t.Fatalf("FormatLinkJSON() error = %v", err)
	}

	// Parse JSON to verify structure
	var output LinkJSONOutput
	if err := json.Unmarshal([]byte(jsonStr), &output); err != nil {
		t.Fatalf("Failed to parse JSON output: %v", err)
	}

	// Verify fields
	if output.Status != "failure" {
		t.Errorf("Status = %q, want %q", output.Status, "failure")
	}
	if output.TotalFiles != 10 {
		t.Errorf("TotalFiles = %d, want 10", output.TotalFiles)
	}
	if output.TotalLinks != 100 {
		t.Errorf("TotalLinks = %d, want 100", output.TotalLinks)
	}
	if output.BrokenCount != 1 {
		t.Errorf("BrokenCount = %d, want 1", output.BrokenCount)
	}
	if output.DurationMS != 123 {
		t.Errorf("DurationMS = %d, want 123", output.DurationMS)
	}

	// Verify categories
	category, exists := output.Categories["General/other paths"]
	if !exists {
		t.Fatal("Expected 'General/other paths' category")
	}
	if len(category) != 1 {
		t.Fatalf("Expected 1 link in category, got %d", len(category))
	}

	link := category[0]
	if link.SourceFile != "docs/file.md" {
		t.Errorf("SourceFile = %q, want %q", link.SourceFile, "docs/file.md")
	}
	if link.LineNumber != 10 {
		t.Errorf("LineNumber = %d, want 10", link.LineNumber)
	}
	if link.LinkText != "../missing.md" {
		t.Errorf("LinkText = %q, want %q", link.LinkText, "../missing.md")
	}
}

func TestFormatLinkJSON_Success(t *testing.T) {
	result := &LinkValidationResult{
		TotalFiles:       10,
		TotalLinks:       100,
		BrokenLinks:      []BrokenLink{},
		BrokenByCategory: make(map[string][]BrokenLink),
		ScanDuration:     50 * time.Millisecond,
	}

	jsonStr, err := FormatLinkJSON(result)
	if err != nil {
		t.Fatalf("FormatLinkJSON() error = %v", err)
	}

	var output LinkJSONOutput
	if err := json.Unmarshal([]byte(jsonStr), &output); err != nil {
		t.Fatalf("Failed to parse JSON output: %v", err)
	}

	if output.Status != "success" {
		t.Errorf("Status = %q, want %q", output.Status, "success")
	}
	if output.BrokenCount != 0 {
		t.Errorf("BrokenCount = %d, want 0", output.BrokenCount)
	}
}

func TestFormatLinkMarkdown(t *testing.T) {
	brokenLinks := []BrokenLink{
		{
			LineNumber: 5,
			SourceFile: "README.md",
			LinkText:   "./missing.md",
			TargetPath: "/path/to/missing.md",
			Category:   "General/other paths",
		},
	}

	byCategory := map[string][]BrokenLink{
		"General/other paths": {brokenLinks[0]},
	}

	result := &LinkValidationResult{
		TotalFiles:       5,
		TotalLinks:       20,
		BrokenLinks:      brokenLinks,
		BrokenByCategory: byCategory,
		ScanDuration:     30 * time.Millisecond,
	}

	output := FormatLinkMarkdown(result)

	// Markdown should be same as text format
	expectedStrings := []string{
		"# Broken Links Report",
		"**Total broken links**: 1",
		"## General/other paths (1 links)",
		"### README.md",
		"- Line 5: `./missing.md`",
	}

	for _, expected := range expectedStrings {
		if !strings.Contains(output, expected) {
			t.Errorf("Expected output to contain %q, but it didn't.\nOutput:\n%s", expected, output)
		}
	}
}
