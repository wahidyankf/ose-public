package links

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/wahidyankf/ose-public/libs/golang-commons/timeutil"
)

// jsonMarshalIndent is a package-level variable for dependency injection in tests.
var jsonMarshalIndent = json.MarshalIndent

// OutputLinksText prints a human-readable link check report to stdout.
// quiet suppresses all output; verbose appends a completion timestamp.
func OutputLinksText(result *CheckResult, elapsed time.Duration, quiet, verbose bool) {
	if quiet {
		return
	}

	fmt.Println()
	fmt.Println("Link Check Complete")
	fmt.Println("===================")
	fmt.Printf("Checked:  %d link(s)\n", result.CheckedCount)
	fmt.Printf("Broken:   %d link(s)\n", len(result.BrokenLinks))
	fmt.Printf("Errors:   %d\n", result.ErrorCount)
	fmt.Printf("Duration: %v\n", elapsed)

	if len(result.Errors) > 0 {
		fmt.Println()
		fmt.Println("Errors:")
		for _, e := range result.Errors {
			fmt.Printf("  - %s\n", e)
		}
	}

	if len(result.BrokenLinks) > 0 {
		fmt.Println()
		fmt.Println("Broken Links:")
		fmt.Printf("  %-60s %5s  %-30s  %s\n", "Source File", "Line", "Text", "Target")
		fmt.Printf("  %-60s %5s  %-30s  %s\n", "---", "---", "---", "---")
		for _, bl := range result.BrokenLinks {
			fmt.Printf("  %-60s %5d  %-30s  %s\n", bl.SourceFile, bl.Line, bl.Text, bl.Target)
		}
	}

	if verbose {
		fmt.Printf("\nCompleted at: %s\n", timeutil.JakartaTimestamp())
	}
}

// OutputLinksJSON prints the link check result as a JSON object to stdout.
func OutputLinksJSON(result *CheckResult, elapsed time.Duration) error {
	status := "success"
	if len(result.BrokenLinks) > 0 {
		status = "failure"
	}

	jsonOutput := map[string]any{
		"status":       status,
		"timestamp":    timeutil.JakartaTimestamp(),
		"duration_ms":  elapsed.Milliseconds(),
		"checked":      result.CheckedCount,
		"broken":       len(result.BrokenLinks),
		"errors":       result.Errors,
		"broken_links": result.BrokenLinks,
	}

	data, err := jsonMarshalIndent(jsonOutput, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}

	fmt.Println(string(data))
	return nil
}

// OutputLinksMarkdown prints the link check result as a Markdown report to stdout.
func OutputLinksMarkdown(result *CheckResult, elapsed time.Duration) {
	status := "PASS"
	if len(result.BrokenLinks) > 0 {
		status = "FAIL"
	}

	fmt.Println("# Link Check Report")
	fmt.Println()
	fmt.Printf("**Timestamp**: %s\n", timeutil.JakartaTimestamp())
	fmt.Printf("**Duration**: %v\n", elapsed)
	fmt.Printf("**Status**: %s\n", status)
	fmt.Println()
	fmt.Println("## Summary")
	fmt.Println()
	fmt.Printf("| Metric | Count |\n")
	fmt.Printf("| --- | --- |\n")
	fmt.Printf("| Checked | %d |\n", result.CheckedCount)
	fmt.Printf("| Broken | %d |\n", len(result.BrokenLinks))
	fmt.Printf("| Errors | %d |\n", result.ErrorCount)

	if len(result.Errors) > 0 {
		fmt.Println()
		fmt.Println("## Errors")
		fmt.Println()
		for _, e := range result.Errors {
			fmt.Printf("- %s\n", e)
		}
	}

	if len(result.BrokenLinks) > 0 {
		fmt.Println()
		fmt.Println("## Broken Links")
		fmt.Println()
		fmt.Printf("| Source File | Line | Text | Target |\n")
		fmt.Printf("| --- | --- | --- | --- |\n")
		for _, bl := range result.BrokenLinks {
			fmt.Printf("| %s | %d | %s | %s |\n", bl.SourceFile, bl.Line, bl.Text, bl.Target)
		}
	}
}
