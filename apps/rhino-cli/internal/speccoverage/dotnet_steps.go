package speccoverage

import (
	"bufio"
	"os"
	"regexp"
	"strings"
)

// csVerbatimStepRe matches C# verbatim string attributes: [Given(@"text with ""escaped quotes""")]
// In verbatim strings, "" is the escape for literal ".
// Uses (?s) for dotall to handle multi-line [When(\n  @"...")] patterns.
var csVerbatimStepRe = regexp.MustCompile(`(?s)\[(?:Given|When|Then|And|But)\s*\(\s*@"((?:[^"]|"")*)"\s*\)\s*\]`)

// csRegularStepRe matches C# regular string attributes: [Given("text with \"escaped\"")]
// Uses (?s) for dotall to handle multi-line patterns.
var csRegularStepRe = regexp.MustCompile(`(?s)\[(?:Given|When|Then|And|But)\s*\(\s*"((?:[^"\\]|\\.)*)"\s*\)\s*\]`)

// fsStepRe matches F# TickSpec step definitions in both styles:
//   - Inline:  let [<Given>] “text“ () =
//   - Multiline: [<Given>]\n let “text“ () =
//
// The backtick-quoted method name IS the step regex pattern (TickSpec convention).
var fsStepRe = regexp.MustCompile("let\\s+(?:\\[<(?:Given|When|Then)>\\]\\s*)?``((?:[^`]|`[^`])*)``")

// extractCSharpStepTexts reads a C# file and adds step texts to the stepMatcher.
// Reads entire file content to handle multi-line attributes like [When(\n  @"...")].
// Handles both verbatim strings (@"...""...") and regular strings ("...\\"...").
// Uses addStepToMatcher to handle Cucumber expressions and regex patterns.
func extractCSharpStepTexts(path string, sm *stepMatcher) error {
	content, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	src := string(content)

	// Try verbatim strings first (more specific: @"...")
	verbatimMatches := csVerbatimStepRe.FindAllStringSubmatch(src, -1)
	for _, m := range verbatimMatches {
		// Unescape "" → " in verbatim strings
		text := strings.ReplaceAll(m[1], `""`, `"`)
		addStepToMatcher(sm, text)
	}

	// Also try regular strings (without @" prefix)
	regularMatches := csRegularStepRe.FindAllStringSubmatch(src, -1)
	for _, m := range regularMatches {
		// Skip if this match was already captured by the verbatim regex
		// (the regular regex could partially match verbatim content)
		addStepToMatcher(sm, m[1])
	}

	return nil
}

// extractFSharpStepTexts reads an F# file and adds step patterns from backtick-quoted methods.
// F# TickSpec uses the method name as a regex pattern, so all backtick-quoted text is compiled as regex.
func extractFSharpStepTexts(path string, sm *stepMatcher) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer func() { _ = f.Close() }()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Text()
		matches := fsStepRe.FindAllStringSubmatch(line, -1)
		for _, m := range matches {
			text := normalizeWS(m[1])
			re, err := regexp.Compile("^" + text + "$")
			if err == nil {
				sm.patterns = append(sm.patterns, re)
			}
		}
	}
	return scanner.Err()
}
