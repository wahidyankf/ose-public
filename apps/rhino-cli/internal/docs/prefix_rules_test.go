package docs

import (
	"testing"
)

func TestEncodeSubdirectory(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		// Single words - first 2 characters
		{"single word: software", "software", "so"},
		{"single word: python", "python", "py"},
		{"single word: formatting", "formatting", "fo"},
		{"single word: meta", "meta", "me"},
		{"single word: content", "content", "co"},
		{"single word: hugo", "hugo", "hu"},
		{"single word: infra", "infra", "in"},
		{"single word: pattern", "pattern", "pa"},
		{"single word: agents", "agents", "ag"},
		{"single word: quality", "quality", "qu"},

		// Hyphenated compounds - 2 chars from each word concatenated
		{"hyphenated: prog-lang", "prog-lang", "prla"},
		{"hyphenated: programming-languages", "programming-languages", "prla"},
		{"hyphenated: platform-web", "platform-web", "plwe"},
		{"hyphenated: how-to", "how-to", "hoto"},
		{"hyphenated: ayokoding-fs", "ayokoding-fs", "ayfs"},
		{"hyphenated: software-engineering", "software-engineering", "soen"},
		{"hyphenated: fe-nextjs", "fe-nextjs", "fene"},

		// Multi-word hyphenated (3+ parts) - first 2 chars of each word
		{"multi-word: finite-state-machine-fsm", "finite-state-machine-fsm", "fistmafs"},
		{"multi-word: domain-driven-design-ddd", "domain-driven-design-ddd", "dodrdedd"},
		{"multi-word: behavior-driven-development-bdd", "behavior-driven-development-bdd", "bedrdebd"},
		{"multi-word: c4-architecture-model", "c4-architecture-model", "c4armo"},
		{"multi-word: test-driven-development-tdd", "test-driven-development-tdd", "tedrdetd"},

		// Edge cases
		{"single char word", "a", "a"},
		{"two char word", "ab", "ab"},
		{"hyphenated with single char", "a-b", "ab"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := encodeSubdirectory(tt.input)
			if got != tt.expected {
				t.Errorf("encodeSubdirectory(%q) = %q, want %q", tt.input, got, tt.expected)
			}
		})
	}
}

func TestGenerateExpectedPrefix(t *testing.T) {
	tests := []struct {
		name     string
		path     string
		expected string
		exempt   bool
	}{
		// Root categories
		{"tutorials root", "docs/tutorials/foo.md", "tu__", false},
		{"how-to root", "docs/how-to/bar.md", "hoto__", false},
		{"reference root", "docs/reference/baz.md", "re__", false},
		{"explanation root", "docs/explanation/qux.md", "ex__", false},

		// Subdirectories
		{"explanation with one subdir", "docs/explanation/software-engineering/foo.md", "ex-soen__", false},
		{"explanation with two subdirs", "docs/explanation/software-engineering/programming-languages/foo.md", "ex-soen-prla__", false},
		{"explanation with three subdirs", "docs/explanation/software-engineering/programming-languages/python/foo.md", "ex-soen-prla-py__", false},

		// Multi-word hyphenated directories (full encoding)
		{"domain-driven-design-ddd", "docs/explanation/software-engineering/architecture/domain-driven-design-ddd/file.md", "ex-soen-ar-dodrdedd__", false},
		{"finite-state-machine-fsm", "docs/explanation/software-engineering/architecture/finite-state-machine-fsm/file.md", "ex-soen-ar-fistmafs__", false},
		{"test-driven-development-tdd", "docs/explanation/software-engineering/development/test-driven-development-tdd/file.md", "ex-soen-de-tedrdetd__", false},
		{"behavior-driven-development-bdd", "docs/explanation/software-engineering/development/behavior-driven-development-bdd/file.md", "ex-soen-de-bedrdebd__", false},

		// Exceptions
		{"README in tutorials", "docs/tutorials/README.md", "", true},
		{"README in how-to", "docs/how-to/README.md", "", true},
		{"README in subdirectory", "docs/explanation/software-engineering/README.md", "", true},
		{"metadata directory", "docs/metadata/cache.yaml", "", true},
		{"metadata subdirectory", "docs/metadata/validation/results.json", "", true},

		// Edge cases
		{"not in docs", "governance/foo.md", "", true},
		{"docs root file", "docs/foo.md", "", true},
		{"unknown root category", "docs/unknown/foo.md", "", true},
		// 3+ parts but first part is not "docs" — covers prefix_rules.go:33
		{"not in docs 3 parts", "governance/tutorials/file.md", "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotPrefix, gotExempt := GenerateExpectedPrefix(tt.path)
			if gotPrefix != tt.expected {
				t.Errorf("GenerateExpectedPrefix(%q) prefix = %q, want %q", tt.path, gotPrefix, tt.expected)
			}
			if gotExempt != tt.exempt {
				t.Errorf("GenerateExpectedPrefix(%q) exempt = %v, want %v", tt.path, gotExempt, tt.exempt)
			}
		})
	}
}

func TestIsException(t *testing.T) {
	tests := []struct {
		name     string
		path     string
		expected bool
	}{
		// README.md files
		{"README in tutorials", "docs/tutorials/README.md", true},
		{"README in how-to", "docs/how-to/README.md", true},
		{"README in subdirectory", "docs/explanation/software-engineering/README.md", true},
		{"README at docs root", "docs/README.md", true},

		// Metadata directory
		{"metadata yaml", "docs/metadata/cache.yaml", true},
		{"metadata json", "docs/metadata/results.json", true},
		{"metadata in subdirectory", "docs/metadata/validation/output.json", true},

		// Non-exceptions
		{"regular tutorial", "docs/tutorials/tu__foo.md", false},
		{"regular how-to", "docs/how-to/hoto__bar.md", false},
		{"regular reference", "docs/reference/re__baz.md", false},
		{"regular explanation", "docs/explanation/ex__qux.md", false},

		// Edge cases
		{"README-like name", "docs/tutorials/README-guide.md", false},
		{"readme lowercase", "docs/tutorials/readme.md", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := isException(tt.path)
			if got != tt.expected {
				t.Errorf("isException(%q) = %v, want %v", tt.path, got, tt.expected)
			}
		})
	}
}

func TestExtractPrefix(t *testing.T) {
	tests := []struct {
		name           string
		filename       string
		expectedPrefix string
		expectedID     string
	}{
		{"simple prefix", "tu__getting-started.md", "tu__", "getting-started"},
		{"complex prefix", "ex-soen-prla-py__basics.md", "ex-soen-prla-py__", "basics"},
		{"no prefix", "getting-started.md", "", "getting-started.md"},
		{"multiple underscores", "tu__my__file.md", "tu__", "my__file"},
		{"README", "README.md", "", "README.md"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotPrefix, gotID := ExtractPrefix(tt.filename)
			if gotPrefix != tt.expectedPrefix {
				t.Errorf("ExtractPrefix(%q) prefix = %q, want %q", tt.filename, gotPrefix, tt.expectedPrefix)
			}
			if gotID != tt.expectedID {
				t.Errorf("ExtractPrefix(%q) contentID = %q, want %q", tt.filename, gotID, tt.expectedID)
			}
		})
	}
}
