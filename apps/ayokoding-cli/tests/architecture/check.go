package architecture

import (
	"fmt"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"strings"
)

// importRule forbids a set of imports on every path it applies to. The reason
// is one line, and every violation message carries it.
type importRule struct {
	name    string
	reason  string
	applies func(string) bool
	denies  []string
}

// modulePath is the module every rule names for internal imports.
const modulePath = "github.com/wahidyankf/ose-public/apps/ayokoding-cli"

// under reports whether a virtual path sits below one of the prefixes.
func under(prefixes ...string) func(string) bool {
	return func(path string) bool {
		for _, prefix := range prefixes {
			if strings.HasPrefix(path, prefix) {
				return true
			}
		}
		return false
	}
}

// outside reports whether a virtual path sits below none of the prefixes.
func outside(prefixes ...string) func(string) bool {
	inside := under(prefixes...)
	return func(path string) bool {
		return !inside(path)
	}
}

// importRules holds the parity row 21 production import rules.
var importRules = []importRule{
	{
		name:    "domain-purity",
		reason:  "domain decisions read course files only through an fs.FS value.",
		applies: under("internal/domain/"),
		denies: []string{
			"os",
			"os/exec",
			"net",
			"syscall",
			"github.com/spf13/cobra",
		},
	},
	{
		name:    "cobra-scope",
		reason:  "only the CLI adapter parses flags and renders output.",
		applies: outside("internal/adapters/cli/"),
		denies:  []string{"github.com/spf13/cobra"},
	},
	{
		name:    "exec-scope",
		reason:  "only the container and git adapters supervise child processes.",
		applies: outside("internal/adapters/containers/", "internal/adapters/git/"),
		denies:  []string{"os/exec"},
	},
	{
		name:    "yaml-scope",
		reason:  "only the run-spec and catalog models decode YAML.",
		applies: outside("internal/domain/runspec/", "internal/domain/catalog/"),
		denies:  []string{"go.yaml.in/yaml/v3"},
	},
	{
		name:    "bootstrap-wiring",
		reason:  "bootstrap is imported only by the command entry point.",
		applies: outside("cmd/"),
		denies:  []string{modulePath + "/internal/bootstrap"},
	},
}

// FileImports parses one Go source file in imports-only mode and returns its
// import paths.
func FileImports(source []byte) ([]string, error) {
	parsed, err := parser.ParseFile(token.NewFileSet(), "", source, parser.ImportsOnly)
	if err != nil {
		return nil, fmt.Errorf("architecture: parse imports: %w", err)
	}
	imports := make([]string, 0, len(parsed.Imports))
	for _, spec := range parsed.Imports {
		imports = append(imports, strings.Trim(spec.Path.Value, `"`))
	}
	return imports, nil
}

// Violations reports every rule the given virtual path breaks. A virtual path
// uses forward slashes relative to the module root, so fixtures under
// testdata can stand in for real files.
func Violations(virtualPath string, imports []string) []string {
	var found []string
	for _, rule := range importRules {
		if !rule.applies(virtualPath) {
			continue
		}
		for _, denied := range rule.denies {
			for _, held := range imports {
				if held == denied {
					found = append(found, "rule "+rule.name+" forbids import "+
						denied+" in "+virtualPath+": "+rule.reason)
				}
			}
		}
	}
	return found
}

// ProductionFiles walks the production roots and returns every non-test Go
// file with its module-relative virtual path.
func ProductionFiles(root string) (map[string]string, error) {
	files := map[string]string{}
	for _, dir := range []string{"cmd", "internal"} {
		walkErr := filepath.Walk(filepath.Join(root, dir), func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return fmt.Errorf("architecture: walk production tree: %w", err)
			}
			if info.IsDir() || !strings.HasSuffix(path, ".go") || strings.HasSuffix(path, "_test.go") {
				return nil
			}
			virtual, relErr := filepath.Rel(root, path)
			if relErr != nil {
				return fmt.Errorf("architecture: relativize production path: %w", relErr)
			}
			files[filepath.ToSlash(virtual)] = path
			return nil
		})
		if walkErr != nil {
			return nil, fmt.Errorf("architecture: walk production tree: %w", walkErr)
		}
	}
	return files, nil
}
