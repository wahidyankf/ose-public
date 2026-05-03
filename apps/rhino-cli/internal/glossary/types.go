package glossary

// Glossary is the parsed representation of a ubiquitous-language markdown file.
type Glossary struct {
	Path              string
	Frontmatter       map[string]string
	Terms             []Term
	ForbiddenSynonyms []Forbidden
	ParseErrors       []ParseError
}

// Term is a row in the Terms table.
type Term struct {
	Term            string
	Definition      string
	CodeIdentifiers []string
	UsedInFeatures  []string
	SourceLine      int
}

// Forbidden is an entry under the Forbidden synonyms section.
type Forbidden struct {
	Term       string
	Reason     string
	DeclaredBy string
	SourceLine int
}

// ParseError is a non-fatal parse problem.
type ParseError struct {
	Line    int
	Col     int
	Message string
}

// Finding is a validation result produced by ValidateAll.
type Finding struct {
	File     string
	Message  string
	Severity string
}

// ValidateOptions carries the inputs to ValidateAll.
type ValidateOptions struct {
	RepoRoot string
	App      string
	Severity string
}
