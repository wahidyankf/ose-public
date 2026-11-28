package web

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path"
	"strconv"
	"strings"
)

// Default ports owned by this app.
const (
	DefaultPort = 3102
	TestPort    = 3191
)

// Supported locales served under /{locale}.
var supportedLocales = map[string]bool{"en": true, "id": true}

// Fixture modes accepted by the launcher.
const (
	FixtureParity             = "parity"
	FixtureUnavailableCatalog = "unavailable-catalog"
)

// Config is the validated runtime configuration. Fixture is empty when no
// fixture is selected, and the launcher then serves the real corpus.
type Config struct {
	Port    int
	Fixture string
}

// errInvalidPort reports a malformed listener override.
type errInvalidPort struct {
	source string
	value  string
}

func (e *errInvalidPort) Error() string {
	return fmt.Sprintf("invalid %s %q: want integer 1-65535", e.source, e.value)
}

// parsePort validates one port override naming its source in diagnostics.
func parsePort(source, value string) (int, error) {
	port, err := strconv.Atoi(strings.TrimSpace(value))
	if err != nil || port < 1 || port > 65535 {
		return 0, &errInvalidPort{source: source, value: value}
	}
	return port, nil
}

// Environment reads one launcher variable. The binary passes OSEnvironment;
// unit tests and the BDD glue pass a recorded map, so no process state moves.
type Environment func(key string) (string, bool)

// noEnvironment reports every launcher variable as unset.
func noEnvironment(string) (string, bool) { return "", false }

// OSEnvironment is the only process-state boundary in this package. It
// snapshots every launcher variable the binary honors with static
// os.LookupEnv reads, then serves the snapshot through the Environment seam
// so ResolveConfig and the seed keep reading injected values under test.
func OSEnvironment() Environment {
	values := make(map[string]string, 5)
	if value, ok := os.LookupEnv("AYOKODING_WEB_PORT"); ok {
		values["AYOKODING_WEB_PORT"] = value
	}
	if value, ok := os.LookupEnv("AYOKODING_WEB_CONTENT_DIR"); ok {
		values["AYOKODING_WEB_CONTENT_DIR"] = value
	}
	if value, ok := os.LookupEnv("AYOKODING_WEB_MANIFESTS_DIR"); ok {
		values["AYOKODING_WEB_MANIFESTS_DIR"] = value
	}
	if value, ok := os.LookupEnv("AYOKODING_WEB_SHOW_DRAFTS"); ok {
		values["AYOKODING_WEB_SHOW_DRAFTS"] = value
	}
	if value, ok := os.LookupEnv("AYOKODING_WEB_FIXTURE"); ok {
		values["AYOKODING_WEB_FIXTURE"] = value
	}
	return func(key string) (string, bool) {
		value, ok := values[key]
		return value, ok
	}
}

// ResolveConfig resolves an explicit --port flag, then AYOKODING_WEB_PORT,
// then 3102. Bare PORT is ignored by repository convention. --fixture, then
// AYOKODING_WEB_FIXTURE, selects a canned corpus variant for test and authoring
// fixtures; with neither set, no fixture is selected and the real corpus serves.
// The environment is injected so the resolution reads no process state under test.
func ResolveConfig(args []string, environment Environment) (Config, error) {
	cfg := Config{Port: DefaultPort}
	flagPort := ""
	flagFixture := ""
	for index := 0; index < len(args); index++ {
		argument := args[index]
		name, value, hasValue := strings.Cut(argument, "=")
		takeNext := func() (string, error) {
			if hasValue {
				return value, nil
			}
			index++
			if index >= len(args) {
				return "", fmt.Errorf("flag %s requires a value", name)
			}
			return args[index], nil
		}
		var err error
		switch name {
		case "--port":
			if flagPort, err = takeNext(); err != nil {
				return Config{}, err
			}
		case "--fixture":
			if flagFixture, err = takeNext(); err != nil {
				return Config{}, err
			}
		default:
			return Config{}, fmt.Errorf("unknown flag %q", argument)
		}
	}
	if flagPort != "" {
		port, err := parsePort("--port", flagPort)
		if err != nil {
			return Config{}, err
		}
		cfg.Port = port
	} else if value, ok := environment("AYOKODING_WEB_PORT"); ok {
		port, err := parsePort("AYOKODING_WEB_PORT", value)
		if err != nil {
			return Config{}, err
		}
		cfg.Port = port
	}
	fixture := flagFixture
	if fixture == "" {
		if value, ok := environment("AYOKODING_WEB_FIXTURE"); ok {
			fixture = value
		}
	}
	if fixture != "" {
		switch fixture {
		case FixtureParity, FixtureUnavailableCatalog:
			cfg.Fixture = fixture
		default:
			return Config{}, fmt.Errorf("unknown --fixture %q: want parity or unavailable-catalog", fixture)
		}
	}
	return cfg, nil
}

// IsSupportedLocale reports whether locale has translated routes.
func IsSupportedLocale(locale string) bool {
	return supportedLocales[locale]
}

// repoMarker names the repository root: the nearest ancestor of the working
// directory that holds it.
const repoMarker = "repo-config.yml"

// contentCandidates and manifestsCandidates list the default roots relative to
// the repository root. The first existing candidate wins, so a move of the
// content into apps/ayokoding-web needs no code change.
var (
	contentCandidates   = []string{"apps/ayokoding-web/content", "apps/ayokoding-www/content"}
	manifestsCandidates = []string{"apps/ayokoding-web/manifests", "apps/ayokoding-www/src/features/course-paths/manifests"}
)

// Corpus names the two source roots a default start reads.
type Corpus struct {
	ContentDir   string
	ManifestsDir string
}

// ResolveCorpus resolves both default source roots. Each root is the variable
// the launcher names when it is set, else the first existing default candidate
// under the nearest repository root. Either root must be readable, or startup
// is refused.
func ResolveCorpus(sources Sources) (Corpus, error) {
	content, err := resolveSourceRoot(sources, envContentDir, contentCandidates)
	if err != nil {
		return Corpus{}, err
	}
	manifests, err := resolveSourceRoot(sources, envManifestsDir, manifestsCandidates)
	if err != nil {
		return Corpus{}, err
	}
	return Corpus{ContentDir: content, ManifestsDir: manifests}, nil
}

// resolveSourceRoot is the single place-specific path check behind the default
// corpus. It returns the root the variable names when that is set. Otherwise it
// walks up from the working directory to the repository marker, then takes the
// first candidate that exists under it. Every root it returns must be readable.
func resolveSourceRoot(sources Sources, variable string, candidates []string) (string, error) {
	readable := func(dir string) (string, error) {
		if _, err := fs.ReadDir(sources.Root(dir), "."); err != nil {
			return "", fmt.Errorf("%s root %q cannot be read: %w", variable, dir, err)
		}
		return dir, nil
	}
	if named := explicitRoot(sources, variable); named != "" {
		return readable(named)
	}
	if sources.Working == "" {
		return "", fmt.Errorf("%s is unset and no default root can be found: the working directory is unknown", variable)
	}
	repo := ""
	for dir := sources.Working; repo == ""; dir = path.Dir(dir) {
		if _, err := fs.Stat(sources.Root(dir), repoMarker); err == nil {
			repo = dir
		} else if path.Dir(dir) == dir {
			return "", fmt.Errorf("%s is unset and no default root can be found: no %s holds or contains %s", variable, repoMarker, sources.Working)
		}
	}
	for _, relative := range candidates {
		dir := path.Join(repo, relative)
		if info, err := fs.Stat(sources.Root(dir), "."); err == nil && info.IsDir() {
			return readable(dir)
		}
	}
	return "", fmt.Errorf("%s is unset and no default root exists under %s (tried %s)", variable, repo, strings.Join(candidates, ", "))
}

var errNoRedirect = errors.New("no redirect")

// CanonicalRedirect maps legacy inventory paths to canonical destinations.
func CanonicalRedirect(redirects map[string]string, path string) (string, error) {
	if destination, ok := redirects[path]; ok {
		return destination, nil
	}
	return "", errNoRedirect
}
