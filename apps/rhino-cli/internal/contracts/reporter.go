package contracts

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/wahidyankf/ose-public/libs/golang-commons/timeutil"
)

// FormatJavaCleanImportsText formats the Java import cleaning result as human-readable text.
// In quiet mode with no modifications, it returns an empty string.
// In verbose mode, modified file paths are listed individually.
func FormatJavaCleanImportsText(result *JavaCleanImportsResult, verbose, quiet bool) string {
	var out strings.Builder

	if result.ModifiedFiles == 0 {
		if quiet {
			return ""
		}
		out.WriteString("No imports needed cleaning.\n")
		return out.String()
	}

	_, _ = fmt.Fprintf(&out, "Cleaned imports in %d of %d Java files.\n",
		result.ModifiedFiles, result.TotalFiles)

	if verbose {
		for _, f := range result.Modified {
			_, _ = fmt.Fprintf(&out, "  ✓ %s\n", f)
		}
	}

	return out.String()
}

// javaCleanImportsJSON is the JSON representation of a Java import cleaning result.
type javaCleanImportsJSON struct {
	Status        string   `json:"status"`
	Timestamp     string   `json:"timestamp"`
	TotalFiles    int      `json:"total_files"`
	ModifiedFiles int      `json:"modified_files"`
	Modified      []string `json:"modified"`
}

// FormatJavaCleanImportsJSON formats the Java import cleaning result as JSON.
func FormatJavaCleanImportsJSON(result *JavaCleanImportsResult) (string, error) {
	modified := result.Modified
	if modified == nil {
		modified = []string{}
	}

	out := javaCleanImportsJSON{
		Status:        "success",
		Timestamp:     timeutil.Timestamp(),
		TotalFiles:    result.TotalFiles,
		ModifiedFiles: result.ModifiedFiles,
		Modified:      modified,
	}

	bytes, err := json.MarshalIndent(out, "", "  ")
	if err != nil {
		return "", fmt.Errorf("marshaling java clean imports result: %w", err)
	}

	return string(bytes), nil
}

// FormatJavaCleanImportsMarkdown formats the Java import cleaning result as markdown.
func FormatJavaCleanImportsMarkdown(result *JavaCleanImportsResult) string {
	var out strings.Builder

	out.WriteString("# Java Import Cleaning Report\n\n")
	_, _ = fmt.Fprintf(&out, "- **Total files**: %d\n", result.TotalFiles)
	_, _ = fmt.Fprintf(&out, "- **Modified files**: %d\n", result.ModifiedFiles)

	if result.ModifiedFiles == 0 {
		out.WriteString("\nNo files needed cleaning.\n")
		return out.String()
	}

	out.WriteString("\n## Modified Files\n\n")
	for _, f := range result.Modified {
		_, _ = fmt.Fprintf(&out, "- `%s`\n", f)
	}

	return out.String()
}

// FormatDartScaffoldText formats the Dart scaffold result as human-readable text.
// In quiet mode, it returns a brief "ok\n" on success.
// In verbose mode, model files are listed individually.
func FormatDartScaffoldText(result *DartScaffoldResult, verbose, quiet bool) string {
	var out strings.Builder

	if quiet {
		out.WriteString("ok\n")
		return out.String()
	}

	_, _ = fmt.Fprintf(&out, "Dart scaffold created: pubspec.yaml + barrel library (%d model files).\n",
		len(result.ModelFiles))

	if verbose {
		for _, f := range result.ModelFiles {
			_, _ = fmt.Fprintf(&out, "  ✓ %s\n", f)
		}
	}

	return out.String()
}

// dartScaffoldJSON is the JSON representation of a Dart scaffold result.
type dartScaffoldJSON struct {
	Status         string   `json:"status"`
	Timestamp      string   `json:"timestamp"`
	PubspecCreated bool     `json:"pubspec_created"`
	BarrelCreated  bool     `json:"barrel_created"`
	ModelFiles     []string `json:"model_files"`
}

// FormatDartScaffoldJSON formats the Dart scaffold result as JSON.
func FormatDartScaffoldJSON(result *DartScaffoldResult) (string, error) {
	modelFiles := result.ModelFiles
	if modelFiles == nil {
		modelFiles = []string{}
	}

	out := dartScaffoldJSON{
		Status:         "success",
		Timestamp:      timeutil.Timestamp(),
		PubspecCreated: result.PubspecCreated,
		BarrelCreated:  result.BarrelCreated,
		ModelFiles:     modelFiles,
	}

	bytes, err := json.MarshalIndent(out, "", "  ")
	if err != nil {
		return "", fmt.Errorf("marshaling dart scaffold result: %w", err)
	}

	return string(bytes), nil
}

// FormatDartScaffoldMarkdown formats the Dart scaffold result as markdown.
func FormatDartScaffoldMarkdown(result *DartScaffoldResult) string {
	var out strings.Builder

	out.WriteString("# Dart Contract Scaffold Report\n\n")

	pubspecStatus := "created"
	if !result.PubspecCreated {
		pubspecStatus = "not created"
	}
	barrelStatus := "created"
	if !result.BarrelCreated {
		barrelStatus = "not created"
	}

	_, _ = fmt.Fprintf(&out, "- **pubspec.yaml**: %s\n", pubspecStatus)
	_, _ = fmt.Fprintf(&out, "- **Barrel library**: %s\n", barrelStatus)
	_, _ = fmt.Fprintf(&out, "- **Model files**: %d\n", len(result.ModelFiles))

	if len(result.ModelFiles) == 0 {
		return out.String()
	}

	out.WriteString("\n## Model Files\n\n")
	for _, f := range result.ModelFiles {
		_, _ = fmt.Fprintf(&out, "- `%s`\n", f)
	}

	return out.String()
}
