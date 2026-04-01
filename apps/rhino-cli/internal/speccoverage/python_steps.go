package speccoverage

import (
	"bufio"
	"os"
	"regexp"
	"strings"
)

// pyStepRe matches @given("text"), @when("text"), @then("text"), @step("text")
// with optional parsers.parse() or parsers.cfparse() wrapping.
// Also handles multi-line patterns and trailing kwargs like target_fixture="...".
// Both double-quoted and single-quoted strings are supported.
// Uses (?s) flag for dotall mode to handle multi-line @given(\n    ...\n).
var pyStepRe = regexp.MustCompile(
	`(?s)@(?:given|when|then|step)\s*\(\s*(?:parsers\.(?:parse|cfparse)\s*\(\s*)?` +
		`(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')` +
		`\s*\)?\s*(?:,\s*[^)]*)?` +
		`\)`,
)

// pyScenarioRe matches @scenario("feature.feature", "Title")
var pyScenarioRe = regexp.MustCompile(`@scenario\s*\(\s*"[^"]*"\s*,\s*"((?:[^"\\]|\\.)*)"\s*\)`)

// extractPythonStepTexts reads a Python file and adds step texts to the stepMatcher.
// Reads entire file content (not line-by-line) to handle multi-line decorators.
// Uses addPythonStepToMatcher to handle parsers.parse format strings and Cucumber expressions.
func extractPythonStepTexts(path string, sm *stepMatcher) error {
	content, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	matches := pyStepRe.FindAllStringSubmatch(string(content), -1)
	for _, m := range matches {
		text := firstNonEmpty(m[1], m[2])
		// Python uses {{...}} for literal braces in parsers.parse format strings
		text = strings.ReplaceAll(text, "{{", "{")
		text = strings.ReplaceAll(text, "}}", "}")
		addPythonStepToMatcher(sm, text)
	}
	return nil
}

// extractPythonScenarioTitles extracts titles from @scenario decorators.
func extractPythonScenarioTitles(testFilePath string) (map[string]bool, error) {
	result := map[string]bool{}

	f, err := os.Open(testFilePath)
	if err != nil {
		return nil, err
	}
	defer func() { _ = f.Close() }()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Text()
		matches := pyScenarioRe.FindAllStringSubmatch(line, -1)
		for _, m := range matches {
			result[normalizeWS(m[1])] = true
		}
	}

	return result, scanner.Err()
}
