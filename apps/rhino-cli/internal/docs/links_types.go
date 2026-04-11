// Package docs provides markdown link scanning and validation for
// documentation files in this repository.
package docs

import "time"

// BrokenLink represents a single broken link found during validation.
type BrokenLink struct {
	LineNumber int    // Line number where the link appears
	SourceFile string // File containing the broken link (relative to repo root)
	LinkText   string // The actual link URL/path
	TargetPath string // The resolved target path that doesn't exist
	Category   string // Category of broken link (for reporting)
}

// LinkValidationResult contains the complete results of a link validation scan.
type LinkValidationResult struct {
	TotalFiles       int                     // Total number of files scanned
	TotalLinks       int                     // Total number of links checked
	BrokenLinks      []BrokenLink            // All broken links found
	BrokenByCategory map[string][]BrokenLink // Broken links grouped by category
	ScanDuration     time.Duration           // Time taken for the scan
}

// ScanOptions configures how the link validation scan should be performed.
type ScanOptions struct {
	RepoRoot   string   // Absolute path to repository root
	StagedOnly bool     // Only scan staged files from git
	SkipPaths  []string // Paths to skip during scanning
	Verbose    bool     // Enable verbose logging
	Quiet      bool     // Quiet mode (errors only)
}

// LinkInfo represents a link found in a markdown file.
type LinkInfo struct {
	LineNumber int    // Line number where the link appears
	URL        string // The link URL/path
	IsRelative bool   // Whether the link is relative or absolute
}
