package integration_test

import (
	"os"
	"strings"
	"testing"
)

// TestDocumentsNameDefaultCorpusAndFixtureSwitch pins the operator-facing
// documents: each names the fixture switch and states that the default start
// serves the real corpus. It reads real files, so it lives with the integration
// suite, which the forbidigo unit-scope ban exempts.
func TestDocumentsNameDefaultCorpusAndFixtureSwitch(t *testing.T) {
	for _, doc := range []string{"../../README.md", "../../.env.example"} {
		raw, err := os.ReadFile(doc)
		if err != nil {
			t.Fatalf("read %s: %v", doc, err)
		}
		text := string(raw)
		if !strings.Contains(text, "AYOKODING_WEB_FIXTURE") {
			t.Errorf("%s does not name AYOKODING_WEB_FIXTURE", doc)
		}
		if !strings.Contains(strings.ToLower(text), "real corpus") {
			t.Errorf("%s does not name the default real corpus", doc)
		}
	}
}
