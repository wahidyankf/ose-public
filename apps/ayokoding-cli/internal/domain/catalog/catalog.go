// Package catalog decodes the toolchain catalog, refuses unpinned images,
// and derives content-hash tags for derived images.
package catalog

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io/fs"
	"regexp"
	"strconv"
	"strings"
	"time"

	"go.yaml.in/yaml/v3"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// Catalog schema, digest shape, and the readiness bound.
const (
	catalogSchemaV1 = "ayokoding.toolchains/v1"

	maxReadyTimeout = 120 * time.Second

	defaultReadyTimeout = "60s"
)

// digestPattern requires a repository tag pinned by a full SHA-256.
var digestPattern = regexp.MustCompile(`^.+@sha256:[0-9a-f]{64}$`)

// platformPattern requires a container platform pair such as linux/amd64.
var platformPattern = regexp.MustCompile(`^[a-z0-9]+/[a-z0-9]+$`)

// linePattern reads the line a YAML decoding error reports.
var linePattern = regexp.MustCompile(`^line ([0-9]+):`)

// Kind is one toolchain kind.
type Kind string

// Toolchain kinds in the closed vocabulary.
const (
	KindLanguage  Kind = "language"
	KindValidator Kind = "validator"
	KindService   Kind = "service"
)

// Install is one dependency-install recipe.
type Install struct {
	Lockfiles []string
	Command   []string
	Env       map[string]string
}

// Toolchain is one checked catalog entry.
type Toolchain struct {
	ID           string
	Kind         Kind
	Version      string
	Image        string
	Env          map[string]string
	Install      Install
	Build        string
	Platform     string
	Ready        []string
	ReadyTimeout string
	Connect      map[string]string
}

// Catalog is the checked toolchain catalog.
type Catalog struct {
	Toolchains []Toolchain
}

// catalogYAML is the strict decoding target for the catalog file.
type catalogYAML struct {
	Schema     string          `yaml:"schema"`
	Toolchains []toolchainYAML `yaml:"toolchains"`
}

// toolchainYAML is one raw catalog entry.
type toolchainYAML struct {
	ID           string            `yaml:"id"`
	Kind         string            `yaml:"kind"`
	Version      string            `yaml:"version"`
	Image        string            `yaml:"image"`
	Env          map[string]string `yaml:"env"`
	Install      installYAML       `yaml:"install"`
	Build        string            `yaml:"build"`
	Platform     string            `yaml:"platform"`
	Ready        []string          `yaml:"ready"`
	ReadyTimeout string            `yaml:"readyTimeout"`
	Connect      map[string]string `yaml:"connect"`
}

// installYAML is one raw install recipe.
type installYAML struct {
	Lockfiles []string          `yaml:"lockfiles"`
	Command   []string          `yaml:"command"`
	Env       map[string]string `yaml:"env"`
}

// allowedKeys names the known keys of every fixed catalog mapping.
var allowedKeys = map[string]map[string]bool{
	"": {
		"schema": true, "toolchains": true,
	},
	"entry": {
		"id": true, "kind": true, "version": true, "image": true, "env": true,
		"install": true, "build": true, "platform": true, "ready": true, "readyTimeout": true, "connect": true,
	},
	"install": {"lockfiles": true, "command": true, "env": true},
}

// checker carries one Decode call.
type checker struct {
	findings []finding.Finding
}

// fail records one closed catalog finding.
func (check *checker) failf(code string, line int, format string, args ...any) {
	check.findings = append(check.findings, finding.Finding{
		Code:    code,
		Course:  "",
		Path:    "catalog.yaml",
		Line:    line,
		Message: fmt.Sprintf(format, args...),
	})
}

// Decode checks catalog bytes and returns the catalog or findings.
func Decode(data []byte) (Catalog, []finding.Finding) {
	check := &checker{}
	raw, positions, ok := decodeStrict(check, data)
	if !ok {
		return Catalog{}, check.findings
	}
	got, valid := check.check(raw, positions)
	if !valid {
		return Catalog{}, check.findings
	}
	return got, nil
}

// Load reads catalog.yaml from the filesystem and refuses an invalid catalog
// with a closed error carrying the first finding code.
func Load(fsys fs.FS) (Catalog, error) {
	data, err := fs.ReadFile(fsys, "catalog.yaml")
	if err != nil {
		return Catalog{}, fmt.Errorf("catalog: read catalog.yaml: %w", err)
	}
	return Validated(data)
}

// Validated decodes catalog bytes and refuses findings with a closed error
// carrying the first finding code.
func Validated(data []byte) (Catalog, error) {
	got, findings := Decode(data)
	if len(findings) != 0 {
		first := findings[0]
		message := first.Message
		if len(findings) > 1 {
			message += fmt.Sprintf(" (%d findings)", len(findings))
		}
		return Catalog{}, &finding.Error{Code: first.Code, Message: message}
	}
	return got, nil
}

// Lookup returns the toolchain with the id.
func (check Catalog) Lookup(toolID string) (Toolchain, bool) {
	for _, toolchain := range check.Toolchains {
		if toolchain.ID == toolID {
			return toolchain, true
		}
	}
	var missing Toolchain
	return missing, false
}

// DerivedTag tags a derived image from its recipe: the base digest, the
// Dockerfile bytes, and the build arguments.
func DerivedTag(toolID, baseDigest string, dockerfile []byte, args []string) string {
	sum := sha256.New()
	_, _ = sum.Write([]byte(baseDigest))
	_, _ = sum.Write([]byte{0})
	_, _ = sum.Write(dockerfile)
	for _, arg := range args {
		_, _ = sum.Write([]byte{0})
		_, _ = sum.Write([]byte(arg))
	}
	return "ayokoding-toolchain/" + toolID + ":" + hex.EncodeToString(sum.Sum(nil))
}

// Hash identifies the exact catalog bytes a binary was tested with.
func Hash(data []byte) string {
	sum := sha256.Sum256(data)
	return hex.EncodeToString(sum[:])
}

// decodeStrict runs the node walk for duplicates and unknown keys, then the
// KnownFields typed decode for wrong types.
func decodeStrict(check *checker, data []byte) (*catalogYAML, map[string]int, bool) {
	var doc yaml.Node
	if err := yaml.Unmarshal(data, &doc); err != nil {
		check.failf(finding.CatalogInvalidType, 1, "catalog does not parse: %v", err)
		return nil, nil, false
	}
	if len(doc.Content) == 0 || doc.Content[0].Kind != yaml.MappingNode {
		check.failf(finding.CatalogInvalidType, 1, "catalog must be a mapping")
		return nil, nil, false
	}
	positions := map[string]int{}
	walkMapping(check, doc.Content[0], "", "", positions)
	if len(check.findings) != 0 {
		return nil, nil, false
	}
	var raw catalogYAML
	decoder := yaml.NewDecoder(bytes.NewReader(data))
	decoder.KnownFields(true)
	if err := decoder.Decode(&raw); err != nil {
		if typeErr, ok := errors.AsType[*yaml.TypeError](err); ok {
			for _, entry := range typeErr.Errors {
				code, line := classifyDecodeError(entry)
				check.failf(code, line, "catalog does not decode: %s", entry)
			}
		} else {
			check.failf(finding.CatalogInvalidType, 1, "catalog does not decode: %v", err)
		}
		return nil, nil, false
	}
	return &raw, positions, true
}

// walkMapping records duplicate and unknown keys of one mapping and recurses
// into entries, tracking every key line by dotted path.
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
			check.failf(finding.CatalogDuplicateKey, key.Line,
				"duplicate key %q (first at line %d)", name, first)
			continue
		}
		seen[name] = key.Line
		if allowed := allowedKeys[scope]; allowed != nil && !allowed[name] {
			check.failf(finding.CatalogUnknownKey, key.Line, "unknown key %q", name)
			continue
		}
		positions[dotted] = key.Line
		switch scope + "/" + name {
		case "/toolchains":
			if value.Kind == yaml.SequenceNode {
				for i, item := range value.Content {
					if item.Kind == yaml.MappingNode {
						positions["toolchains."+strconv.Itoa(i)] = item.Line
						walkMapping(check, item, "entry", "toolchains."+strconv.Itoa(i), positions)
					}
				}
			}
		case "entry/install":
			if value.Kind == yaml.MappingNode {
				walkMapping(check, value, "install", dotted, positions)
			}
		}
	}
}

// classifyDecodeError maps a KnownFields failure back onto the closed
// vocabulary.
func classifyDecodeError(entry string) (string, int) {
	line := 1
	if match := linePattern.FindStringSubmatch(entry); match != nil {
		if parsed, convErr := strconv.Atoi(match[1]); convErr == nil {
			line = parsed
		}
	}
	switch {
	case strings.Contains(entry, "already defined"):
		return finding.CatalogDuplicateKey, line
	case strings.Contains(entry, "not found in type"):
		return finding.CatalogUnknownKey, line
	default:
		return finding.CatalogInvalidType, line
	}
}

// lineAt returns the first known key line, defaulting to the catalog start.
func lineAt(positions map[string]int, paths ...string) int {
	for _, path := range paths {
		if line, ok := positions[path]; ok && line > 0 {
			return line
		}
	}
	return 1
}

// check runs the entry rules in order and builds the Catalog.
func (check *checker) check(raw *catalogYAML, positions map[string]int) (Catalog, bool) {
	switch {
	case raw.Schema == "":
		check.failf(finding.CatalogMissingSchema, 1, "schema is required")
	case raw.Schema != catalogSchemaV1:
		check.failf(finding.CatalogInvalidSchema, lineAt(positions, "schema"),
			"schema %q must be %q", raw.Schema, catalogSchemaV1)
	}
	seen := map[string]bool{}
	toolchains := make([]Toolchain, 0, len(raw.Toolchains))
	for i := range raw.Toolchains {
		toolchains = append(toolchains, check.checkEntry(&raw.Toolchains[i], positions, i, seen))
	}
	if len(check.findings) != 0 {
		return Catalog{}, false
	}
	return Catalog{Toolchains: toolchains}, true
}

// checkEntry checks one catalog entry.
func (check *checker) checkEntry(raw *toolchainYAML, positions map[string]int, index int, seen map[string]bool) Toolchain {
	prefix := "toolchains." + strconv.Itoa(index)
	var entry Toolchain
	switch {
	case raw.ID == "":
		check.failf(finding.CatalogMissingID, lineAt(positions, prefix+".id", prefix, "toolchains"),
			"toolchain entry needs an id")
	case seen[raw.ID]:
		check.failf(finding.CatalogDuplicateID, lineAt(positions, prefix+".id", prefix, "toolchains"),
			"duplicate toolchain id %q", raw.ID)
	default:
		seen[raw.ID] = true
		entry.ID = raw.ID
	}
	switch Kind(raw.Kind) {
	case KindLanguage, KindValidator, KindService:
		entry.Kind = Kind(raw.Kind)
	default:
		check.failf(finding.CatalogInvalidKind, lineAt(positions, prefix+".kind", prefix),
			"kind %q must be language, validator, or service", raw.Kind)
	}
	entry.Version = raw.Version
	if !digestPattern.MatchString(raw.Image) {
		check.failf(finding.CatalogUnpinnedImage, lineAt(positions, prefix+".image", prefix),
			"image %q must be pinned as repository:tag@sha256:<digest>", raw.Image)
	} else {
		entry.Image = raw.Image
	}
	entry.Env = raw.Env
	entry.Install = Install{
		Lockfiles: append([]string(nil), raw.Install.Lockfiles...),
		Command:   append([]string(nil), raw.Install.Command...),
		Env:       raw.Install.Env,
	}
	entry.Build = raw.Build
	if !platformPattern.MatchString(raw.Platform) && raw.Platform != "" {
		check.failf(finding.CatalogInvalidType, lineAt(positions, prefix+".platform", prefix),
			"platform %q must be an operating-system and architecture pair such as linux/amd64", raw.Platform)
	} else {
		entry.Platform = raw.Platform
	}
	entry.Ready = append([]string(nil), raw.Ready...)
	entry.Connect = raw.Connect
	if entry.Kind == KindService {
		check.checkService(raw, positions, prefix, &entry)
	} else if raw.ReadyTimeout != "" {
		check.failf(finding.CatalogInvalidTimeout, lineAt(positions, prefix+".readyTimeout", prefix),
			"only services carry a readiness timeout")
	}
	return entry
}

// checkService checks the service readiness recipe and timeout.
func (check *checker) checkService(raw *toolchainYAML, positions map[string]int, prefix string, entry *Toolchain) {
	if len(raw.Ready) == 0 || len(raw.Connect) == 0 {
		check.failf(finding.CatalogInvalidService, lineAt(positions, prefix+".id", prefix),
			"service %q needs a ready recipe and connect variables", raw.ID)
	}
	timeout := raw.ReadyTimeout
	if timeout == "" {
		timeout = defaultReadyTimeout
	}
	parsed, err := time.ParseDuration(timeout)
	if err != nil || parsed <= 0 || parsed > maxReadyTimeout {
		check.failf(finding.CatalogInvalidTimeout, lineAt(positions, prefix+".readyTimeout", prefix),
			"readyTimeout %q must be above zero and at most 120s", raw.ReadyTimeout)
		return
	}
	entry.ReadyTimeout = timeout
}
