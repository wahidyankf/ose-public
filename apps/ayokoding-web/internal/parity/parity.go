// Package parity builds the inventory of URLs the old ayokoding site serves and
// reports which of them the new app answers. It is the owner's parity tooling,
// run through cmd/parity. Every file and network read goes through a Host, so
// the logic runs over in-memory doubles in unit tests.
package parity

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// Reply is what one request to the new app answered: its status and, for a
// redirect, the target it names. A redirect is recorded, never followed.
type Reply struct {
	Status   int
	Location string
}

// Host is the process surface Run touches: the working directory, read-only
// trees, file reads and writes, one HTTP probe, and the two output streams.
// OSHost wires the operating system; unit tests supply doubles.
type Host struct {
	Working   string
	Sub       func(dir string) fs.FS
	ReadFile  func(name string) ([]byte, error)
	WriteFile func(name string, data []byte, perm fs.FileMode) error
	Fetch     func(url string) (Reply, error)
	Stdout    io.Writer
	Stderr    io.Writer
}

// probeTimeout bounds one request. Requests are never retried.
const probeTimeout = 30 * time.Second

// OSHost returns the real process surface. It is the only operating-system
// wiring of the Host, and cmd/parity calls it.
func OSHost() Host {
	// Without a working directory no relative path can resolve, so the process
	// fails loudly here rather than reporting a misleading repository error.
	working, err := os.Getwd()
	if err != nil {
		panic(fmt.Sprintf("parity: cannot read the working directory: %v", err))
	}
	return Host{
		Working:   working,
		Sub:       os.DirFS,
		ReadFile:  os.ReadFile,
		WriteFile: os.WriteFile,
		Fetch:     newFetch(&http.Client{CheckRedirect: noFollow, Timeout: probeTimeout}),
		Stdout:    os.Stdout,
		Stderr:    os.Stderr,
	}
}

const usage = `usage: parity <inventory|gap-report> [flags]
  inventory   --sitemap FILE --source-revision REV [--routes DIR] [--export FILE] [--out FILE]
  gap-report  --inventory FILE --base-url URL`

// Run executes one subcommand and returns the process exit code. It is the
// whole behaviour of cmd/parity, so the godog suites can drive it with doubles.
// Usage errors exit 2; unreadable or malformed input exits 1.
func Run(args []string, process Host) int {
	if len(args) == 0 {
		_, _ = fmt.Fprintln(process.Stderr, usage)
		return 2
	}
	switch args[0] {
	case "inventory":
		return runInventory(args[1:], process)
	case "gap-report":
		return runGapReport(args[1:], process)
	default:
		_, _ = fmt.Fprintf(process.Stderr, "parity: unknown subcommand %q\n%s\n", args[0], usage)
		return 2
	}
}

func runInventory(args []string, process Host) int {
	flags := flag.NewFlagSet("inventory", flag.ContinueOnError)
	flags.SetOutput(process.Stderr)
	sitemap := flags.String("sitemap", "", "the old site's saved /sitemap.xml (required)")
	revision := flags.String("source-revision", "", "the old app's git revision recorded in the inventory (required)")
	routes := flags.String("routes", "apps/ayokoding-www/src/app", "the old app's route tree")
	export := flags.String("export", "apps/ayokoding-web/internal/web/testdata/www-redirects.json", "the committed redirect export")
	out := flags.String("out", "", "write the inventory to this file instead of stdout")
	if err := flags.Parse(args); err != nil {
		return usageExit(err)
	}
	if *sitemap == "" || *revision == "" {
		_, _ = fmt.Fprintln(process.Stderr, "parity inventory: --sitemap and --source-revision are required")
		flags.Usage()
		return 2
	}
	root, err := repoRoot(process)
	if err != nil {
		return reportError(process, err)
	}
	inputs, err := readInventoryInputs(process, root, *sitemap, *export)
	if err != nil {
		return reportError(process, err)
	}
	patterns, err := expandRoutes(process, root, *routes)
	if err != nil {
		return reportError(process, err)
	}
	inventory, err := BuildInventory(inputs.sitemap, inputs.export, patterns, *revision)
	if err != nil {
		return reportError(process, err)
	}
	if err := emitInventory(process, root, *out, encodeInventory(inventory)); err != nil {
		return reportError(process, err)
	}
	return 0
}

// inventoryInputs holds the two files the inventory is built from.
type inventoryInputs struct {
	sitemap []byte
	export  []byte
}

// readInventoryInputs reads the saved sitemap and the committed redirect export.
func readInventoryInputs(process Host, root, sitemap, export string) (inventoryInputs, error) {
	sitemapData, err := process.ReadFile(resolve(root, sitemap))
	if err != nil {
		return inventoryInputs{}, err
	}
	exportData, err := process.ReadFile(resolve(root, export))
	if err != nil {
		return inventoryInputs{}, err
	}
	return inventoryInputs{sitemap: sitemapData, export: exportData}, nil
}

// expandRoutes lists the route patterns of the old app's route tree.
func expandRoutes(process Host, root, routes string) ([]string, error) {
	return RoutePatterns(process.Sub(resolve(root, routes)))
}

// encodeInventory renders the inventory as indented JSON with a final newline.
// Inventory holds only strings and integers, so a marshal failure would be a
// programming error; it fails loudly rather than writing an empty inventory.
func encodeInventory(inventory Inventory) []byte {
	data, err := json.MarshalIndent(inventory, "", "  ")
	if err != nil {
		panic(fmt.Sprintf("parity: marshal inventory: %v", err))
	}
	return append(data, '\n')
}

// emitInventory writes the encoded inventory to stdout, or to the out file
// resolved against the repository root.
func emitInventory(process Host, root, out string, data []byte) error {
	if out == "" {
		_, err := process.Stdout.Write(data)
		return err
	}
	return process.WriteFile(resolve(root, out), data, 0o644)
}

func runGapReport(args []string, process Host) int {
	flags := flag.NewFlagSet("gap-report", flag.ContinueOnError)
	flags.SetOutput(process.Stderr)
	inventoryFile := flags.String("inventory", "", "the committed inventory file (required)")
	baseURL := flags.String("base-url", "", "the origin of the new app, for example http://127.0.0.1:3102 (required)")
	if err := flags.Parse(args); err != nil {
		return usageExit(err)
	}
	if *inventoryFile == "" || *baseURL == "" {
		_, _ = fmt.Fprintln(process.Stderr, "parity gap-report: --inventory and --base-url are required")
		flags.Usage()
		return 2
	}
	root, err := repoRoot(process)
	if err != nil {
		return reportError(process, err)
	}
	data, err := process.ReadFile(resolve(root, *inventoryFile))
	if err != nil {
		return reportError(process, err)
	}
	var inventory Inventory
	if err := json.Unmarshal(data, &inventory); err != nil {
		return reportError(process, fmt.Errorf("inventory %s: %w", *inventoryFile, err))
	}
	results, err := GapReport(inventory, strings.TrimSuffix(*baseURL, "/"), process.Fetch)
	if err != nil {
		return reportError(process, err)
	}
	if _, err := io.WriteString(process.Stdout, RenderGapReport(results)); err != nil {
		return reportError(process, err)
	}
	return 0
}

// usageExit maps a flag-parsing failure to its exit code. The flag package has
// already printed the problem, and -h is a successful request for help.
func usageExit(err error) int {
	if errors.Is(err, flag.ErrHelp) {
		return 0
	}
	return 2
}

func reportError(process Host, err error) int {
	_, _ = fmt.Fprintf(process.Stderr, "parity: %v\n", err)
	return 1
}

// repoRoot walks up from the working directory to the nearest directory that
// holds repo-config.yml, so every relative flag resolves against the repository.
func repoRoot(process Host) (string, error) {
	dir := process.Working
	for {
		if _, err := fs.Stat(process.Sub(dir), "repo-config.yml"); err == nil {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", fmt.Errorf("no repo-config.yml at or above %s", process.Working)
		}
		dir = parent
	}
}

// resolve places a relative path under the repository root and keeps an
// absolute path as it is.
func resolve(root, name string) string {
	if filepath.IsAbs(name) {
		return name
	}
	return filepath.Join(root, name)
}
