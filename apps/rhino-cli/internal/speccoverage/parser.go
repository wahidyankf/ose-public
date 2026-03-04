package speccoverage

import (
	"bufio"
	"os"
	"strings"
)

// ParsedStep is a single step line from a Gherkin scenario.
type ParsedStep struct {
	Keyword string // Given/When/Then/And/But (Title case)
	Text    string // trimmed step text
}

// ParsedScenario is a Gherkin Scenario block with its steps.
type ParsedScenario struct {
	Title string
	Steps []ParsedStep
}

var stepKeywords = []string{"Given ", "When ", "Then ", "And ", "But "}

// ParseFeatureFile reads a .feature file and returns all scenarios and their steps.
// Lines not matching Scenario: or a step keyword are silently ignored.
func ParseFeatureFile(path string) ([]ParsedScenario, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer func() { _ = f.Close() }()

	var scenarios []ParsedScenario
	var current *ParsedScenario

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		if rest, ok := strings.CutPrefix(line, "Scenario:"); ok {
			title := strings.TrimSpace(rest)
			scenarios = append(scenarios, ParsedScenario{Title: title})
			current = &scenarios[len(scenarios)-1]
			continue
		}

		if current == nil {
			continue
		}

		for _, kw := range stepKeywords {
			if rest, ok := strings.CutPrefix(line, kw); ok {
				text := strings.TrimSpace(rest)
				current.Steps = append(current.Steps, ParsedStep{
					Keyword: strings.TrimSpace(kw),
					Text:    text,
				})
				break
			}
		}
	}

	return scenarios, scanner.Err()
}
