package java

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/wahidyankf/ose-public/libs/golang-commons/timeutil"
)

// FormatText formats the validation result as human-readable text.
// Each package is shown with a ✓ or ✗ prefix and its status.
func FormatText(result *ValidationResult, verbose, quiet bool) string {
	var out strings.Builder

	for _, pkg := range result.AllPackages {
		if pkg.Valid {
			_, _ = fmt.Fprintf(&out, "✓ %s\tpackage-info.java present, @%s found\n",
				pkg.PackageDir, result.Annotation)
		} else {
			switch pkg.ViolationType {
			case ViolationMissingPackageInfo:
				_, _ = fmt.Fprintf(&out, "✗ %s\tpackage-info.java missing\n", pkg.PackageDir)
			case ViolationMissingAnnotation:
				_, _ = fmt.Fprintf(&out, "✗ %s\tpackage-info.java present, @%s missing\n",
					pkg.PackageDir, result.Annotation)
			}
		}
	}

	numViolations := result.TotalPackages - result.ValidPackages
	if numViolations == 0 {
		if !quiet {
			_, _ = fmt.Fprintf(&out, "\n0 violations found.\n")
		}
	} else {
		_, _ = fmt.Fprintf(&out, "\n%d violation(s) found.\n", numViolations)
	}

	return out.String()
}

// jsonOutput is the JSON representation of the validation result.
type jsonOutput struct {
	Status        string          `json:"status"`
	Timestamp     string          `json:"timestamp"`
	TotalPackages int             `json:"total_packages"`
	ValidPackages int             `json:"valid_packages"`
	Annotation    string          `json:"annotation"`
	Violations    []jsonViolation `json:"violations"`
}

// jsonViolation is the JSON representation of a single violation.
type jsonViolation struct {
	PackageDir    string `json:"package_dir"`
	ViolationType string `json:"violation_type"`
}

// FormatJSON formats the validation result as JSON.
func FormatJSON(result *ValidationResult) (string, error) {
	numViolations := result.TotalPackages - result.ValidPackages
	status := "success"
	if numViolations > 0 {
		status = "failure"
	}

	violations := make([]jsonViolation, 0, numViolations)
	for _, pkg := range result.AllPackages {
		if !pkg.Valid {
			violations = append(violations, jsonViolation{
				PackageDir:    pkg.PackageDir,
				ViolationType: string(pkg.ViolationType),
			})
		}
	}

	out := jsonOutput{
		Status:        status,
		Timestamp:     timeutil.Timestamp(),
		TotalPackages: result.TotalPackages,
		ValidPackages: result.ValidPackages,
		Annotation:    result.Annotation,
		Violations:    violations,
	}

	bytes, err := json.MarshalIndent(out, "", "  ")
	if err != nil {
		return "", err
	}

	return string(bytes), nil
}

// FormatMarkdown formats the validation result as markdown.
func FormatMarkdown(result *ValidationResult) string {
	var out strings.Builder

	numViolations := result.TotalPackages - result.ValidPackages

	out.WriteString("# Java Null Safety Validation Report\n\n")
	_, _ = fmt.Fprintf(&out, "- **Annotation required**: `@%s`\n", result.Annotation)
	_, _ = fmt.Fprintf(&out, "- **Total packages**: %d\n", result.TotalPackages)
	_, _ = fmt.Fprintf(&out, "- **Valid packages**: %d\n", result.ValidPackages)
	_, _ = fmt.Fprintf(&out, "- **Violations**: %d\n\n", numViolations)

	if numViolations == 0 {
		out.WriteString("✓ All packages have the required annotation.\n")
		return out.String()
	}

	out.WriteString("## Violations\n\n")
	for _, pkg := range result.AllPackages {
		if pkg.Valid {
			continue
		}
		switch pkg.ViolationType {
		case ViolationMissingPackageInfo:
			_, _ = fmt.Fprintf(&out, "- `%s`: `package-info.java` missing\n", pkg.PackageDir)
		case ViolationMissingAnnotation:
			_, _ = fmt.Fprintf(&out, "- `%s`: `package-info.java` present, `@%s` missing\n",
				pkg.PackageDir, result.Annotation)
		}
	}

	return out.String()
}
