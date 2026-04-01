package speccoverage

import (
	"bufio"
	"os"
	"regexp"
)

// dartStepRe matches s.given("text", ...), s.when("text", ...), s.then("text", ...)
// Both double-quoted and single-quoted strings are supported.
var dartStepRe = regexp.MustCompile(
	`s\.(?:given|when|then)\s*\(\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')\s*,`,
)

// extractDartStepTexts reads a Dart file and adds step texts to the stepMatcher.
// Uses addStepToMatcher to handle Cucumber expressions and regex patterns.
func extractDartStepTexts(path string, sm *stepMatcher) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer func() { _ = f.Close() }()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Text()
		matches := dartStepRe.FindAllStringSubmatch(line, -1)
		for _, m := range matches {
			text := firstNonEmpty(m[1], m[2])
			addStepToMatcher(sm, text)
		}
	}
	return scanner.Err()
}
