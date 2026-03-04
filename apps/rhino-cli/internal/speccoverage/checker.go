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
	// Handles escape sequences inside quoted strings (e.g. \' inside single-quoted strings).
	stepDefRe = regexp.MustCompile(`(?:Given|When|Then|And|But)\s*\(\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')\s*,`)
)

// skipDirs are directories to skip when walking app source files.
var skipDirs = map[string]bool{
	"node_modules":     true,
	".next":            true,
	"build":            true,
	"dist":             true,
	"storybook-static": true,
	"coverage":         true,
	".git":             true,
}

// CheckAll walks SpecsDir for .feature files and checks each has a matching
// test file anywhere under AppDir. Returns gaps for unmatched specs.
// Also checks scenario-level and step-level coverage for matched specs.
func CheckAll(opts ScanOptions) (*CheckResult, error) {
	start := time.Now()

	specFiles, err := walkFeatureFiles(opts.SpecsDir)
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
				normalizedText := normalizeWS(step.Text)
				if !allStepTexts[normalizedText] {
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

// walkFeatureFiles returns all .feature files under dir recursively.
func walkFeatureFiles(dir string) ([]string, error) {
	var files []string

	if _, err := os.Stat(dir); os.IsNotExist(err) {
		return nil, nil
	}

	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
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

// findMatchingTestFile returns the path of the first file under appDir whose
// base name starts with stem+"." or equals stem exactly, or "" if none found.
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
		if strings.HasPrefix(base, stem+".") || base == stem {
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
// all scenario titles found in Scenario("...", ...) calls (whitespace-normalised).
func extractScenarioTitles(testFilePath string) (map[string]bool, error) {
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

// extractAllStepTexts walks ALL .ts/.tsx/.js/.jsx files under appDir
// (skipping build artifact directories) and returns all step strings found
// in Given/When/Then/And/But("...", ...) calls (whitespace-normalised).
func extractAllStepTexts(appDir string) (map[string]bool, error) {
	result := map[string]bool{}

	if _, err := os.Stat(appDir); os.IsNotExist(err) {
		return result, nil
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
		if ext != ".ts" && ext != ".tsx" && ext != ".js" && ext != ".jsx" {
			return nil
		}

		f, err := os.Open(path)
		if err != nil {
			return err
		}
		defer func() { _ = f.Close() }()

		scanner := bufio.NewScanner(f)
		for scanner.Scan() {
			line := scanner.Text()
			matches := stepDefRe.FindAllStringSubmatch(line, -1)
			for _, m := range matches {
				text := unescapeString(firstNonEmpty(m[1], m[2]))
				result[normalizeWS(text)] = true
			}
		}

		return scanner.Err()
	})

	return result, err
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
// Handles: \' \" \\ \n \t \r
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
