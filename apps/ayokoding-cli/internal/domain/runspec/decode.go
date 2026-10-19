package runspec

import (
	"bytes"
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"go.yaml.in/yaml/v3"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// linePattern reads the line a YAML decoding error reports.
var linePattern = regexp.MustCompile(`^line ([0-9]+):`)

// Fixed scope and key names shared between the walker and the allowed table.
const (
	scopeRun  = "run"
	keyExpect = "expect"
)

// specYAML is the strict decoding target: every key is known, so an unknown
// key, a wrong type, or a duplicate key fails decoding before any rule runs.
type specYAML struct {
	Schema       string            `yaml:"schema"`
	Toolchain    string            `yaml:"toolchain"`
	Mode         string            `yaml:"mode"`
	Static       *staticYAML       `yaml:"static"`
	Services     []string          `yaml:"services"`
	Dependencies *dependenciesYAML `yaml:"dependencies"`
	Resources    *resourcesYAML    `yaml:"resources"`
	Runs         []runYAML         `yaml:"runs"`
}

// staticYAML holds the static-mode reason and note.
type staticYAML struct {
	Reason string `yaml:"reason"`
	Note   string `yaml:"note"`
}

// dependenciesYAML holds the course-relative lockfile.
type dependenciesYAML struct {
	Lockfile string `yaml:"lockfile"`
}

// resourcesYAML holds the memory and CPU limits.
type resourcesYAML struct {
	Memory string `yaml:"memory"`
	CPUs   *int   `yaml:"cpus"`
}

// runYAML is one raw run entry. Exit is a pointer so an absent exit reads
// differently from an explicit zero.
type runYAML struct {
	Name       string            `yaml:"name"`
	Kind       string            `yaml:"kind"`
	Command    []string          `yaml:"command"`
	Workdir    string            `yaml:"workdir"`
	Stdin      string            `yaml:"stdin"`
	Env        map[string]string `yaml:"env"`
	Timeout    string            `yaml:"timeout"`
	Simulation bool              `yaml:"simulation"`
	Expect     *expectYAML       `yaml:"expect"`
}

// expectYAML is one raw expectation.
type expectYAML struct {
	Exit      *int   `yaml:"exit"`
	Stdout    string `yaml:"stdout"`
	Stderr    string `yaml:"stderr"`
	Invariant string `yaml:"invariant"`
}

// allowedKeys names the known keys of every fixed mapping. The env mapping
// takes caller-chosen names, so it is checked for duplicates only.
var allowedKeys = map[string]map[string]bool{
	"": {
		"schema": true, "toolchain": true, "mode": true, "static": true,
		"services": true, "dependencies": true, "resources": true, "runs": true,
	},
	"static":       {"reason": true, "note": true},
	"resources":    {"memory": true, "cpus": true},
	"dependencies": {"lockfile": true},
	scopeRun: {
		"name": true, "kind": true, "command": true, "workdir": true,
		"stdin": true, "env": true, "timeout": true, "simulation": true, keyExpect: true,
	},
	keyExpect: {"exit": true, "stdout": true, "stderr": true, "invariant": true},
}

// checker carries one Parse call: the finding prefix, the catalog, and the
// findings so far.
type checker struct {
	course   string
	path     string
	catalog  catalog.Catalog
	findings []finding.Finding
}

// fail records one closed finding.
func (check *checker) failf(code string, line int, format string, args ...any) {
	check.findings = append(check.findings, finding.Finding{
		Code:    code,
		Course:  check.course,
		Path:    check.path,
		Line:    line,
		Message: fmt.Sprintf(format, args...),
	})
}

// decodeStrict runs the node walk for duplicates and unknown keys, then the
// KnownFields typed decode for wrong types. It returns the raw spec, the key
// line positions, and whether decoding succeeded.
func decodeStrict(check *checker, data []byte) (*specYAML, map[string]int, bool) {
	var doc yaml.Node
	if err := yaml.Unmarshal(data, &doc); err != nil {
		check.failf(finding.RunspecInvalidType, 1, "run spec does not parse: %v", err)
		return nil, nil, false
	}
	if len(doc.Content) == 0 || doc.Content[0].Kind != yaml.MappingNode {
		check.failf(finding.RunspecInvalidType, 1, "run spec must be a mapping")
		return nil, nil, false
	}
	positions := map[string]int{}
	walkMapping(check, doc.Content[0], "", "", positions)
	if len(check.findings) != 0 {
		return nil, nil, false
	}
	var raw specYAML
	decoder := yaml.NewDecoder(bytes.NewReader(data))
	decoder.KnownFields(true)
	if err := decoder.Decode(&raw); err != nil {
		for _, entry := range splitYAMLErrors(err) {
			code, line := classifyDecodeError(entry)
			check.failf(code, line, "run spec does not decode: %s", entry)
		}
		return nil, nil, false
	}
	return &raw, positions, true
}

// walkMapping records duplicate and unknown keys of one mapping and recurses
// into the fixed child mappings, tracking every key line by dotted path.
func walkMapping(check *checker, node *yaml.Node, scope, path string, positions map[string]int) {
	seen := map[string]int{}
	for i := 0; i+1 < len(node.Content); i += 2 {
		key, value := node.Content[i], node.Content[i+1]
		name := key.Value
		dotted := name
		if path != "" {
			dotted = path + "." + name
		}
		if first, dup := seen[name]; dup {
			check.failf(finding.RunspecDuplicateKey, key.Line,
				"duplicate key %q (first at line %d)", name, first)
			continue
		}
		seen[name] = key.Line
		if allowed := allowedKeys[scope]; allowed != nil && !allowed[name] {
			check.failf(finding.RunspecUnknownKey, key.Line, "unknown key %q", name)
			continue
		}
		positions[dotted] = key.Line
		walkChild(check, scope, name, value, dotted, positions)
	}
}

// walkChild recurses into the fixed child mappings of a known key.
func walkChild(check *checker, scope, name string, value *yaml.Node, dotted string, positions map[string]int) {
	switch scope + "/" + name {
	case "/static":
		if value.Kind == yaml.MappingNode {
			walkMapping(check, value, "static", dotted, positions)
		}
	case "/resources":
		if value.Kind == yaml.MappingNode {
			walkMapping(check, value, "resources", dotted, positions)
		}
	case "/dependencies":
		if value.Kind == yaml.MappingNode {
			walkMapping(check, value, "dependencies", dotted, positions)
		}
	case "/runs":
		if value.Kind == yaml.SequenceNode {
			for i, item := range value.Content {
				if item.Kind == yaml.MappingNode {
					positions[dotted+"."+strconv.Itoa(i)] = item.Line
					walkMapping(check, item, scopeRun, dotted+"."+strconv.Itoa(i), positions)
				}
			}
		}
	default:
		if scope == scopeRun && name == keyExpect && value.Kind == yaml.MappingNode {
			walkMapping(check, value, keyExpect, dotted, positions)
		}
		if scope == scopeRun && name == "env" && value.Kind == yaml.MappingNode {
			walkEnv(check, value, dotted, positions)
		}
	}
}

// walkEnv records duplicate variable names and every variable line. Names
// are caller-chosen, so no unknown-key rule applies.
func walkEnv(check *checker, node *yaml.Node, dotted string, positions map[string]int) {
	seen := map[string]int{}
	for i := 0; i+1 < len(node.Content); i += 2 {
		key := node.Content[i]
		if _, dup := seen[key.Value]; dup {
			check.failf(finding.RunspecDuplicateKey, key.Line,
				"duplicate key %q (first at line %d)", key.Value, seen[key.Value])
			continue
		}
		seen[key.Value] = key.Line
		positions[dotted+"."+key.Value] = key.Line
	}
}

// splitYAMLErrors flattens a decoding failure into one message per cause.
func splitYAMLErrors(err error) []string {
	if typeErr, ok := errors.AsType[*yaml.TypeError](err); ok {
		return typeErr.Errors
	}
	return []string{err.Error()}
}

// classifyDecodeError maps a KnownFields failure back onto the closed
// vocabulary: the walker already reported every duplicate and unknown key it
// could see, so this classifies only what the typed decode adds.
func classifyDecodeError(entry string) (string, int) {
	line := 1
	if match := linePattern.FindStringSubmatch(entry); match != nil {
		if parsed, convErr := strconv.Atoi(match[1]); convErr == nil {
			line = parsed
		}
	}
	switch {
	case strings.Contains(entry, "already defined"):
		return finding.RunspecDuplicateKey, line
	case strings.Contains(entry, "not found in type"):
		return finding.RunspecUnknownKey, line
	default:
		return finding.RunspecInvalidType, line
	}
}
