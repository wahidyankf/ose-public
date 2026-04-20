// Package testcoverage provides test coverage measurement using a standard line-based algorithm.
package testcoverage

// Format represents the coverage file format.
type Format string

const (
	// FormatGo represents Go cover.out format.
	FormatGo Format = "go"
	// FormatLCOV represents LCOV format.
	FormatLCOV Format = "lcov"
	// FormatJaCoCo represents JaCoCo XML format.
	FormatJaCoCo Format = "jacoco"
	// FormatCobertura represents Cobertura XML format.
	FormatCobertura Format = "cobertura"
	// FormatDiff represents diff coverage (computed, not a file format).
	FormatDiff Format = "diff"
)

// FileResult holds coverage statistics for a single source file.
type FileResult struct {
	Path    string  `json:"path"`
	Covered int     `json:"covered"`
	Partial int     `json:"partial"`
	Missed  int     `json:"missed"`
	Total   int     `json:"total"`
	Pct     float64 `json:"pct"`
}

// Result holds the computed coverage statistics for a single coverage file.
type Result struct {
	File      string
	Format    Format
	Covered   int
	Partial   int
	Missed    int
	Total     int
	Pct       float64
	Threshold float64
	Passed    bool
	Files     []FileResult `json:"files,omitempty"`
}
