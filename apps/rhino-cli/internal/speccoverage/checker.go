package speccoverage

import (
	"bufio"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

var (
	// scenarioDefRe matches Scenario("title", or Scenario('title',
	// Handles escape sequences inside quoted strings (e.g. \' inside single-quoted strings).
	scenarioDefRe = regexp.MustCompile(`Scenario\s*\(\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')\s*,`)
	// stepDefRe matches Given/When/Then/And/But("text", or ('text',
	// Uses (?s) dotall for multi-line: Then(\n  "text",\n  fn)
	// Handles escape sequences inside quoted strings (e.g. \' inside single-quoted strings).
	stepDefRe = regexp.MustCompile(`(?s)(?:Given|When|Then|And|But)\s*\(\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')\s*,`)
	// goStepRe matches: sc.Step(`^step text here$`, fn)
	// Raw string cannot be used here because the pattern itself contains backtick characters.
	goStepRe = regexp.MustCompile("\\.Step\\(\\x60([^\\x60]+)\\x60") //nolint:staticcheck
	// goScenarioCommentRe matches: // Scenario: Title Here
	goScenarioCommentRe = regexp.MustCompile(`//\s*Scenario:\s*(.+?)\s*$`)
	// tsRegexStepRe matches Given(/^pattern$/, fn) or When(/^pattern$/, fn) in TS/JS.
	// Uses (?s) dotall for multi-line: When(\n  /^pattern$/,\n  fn)
	tsRegexStepRe = regexp.MustCompile(`(?s)(?:Given|When|Then|And|But)\s*\(\s*/\^?(.*?)\$?\s*/\s*,`)
)

// stepMatcher holds both exact step texts (from TS/JS) and regex patterns (from Go godog files).
type stepMatcher struct {
	exact    map[string]bool
	patterns []*regexp.Regexp
}

// matches returns true if the given step text matches either an exact entry or a compiled Go pattern.
func (sm *stepMatcher) matches(stepText string) bool {
	normalized := normalizeWS(stepText)
	if sm.exact[normalized] {
		return true
	}
	for _, re := range sm.patterns {
		if re.MatchString(normalized) {
			return true
		}
	}
	return false
}

// skipDirs are directories to skip when walking app source files.
var skipDirs = map[string]bool{
	"node_modules":        true,
	".next":               true,
	"build":               true,
	"dist":                true,
	"storybook-static":    true,
	"coverage":            true,
	".git":                true,
	"target":              true,
	"_build":              true,
	"deps":                true,
	"bin":                 true,
	"obj":                 true,
	"__pycache__":         true,
	".pytest_cache":       true,
	".venv":               true,
	"generated-contracts": true,
	"generated_contracts": true,
	".dart_tool":          true,
	".features-gen":       true,
}

// CheckAll walks SpecsDir for .feature files and validates coverage.
// In default mode: 1:1 file matching + scenario + step validation.
// In --shared-steps mode: step-only validation across ALL source files.
func CheckAll(opts ScanOptions) (*CheckResult, error) {
	if opts.SharedSteps {
		return checkSharedSteps(opts)
	}
	return checkOneToOne(opts)
}

// checkSharedSteps validates step-level coverage only (no file/scenario matching).
// Used for E2E projects where step files are shared across features.
func checkSharedSteps(opts ScanOptions) (*CheckResult, error) {
	start := time.Now()

	specFiles, err := walkFeatureFiles(opts.SpecsDir, opts.ExcludeDirs...)
	if err != nil {
		return nil, err
	}

	allStepTexts, err := extractAllStepTexts(opts.AppDir)
	if err != nil {
		return nil, err
	}

	var stepGaps []StepGap
	totalScenarios := 0
	totalSteps := 0

	for _, specFile := range specFiles {
		relSpec, err := filepath.Rel(opts.RepoRoot, specFile)
		if err != nil {
			relSpec = specFile
		}

		scenarios, err := ParseFeatureFile(specFile)
		if err != nil {
			return nil, err
		}

		for _, sc := range scenarios {
			totalScenarios++
			for _, step := range sc.Steps {
				totalSteps++
				if !allStepTexts.matches(step.Text) {
					stepGaps = append(stepGaps, StepGap{
						SpecFile:      relSpec,
						ScenarioTitle: sc.Title,
						StepKeyword:   step.Keyword,
						StepText:      step.Text,
					})
				}
			}
		}
	}

	return &CheckResult{
		TotalSpecs:     len(specFiles),
		TotalScenarios: totalScenarios,
		TotalSteps:     totalSteps,
		StepGaps:       stepGaps,
		Duration:       time.Since(start),
	}, nil
}

// checkOneToOne performs the original 1:1 file matching + scenario + step validation.
func checkOneToOne(opts ScanOptions) (*CheckResult, error) {
	start := time.Now()

	specFiles, err := walkFeatureFiles(opts.SpecsDir, opts.ExcludeDirs...)
	if err != nil {
		return nil, err
	}

	// Collect all step texts from all TS/JS files once before the loop.
	allStepTexts, err := extractAllStepTexts(opts.AppDir)
	if err != nil {
		return nil, err
	}

	var gaps []CoverageGap
	var scenarioGaps []ScenarioGap
	var stepGaps []StepGap
	totalScenarios := 0
	totalSteps := 0

	for _, specFile := range specFiles {
		stem := strings.TrimSuffix(filepath.Base(specFile), ".feature")

		testFilePath, err := findMatchingTestFile(opts.AppDir, stem)
		if err != nil {
			return nil, err
		}

		if testFilePath == "" {
			relPath, err := filepath.Rel(opts.RepoRoot, specFile)
			if err != nil {
				relPath = specFile
			}
			gaps = append(gaps, CoverageGap{
				SpecFile: relPath,
				Stem:     stem,
			})
			continue // skip scenario/step check — no test file to check against
		}

		relSpec, err := filepath.Rel(opts.RepoRoot, specFile)
		if err != nil {
			relSpec = specFile
		}

		scenarios, err := ParseFeatureFile(specFile)
		if err != nil {
			return nil, err
		}

		scenarioTitles, err := extractScenarioTitles(testFilePath)
		if err != nil {
			return nil, err
		}

		for _, sc := range scenarios {
			totalScenarios++
			normalizedTitle := normalizeWS(sc.Title)
			if !scenarioTitles[normalizedTitle] {
				scenarioGaps = append(scenarioGaps, ScenarioGap{
					SpecFile:      relSpec,
					ScenarioTitle: sc.Title,
				})
			}

			for _, step := range sc.Steps {
				totalSteps++
				if !allStepTexts.matches(step.Text) {
					stepGaps = append(stepGaps, StepGap{
						SpecFile:      relSpec,
						ScenarioTitle: sc.Title,
						StepKeyword:   step.Keyword,
						StepText:      step.Text,
					})
				}
			}
		}
	}

	return &CheckResult{
		TotalSpecs:     len(specFiles),
		TotalScenarios: totalScenarios,
		TotalSteps:     totalSteps,
		Gaps:           gaps,
		ScenarioGaps:   scenarioGaps,
		StepGaps:       stepGaps,
		Duration:       time.Since(start),
	}, nil
}

// normalizeWS collapses internal whitespace so matching is whitespace-insensitive.
func normalizeWS(s string) string {
	return strings.Join(strings.Fields(s), " ")
}

// walkFeatureFiles returns all .feature files under dir recursively,
// excluding directories whose names appear in excludeDirs.
func walkFeatureFiles(dir string, excludeDirs ...string) ([]string, error) {
	var files []string

	if _, err := os.Stat(dir); os.IsNotExist(err) {
		return nil, nil
	}

	excludeSet := make(map[string]bool, len(excludeDirs))
	for _, d := range excludeDirs {
		excludeSet[d] = true
	}

	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() && excludeSet[info.Name()] {
			return filepath.SkipDir
		}
		if !info.IsDir() && strings.HasSuffix(path, ".feature") {
			files = append(files, path)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return files, nil
}

// toPascalCase converts a kebab-case stem to PascalCase.
// e.g., "health-check" → "HealthCheck"
func toPascalCase(stem string) string {
	parts := strings.Split(stem, "-")
	var b strings.Builder
	for _, p := range parts {
		if p == "" {
			continue
		}
		b.WriteString(strings.ToUpper(p[:1]) + p[1:])
	}
	return b.String()
}

// matchesStem checks if a file's base name matches a feature file stem.
// Supports kebab-case, snake_case, PascalCase, and test_ prefix matching.
func matchesStem(base, stem string) bool {
	snake := strings.ReplaceAll(stem, "-", "_")
	pascal := toPascalCase(stem)
	testSnake := "test_" + snake

	for _, prefix := range []string{
		stem + ".", stem + "_",
		snake + ".", snake + "_",
		pascal,
		testSnake + ".", testSnake + "_",
	} {
		if strings.HasPrefix(base, prefix) {
			return true
		}
	}
	return base == stem || base == snake
}

// isTestFile checks if a file is a test file based on its path and extension.
func isTestFile(path string) bool {
	base := filepath.Base(path)
	ext := filepath.Ext(base)

	switch ext {
	case "":
		// Files with no extension are accepted (backward compat for exact stem match)
		return true
	case ".go":
		return strings.HasSuffix(base, "_test.go")
	case ".ts", ".tsx", ".js", ".jsx":
		return strings.Contains(base, ".test.") ||
			strings.Contains(base, ".spec.") ||
			strings.Contains(base, ".steps.") ||
			strings.Contains(base, ".integration.") ||
			strings.Contains(base, "_test.")
	case ".java", ".kt":
		return isInTestDir(path)
	case ".py":
		return strings.HasPrefix(base, "test_") ||
			strings.HasSuffix(base, "_test.py") ||
			isInTestDir(path)
	case ".exs":
		return strings.HasSuffix(base, "_test.exs") || strings.HasSuffix(base, "_steps.exs")
	case ".rs":
		return strings.HasSuffix(base, "_test.rs") || isInTestDir(path)
	case ".fs", ".cs":
		return isInTestDir(path) ||
			strings.HasSuffix(base, "Steps.cs") ||
			strings.HasSuffix(base, "Tests.cs") ||
			strings.HasSuffix(base, "Steps.fs") ||
			strings.HasSuffix(base, "Tests.fs")
	case ".clj":
		return strings.HasSuffix(base, "_test.clj") || strings.HasSuffix(base, "_steps.clj")
	case ".dart":
		return strings.HasSuffix(base, "_test.dart") || isInTestDir(path)
	}
	return false
}

// isInTestDir checks if a file is inside a test/ or tests/ or Tests/ directory.
func isInTestDir(path string) bool {
	parts := strings.Split(filepath.ToSlash(path), "/")
	for _, p := range parts {
		if p == "test" || p == "tests" || p == "Tests" {
			return true
		}
	}
	return false
}

// findMatchingTestFile returns the path of the first test file under appDir
// matching the feature file stem, or "" if none found.
func findMatchingTestFile(appDir, stem string) (string, error) {
	if _, err := os.Stat(appDir); os.IsNotExist(err) {
		return "", nil
	}

	var found string

	err := filepath.Walk(appDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			if skipDirs[info.Name()] {
				return filepath.SkipDir
			}
			return nil
		}

		base := filepath.Base(path)
		if matchesStem(base, stem) {
			if !isTestFile(path) {
				return nil
			}
			found = path
			return filepath.SkipAll
		}

		return nil
	})
	if err != nil {
		return "", err
	}

	return found, nil
}

// hasMatchingTestFile returns true if any file under appDir has a base name
// that starts with stem+"." or equals stem exactly.
// Kept for backward compat with existing tests.
func hasMatchingTestFile(appDir, stem string) (bool, error) {
	path, err := findMatchingTestFile(appDir, stem)
	return path != "", err
}

// extractScenarioTitles reads ONLY the matching test file and returns
// all scenario titles found, whitespace-normalised.
// Dispatches by file extension to the appropriate extractor.
func extractScenarioTitles(testFilePath string) (map[string]bool, error) {
	ext := filepath.Ext(testFilePath)
	switch ext {
	case ".go":
		return extractGoScenarioTitles(testFilePath)
	case ".java", ".kt", ".cs", ".rs":
		// Uses // Scenario: comment pattern (same as Go)
		return extractGoScenarioTitles(testFilePath)
	case ".py":
		return extractPythonScenarioTitles(testFilePath)
	case ".exs", ".fs", ".clj":
		// Auto-bind frameworks — skip scenario extraction
		return map[string]bool{}, nil
	case ".dart":
		// Use // Scenario: comment pattern
		return extractGoScenarioTitles(testFilePath)
	default:
		return extractTSScenarioTitles(testFilePath)
	}
}

// extractTSScenarioTitles reads a TS/JS test file and returns all scenario
// titles found in Scenario("...", ...) calls (whitespace-normalised).
func extractTSScenarioTitles(testFilePath string) (map[string]bool, error) {
	result := map[string]bool{}

	f, err := os.Open(testFilePath)
	if err != nil {
		return nil, err
	}
	defer func() { _ = f.Close() }()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Text()
		matches := scenarioDefRe.FindAllStringSubmatch(line, -1)
		for _, m := range matches {
			title := unescapeString(firstNonEmpty(m[1], m[2]))
			result[normalizeWS(title)] = true
		}
	}

	return result, scanner.Err()
}

// extractGoScenarioTitles reads a Go test file and returns all scenario titles
// found in // Scenario: ... comments (whitespace-normalised).
func extractGoScenarioTitles(testFilePath string) (map[string]bool, error) {
	result := map[string]bool{}

	f, err := os.Open(testFilePath)
	if err != nil {
		return nil, err
	}
	defer func() { _ = f.Close() }()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Text()
		m := goScenarioCommentRe.FindStringSubmatch(line)
		if m != nil {
			result[normalizeWS(m[1])] = true
		}
	}

	return result, scanner.Err()
}

// extractAllStepTexts walks ALL .ts/.tsx/.js/.jsx/.go files under appDir
// (skipping build artifact directories) and returns a stepMatcher holding:
//   - exact step texts from TS/JS Given/When/Then/And/But("...", ...) calls
//   - compiled regex patterns from Go godog sc.Step(`...`, fn) calls
func extractAllStepTexts(appDir string) (*stepMatcher, error) {
	sm := &stepMatcher{exact: map[string]bool{}}

	if _, err := os.Stat(appDir); os.IsNotExist(err) {
		return sm, nil
	}

	err := filepath.Walk(appDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			if skipDirs[info.Name()] {
				return filepath.SkipDir
			}
			return nil
		}

		ext := filepath.Ext(path)
		switch ext {
		case ".ts", ".tsx", ".js", ".jsx":
			return extractTSStepTexts(path, sm)
		case ".go":
			return extractGoStepTexts(path, sm)
		case ".java", ".kt":
			return extractJVMStepTexts(path, sm)
		case ".py":
			return extractPythonStepTexts(path, sm)
		case ".ex", ".exs":
			return extractElixirStepTexts(path, sm)
		case ".rs":
			return extractRustStepTexts(path, sm)
		case ".cs":
			return extractCSharpStepTexts(path, sm)
		case ".fs":
			return extractFSharpStepTexts(path, sm)
		case ".clj":
			return extractClojureStepTexts(path, sm)
		case ".dart":
			return extractDartStepTexts(path, sm)
		}
		return nil
	})

	return sm, err
}

// extractTSStepTexts reads a TS/JS file and adds all step texts found in
// Given/When/Then/And/But("...", ...) calls and regex literals Given(/^pattern$/, ...) into the matcher.
// Reads entire file content to handle multi-line step definitions like Then(\n  "text",\n  fn).
func extractTSStepTexts(path string, sm *stepMatcher) error {
	content, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	src := string(content)

	// String-style step definitions: Given("text", ...)
	matches := stepDefRe.FindAllStringSubmatch(src, -1)
	for _, m := range matches {
		text := unescapeString(firstNonEmpty(m[1], m[2]))
		addStepToMatcher(sm, text)
	}

	// Regex-literal step definitions: Given(/^pattern$/, ...)
	regexMatches := tsRegexStepRe.FindAllStringSubmatch(src, -1)
	for _, m := range regexMatches {
		pattern := m[1]
		re, err := regexp.Compile(pattern)
		if err != nil {
			continue
		}
		sm.patterns = append(sm.patterns, re)
	}

	return nil
}

// extractGoStepTexts reads a Go file and adds compiled regex patterns found in
// sc.Step(`...`, fn) calls into sm.patterns. Invalid regex patterns are skipped.
func extractGoStepTexts(path string, sm *stepMatcher) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer func() { _ = f.Close() }()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Text()
		matches := goStepRe.FindAllStringSubmatch(line, -1)
		for _, m := range matches {
			pattern := m[1]
			re, err := regexp.Compile(pattern)
			if err != nil {
				// Skip invalid patterns gracefully.
				continue
			}
			sm.patterns = append(sm.patterns, re)
		}
	}
	return scanner.Err()
}

// firstNonEmpty returns the first non-empty string from the arguments.
func firstNonEmpty(a, b string) string {
	if a != "" {
		return a
	}
	return b
}

// unescapeString processes common JavaScript/TypeScript string escape sequences
// so that extracted step texts match the runtime string values in feature files.
// Handles: \' \" \\ \/ \n \t \r
func unescapeString(s string) string {
	var buf strings.Builder
	buf.Grow(len(s))
	i := 0
	for i < len(s) {
		if s[i] == '\\' && i+1 < len(s) {
			switch s[i+1] {
			case '\'':
				buf.WriteByte('\'')
			case '"':
				buf.WriteByte('"')
			case '\\':
				buf.WriteByte('\\')
			case 'n':
				buf.WriteByte('\n')
			case 't':
				buf.WriteByte('\t')
			case 'r':
				buf.WriteByte('\r')
			case '/':
				buf.WriteByte('/')
			default:
				buf.WriteByte(s[i])
				buf.WriteByte(s[i+1])
			}
			i += 2
		} else {
			buf.WriteByte(s[i])
			i++
		}
	}
	return buf.String()
}
