package cmd

import (
	"fmt"
	"io/fs"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/mermaid"
)

var (
	validateMermaidStagedOnly  bool
	validateMermaidChangedOnly bool
	validateMermaidMaxLabelLen int
	validateMermaidMaxWidth    int
	validateMermaidMaxDepth    int
)

// docsValidateMermaidFn and readFileFn are declared in testable.go for dependency injection.

var validateMermaidCmd = &cobra.Command{
	Use:   "validate-mermaid",
	Short: "Validate Mermaid flowchart diagrams in markdown files",
	Long: `Scan markdown files and validate Mermaid flowchart diagrams for structural issues.

Three rules are enforced on flowchart and graph blocks:
  1. Node label length must not exceed --max-label-len (default 30)
  2. Max parallel nodes at one rank must not exceed --max-width (default 3)
     Exception: when BOTH span > max-width AND depth > max-depth, emits a
     warning instead of an error (both-exceeded path).
  3. Each mermaid code block must contain exactly one diagram

Non-flowchart Mermaid types (sequenceDiagram, classDiagram, gantt, etc.) are
silently ignored. This command is read-only — it never modifies any file.`,
	Example: `  # Validate all markdown files in default directories
  rhino-cli docs validate-mermaid

  # Validate specific files or directories
  rhino-cli docs validate-mermaid docs/ governance/

  # Only validate files staged in git (pre-commit use)
  rhino-cli docs validate-mermaid --staged-only

  # Only validate files changed since upstream (pre-push use)
  rhino-cli docs validate-mermaid --changed-only

  # Output as JSON
  rhino-cli docs validate-mermaid -o json

  # Set custom thresholds
  rhino-cli docs validate-mermaid --max-label-len 20 --max-width 4`,
	SilenceErrors: true,
	RunE:          runValidateMermaid,
}

func init() {
	docsCmd.AddCommand(validateMermaidCmd)
	validateMermaidCmd.Flags().BoolVar(&validateMermaidStagedOnly, "staged-only", false,
		"only validate staged files (pre-commit use)")
	validateMermaidCmd.Flags().BoolVar(&validateMermaidChangedOnly, "changed-only", false,
		"only validate files changed since upstream (pre-push use)")
	validateMermaidCmd.Flags().IntVar(&validateMermaidMaxLabelLen, "max-label-len", 30,
		"max characters in a node label (default 30 ~ Mermaid wrappingWidth:200px at 16px font)")
	validateMermaidCmd.Flags().IntVar(&validateMermaidMaxWidth, "max-width", 3,
		"max nodes at the same rank")
	validateMermaidCmd.Flags().IntVar(&validateMermaidMaxDepth, "max-depth", 5,
		"depth threshold for the both-exceeded warning: when span>max-width AND depth>max-depth, emit warning not error")
}

func runValidateMermaid(cmd *cobra.Command, args []string) error {
	repoRoot, err := findGitRoot()
	if err != nil {
		return fmt.Errorf("failed to find git repository root: %w", err)
	}

	// Resolve file list.
	var mdFiles []string
	switch {
	case validateMermaidStagedOnly:
		mdFiles, err = getMermaidStagedFilesFn(repoRoot)
		if err != nil {
			return fmt.Errorf("failed to get staged files: %w", err)
		}
	case validateMermaidChangedOnly:
		mdFiles, err = getMermaidChangedFilesFn(repoRoot)
		if err != nil {
			return fmt.Errorf("failed to get changed files: %w", err)
		}
	case len(args) > 0:
		mdFiles, err = collectMDFiles(repoRoot, args)
		if err != nil {
			return fmt.Errorf("failed to collect files: %w", err)
		}
	default:
		mdFiles, err = collectMDDefaultDirs(repoRoot)
		if err != nil {
			return fmt.Errorf("failed to collect default files: %w", err)
		}
	}

	// Extract and validate blocks.
	var allBlocks []mermaid.MermaidBlock
	fileSet := make(map[string]bool)
	for _, f := range mdFiles {
		content, readErr := readFileFn(f)
		if readErr != nil {
			continue
		}
		blocks := mermaid.ExtractBlocks(f, string(content))
		allBlocks = append(allBlocks, blocks...)
		if len(blocks) > 0 {
			fileSet[f] = true
		}
	}

	opts := mermaid.ValidateOptions{
		MaxLabelLen: validateMermaidMaxLabelLen,
		MaxWidth:    validateMermaidMaxWidth,
		MaxDepth:    validateMermaidMaxDepth,
	}
	result := docsValidateMermaidFn(allBlocks, opts)
	result.FilesScanned = len(fileSet)

	if err := writeFormatted(cmd, output, verbose, quiet, outputFuncs{
		text:     func(v, q bool) string { return mermaid.FormatText(result, v, q) },
		json:     func() (string, error) { return mermaid.FormatJSON(result) },
		markdown: func() string { return mermaid.FormatMarkdown(result) },
	}); err != nil {
		return err
	}

	if len(result.Violations) > 0 {
		return fmt.Errorf("found %d violation(s)", len(result.Violations))
	}
	return nil
}

// getMermaidStagedFiles returns *.md files staged in git.
func getMermaidStagedFiles(repoRoot string) ([]string, error) {
	out, err := exec.Command("git", "-C", repoRoot, "diff", "--cached", "--name-only", "--diff-filter=ACMR").Output()
	if err != nil {
		return nil, err
	}
	return filterMDPaths(repoRoot, strings.Split(strings.TrimSpace(string(out)), "\n")), nil
}

// getMermaidChangedFiles returns *.md files changed since upstream (@{u}..HEAD).
func getMermaidChangedFiles(repoRoot string) ([]string, error) {
	out, err := exec.Command("git", "-C", repoRoot, "diff", "--name-only", "@{u}..HEAD").Output()
	if err != nil {
		// No upstream: fall back to default scan.
		return collectMDDefaultDirs(repoRoot)
	}
	files := filterMDPaths(repoRoot, strings.Split(strings.TrimSpace(string(out)), "\n"))
	if len(files) == 0 {
		return collectMDDefaultDirs(repoRoot)
	}
	return files, nil
}

// filterMDPaths converts relative paths to absolute and keeps only *.md files.
func filterMDPaths(repoRoot string, relPaths []string) []string {
	var out []string
	for _, p := range relPaths {
		if p == "" {
			continue
		}
		if !strings.HasSuffix(p, ".md") {
			continue
		}
		abs := filepath.Join(repoRoot, p)
		out = append(out, abs)
	}
	return out
}

// collectMDFiles walks given paths (files or directories) and collects *.md files.
func collectMDFiles(repoRoot string, paths []string) ([]string, error) {
	var files []string
	for _, p := range paths {
		abs := p
		if !filepath.IsAbs(p) {
			abs = filepath.Join(repoRoot, p)
		}
		walked, err := walkMDFiles(abs)
		if err != nil {
			return nil, err
		}
		files = append(files, walked...)
	}
	return files, nil
}

// collectMDDefaultDirs scans docs/, governance/, .claude/, and root *.md files.
func collectMDDefaultDirs(repoRoot string) ([]string, error) {
	dirs := []string{
		filepath.Join(repoRoot, "docs"),
		filepath.Join(repoRoot, "governance"),
		filepath.Join(repoRoot, ".claude"),
	}
	var files []string
	for _, dir := range dirs {
		walked, err := walkMDFiles(dir)
		if err != nil {
			continue // dir may not exist
		}
		files = append(files, walked...)
	}
	// Root *.md files.
	rootMDs, err := filepath.Glob(filepath.Join(repoRoot, "*.md"))
	if err == nil {
		files = append(files, rootMDs...)
	}
	return files, nil
}

// skipDirs are directory names that are never scanned for Mermaid diagrams.
var skipDirs = map[string]bool{
	".next":        true, // Next.js build artifacts
	"node_modules": true, // npm dependencies
	".git":         true, // git internals
}

// walkMDFiles returns all *.md files under dir recursively, skipping build artifact dirs.
func walkMDFiles(dir string) ([]string, error) {
	var files []string
	err := filepath.WalkDir(dir, func(path string, d fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			// Skip unreadable entries rather than aborting the entire walk.
			return nil //nolint:nilerr
		}
		if d.IsDir() && skipDirs[d.Name()] {
			return filepath.SkipDir
		}
		if !d.IsDir() && strings.HasSuffix(path, ".md") {
			files = append(files, path)
		}
		return nil
	})
	return files, err
}
