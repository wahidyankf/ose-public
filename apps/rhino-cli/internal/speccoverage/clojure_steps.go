package speccoverage

import (
	"bufio"
	"os"
	"regexp"
)

// cljStepRe matches (Given "text" ...), (When "text" ...), (Then "text" ...)
var cljStepRe = regexp.MustCompile(`\((?:Given|When|Then|And|But)\s+"((?:[^"\\]|\\.)*)"`)

// extractClojureStepTexts reads a Clojure file and adds step texts to the stepMatcher.
// Uses addStepToMatcher to handle Cucumber expressions and regex patterns.
func extractClojureStepTexts(path string, sm *stepMatcher) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer func() { _ = f.Close() }()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Text()
		matches := cljStepRe.FindAllStringSubmatch(line, -1)
		for _, m := range matches {
			addStepToMatcher(sm, m[1])
		}
	}
	return scanner.Err()
}
