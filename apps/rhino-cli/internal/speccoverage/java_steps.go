package speccoverage

import (
	"bufio"
	"os"
	"regexp"
)

// jvmStepRe matches @Given("text"), @When("text"), @Then("text"), @And("text"), @But("text")
var jvmStepRe = regexp.MustCompile(`@(?:Given|When|Then|And|But)\s*\(\s*"((?:[^"\\]|\\.)*)"\s*\)`)

// extractJVMStepTexts reads a Java/Kotlin file and adds step texts to the stepMatcher.
// Uses addStepToMatcher to handle Cucumber expressions and regex patterns.
func extractJVMStepTexts(path string, sm *stepMatcher) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer func() { _ = f.Close() }()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Text()
		matches := jvmStepRe.FindAllStringSubmatch(line, -1)
		for _, m := range matches {
			addStepToMatcher(sm, m[1])
		}
	}
	return scanner.Err()
}
