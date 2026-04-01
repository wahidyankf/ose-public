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
// Background steps are collected and included as a synthetic "(Background)" scenario
// so that spec-coverage validates Background step definitions too.
func ParseFeatureFile(path string) ([]ParsedScenario, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer func() { _ = f.Close() }()

	var scenarios []ParsedScenario
	var current *ParsedScenario
	var bgSteps []ParsedStep
	inBackground := false

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		if strings.HasPrefix(line, "Background:") {
			inBackground = true
			current = nil
			continue
		}

		if rest, ok := strings.CutPrefix(line, "Scenario:"); ok {
			inBackground = false
			title := strings.TrimSpace(rest)
			scenarios = append(scenarios, ParsedScenario{Title: title})
			current = &scenarios[len(scenarios)-1]
			continue
		}

		for _, kw := range stepKeywords {
			if rest, ok := strings.CutPrefix(line, kw); ok {
				text := strings.TrimSpace(rest)
				step := ParsedStep{
					Keyword: strings.TrimSpace(kw),
					Text:    text,
				}
				if inBackground {
					bgSteps = append(bgSteps, step)
				} else if current != nil {
					current.Steps = append(current.Steps, step)
				}
				break
			}
		}
	}

	// Prepend Background steps as a synthetic scenario so they get validated
	if len(bgSteps) > 0 {
		bg := ParsedScenario{Title: "(Background)", Steps: bgSteps}
		scenarios = append([]ParsedScenario{bg}, scenarios...)
	}

	return scenarios, scanner.Err()
}
