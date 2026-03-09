package doctor

import (
	"path/filepath"
	"strings"
)

// toolDef describes how to check a single tool: what to run, how to parse the output,
// how to compare versions, and where to read the required version from.
type toolDef struct {
	name      string
	binary    string
	source    string
	args      []string
	useStderr bool // true when the version info is on stderr (e.g. java -version)
	parseVer  func(output string) string
	compare   func(installed, required string) (ToolStatus, string)
	readReq   func() string // returns "" when there is no requirement
}

// parseTrimVersion normalizes output where the version string is the whole output
// (e.g. volta --version → "2.0.2\n", node --version → "v24.11.1\n").
func parseTrimVersion(s string) string {
	return normalizeSimpleVersion(strings.TrimSpace(s))
}

// buildToolDefs returns the ordered list of tools to check for the given repo root.
// To add a new tool, add a new entry to the slice below — no other file needs to change.
func buildToolDefs(repoRoot string) []toolDef {
	packageJSONPath := filepath.Join(repoRoot, "package.json")
	pomXMLPath := filepath.Join(repoRoot, "apps", "organiclever-be-jasb", "pom.xml")
	goModPath := filepath.Join(repoRoot, "apps", "rhino-cli", "go.mod")

	noReq := func() string { return "" }

	return []toolDef{
		{
			name:     "git",
			binary:   "git",
			source:   "(no config file)",
			args:     []string{"--version"},
			parseVer: func(s string) string { return parseLineWord(s, "git version ", 2, "") },
			compare:  compareExact,
			readReq:  noReq,
		},
		{
			name:     "volta",
			binary:   "volta",
			source:   "(no config file)",
			args:     []string{"--version"},
			parseVer: parseTrimVersion,
			compare:  compareExact,
			readReq:  noReq,
		},
		{
			name:     "node",
			binary:   "node",
			source:   "package.json → volta.node",
			args:     []string{"--version"},
			parseVer: parseTrimVersion,
			compare:  compareExact,
			readReq:  func() string { v, _ := readNodeVersion(packageJSONPath); return v },
		},
		{
			name:     "npm",
			binary:   "npm",
			source:   "package.json → volta.npm",
			args:     []string{"--version"},
			parseVer: parseTrimVersion,
			compare:  compareExact,
			readReq:  func() string { v, _ := readNpmVersion(packageJSONPath); return v },
		},
		{
			name:      "java",
			binary:    "java",
			source:    "apps/organiclever-be-jasb/pom.xml → <java.version>",
			args:      []string{"-version"},
			useStderr: true, // java -version writes to stderr, not stdout
			parseVer:  parseJavaVersion,
			compare:   compareMajor,
			readReq:   func() string { v, _ := readJavaVersion(pomXMLPath); return v },
		},
		{
			name:     "maven",
			binary:   "mvn",
			source:   "(no config file)",
			args:     []string{"--version"},
			parseVer: func(s string) string { return parseLineWord(s, "Apache Maven ", 2, "") },
			compare:  compareExact,
			readReq:  noReq,
		},
		{
			name:     "golang",
			binary:   "go",
			source:   "apps/rhino-cli/go.mod → go directive",
			args:     []string{"version"},
			parseVer: func(s string) string { return parseLineWord(s, "go version ", 2, "go") },
			compare:  compareGTE,
			readReq:  func() string { v, _ := readGoVersion(goModPath); return v },
		},
	}
}
